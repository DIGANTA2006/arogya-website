import { NextResponse } from "next/server";
import { cleanPhone, createOtpCode, saveOtp } from "@/lib/mobile-otp-store";
import { sendSms } from "@/lib/sms";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type Body = {
  phone?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const phone = cleanPhone(String(body.phone || ""));
  const ip = getRequestIp(request);

  const limit = await checkRateLimit({
    key: `auth:send-otp:${phone || "unknown"}:${ip}`,
    limit: 3,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    return NextResponse.json(rateLimitPayload(limit), { status: 429 });
  }

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: "Valid mobile number is required." },
      { status: 400 }
    );
  }

  const otp = createOtpCode();

  await saveOtp(phone, otp);

  const sms = await sendSms(
    phone,
    `Your Arogya verification OTP is ${otp}. It is valid for 10 minutes.`
  );

  if (!sms.sent && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "OTP SMS could not be sent. Please contact clinic." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: sms.sent
      ? "OTP sent successfully."
      : "OTP generated. SMS provider not configured.",
    devOtp: sms.sent ? undefined : otp,
  });
}