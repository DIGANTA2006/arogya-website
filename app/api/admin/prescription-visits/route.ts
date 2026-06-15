import { NextResponse } from "next/server";
import {
  generateSecureToken,
  getSiteUrl,
  hashToken,
  sendAuthEmail,
} from "@/lib/auth-email";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  createPrescriptionVisit,
  getPrescriptionVisits,
} from "@/lib/prescription-visit-store";
import { createPatient, findPatientByEmail } from "@/lib/patient-store";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  patientEmail?: string;
  patientName?: string;
  patientPhone?: string;
  patientAge?: string;
  appointmentId?: string;
  appointmentType?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

function getOptionalSupabaseAdmin() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

async function sendPatientSetupPasswordEmail(input: {
  email: string;
  name: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || "Patient";
  const supabase = getOptionalSupabaseAdmin();

  if (!email || !supabase) {
    return false;
  }

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("password_reset_requests").insert({
    patient_email: email,
    token_hash: tokenHash,
    expires_at: expiresAt,
    used_at: null,
  });

  if (error) {
    return false;
  }

  const setupUrl = `${getSiteUrl()}/client/reset-password/${token}`;

  return sendAuthEmail({
    to: email,
    subject: "Set your Arogya patient portal password",
    title: "Your Arogya patient portal is ready",
    message: `Hello ${name}, the clinic has created your patient portal account. Please set your password to access prescriptions, reports, and appointment details. This link will expire in 7 days.`,
    actionText: "Set My Password",
    actionUrl: setupUrl,
  });
}

async function ensurePatientRecord(input: {
  name: string;
  email: string;
  phone: string;
  age: string;
}) {
  const email = input.email.toLowerCase();

  const existing = await findPatientByEmail(email).catch(() => undefined);

  if (existing) {
    let setupEmailSent = false;

    if (!existing.passwordHash) {
      setupEmailSent = await sendPatientSetupPasswordEmail({
        email,
        name: existing.name || input.name,
      }).catch(() => false);
    }

    return {
      created: false,
      patient: existing,
      setupEmailSent,
    };
  }

  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: input.name,
        age: input.age || "",
        phone: input.phone || "",
        email,
        password_hash: null,
        mobile_verified: false,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Patient account creation failed.");
    }

    const setupEmailSent = await sendPatientSetupPasswordEmail({
      email,
      name: input.name,
    }).catch(() => false);

    return {
      created: true,
      patient: data,
      setupEmailSent,
    };
  }

  const patient = await createPatient({
    name: input.name,
    age: input.age || "",
    phone: input.phone || "",
    email,
    password: crypto.randomUUID(),
    mobileVerified: false,
  });

  return {
    created: true,
    patient,
    setupEmailSent: false,
  };
}

export async function GET() {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const visits = await getPrescriptionVisits();

  return NextResponse.json({ visits });
}

export async function POST(request: Request) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Body;

    const patientName = clean(body.patientName);
    const patientEmail = clean(body.patientEmail).toLowerCase();
    const patientPhone = clean(body.patientPhone);
    const patientAge = clean(body.patientAge);

    if (!patientName || !patientEmail) {
      return NextResponse.json(
        { error: "Patient name and email are required." },
        { status: 400 }
      );
    }

    const patientResult = await ensurePatientRecord({
      name: patientName,
      email: patientEmail,
      phone: patientPhone,
      age: patientAge,
    });

    const visit = await createPrescriptionVisit({
      patientEmail,
      patientName,
      patientPhone,
      patientAge,
      appointmentId: clean(body.appointmentId),
      appointmentType: clean(body.appointmentType || "Clinic Visit"),
    });

    return NextResponse.json({
      success: true,
      visit,
      patientCreated: patientResult.created,
      setupEmailSent: patientResult.setupEmailSent,
      patient: patientResult.patient,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Prescription visit could not be created.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}