import { NextRequest, NextResponse } from "next/server";
import {
  normalizePortalSubject,
  verifyPortalToken,
  type PortalRole,
} from "@/lib/portal-token";

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
    return await verifyPortalToken(requiredRole, subject, token);
  } catch {
    return false;
  }
}

function isProtectedAdminPath(path: string) {
  if (!path.startsWith("/admin")) return false;
  if (path === "/admin/login" || path.startsWith("/admin/login/")) return false;

  return true;
}

function isProtectedClientPath(path: string) {
  return (
    path.startsWith("/client/dashboard") ||
    path.startsWith("/client/profile") ||
    path.startsWith("/client/payment")
  );
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isProtectedAdminPath(path)) {
    const valid = await isValidSession(request, "admin");

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isProtectedClientPath(path)) {
    const valid = await isValidSession(request, "client");

    if (!valid) {
      return NextResponse.redirect(new URL("/client/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/dashboard/:path*",
    "/client/profile/:path*",
    "/client/payment/:path*",
  ],
};
