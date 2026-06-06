"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  name: string;
  age?: string;
  phone: string;
  email: string;
  service: string;
  appointmentType: string;
  date: string;
  time: string;
  message?: string;
  status?: string;
  createdAt?: string;
};

type Prescription = {
  id: string;
  title: string;
  createdAt: string;
  downloadUrl?: string;
  qrUrl?: string;
};

export default function ClientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function loadAppointments() {
    const response = await fetch("/api/client/appointments", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      setAppointments(data.appointments || []);
    }
  }

  async function loadPrescriptions() {
    const response = await fetch("/api/client/prescriptions", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    }
  }

  useEffect(() => {
    loadAppointments();
    loadPrescriptions();
  }, []);

  async function bookAppointment(event: React.FormEvent<HTMLFormElement>) {
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

    const data = await response.json();

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
      phone: "",
      age: "",
      message: "",
    });

    await loadAppointments();
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "18px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong style={{ fontSize: 24 }}>Patient Dashboard</strong>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Book appointments and download prescriptions.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/" className="btn-secondary">
              Website
            </a>

            <form action="/api/auth/logout" method="post">
              <button className="btn-secondary" type="submit">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          <div className="card" style={{ padding: 28 }}>
            <span className="badge">Book Appointment</span>
            <h1 style={{ fontSize: 34, margin: "18px 0 12px" }}>
              Choose physical or online appointment
            </h1>

            <form onSubmit={bookAppointment} style={{ display: "grid", gap: 14, marginTop: 20 }}>
              <select className="field" name="service" value={form.service} onChange={updateField} required>
                <option>Speech Therapy Consultation</option>
                <option>Hearing Test</option>
                <option>Hearing Aid Consultation</option>
                <option>Online Follow-up Consultation</option>
              </select>

              <select className="field" name="appointmentType" value={form.appointmentType} onChange={updateField} required>
                <option>Physical Clinic Visit</option>
                <option>Online Video Consultation</option>
              </select>

              <input className="field" name="date" type="date" value={form.date} onChange={updateField} required />
              <input className="field" name="time" type="time" value={form.time} onChange={updateField} required />
              <input className="field" name="phone" placeholder="Mobile number" value={form.phone} onChange={updateField} required />
              <input className="field" name="age" placeholder="Age" value={form.age} onChange={updateField} />
              <textarea className="field" name="message" placeholder="Message or concern" rows={4} value={form.message} onChange={updateField} />

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Booking..." : "Book Appointment"}
              </button>

              {status && (
                <p style={{ color: status.includes("failed") || status.includes("verify") ? "#b91c1c" : "#15803d", fontWeight: 800 }}>
                  {status}
                </p>
              )}
            </form>
          </div>

          <div style={{ display: "grid", gap: 22 }}>
            <div className="card" style={{ padding: 28 }}>
              <span className="badge">My Appointments</span>
              <h2 style={{ margin: "16px 0" }}>Appointment history</h2>

              {appointments.length === 0 ? (
                <p style={{ color: "#64748b" }}>No appointments found.</p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {appointments.map((appointment) => (
                    <div key={appointment.id} style={{ padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <strong>{appointment.service}</strong>
                      <p style={{ margin: "6px 0", color: "#64748b" }}>
                        {appointment.appointmentType} · {appointment.date} · {appointment.time}
                      </p>
                      <span className="badge">{appointment.status || "New"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 28 }}>
              <span className="badge">My Prescriptions</span>
              <h2 style={{ margin: "16px 0" }}>Download prescriptions</h2>

              {prescriptions.length === 0 ? (
                <p style={{ color: "#64748b" }}>No prescriptions uploaded yet.</p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} style={{ padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <strong>{prescription.title}</strong>
                      <p style={{ color: "#64748b" }}>
                        Uploaded: {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {prescription.downloadUrl && (
                          <a className="btn-primary" href={prescription.downloadUrl}>
                            Download PDF
                          </a>
                        )}
                        {prescription.qrUrl && (
                          <a className="btn-secondary" href={prescription.qrUrl} target="_blank">
                            Open QR
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
