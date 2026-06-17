import { NextRequest, NextResponse } from "next/server";

type PortalRole = "admin" | "client";

function normalizePortalSubject(subject: string) {
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

async function createPortalToken(role: PortalRole, subject: string) {
  return createSignature(`${role}:${normalizePortalSubject(subject)}`);
}

async function isValidSession(request: NextRequest, requiredRole: PortalRole) {
  const role = request.cookies.get("portal_role")?.value;
  const token = request.cookies.get("portal_token")?.value;
  const subject = normalizePortalSubject(
    request.cookies.get("portal_subject")?.value ||
      request.cookies.get("portal_email")?.value ||
      ""
  );

  if (role !== requiredRole || !token || !subject) {
    return false;
  }

  try {
    const expectedToken = await createPortalToken(requiredRole, subject);
    return safeEqual(token, expectedToken);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/admin/dashboard") ||
    path.startsWith("/admin/appointments") ||
    path.startsWith("/admin/prescriptions") ||
    path.startsWith("/admin/prescription-visits") ||
    path.startsWith("/admin/scanner") ||
    path.startsWith("/admin/reviews") ||
    path.startsWith("/admin/payments") ||
    path.startsWith("/admin/audit-logs")
  ) {
    const valid = await isValidSession(request, "admin");

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (
    path.startsWith("/client/dashboard") ||
    path.startsWith("/client/profile") ||
    path.startsWith("/client/payment")
  ) {
    const valid = await isValidSession(request, "client");

    if (!valid) {
      return NextResponse.redirect(new URL("/client/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/admin/appointments/:path*",
    "/admin/prescriptions/:path*",
    "/admin/prescription-visits/:path*",
    "/admin/scanner/:path*",
    "/admin/reviews/:path*",
    "/admin/payments/:path*",
    "/admin/audit-logs/:path*",
    "/client/dashboard/:path*",
    "/client/profile/:path*",
    "/client/payment/:path*",
  ],
};