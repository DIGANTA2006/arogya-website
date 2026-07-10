import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getPrescriptions } from "@/lib/prescription-store";

export async function GET() {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("portal_email")?.value || "";

  const prescriptions = await getPrescriptions(email);

  const formatted = prescriptions.map((item) => ({
    id: item.id,
    appointmentId: item.appointmentId,
    appointment_id: item.appointmentId,
    title: item.title,
    createdAt: item.createdAt,
    created_at: item.createdAt,
    nextTherapyDate: item.nextTherapyDate,
    next_therapy_date: item.nextTherapyDate,
    nextAppointmentDate: item.nextAppointmentDate,
    next_appointment_date: item.nextAppointmentDate,
    downloadUrl: `/api/prescription/${item.secureToken}/download`,
    download_url: `/api/prescription/${item.secureToken}/download`,
    securePageUrl: `/prescription/${item.secureToken}`,
    secure_page_url: `/prescription/${item.secureToken}`,
    qrUrl: `/prescription/${item.secureToken}`,
    qr_url: `/prescription/${item.secureToken}`,
    qrImageUrl: `/api/prescription/${item.secureToken}/qr`,
    qr_image_url: `/api/prescription/${item.secureToken}/qr`,
    status: "Uploaded",
    source: item.appointmentId ? "Clinic scanner / appointment linked" : "Clinic upload",
  }));

  return NextResponse.json({ prescriptions: formatted });
}