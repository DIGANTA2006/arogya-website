import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addAppointment } from "@/lib/appointment-store";
import { hasPortalRole } from "@/lib/portal-auth";
import { findPatientByEmail } from "@/lib/patient-store";

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

export async function POST(request: Request) {
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
    const time = clean(body.time);
    const message = clean(body.message);

    if (!phone || !service || !date || !time) {
      return NextResponse.json(
        { error: "Phone, service, date and time are required." },
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
      date,
      time,
      message,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const appointmentEmail = process.env.APPOINTMENT_EMAIL;

    if (
      resendApiKey &&
      appointmentEmail &&
      !resendApiKey.includes("your_real")
    ) {
      const emailHtml = `
        <h2>New Appointment Request</h2>
        <p><strong>Lead ID:</strong> ${appointment.id}</p>
        <p><strong>Name:</strong> ${appointment.name}</p>
        <p><strong>Age:</strong> ${appointment.age || "Not provided"}</p>
        <p><strong>Phone:</strong> ${appointment.phone}</p>
        <p><strong>Email:</strong> ${appointment.email || "Not provided"}</p>
        <p><strong>Service:</strong> ${appointment.service}</p>
        <p><strong>Appointment Type:</strong> ${appointment.appointmentType}</p>
        <p><strong>Date:</strong> ${appointment.date}</p>
        <p><strong>Time:</strong> ${appointment.time}</p>
        <p><strong>Message:</strong> ${appointment.message || "No message"}</p>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Appointment <onboarding@resend.dev>",
          to: [appointmentEmail],
          subject: `New Appointment Request - ${appointment.service}`,
          html: emailHtml,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      message: "Appointment booked successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}



