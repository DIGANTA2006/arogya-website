import { NextResponse } from "next/server";
import { createSignature } from "../auth-utils";
import { createPatient, findPatientByEmail } from "@/lib/patient-store";

type Body = {
  email?: string;
  name?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "Patient").trim();

  if (!email) {
    return NextResponse.json(
      { error: "Email not found from social login." },
      { status: 400 }
    );
  }

  let patient = await findPatientByEmail(email);

  if (!patient) {
    patient = await createPatient({
      name,
      age: "",
      phone: "",
      email,
      password: crypto.randomUUID(),
    });
  }

  const role = "client";
  const token = await createSignature(role);

  const response = NextResponse.json({ success: true });

  response.cookies.set("portal_role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set("portal_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set("portal_email", patient.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set("portal_name", patient.name, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}


