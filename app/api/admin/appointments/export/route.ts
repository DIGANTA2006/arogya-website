import { NextResponse } from 'next/server'
import { getAppointments } from '@/lib/appointment-store'
import { hasPortalRole } from '@/lib/portal-auth'

function csvCell(value: unknown) {
  const text = String(value || '')
  const spreadsheetSafe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${spreadsheetSafe.replace(/"/g, '""')}"`
}

export async function GET() {
  const allowed = await hasPortalRole('admin')
  if (!allowed) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const appointments = await getAppointments()
  const headers = [
    'Created At',
    'Status',
    'Name',
    'Phone',
    'Email',
    'Service',
    'Appointment Type',
    'Preferred Date',
    'Preferred Time',
    'Message',
    'Lead ID',
  ]

  const rows = appointments.map((appointment) => [
    appointment.createdAt,
    appointment.status,
    appointment.name,
    appointment.phone,
    appointment.email,
    appointment.service,
    appointment.appointmentType,
    appointment.date,
    appointment.time,
    appointment.message,
    appointment.id,
  ])

  const csv = [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=appointments.csv',
      'Cache-Control': 'private, no-store',
    },
  })
}





