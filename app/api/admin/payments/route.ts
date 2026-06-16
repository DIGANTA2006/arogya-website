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

function isTableMissingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.toLowerCase().includes("appointment_payments");
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
    if (isTableMissingError(error)) {
      return NextResponse.json(
        { error: "Payment system table is missing. Run Phase 8D Supabase SQL first." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load payments." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    if (isTableMissingError(error)) {
      return NextResponse.json(
        { error: "Payment system table is missing. Run Phase 8D Supabase SQL first." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment status update failed." },
      { status: 500 }
    );
  }
}
