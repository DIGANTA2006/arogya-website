import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
import { normalizeIndianPhone } from "@/lib/input-validation";
type Body = {
  phone?: string;
  mobile?: string;
};

function toE164Indian(phoneInput: string) {
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) throw new Error("Enter a valid Indian mobile number.");
  return `+${phone}`;
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
    const cleanMobile = normalizeIndianPhone(rawPhone);
    const to = toE164Indian(rawPhone);
    const ip = getRequestIp(request);

    const [phoneLimit, ipLimit] = await Promise.all([
      checkRateLimit({
        key: `auth:send-mobile-otp:${cleanMobile || "unknown"}`,
        limit: 5,
        windowSeconds: 15 * 60,
      }),
      checkRateLimit({
        key: `auth:send-mobile-otp-ip:${ip}`,
        limit: 12,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        rateLimitPayload(!phoneLimit.allowed ? phoneLimit : ipLimit),
        { status: 429 }
      );
    }

    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!serviceSid) {
      return NextResponse.json(
        { error: "TWILIO_VERIFY_SERVICE_SID is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: getTwilioAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          Channel: "sms",
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.message || "OTP SMS could not be sent.",
          detail: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
      phone: cleanMobile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OTP send failed.",
      },
      { status: 400 }
    );
  }
}