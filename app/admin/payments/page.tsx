"use client";

import { useEffect, useState } from "react";

type PaymentStatus = "pending" | "submitted" | "paid" | "rejected";

type AdminPayment = {
  id: string;
  appointmentId?: string;
  appointment_id?: string;
  patientName?: string;
  patient_name?: string;
  patientEmail?: string;
  patient_email?: string;
  patientMobile?: string;
  patient_mobile?: string;
  amount?: number | null;
  upiId?: string;
  upi_id?: string;
  transactionRef?: string;
  transaction_ref?: string;
  hasProof?: boolean;
  has_proof?: boolean;
  proofUrl?: string;
  proof_url?: string;
  status: PaymentStatus;
  adminNote?: string;
  admin_note?: string;
  submittedAt?: string;
  submitted_at?: string;
  verifiedAt?: string;
  verified_at?: string;
};

function getPaymentValue(payment: AdminPayment, camel: keyof AdminPayment, snake: keyof AdminPayment) {
  return payment[camel] || payment[snake] || "";
}

function statusLabel(status: PaymentStatus) {
  if (status === "paid") return "Paid";
  if (status === "rejected") return "Rejected";
  if (status === "submitted") return "Submitted";
  return "Pending";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/payments", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Could not load payments.");
        return;
      }

      setPayments(data.payments || []);
    } catch {
      setMessage("Could not load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function updatePaymentStatus(payment: AdminPayment, status: PaymentStatus) {
    try {
      let adminNote = "";

      if (status === "rejected") {
        adminNote =
          window.prompt(
            "Write rejection note for patient:",
            payment.adminNote || payment.admin_note || "Payment proof/reference could not be verified."
          ) || "";

        if (!adminNote.trim()) return;
      }

      if (status === "paid") {
        const confirmed = window.confirm("Mark this payment as PAID?");
        if (!confirmed) return;
      }

      setBusyId(payment.id);
      setMessage("");

      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: payment.id,
          status,
          adminNote,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Payment status update failed.");
        return;
      }

      setMessage("Payment status updated successfully.");
      await loadPayments();
    } catch {
      setMessage("Payment status update failed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">
              UPI Payment Verification
            </strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Review patient UPI references and uploaded payment screenshots.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/dashboard"
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Dashboard
            </a>

            <form action="/api/auth/logout" method="post">
              <button
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Manual Verification
            </span>

            <h1 className="mt-5 text-3xl font-extrabold text-foreground sm:text-4xl">
              Patient UPI payment submissions
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              When a patient submits a UPI reference number or screenshot, verify it
              with the clinic bank/UPI app and then mark the payment as paid.
            </p>

            <button
              onClick={loadPayments}
              className="mt-5 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
              type="button"
            >
              Refresh Payments
            </button>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-border bg-white p-4 text-sm font-bold text-foreground shadow-sm">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-[2rem] border border-border bg-white p-8 text-sm font-bold text-muted-foreground shadow-sm">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-[2rem] border border-border bg-white p-8 text-sm font-bold text-muted-foreground shadow-sm">
              No payment submissions found.
            </div>
          ) : (
            <div className="grid gap-5">
              {payments.map((payment) => {
                const appointmentId = String(
                  getPaymentValue(payment, "appointmentId", "appointment_id")
                );
                const patientName = String(
                  getPaymentValue(payment, "patientName", "patient_name") || "Patient"
                );
                const patientEmail = String(
                  getPaymentValue(payment, "patientEmail", "patient_email")
                );
                const patientMobile = String(
                  getPaymentValue(payment, "patientMobile", "patient_mobile")
                );
                const transactionRef = String(
                  getPaymentValue(payment, "transactionRef", "transaction_ref")
                );
                const proofUrl = String(
                  getPaymentValue(payment, "proofUrl", "proof_url")
                );
                const adminNote = String(
                  getPaymentValue(payment, "adminNote", "admin_note")
                );
                const submittedAt = String(
                  getPaymentValue(payment, "submittedAt", "submitted_at")
                );
                const verifiedAt = String(
                  getPaymentValue(payment, "verifiedAt", "verified_at")
                );

                return (
                  <article
                    key={payment.id}
                    className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                              payment.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : payment.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : payment.status === "submitted"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel(payment.status)}
                          </span>

                          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase text-primary">
                            UPI
                          </span>
                        </div>

                        <h2 className="mt-4 text-2xl font-extrabold text-foreground">
                          {patientName}
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {patientEmail || "No email"} {patientMobile ? `· ${patientMobile}` : ""}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
                        <p className="font-black text-foreground">
                          Amount: ₹{payment.amount || "-"}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Appointment: {appointmentId || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-white p-4">
                        <p className="text-xs font-black uppercase text-muted-foreground">
                          UPI Reference
                        </p>
                        <p className="mt-2 break-all text-sm font-bold text-foreground">
                          {transactionRef || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-white p-4">
                        <p className="text-xs font-black uppercase text-muted-foreground">
                          Proof
                        </p>

                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            className="mt-2 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                          >
                            Open Screenshot/PDF
                          </a>
                        ) : (
                          <p className="mt-2 text-sm font-bold text-muted-foreground">
                            No file uploaded
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                        <p>
                          Submitted:{" "}
                          {submittedAt ? new Date(submittedAt).toLocaleString() : "-"}
                        </p>
                        <p className="mt-1">
                          Verified:{" "}
                          {verifiedAt ? new Date(verifiedAt).toLocaleString() : "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                        <p className="font-black text-foreground">Admin Note</p>
                        <p className="mt-1">{adminNote || "No note"}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(payment, "paid")}
                        disabled={busyId === payment.id || payment.status === "paid"}
                        className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Paid
                      </button>

                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(payment, "rejected")}
                        disabled={busyId === payment.id}
                        className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => updatePaymentStatus(payment, "submitted")}
                        disabled={busyId === payment.id}
                        className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-black text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reset Submitted
                      </button>

                      {payment.status === "paid" && appointmentId ? (
                        <a
                          href={`/api/meeting/${encodeURIComponent(appointmentId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-primary"
                        >
                          Start Meeting
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
