import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  normalizeTime,
  validateAppointmentSlot,
} from "@/lib/appointment-slots";
import { addAppointment } from "@/lib/appointment-store";
import { createPrescriptionVisit } from "@/lib/prescription-visit-store";
import { escapeHtml } from "@/lib/html";
import { isOnlineAppointment } from "@/lib/meeting-link";
import { hasPortalRole } from "@/lib/portal-auth";
import { findPatientByEmail } from "@/lib/patient-store";
import { sendSms } from "@/lib/sms";
type AppointmentBody = {
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

async function sendResendEmail(input: {
  to: string[];
  subject: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail || resendApiKey.includes("your_real")) {
    console.error(
      "[appointment-api] RESEND_API_KEY or RESEND_FROM_EMAIL is not configured correctly."
    );
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  return response.ok;
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const allowed = await hasPortalRole("client");

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Please login or register as a patient before booking an appointment.",
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const patientEmail = cookieStore.get("portal_email")?.value || "";
    const patientName = cookieStore.get("portal_name")?.value || "Patient";

    const patient = await findPatientByEmail(patientEmail);
    const body = (await request.json()) as AppointmentBody;

    const age = clean(body.age || patient?.age || "");
    const phone = clean(body.phone || patient?.phone || "");
    const service = clean(body.service);
    const appointmentType = clean(body.appointmentType || "Clinic Visit");
    const date = clean(body.date);
    const time = normalizeTime(clean(body.time));
    const message = clean(body.message);

    if (!phone || !service || !date || !time) {
      return NextResponse.json(
        { error: "Phone, service, date and time are required." },
        { status: 400 }
      );
    }

    const slotValidation = await validateAppointmentSlot(date, time, appointmentType);

    if (!slotValidation.ok || !slotValidation.date || !slotValidation.time) {
      return NextResponse.json(
        { error: slotValidation.error || "This appointment slot is not available." },
        { status: 400 }
      );
    }

    const appointment = await addAppointment({
      name: patient?.name || patientName,
      age,
      phone,
      email: patientEmail,
      service,
      appointmentType,
      date: slotValidation.date,
      time: slotValidation.time,
      message,
    });
    let prescriptionVisit: Awaited<ReturnType<typeof createPrescriptionVisit>> | null = null;

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

    const online = isOnlineAppointment(appointmentType);
    const requiresOnlinePayment = online;
    const clinicEmail = process.env.APPOINTMENT_EMAIL;

    const adminHtml = `
      <h2>New Appointment Request</h2>
      <p><strong>Lead ID:</strong> ${escapeHtml(appointment.id)}</p>
      <p><strong>Name:</strong> ${escapeHtml(appointment.name)}</p>
      <p><strong>Age:</strong> ${escapeHtml(appointment.age || "Not provided")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(appointment.phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(appointment.email || "Not provided")}</p>
      <p><strong>Service:</strong> ${escapeHtml(appointment.service)}</p>
      <p><strong>Appointment Type:</strong> ${escapeHtml(appointment.appointmentType)}</p>
      <p><strong>Date:</strong> ${escapeHtml(appointment.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(appointment.time)}</p>
      ${
        online
          ? `<p><strong>Online Consultation:</strong> Payment verification is required before the meeting link is shared.</p>`
          : ""
      }
      <p><strong>Message:</strong> ${escapeHtml(appointment.message || "No message")}</p>
    `;

    const patientHtml = `
      <h2>Your appointment request was received</h2>
      <p>Dear ${escapeHtml(appointment.name)},</p>
      <p>Your appointment request has been received by Arogya Speech Therapy & Hearing Care.</p>
      <p><strong>Service:</strong> ${escapeHtml(appointment.service)}</p>
      <p><strong>Appointment Type:</strong> ${escapeHtml(appointment.appointmentType)}</p>
      <p><strong>Date:</strong> ${escapeHtml(appointment.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(appointment.time)}</p>
      ${
        online
          ? `<p><strong>Online Consultation:</strong> Please complete payment from your patient dashboard. The meeting link will be available only after clinic verification.</p>`
          : `<p><strong>Clinic:</strong> Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001</p>`
      }
      <p>The clinic may contact you for confirmation if required.</p>
    `;

    const emailTasks: Promise<boolean>[] = [];

    if (clinicEmail) {
      emailTasks.push(
        sendResendEmail({
          to: [clinicEmail],
          subject: `New Appointment Request - ${appointment.service}`,
          html: adminHtml,
        })
      );
    }

    if (patientEmail) {
      emailTasks.push(
        sendResendEmail({
          to: [patientEmail],
          subject: "Arogya Appointment Request Received",
          html: patientHtml,
        })
      );
    }

    await Promise.allSettled(emailTasks);

    const smsMessage = online
      ? `Arogya online appointment received: ${service} on ${slotValidation.date} at ${slotValidation.time}. Please complete payment in your patient dashboard. Meeting link is shared after clinic verification.`
      : `Arogya appointment received: ${service} on ${slotValidation.date} at ${slotValidation.time}. Clinic: Sanchi Road, Vidisha.`;

    if (phone) {
      await sendSms(phone, smsMessage);
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      prescriptionVisitId: prescriptionVisit ? prescriptionVisit.id : null,
      rxNumber: prescriptionVisit ? prescriptionVisit.rxNumber : null,
      meetingLink: null,
      requiresOnlinePayment,
      message: "Appointment booked successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}