import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppointments } from "@/lib/appointment-store";
import {
  buildSecureOnlineMeetingUrl,
  isMeetingWindowOpen,
  isOnlineAppointmentType,
} from "@/lib/consultation-flow";
import { getPaymentByAppointmentForPatient } from "@/lib/payment-store";
import { hasPortalRole } from "@/lib/portal-auth";

export const runtime = "nodejs";

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await context.params;

  const isAdmin = await hasPortalRole("admin");
  const isClient = await hasPortalRole("client");

  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const appointments = await getAppointments();
  const appointment = appointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  if (!isOnlineAppointmentType(appointment.appointmentType)) {
    return NextResponse.json(
      { error: "Meeting link is available only for online appointments." },
      { status: 400 }
    );
  }

  if (appointment.status === "Cancelled" || appointment.status === "Completed") {
    return NextResponse.json(
      { error: "This consultation is closed." },
      { status: 403 }
    );
  }

  if (!isMeetingWindowOpen({ date: appointment.date, time: appointment.time })) {
    return NextResponse.json(
      {
        error:
          "Meeting is closed or not open yet. It opens 30 minutes before appointment time and closes after the consultation window.",
      },
      { status: 403 }
    );
  }

  if (isClient) {
    const cookieStore = await cookies();
    const clientEmail = cleanEmail(cookieStore.get("portal_email")?.value || "");

    if (!clientEmail || cleanEmail(appointment.email) !== clientEmail) {
      return NextResponse.json(
        { error: "This appointment does not belong to your account." },
        { status: 403 }
      );
    }
  }

  const payment = await getPaymentByAppointmentForPatient({
    appointmentId: appointment.id,
    patientEmail: appointment.email,
  });

  if (payment?.status !== "paid") {
    return NextResponse.json(
      {
        error:
          "Online meeting is locked until the clinic marks this payment as Paid.",
      },
      { status: 403 }
    );
  }

  return NextResponse.redirect(buildSecureOnlineMeetingUrl(appointment.id), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
