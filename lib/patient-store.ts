import bcrypt from "bcryptjs";
import { createHash } from "crypto";
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

function legacySha256(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function safeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;

  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function isLegacyPasswordHash(hash: string) {
  return /^[a-f0-9]{64}$/i.test(String(hash || ""));
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, storedHash: string) {
  const hash = String(storedHash || "");

  if (!hash) return false;

  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    return bcrypt.compare(password, hash);
  }

  if (isLegacyPasswordHash(hash)) {
    return safeEqualString(legacySha256(password), hash);
  }

  return false;
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

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapSupabasePatient);
}

export async function savePatients() {
  throw new Error("Filesystem patient storage is disabled. Supabase is required.");
}

export async function updatePatientPasswordHash(emailInput: string, passwordHash: string) {
  const email = emailInput.toLowerCase();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("patients")
    .update({ password_hash: passwordHash })
    .eq("email", email);

  if (error) {
    throw new Error(error.message);
  }
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
      password_hash: await hashPassword(input.password),
      mobile_verified: Boolean(input.mobileVerified),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Patient creation failed.");
  }

  return mapSupabasePatient(data);
}

export async function findPatientByEmail(emailInput: string) {
  const email = emailInput.toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSupabasePatient(data) : undefined;
}