import { NextResponse } from "next/server";
import { cleanPhone, verifyOtp } from "@/lib/mobile-otp-store";

type Body = {
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  const phone = cleanPhone(String(body.phone || ""));
  const otp = String(body.otp || "").trim();

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

