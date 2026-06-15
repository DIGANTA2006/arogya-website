import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { createPrescription } from "@/lib/prescription-store";
import {
  getPrescriptionVisitByToken,
  markPrescriptionVisitUploaded,
} from "@/lib/prescription-visit-store";

export async function POST(request: Request) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const token = String(
      formData.get("uploadToken") ||
        formData.get("token") ||
        formData.get("qrToken") ||
        ""
    ).trim();

    const submittedTitle = String(formData.get("title") || "").trim();
    const nextTherapyDate = String(formData.get("nextTherapyDate") || "").trim();
    const nextAppointmentDate = String(formData.get("nextAppointmentDate") || "").trim();
    const file = formData.get("file");

    if (!token) {
      return NextResponse.json({ error: "QR upload token is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Scanned PDF/image file is required." }, { status: 400 });
    }

    const visit = await getPrescriptionVisitByToken(token);

    if (!visit) {
      return NextResponse.json({ error: "Invalid or expired prescription QR token." }, { status: 404 });
    }

    if (visit.status === "cancelled") {
      return NextResponse.json({ error: "This prescription visit was cancelled." }, { status: 400 });
    }

    const autoTitle =
      submittedTitle ||
      `${visit.appointmentType || "Clinic"} Prescription - ${visit.rxNumber}`;

    const prescription = await createPrescription({
      patientEmail: visit.patientEmail,
      appointmentId: visit.appointmentId,
      title: autoTitle,
      file,
      nextTherapyDate,
      nextAppointmentDate,
    });

    const updatedVisit = await markPrescriptionVisitUploaded(visit.id, {
      prescriptionId: prescription.id,
      secureToken: prescription.secureToken,
    });

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
      prescription,
      securePage: `/prescription/${prescription.secureToken}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Scanned prescription upload failed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}