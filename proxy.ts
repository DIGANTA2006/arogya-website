import { NextRequest, NextResponse } from "next/server";

async function createSignature(value: string) {
  const secret = process.env.AUTH_SECRET || "change-this-secret-before-production";
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

async function isValidSession(request: NextRequest, requiredRole: "admin" | "client") {
  const role = request.cookies.get("portal_role")?.value;
  const token = request.cookies.get("portal_token")?.value;

  if (role !== requiredRole || !token) {
    return false;
  }

  const expectedToken = await createSignature(requiredRole);

  return safeEqual(token, expectedToken);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/admin/dashboard") ||
    path.startsWith("/admin/appointments") ||
    path.startsWith("/admin/prescriptions") ||
    path.startsWith("/admin/reviews")
  ) {
    const valid = await isValidSession(request, "admin");

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (path.startsWith("/client/dashboard")) {
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
    "/admin/reviews/:path*",
    "/client/dashboard/:path*",
  ],
};