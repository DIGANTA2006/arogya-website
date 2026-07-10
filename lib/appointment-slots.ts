import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const APPOINTMENT_SLOT_DURATION_MINUTES = 60;
export const APPOINTMENT_BOOKING_LEAD_MINUTES = 30;
export const APPOINTMENT_BOOKING_MAX_DAYS = 180;

export const APPOINTMENT_SLOT_TIMES = [
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

type SlotValidation = {
  ok: boolean;
  date?: string;
  time?: string;
  error?: string;
};

function getIndiaTodayString() {
  const parts = new Intl.DateTimeFormat("en-IN", {
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

function getIndiaCurrentMinutes() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function isRealIsoDate(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function normalizeTime(value: string) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return "";
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(time: string) {
  const normalized = normalizeTime(time);

  if (!normalized) return null;

  const [hourText, minuteText] = normalized.split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

function slotsOverlap(first: string, second: string) {
  const firstStart = timeToMinutes(first);
  const secondStart = timeToMinutes(second);

  if (firstStart === null || secondStart === null) return false;

  const firstEnd = firstStart + APPOINTMENT_SLOT_DURATION_MINUTES;
  const secondEnd = secondStart + APPOINTMENT_SLOT_DURATION_MINUTES;

  return firstStart < secondEnd && secondStart < firstEnd;
}

export function isOnlineAppointmentType(value: unknown) {
  const text = String(value || "").trim().toLowerCase();

  return (
    text.includes("online") ||
    text.includes("video") ||
    text.includes("meet")
  );
}

export function getAppointmentSlotTimes(_appointmentType?: string) {
  // One doctor calendar: online and physical appointments share the same slot pool.
  return APPOINTMENT_SLOT_TIMES;
}

export function validateAppointmentDate(dateValue: string): SlotValidation {
  const date = String(dateValue || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRealIsoDate(date)) {
    return {
      ok: false,
      error: "Please select a valid appointment date.",
    };
  }

  const today = getIndiaTodayString();

  if (date < today) {
    return {
      ok: false,
      error: "Past dates cannot be booked.",
    };
  }

  const todayTime = new Date(`${today}T00:00:00.000Z`).getTime();
  const selectedTime = new Date(`${date}T00:00:00.000Z`).getTime();
  const daysAhead = Math.round((selectedTime - todayTime) / (24 * 60 * 60 * 1000));

  if (daysAhead > APPOINTMENT_BOOKING_MAX_DAYS) {
    return {
      ok: false,
      error: `Appointments can be booked up to ${APPOINTMENT_BOOKING_MAX_DAYS} days ahead.`,
    };
  }

  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  if (day === 0) {
    return {
      ok: false,
      error: "Clinic is closed on Sunday. Please choose Monday to Saturday.",
    };
  }

  return {
    ok: true,
    date,
  };
}

export function validateClinicSlot(
  dateValue: string,
  timeValue: string,
  appointmentType = "Clinic Visit"
): SlotValidation {
  const dateValidation = validateAppointmentDate(dateValue);

  if (!dateValidation.ok) {
    return dateValidation;
  }

  const time = normalizeTime(timeValue);

  if (!time) {
    return {
      ok: false,
      error: "Please select a valid appointment time.",
    };
  }

  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const minutes = hour * 60 + minute;

  if (minute !== 0) {
    return {
      ok: false,
      error: "Please choose a 1-hour appointment slot, for example 2:00 PM or 3:00 PM.",
    };
  }

  if (minutes < 14 * 60 || minutes >= 18 * 60) {
    return {
      ok: false,
      error: "Appointment time must be between 2:00 PM and 6:00 PM.",
    };
  }

  const allowedSlots = getAppointmentSlotTimes(appointmentType);

  if (!allowedSlots.includes(time)) {
    return {
      ok: false,
      error: "This appointment time is not available.",
    };
  }

  if (
    dateValidation.date === getIndiaTodayString() &&
    minutes < getIndiaCurrentMinutes() + APPOINTMENT_BOOKING_LEAD_MINUTES
  ) {
    return {
      ok: false,
      error: `Same-day appointments must be booked at least ${APPOINTMENT_BOOKING_LEAD_MINUTES} minutes before the slot.`,
    };
  }

  return {
    ok: true,
    date: dateValidation.date,
    time,
  };
}

export async function isAppointmentSlotTaken(date: string, time: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointments")
    .select("id,appointment_time,status")
    .eq("appointment_date", date);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(
    (data || []).some((row: { appointment_time?: string; time?: string; status?: string }) => {
      if (String(row.status || "").toLowerCase() === "cancelled") return false;
      return slotsOverlap(time, row.appointment_time || row.time || "");
    })
  );
}

export async function validateAppointmentSlot(
  dateValue: string,
  timeValue: string,
  appointmentType = "Clinic Visit"
) {
  const validation = validateClinicSlot(dateValue, timeValue, appointmentType);

  if (!validation.ok || !validation.date || !validation.time) {
    return validation;
  }

  const taken = await isAppointmentSlotTaken(validation.date, validation.time);

  if (taken) {
    return {
      ok: false,
      error:
        "This 1-hour doctor slot is already booked. Please choose another time.",
    };
  }

  return validation;
}

export async function getAvailableSlots(dateValue: string, appointmentType = "Clinic Visit") {
  const dateValidation = validateAppointmentDate(dateValue);

  if (!dateValidation.ok || !dateValidation.date) {
    return {
      ok: false,
      error: dateValidation.error || "Invalid date.",
      slots: [] as string[],
      slotDurationMinutes: APPOINTMENT_SLOT_DURATION_MINUTES,
    };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointments")
    .select("appointment_time,status")
    .eq("appointment_date", dateValidation.date);

  if (error) {
    throw new Error(error.message);
  }

  const activeBookedTimes = (data || [])
    .filter((row: { appointment_time?: string; time?: string; status?: string }) => {
      return String(row.status || "").toLowerCase() !== "cancelled";
    })
    .map((row: { appointment_time?: string; time?: string }) =>
      normalizeTime(row.appointment_time || row.time || "")
    )
    .filter(Boolean);

  const slots = getAppointmentSlotTimes(appointmentType).filter((slot) => {
    const validNow = validateClinicSlot(
      dateValidation.date || "",
      slot,
      appointmentType
    );

    return (
      validNow.ok &&
      !activeBookedTimes.some((bookedTime) => slotsOverlap(slot, bookedTime))
    );
  });

  return {
    ok: true,
    date: dateValidation.date,
    appointmentType,
    slotDurationMinutes: APPOINTMENT_SLOT_DURATION_MINUTES,
    slots,
  };
}
