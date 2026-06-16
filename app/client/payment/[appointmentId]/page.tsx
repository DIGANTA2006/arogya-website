"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type PaymentSummary = {
  id?: string;
  appointmentId?: string;
  appointment_id?: string;
  amount?: number | null;
  transactionRef?: string;
  transaction_ref?: string;
  hasProof?: boolean;
  has_proof?: boolean;
  status?: "pending" | "submitted" | "paid" | "rejected";
  adminNote?: string;
  admin_note?: string;
  submittedAt?: string;
  submitted_at?: string;
  verifiedAt?: string;
  verified_at?: string;
};

type AppointmentSummary = {
  id?: string;
  service?: string;
  appointmentType?: string;
  appointment_type?: string;
  date?: string;
  appointmentDate?: string;
  appointment_date?: string;
  time?: string;
  appointmentTime?: string;
  appointment_time?: string;
};

function statusLabel(status?: string) {
  if (status === "paid") return "Paid";
  if (status === "rejected") return "Rejected";
  if (status === "submitted") return "Submitted for verification";
  return "Not submitted";
}

function isOnlineAppointmentType(value: unknown) {
  const text = String(value || "").trim().toLowerCase();

  return (
    text.includes("online") ||
    text.includes("video") ||
    text.includes("meet")
  );
}

export default function ClientPaymentPage() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = params.appointmentId;

  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const upiId = process.env.NEXT_PUBLIC_CLINIC_UPI_ID || "arogya9407@idfcbank";
  const clinicName =
    process.env.NEXT_PUBLIC_CLINIC_UPI_NAME ||
    "Arogya Speech Therapy and Hearing Center";
  const qrImage =
    process.env.NEXT_PUBLIC_CLINIC_UPI_QR || "/payment/arogya-upi-qr.jpeg";

  const appointmentType =
    appointment?.appointmentType || appointment?.appointment_type || "";
  const isOnlineAppointment = isOnlineAppointmentType(appointmentType);

  const upiLink = useMemo(() => {
    const query = new URLSearchParams();
    query.set("pa", upiId);
    query.set("pn", clinicName);
    query.set("cu", "INR");

    if (amount && Number(amount) > 0) {
      query.set("am", amount);
    }

    return `upi://pay?${query.toString()}`;
  }, [upiId, clinicName, amount]);

  async function loadPayment() {
    try {
      setLoading(true);
      setMessage("");

      const appointmentsResponse = await fetch("/api/client/appointments", {
        cache: "no-store",
      });

      const appointmentsData = await appointmentsResponse.json().catch(() => ({}));

      if (!appointmentsResponse.ok) {
        setMessage(appointmentsData.error || "Could not load appointment.");
        return;
      }

      const appointments = Array.isArray(appointmentsData.appointments)
        ? appointmentsData.appointments
        : [];

      const foundAppointment = appointments.find((item: AppointmentSummary) => {
        return item.id === appointmentId;
      });

      if (!foundAppointment) {
        setMessage("Appointment not found for this patient account.");
        setAppointment(null);
        return;
      }

      setAppointment(foundAppointment);

      const response = await fetch("/api/client/payments", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Could not load payment status.");
        return;
      }

      const payments = Array.isArray(data.payments) ? data.payments : [];

      const found = payments.find((item: PaymentSummary) => {
        const id = item.appointmentId || item.appointment_id;
        return id === appointmentId;
      });

      setPayment(found || null);

      if (found?.amount) {
        setAmount(String(found.amount));
      }

      if (found?.transactionRef || found?.transaction_ref) {
        setTransactionRef(found.transactionRef || found.transaction_ref || "");
      }
    } catch {
      setMessage("Could not load payment status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (appointmentId) {
      loadPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isOnlineAppointment) {
      setMessage("Online UPI payment is only for Online Video Consultation.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const formData = new FormData();
      formData.append("appointmentId", appointmentId);
      formData.append("amount", amount);
      formData.append("transactionRef", transactionRef.trim());

      if (proof) {
        formData.append("proof", proof);
      }

      const response = await fetch("/api/client/payments", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Payment submission failed.");
        return;
      }

      setPayment(data.payment || null);
      setProof(null);
      setMessage(data.message || "Payment details submitted successfully.");
      await loadPayment();
    } catch {
      setMessage("Payment submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentStatus = payment?.status || "pending";
  const isPaid = currentStatus === "paid";

  return (
    <main className="payment-page">
      <header className="payment-header">
        <div className="payment-container payment-header-inner">
          <div>
            <span className="payment-chip">Patient Payment</span>
            <h1>UPI Payment</h1>
            <p>
              Online UPI payment is available only for online video consultations.
              Clinic visits and walk-in patients should pay normally at clinic.
            </p>
          </div>

          <div className="payment-actions">
            <a href="/client/dashboard" className="payment-btn light">
              Back to Dashboard
            </a>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="payment-btn dark">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="payment-container payment-grid">
        <article className="payment-card qr-card">
          <span className="payment-chip">
            {isOnlineAppointment || loading ? "Scan & Pay" : "Clinic Payment"}
          </span>
          <h2>{clinicName}</h2>

          {loading || isOnlineAppointment ? (
            <>
              <div className="qr-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="Arogya clinic UPI QR code" />
              </div>

              <div className="upi-box">
                <small>UPI ID</small>
                <strong>{upiId}</strong>
              </div>

              <a href={upiLink} className="payment-btn dark full">
                Open UPI App
              </a>

              <p className="hint">
                On desktop, scan the QR using any mobile UPI app. On mobile, use
                “Open UPI App”.
              </p>
            </>
          ) : (
            <div className="message-box">
              This appointment is marked as{" "}
              <strong>{appointmentType || "Clinic Visit"}</strong>. Please pay at
              clinic reception.
            </div>
          )}
        </article>

        <article className="payment-card">
          <div className="status-row">
            <div>
              <span className="payment-chip">Verification</span>
              <h2>Submit payment details</h2>
            </div>

            <span className={`payment-status ${currentStatus}`}>
              {isOnlineAppointment ? statusLabel(payment?.status) : "Pay at Clinic"}
            </span>
          </div>

          <p className="appointment-id">Appointment ID: {appointmentId}</p>
          {appointmentType && <p className="appointment-id">Type: {appointmentType}</p>}

          {loading ? (
            <p className="message-box">Loading payment status...</p>
          ) : !isOnlineAppointment ? (
            <div className="message-box">
              Online UPI payment is only for Online Video Consultation. For this
              appointment, please pay normally at the clinic.
            </div>
          ) : (
            <form onSubmit={submitPayment} className="payment-form">
              <label>
                Amount Paid
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Example: 500"
                  disabled={isPaid}
                />
              </label>

              <label>
                UPI Transaction / Reference Number
                <input
                  value={transactionRef}
                  onChange={(event) => setTransactionRef(event.target.value)}
                  placeholder="Enter UPI reference number"
                  disabled={isPaid}
                />
              </label>

              <label>
                Upload Payment Screenshot or PDF
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => setProof(event.target.files?.[0] || null)}
                  disabled={isPaid}
                />
              </label>

              <p className="hint">Allowed: JPG, PNG, WEBP, PDF. Max size: 10 MB.</p>

              {payment?.adminNote || payment?.admin_note ? (
                <div className="message-box danger">
                  Admin note: {payment.adminNote || payment.admin_note}
                </div>
              ) : null}

              {message ? <div className="message-box">{message}</div> : null}

              <button
                type="submit"
                className="payment-submit"
                disabled={submitting || isPaid}
              >
                {isPaid
                  ? "Payment verified"
                  : submitting
                    ? "Submitting..."
                    : "Submit Payment Details"}
              </button>
            </form>
          )}
        </article>
      </section>

      <style>{`
        .payment-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 28%),
            linear-gradient(135deg, #f8fbff 0%, #eef8ff 45%, #f8fafc 100%);
          color: #0f172a;
        }

        .payment-container {
          width: min(1120px, calc(100% - 36px));
          margin: 0 auto;
        }

        .payment-header {
          padding: 28px 0 20px;
        }

        .payment-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(15, 23, 42, 0.08);
          padding: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        }

        .payment-header h1,
        .payment-card h2 {
          margin: 8px 0;
          color: #0f172a;
        }

        .payment-header p,
        .hint,
        .appointment-id {
          color: #64748b;
        }

        .payment-chip {
          display: inline-flex;
          border-radius: 999px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .payment-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .payment-btn,
        .payment-submit {
          border: 0;
          border-radius: 999px;
          padding: 11px 16px;
          font-weight: 900;
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
        }

        .payment-btn.light {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.12);
        }

        .payment-btn.dark,
        .payment-submit {
          background: #0f172a;
          color: #ffffff;
        }

        .payment-btn.full {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 14px;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
          padding: 10px 0 40px;
        }

        .payment-card {
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          padding: 24px;
        }

        .qr-box {
          margin-top: 16px;
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          padding: 14px;
        }

        .qr-box img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 16px;
        }

        .upi-box {
          margin-top: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.08);
          padding: 14px;
        }

        .upi-box small {
          display: block;
          color: #64748b;
          font-weight: 800;
        }

        .upi-box strong {
          display: block;
          margin-top: 4px;
          word-break: break-all;
          color: #0f172a;
        }

        .status-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 10px;
        }

        .payment-status {
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .payment-status.paid {
          background: #dcfce7;
          color: #166534;
        }

        .payment-status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment-status.submitted {
          background: #fef9c3;
          color: #854d0e;
        }

        .payment-status.pending {
          background: #e2e8f0;
          color: #334155;
        }

        .payment-form {
          display: grid;
          gap: 14px;
          margin-top: 16px;
        }

        .payment-form label {
          display: grid;
          gap: 7px;
          font-weight: 900;
          color: #334155;
        }

        .payment-form input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          padding: 12px 13px;
          font-size: 15px;
          outline: none;
          background: #ffffff;
        }

        .payment-form input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
        }

        .payment-submit {
          width: 100%;
          margin-top: 6px;
        }

        .payment-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message-box {
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
          padding: 12px;
          color: #334155;
          font-weight: 700;
        }

        .message-box.danger {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        @media (max-width: 820px) {
          .payment-header-inner,
          .status-row {
            flex-direction: column;
            align-items: stretch;
          }

          .payment-grid {
            grid-template-columns: 1fr;
          }

          .payment-actions {
            width: 100%;
          }

          .payment-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
