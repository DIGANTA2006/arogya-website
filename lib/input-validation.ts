const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value: unknown) {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function normalizeIndianPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return digits;
  }

  return "";
}

export function normalizePatientAge(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return "";
  if (!/^\d{1,3}$/.test(text)) return "";

  const age = Number(text);
  return age >= 0 && age <= 120 ? String(age) : "";
}

export function validatePatientName(value: unknown) {
  const name = String(value || "").trim().replace(/\s+/g, " ");

  if (name.length < 2 || name.length > 100) return "";
  if (/[<>\u0000-\u001f]/.test(name)) return "";

  return name;
}

export function validatePassword(value: unknown) {
  const password = String(value || "");

  if (password.length < 8) {
    return { ok: false as const, error: "Password must be at least 8 characters." };
  }

  if (password.length > 128 || Buffer.byteLength(password, "utf8") > 72) {
    return {
      ok: false as const,
      error: "Password is too long. Use 72 bytes or fewer.",
    };
  }

  return { ok: true as const, password };
}

export function normalizeOptionalDate(value: unknown) {
  const date = String(value || "").trim();
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
    ? date
    : "";
}
