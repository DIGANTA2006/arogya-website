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

  if (!resendApiKey || !appointmentEmail || resendApiKey.includes("your_")) {
    return {
      sent: false,
      reason: "Resend is not configured.",
    };
  }

  const clinicName =
    process.env.NEXT_PUBLIC_CLINIC_NAME ||
    "Arogya Speech Therapy & Hearing Care";

  const clinicAddress =
    process.env.NEXT_PUBLIC_ADDRESS ||
    "2nd floor, Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha, PIN 464001";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  const patientHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a">
      <h2>Your appointment is successfully booked</h2>
      <p>Dear ${input.patientName},</p>
      <p>Your appointment request has been received successfully.</p>

      <h3>Appointment Details</h3>
      <p><strong>Service:</strong> ${input.service}</p>
      <p><strong>Type:</strong> ${input.appointmentType}</p>
      <p><strong>Date:</strong> ${input.date}</p>
      <p><strong>Time:</strong> ${input.time}</p>

      <h3>Clinic Details</h3>
      <p><strong>Clinic:</strong> ${clinicName}</p>
      <p><strong>Address:</strong> ${clinicAddress}</p>

      ${
        input.appointmentType.toLowerCase().includes("online")
          ? "<p>The clinic team will share the online consultation link before your appointment.</p>"
          : ""
      }

      ${
        siteUrl
          ? `<p><a href="${siteUrl}/client/dashboard">Open your patient dashboard</a></p>`
          : ""
      }

      <p>Thank you,<br/>${clinicName}</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a">
      <h2>New Appointment Booking</h2>
      <p><strong>Name:</strong> ${input.patientName}</p>
      <p><strong>Age:</strong> ${input.age || "Not provided"}</p>
      <p><strong>Mobile:</strong> ${input.patientPhone}</p>
      <p><strong>Email:</strong> ${input.patientEmail}</p>
      <p><strong>Service:</strong> ${input.service}</p>
      <p><strong>Type:</strong> ${input.appointmentType}</p>
      <p><strong>Date:</strong> ${input.date}</p>
      <p><strong>Time:</strong> ${input.time}</p>
      <p><strong>Message:</strong> ${input.message || "No message"}</p>
      ${
        siteUrl
          ? `<p><a href="${siteUrl}/admin/appointments">Open Admin Appointment CRM</a></p>`
          : ""
      }
    </div>
  `;

  const requests = [
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Arogya Clinic <onboarding@resend.dev>",
        to: [input.patientEmail],
        subject: "Your appointment is successfully booked",
        html: patientHtml,
      }),
    }),
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Arogya Appointment <onboarding@resend.dev>",
        to: [appointmentEmail],
        subject: `New Appointment Booking - ${input.patientName}`,
        html: adminHtml,
      }),
    }),
  ];

  const results = await Promise.all(requests);

  return {
    sent: results.every((response) => response.ok),
  };
}
