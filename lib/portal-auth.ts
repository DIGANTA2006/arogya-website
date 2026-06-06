import { cookies } from 'next/headers'

async function createSignature(value: string) {
  const secret = process.env.AUTH_SECRET || 'change-this-secret-before-production'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function createPortalToken(role: 'admin' | 'client') {
  return createSignature(role)
}

export async function hasPortalRole(requiredRole: 'admin' | 'client') {
  const cookieStore = await cookies()
  const role = cookieStore.get('portal_role')?.value
  const token = cookieStore.get('portal_token')?.value

  if (role !== requiredRole || !token) return false

  const expectedToken = await createSignature(requiredRole)
  return safeEqual(token, expectedToken)
}



