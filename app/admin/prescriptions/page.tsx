import PrescriptionManager from "@/components/admin/prescription-manager";

export default function AdminPrescriptionsPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <strong className="text-2xl text-foreground">Prescription Upload</strong>
            <p className="mt-1 text-sm text-muted-foreground">Secure PDF upload, QR access and patient download</p>
          </div>
          <div className="flex gap-3">
            <a href="/admin/dashboard" className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground">Dashboard</a>
            <form action="/api/auth/logout" method="post"><button className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground">Logout</button></form>
          </div>
        </div>
      </header>
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PrescriptionManager />
        </div>
      </section>
    </main>
  );
}

