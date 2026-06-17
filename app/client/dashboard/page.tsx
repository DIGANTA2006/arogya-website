"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CalendarDays,
  Clock,
  Download,
  FileText,
  LogOut,
  Monitor,
  UserRound,
} from "lucide-react";

type Appointment = {
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
  status?: string;
  createdAt?: string;
  created_at?: string;
};

type Prescription = {
  id?: string;
  title?: string;
  createdAt?: string;
  created_at?: string;
  downloadUrl?: string;
  download_url?: string;
  qrUrl?: string;
  qr_url?: string;
  securePageUrl?: string;
  secure_page_url?: string;
  qrImageUrl?: string;
  qr_image_url?: string;
  nextTherapyDate?: string;
  next_therapy_date?: string;
  nextAppointmentDate?: string;
  next_appointment_date?: string;
  status?: string;
  source?: string;
};

type PaymentSummary = {
  id?: string;
  appointmentId?: string;
  appointment_id?: string;
  amount?: number | null;
  status?: "pending" | "submitted" | "paid" | "rejected";
  adminNote?: string;
  admin_note?: string;
};

type Profile = {
  name: string;
  email: string;
  phone: string;
  age: string;
  mobileVerified: boolean;
};

function isOnlineAppointmentType(value?: string) {
  const text = String(value || "").trim().toLowerCase();

  return (
    text.includes("online") ||
    text.includes("video") ||
    text.includes("meet")
  );
}

function getAppointmentStartDate(appointment: Appointment) {
  const dateText = String(
    appointment.date || appointment.appointmentDate || appointment.appointment_date || ""
  ).trim();
  const timeText = String(
    appointment.time || appointment.appointmentTime || appointment.appointment_time || ""
  ).trim().slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeText)) return null;

  const parsed = new Date(`${dateText}T${timeText}:00+05:30`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function isPastAppointment(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  const closeAt = new Date(start.getTime() + 8 * 60 * 60 * 1000);

  return new Date() > closeAt;
}
function isMeetingWindowOpen(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  const now = new Date();
  const openAt = new Date(start.getTime() - 30 * 60 * 1000);
  const closeAt = new Date(start.getTime() + 8 * 60 * 60 * 1000);

  return now >= openAt && now <= closeAt;
}
function buildMeetingGateUrl(appointmentId?: string) {
  return appointmentId ? `/api/meeting/${encodeURIComponent(appointmentId)}` : "";
}

export default function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    service: "Speech Therapy Consultation",
    appointmentType: "Physical Clinic Visit",
    date: "",
    time: "",
    phone: "",
    age: "",
    message: "",
  });

  const patientName = useMemo(() => profile?.name || "Patient", [profile]);
  const patientEmail = useMemo(() => profile?.email || "Logged in patient", [profile]);

  const paymentByAppointment = useMemo(() => {
    const map = new Map<string, PaymentSummary>();

    for (const payment of payments) {
      const appointmentId = payment.appointmentId || payment.appointment_id;
      if (appointmentId) map.set(appointmentId, payment);
    }

    return map;
  }, [payments]);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function loadProfile() {
    const response = await fetch("/api/client/profile", { cache: "no-store" });

    if (response.ok) {
      const data = await response.json();
      const nextProfile = data.profile || null;
      setProfile(nextProfile);

      if (nextProfile) {
        setForm((previous) => ({
          ...previous,
          phone: nextProfile.phone || previous.phone,
          age: nextProfile.age || previous.age,
        }));
      }
    }
  }

  async function loadAppointments() {
    const response = await fetch("/api/client/appointments", { cache: "no-store" });

    if (response.ok) {
      const data = await response.json();
      setAppointments(data.appointments || []);
    }
  }

  async function loadPrescriptions() {
    const response = await fetch("/api/client/prescriptions", { cache: "no-store" });

    if (response.ok) {
      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    }
  }

  async function loadPayments() {
    const response = await fetch("/api/client/payments", { cache: "no-store" });

    if (response.ok) {
      const data = await response.json();
      setPayments(data.payments || []);
    }
  }

  useEffect(() => {
    loadProfile();
    loadAppointments();
    loadPrescriptions();
    loadPayments();
  }, []);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const payload = {
      ...form,
      appointment_type: form.appointmentType,
      appointmentDate: form.date,
      appointment_date: form.date,
      appointmentTime: form.time,
      appointment_time: form.time,
    };

    const response = await fetch("/api/client/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || "Appointment booking failed.");
      setLoading(false);
      return;
    }

    setStatus(data.message || "Appointment booked successfully.");

    setForm({
      service: "Speech Therapy Consultation",
      appointmentType: "Physical Clinic Visit",
      date: "",
      time: "",
      phone: form.phone,
      age: form.age,
      message: "",
    });

    await loadAppointments();
    await loadPayments();
    setLoading(false);

    window.dispatchEvent(new Event("arogya-appointment-booked"));
  }

  return (
    <main className="client-dashboard-page">
      <header className="client-dashboard-header">
        <div className="client-dashboard-container header-inner">
          <div>
            <span className="dashboard-chip dashboard-chip-light">Patient Portal</span>
            <h1>Patient Dashboard</h1>
            <p>Book appointments, track status, and download prescriptions.</p>
          </div>

          <div className="header-actions">
            <a href="/" className="dash-btn dash-btn-light">
              Website
            </a>
            <a href="/client/profile" className="dash-btn dash-btn-light">
              My Profile
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="dash-btn dash-btn-dark" type="submit">
                <LogOut size={16} />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="client-dashboard-container dashboard-grid">
        <aside className="profile-card">
          <div className="profile-avatar">
            <UserRound size={34} />
          </div>

          <h2>{patientName}</h2>
          <p>{patientEmail}</p>

          <div className="profile-info">
            <InfoRow label="Mobile" value={profile?.phone || form.phone || "Not added"} />
            <InfoRow label="Age" value={profile?.age || form.age || "Not added"} />
            <InfoRow
              label="Mobile OTP"
              value={profile?.mobileVerified ? "Verified" : "Not verified"}
            />
          </div>

          {!profile?.mobileVerified && (
            <div className="warning-box">
              Google login is active. Add/verify mobile number before final patient use.
            </div>
          )}

          <a href="/client/profile" className="edit-profile-link">
            Edit Profile
          </a>
        </aside>

        <section className="booking-card">
          <div className="section-title-row">
            <div>
              <span className="dashboard-chip">Book Appointment</span>
              <h2>Choose physical or online appointment</h2>
            </div>
            <CalendarDays size={34} />
          </div>

          <form onSubmit={bookAppointment} className="appointment-form">
            <label>
              Service
              <select name="service" value={form.service} onChange={updateField} required>
                <option>Speech Therapy Consultation</option>
                <option>Hearing Test</option>
                <option>Hearing Aid Consultation</option>
                <option>Online Follow-up Consultation</option>
              </select>
            </label>

            <label>
              Appointment Type
              <select
                name="appointmentType"
                value={form.appointmentType}
                onChange={updateField}
                required
              >
                <option>Physical Clinic Visit</option>
                <option>Online Video Consultation</option>
              </select>
            </label>

            <div className="two-col">
              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={updateField} required />
              </label>

              <label>
                Time
                <input name="time" type="time" value={form.time} onChange={updateField} required />
              </label>
            </div>

            <div className="two-col">
              <label>
                Mobile Number
                <input
                  name="phone"
                  placeholder="+91XXXXXXXXXX"
                  value={form.phone}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Age
                <input
                  name="age"
                  placeholder="Patient age"
                  value={form.age}
                  onChange={updateField}
                />
              </label>
            </div>

            <label>
              Message or Concern
              <textarea
                name="message"
                placeholder="Write your concern or appointment note..."
                rows={4}
                value={form.message}
                onChange={updateField}
              />
            </label>

            <button className="dash-submit" type="submit" disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </button>

            {status && (
              <p className={status.toLowerCase().includes("failed") ? "status-error" : "status-ok"}>
                {status}
              </p>
            )}
          </form>
        </section>

        <section className="list-card">
          <div className="section-title-row">
            <div>
              <span className="dashboard-chip">My Appointments</span>
              <h2>Appointment history</h2>
            </div>
            <Clock size={32} />
          </div>

          {appointments.length === 0 ? (
            <EmptyState text="No appointments found." />
          ) : (
            <div className="item-list">
              {appointments.map((appointment, index) => {
                const appointmentType =
                  appointment.appointmentType || appointment.appointment_type || "Appointment";
                const isOnlineAppointment = isOnlineAppointmentType(appointmentType);
                const appointmentDate =
                  appointment.date || appointment.appointmentDate || appointment.appointment_date || "-";
                const appointmentTime =
                  appointment.time || appointment.appointmentTime || appointment.appointment_time || "-";
                const appointmentId = String(appointment.id || "");
                const appointmentCompleted =
                  String(appointment.status || "").toLowerCase() === "completed";
                const meetingLink =
                  isOnlineAppointment && appointmentId
                    ? buildMeetingGateUrl(appointmentId)
                    : "";
                const payment = appointmentId ? paymentByAppointment.get(appointmentId) : undefined;
                const meetingOpen = isMeetingWindowOpen(appointment);
                const paymentStatus = isOnlineAppointment
                  ? payment?.status
                    ? payment.status.toUpperCase()
                    : "NOT SUBMITTED"
                  : "PAY AT CLINIC";

                return (
                  <article key={appointment.id || index} className="history-item">
                    <strong>{appointment.service || "Clinic Appointment"}</strong>
                    <p>
                      {appointmentType} · {appointmentDate} · {appointmentTime}
                    </p>
                    <div className="appointment-meta-row">
                      <span>{isPastAppointment(appointment) ? "Done" : appointment.status || "New"}</span>
                      <span className={`payment-status-pill payment-${isOnlineAppointment ? payment?.status || "missing" : "clinic"}`}>
                        Payment: {paymentStatus}
                      </span>
                    </div>

                    {appointmentId && isOnlineAppointment ? (
                      <div className="appointment-payment-actions">
                        <a href={`/client/payment/${appointmentId}`} className="dash-btn dash-btn-light">
                          {payment?.status === "paid" ? "View Payment" : "Pay / Submit UPI"}
                        </a>

                        {payment?.status === "paid" && meetingLink && !appointmentCompleted && meetingOpen ? (
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="dash-btn dash-btn-dark"
                          >
                            Join Online Meeting
                          </a>
                        ) : (
                          <span className="clinic-payment-note">
                            {appointmentCompleted
                              ? "Consultation completed"
                              : payment?.status === "paid" ? "Meeting done / closed" : "Meeting link available after payment verification"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="appointment-payment-actions">
                        <span className="clinic-payment-note">Pay normally at clinic</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="list-card">
          <div className="section-title-row">
            <div>
              <span className="dashboard-chip">My Prescriptions</span>
              <h2>Download prescriptions</h2>
            </div>
            <FileText size={32} />
          </div>

          {prescriptions.length === 0 ? (
            <EmptyState text="No prescriptions uploaded yet." />
          ) : (
            <div className="item-list">
              {prescriptions.map((prescription, index) => {
                const downloadUrl = prescription.downloadUrl || prescription.download_url;
                const qrUrl = prescription.qrUrl || prescription.qr_url;
                const createdAt = prescription.createdAt || prescription.created_at;

                return (
                  <article key={prescription.id || index} className="history-item">
                    <strong>{prescription.title || "Prescription"}</strong>
                    <p>
                      Uploaded: {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
                    </p>

                    {(prescription.nextTherapyDate || prescription.next_therapy_date) && (
                      <p>
                        Next therapy: {prescription.nextTherapyDate || prescription.next_therapy_date}
                      </p>
                    )}

                    {(prescription.nextAppointmentDate || prescription.next_appointment_date) && (
                      <p>
                        Next appointment: {prescription.nextAppointmentDate || prescription.next_appointment_date}
                      </p>
                    )}

                    <div className="prescription-actions">
                      {downloadUrl && (
                        <a href={downloadUrl} className="dash-btn dash-btn-dark">
                          <Download size={15} />
                          Download PDF
                        </a>
                      )}

                      {qrUrl && (
                        <a href={qrUrl} target="_blank" className="dash-btn dash-btn-light">
                          Open Secure Page
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .appointment-meta-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .payment-status-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .payment-status-pill.payment-paid {
          background: #dcfce7;
          color: #166534;
        }

        .payment-status-pill.payment-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .payment-status-pill.payment-submitted {
          background: #fef9c3;
          color: #854d0e;
        }

        .payment-status-pill.payment-pending,
        .payment-status-pill.payment-missing {
          background: #e2e8f0;
          color: #334155;
        }

        .payment-status-pill.payment-clinic {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .clinic-payment-note {
          display: inline-flex;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.1);
          color: #334155;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .appointment-payment-actions {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .client-dashboard-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 28%),
            linear-gradient(135deg, #f8fbff 0%, #eef8ff 45%, #f8fafc 100%);
          color: #0f172a;
        }

        .client-dashboard-container {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
        }

        .client-dashboard-header {
          background: linear-gradient(135deg, #0057b8, #003b7a);
          color: white;
          padding: 30px 0;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .client-dashboard-header h1 {
          margin: 12px 0 6px;
          font-size: clamp(32px, 5vw, 48px);
          letter-spacing: -1px;
        }

        .client-dashboard-header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          font-weight: 600;
        }

        .dashboard-chip {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 8px 13px;
          background: #dff3ff;
          color: #0057b8;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .dashboard-chip-light {
          background: rgba(255, 255, 255, 0.18);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.28);
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .dash-btn {
          border: none;
          border-radius: 999px;
          padding: 12px 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          font-weight: 900;
          cursor: pointer;
        }

        .dash-btn-light {
          background: white;
          color: #0057b8;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }

        .dash-btn-dark {
          background: #0f172a;
          color: white;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.18);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 330px minmax(0, 1fr);
          gap: 24px;
          padding: 32px 0 56px;
          align-items: start;
        }

        .profile-card {
          grid-row: 1 / span 3;
          align-self: start;
        }

        .profile-card,
        .booking-card,
        .list-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #dbeafe;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          padding: 26px;
          min-width: 0;
        }

        .booking-card,
        .list-card {
          grid-column: 2;
        }

        .profile-avatar {
          width: 76px;
          height: 76px;
          border-radius: 24px;
          background: linear-gradient(135deg, #0057b8, #00a6a6);
          color: white;
          display: grid;
          place-items: center;
          box-shadow: 0 16px 34px rgba(0, 87, 184, 0.22);
        }

        .profile-card h2 {
          margin: 18px 0 4px;
          font-size: 26px;
        }

        .profile-card p {
          margin: 0;
          color: #64748b;
          overflow-wrap: anywhere;
        }

        .profile-info {
          display: grid;
          gap: 12px;
          margin-top: 22px;
        }

        .info-row {
          padding: 14px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .info-row small {
          display: block;
          color: #64748b;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .info-row strong {
          overflow-wrap: anywhere;
        }

        .warning-box {
          margin-top: 18px;
          padding: 15px;
          border-radius: 18px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          font-weight: 800;
          line-height: 1.6;
        }

        .edit-profile-link {
          margin-top: 16px;
          display: inline-flex;
          border-radius: 999px;
          padding: 12px 18px;
          background: #e0f2fe;
          color: #0369a1;
          text-decoration: none;
          font-weight: 900;
        }

        .section-title-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .section-title-row h2 {
          font-size: clamp(26px, 4vw, 38px);
          margin: 14px 0 0;
          letter-spacing: -0.8px;
        }

        .appointment-form {
          display: grid;
          gap: 16px;
        }

        .appointment-form label {
          display: grid;
          gap: 8px;
          font-weight: 900;
          color: #334155;
        }

        .appointment-form input,
        .appointment-form select,
        .appointment-form textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #f8fafc;
          padding: 15px 16px;
          color: #0f172a;
          font-size: 16px;
          outline: none;
        }

        .appointment-form input:focus,
        .appointment-form select:focus,
        .appointment-form textarea:focus {
          border-color: #0284c7;
          background: white;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.12);
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .dash-submit {
          border: none;
          border-radius: 999px;
          padding: 16px 22px;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white;
          font-weight: 950;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 16px 36px rgba(249, 115, 22, 0.26);
        }

        .dash-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .status-ok {
          color: #15803d;
          font-weight: 900;
        }

        .status-error {
          color: #b91c1c;
          font-weight: 900;
        }

        .empty-state {
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          border-radius: 22px;
          padding: 28px;
          color: #64748b;
          font-weight: 800;
          text-align: center;
        }

        .item-list {
          display: grid;
          gap: 14px;
        }

        .history-item {
          padding: 18px;
          border-radius: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .history-item strong {
          font-size: 17px;
        }

        .history-item p {
          color: #64748b;
          margin: 8px 0;
        }

        .history-item span {
          display: inline-flex;
          border-radius: 999px;
          padding: 7px 12px;
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 900;
          font-size: 12px;
        }

        .prescription-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        @media (max-width: 980px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .profile-card,
          .booking-card,
          .list-card {
            grid-column: auto;
            grid-row: auto;
          }
        }

        @media (max-width: 640px) {
          .client-dashboard-container {
            width: min(100% - 24px, 1180px);
          }

          .client-dashboard-header {
            padding: 24px 0;
          }

          .profile-card,
          .booking-card,
          .list-card {
            padding: 20px;
            border-radius: 24px;
          }

          .two-col {
            grid-template-columns: 1fr;
          }

          .header-actions {
            width: 100%;
          }

          .dash-btn,
          .header-actions form,
          .header-actions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Monitor size={28} />
      <p>{text}</p>
    </div>
  );
}



