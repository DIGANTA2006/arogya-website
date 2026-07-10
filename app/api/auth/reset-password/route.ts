import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth-email";
import { hashPassword } from "@/lib/patient-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validatePassword } from "@/lib/input-validation";
type Body = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const body = (await request.json()) as Body;
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const ip = getRequestIp(request);

    const limit = await checkRateLimit({
      key: `auth:reset-password:${ip}`,
      limit: 5,
      windowSeconds: 30 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    if (!token || !password) {
      return NextResponse.json(
        { error: "Reset token and new password are required." },
        { status: 400 }
      );
    }

    const passwordResult = validatePassword(password);

    if (!passwordResult.ok) {
      return NextResponse.json(
        { error: passwordResult.error },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const tokenHash = hashToken(token);

    const { data: resetRow, error: resetError } = await supabase
      .from("password_reset_requests")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (resetError || !resetRow) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(passwordResult.password);

    const { data: consumedReset, error: consumeError } = await supabase
      .from("password_reset_requests")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetRow.id)
      .is("used_at", null)
      .select("patient_email")
      .maybeSingle();

    if (consumeError || !consumedReset) {
      return NextResponse.json(
        { error: "This reset link was already used." },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("patients")
      .update({ password_hash: passwordHash })
      .eq("email", consumedReset.patient_email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Password reset failed." },
      { status: 500 }
    );
  }
}