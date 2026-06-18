import { createHash, randomBytes } from "crypto";
import { sendAuthEmail } from "@/lib/auth-email";
import { findPatientByEmail } from "@/lib/patient-store";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function createVerificationToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAndSendPatientEmailVerification(emailInput: string) {
  const email = normalizeEmail(emailInput);

  if (!email) {
    return {
      sent: false,
      alreadyVerified: false,
      message: "Email is required.",
    };
  }

  const patient = await findPatientByEmail(email);

  if (!patient) {
    return {
      sent: true,
      alreadyVerified: false,
      message:
        "If this email is registered, a verification link has been sent.",
    };
  }

  if (patient.emailVerified) {
    return {
      sent: true,
      alreadyVerified: true,
      message: "Email is already verified.",
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

  if (!siteUrl) {
    return {
      sent: false,
      alreadyVerified: false,
      message: "NEXT_PUBLIC_SITE_URL is not configured.",
    };
  }

  const supabase = getSupabaseAdmin();
  const token = createVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("email_verification_tokens").insert({
    patient_email: email,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  const verificationUrl = `${siteUrl}/api/auth/verify-email/${token}`;

  const sent = await sendAuthEmail({
    to: email,
    subject: "Verify your Arogya patient account email",
    title: "Verify your email",
    message:
      "Please verify your Arogya patient account email before booking appointments, making online payments, or downloading protected prescriptions.",
    actionText: "Verify Email",
    actionUrl: verificationUrl,
  });

  return {
    sent,
    alreadyVerified: false,
    message: sent
      ? "Verification email sent. Please check your inbox."
      : "Could not send verification email. Check clinic email configuration.",
  };
}

export async function requireVerifiedPatientEmail(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const patient = await findPatientByEmail(email);

  if (!patient) {
    return {
      ok: false,
      patient: null,
      error:
        "Patient account not found. Please complete your patient profile first.",
    };
  }

  if (!patient.emailVerified) {
    return {
      ok: false,
      patient,
      error:
        "Please verify your email before using this secure patient action.",
    };
  }

  return {
    ok: true,
    patient,
    error: "",
  };
}
