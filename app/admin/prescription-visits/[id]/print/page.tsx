import PrintButton from "@/components/admin/print-button";
import { getPrescriptionVisitById } from "@/lib/prescription-visit-store";

export default async function PrintPrescriptionVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visit = await getPrescriptionVisitById(id);

  if (!visit) {
    return (
      <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold text-foreground">
            Prescription visit not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please go back to the admin panel and create a new prescription visit.
          </p>
        </div>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/admin/prescription-visits"
          className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
        >
          Back
        </a>
        <PrintButton />
      </div>

      <section className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-8 shadow-xl print:min-h-screen print:max-w-none print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-950">
                Arogya Speech Therapy
              </h1>
              <p className="mt-1 text-sm font-bold text-slate-700">
                Speech Therapy & Hearing Care
              </p>
              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600">
                Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001
              </p>
              <p className="text-xs font-bold text-slate-800">
                Timing: Monday – Saturday, 11:00 AM – 8:00 PM
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Prescription Sheet
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {visit.rxNumber}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Date: {today}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 rounded-2xl border border-slate-300 p-5 md:grid-cols-[1fr_150px]">
          <div className="grid gap-3 text-sm">
            <div className="grid grid-cols-[130px_1fr] gap-3">
              <strong>Patient Name</strong>
              <span>{visit.patientName}</span>
            </div>

            <div className="grid grid-cols-[130px_1fr] gap-3">
              <strong>Age</strong>
              <span>{visit.patientAge || "—"}</span>
            </div>

            <div className="grid grid-cols-[130px_1fr] gap-3">
              <strong>Mobile</strong>
              <span>{visit.patientPhone || "—"}</span>
            </div>

            <div className="grid grid-cols-[130px_1fr] gap-3">
              <strong>Email</strong>
              <span>{visit.patientEmail}</span>
            </div>

            <div className="grid grid-cols-[130px_1fr] gap-3">
              <strong>Visit Type</strong>
              <span>{visit.appointmentType || "Clinic Visit"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <img
              src={`/api/rx/${visit.uploadToken}/qr`}
              alt="Prescription QR code"
              className="h-32 w-32"
            />
            <p className="mt-2 text-[10px] font-bold leading-4 text-slate-600">
              Scan after doctor writes prescription
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">
            Doctor Notes / Prescription
          </h2>

          <div className="mt-4 min-h-[650px] bg-white" />
        </section>
      </section>
    </main>
  );
}