import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addAppointment, getAppointments } from "@/lib/appointment-store";
import { hasPortalRole } from "@/lib/portal-auth";
import { findPatientByEmail } from "@/lib/patient-store";
import { sendAppointmentEmails } from "@/lib/appointment-email";

type Body = {
  age?: string;
  phone?: string;
  service?: string;
  appointmentType?: string;
  date?: string;
  time?: string;
  message?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

export async function GET() {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("portal_email")?.value || "";

  const appointments = await getAppointments();

  return NextResponse.json({
    appointments: appointments.filter(
      (appointment) =>
        appointment.email.toLowerCase() === email.toLowerCase()
    ),
  });
}

export async function POST(request: Request) {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const email = cookieStore.get("portal_email")?.value || "";
  const nameFromCookie = cookieStore.get("portal_name")?.value || "Patient";

  const patient = await findPatientByEmail(email);

  if (patient && !patient.mobileVerified) {
    return NextResponse.json(
      { error: "Please verify your mobile number before booking appointment." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as Body;

  const age = clean(body.age || patient?.age || "");
  const phone = clean(body.phone || patient?.phone || "");
  const service = clean(body.service);
  const appointmentType = clean(body.appointmentType || "Clinic Visit");
  const date = clean(body.date);
  const time = clean(body.time);
  const message = clean(body.message);

  if (!service || !date || !time || !phone) {
    return NextResponse.json(
      { error: "Service, phone, date and time are required." },
      { status: 400 }
    );
  }

  const appointment = await addAppointment({
    name: patient?.name || nameFromCookie,
    age,
    phone,
    email,
    service,
    appointmentType,
    date,
    time,
    message,
  });

  await sendAppointmentEmails({
    patientName: appointment.name,
    patientEmail: appointment.email,
    patientPhone: appointment.phone,
    age: appointment.age,
    service: appointment.service,
    appointmentType: appointment.appointmentType,
    date: appointment.date,
    time: appointment.time,
    message: appointment.message,
  });

  return NextResponse.json({
    success: true,
    appointment,
    message: "Appointment booked successfully. Confirmation email has been sent.",
  });
}

