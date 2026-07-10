'use client'

import { useEffect, useMemo, useState } from 'react'

type AppointmentStatus = 'New' | 'Confirmed' | 'Completed' | 'Cancelled'
type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'rejected'

type Appointment = {
  id: string
  name: string
  phone: string
  email: string
  service: string
  appointmentType: string
  date: string
  time: string
  message: string
  status: AppointmentStatus
  createdAt: string
}

type PaymentSummary = {
  id: string
  appointmentId?: string
  appointment_id?: string
  amount?: number | null
  status?: PaymentStatus
  transactionRef?: string
  transaction_ref?: string
  submittedAt?: string
  submitted_at?: string
  verifiedAt?: string
  verified_at?: string
}

const statusOptions: AppointmentStatus[] = ['New', 'Confirmed', 'Completed', 'Cancelled']

function statusClass(status: AppointmentStatus) {
  if (status === 'Confirmed') return 'bg-sky-100 text-sky-700'
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-orange-100 text-orange-700'
}

function isOnlineAppointmentType(value: string) {
  const text = String(value || '').trim().toLowerCase()

  return (
    text.includes('online') ||
    text.includes('video') ||
    text.includes('meet')
  )
}

function getAppointmentStartDate(appointment: Appointment) {
  const dateText = String(appointment.date || "").trim();
  const timeText = String(appointment.time || "").trim().slice(0, 5);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeText)) return null;

  const parsed = new Date(`${dateText}T${timeText}:00+05:30`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function isPastAppointment(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  const closeAt = new Date(start.getTime() + 60 * 60 * 1000);

  return new Date() > closeAt;
}

function isTodayAppointment(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  const now = new Date();

  return start.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) ===
    now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function isUpcomingAppointment(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  return start.getTime() > Date.now();
}

function isMeetingWindowOpen(appointment: Appointment) {
  const start = getAppointmentStartDate(appointment);

  if (!start) return false;

  const now = new Date();
  const openAt = new Date(start.getTime() - 30 * 60 * 1000);
  const closeAt = new Date(start.getTime() + 60 * 60 * 1000);

  return now >= openAt && now <= closeAt;
}

function appointmentMatchesAdminFilter(appointment: Appointment, filter: string) {
  if (filter === "Active") {
    return (
      appointment.status !== "Completed" &&
      appointment.status !== "Cancelled" &&
      !isPastAppointment(appointment)
    );
  }

  if (filter === "Today") return isTodayAppointment(appointment);
  if (filter === "Upcoming") return isUpcomingAppointment(appointment);
  if (filter === "Past") return isPastAppointment(appointment) || appointment.status === "Completed";
  if (filter === "All") return true;

  return appointment.status === filter;
}
function buildMeetingGateUrl(appointmentId?: string) {
  return appointmentId ? `/api/meeting/${encodeURIComponent(appointmentId)}` : ""
}

function paymentStatusClass(status?: PaymentStatus) {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-700'
  if (status === 'rejected') return 'bg-rose-100 text-rose-700'
  if (status === 'submitted') return 'bg-yellow-100 text-yellow-700'
  return 'bg-slate-100 text-slate-700'
}

function paymentStatusLabel(status?: PaymentStatus) {
  if (status === 'paid') return 'Paid'
  if (status === 'rejected') return 'Rejected'
  if (status === 'submitted') return 'Submitted'
  return 'Not Submitted'
}

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<PaymentSummary[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')

  async function loadAppointments() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/appointments', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load appointments')
      const data = (await response.json()) as { appointments?: Appointment[] }
      setAppointments(data.appointments || [])
    } catch {
      setStatusMessage('Could not load appointments. Please login again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPayments() {
    try {
      const response = await fetch('/api/admin/payments', { cache: 'no-store' })
      if (!response.ok) return
      const data = (await response.json()) as { payments?: PaymentSummary[] }
      setPayments(data.payments || [])
    } catch {
      // Payment status is extra context only. Appointment CRM should still work.
    }
  }

  useEffect(() => {
    loadAppointments()
    loadPayments()
  }, [])

  const paymentByAppointment = useMemo(() => {
    const map = new Map<string, PaymentSummary>()

    for (const payment of payments) {
      const appointmentId = payment.appointmentId || payment.appointment_id
      if (appointmentId && !map.has(appointmentId)) map.set(appointmentId, payment)
    }

    return map
  }, [payments])

  const filteredAppointments = useMemo(() => {
    const query = search.toLowerCase()
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.name.toLowerCase().includes(query) ||
        appointment.phone.toLowerCase().includes(query) ||
        appointment.email.toLowerCase().includes(query) ||
        appointment.service.toLowerCase().includes(query) ||
        appointment.appointmentType.toLowerCase().includes(query)

      const matchesStatus = appointmentMatchesAdminFilter(appointment, statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [appointments, search, statusFilter])

  async function updateStatus(appointment: Appointment, status: AppointmentStatus) {
    setStatusMessage('')

    const isOnline = isOnlineAppointmentType(appointment.appointmentType)
    const payment = paymentByAppointment.get(appointment.id)

    if (
      isOnline &&
      (status === 'Confirmed' || status === 'Completed') &&
      payment?.status !== 'paid'
    ) {
      setStatusMessage(
        'Online consultation can be confirmed or completed only after payment is marked Paid.'
      )
      return
    }

    const response = await fetch('/api/admin/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appointment.id, status }),
    })

    if (!response.ok) {
      setStatusMessage('Status update failed.')
      return
    }

    setAppointments((previous) =>
      previous.map((item) => (item.id === appointment.id ? { ...item, status } : item))
    )
    setStatusMessage('Appointment status updated.')
  }

  const totalCompleted = appointments.filter((item) => item.status === 'Completed').length
  const activeCount = appointments.filter((item) => appointmentMatchesAdminFilter(item, 'Active')).length
  const todayCount = appointments.filter(isTodayAppointment).length
  const submittedPaymentCount = payments.filter((item) => item.status === 'submitted').length

  return (
    <div>
      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active Queue', activeCount],
          ["Today's Visits", todayCount],
          ['Payments to Verify', submittedPaymentCount],
          ['Completed', totalCompleted],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-4xl text-foreground">{value}</strong>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_170px]">
        <input
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search name, phone, email, service..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>Active</option>
          <option>Today</option>
          <option>Upcoming</option>
          <option>Past</option>
          <option>All</option>
          {statusOptions.map((status) => <option key={status}>{status}</option>)}
        </select>
        <a className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground" href="/api/admin/appointments/export">
          Export CSV
        </a>
      </div>

      {statusMessage && (
        <div className="mb-5 rounded-2xl border border-border bg-white p-4 text-sm font-medium text-foreground">
          {statusMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No appointment leads found. Submit the homepage appointment form once to test this CRM.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => {
                  const isOnline = isOnlineAppointmentType(appointment.appointmentType)
                  const meetingLink = isOnline ? buildMeetingGateUrl(appointment.id) : ""
                  const payment = paymentByAppointment.get(appointment.id)
                  const meetingOpen = payment?.status === 'paid' && isMeetingWindowOpen(appointment)
                  const pastAppointment = isPastAppointment(appointment)

                  return (
                    <tr key={appointment.id} className="border-t border-border align-top">
                      <td className="p-4">
                        <strong className="text-foreground">{appointment.name}</strong>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(appointment.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <a href={`tel:${appointment.phone}`} className="font-bold text-primary">{appointment.phone}</a>
                        <p className="mt-1 text-xs text-muted-foreground">{appointment.email || 'No email'}</p>
                      </td>
                      <td className="p-4">{appointment.service}</td>
                      <td className="p-4">{appointment.appointmentType}</td>
                      <td className="p-4">
                        {isOnline ? (
                          <div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paymentStatusClass(payment?.status)}`}>
                              {paymentStatusLabel(payment?.status)}
                            </span>
                            <a href="/admin/payments" className="mt-2 block text-xs font-bold text-primary">
                              Verify Payment
                            </a>
                            {meetingOpen ? (
                              <a
                                href={meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-primary"
                              >
                                Start Meeting
                              </a>
                            ) : (
                              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                                {payment?.status === 'paid' ? 'Meeting done / closed' : 'Meeting locked until paid'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Pay at Clinic
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <strong>{appointment.date}</strong>
                        <p className="mt-1 text-xs text-muted-foreground">{appointment.time}</p>
                        {pastAppointment ? (
                          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-600">
                            Past
                          </p>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        <select
                          className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                          value={appointment.status}
                          onChange={(event) => updateStatus(appointment, event.target.value as AppointmentStatus)}
                        >
                          {statusOptions.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="max-w-xs p-4 text-muted-foreground">{appointment.message || 'No message'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-relaxed text-sky-800">
        <strong>Online consultation rule:</strong> UPI payment is used only for online video consultations.
        Physical clinic visits and walk-in patients should pay normally at the clinic reception.
      </div>
    </div>
  )
}
