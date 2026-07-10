import { NextResponse } from "next/server";
import {
  getAppointments,
  updateAppointmentStatus,
} from "@/lib/appointment-store";
import {
  getPaymentProofRetentionDays,
  isAppointmentPast,
  isOnlineAppointmentType,
} from "@/lib/consultation-flow";
import { getPaymentByAppointmentForPatient } from "@/lib/payment-store";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const PAYMENT_BUCKET = "payment-proofs";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";

  if (!cronSecret) return false;

  return auth === `Bearer ${cronSecret}`;
}

async function autoCompletePastAppointments() {
  const appointments = await getAppointments();
  let completed = 0;

  for (const appointment of appointments) {
    if (appointment.status === "Completed" || appointment.status === "Cancelled") {
      continue;
    }

    if (!isAppointmentPast({ date: appointment.date, time: appointment.time })) {
      continue;
    }

    if (isOnlineAppointmentType(appointment.appointmentType)) {
      const payment = await getPaymentByAppointmentForPatient({
        appointmentId: appointment.id,
        patientEmail: appointment.email,
      });

      if (payment?.status !== "paid") {
        continue;
      }
    }

    const updated = await updateAppointmentStatus(appointment.id, "Completed");

    if (updated) {
      completed += 1;
    }
  }

  return completed;
}

async function cleanupOldPaymentProofs() {
  const supabase = getSupabaseAdmin();
  const retentionDays = getPaymentProofRetentionDays();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from("appointment_payments")
    .select("id,screenshot_url,status,created_at,verified_at")
    .not("screenshot_url", "is", null)
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data || [];
  const pathsToDelete: string[] = [];
  const idsToClear: string[] = [];

  for (const row of rows) {
    const storagePath = String(row.screenshot_url || "");
    const status = String(row.status || "");
    const dateSource = row.verified_at || row.created_at;
    const timestamp = dateSource ? new Date(dateSource).getTime() : 0;

    if (!storagePath || !timestamp) continue;

    const canDelete =
      (status === "paid" || status === "rejected") && timestamp < cutoff;

    if (!canDelete) continue;

    pathsToDelete.push(storagePath);
    idsToClear.push(String(row.id));
  }

  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .remove(pathsToDelete);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  if (idsToClear.length > 0) {
    const { error: updateError } = await supabase
      .from("appointment_payments")
      .update({ screenshot_url: null })
      .in("id", idsToClear);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return {
    retentionDays,
    checked: rows.length,
    deletedProofFiles: pathsToDelete.length,
    clearedPaymentRows: idsToClear.length,
  };
}

async function cleanupExpiredAuthArtifacts() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const tables = [
    "password_reset_requests",
    "email_verification_tokens",
    "admin_2fa_challenges",
  ];
  let deleted = 0;

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .lt("expires_at", now)
      .select("id");

    if (error) throw new Error(error.message);
    deleted += data?.length || 0;
  }

  return { tablesChecked: tables.length, deleted };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const completedAppointments = await autoCompletePastAppointments();
  const [paymentProofCleanup, authArtifactCleanup] = await Promise.all([
    cleanupOldPaymentProofs(),
    cleanupExpiredAuthArtifacts(),
  ]);

  return NextResponse.json({
    success: true,
    completedAppointments,
    paymentProofCleanup,
    authArtifactCleanup,
  });
}
