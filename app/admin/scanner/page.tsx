import ScannerUploadPanel from "@/components/admin/scanner-upload-panel";

export default function AdminScannerPage() {
  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <strong className="text-2xl text-foreground">
              Prescription Scanner Upload
            </strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan handwritten prescriptions and upload them to the correct patient account.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/dashboard"
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Dashboard
            </a>

            <a
              href="/admin/prescription-visits"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              QR Sheets
            </a>
          </div>
        </div>
      </header>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScannerUploadPanel />
        </div>
      </section>
    </main>
  );
}