import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type Patient = {
  id: string;
  name: string;
  age: string;
  phone: string;
  email: string;
  passwordHash: string;
  mobileVerified: boolean;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "patients.json");

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function mapSupabasePatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    age: row.age || "",
    phone: row.phone || "",
    email: row.email,
    passwordHash: row.password_hash || "",
    mobileVerified: Boolean(row.mobile_verified),
    createdAt: row.created_at,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map(mapSupabasePatient);
    }
  }

  await ensureFile();

  const raw = await readFile(filePath, "utf8");

  try {
    const data = JSON.parse(raw) as Patient[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function savePatients(patients: Patient[]) {
  await ensureFile();
  await writeFile(filePath, JSON.stringify(patients, null, 2), "utf8");
}

export async function createPatient(input: {
  name: string;
  age: string;
  phone: string;
  email: string;
  password: string;
  mobileVerified?: boolean;
}) {
  const email = input.email.toLowerCase();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const existing = await findPatientByEmail(email);

    if (existing) {
      throw new Error("Patient already exists.");
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: input.name,
        age: input.age,
        phone: input.phone,
        email,
        password_hash: hashPassword(input.password),
        mobile_verified: Boolean(input.mobileVerified),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Patient creation failed.");
    }

    return mapSupabasePatient(data);
  }

  const patients = await getPatients();

  const exists = patients.some(
    (patient) => patient.email.toLowerCase() === email
  );

  if (exists) {
    throw new Error("Patient already exists.");
  }

  const patient: Patient = {
    id: crypto.randomUUID(),
    name: input.name,
    age: input.age,
    phone: input.phone,
    email,
    passwordHash: hashPassword(input.password),
    mobileVerified: Boolean(input.mobileVerified),
    createdAt: new Date().toISOString(),
  };

  patients.unshift(patient);
  await savePatients(patients);

  return patient;
}

export async function findPatientByEmail(emailInput: string) {
  const email = emailInput.toLowerCase();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!error && data) {
      return mapSupabasePatient(data);
    }

    return undefined;
  }

  const patients = await getPatients();

  return patients.find(
    (patient) => patient.email.toLowerCase() === email
  );
}
