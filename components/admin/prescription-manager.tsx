"use client";

import { useEffect, useMemo, useState } from "react";

type Prescription = {
  id: string;
  patientEmail: string;
  title: string;
  secureToken: string;
  nextTherapyDate: string;
  nextAppointmentDate: string;
  createdAt: string;
};

function extractRxNumber(title: string) {
  const match = String(title || "").match(/RX-\d{4}-\d{6}/i);
  return match?.[0]?.toUpperCase() || "";
}

function getArchiveKey(item: Prescription) {
  return extractRxNumber(item.title) || `${item.patientEmail}:${item.title}`;
}

export default function PrescriptionManager() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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

  const latestItems = useMemo(() => {
    const map = new Map<string, Prescription>();

    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const item of sorted) {
      const key = getArchiveKey(item);

      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  }, [items]);

  const visibleItems = showHistory ? items : latestItems;
  const hiddenHistoryCount = Math.max(0, items.length - latestItems.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Smart Upload Workflow
        </span>

        <h2 className="mt-5 text-2xl font-extrabold text-foreground">
          QR Upload Workflow
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Prescriptions should be uploaded through the QR scanner system. This prevents wrong patient selection and keeps the latest uploaded prescription visible by default.
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
            Reception creates QR sheet → Doctor writes by hand → Staff scans prescription → Scanner auto-matches QR → RX becomes Done → Patient downloads from dashboard.
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
              Default view shows the latest prescription per RX. Replacement/history files stay saved and can be viewed using History mode.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              {showHistory ? "Show Latest Only" : "Show History"}
            </button>

            <button
              type="button"
              onClick={load}
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
            Latest Visible: {latestItems.length}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
            Total Saved: {items.length}
          </div>
          <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">
            Hidden History: {hiddenHistoryCount}
          </div>
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

          {!loading && visibleItems.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-sm font-bold text-muted-foreground">
              No prescriptions uploaded yet.
            </p>
          )}

          {visibleItems.map((item) => {
            const rxNumber = extractRxNumber(item.title);
            const isHistoryHidden = !showHistory && hiddenHistoryCount > 0;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {rxNumber && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase text-green-700">
                          Done
                        </span>
                      )}

                      {rxNumber && (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase text-primary">
                          {rxNumber}
                        </span>
                      )}

                      {!showHistory && isHistoryHidden && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">
                          Latest
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-extrabold text-foreground">
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
                    rel="noreferrer"
                  >
                    Open Secure Page
                  </a>

                  <a
                    className="rounded-full border border-border bg-white px-4 py-2 text-xs font-extrabold text-foreground"
                    href={`/api/prescription/${item.secureToken}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download File
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
