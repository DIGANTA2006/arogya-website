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
  const query = clean(searchParams.get("q"))
    .toLowerCase()
    .replace(/[,%()]/g, "")
    .slice(0, 120);

  if (!query) {
    return NextResponse.json(
      { error: "Search by patient email or mobile number." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const phoneDigits = query.replace(/\D/g, "");
  const emailQuery = query.includes("@") ? query : "";

  if (!emailQuery && phoneDigits.length < 4) {
    return NextResponse.json(
      { error: "Enter at least 4 mobile digits or a patient email." },
      { status: 400 }
    );
  }

  let patientQuery = supabase
    .from("patients")
    .select("id,name,email,phone,age,mobile_verified,email_verified,created_at")
    .limit(10);

  if (emailQuery) {
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

  const appointmentSelect =
    "id,name,age,phone,email,service,appointment_type,appointment_date,appointment_time,status,message,created_at";
  const appointmentRequests = [
    supabase
      .from("appointments")
      .select(appointmentSelect)
      .eq("email", patientEmail)
      .order("created_at", { ascending: false })
      .limit(50),
  ];

  if (patientPhone) {
    appointmentRequests.push(
      supabase
        .from("appointments")
        .select(appointmentSelect)
        .eq("phone", patientPhone)
        .order("created_at", { ascending: false })
        .limit(50)
    );
  }

  const appointmentResults = await Promise.all(appointmentRequests);
  const appointmentError = appointmentResults.find((result) => result.error)?.error;

  if (appointmentError) {
    return NextResponse.json(
      { error: "Appointment history failed.", detail: appointmentError.message },
      { status: 500 }
    );
  }

  const seenAppointments = new Set<string>();
  const appointments = appointmentResults
    .flatMap((result) => result.data || [])
    .filter((appointment) => {
      const id = String(appointment.id || "");
      if (!id || seenAppointments.has(id)) return false;
      seenAppointments.add(id);
      return true;
    })
    .sort((first, second) =>
      String(second.created_at || "").localeCompare(String(first.created_at || ""))
    )
    .slice(0, 50);

  const { data: prescriptions, error: prescriptionError } = await supabase
    .from("prescriptions")
    .select("id,title,patient_email,secure_token,next_therapy_date,next_appointment_date,created_at")
    .eq("patient_email", patientEmail)
    .order("created_at", { ascending: false })
    .limit(50);

  if (prescriptionError) {
    return NextResponse.json(
      { error: "Prescription history failed.", detail: prescriptionError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    patient: selectedPatient,
    patients,
    appointments,
    prescriptions: prescriptions || [],
  });
}