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

      <section className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-7 py-6 shadow-xl print:h-[297mm] print:w-[210mm] print:max-w-none print:overflow-hidden print:px-[9mm] print:py-[8mm] print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950 print:text-[22px]">
                Arogya Speech Therapy
              </h1>
              <p className="mt-0.5 text-sm font-bold text-slate-700 print:text-[12px]">
                Speech Therapy & Hearing Care
              </p>
              <p className="mt-1 max-w-xl text-[11px] leading-4 text-slate-600">
                Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001
              </p>
              <p className="text-[11px] font-bold text-slate-800">
                Timing: Monday – Saturday, 11:00 AM – 8:00 PM
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Prescription Sheet
              </p>
              <p className="mt-1 text-xl font-black text-slate-950 print:text-[19px]">
                {visit.rxNumber}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Date: {today}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-[1fr_150px] gap-4 rounded-2xl border border-slate-300 p-4 print:mt-3 print:grid-cols-[1fr_140px] print:gap-3 print:p-3">
          <div className="grid content-start gap-2 text-[12px] leading-4 text-slate-900 print:gap-1.5 print:text-[11px]">
            <div className="grid grid-cols-[105px_1fr] gap-2">
              <strong>Patient Name</strong>
              <span>{visit.patientName}</span>
            </div>

            <div className="grid grid-cols-[105px_1fr] gap-2">
              <strong>Age</strong>
              <span>{visit.patientAge || "________"}</span>
            </div>

            <div className="grid grid-cols-[105px_1fr] gap-2">
              <strong>Mobile</strong>
              <span>{visit.patientPhone || "________"}</span>
            </div>

            <div className="grid grid-cols-[105px_1fr] gap-2">
              <strong>Email</strong>
              <span>{visit.patientEmail || "________"}</span>
            </div>

            <div className="grid grid-cols-[105px_1fr] gap-2">
              <strong>Visit Type</strong>
              <span>{visit.appointmentType || "Clinic Visit"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start border-l border-slate-300 pl-3 text-center print:pl-2">
            <img
              src={`/api/rx/${visit.uploadToken}/qr`}
              alt="Prescription QR code"
              className="h-[122px] w-[122px] print:h-[112px] print:w-[112px]"
            />
            <p className="mt-1 text-[9px] font-bold leading-3 text-slate-600">
              Scan after doctor writes
            </p>
          </div>
        </section>

        <section className="mt-4 print:mt-3">
          <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-950 print:text-[12px]">
            Doctor Notes / Prescription
          </h2>

          <div className="relative mt-3 h-[690px] overflow-hidden rounded-xl print:h-[210mm]">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src="/arogya-logo.png"
                alt="Arogya watermark"
                className="h-[240px] w-[240px] object-contain print:h-[220px] print:w-[220px]"
                style={{ opacity: 0.06 }}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                className="mt-[180px] text-center text-[18px] font-bold uppercase tracking-[0.35em] text-slate-400 print:text-[16px]"
                style={{ opacity: 0.08 }}
              >
                Arogya Speech Therapy & Hearing Care
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}