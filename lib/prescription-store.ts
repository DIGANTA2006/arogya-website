import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type Prescription = {
  id: string;
  patientEmail: string;
  appointmentId: string;
  title: string;
  filePath: string;
  secureToken: string;
  nextTherapyDate: string;
  nextAppointmentDate: string;
  reminderSent: boolean;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const uploadDir = join(dataDir, "uploads", "prescriptions");
const filePath = join(dataDir, "prescriptions.json");

async function ensureFile() {
  await mkdir(uploadDir, { recursive: true });
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

function mapRow(row: any): Prescription {
  return {
    id: row.id,
    patientEmail: row.patient_email,
    appointmentId: row.appointment_id || "",
    title: row.title,
    filePath: row.file_path,
    secureToken: row.secure_token,
    nextTherapyDate: row.next_therapy_date || "",
    nextAppointmentDate: row.next_appointment_date || "",
    reminderSent: Boolean(row.reminder_sent),
    createdAt: row.created_at,
  };
}

function normalize(item: Partial<Prescription>): Prescription {
  return {
    id: item.id || crypto.randomUUID(),
    patientEmail: item.patientEmail || "",
    appointmentId: item.appointmentId || "",
    title: item.title || "Prescription",
    filePath: item.filePath || "",
    secureToken: item.secureToken || crypto.randomUUID(),
    nextTherapyDate: item.nextTherapyDate || "",
    nextAppointmentDate: item.nextAppointmentDate || "",
    reminderSent: Boolean(item.reminderSent),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

export async function getPrescriptions(patientEmail?: string): Promise<Prescription[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
    if (patientEmail) query = query.eq("patient_email", patientEmail.toLowerCase());
    const { data, error } = await query;
    if (!error && data) return data.map(mapRow);
  }

  await ensureFile();
  const raw = await readFile(filePath, "utf8");
  const items = JSON.parse(raw || "[]").map(normalize) as Prescription[];
  return patientEmail ? items.filter((item) => item.patientEmail.toLowerCase() === patientEmail.toLowerCase()) : items;
}

export async function getPrescriptionByToken(token: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("prescriptions").select("*").eq("secure_token", token).maybeSingle();
    if (!error && data) return mapRow(data);
  }
  const items = await getPrescriptions();
  return items.find((item) => item.secureToken === token);
}

export async function createPrescription(input: {
  patientEmail: string;
  appointmentId?: string;
  title: string;
  file: File;
  nextTherapyDate?: string;
  nextAppointmentDate?: string;
}) {
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const token = crypto.randomUUID();
  const storagePath = `${input.patientEmail.toLowerCase()}/${token}-${safeName}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error: uploadError } = await supabase.storage
      .from("prescriptions")
      .upload(storagePath, buffer, { contentType: input.file.type || "application/pdf", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        patient_email: input.patientEmail.toLowerCase(),
        appointment_id: input.appointmentId || null,
        title: input.title || "Prescription",
        file_path: storagePath,
        secure_token: token,
        next_therapy_date: input.nextTherapyDate || null,
        next_appointment_date: input.nextAppointmentDate || null,
        reminder_sent: false,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || "Prescription upload failed.");
    return mapRow(data);
  }

  await ensureFile();
  await writeFile(join(uploadDir, `${token}-${safeName}`), buffer);
  const items = await getPrescriptions();
  const prescription: Prescription = {
    id: crypto.randomUUID(),
    patientEmail: input.patientEmail.toLowerCase(),
    appointmentId: input.appointmentId || "",
    title: input.title || "Prescription",
    filePath: `${token}-${safeName}`,
    secureToken: token,
    nextTherapyDate: input.nextTherapyDate || "",
    nextAppointmentDate: input.nextAppointmentDate || "",
    reminderSent: false,
    createdAt: new Date().toISOString(),
  };
  items.unshift(prescription);
  await writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
  return prescription;
}

export async function getPrescriptionDownload(prescription: Prescription) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.storage.from("prescriptions").createSignedUrl(prescription.filePath, 60 * 5);
    if (!error && data?.signedUrl) return { redirectUrl: data.signedUrl };
  }
  return { localPath: join(uploadDir, prescription.filePath) };
}
