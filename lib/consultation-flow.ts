import { createHash } from "crypto";

export const DEFAULT_ONLINE_CONSULTATION_FEE = 500;

export function cleanText(value: unknown) {
  return String(value || "").trim();
}

export function isOnlineAppointmentType(value: unknown) {
  const text = cleanText(value).toLowerCase();

  return (
    text.includes("online") ||
    text.includes("video") ||
    text.includes("meet")
  );
}

export function getOnlineConsultationFee() {
  const raw = process.env.NEXT_PUBLIC_ONLINE_CONSULTATION_FEE;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }

  return DEFAULT_ONLINE_CONSULTATION_FEE;
}

function getRequiredAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET env var is required and must be at least 32 characters.");
  }

  return secret;
}

export function buildSecureOnlineMeetingUrl(appointmentId: string) {
  const safeAppointmentId = cleanText(appointmentId);

  if (!safeAppointmentId) {
    throw new Error("Appointment ID is required for meeting link.");
  }

  const secret = getRequiredAuthSecret();
  const roomHash = createHash("sha256")
    .update(`${secret}:online-meeting:${safeAppointmentId}`)
    .digest("hex")
    .slice(0, 32);

  return `https://meet.jit.si/ArogyaSpeechTherapy-${roomHash}`;
}
