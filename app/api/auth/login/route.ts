import { NextResponse } from 'next/server'
import { createPortalToken } from '@/lib/portal-auth'

type LoginBody = {
  role?: 'admin' | 'client'
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody

    if (!body.role || !body.email || !body.password) {
      return NextResponse.json({ error: 'Email, password and role are required.' }, { status: 400 })
    }

    const isAdmin =
      body.role === 'admin' &&
      body.email === process.env.ADMIN_EMAIL &&
      body.password === process.env.ADMIN_PASSWORD

    const isClient =
      body.role === 'client' &&
      body.email === process.env.CLIENT_EMAIL &&
      body.password === process.env.CLIENT_PASSWORD

    if (!isAdmin && !isClient) {
      return NextResponse.json({ error: 'Invalid login details.' }, { status: 401 })
    }

    const token = await createPortalToken(body.role)
    const response = NextResponse.json({ success: true, role: body.role })

    response.cookies.set('portal_role', body.role, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    response.cookies.set('portal_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}




