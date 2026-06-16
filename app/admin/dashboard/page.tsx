const cards = [
  {
    title: "Scanner Upload",
    text: "Upload scanned handwritten prescriptions using QR token auto-matching.",
    link: "/admin/scanner",
    button: "Open Scanner",
  },
  {
    title: "Smart Prescription Sheets",
    text: "Reception creates QR prescription sheets before the doctor writes by hand.",
    link: "/admin/patients",
    button: "Create Sheet",
  },
  {
    title: "Prescription Archive",
    text: "View uploaded prescriptions. New uploads should happen through Scanner Upload.",
    link: "/admin/prescriptions",
    button: "View Archive",
  },
  {
    title: "Patient Reviews",
    text: "Approve and manage patient feedback shown on the website.",
    link: "/admin/reviews",
    button: "Manage Reviews",
  },
  {
    title: 'Appointment CRM',
    text: 'View, filter, update and export appointment leads submitted from the website.',
    link: '/admin/appointments',
    button: 'Open CRM',
  },
  {
    title: 'Online Consultation',
    text: 'Track virtual therapy and video consultation requests from the appointment form.',
    link: '/admin/appointments',
    button: 'View Requests',
  },
  {
    title: 'Database & Storage',
    text: 'Use Supabase database and private storage for appointments, prescriptions and reminders.',
    link: '/admin/appointments',
    button: 'Check Leads',
  },
  {
    title: 'Client Portal',
    text: 'Patient-facing login portal for appointment instructions and follow-up support information.',
    link: '/client/login',
    button: 'Client Login',
  },
  {
    title: 'Website',
    text: 'Review the live homepage, services, chatbot, virtual consultation and final call-to-action.',
    link: '/',
    button: 'View Website',
  },
  {
    title: 'Export Data',
    text: 'Download all appointment enquiries as CSV for clinic records and follow-up calls.',
    link: '/api/admin/appointments/export',
    button: 'Export CSV',
  },
]

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">Admin Dashboard</strong>
            <p className="mt-1 text-sm text-muted-foreground">Clinic management portal</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground" type="submit">Logout</button>
          </form>
        </div>
      </header>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">Admin Control</span>
            <h1 className="mt-5 text-4xl font-extrabold text-foreground sm:text-5xl">Manage clinic leads and services</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              This dashboard includes a working appointment CRM, export option, and production-ready database pathway.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.title} className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground">{card.title}</h2>
                <p className="my-4 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
                <a href={card.link} className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md">
                  {card.button}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}





