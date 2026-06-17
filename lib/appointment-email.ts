import { escapeHtml } from "@/lib/html";

export async function sendAppointmentEmails(input: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  age?: string;
  service: string;
  appointmentType: string;
  date: string;
  time: string;
  message?: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const appointmentEmail = process.env.APPOINTMENT_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (
    !resendApiKey ||
    !appointmentEmail ||
    !fromEmail ||
    resendApiKey.includes("your_")
  ) {
    return {
      sent: false,
      reason:
        "Resend is not configured. Check RESEND_API_KEY, RESEND_FROM_EMAIL and APPOINTMENT_EMAIL.",
    };
  }

  const clinicName =
    process.env.NEXT_PUBLIC_CLINIC_NAME ||
    "Arogya Speech Therapy & Hearing Care";

  const clinicAddress =
    process.env.NEXT_PUBLIC_ADDRESS ||
    "2nd floor, Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha, PIN 464001";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const online =
    input.appointmentType.toLowerCase().includes("online") ||
    input.appointmentType.toLowerCase().includes("video") ||
    input.appointmentType.toLowerCase().includes("meet");

  const patientHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a">
      <h2>Your appointment request was received</h2>
      <p>Dear ${escapeHtml(input.patientName)},</p>
      <p>Your appointment request has been received successfully.</p>

      <h3>Appointment Details</h3>
      <p><strong>Service:</strong> ${escapeHtml(input.service)}</p>
      <p><strong>Type:</strong> ${escapeHtml(input.appointmentType)}</p>
      <p><strong>Date:</strong> ${escapeHtml(input.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(input.time)}</p>

      ${
        online
          ? `<h3>Online Consultation</h3>
             <p>Please complete/confirm payment from your patient dashboard. The meeting link will be available only after clinic verification.</p>`
          : `<h3>Clinic Details</h3>
             <p><strong>Clinic:</strong> ${escapeHtml(clinicName)}</p>
             <p><strong>Address:</strong> ${escapeHtml(clinicAddress)}</p>`
      }

      ${
        siteUrl
          ? `<p><a href="${escapeHtml(siteUrl)}/client/dashboard">Open your patient dashboard</a></p>`
          : ""
      }

      <p>Thank you,<br/>${escapeHtml(clinicName)}</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a">
      <h2>New Appointment Booking</h2>
      <p><strong>Name:</strong> ${escapeHtml(input.patientName)}</p>
      <p><strong>Age:</strong> ${escapeHtml(input.age || "Not provided")}</p>
      <p><strong>Mobile:</strong> ${escapeHtml(input.patientPhone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.patientEmail)}</p>
      <p><strong>Service:</strong> ${escapeHtml(input.service)}</p>
      <p><strong>Type:</strong> ${escapeHtml(input.appointmentType)}</p>
      <p><strong>Date:</strong> ${escapeHtml(input.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(input.time)}</p>
      <p><strong>Message:</strong> ${escapeHtml(input.message || "No message")}</p>
      ${
        online
          ? "<p><strong>Online:</strong> Payment verification is required before the meeting link is shared.</p>"
          : ""
      }
      ${
        siteUrl
          ? `<p><a href="${escapeHtml(siteUrl)}/admin/appointments">Open Admin Appointment CRM</a></p>`
          : ""
      }
    </div>
  `;

  const requests: Promise<Response>[] = [];

  if (input.patientEmail) {
    requests.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [input.patientEmail],
          subject: "Your Arogya appointment request was received",
          html: patientHtml,
        }),
      })
    );
  }

  requests.push(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [appointmentEmail],
        subject: `New Appointment Booking - ${input.patientName}`,
        html: adminHtml,
      }),
    })
  );

  const results = await Promise.allSettled(requests);

  let sent = true;

  for (const result of results) {
    if (result.status === "rejected") {
      sent = false;
      console.error("[appointment-email] Resend request failed.", result.reason);
      continue;
    }

    if (!result.value.ok) {
      sent = false;
      const detail = await result.value.text().catch(() => "");
      console.error("[appointment-email] Resend rejected email.", {
        status: result.value.status,
        detail: detail.slice(0, 700),
      });
    }
  }

  return {
    sent,
  };
}
