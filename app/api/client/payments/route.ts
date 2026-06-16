import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppointments } from "@/lib/appointment-store";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  formatPaymentForClient,
  getPaymentsForPatient,
  submitAppointmentPayment,
} from "@/lib/payment-store";

export const runtime = "nodejs";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getPaymentSetupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("does not exist") ||
    lowerMessage.includes("schema cache") ||
    lowerMessage.includes("pgrst")
  ) {
    return "Payment database table is missing. Run Phase 8D Supabase SQL first.";
  }

  if (lowerMessage.includes("permission denied")) {
    return "Payment database permissions are missing. Grant service_role access to appointment_payments.";
  }

  return "";
}

async function getClientEmailAndName() {
  const allowed = await hasPortalRole("client");
  const cookieStore = await cookies();

  return {
    allowed,
    email: cleanEmail(cookieStore.get("portal_email")?.value || ""),
    name: clean(cookieStore.get("portal_name")?.value || "Patient"),
  };
}

export async function GET() {
  try {
    const session = await getClientEmailAndName();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payments = await getPaymentsForPatient(session.email);

    return NextResponse.json({
      payments: payments.map(formatPaymentForClient),
    });
  } catch (error) {
    const setupError = getPaymentSetupError(error);

    if (setupError) {
      return NextResponse.json({ error: setupError }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load payments." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getClientEmailAndName();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();

    const appointmentId = clean(formData.get("appointmentId"));
    const amountRaw = clean(formData.get("amount"));
    const transactionRef = clean(formData.get("transactionRef"));
    const proofEntry = formData.get("proof");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required." },
        { status: 400 }
      );
    }

    let amount: number | null = null;

    if (amountRaw) {
      const parsed = Number(amountRaw);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "Enter a valid payment amount." },
          { status: 400 }
        );
      }

      amount = parsed;
    }

    const appointments = await getAppointments();

    const appointment = appointments.find(
      (item) =>
        item.id === appointmentId &&
        item.email.toLowerCase() === session.email.toLowerCase()
    );

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found for this patient account." },
        { status: 404 }
      );
    }

    const proofFile =
      proofEntry instanceof File && proofEntry.size > 0 ? proofEntry : null;

    const payment = await submitAppointmentPayment({
      appointmentId,
      patientEmail: session.email,
      patientName: appointment.name || session.name,
      patientMobile: appointment.phone || "",
      amount,
      transactionRef,
      proofFile,
    });

    return NextResponse.json({
      success: true,
      payment: formatPaymentForClient(payment),
      message: "Payment details submitted. Clinic will verify and mark as paid.",
    });
  } catch (error) {
    const setupError = getPaymentSetupError(error);

    if (setupError) {
      return NextResponse.json({ error: setupError }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment submission failed." },
      { status: 500 }
    );
  }
}

