import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getAppointments } from "@/lib/appointment-store";
import { getPatients } from "@/lib/patient-store";

function clean(value?: string) {
  return String(value || "").trim();
}

function includesMatch(value: string, query: string) {
  return clean(value).toLowerCase().includes(query);
}

export async function GET(request: Request) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q") || "").toLowerCase();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [patients, appointments] = await Promise.all([
    getPatients().catch(() => []),
    getAppointments().catch(() => []),
  ]);

  const results: Array<{
    id: string;
    source: "patient" | "appointment";
    label: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientAge: string;
    appointmentId: string;
    appointmentType: string;
    date: string;
    time: string;
  }> = [];

  for (const patient of patients) {
    if (
      includesMatch(patient.name, query) ||
      includesMatch(patient.email, query) ||
      includesMatch(patient.phone, query)
    ) {
      results.push({
        id: `patient-${patient.id}`,
        source: "patient",
        label: `${patient.name} · ${patient.email}`,
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientAge: patient.age,
        appointmentId: "",
        appointmentType: "Clinic Visit",
        date: "",
        time: "",
      });
    }
  }

  for (const appointment of appointments) {
    if (
      includesMatch(appointment.name, query) ||
      includesMatch(appointment.email, query) ||
      includesMatch(appointment.phone, query) ||
      includesMatch(appointment.id, query) ||
      includesMatch(appointment.service, query)
    ) {
      results.push({
        id: `appointment-${appointment.id}`,
        source: "appointment",
        label: `${appointment.name} · ${appointment.service} · ${appointment.date || "No date"}`,
        patientName: appointment.name,
        patientEmail: appointment.email,
        patientPhone: appointment.phone,
        patientAge: appointment.age,
        appointmentId: appointment.id,
        appointmentType: appointment.appointmentType || appointment.service || "Clinic Visit",
        date: appointment.date,
        time: appointment.time,
      });
    }
  }

  const seen = new Set<string>();
  const uniqueResults = results.filter((item) => {
    const key = `${item.source}-${item.patientEmail}-${item.appointmentId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ results: uniqueResults.slice(0, 15) });
}