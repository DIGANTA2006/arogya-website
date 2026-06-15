import { NextResponse } from "next/server";
import { cleanPhone, verifyOtp } from "@/lib/mobile-otp-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type Body = {
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  const phone = cleanPhone(String(body.phone || ""));
  const otp = String(body.otp || "").trim();
  const ip = getRequestIp(request);

  const limit = await checkRateLimit({
    key: `auth:verify-otp:${phone || "unknown"}:${ip}`,
    limit: 5,
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    return NextResponse.json(rateLimitPayload(limit), { status: 429 });
  }

  if (!phone || !otp) {
    return NextResponse.json(
      { error: "Mobile number and OTP are required." },
      { status: 400 }
    );
  }

  const valid = await verifyOtp(phone, otp);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired OTP." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Mobile number verified successfully.",
  });

  response.cookies.set("verified_mobile", phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });

  return response;
}