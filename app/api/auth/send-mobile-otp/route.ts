import { NextResponse } from "next/server";
import { cleanPhone, createOtpCode, saveOtp } from "@/lib/mobile-otp-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type Body = {
  phone?: string;
  mobile?: string;
};

async function sendFast2SmsOtp(input: {
  phone: string;
  otp: string;
}) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return {
      sent: false,
      error: "FAST2SMS_API_KEY is not configured.",
      detail: null,
    };
  }

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      variables_values: input.otp,
      route: "otp",
      numbers: input.phone,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.return === false) {
    return {
      sent: false,
      error: data?.message || "Fast2SMS OTP could not be sent.",
      detail: data,
    };
  }

  return {
    sent: true,
    error: "",
    detail: data,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = cleanPhone(String(body.phone || body.mobile || ""));
    const ip = getRequestIp(request);

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Valid mobile number is required." },
        { status: 400 }
      );
    }

    const limit = await checkRateLimit({
      key: `auth:send-mobile-otp:${phone}:${ip}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    const otp = createOtpCode();

    await saveOtp(phone, otp);

    const sms = await sendFast2SmsOtp({
      phone,
      otp,
    });

    if (!sms.sent && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error: sms.error || "OTP SMS could not be sent.",
          detail: sms.detail,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sms.sent
        ? "OTP sent successfully."
        : "OTP generated. Fast2SMS is not configured.",
      devOtp: sms.sent ? undefined : otp,
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