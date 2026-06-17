import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cleanPhone, markPatientMobileVerified } from "@/lib/mobile-otp-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
type Body = {
  phone?: string;
  mobile?: string;
  otp?: string;
  code?: string;
  email?: string;
};

function toE164Indian(phoneInput: string) {
  const phone = cleanPhone(phoneInput);

  if (!phone || phone.length < 10) {
    throw new Error("Valid mobile number is required.");
  }

  if (phone.length === 10) {
    return `+91${phone}`;
  }

  if (phone.length === 12 && phone.startsWith("91")) {
    return `+${phone}`;
  }

  throw new Error("Enter a valid Indian mobile number.");
}

function getTwilioAuthHeader() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio Account SID/Auth Token are not configured.");
  }

  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const body = (await request.json()) as Body;
    const rawPhone = String(body.phone || body.mobile || "").trim();
    const cleanMobile = cleanPhone(rawPhone);
    const to = toE164Indian(rawPhone);
    const code = String(body.otp || body.code || "").trim();
    const ip = getRequestIp(request);

    if (!code) {
      return NextResponse.json(
        { error: "OTP code is required." },
        { status: 400 }
      );
    }

    const limit = await checkRateLimit({
      key: `auth:verify-mobile-otp:${cleanMobile || "unknown"}:${ip}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!serviceSid) {
      return NextResponse.json(
        { error: "TWILIO_VERIFY_SERVICE_SID is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: getTwilioAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          Code: code,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== "approved") {
      return NextResponse.json(
        {
          error: data.message || "Invalid or expired OTP.",
          detail: data,
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const portalEmail = String(cookieStore.get("portal_email")?.value || "")
      .trim()
      .toLowerCase();

    const email = String(body.email || portalEmail || "")
      .trim()
      .toLowerCase();

    if (email) {
      await markPatientMobileVerified(email, cleanMobile).catch(() => undefined);
    }

    const result = NextResponse.json({
      success: true,
      message: "Mobile number verified successfully.",
      phone: cleanMobile,
      mobileVerified: true,
    });

    result.cookies.set("verified_mobile", cleanMobile, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 60,
    });

    return result;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OTP verification failed.",
      },
      { status: 400 }
    );
  }
}