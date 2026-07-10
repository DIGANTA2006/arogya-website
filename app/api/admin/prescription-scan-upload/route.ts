import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  createPrescription,
  deletePrescriptionById,
} from "@/lib/prescription-store";
import {
  getPrescriptionVisitByToken,
  markPrescriptionVisitUploaded,
} from "@/lib/prescription-visit-store";
import {
  getPrescriptionVisitExpiryMessage,
  isPrescriptionVisitUploadExpired,
} from "@/lib/rx-reliability";
import { UploadValidationError } from "@/lib/file-validation";

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function hasAllowedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function validateUploadFile(file: File) {
  if (!(file instanceof File)) {
    return "Scanned PDF/image file is required.";
  }

  if (file.size <= 0) {
    return "Uploaded file is empty.";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "File is too large. Maximum allowed size is 20 MB.";
  }

  const mimeType = String(file.type || "").toLowerCase();
  const fileName = String(file.name || "").toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !hasAllowedExtension(fileName)) {
    return "Only PDF, JPG, PNG, and WEBP prescription files are allowed.";
  }

  return "";
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > 21 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Prescription upload is too large." },
        { status: 413 }
      );
    }

    const formData = await request.formData();

    const token = clean(
      formData.get("uploadToken") ||
        formData.get("token") ||
        formData.get("qrToken") ||
        ""
    );

    const submittedTitle = clean(formData.get("title"));
    const forceReplace = clean(formData.get("forceReplace")) === "true";
    const nextTherapyDate = clean(formData.get("nextTherapyDate"));
    const nextAppointmentDate = clean(formData.get("nextAppointmentDate"));
    const file = formData.get("file");

    if (!token) {
      return NextResponse.json(
        { error: "QR upload token is required." },
        { status: 400 }
      );
    }

    if (token.length > 160) {
      return NextResponse.json(
        { error: "Invalid QR upload token." },
        { status: 400 }
      );
    }

    if (submittedTitle.length > 160) {
      return NextResponse.json(
        { error: "Prescription title is too long." },
        { status: 400 }
      );
    }

    const fileError = validateUploadFile(file as File);

    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const visit = await getPrescriptionVisitByToken(token);

    if (!visit) {
      return NextResponse.json(
        { error: "Invalid or expired prescription QR token." },
        { status: 404 }
      );
    }

    if (visit.status === "cancelled") {
      return NextResponse.json(
        { error: "This prescription visit was cancelled." },
        { status: 400 }
      );
    }
    if (isPrescriptionVisitUploadExpired(visit)) {
      return NextResponse.json(
        { error: getPrescriptionVisitExpiryMessage(visit) },
        { status: 400 }
      );
    }

    if (visit.uploadedPrescriptionId && !forceReplace) {
      return NextResponse.json(
        {
          error:
            "A prescription is already uploaded for this RX. Confirm replacement before uploading again.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const autoTitle =
      submittedTitle ||
      `${visit.appointmentType || "Clinic"} Prescription - ${visit.rxNumber}`;

    const prescription = await createPrescription({
      patientEmail: visit.patientEmail,
      appointmentId: visit.appointmentId,
      title: autoTitle,
      file: file as File,
      nextTherapyDate,
      nextAppointmentDate,
    });

    let updatedVisit;

    try {
      updatedVisit = await markPrescriptionVisitUploaded(visit.id, {
        prescriptionId: prescription.id,
        secureToken: prescription.secureToken,
      });
    } catch (error) {
      await deletePrescriptionById(prescription.id).catch(() => undefined);
      throw error;
    }

    if (visit.uploadedPrescriptionId) {
      await deletePrescriptionById(visit.uploadedPrescriptionId).catch((error) => {
        console.error("[scanner-upload] Could not remove superseded prescription.", error);
      });
    }

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
      prescription,
      securePage: `/prescription/${prescription.secureToken}`,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const inputError =
      error instanceof UploadValidationError ||
      /invalid|too (?:large|long)|cannot be in the past|must be/i.test(detail);

    return NextResponse.json(
      {
        error: "Scanned prescription upload failed.",
        detail,
      },
      { status: inputError ? 400 : 500 }
    );
  }
}