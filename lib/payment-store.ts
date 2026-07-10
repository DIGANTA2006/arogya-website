import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getAppointments,
  updateAppointmentStatus,
} from "@/lib/appointment-store";
import { verifyUploadedDocument } from "@/lib/file-validation";

export type PaymentStatus = "pending" | "submitted" | "paid" | "rejected";

export type AppointmentPayment = {
  id: string;
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  patientMobile: string;
  amount: number | null;
  paymentMethod: "upi";
  upiId: string;
  transactionRef: string;
  screenshotUrl: string;
  status: PaymentStatus;
  adminNote: string;
  submittedAt: string;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
};

const PAYMENT_BUCKET = "payment-proofs";
const MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function safeStoragePart(value: string) {
  return value.replace(/[^a-zA-Z0-9@._-]/g, "-");
}

function mapRow(row: any): AppointmentPayment {
  return {
    id: String(row.id || ""),
    appointmentId: String(row.appointment_id || ""),
    patientEmail: String(row.patient_email || ""),
    patientName: String(row.patient_name || ""),
    patientMobile: String(row.patient_mobile || ""),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    paymentMethod: "upi",
    upiId: String(row.upi_id || ""),
    transactionRef: String(row.transaction_ref || ""),
    screenshotUrl: String(row.screenshot_url || ""),
    status: String(row.status || "pending") as PaymentStatus,
    adminNote: String(row.admin_note || ""),
    submittedAt: String(row.submitted_at || ""),
    verifiedAt: String(row.verified_at || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

export function formatPaymentForClient(payment: AppointmentPayment) {
  return {
    id: payment.id,
    appointmentId: payment.appointmentId,
    appointment_id: payment.appointmentId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    payment_method: payment.paymentMethod,
    upiId: payment.upiId,
    upi_id: payment.upiId,
    transactionRef: payment.transactionRef,
    transaction_ref: payment.transactionRef,
    hasProof: Boolean(payment.screenshotUrl),
    has_proof: Boolean(payment.screenshotUrl),
    status: payment.status,
    adminNote: payment.adminNote,
    admin_note: payment.adminNote,
    submittedAt: payment.submittedAt,
    submitted_at: payment.submittedAt,
    verifiedAt: payment.verifiedAt,
    verified_at: payment.verifiedAt,
    createdAt: payment.createdAt,
    created_at: payment.createdAt,
  };
}

export function formatPaymentForAdmin(payment: AppointmentPayment, proofUrl = "") {
  return {
    ...formatPaymentForClient(payment),
    patientEmail: payment.patientEmail,
    patient_email: payment.patientEmail,
    patientName: payment.patientName,
    patient_name: payment.patientName,
    patientMobile: payment.patientMobile,
    patient_mobile: payment.patientMobile,
    proofUrl,
    proof_url: proofUrl,
  };
}

async function uploadPaymentProof(input: {
  patientEmail: string;
  appointmentId: string;
  file: File;
}) {
  const file = input.file;

  if (!file || file.size <= 0) return "";

  const verifiedFile = await verifyUploadedDocument({
    file,
    maxBytes: MAX_PAYMENT_PROOF_SIZE,
    label: "Payment proof",
  });

  const supabase = getSupabaseAdmin();

  const safeEmail = safeStoragePart(cleanEmail(input.patientEmail));
  const safeAppointmentId = safeStoragePart(clean(input.appointmentId));
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${verifiedFile.extension}`;
  const storagePath = `${safeEmail}/${safeAppointmentId}/${fileName}`;

  const { error } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .upload(storagePath, verifiedFile.buffer, {
      contentType: verifiedFile.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return storagePath;
}

export async function getPaymentsForPatient(patientEmail: string) {
  const email = cleanEmail(patientEmail);

  if (!email) return [];

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointment_payments")
    .select("*")
    .eq("patient_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRow);
}

export async function getPaymentByAppointmentForPatient(input: {
  appointmentId: string;
  patientEmail: string;
}) {
  const appointmentId = clean(input.appointmentId);
  const patientEmail = cleanEmail(input.patientEmail);

  if (!appointmentId || !patientEmail) return undefined;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointment_payments")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("patient_email", patientEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data) : undefined;
}

export async function getAllPayments() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointment_payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapRow);
}

export async function createPaymentProofSignedUrl(payment: AppointmentPayment) {
  if (!payment.screenshotUrl) return "";

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .createSignedUrl(payment.screenshotUrl, 60 * 5);

  if (error || !data?.signedUrl) return "";

  return data.signedUrl;
}

export async function submitAppointmentPayment(input: {
  appointmentId: string;
  patientEmail: string;
  patientName?: string;
  patientMobile?: string;
  amount?: number | null;
  transactionRef?: string;
  proofFile?: File | null;
}) {
  const appointmentId = clean(input.appointmentId);
  const patientEmail = cleanEmail(input.patientEmail);
  const patientName = clean(input.patientName);
  const patientMobile = clean(input.patientMobile);
  const transactionRef = clean(input.transactionRef);
  const upiId = clean(process.env.NEXT_PUBLIC_CLINIC_UPI_ID || "arogya9407@idfcbank");

  if (!appointmentId) {
    throw new Error("Appointment ID is required.");
  }

  if (!patientEmail) {
    throw new Error("Patient email is required.");
  }

  if (!transactionRef && !input.proofFile) {
    throw new Error("Enter UPI reference number or upload payment proof.");
  }

  if (transactionRef.length > 120) {
    throw new Error("Transaction/reference number is too long.");
  }

  const existing = await getPaymentByAppointmentForPatient({
    appointmentId,
    patientEmail,
  });

  if (existing?.status === "paid") {
    throw new Error("This payment is already marked as paid.");
  }

  let screenshotUrl = existing?.screenshotUrl || "";
  let newProofPath = "";

  if (input.proofFile) {
    newProofPath = await uploadPaymentProof({
      patientEmail,
      appointmentId,
      file: input.proofFile,
    });
    screenshotUrl = newProofPath;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const payload = {
    appointment_id: appointmentId,
    patient_email: patientEmail,
    patient_name: patientName || null,
    patient_mobile: patientMobile || null,
    amount: input.amount ?? null,
    payment_method: "upi",
    upi_id: upiId,
    transaction_ref: transactionRef || null,
    screenshot_url: screenshotUrl || null,
    status: "submitted" as PaymentStatus,
    admin_note: null,
    submitted_at: now,
  };

  const query = existing
    ? supabase
        .from("appointment_payments")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : supabase
        .from("appointment_payments")
        .insert(payload)
        .select("*")
        .single();

  const { data, error } = await query;

  if (error || !data) {
    if (newProofPath) {
      await supabase.storage.from(PAYMENT_BUCKET).remove([newProofPath]);
    }

    if (error?.code === "23505") {
      throw new Error(
        String(error.message || "").toLowerCase().includes("transaction")
          ? "This UPI reference was already submitted. Check the number and contact the clinic if needed."
          : "A payment already exists for this appointment. Refresh and try again."
      );
    }

    throw new Error(error?.message || "Payment submission failed.");
  }

  if (
    newProofPath &&
    existing?.screenshotUrl &&
    existing.screenshotUrl !== newProofPath
  ) {
    const { error: cleanupError } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .remove([existing.screenshotUrl]);

    if (cleanupError) {
      console.error("[payment-store] Old payment proof cleanup failed.", cleanupError);
    }
  }

  return mapRow(data);
}

export async function updatePaymentStatus(input: {
  id: string;
  status: PaymentStatus;
  adminNote?: string;
}) {
  const id = clean(input.id);
  const status = input.status;
  const adminNote = clean(input.adminNote);

  if (!id) {
    throw new Error("Payment ID is required.");
  }

  if (!["pending", "submitted", "paid", "rejected"].includes(status)) {
    throw new Error("Invalid payment status.");
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointment_payments")
    .update({
      status,
      admin_note: adminNote || null,
      verified_at: status === "paid" || status === "rejected" ? now : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Payment status update failed.");
  }

  const payment = mapRow(data);

  if (payment.status === "paid") {
    try {
      const appointments = await getAppointments();
      const appointment = appointments.find(
        (item) => item.id === payment.appointmentId
      );

      if (appointment && !["Completed", "Cancelled"].includes(appointment.status)) {
        await updateAppointmentStatus(payment.appointmentId, "Confirmed");
      }
    } catch (error) {
      console.error("[payment-store] Could not auto-confirm paid appointment.", error);
    }
  }

  return payment;
}
