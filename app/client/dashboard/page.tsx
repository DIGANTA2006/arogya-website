"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CalendarDays,
  Clock,
  Download,
  FileText,
  LogOut,
  Monitor,
  Phone,
  User,
} from "lucide-react";

type Appointment = {
  id: string;
  service: string;
  appointmentType: string;
  date: string;
  time: string;
  status?: string;
};

type Prescription = {
  id: string;
  title: string;
  createdAt: string;
  downloadUrl?: string;
  qrUrl?: string;
};

type Profile = {
  name: string;
  email: string;
  phone: string;
  age: string;
  mobileVerified: boolean;
};

export default function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
      setProfile(data.profile || null);

      if (data.profile?.phone || data.profile?.age) {
        setForm((previous) => ({
          ...previous,
          phone: data.profile.phone || previous.phone,
          age: data.profile.age || previous.age,
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

  useEffect(() => {
    loadProfile();
    loadAppointments();
    loadPrescriptions();
  }, []);

  async function bookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/client/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
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
    setLoading(false);

    window.dispatchEvent(new Event("arogya-appointment-booked"));
  }

  return (
    <main className="client-dashboard-page">
      <header className="client-dashboard-header">
        <div className="client-dashboard-container header-inner">
          <div>
            <span className="dashboard-chip">Patient Portal</span>
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
            <User size={32} />
          </div>

          <h2>{profile?.name || "Patient"}</h2>
          <p>{profile?.email || "Logged in patient"}</p>

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
              {appointments.map((appointment) => (
                <article key={appointment.id} className="history-item">
                  <strong>{appointment.service}</strong>
                  <p>
                    {appointment.appointmentType} · {appointment.date} · {appointment.time}
                  </p>
                  <span>{appointment.status || "New"}</span>
                </article>
              ))}
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
              {prescriptions.map((prescription) => (
                <article key={prescription.id} className="history-item">
                  <strong>{prescription.title}</strong>
                  <p>Uploaded: {new Date(prescription.createdAt).toLocaleDateString()}</p>

                  <div className="prescription-actions">
                    {prescription.downloadUrl && (
                      <a href={prescription.downloadUrl} className="dash-btn dash-btn-dark">
                        <Download size={15} />
                        Download PDF
                      </a>
                    )}

                    {prescription.qrUrl && (
                      <a href={prescription.qrUrl} target="_blank" className="dash-btn dash-btn-light">
                        Open QR
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
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
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .dash-btn:hover {
          transform: translateY(-1px);
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
          grid-template-columns: 330px 1fr;
          gap: 24px;
          padding: 32px 0 56px;
        }

        .profile-card,
        .booking-card,
        .list-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #dbeafe;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          padding: 26px;
        }

        .profile-card {
          align-self: start;
          position: sticky;
          top: 24px;
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

        .booking-card {
          grid-column: 2;
        }

        .list-card {
          min-height: 260px;
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
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
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

          .booking-card {
            grid-column: auto;
          }

          .profile-card {
            position: static;
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
