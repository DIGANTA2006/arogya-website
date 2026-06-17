import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const APPOINTMENT_SLOT_TIMES = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
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

export function validateAppointmentDate(dateValue: string): SlotValidation {
  const date = String(dateValue || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

export function validateClinicSlot(dateValue: string, timeValue: string): SlotValidation {
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

  if (minute !== 0 && minute !== 30) {
    return {
      ok: false,
      error: "Please choose a 30-minute appointment slot, for example 11:00 or 11:30.",
    };
  }

  if (minutes < 11 * 60 || minutes > 19 * 60 + 30) {
    return {
      ok: false,
      error: "Appointment time must be between 11:00 AM and 8:00 PM.",
    };
  }

  if (!APPOINTMENT_SLOT_TIMES.includes(time)) {
    return {
      ok: false,
      error: "This appointment time is not available.",
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
    .select("id")
    .eq("appointment_date", date)
    .eq("appointment_time", time)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data && data.length > 0);
}

export async function validateAppointmentSlot(dateValue: string, timeValue: string) {
  const validation = validateClinicSlot(dateValue, timeValue);

  if (!validation.ok || !validation.date || !validation.time) {
    return validation;
  }

  const taken = await isAppointmentSlotTaken(validation.date, validation.time);

  if (taken) {
    return {
      ok: false,
      error: "This appointment slot is already booked. Please choose another time.",
    };
  }

  return validation;
}

export async function getAvailableSlots(dateValue: string) {
  const dateValidation = validateAppointmentDate(dateValue);

  if (!dateValidation.ok || !dateValidation.date) {
    return {
      ok: false,
      error: dateValidation.error || "Invalid date.",
      slots: [] as string[],
    };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointments")
    .select("appointment_time")
    .eq("appointment_date", dateValidation.date);

  if (error) {
    throw new Error(error.message);
  }

  const booked = new Set(
    (data || [])
      .map((row: { appointment_time?: string; time?: string }) =>
        normalizeTime(row.appointment_time || row.time || "")
      )
      .filter(Boolean)
  );

  const slots = APPOINTMENT_SLOT_TIMES.filter((slot) => !booked.has(slot));

  return {
    ok: true,
    date: dateValidation.date,
    slots,
  };
}
