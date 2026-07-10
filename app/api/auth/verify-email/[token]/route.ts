import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth-email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const tokenHash = hashToken(token);
    const supabase = getSupabaseAdmin();

    const { data: verifyRow, error } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !verifyRow) {
      return NextResponse.redirect(
        new URL("/client/login?verified=invalid", _request.url)
      );
    }

    const { data: consumed, error: consumeError } = await supabase
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", verifyRow.id)
      .is("used_at", null)
      .select("patient_email")
      .maybeSingle();

    if (consumeError || !consumed) {
      return NextResponse.redirect(
        new URL("/client/login?verified=invalid", _request.url)
      );
    }

    const { error: patientError } = await supabase
      .from("patients")
      .update({ email_verified: true })
      .eq("email", consumed.patient_email);

    if (patientError) {
      throw new Error(patientError.message);
    }

    return NextResponse.redirect(
      new URL("/client/login?verified=success", _request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/client/login?verified=error", _request.url)
    );
  }
}