import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PrescriptionVisitStatus = "printed" | "scanned" | "uploaded" | "cancelled";

export type PrescriptionVisit = {
  id: string;
  rxNumber: string;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  appointmentId: string;
  appointmentType: string;
  uploadToken: string;
  status: PrescriptionVisitStatus;
  uploadedPrescriptionId: string;
  uploadedPrescriptionToken: string;
  printedAt: string;
  scannedAt: string;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "prescription-visits.json");

function getOptionalSupabaseAdmin() {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

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

function mapRow(row: any): PrescriptionVisit {
  return {
    id: String(row.id),
    rxNumber: String(row.rx_number || ""),
    patientEmail: String(row.patient_email || ""),
    patientName: String(row.patient_name || ""),
    patientPhone: String(row.patient_phone || ""),
    patientAge: String(row.patient_age || ""),
    appointmentId: String(row.appointment_id || ""),
    appointmentType: String(row.appointment_type || "Clinic Visit"),
    uploadToken: String(row.upload_token || ""),
    status: String(row.status || "printed") as PrescriptionVisitStatus,
    uploadedPrescriptionId: String(row.uploaded_prescription_id || ""),
    uploadedPrescriptionToken: String(row.uploaded_prescription_token || ""),
    printedAt: String(row.printed_at || ""),
    scannedAt: String(row.scanned_at || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function normalize(item: Partial<PrescriptionVisit>): PrescriptionVisit {
  return {
    id: item.id || crypto.randomUUID(),
    rxNumber: item.rxNumber || "",
    patientEmail: item.patientEmail || "",
    patientName: item.patientName || "",
    patientPhone: item.patientPhone || "",
    patientAge: item.patientAge || "",
    appointmentId: item.appointmentId || "",
    appointmentType: item.appointmentType || "Clinic Visit",
    uploadToken: item.uploadToken || crypto.randomUUID(),
    status: item.status || "printed",
    uploadedPrescriptionId: item.uploadedPrescriptionId || "",
    uploadedPrescriptionToken: item.uploadedPrescriptionToken || "",
    printedAt: item.printedAt || "",
    scannedAt: item.scannedAt || "",
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

async function getLocalVisits() {
  await ensureFile();

  const raw = await readFile(filePath, "utf8");

  try {
    const data = JSON.parse(raw || "[]") as Partial<PrescriptionVisit>[];
    return Array.isArray(data) ? data.map(normalize) : [];
  } catch {
    return [];
  }
}

async function saveLocalVisits(visits: PrescriptionVisit[]) {
  await ensureFile();
  await writeFile(filePath, JSON.stringify(visits, null, 2), "utf8");
}

export async function getPrescriptionVisits(): Promise<PrescriptionVisit[]> {
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map(mapRow);
    }
  }

  return getLocalVisits();
}

export async function getPrescriptionVisitById(id: string) {
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapRow(data);
    }
  }

  const visits = await getLocalVisits();
  return visits.find((visit) => visit.id === id);
}

export async function getPrescriptionVisitByToken(token: string) {
  const uploadToken = String(token || "").trim();

  if (!uploadToken) return undefined;

  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .select("*")
      .eq("upload_token", uploadToken)
      .maybeSingle();

    if (!error && data) {
      return mapRow(data);
    }
  }

  const visits = await getLocalVisits();
  return visits.find((visit) => visit.uploadToken === uploadToken);
}

async function generateRxNumber() {
  const year = new Date().getFullYear();
  const visits = await getPrescriptionVisits();

  const currentYearCount = visits.filter((visit) =>
    visit.rxNumber.startsWith(`RX-${year}-`)
  ).length;

  const sequence = String(currentYearCount + 1).padStart(6, "0");

  return `RX-${year}-${sequence}`;
}

export async function createPrescriptionVisit(input: {
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: string;
  appointmentId?: string;
  appointmentType?: string;
}) {
  const patientEmail = String(input.patientEmail || "").trim().toLowerCase();
  const patientName = String(input.patientName || "").trim();
  const patientPhone = String(input.patientPhone || "").trim();
  const patientAge = String(input.patientAge || "").trim();
  const appointmentId = String(input.appointmentId || "").trim();
  const appointmentType = String(input.appointmentType || "Clinic Visit").trim();

  if (!patientEmail || !patientName) {
    throw new Error("Patient name and email are required.");
  }

  const rxNumber = await generateRxNumber();
  const uploadToken = crypto.randomUUID();
  const now = new Date().toISOString();

  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .insert({
        rx_number: rxNumber,
        patient_email: patientEmail,
        patient_name: patientName,
        patient_phone: patientPhone || null,
        patient_age: patientAge || null,
        appointment_id: appointmentId || null,
        appointment_type: appointmentType,
        upload_token: uploadToken,
        status: "printed",
        printed_at: now,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Prescription visit creation failed.");
    }

    return mapRow(data);
  }

  const visits = await getLocalVisits();

  const visit: PrescriptionVisit = {
    id: crypto.randomUUID(),
    rxNumber,
    patientEmail,
    patientName,
    patientPhone,
    patientAge,
    appointmentId,
    appointmentType,
    uploadToken,
    status: "printed",
    uploadedPrescriptionId: "",
    uploadedPrescriptionToken: "",
    printedAt: now,
    scannedAt: "",
    createdAt: now,
  };

  visits.unshift(visit);
  await saveLocalVisits(visits);

  return visit;
}

export async function markPrescriptionVisitUploaded(
  id: string,
  input: {
    prescriptionId: string;
    secureToken: string;
  }
) {
  const now = new Date().toISOString();
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .update({
        status: "uploaded",
        scanned_at: now,
        uploaded_prescription_id: input.prescriptionId,
        uploaded_prescription_token: input.secureToken,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Prescription visit update failed.");
    }

    return mapRow(data);
  }

  const visits = await getLocalVisits();

  const updated = visits.map((visit) =>
    visit.id === id
      ? {
          ...visit,
          status: "uploaded" as PrescriptionVisitStatus,
          scannedAt: now,
          uploadedPrescriptionId: input.prescriptionId,
          uploadedPrescriptionToken: input.secureToken,
        }
      : visit
  );

  await saveLocalVisits(updated);

  return updated.find((visit) => visit.id === id);
}

export async function cancelPrescriptionVisit(id: string) {
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("prescription_visits")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Prescription visit cancellation failed.");
    }

    return mapRow(data);
  }

  const visits = await getLocalVisits();

  const updated = visits.map((visit) =>
    visit.id === id
      ? { ...visit, status: "cancelled" as PrescriptionVisitStatus }
      : visit
  );

  await saveLocalVisits(updated);

  return updated.find((visit) => visit.id === id);
}