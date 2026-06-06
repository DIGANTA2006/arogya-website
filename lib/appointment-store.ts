import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

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

export async function getAppointments(): Promise<Appointment[]> {
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
  const appointments = await getAppointments();

  const updatedAppointments = appointments.map((appointment) =>
    appointment.id === id ? { ...appointment, status } : appointment
  );

  await saveAppointments(updatedAppointments);

  return updatedAppointments.find((appointment) => appointment.id === id);
}


