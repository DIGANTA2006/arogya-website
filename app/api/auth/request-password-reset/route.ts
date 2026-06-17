import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import {
  generateSecureToken,
  getSiteUrl,
  hashToken,
  sendAuthEmail,
} from "@/lib/auth-email";
import { findPatientByEmail } from "@/lib/patient-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type Body = {
  email?: string;
};

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const body = (await request.json()) as Body;
    const email = String(body.email || "").trim().toLowerCase();
    const ip = getRequestIp(request);

    const limit = await checkRateLimit({
      key: `auth:password-reset:${email || "unknown"}:${ip}`,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const patient = await findPatientByEmail(email).catch(() => undefined);

    // Do not reveal whether an account exists.
    if (!patient) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link will be sent.",
      });
    }

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();

    await supabase.from("password_reset_requests").insert({
      patient_email: email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used_at: null,
    });

    const resetUrl = `${getSiteUrl()}/client/reset-password/${token}`;

    await sendAuthEmail({
      to: email,
      subject: "Reset your Arogya patient portal password",
      title: "Reset your password",
      message: "We received a request to reset your Arogya patient portal password. This link will expire in 30 minutes.",
      actionText: "Reset Password",
      actionUrl: resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link will be sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Password reset request failed." },
      { status: 500 }
    );
  }
}