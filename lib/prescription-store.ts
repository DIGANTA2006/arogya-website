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

export async function getPrescriptions(patientEmail?: string): Promise<Prescription[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("prescriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (patientEmail) {
    query = query.eq("patient_email", patientEmail.toLowerCase());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRow);
}

export async function getPrescriptionByToken(token: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("secure_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

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
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const token = crypto.randomUUID();
  const storagePath = `${input.patientEmail.toLowerCase()}/${token}-${safeName}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from("prescriptions")
    .upload(storagePath, buffer, {
      contentType: input.file.type || "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

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

  if (error || !data) {
    throw new Error(error?.message || "Prescription upload failed.");
  }

  return mapRow(data);
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