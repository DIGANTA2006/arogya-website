import { NextRequest, NextResponse } from "next/server";
function clearSession(response: NextResponse) {
  response.cookies.set("portal_role", "", { path: "/", maxAge: 0 });
  response.cookies.set("portal_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("portal_subject", "", { path: "/", maxAge: 0 });
  response.cookies.set("portal_email", "", { path: "/", maxAge: 0 });
  response.cookies.set("portal_name", "", { path: "/", maxAge: 0 });

  return response;
}

export async function POST(request: NextRequest) {
  return clearSession(NextResponse.redirect(new URL("/", request.url), { status: 303 }));
}

export async function GET(request: NextRequest) {
  return clearSession(NextResponse.redirect(new URL("/", request.url)));
}