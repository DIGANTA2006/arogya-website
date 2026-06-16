"use client";

import { FormEvent, useState } from "react";

type Patient = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  age?: string;
  mobile_verified?: boolean;
  created_at?: string;
};

type Appointment = {
  id: string;
  name?: string;
  age?: string;
  phone?: string;
  email?: string;
  service?: string;
  appointment_type?: string;
  appointmentType?: string;
  date?: string;
  time?: string;
  status?: string;
  message?: string;
  created_at?: string;
};

type Prescription = {
  id: string;
  title?: string;
  patient_email?: string;
  file_name?: string;
  secure_token?: string;
  next_therapy_date?: string;
  next_appointment_date?: string;
  created_at?: string;
};

type HistoryResponse = {
  patient: Patient | null;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  error?: string;
  detail?: string;
};

function displayDate(value?: string) {
  if (!value) return "Not set";

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function AdminPatientsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("");
    setLoading(true);
    setData(null);

    const response = await fetch(
      `/api/admin/patient-history?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
      }
    );

    const result = (await response.json().catch(() => ({}))) as HistoryResponse;

    setLoading(false);

    if (!response.ok) {
      setStatus(result.detail || result.error || "Search failed.");
      return;
    }

    setData(result);

    if (!result.patient) {
      setStatus("No patient found.");
    }
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
              Admin Patient Records
            </p>
            <h1 className="mt-2 text-4xl font-black text-foreground">
              Patient History
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Search by patient email or mobile number to view appointments and prescriptions.
            </p>
          </div>

          <a
            href="/admin/dashboard"
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            Dashboard
          </a>
        </div>

        <form
          onSubmit={searchPatient}
          className="mt-8 flex flex-col gap-3 rounded-[2rem] border border-border bg-white p-5 shadow-sm md:flex-row"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter patient email or mobile number"
            className="min-w-0 flex-1 rounded-full border border-border px-5 py-3 text-sm outline-none focus:border-primary"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-7 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {status && (
          <p className="mt-5 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-foreground shadow-sm">
            {status}
          </p>
        )}

        {data?.patient && (
          <div className="mt-8 grid gap-6">
            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
                Patient Details
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Name
                  </p>
                  <p className="mt-1 font-black text-foreground">
                    {data.patient.name || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 break-all font-black text-foreground">
                    {data.patient.email || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 font-black text-foreground">
                    {data.patient.phone || "Not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Mobile OTP
                  </p>
                  <p className="mt-1 font-black text-foreground">
                    {data.patient.mobile_verified ? "Verified" : "Not verified"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
                Appointment History
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="py-3">Date</th>
                      <th className="py-3">Time</th>
                      <th className="py-3">Service</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.appointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-5 text-center font-bold text-muted-foreground">
                          No appointments found.
                        </td>
                      </tr>
                    )}

                    {data.appointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b border-border">
                        <td className="py-3 font-bold">{appointment.date || "Not set"}</td>
                        <td className="py-3">{appointment.time || "Not set"}</td>
                        <td className="py-3">{appointment.service || "Not set"}</td>
                        <td className="py-3">
                          {appointment.appointment_type || appointment.appointmentType || "Clinic Visit"}
                        </td>
                        <td className="py-3">{appointment.status || "Pending"}</td>
                        <td className="py-3">{displayDate(appointment.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
                Prescription / Report History
              </p>

              <div className="mt-5 grid gap-3">
                {data.prescriptions.length === 0 && (
                  <p className="rounded-2xl bg-secondary/50 p-5 text-center text-sm font-bold text-muted-foreground">
                    No prescriptions found.
                  </p>
                )}

                {data.prescriptions.map((prescription) => (
                  <article
                    key={prescription.id}
                    className="rounded-2xl border border-border bg-secondary/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-black text-foreground">
                          {prescription.title || "Prescription"}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Uploaded: {displayDate(prescription.created_at)}
                        </p>
                        {prescription.next_therapy_date && (
                          <p className="mt-1 text-xs font-bold text-primary">
                            Next therapy: {prescription.next_therapy_date}
                          </p>
                        )}
                        {prescription.next_appointment_date && (
                          <p className="mt-1 text-xs font-bold text-primary">
                            Next appointment: {prescription.next_appointment_date}
                          </p>
                        )}
                      </div>

                      {prescription.secure_token && (
                        <a
                          href={`/prescription/${prescription.secure_token}`}
                          target="_blank"
                          className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
                        >
                          Open Secure Page
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}