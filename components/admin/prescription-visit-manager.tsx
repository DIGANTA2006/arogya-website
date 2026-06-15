"use client";

import { useEffect, useState } from "react";

type PrescriptionVisit = {
  id: string;
  rxNumber: string;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  appointmentId: string;
  appointmentType: string;
  uploadToken: string;
  status: string;
  uploadedPrescriptionToken: string;
  printedAt: string;
  scannedAt: string;
  createdAt: string;
};

type LookupResult = {
  id: string;
  source: "patient" | "appointment";
  label: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge: string;
  appointmentId: string;
  appointmentType: string;
  date: string;
  time: string;
};

const emptyForm = {
  patientName: "",
  patientEmail: "",
  patientPhone: "",
  patientAge: "",
  appointmentType: "Clinic Visit",
  appointmentId: "",
};

export default function PrescriptionVisitManager() {
  const [visits, setVisits] = useState<PrescriptionVisit[]>([]);
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([]);
  const [lookupQuery, setLookupQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(emptyForm);

  async function loadVisits() {
    setLoadingList(true);

    const response = await fetch("/api/admin/prescription-visits", {
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setVisits(data.visits || []);
    } else {
      setStatus(data.error || "Could not load prescription visits. Run Supabase SQL first.");
    }

    setLoadingList(false);
  }

  useEffect(() => {
    loadVisits();
  }, []);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function searchPatients(value: string) {
    setLookupQuery(value);

    if (value.trim().length < 2) {
      setLookupResults([]);
      return;
    }

    setLookupLoading(true);

    const response = await fetch(
      `/api/admin/patient-lookup?q=${encodeURIComponent(value.trim())}`,
      { cache: "no-store" }
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setLookupResults(data.results || []);
    } else {
      setLookupResults([]);
    }

    setLookupLoading(false);
  }

  function applyLookup(result: LookupResult) {
    setForm({
      patientName: result.patientName || "",
      patientEmail: result.patientEmail || "",
      patientPhone: result.patientPhone || "",
      patientAge: result.patientAge || "",
      appointmentType: result.appointmentType || "Clinic Visit",
      appointmentId: result.appointmentId || "",
    });

    setLookupResults([]);
    setLookupQuery(result.label);
    setStatus(
      result.source === "appointment"
        ? "Appointment selected. Patient details auto-filled."
        : "Existing patient selected. Details auto-filled."
    );
  }

  async function createVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setStatus("");

    const response = await fetch("/api/admin/prescription-visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.detail || data.error || "Prescription visit could not be created.");
      setLoading(false);
      return;
    }

    setStatus(
      `${data.visit.rxNumber} created successfully. ${
        data.patientCreated ? "New patient account record created." : "Existing patient linked."
      }`
    );

    setForm(emptyForm);
    setLookupQuery("");
    setLookupResults([]);

    await loadVisits();
    setLoading(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={createVisit}
        className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
      >
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Reception System
        </span>

        <h2 className="mt-5 text-2xl font-extrabold text-foreground">
          Create QR Prescription Sheet
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Search existing online patients or appointment records. For a new walk-in patient, type details once and the system will create a patient record automatically.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Search Existing Patient / Appointment
            <input
              className="field"
              value={lookupQuery}
              onChange={(event) => searchPatients(event.target.value)}
              placeholder="Search name, email, mobile, appointment ID..."
            />
          </label>

          {lookupLoading && (
            <p className="text-sm font-bold text-muted-foreground">
              Searching...
            </p>
          )}

          {lookupResults.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-2">
              {lookupResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => applyLookup(result)}
                  className="mb-2 w-full rounded-xl border border-border bg-white p-4 text-left transition hover:bg-secondary"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                      {result.source}
                    </span>
                    <strong className="text-foreground">{result.patientName}</strong>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.patientEmail} {result.patientPhone ? `· ${result.patientPhone}` : ""}
                  </p>

                  {result.source === "appointment" && (
                    <p className="mt-1 text-xs font-bold text-primary">
                      {result.appointmentType} {result.date ? `· ${result.date}` : ""} {result.time ? `· ${result.time}` : ""}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Auto account rule:</strong> If this email is not found in patient records, the system will create a new patient record automatically.
          </div>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Patient Name
            <input
              className="field"
              name="patientName"
              placeholder="Patient full name"
              value={form.patientName}
              onChange={updateField}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Patient Email
            <input
              className="field"
              name="patientEmail"
              type="email"
              placeholder="patient@example.com"
              value={form.patientEmail}
              onChange={updateField}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              Mobile Number
              <input
                className="field"
                name="patientPhone"
                placeholder="Patient mobile"
                value={form.patientPhone}
                onChange={updateField}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-foreground">
              Age
              <input
                className="field"
                name="patientAge"
                placeholder="Age"
                value={form.patientAge}
                onChange={updateField}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              Appointment Type
              <select
                className="field"
                name="appointmentType"
                value={form.appointmentType}
                onChange={updateField}
                required
              >
                <option>Clinic Visit</option>
                <option>Online Consultation</option>
                <option>Speech Therapy</option>
                <option>Hearing Test</option>
                <option>Follow-up</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-foreground">
              Linked Appointment ID Auto
              <input
                className="field"
                name="appointmentId"
                placeholder="Auto from online appointment / blank for walk-in"
                value={form.appointmentId}
                onChange={updateField}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Generate QR Prescription Sheet"}
          </button>

          {status && (
            <p className={`text-sm font-bold ${status.includes("created") || status.includes("selected") || status.includes("successfully") ? "text-green-700" : "text-red-700"}`}>
              {status}
            </p>
          )}
        </div>
      </form>

      <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              RX Records
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-foreground">
              Recent Prescription Visits
            </h2>
          </div>

          <button
            type="button"
            onClick={loadVisits}
            className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          {loadingList && (
            <p className="text-sm text-muted-foreground">Loading prescription visits...</p>
          )}

          {!loadingList && visits.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No prescription visits created yet.
            </p>
          )}

          {visits.map((visit) => (
            <div
              key={visit.id}
              className="rounded-2xl border border-border p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-foreground">
                      {visit.rxNumber}
                    </h3>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase text-primary">
                      {visit.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-foreground">
                    {visit.patientName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {visit.patientEmail}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {visit.patientPhone && <span>Mobile: {visit.patientPhone}</span>}
                    {visit.patientAge && <span>Age: {visit.patientAge}</span>}
                    {visit.appointmentType && <span>Type: {visit.appointmentType}</span>}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(visit.createdAt).toLocaleString()}
                  </p>
                </div>

                <img
                  src={`/api/rx/${visit.uploadToken}/qr`}
                  alt={`QR for ${visit.rxNumber}`}
                  className="h-24 w-24 rounded-xl border border-border bg-white p-2"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/admin/prescription-visits/${visit.id}/print`}
                  target="_blank"
                  className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
                >
                  Print Sheet
                </a>

                <a
                  href={`/rx/${visit.uploadToken}`}
                  target="_blank"
                  className="rounded-full border border-border bg-white px-4 py-2 text-xs font-extrabold text-foreground"
                >
                  Open QR Page
                </a>

                {visit.uploadedPrescriptionToken && (
                  <a
                    href={`/prescription/${visit.uploadedPrescriptionToken}`}
                    target="_blank"
                    className="rounded-full bg-green-600 px-4 py-2 text-xs font-extrabold text-white"
                  >
                    Open Uploaded Prescription
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}