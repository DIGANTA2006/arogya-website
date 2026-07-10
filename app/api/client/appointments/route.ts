import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  normalizeTime,
  validateAppointmentSlot,
} from "@/lib/appointment-slots";
import { addAppointment, getAppointmentsForPatient } from "@/lib/appointment-store";
import { sendAppointmentEmails } from "@/lib/appointment-email";

import { requireVerifiedPatientEmail } from "@/lib/email-verification";
import { findPatientByEmail } from "@/lib/patient-store";
import { createPrescriptionVisit } from "@/lib/prescription-visit-store";
import { hasPortalRole } from "@/lib/portal-auth";
import { normalizeIndianPhone, normalizePatientAge } from "@/lib/input-validation";

const ALLOWED_APPOINTMENT_TYPES = new Set([
  "Physical Clinic Visit",
  "Online Video Consultation",
]);

const ALLOWED_SERVICES = new Set([
  "Speech Therapy Consultation",
  "Hearing Test",
  "Hearing Aid Consultation",
  "Online Follow-up Consultation",
]);
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

  const appointments = await getAppointmentsForPatient(email);
  return NextResponse.json({ appointments });
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

    const verifiedEmail = await requireVerifiedPatientEmail(email);

    if (!verifiedEmail.ok) {
      return NextResponse.json(
        {
          error: verifiedEmail.error,
          requiresEmailVerification: true,
        },
        { status: 403 }
      );
    }

    const patient = verifiedEmail.patient || (await findPatientByEmail(email));

    if (patient && !patient.mobileVerified) {
      return NextResponse.json(
        { error: "Please verify your mobile number before booking appointment." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Body;

    const age = normalizePatientAge(patient?.age || body.age || "");
    const phone = normalizeIndianPhone(patient?.phone || "");
    const service = clean(body.service);
    const appointmentType = clean(body.appointmentType || "Clinic Visit");
    const date = clean(body.date);
    const time = normalizeTime(clean(body.time));
    const message = clean(body.message);

    if (!service || !date || !time || !phone) {
      return NextResponse.json(
        { error: "Complete and verify your profile, then choose service, date and time." },
        { status: 400 }
      );
    }

    if (!ALLOWED_SERVICES.has(service) || !ALLOWED_APPOINTMENT_TYPES.has(appointmentType)) {
      return NextResponse.json(
        { error: "Choose a valid clinic service and appointment type." },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Appointment note must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    const slotValidation = await validateAppointmentSlot(date, time, appointmentType);

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
    } catch (error) {
      console.error(
        `[appointments] RX visit creation failed for appointment ${appointment.id}.`,
        error
      );
      prescriptionVisit = null;
    }

    const requiresOnlinePayment =
      appointment.appointmentType.toLowerCase().includes("online") ||
      appointment.appointmentType.toLowerCase().includes("video") ||
      appointment.appointmentType.toLowerCase().includes("meet");

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
      rxPending: !prescriptionVisit,
      meetingLink: null,
      requiresOnlinePayment,
      message: requiresOnlinePayment
        ? "Online appointment booked. Please complete UPI payment from your dashboard. Meeting access opens after clinic payment verification."
        : "Appointment booked successfully. Confirmation email has been sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Appointment booking failed. Please try again.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: message.toLowerCase().includes("just booked") ? 409 : 500 }
    );
  }
}
