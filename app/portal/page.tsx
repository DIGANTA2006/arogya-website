export default function PortalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm font-bold text-primary hover:underline">← Back to website</a>

        <div className="mx-auto my-12 max-w-3xl text-center">
          <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            Login Portal
          </span>
          <h1 className="mt-5 text-4xl font-extrabold text-foreground sm:text-6xl">Choose your portal</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Admin portal is for clinic staff. Client portal is for patients and consultation support.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-xl">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Clinic Staff
            </span>
            <h2 className="mt-5 text-3xl font-bold text-foreground">Admin Portal</h2>
            <p className="my-4 text-sm leading-relaxed text-muted-foreground">
              Manage appointment leads, status, online consultation requests and export patient enquiries.
            </p>
            <a href="/admin/login" className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md">
              Admin Login
            </a>
          </div>

          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-xl">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Patient / Client
            </span>
            <h2 className="mt-5 text-3xl font-bold text-foreground">Client Portal</h2>
            <p className="my-4 text-sm leading-relaxed text-muted-foreground">
              View appointment guidance, virtual consultation instructions and follow-up support information.
            </p>
            <a href="/client/login" className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md">
              Client Login
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}



