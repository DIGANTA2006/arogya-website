import { NextResponse } from "next/server";
import { createPortalToken } from "@/lib/portal-auth";
import { findPatientByEmail, hashPassword } from "@/lib/patient-store";

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
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };

  response.cookies.set("portal_role", role, cookieOptions);
  response.cookies.set("portal_token", token, cookieOptions);
  response.cookies.set("portal_email", email, cookieOptions);
  response.cookies.set("portal_name", name, cookieOptions);

  return response;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const role = body.role;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!role || !email || !password) {
      return NextResponse.json(
        { error: "Email, password and role are required." },
        { status: 400 }
      );
    }

    if (role === "admin") {
      const isAdmin =
        email === String(process.env.ADMIN_EMAIL || "").toLowerCase() &&
        password === process.env.ADMIN_PASSWORD;

      if (!isAdmin) {
        return NextResponse.json({ error: "Invalid admin login details." }, { status: 401 });
      }

      const token = await createPortalToken("admin");
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
        { error: "This account was created using Google. Please continue with Google login." },
        { status: 401 }
      );
    }

    if (patient.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid patient login details." }, { status: 401 });
    }

    if (!patient.mobileVerified) {
      return NextResponse.json(
        { error: "Please verify your mobile number before login." },
        { status: 403 }
      );
    }

    const token = await createPortalToken("client");
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