const cards = [
  {
    title: "Smart Prescription Sheets",
    text: "Reception creates QR prescription sheets for offline or online patients before the doctor writes by hand.",
    link: "/admin/prescription-visits",
    button: "Create QR Sheet",
  },
  {
    title: "Scanner Upload",
    text: "Upload scanned handwritten prescriptions. QR auto-matches the file to the correct patient account.",
    link: "/admin/scanner",
    button: "Open Scanner",
  },
  {
    title: "Patient History",
    text: "Search one patient by email or mobile and view patient details, appointments, prescriptions and reports.",
    link: "/admin/patients",
    button: "Search Patient",
  },
  {
    title: "Appointment CRM",
    text: "View, filter, update and export appointment leads submitted from the website.",
    link: "/admin/appointments",
    button: "Open CRM",
  },
  {
    title: "UPI Payment Verification",
    text: "Review patient UPI references and screenshots, then mark payment as paid or rejected.",
    link: "/admin/payments",
    button: "Verify Payments",
  },
  {
    title: "Prescription Archive",
    text: "View uploaded prescriptions and secure patient download records.",
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
    title: "Client Portal",
    text: "Open patient-facing login portal for prescriptions, appointments and follow-up support.",
    link: "/client/login",
    button: "Client Login",
  },
  {
    title: "Website",
    text: "Review the public homepage, services, chatbot, contact section and final call-to-action.",
    link: "/",
    button: "View Website",
  },
  {
    title: "Export Data",
    text: "Download appointment enquiries as CSV for clinic records and follow-up calls.",
    link: "/api/admin/appointments/export",
    button: "Export CSV",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">Admin Dashboard</strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Clinic management portal
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Admin Control
            </span>

            <h1 className="mt-5 text-4xl font-extrabold text-foreground sm:text-5xl">
              Manage clinic leads and patient records
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Create QR prescription sheets, upload scanned handwritten prescriptions, manage appointments and review patient history from one dashboard.
            </p>
          </div>

          <div className="mb-8 rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-foreground">
              Offline patient workflow
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              If a patient comes directly to the clinic, use <strong>Smart Prescription Sheets</strong>. Enter patient name, email, mobile and age once. The system creates or links the patient account, prints a QR sheet, and later the scanner uploads the handwritten prescription to the same patient portal.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/admin/prescription-visits"
                className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
              >
                Create Offline QR Sheet
              </a>

              <a
                href="/admin/scanner"
                className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
              >
                Upload Scanned Prescription
              </a>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-foreground">
                  {card.title}
                </h2>

                <p className="my-4 text-sm leading-relaxed text-muted-foreground">
                  {card.text}
                </p>

                <a
                  href={card.link}
                  className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md"
                >
                  {card.button}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
