import { NextResponse } from "next/server";
import { UploadValidationError } from "@/lib/file-validation";
import { isValidEmail, normalizeEmail } from "@/lib/input-validation";
import { createPrescription, getPrescriptions } from "@/lib/prescription-store";
import { hasPortalRole } from "@/lib/portal-auth";
import { assertSameOrigin } from "@/lib/request-guard";
import { findPatientByEmail } from "@/lib/patient-store";

export async function GET() {
  const allowed = await hasPortalRole("admin");
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const prescriptions = await getPrescriptions();
  return NextResponse.json({ prescriptions });
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const allowed = await hasPortalRole("admin");
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > 21 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Prescription upload is too large." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const patientEmail = normalizeEmail(formData.get("patientEmail"));
    const title = String(formData.get("title") || "Prescription").trim();
    const appointmentId = String(formData.get("appointmentId") || "").trim();
    const nextTherapyDate = String(formData.get("nextTherapyDate") || "").trim();
    const nextAppointmentDate = String(formData.get("nextAppointmentDate") || "").trim();

    if (!isValidEmail(patientEmail) || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Valid patient email and prescription file are required." },
        { status: 400 }
      );
    }

    const patient = await findPatientByEmail(patientEmail);

    if (!patient) {
      return NextResponse.json(
        { error: "Patient account not found. Create or link the patient first." },
        { status: 404 }
      );
    }

    const prescription = await createPrescription({
      patientEmail,
      title,
      appointmentId,
      nextTherapyDate,
      nextAppointmentDate,
      file,
    });

    return NextResponse.json({ success: true, prescription });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Prescription upload failed.";
    const inputError =
      error instanceof UploadValidationError ||
      /invalid|too (?:large|long)|cannot be in the past|must be/i.test(message);

    return NextResponse.json(
      {
        error: message,
      },
      { status: inputError ? 400 : 500 }
    );
  }
}
