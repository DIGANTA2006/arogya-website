import AppointmentManager from '@/components/admin/appointment-manager'

export default function AdminAppointmentsPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">Appointment CRM</strong>
            <p className="mt-1 text-sm text-muted-foreground">Manage website appointment leads</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/admin/dashboard" className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground">Dashboard</a>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground" type="submit">Logout</button>
            </form>
          </div>
        </div>
      </header>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">Lead Management</span>
            <h1 className="mt-5 text-4xl font-extrabold text-foreground sm:text-5xl">Appointment Requests</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              View, filter, update and export appointment leads submitted from the website.
            </p>
          </div>
          <AppointmentManager />
        </div>
      </section>
    </main>
  )
}




