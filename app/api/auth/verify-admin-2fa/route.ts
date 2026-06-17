import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { verifyAdmin2faChallenge } from "@/lib/admin-2fa-store";
import { createPortalToken } from "@/lib/portal-auth";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
type VerifyBody = {
  challengeId?: string;
  code?: string;
};

function setAdminCookies(
  response: NextResponse,
  token: string,
  email: string
) {
  const subject = email.toLowerCase();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  response.cookies.set("portal_role", "admin", cookieOptions);
  response.cookies.set("portal_token", token, cookieOptions);
  response.cookies.set("portal_subject", subject, cookieOptions);
  response.cookies.set("portal_email", subject, cookieOptions);
  response.cookies.set("portal_name", "Clinic Admin", cookieOptions);

  return response;
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const body = (await request.json()) as VerifyBody;

    const challengeId = String(body.challengeId || "").trim();
    const code = String(body.code || "").trim();
    const ip = getRequestIp(request);

    const limit = await checkRateLimit({
      key: `auth:admin-2fa:${challengeId || "unknown"}:${ip}`,
      limit: 8,
      windowSeconds: 10 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    const result = await verifyAdmin2faChallenge({
      challengeId,
      code,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const token = await createPortalToken("admin", result.adminEmail);
    const response = NextResponse.json({
      success: true,
      role: "admin",
    });

    return setAdminCookies(response, token, result.adminEmail);
  } catch {
    return NextResponse.json(
      { error: "Admin verification failed." },
      { status: 500 }
    );
  }
}