import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type AppointmentStatus = "New" | "Confirmed" | "Completed" | "Cancelled";

export type Appointment = {
  id: string;
  name: string;
  age: string;
  phone: string;
  email: string;
  service: string;
  appointmentType: string;
  date: string;
  time: string;
  message: string;
  status: AppointmentStatus;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "appointments.json");

function getAdminOrNull() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

function normalizeAppointment(item: Partial<Appointment>): Appointment {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name || "",
    age: item.age || "",
    phone: item.phone || "",
    email: item.email || "",
    service: item.service || "",
    appointmentType: item.appointmentType || "Clinic Visit",
    date: item.date || "",
    time: item.time || "",
    message: item.message || "",
    status: item.status || "New",
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function mapRow(row: any): Appointment {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    age: String(row.age || ""),
    phone: String(row.phone || ""),
    email: String(row.email || row.patient_email || ""),
    service: String(row.service || ""),
    appointmentType: String(row.appointment_type || row.appointmentType || "Clinic Visit"),
    date: String(row.appointment_date || row.date || ""),
    time: String(row.appointment_time || row.time || ""),
    message: String(row.message || ""),
    status: (row.status || "New") as AppointmentStatus,
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
  };
}

export async function getAppointments(): Promise<Appointment[]> {
  const supabase = getAdminOrNull();

  if (supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map(mapRow);
    }
  }

  await ensureFile();

  const raw = await readFile(filePath, "utf8");

  try {
    const data = JSON.parse(raw) as Partial<Appointment>[];
    return Array.isArray(data) ? data.map(normalizeAppointment) : [];
  } catch {
    return [];
  }
}

export async function saveAppointments(appointments: Appointment[]) {
  await ensureFile();
  await writeFile(filePath, JSON.stringify(appointments, null, 2), "utf8");
}

export async function addAppointment(
  input: Omit<Appointment, "id" | "status" | "createdAt">
) {
  const supabase = getAdminOrNull();

  if (supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_email: input.email.toLowerCase(),
        name: input.name,
        age: input.age,
        phone: input.phone,
        email: input.email.toLowerCase(),
        service: input.service,
        appointment_type: input.appointmentType,
        appointment_date: input.date,
        appointment_time: input.time,
        message: input.message,
        status: "New",
      })
      .select("*")
      .single();

    if (!error && data) {
      return mapRow(data);
    }

    if (error) {
      throw new Error(error.message);
    }
  }

  const appointments = await getAppointments();

  const appointment: Appointment = {
    id: crypto.randomUUID(),
    ...input,
    status: "New",
    createdAt: new Date().toISOString(),
  };

  appointments.unshift(appointment);
  await saveAppointments(appointments);

  return appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  const supabase = getAdminOrNull();

  if (supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return mapRow(data);
    }
  }

  const appointments = await getAppointments();

  const updatedAppointments = appointments.map((appointment) =>
    appointment.id === id ? { ...appointment, status } : appointment
  );

  await saveAppointments(updatedAppointments);

  return updatedAppointments.find((appointment) => appointment.id === id);
}