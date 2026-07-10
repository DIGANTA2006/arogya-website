import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/html";
import { findPatientByEmail } from "@/lib/patient-store";
import {
  getPrescriptions,
  markPrescriptionReminderSent,
} from "@/lib/prescription-store";
import { sendSms } from "@/lib/sms";

function isDue(dateValue: string) {
  if (!dateValue) return false;

  const normalize = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  return dateValue === normalize(today) || dateValue === normalize(tomorrow);
}

async function sendReminderEmail(to: string, subject: string, html: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  return response.ok;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const prescriptions = await getPrescriptions();

  const due = prescriptions.filter(
    (item) =>
      !item.reminderSent &&
      (isDue(item.nextTherapyDate) || isDue(item.nextAppointmentDate))
  );

  let emailSent = 0;
  let smsSent = 0;

  for (const item of due) {
    let itemSmsSent = false;
    const dateParts = [
      item.nextTherapyDate && `Next therapy: ${item.nextTherapyDate}`,
      item.nextAppointmentDate && `Next appointment: ${item.nextAppointmentDate}`,
    ].filter(Boolean) as string[];

    const datesHtml = dateParts.map((part) => escapeHtml(part)).join("<br/>");
    const datesText = dateParts.join(", ");

    const emailOk = await sendReminderEmail(
      item.patientEmail,
      "Arogya Clinic Reminder",
      `<p>Dear Patient,</p><p>This is a reminder from Arogya Speech Therapy & Hearing Care.</p><p>${datesHtml}</p><p>Please contact the clinic for confirmation.</p>`
    );

    if (emailOk) emailSent += 1;

    try {
      const patient = await findPatientByEmail(item.patientEmail);

      if (patient?.phone) {
        const sms = await sendSms(
          patient.phone,
          `Arogya reminder: ${datesText}. Please contact the clinic for confirmation.`
        );

        if (sms.sent) {
          smsSent += 1;
          itemSmsSent = true;
        }
      }
    } catch {
      // Continue email reminders even if patient phone lookup fails.
    }

    if (emailOk || itemSmsSent) {
      await markPrescriptionReminderSent(item.id).catch((error) => {
        console.error("[reminders] Could not mark reminder as sent.", error);
      });
    }
  }

  return NextResponse.json({
    checked: prescriptions.length,
    due: due.length,
    emailSent,
    smsSent,
  });
}