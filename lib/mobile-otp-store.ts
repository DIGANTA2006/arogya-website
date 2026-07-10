import { createHash, randomInt } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type MobileOtp = {
  id: string;
  phone: string;
  otpHash: string;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
};

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "mobile-otps.json");

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for OTP hashing.");
  }

  return secret;
}

function hashOtp(phone: string, otp: string) {
  return createHash("sha256")
    .update(`${phone}:${otp}:${getAuthSecret()}`)
    .digest("hex");
}

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

export function createOtpCode() {
  return String(randomInt(100000, 999999));
}

export function cleanPhone(phone: string) {
  return normalizePhone(String(phone || "").trim());
}

export async function saveOtp(phoneInput: string, otp: string) {
  const phone = cleanPhone(phoneInput);
  const otpHash = hashOtp(phone, otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("mobile_otps").insert({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      verified: false,
    });
    return;
  }

  await ensureFile();

  const raw = await readFile(filePath, "utf8");
  const otps = JSON.parse(raw || "[]") as MobileOtp[];

  otps.unshift({
    id: crypto.randomUUID(),
    phone,
    otpHash,
    expiresAt,
    verified: false,
    createdAt: new Date().toISOString(),
  });

  await writeFile(filePath, JSON.stringify(otps, null, 2), "utf8");
}

export async function verifyOtp(phoneInput: string, otp: string) {
  const phone = cleanPhone(phoneInput);
  const otpHash = hashOtp(phone, otp);
  const now = new Date();

  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data } = await supabase
      .from("mobile_otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp_hash", otpHash)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return false;
    }

    if (new Date(data.expires_at) < now) {
      return false;
    }

    await supabase
      .from("mobile_otps")
      .update({ verified: true })
      .eq("id", data.id);

    return true;
  }

  await ensureFile();

  const raw = await readFile(filePath, "utf8");
  const otps = JSON.parse(raw || "[]") as MobileOtp[];

  const found = otps.find(
    (item) =>
      item.phone === phone &&
      item.otpHash === otpHash &&
      !item.verified &&
      new Date(item.expiresAt) >= now
  );

  if (!found) {
    return false;
  }

  found.verified = true;
  await writeFile(filePath, JSON.stringify(otps, null, 2), "utf8");

  return true;
}

export async function markPatientMobileVerified(email: string, phoneInput: string) {
  const supabase = getSupabaseAdmin();
  const phone = cleanPhone(phoneInput);

  if (supabase) {
    const { data, error } = await supabase
      .from("patients")
      .update({ mobile_verified: true, phone })
      .eq("email", email.toLowerCase())
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message || "Patient account not found.");
    }
  }
}

