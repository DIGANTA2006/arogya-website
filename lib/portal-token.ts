export type PortalRole = "admin" | "client";

export const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const TOKEN_VERSION = "v1";
const CLOCK_SKEW_SECONDS = 60;

export function normalizePortalSubject(subject: string) {
  return String(subject || "").trim().toLowerCase();
}

function getRequiredAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (
    !secret ||
    secret.length < 32 ||
    /generate_|change[_-]?me|your[_-]?secret/i.test(secret)
  ) {
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
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function signaturePayload(input: {
  role: PortalRole;
  subject: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}) {
  return [
    TOKEN_VERSION,
    input.role,
    input.subject,
    input.issuedAt,
    input.expiresAt,
    input.nonce,
  ].join(":");
}

export async function createPortalToken(role: PortalRole, subject: string) {
  const normalizedSubject = normalizePortalSubject(subject);

  if (!normalizedSubject) {
    throw new Error("Portal subject is required.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + PORTAL_SESSION_MAX_AGE_SECONDS;
  const nonce = crypto.randomUUID();
  const signature = await createSignature(
    signaturePayload({ role, subject: normalizedSubject, issuedAt, expiresAt, nonce })
  );

  return [TOKEN_VERSION, issuedAt, expiresAt, nonce, signature].join(".");
}

export async function verifyPortalToken(
  requiredRole: PortalRole,
  subject: string,
  token: string
) {
  const normalizedSubject = normalizePortalSubject(subject);
  const parts = String(token || "").split(".");

  if (!normalizedSubject || parts.length !== 5) return false;

  const [version, issuedAtText, expiresAtText, nonce, signature] = parts;
  const issuedAt = Number(issuedAtText);
  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);

  if (version !== TOKEN_VERSION || !nonce || !signature) return false;
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) return false;
  if (issuedAt > now + CLOCK_SKEW_SECONDS || expiresAt <= now) return false;
  if (expiresAt <= issuedAt) return false;
  if (expiresAt - issuedAt > PORTAL_SESSION_MAX_AGE_SECONDS + CLOCK_SKEW_SECONDS) {
    return false;
  }

  const expected = await createSignature(
    signaturePayload({
      role: requiredRole,
      subject: normalizedSubject,
      issuedAt,
      expiresAt,
      nonce,
    })
  );

  return safeEqual(signature, expected);
}
