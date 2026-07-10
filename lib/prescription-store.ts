import { verifyUploadedDocument } from "@/lib/file-validation";
import {
  isValidEmail,
  normalizeEmail,
  normalizeOptionalDate,
} from "@/lib/input-validation";
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

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export async function getPrescriptions(patientEmail?: string): Promise<Prescription[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("prescriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (patientEmail) {
    query = query.eq("patient_email", normalizeEmail(patientEmail));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
}

export async function getPrescriptionByToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("secure_token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : undefined;
}

export async function createPrescription(input: {
  patientEmail: string;
  appointmentId?: string;
  title: string;
  file: File;
  nextTherapyDate?: string;
  nextAppointmentDate?: string;
}) {
  const patientEmail = normalizeEmail(input.patientEmail);
  const title = String(input.title || "Prescription").trim();
  const nextTherapyDate = normalizeOptionalDate(input.nextTherapyDate);
  const nextAppointmentDate = normalizeOptionalDate(input.nextAppointmentDate);

  if (!isValidEmail(patientEmail)) {
    throw new Error("A valid patient email is required.");
  }

  if (!title || title.length > 160) {
    throw new Error("Prescription title must be between 1 and 160 characters.");
  }

  if (input.nextTherapyDate && !nextTherapyDate) {
    throw new Error("Next therapy date is invalid.");
  }

  if (input.nextAppointmentDate && !nextAppointmentDate) {
    throw new Error("Next appointment date is invalid.");
  }

  const today = indiaToday();
  if (
    (nextTherapyDate && nextTherapyDate < today) ||
    (nextAppointmentDate && nextAppointmentDate < today)
  ) {
    throw new Error("Follow-up dates cannot be in the past.");
  }

  const verifiedFile = await verifyUploadedDocument({
    file: input.file,
    maxBytes: 20 * 1024 * 1024,
    label: "Prescription",
  });
  const originalBase =
    String(input.file.name || "prescription")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "prescription";
  const token = crypto.randomUUID();
  const safeEmail = patientEmail.replace(/[^a-zA-Z0-9@._+-]/g, "-");
  const storagePath = `${safeEmail}/${token}-${originalBase}.${verifiedFile.extension}`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from("prescriptions")
    .upload(storagePath, verifiedFile.buffer, {
      contentType: verifiedFile.contentType,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_email: patientEmail,
      appointment_id: input.appointmentId || null,
      title,
      file_path: storagePath,
      secure_token: token,
      next_therapy_date: nextTherapyDate || null,
      next_appointment_date: nextAppointmentDate || null,
      reminder_sent: false,
    })
    .select()
    .single();

  if (error || !data) {
    await supabase.storage.from("prescriptions").remove([storagePath]);
    throw new Error(error?.message || "Prescription upload failed.");
  }

  return mapRow(data);
}

export async function deletePrescriptionById(idInput: string) {
  const id = String(idInput || "").trim();
  if (!id) return false;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id,file_path")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;

  const { error: deleteError } = await supabase
    .from("prescriptions")
    .delete()
    .eq("id", id);

  if (deleteError) throw new Error(deleteError.message);

  if (data.file_path) {
    const { error: storageError } = await supabase.storage
      .from("prescriptions")
      .remove([String(data.file_path)]);

    if (storageError) {
      console.error("[prescription-store] Orphaned storage cleanup failed.", storageError);
    }
  }

  return true;
}

export async function markPrescriptionReminderSent(idInput: string) {
  const id = String(idInput || "").trim();
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("prescriptions")
    .update({ reminder_sent: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getPrescriptionDownload(prescription: Prescription) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from("prescriptions")
    .createSignedUrl(prescription.filePath, 60 * 5);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Prescription download unavailable.");
  }

  return { redirectUrl: data.signedUrl };
}