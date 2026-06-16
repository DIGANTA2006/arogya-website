import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  cleanPhone,
  markPatientMobileVerified,
  verifyOtp,
} from "@/lib/mobile-otp-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type Body = {
  phone?: string;
  mobile?: string;
  otp?: string;
  code?: string;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = cleanPhone(String(body.phone || body.mobile || ""));
    const otp = String(body.otp || body.code || "").trim();
    const ip = getRequestIp(request);

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required." },
        { status: 400 }
      );
    }

    const limit = await checkRateLimit({
      key: `auth:verify-mobile-otp:${phone}:${ip}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    const valid = await verifyOtp(phone, otp);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP." },
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
      await markPatientMobileVerified(email, phone).catch(() => undefined);
    }

    const response = NextResponse.json({
      success: true,
      message: "Mobile number verified successfully.",
      phone,
      mobileVerified: true,
    });

    response.cookies.set("verified_mobile", phone, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OTP verification failed.",
      },
      { status: 400 }
    );
  }
}