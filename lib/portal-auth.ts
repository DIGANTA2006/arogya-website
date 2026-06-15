import { cookies } from "next/headers";

export type PortalRole = "admin" | "client";

export function normalizePortalSubject(subject: string) {
  return String(subject || "").trim().toLowerCase();
}

function getRequiredAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET env var is required and must be at least 32 characters.");
  }

  return secret;
}

async function createSignature(value: string) {
  const secret = getRequiredAuthSecret();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;

  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function createPortalToken(role: PortalRole, subject: string) {
  const normalizedSubject = normalizePortalSubject(subject);

  if (!normalizedSubject) {
    throw new Error("Portal subject is required.");
  }

  return createSignature(`${role}:${normalizedSubject}`);
}

export async function hasPortalRole(requiredRole: PortalRole) {
  const cookieStore = await cookies();

  const role = cookieStore.get("portal_role")?.value;
  const token = cookieStore.get("portal_token")?.value;
  const subject = normalizePortalSubject(
    cookieStore.get("portal_subject")?.value ||
      cookieStore.get("portal_email")?.value ||
      ""
  );

  if (role !== requiredRole || !token || !subject) return false;

  const expectedToken = await createPortalToken(requiredRole, subject);

  return safeEqual(token, expectedToken);
}