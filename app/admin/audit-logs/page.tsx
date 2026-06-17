"use client";

import { useEffect, useMemo, useState } from "react";

type AuditLog = {
  id: string;
  action?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  patient_email?: string | null;
  actor_role?: string | null;
  actor_subject?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

function formatDate(value?: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function cleanText(value: unknown) {
  return String(value || "-");
}

function cleanAction(value?: string) {
  return String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) return "-";

  const operation = metadata.operation;
  const table = metadata.table;
  const before = metadata.status_before;
  const after = metadata.status_after;

  const parts = [
    operation ? `Operation: ${operation}` : "",
    table ? `Table: ${table}` : "",
    before || after ? `Status: ${before || "none"} to ${after || "none"}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(metadata);
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadLogs() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/audit-logs", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.detail || data.error || "Could not load audit logs.");
        return;
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      setMessage("Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return logs;

    return logs.filter((log) =>
      [
        log.action,
        log.entity_type,
        log.entity_id,
        log.patient_email,
        log.actor_role,
        log.actor_subject,
        shortMetadata(log.metadata),
        log.created_at,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [logs, search]);

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">
              Admin Audit Logs
            </strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Security history for sensitive patient, appointment, payment, prescription and review changes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadLogs}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Refresh
            </button>

            <a
              href="/admin/dashboard"
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Security Monitoring
            </span>

            <h1 className="mt-5 text-3xl font-extrabold text-foreground sm:text-4xl">
              Sensitive action history
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Audit logs are generated automatically by Supabase database triggers. New logs appear when sensitive records are inserted, updated or deleted.
            </p>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search action, table, patient email, record ID or status..."
              className="mt-5 w-full rounded-full border border-border px-5 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Time</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Table</th>
                    <th className="px-5 py-4">Record</th>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center font-bold text-muted-foreground">
                        Loading audit logs...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center font-bold text-muted-foreground">
                        No audit logs found yet. Change a payment status, appointment, prescription or review to create a new log.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-t border-border">
                        <td className="px-5 py-4 font-bold text-foreground">
                          {formatDate(log.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-primary">
                            {cleanAction(log.action)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-foreground">
                          {cleanText(log.entity_type)}
                        </td>

                        <td className="max-w-[180px] truncate px-5 py-4 text-muted-foreground">
                          {cleanText(log.entity_id)}
                        </td>

                        <td className="max-w-[240px] truncate px-5 py-4 text-muted-foreground">
                          {cleanText(log.patient_email)}
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {shortMetadata(log.metadata)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}