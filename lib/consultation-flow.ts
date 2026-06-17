import { createHash } from "crypto";

export const DEFAULT_ONLINE_CONSULTATION_FEE = 500;
export const MEETING_OPEN_BEFORE_MINUTES = 30;
export const MEETING_CLOSE_AFTER_HOURS = 8;

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

function parseClinicAppointmentDateTime(date: unknown, time: unknown) {
  const dateText = cleanText(date);
  const timeText = cleanText(time).slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeText)) return null;

  const parsed = new Date(`${dateText}T${timeText}:00+05:30`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

export function isMeetingWindowOpen(input: {
  date: unknown;
  time: unknown;
  now?: Date;
}) {
  const appointmentStart = parseClinicAppointmentDateTime(input.date, input.time);

  if (!appointmentStart) return false;

  const now = input.now || new Date();
  const openAt = new Date(
    appointmentStart.getTime() - MEETING_OPEN_BEFORE_MINUTES * 60 * 1000
  );
  const closeAt = new Date(
    appointmentStart.getTime() + MEETING_CLOSE_AFTER_HOURS * 60 * 60 * 1000
  );

  return now >= openAt && now <= closeAt;
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
