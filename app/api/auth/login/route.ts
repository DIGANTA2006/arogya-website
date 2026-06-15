import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createPortalToken } from "@/lib/portal-auth";
import {
  findPatientByEmail,
  hashPassword,
  isLegacyPasswordHash,
  updatePatientPasswordHash,
  verifyPassword,
} from "@/lib/patient-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

type LoginBody = {
  role?: "admin" | "client";
  email?: string;
  password?: string;
};

function setPortalCookies(
  response: NextResponse,
  role: "admin" | "client",
  token: string,
  email: string,
  name: string
) {
  const subject = email.toLowerCase();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  response.cookies.set("portal_role", role, cookieOptions);
  response.cookies.set("portal_token", token, cookieOptions);
  response.cookies.set("portal_subject", subject, cookieOptions);
  response.cookies.set("portal_email", subject, cookieOptions);
  response.cookies.set("portal_name", name, cookieOptions);

  return response;
}

async function verifyAdminPassword(password: string) {
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminHash) {
    return false;
  }

  return bcrypt.compare(password, adminHash);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const role = body.role;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const ip = getRequestIp(request);

    const limit = await checkRateLimit({
      key: `auth:login:${role || "unknown"}:${email || "unknown"}:${ip}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    if (!role || !email || !password) {
      return NextResponse.json(
        { error: "Email, password and role are required." },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
      const isAdminEmail = email === adminEmail;
      const isAdminPassword = await verifyAdminPassword(password);

      if (!isAdminEmail || !isAdminPassword) {
        return NextResponse.json({ error: "Invalid admin login details." }, { status: 401 });
      }

      const token = await createPortalToken("admin", email);
      const response = NextResponse.json({ success: true, role: "admin" });

      return setPortalCookies(
        response,
        "admin",
        token,
        email,
        "Clinic Admin"
      );
    }

    const patient = await findPatientByEmail(email);

    if (!patient) {
      return NextResponse.json(
        { error: "No patient account found. Please register first or continue with Google." },
        { status: 401 }
      );
    }

    if (!patient.passwordHash) {
      return NextResponse.json(
        { error: "No password is set for this account. Please use the password setup email sent by the clinic, or click Forgot Password to create your password." },
        { status: 401 }
      );
    }

    const passwordOk = await verifyPassword(password, patient.passwordHash);

    if (!passwordOk) {
      return NextResponse.json({ error: "Invalid patient login details." }, { status: 401 });
    }

    if (isLegacyPasswordHash(patient.passwordHash)) {
      await updatePatientPasswordHash(patient.email, await hashPassword(password));
    }

    if (!patient.mobileVerified) {
      return NextResponse.json(
        { error: "Please verify your mobile number before login." },
        { status: 403 }
      );
    }

    const token = await createPortalToken("client", patient.email);
    const response = NextResponse.json({ success: true, role: "client" });

    return setPortalCookies(
      response,
      "client",
      token,
      patient.email,
      patient.name
    );
  } catch (error) {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}