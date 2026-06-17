import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  createPaymentProofSignedUrl,
  formatPaymentForAdmin,
  getAllPayments,
  updatePaymentStatus,
  type PaymentStatus,
} from "@/lib/payment-store";

export const runtime = "nodejs";

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

export async function GET() {
  try {
    const allowed = await hasPortalRole("admin");

    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payments = await getAllPayments();

    const formatted = await Promise.all(
      payments.map(async (payment) =>
        formatPaymentForAdmin(payment, await createPaymentProofSignedUrl(payment))
      )
    );

    return NextResponse.json({ payments: formatted });
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

export async function PATCH(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const allowed = await hasPortalRole("admin");

    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      status?: PaymentStatus;
      adminNote?: string;
    };

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Payment ID and status are required." },
        { status: 400 }
      );
    }

    if (!["pending", "submitted", "paid", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    const payment = await updatePaymentStatus({
      id: body.id,
      status: body.status,
      adminNote: body.adminNote,
    });

    return NextResponse.json({
      success: true,
      payment: formatPaymentForAdmin(
        payment,
        await createPaymentProofSignedUrl(payment)
      ),
    });
  } catch (error) {
    const setupError = getPaymentSetupError(error);

    if (setupError) {
      return NextResponse.json({ error: setupError }, { status: 500 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment status update failed." },
      { status: 500 }
    );
  }
}

