import { createHash, randomInt, randomUUID } from "crypto";
import { escapeHtml } from "@/lib/html";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function getRequiredAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET env var is required and must be at least 32 characters.");
  }

  return secret;
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function hashAdmin2faCode(input: {
  challengeId: string;
  adminEmail: string;
  code: string;
}) {
  const secret = getRequiredAuthSecret();

  return createHash("sha256")
    .update(
      `${secret}:${input.challengeId}:${normalizeEmail(input.adminEmail)}:${input.code}`
    )
    .digest("hex");
}

export function generateAdmin2faCode() {
  return String(randomInt(100000, 1000000));
}

export async function createAdmin2faChallenge(input: {
  adminEmail: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const supabase = getSupabaseAdmin();
  const challengeId = randomUUID();
  const code = generateAdmin2faCode();
  const adminEmail = normalizeEmail(input.adminEmail);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from("admin_2fa_challenges").insert({
    id: challengeId,
    admin_email: adminEmail,
    code_hash: hashAdmin2faCode({
      challengeId,
      adminEmail,
      code,
    }),
    expires_at: expiresAt,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    challengeId,
    code,
    expiresAt,
  };
}

export async function verifyAdmin2faChallenge(input: {
  challengeId: string;
  code: string;
}) {
  const challengeId = String(input.challengeId || "").trim();
  const code = String(input.code || "").trim();

  if (!challengeId || !/^\d{6}$/.test(code)) {
    return {
      ok: false as const,
      error: "Invalid verification code.",
      adminEmail: "",
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: challenge, error } = await supabase
    .from("admin_2fa_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !challenge) {
    return {
      ok: false as const,
      error: "Verification session not found.",
      adminEmail: "",
    };
  }

  if (challenge.used_at) {
    return {
      ok: false as const,
      error: "This verification code was already used.",
      adminEmail: "",
    };
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return {
      ok: false as const,
      error: "Verification code expired. Please login again.",
      adminEmail: "",
    };
  }

  const expectedHash = hashAdmin2faCode({
    challengeId,
    adminEmail: challenge.admin_email,
    code,
  });

  if (expectedHash !== challenge.code_hash) {
    return {
      ok: false as const,
      error: "Invalid verification code.",
      adminEmail: "",
    };
  }

  const { error: updateError } = await supabase
    .from("admin_2fa_challenges")
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (updateError) {
    return {
      ok: false as const,
      error: "Could not complete verification.",
      adminEmail: "",
    };
  }

  return {
    ok: true as const,
    adminEmail: normalizeEmail(challenge.admin_email),
  };
}

export async function sendAdmin2faEmail(input: {
  to: string;
  code: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail || resendApiKey.includes("your_")) {
    console.error(
      "[admin-2fa] RESEND_API_KEY or RESEND_FROM_EMAIL is not configured correctly."
    );
    return false;
  }

  const code = input.code;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Arogya Admin Login Verification</h2>
      <p>Your admin login verification code is:</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:6px;background:#f1f5f9;padding:14px 18px;border-radius:12px;display:inline-block">
        ${escapeHtml(code)}
      </p>
      <p>This code will expire in 10 minutes.</p>
      <p style="font-size:12px;color:#6b7280">
        If you did not try to login to the admin dashboard, change the admin password immediately.
      </p>
      <p style="font-size:12px;color:#6b7280">
        Arogya Speech Therapy & Hearing Care
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: "Arogya Admin Login Verification Code",
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[admin-2fa] Resend rejected admin verification email.", {
        status: response.status,
        detail: detail.slice(0, 700),
      });
    }

    return response.ok;
  } catch (error) {
    console.error("[admin-2fa] Resend request failed.", error);
    return false;
  }
}
