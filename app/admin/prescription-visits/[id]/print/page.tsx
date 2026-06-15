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
      <style>
        {`
          @page {
            size: A4;
            margin: 8mm;
          }

          @media print {
            html,
            body {
              background: white !important;
            }

            .print-sheet-a4 {
              width: 100% !important;
              max-width: none !important;
              min-height: auto !important;
              box-shadow: none !important;
              padding: 0 !important;
            }

            .doctor-write-area {
              min-height: 188mm !important;
            }
          }
        `}
      </style>

      <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/admin/prescription-visits"
          className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
        >
          Back
        </a>
        <PrintButton />
      </div>

      <section className="print-sheet-a4 mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-7 shadow-xl print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                Arogya Speech Therapy
              </h1>
              <p className="mt-0.5 text-xs font-bold text-slate-700">
                Speech Therapy & Hearing Care
              </p>
              <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-600">
                Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001
              </p>
              <p className="text-[10px] font-bold text-slate-800">
                Timing: Monday – Saturday, 11:00 AM – 8:00 PM
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Prescription Sheet
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {visit.rxNumber}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Date: {today}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid items-center gap-4 rounded-xl border border-slate-300 px-4 py-3 md:grid-cols-[1fr_115px] print:mt-3 print:px-3 print:py-2">
          <div className="grid gap-1.5 text-[11px] leading-4">
            <div className="grid grid-cols-[95px_1fr] gap-3">
              <strong>Patient Name</strong>
              <span>{visit.patientName}</span>
            </div>

            <div className="grid grid-cols-[95px_1fr] gap-3">
              <strong>Age</strong>
              <span>{visit.patientAge || "—"}</span>
            </div>

            <div className="grid grid-cols-[95px_1fr] gap-3">
              <strong>Mobile</strong>
              <span>{visit.patientPhone || "—"}</span>
            </div>

            <div className="grid grid-cols-[95px_1fr] gap-3">
              <strong>Email</strong>
              <span>{visit.patientEmail}</span>
            </div>

            <div className="grid grid-cols-[95px_1fr] gap-3">
              <strong>Visit Type</strong>
              <span>{visit.appointmentType || "Clinic Visit"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <img
              src={`/api/rx/${visit.uploadToken}/qr`}
              alt="Prescription QR code"
              className="h-24 w-24"
            />
            <p className="mt-1 text-[8px] font-bold leading-3 text-slate-600">
              Scan after doctor writes
            </p>
          </div>
        </section>

        <section className="mt-5 print:mt-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-950">
            Doctor Notes / Prescription
          </h2>

          <div className="doctor-write-area mt-2 min-h-[710px] bg-white" />
        </section>
      </section>
    </main>
  );
}