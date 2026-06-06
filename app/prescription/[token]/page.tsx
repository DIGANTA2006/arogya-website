import { getPrescriptionByToken } from "@/lib/prescription-store";

export default async function PrescriptionSecurePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const prescription = await getPrescriptionByToken(token);

  if (!prescription) {
    return (
      <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold">Secure file not found</h1>
          <p className="mt-3 text-muted-foreground">Please contact the clinic for help.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">Secure Prescription</span>
        <h1 className="mt-5 text-3xl font-extrabold text-foreground">{prescription.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This secure page opens the prescription/report uploaded by the clinic.
        </p>
        <img src={`/api/prescription/${token}/qr`} alt="Prescription QR code" className="mx-auto mt-6 h-48 w-48 rounded-2xl border border-border bg-white p-3" />
        <a href={`/api/prescription/${token}/download`} className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md">
          Download Prescription PDF
        </a>
      </div>
    </main>
  );
}
