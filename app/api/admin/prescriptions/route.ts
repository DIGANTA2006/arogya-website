import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { createPrescription, getPrescriptions } from "@/lib/prescription-store";
import { hasPortalRole } from "@/lib/portal-auth";
export async function GET() {
  const allowed = await hasPortalRole("admin");
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const prescriptions = await getPrescriptions();
  return NextResponse.json({ prescriptions });
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const allowed = await hasPortalRole("admin");
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const patientEmail = String(formData.get("patientEmail") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "Prescription").trim();
  const appointmentId = String(formData.get("appointmentId") || "").trim();
  const nextTherapyDate = String(formData.get("nextTherapyDate") || "").trim();
  const nextAppointmentDate = String(formData.get("nextAppointmentDate") || "").trim();

  if (!patientEmail || !(file instanceof File)) {
    return NextResponse.json({ error: "Patient email and PDF file are required." }, { status: 400 });
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
}

