import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/request-guard";

function clearSession(response: NextResponse) {
  for (const name of [
    "portal_role",
    "portal_token",
    "portal_subject",
    "portal_email",
    "portal_name",
    "verified_mobile",
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  return clearSession(
    NextResponse.redirect(new URL("/", request.url), { status: 303 })
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to end a portal session." },
    { status: 405, headers: { Allow: "POST" } }
  );
}