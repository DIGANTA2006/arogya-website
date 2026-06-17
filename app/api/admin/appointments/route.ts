import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from 'next/server'
import { AppointmentStatus, getAppointments, updateAppointmentStatus } from '@/lib/appointment-store'
import { hasPortalRole } from '@/lib/portal-auth'

const validStatuses: AppointmentStatus[] = ['New', 'Confirmed', 'Completed', 'Cancelled']

export async function GET() {
  const allowed = await hasPortalRole('admin')
  if (!allowed) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const appointments = await getAppointments()
  return NextResponse.json({ appointments })
}

export async function PATCH(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const allowed = await hasPortalRole('admin')
  if (!allowed) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as { id?: string; status?: AppointmentStatus }

  if (!body.id || !body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid appointment status update.' }, { status: 400 })
  }

  const appointment = await updateAppointmentStatus(body.id, body.status)
  if (!appointment) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 })

  return NextResponse.json({ success: true, appointment })
}




