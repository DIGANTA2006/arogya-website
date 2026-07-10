import { createHash, randomBytes } from "crypto";
import { escapeHtml } from "@/lib/html";

export function generateSecureToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionText: string;
  actionUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return false;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>${escapeHtml(input.title)}</h2>
      <p>${escapeHtml(input.message)}</p>
      <p>
        <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
          ${escapeHtml(input.actionText)}
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">
        If the button does not work, copy this link:<br/>
        ${escapeHtml(input.actionUrl)}
      </p>
      <p style="font-size:12px;color:#6b7280">
        Arogya Speech Therapy & Hearing Care
      </p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: input.subject,
      html,
    }),
  });

  return response.ok;
}