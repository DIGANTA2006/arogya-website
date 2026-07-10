import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAndSendPatientEmailVerification } from "@/lib/email-verification";
import { hasPortalRole } from "@/lib/portal-auth";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/request-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const allowed = await hasPortalRole("client");
  const cookieStore = await cookies();
  const email = String(cookieStore.get("portal_subject")?.value || "")
    .trim()
    .toLowerCase();

  if (!allowed || !email) {
    return NextResponse.json(
      { error: "Login to your patient account before resending verification." },
      { status: 401 }
    );
  }

  const limit = await checkRateLimit({
    key: `auth:resend-email-verification:${email}:${getRequestIp(request)}`,
    limit: 3,
    windowSeconds: 60 * 60,
  });

  if (!limit.allowed) {
    return NextResponse.json(rateLimitPayload(limit), { status: 429 });
  }

  try {
    const result = await createAndSendPatientEmailVerification(email);

    return NextResponse.json({
      success: result.sent,
      alreadyVerified: result.alreadyVerified,
      message: result.message,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not send verification email." },
      { status: 500 }
    );
  }
}
