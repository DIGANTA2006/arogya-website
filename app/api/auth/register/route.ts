import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPatient } from "@/lib/patient-store";
import { cleanPhone } from "@/lib/mobile-otp-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type RegisterBody = {
  name?: string;
  age?: string;
  phone?: string;
  email?: string;
  password?: string;
  consent?: boolean;
};

function clean(value?: string) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;

    const name = clean(body.name);
    const age = clean(body.age);
    const phone = cleanPhone(clean(body.phone));
    const email = clean(body.email).toLowerCase();
    const password = clean(body.password);
    const consent = Boolean(body.consent);

    const ip = getRequestIp(request);

    const limit = await checkRateLimit({
      key: `auth:register:${email || phone || "unknown"}:${ip}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    if (!name || !age || !phone || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Please accept the Privacy Policy and consent notice before creating an account." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const verifiedMobile = cookieStore.get("verified_mobile")?.value;

    if (verifiedMobile !== phone) {
      return NextResponse.json(
        { error: "Please verify your mobile number with OTP before signup." },
        { status: 403 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const patient = await createPatient({
      name,
      age,
      phone,
      email,
      password,
      mobileVerified: true,
    });

    const response = NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
      },
    });

    response.cookies.set("verified_mobile", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Patient already exists or registration failed." },
      { status: 400 }
    );
  }
}