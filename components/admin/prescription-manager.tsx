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
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/admin/prescriptions", {
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setItems(data.prescriptions || []);
    } else {
      setStatus(data.error || "Could not load uploaded prescriptions.");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Smart Upload Workflow
        </span>

        <h2 className="mt-5 text-2xl font-extrabold text-foreground">
          Manual Upload Removed
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Prescriptions should now be uploaded through the QR scanner system. This prevents wrong patient selection and removes manual searching.
        </p>

        <div className="mt-6 grid gap-3">
          <a
            href="/admin/prescription-visits"
            className="rounded-full bg-primary px-5 py-3 text-center text-sm font-extrabold text-primary-foreground shadow-md"
          >
            Create QR Prescription Sheet
          </a>

          <a
            href="/admin/scanner"
            className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-extrabold text-white shadow-md"
          >
            Open Scanner Upload
          </a>

          <button
            type="button"
            onClick={load}
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            Refresh Archive
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
          <strong>Correct clinic flow:</strong>
          <p className="mt-2">
            Reception creates QR sheet → Doctor writes by hand → Staff scans prescription → Scanner auto-matches QR → Patient downloads from dashboard.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Uploaded Files
            </span>

            <h2 className="mt-5 text-2xl font-extrabold text-foreground">
              Prescription Archive
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              These files were uploaded through scanner/manual legacy system and are available to patients.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
          >
            Refresh
          </button>
        </div>

        {status && (
          <p className="mt-5 text-sm font-bold text-red-700">
            {status}
          </p>
        )}

        <div className="mt-6 grid gap-4">
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading uploaded prescriptions...
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-sm font-bold text-muted-foreground">
              No prescriptions uploaded yet.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.patientEmail}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Uploaded: {new Date(item.createdAt).toLocaleString()}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {item.nextTherapyDate && (
                      <span className="rounded-full bg-secondary px-3 py-1">
                        Next therapy: {item.nextTherapyDate}
                      </span>
                    )}

                    {item.nextAppointmentDate && (
                      <span className="rounded-full bg-secondary px-3 py-1">
                        Next appointment: {item.nextAppointmentDate}
                      </span>
                    )}
                  </div>
                </div>

                <img
                  src={`/api/prescription/${item.secureToken}/qr`}
                  alt="Prescription QR code"
                  className="h-24 w-24 rounded-xl border border-border bg-white p-2"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
                  href={`/prescription/${item.secureToken}`}
                  target="_blank"
                >
                  Open Secure Page
                </a>

                <a
                  className="rounded-full border border-border bg-white px-4 py-2 text-xs font-extrabold text-foreground"
                  href={`/api/prescription/${item.secureToken}/download`}
                  target="_blank"
                >
                  Download File
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}