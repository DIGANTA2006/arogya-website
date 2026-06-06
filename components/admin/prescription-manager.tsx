"use client";

import { useEffect, useState } from "react";

type Prescription = {
  id: string;
  patientEmail: string;
  title: string;
  secureToken: string;
  nextTherapyDate: string;
  nextAppointmentDate: string;
  createdAt: string;
};

export default function PrescriptionManager() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/prescriptions", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setItems(data.prescriptions || []);
    }
  }

  useEffect(() => { load(); }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/prescriptions", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Upload failed.");
      setLoading(false);
      return;
    }
    setStatus("Prescription uploaded successfully.");
    event.currentTarget.reset();
    await load();
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={upload} className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-foreground">Upload Prescription / Report</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Upload a PDF for a patient. The client can download it from their account and scan the QR code for secure access.</p>
        <div className="mt-5 grid gap-4">
          <input className="field" name="patientEmail" type="email" placeholder="Patient email" required />
          <input className="field" name="title" placeholder="Title, e.g. Speech Therapy Prescription" required />
          <input className="field" name="appointmentId" placeholder="Appointment ID (optional)" />
          <label className="text-sm font-bold text-foreground">Prescription PDF</label>
          <input className="field" name="file" type="file" accept="application/pdf" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-foreground">Next therapy date<input className="field" name="nextTherapyDate" type="date" /></label>
            <label className="grid gap-2 text-sm font-bold text-foreground">Next appointment date<input className="field" name="nextAppointmentDate" type="date" /></label>
          </div>
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md" disabled={loading}>
            {loading ? "Uploading..." : "Upload Prescription"}
          </button>
          {status && <p className={`text-sm font-bold ${status.includes("success") ? "text-green-700" : "text-red-700"}`}>{status}</p>}
        </div>
      </form>

      <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-foreground">Uploaded Files</h2>
        <div className="mt-5 grid gap-4">
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No prescriptions uploaded yet.</p> : items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.patientEmail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Uploaded: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <img src={`/api/prescription/${item.secureToken}/qr`} alt="QR code" className="h-24 w-24 rounded-xl border border-border bg-white p-2" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.nextTherapyDate && <span className="rounded-full bg-secondary px-3 py-1">Next therapy: {item.nextTherapyDate}</span>}
                {item.nextAppointmentDate && <span className="rounded-full bg-secondary px-3 py-1">Next appointment: {item.nextAppointmentDate}</span>}
              </div>
              <a className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground" href={`/prescription/${item.secureToken}`} target="_blank">Open Secure Page</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
