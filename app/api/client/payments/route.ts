import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppointments } from "@/lib/appointment-store";
import { requireVerifiedPatientEmail } from "@/lib/email-verification";
import {
  getOnlineConsultationFee,
  isOnlineAppointmentType,
} from "@/lib/consultation-flow";
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
      onlineConsultationFee: getOnlineConsultationFee(),
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
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const session = await getClientEmailAndName();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const verifiedEmail = await requireVerifiedPatientEmail(session.email);

    if (!verifiedEmail.ok) {
      return NextResponse.json(
        {
          error: verifiedEmail.error,
          requiresEmailVerification: true,
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const appointmentId = clean(formData.get("appointmentId"));
    const transactionRef = clean(formData.get("transactionRef"));
    const proofEntry = formData.get("proof");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required." },
        { status: 400 }
      );
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

    if (!isOnlineAppointmentType(appointment.appointmentType)) {
      return NextResponse.json(
        {
          error:
            "Online UPI payment is only available for Online Video Consultation. Please pay at clinic for physical appointments.",
        },
        { status: 403 }
      );
    }

    const proofFile =
      proofEntry instanceof File && proofEntry.size > 0 ? proofEntry : null;

    const payment = await submitAppointmentPayment({
      appointmentId,
      patientEmail: session.email,
      patientName: appointment.name || session.name,
      patientMobile: appointment.phone || "",
      amount: getOnlineConsultationFee(),
      transactionRef,
      proofFile,
    });

    return NextResponse.json({
      success: true,
      payment: formatPaymentForClient(payment),
      onlineConsultationFee: getOnlineConsultationFee(),
      message:
        "Payment details submitted. The clinic will verify it and unlock the online meeting.",
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
