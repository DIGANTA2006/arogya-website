import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function clean(value: string | null) {
  return String(value || "").trim();
}

export async function GET(request: Request) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = clean(searchParams.get("q")).toLowerCase();

  if (!query) {
    return NextResponse.json(
      { error: "Search by patient email or mobile number." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const phoneDigits = query.replace(/\D/g, "");
  const emailQuery = query.includes("@") ? query : "";

  let patientQuery = supabase.from("patients").select("*").limit(10);

  if (emailQuery && phoneDigits) {
    patientQuery = patientQuery.or(
      `email.ilike.%${emailQuery}%,phone.ilike.%${phoneDigits}%`
    );
  } else if (emailQuery) {
    patientQuery = patientQuery.ilike("email", `%${emailQuery}%`);
  } else {
    patientQuery = patientQuery.ilike("phone", `%${phoneDigits}%`);
  }

  const { data: patients, error: patientsError } = await patientQuery;

  if (patientsError) {
    return NextResponse.json(
      { error: "Patient search failed.", detail: patientsError.message },
      { status: 500 }
    );
  }

  const selectedPatient = patients?.[0];

  if (!selectedPatient) {
    return NextResponse.json({
      patient: null,
      patients: [],
      appointments: [],
      prescriptions: [],
    });
  }

  const patientEmail = String(selectedPatient.email || "").toLowerCase();
  const patientPhone = String(selectedPatient.phone || "");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .or(`email.eq.${patientEmail},phone.eq.${patientPhone}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_email", patientEmail)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    patient: selectedPatient,
    patients,
    appointments: appointments || [],
    prescriptions: prescriptions || [],
  });
}