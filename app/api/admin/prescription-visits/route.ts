import { NextResponse } from "next/server";
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

async function ensurePatientRecord(input: {
  name: string;
  email: string;
  phone: string;
  age: string;
}) {
  const email = input.email.toLowerCase();

  const existing = await findPatientByEmail(email).catch(() => undefined);

  if (existing) {
    return { created: false, patient: existing };
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

    return { created: true, patient: data };
  }

  const patient = await createPatient({
    name: input.name,
    age: input.age || "",
    phone: input.phone || "",
    email,
    password: crypto.randomUUID(),
    mobileVerified: false,
  });

  return { created: true, patient };
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