import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/html";
import { findPatientByEmail } from "@/lib/patient-store";
import { getPrescriptions } from "@/lib/prescription-store";
import { sendSms } from "@/lib/sms";

function isDue(dateValue: string) {
  if (!dateValue) return false;

  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const normalize = (date: Date) => date.toISOString().slice(0, 10);

  return dateValue === normalize(today) || dateValue === normalize(tomorrow);
}

async function sendReminderEmail(to: string, subject: string, html: string) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "Arogya Clinic <onboarding@resend.dev>",
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
    (item) => isDue(item.nextTherapyDate) || isDue(item.nextAppointmentDate)
  );

  let emailSent = 0;
  let smsSent = 0;

  for (const item of due) {
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

        if (sms.sent) smsSent += 1;
      }
    } catch {
      // Continue email reminders even if patient phone lookup fails.
    }
  }

  return NextResponse.json({
    checked: prescriptions.length,
    due: due.length,
    emailSent,
    smsSent,
  });
}