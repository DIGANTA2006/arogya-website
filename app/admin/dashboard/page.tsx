const priorityCards = [
  {
    title: "Today's Appointments",
    text: "Open the appointment CRM and handle today's physical and online consultations first.",
    href: "/admin/appointments",
    action: "Open Today Work",
    tone: "bg-blue-50 text-blue-800 border-blue-100",
  },
  {
    title: "Pending Online Payments",
    text: "Verify submitted UPI references before online video consultation access is allowed.",
    href: "/admin/payments",
    action: "Verify Payments",
    tone: "bg-yellow-50 text-yellow-800 border-yellow-100",
  },
  {
    title: "Pending Prescriptions",
    text: "Create RX sheets, write digitally, or upload scanned prescriptions after doctor checkup.",
    href: "/admin/prescription-visits",
    action: "Open RX Workflow",
    tone: "bg-green-50 text-green-800 border-green-100",
  },
  {
    title: "Patient Lookup",
    text: "Search by email or mobile to view profile, appointments, prescriptions and history.",
    href: "/admin/patients",
    action: "Search Patient",
    tone: "bg-purple-50 text-purple-800 border-purple-100",
  },
];

const workflowSteps = [
  {
    title: "1. Appointment",
    text: "Patient books online or clinic staff creates a clinic visit record.",
    href: "/admin/appointments",
  },
  {
    title: "2. Payment",
    text: "Only online video consultations need UPI verification before meeting access.",
    href: "/admin/payments",
  },
  {
    title: "3. Doctor Checkup",
    text: "Doctor completes consultation, writes prescription by hand or digitally.",
    href: "/admin/prescription-visits",
  },
  {
    title: "4. Upload Done",
    text: "Scanner uploads prescription to the correct patient account and the RX becomes done.",
    href: "/admin/scanner",
  },
];

const managementCards = [
  {
    title: "Smart Prescription Sheets",
    text: "Create QR prescription sheets for walk-in, offline and online patients.",
    href: "/admin/prescription-visits",
    action: "Create Sheet",
  },
  {
    title: "Scanner Upload",
    text: "Upload handwritten prescription scans. QR auto-matches the patient and RX.",
    href: "/admin/scanner",
    action: "Open Scanner",
  },
  {
    title: "Prescription Archive",
    text: "View secure prescription downloads and latest uploaded RX records.",
    href: "/admin/prescriptions",
    action: "View Archive",
  },
  {
    title: "Patient Reviews",
    text: "Approve and manage website reviews submitted by patients.",
    href: "/admin/reviews",
    action: "Manage Reviews",
  },
  {
    title: "Audit Logs",
    text: "Review sensitive admin actions and database workflow changes.",
    href: "/admin/audit-logs",
    action: "View Logs",
  },
  {
    title: "Admin Security",
    text: "Verify password hash, admin email, 2FA readiness and session protection.",
    href: "/admin/security",
    action: "Check Security",
  },
  {
    title: "Export Appointments",
    text: "Download appointment enquiry records as CSV for clinic records.",
    href: "/api/admin/appointments/export",
    action: "Export CSV",
  },
  {
    title: "Public Website",
    text: "Review homepage, services, chatbot, contact section and patient experience.",
    href: "/",
    action: "View Website",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <strong className="text-2xl text-foreground">Admin Dashboard</strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Daily clinic operations for reception, doctor and admin team.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/security"
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Security Check
            </a>

            <form action="/api/auth/logout" method="post">
              <button
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-primary/20 bg-white shadow-sm">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
              <div>
                <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Clinic Control Room
                </span>

                <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Start with today's work, then clear pending payments and prescriptions.
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  The dashboard is arranged around the real clinic flow: appointment, payment, doctor checkup, prescription upload and patient history.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/admin/appointments"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md"
                  >
                    Open Appointment CRM
                  </a>

                  <a
                    href="/admin/prescription-visits"
                    className="rounded-full border border-border bg-white px-6 py-3 text-sm font-extrabold text-foreground"
                  >
                    Open RX Workflow
                  </a>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 text-blue-900">
                <h2 className="text-lg font-black">Daily operating rule</h2>
                <p className="mt-3 text-sm leading-7">
                  Completed appointments should not stay in the active work list. After doctor checkup, upload the prescription and move the RX to done. Old records should stay in history/archive, not in today's main workflow.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Priority Queue
                </span>
                <h2 className="mt-4 text-3xl font-extrabold text-foreground">
                  Handle these first
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {priorityCards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  className={`rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${card.tone}`}
                >
                  <h3 className="text-xl font-black">{card.title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 opacity-90">
                    {card.text}
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black">
                    {card.action}
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Correct Clinic Flow
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-foreground">
                From booking to patient download
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step) => (
                <a
                  key={step.title}
                  href={step.href}
                  className="rounded-3xl border border-border bg-slate-50 p-5 transition hover:bg-white hover:shadow-sm"
                >
                  <h3 className="font-black text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.text}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5">
              <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Management Tools
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-foreground">
                Admin tools
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {managementCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xl font-black text-foreground">
                    {card.title}
                  </h3>

                  <p className="my-4 min-h-[72px] text-sm leading-relaxed text-muted-foreground">
                    {card.text}
                  </p>

                  <a
                    href={card.href}
                    className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md"
                  >
                    {card.action}
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
