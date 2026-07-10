"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  RefreshCw,
  Star,
} from "lucide-react";

type Appointment = {
  id: string;
  name: string;
  service: string;
  appointmentType: string;
  date: string;
  time: string;
  status: string;
};

type Payment = { status?: string };
type Visit = { status?: string };
type Review = { status?: string };

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export default function AdminDashboardOverview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch("/api/admin/appointments", { cache: "no-store" }),
        fetch("/api/admin/payments", { cache: "no-store" }),
        fetch("/api/admin/prescription-visits", { cache: "no-store" }),
        fetch("/api/admin/reviews", { cache: "no-store" }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("One or more clinic queues could not be loaded.");
      }

      const [appointmentData, paymentData, visitData, reviewData] =
        await Promise.all(responses.map((response) => response.json()));

      setAppointments(appointmentData.appointments || []);
      setPayments(paymentData.payments || []);
      setVisits(visitData.visits || []);
      setReviews(reviewData.reviews || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Clinic queues could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const today = indiaToday();
    const todayAppointments = appointments
      .filter(
        (appointment) =>
          appointment.date === today &&
          !["Completed", "Cancelled"].includes(appointment.status)
      )
      .sort((first, second) => first.time.localeCompare(second.time));

    return {
      todayAppointments,
      submittedPayments: payments.filter((payment) => payment.status === "submitted").length,
      pendingRx: visits.filter(
        (visit) => !["uploaded", "cancelled"].includes(String(visit.status || ""))
      ).length,
      pendingReviews: reviews.filter((review) => review.status === "Pending").length,
    };
  }, [appointments, payments, reviews, visits]);

  const cards = [
    {
      label: "Today's active visits",
      value: summary.todayAppointments.length,
      href: "/admin/appointments",
      action: "Open schedule",
      icon: <CalendarDays size={23} />,
      tone: "from-blue-600 to-cyan-500",
    },
    {
      label: "Payments to verify",
      value: summary.submittedPayments,
      href: "/admin/payments",
      action: "Review payments",
      icon: <CreditCard size={23} />,
      tone: "from-amber-500 to-orange-500",
    },
    {
      label: "RX awaiting upload",
      value: summary.pendingRx,
      href: "/admin/prescription-visits",
      action: "Continue RX flow",
      icon: <FileText size={23} />,
      tone: "from-emerald-600 to-teal-500",
    },
    {
      label: "Reviews to moderate",
      value: summary.pendingReviews,
      href: "/admin/reviews",
      action: "Moderate reviews",
      icon: <Star size={23} />,
      tone: "from-violet-600 to-fuchsia-500",
    },
  ];

  return (
    <section className="mb-8" aria-label="Live clinic overview">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Live Priority Queue
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            What needs attention now
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          {error} Refresh the page or check the relevant setup screen.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`h-1.5 bg-gradient-to-r ${card.tone}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md ${card.tone}`}>
                  {card.icon}
                </span>
                <strong className="text-4xl font-black tracking-tight text-slate-950">
                  {loading ? "—" : card.value}
                </strong>
              </div>
              <h3 className="mt-5 font-black text-slate-900">{card.label}</h3>
              <span className="mt-3 inline-flex text-xs font-black uppercase tracking-wider text-blue-700 group-hover:text-blue-900">
                {card.action} →
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">Today's next patients</h3>
            <p className="mt-1 text-sm text-slate-500">Active visits in clinic time order.</p>
          </div>
          <a href="/admin/appointments" className="text-sm font-black text-blue-700">
            View complete CRM →
          </a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {!loading && summary.todayAppointments.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500 md:col-span-2 xl:col-span-3">
              No active appointment remains for today.
            </p>
          )}
          {summary.todayAppointments.slice(0, 6).map((appointment) => (
            <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950">{appointment.name}</strong>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {appointment.service} · {appointment.appointmentType}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">
                  {appointment.time}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
