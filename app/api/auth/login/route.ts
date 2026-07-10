import { assertSameOrigin } from "@/lib/request-guard";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  createAdmin2faChallenge,
  sendAdmin2faEmail,
} from "@/lib/admin-2fa-store";
import {
  createPortalToken,
  PORTAL_SESSION_MAX_AGE_SECONDS,
} from "@/lib/portal-auth";
import {
  findPatientByEmail,
  hashPassword,
  isLegacyPasswordHash,
  updatePatientPasswordHash,
  verifyPassword,
} from "@/lib/patient-store";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/input-validation";
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
    maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
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

  if (!adminHash || !/^\$2[aby]\$\d{2}\$/.test(adminHash)) {
    return false;
  }

  return bcrypt.compare(password, adminHash);
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const body = (await request.json()) as LoginBody;

    const role = body.role;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const ip = getRequestIp(request);

    const [identityLimit, ipLimit] = await Promise.all([
      checkRateLimit({
        key: `auth:login:${role || "unknown"}:${email || "unknown"}`,
        limit: 8,
        windowSeconds: 15 * 60,
      }),
      checkRateLimit({
        key: `auth:login-ip:${ip}`,
        limit: 30,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!identityLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        rateLimitPayload(!identityLimit.allowed ? identityLimit : ipLimit),
        { status: 429 }
      );
    }

    if (!role || !email || !password) {
      return NextResponse.json(
        { error: "Email, password and role are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email) || password.length > 128 || Buffer.byteLength(password) > 72) {
      return NextResponse.json(
        { error: "Invalid login details." },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
      const isAdminEmail = email === adminEmail;
      const isAdminPassword = await verifyAdminPassword(password);

      if (!isAdminEmail || !isAdminPassword) {
        return NextResponse.json(
          { error: "Invalid admin login details." },
          { status: 401 }
        );
      }

      const admin2faEnabled =
        process.env.NODE_ENV === "production" ||
        process.env.ADMIN_2FA_ENABLED === "true";

      if (!admin2faEnabled) {
        const token = await createPortalToken("admin", email);
        const response = NextResponse.json({
          success: true,
          role: "admin",
          requiresTwoFactor: false,
        });

        return setPortalCookies(
          response,
          "admin",
          token,
          email,
          "Clinic Admin"
        );
      }

      const challenge = await createAdmin2faChallenge({
        adminEmail: email,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "",
      });

      const sent = await sendAdmin2faEmail({
        to: email,
        code: challenge.code,
      });

      if (!sent) {
        return NextResponse.json(
          { error: "Could not send admin verification email." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        role: "admin",
        requiresTwoFactor: true,
        challengeId: challenge.challengeId,
      });
    }

    const patient = await findPatientByEmail(email);

    if (!patient) {
      return NextResponse.json(
        { error: "Invalid patient login details. Use Google or Forgot Password if needed." },
        { status: 401 }
      );
    }

    if (!patient.passwordHash) {
      return NextResponse.json(
        { error: "Invalid patient login details. Use Google or Forgot Password if needed." },
        { status: 401 }
      );
    }

    const passwordOk = await verifyPassword(password, patient.passwordHash);

    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid patient login details." },
        { status: 401 }
      );
    }

    if (isLegacyPasswordHash(patient.passwordHash)) {
      await updatePatientPasswordHash(
        patient.email,
        await hashPassword(password)
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
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

