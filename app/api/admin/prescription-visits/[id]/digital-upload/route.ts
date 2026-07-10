import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  createPrescription,
  deletePrescriptionById,
} from "@/lib/prescription-store";
import {
  getPrescriptionVisitById,
  markPrescriptionVisitUploaded,
} from "@/lib/prescription-visit-store";
import {
  getPrescriptionVisitExpiryMessage,
  isPrescriptionVisitUploadExpired,
} from "@/lib/rx-reliability";
import { UploadValidationError } from "@/lib/file-validation";

type Body = {
  imageData?: string;
  nextTherapyDate?: string;
  nextAppointmentDate?: string;
  forceReplace?: boolean;
};

function clean(value?: string) {
  return String(value || "").trim();
}

function parsePngDataUrl(dataUrl: string) {
  if (dataUrl.length > 28 * 1024 * 1024) {
    throw new Error("Digital prescription is too large.");
  }

  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);

  if (!match?.[1]) {
    throw new Error("Invalid prescription image data.");
  }

  return Buffer.from(match[1], "base64");
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
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

    if (contentLength > 28 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Digital prescription is too large." },
        { status: 413 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as Body;

    const visit = await getPrescriptionVisitById(id);

    if (!visit) {
      return NextResponse.json(
        { error: "Prescription visit not found." },
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

    if (visit.uploadedPrescriptionId && !body.forceReplace) {
      return NextResponse.json(
        {
          error:
            "A prescription is already uploaded for this RX. Confirm replacement before saving again.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const imageData = clean(body.imageData);

    if (!imageData) {
      return NextResponse.json(
        { error: "Digital prescription image is required." },
        { status: 400 }
      );
    }

    const imageBuffer = parsePngDataUrl(imageData);

    if (imageBuffer.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Digital prescription is too large." },
        { status: 400 }
      );
    }

    const file = new File(
      [imageBuffer],
      `${visit.rxNumber}-digital-prescription.png`,
      {
        type: "image/png",
      }
    );

    const prescription = await createPrescription({
      patientEmail: visit.patientEmail,
      appointmentId: visit.appointmentId,
      title: `${visit.appointmentType || "Clinic"} Digital Prescription - ${visit.rxNumber}`,
      file,
      nextTherapyDate: clean(body.nextTherapyDate),
      nextAppointmentDate: clean(body.nextAppointmentDate),
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
        console.error("[digital-upload] Could not remove superseded prescription.", error);
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
        error: "Digital prescription upload failed.",
        detail,
      },
      { status: inputError ? 400 : 500 }
    );
  }
}