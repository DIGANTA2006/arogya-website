'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PortalLoginFormProps = {
  role: 'admin' | 'client'
  title: string
  description: string
}

export default function PortalLoginForm({ role, title, description }: PortalLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email, password }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Login failed')

      router.push(role === 'admin' ? '/admin/dashboard' : '/client/dashboard')
      router.refresh()
    } catch {
      setStatus('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-7 shadow-2xl sm:p-9">
        <a href="/" className="text-sm font-bold text-primary hover:underline">
          ← Back to website
        </a>

        <div className="mt-7">
          <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            {role === 'admin' ? 'Admin Access' : 'Client Access'}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <form onSubmit={handleLogin} className="mt-7 grid gap-4">
          <input
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
          {status && <p className="text-sm font-medium text-destructive">{status}</p>}
        </form>

        <div className="mt-6 rounded-2xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
          <strong>Preview credentials are stored in .env.local.</strong>
          <br />Change every password before deploying for the client.
        </div>
      </div>
    </main>
  )
}



