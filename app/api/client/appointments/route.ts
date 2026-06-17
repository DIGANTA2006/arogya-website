import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  normalizeTime,
  validateAppointmentSlot,
} from "@/lib/appointment-slots";
import { addAppointment, getAppointments } from "@/lib/appointment-store";
import { sendAppointmentEmails } from "@/lib/appointment-email";
import {
  buildOnlineConsultationLink,
  isOnlineAppointment,
} from "@/lib/meeting-link";
import { findPatientByEmail } from "@/lib/patient-store";
import { createPrescriptionVisit } from "@/lib/prescription-visit-store";
import { hasPortalRole } from "@/lib/portal-auth";
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
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const allowed = await hasPortalRole("client");

    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const email = cookieStore.get("portal_email")?.value || "";
    const nameFromCookie = cookieStore.get("portal_name")?.value || "Patient";

    if (!email) {
      return NextResponse.json(
        { error: "Patient email is missing. Please login again." },
        { status: 401 }
      );
    }

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
    const time = normalizeTime(clean(body.time));
    const message = clean(body.message);

    if (!service || !date || !time || !phone) {
      return NextResponse.json(
        { error: "Service, phone, date and time are required." },
        { status: 400 }
      );
    }

    const slotValidation = await validateAppointmentSlot(date, time);

    if (!slotValidation.ok || !slotValidation.date || !slotValidation.time) {
      return NextResponse.json(
        {
          error:
            slotValidation.error ||
            "This appointment slot is not available. Please choose another slot.",
        },
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
      date: slotValidation.date,
      time: slotValidation.time,
      message,
    });

    let prescriptionVisit: Awaited<ReturnType<typeof createPrescriptionVisit>> | null =
      null;

    try {
      prescriptionVisit = await createPrescriptionVisit({
        patientEmail: appointment.email,
        patientName: appointment.name,
        patientPhone: appointment.phone,
        patientAge: appointment.age,
        appointmentId: appointment.id,
        appointmentType: appointment.appointmentType,
      });
    } catch {
      prescriptionVisit = null;
    }

    const meetingLink = isOnlineAppointment(appointment.appointmentType)
      ? buildOnlineConsultationLink(appointment.id)
      : "";

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
      appointmentId: appointment.id,
      prescriptionVisitId: prescriptionVisit ? prescriptionVisit.id : null,
      rxNumber: prescriptionVisit ? prescriptionVisit.rxNumber : null,
      meetingLink: meetingLink || null,
      message:
        "Appointment booked successfully. Confirmation email has been sent.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Appointment booking failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
