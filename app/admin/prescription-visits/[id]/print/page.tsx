import type { Metadata } from "next";
import PrintButton from "@/components/admin/print-button";
import { getPrescriptionVisitById } from "@/lib/prescription-visit-store";

type PageProps = {
  params: Promise<{ id: string }>;
};

function safeValue(value: string, fallback = "________") {
  return String(value || "").trim() || fallback;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[118px_1fr] gap-3 print:grid-cols-[112px_1fr]">
      <strong className="whitespace-nowrap font-black text-slate-950">
        {label}
      </strong>
      <span className="break-words text-slate-800">{value}</span>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const visit = await getPrescriptionVisitById(id);

  return {
    title: visit
      ? `${visit.rxNumber} | Arogya Prescription Sheet`
      : "Arogya Prescription Sheet",
  };
}

export default async function PrintPrescriptionVisitPage({ params }: PageProps) {
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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const rxUrl = siteUrl ? `${siteUrl}/rx/${visit.uploadToken}` : `/rx/${visit.uploadToken}`;

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <style>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          a[href]::after {
            content: "";
          }
        }
      `}</style>

      <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/admin/prescription-visits"
          className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
        >
          Back
        </a>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-bold leading-5 text-yellow-800">
            Print setting: Paper A4, Scale 100%, disable browser Headers and footers.
          </div>
          <PrintButton />
        </div>
      </div>

      <section className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-8 py-7 shadow-xl print:h-[281mm] print:w-[194mm] print:max-w-none print:overflow-hidden print:px-0 print:py-0 print:shadow-none">
        <header className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h1 className="text-[27px] font-black uppercase tracking-tight text-slate-950 print:text-[23px]">
                Arogya Speech Therapy
              </h1>
              <p className="mt-0.5 text-sm font-bold text-slate-700 print:text-[12px]">
                Speech Therapy & Hearing Care
              </p>
              <p className="mt-1 max-w-xl text-[11px] leading-4 text-slate-600">
                Opposite Devi ka Bagh, near Dagar Gaire, Sanchi Road, Vidisha 464001
              </p>
              <p className="text-[11px] font-bold text-slate-800">
                Timing: Monday – Saturday, 2:00 PM – 6:00 PM
              </p>
            </div>

            <div className="min-w-[160px] text-right">
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

        <section className="mt-4 grid grid-cols-[1fr_145px] gap-4 rounded-2xl border border-slate-300 p-4 print:mt-3 print:grid-cols-[1fr_132px] print:gap-3 print:p-3">
          <div className="grid content-start gap-2 text-[12px] leading-4 text-slate-900 print:gap-1.5 print:text-[11px]">
            <FieldRow label="Patient Name" value={safeValue(visit.patientName)} />
            <FieldRow label="Age" value={safeValue(visit.patientAge)} />
            <FieldRow label="Mobile" value={safeValue(visit.patientPhone)} />
            <FieldRow label="Email" value={safeValue(visit.patientEmail)} />
            <FieldRow label="Visit Type" value={safeValue(visit.appointmentType, "Clinic Visit")} />
          </div>

          <div className="flex flex-col items-center justify-start border-l border-slate-300 pl-3 text-center print:pl-2">
            <img
              src={`/api/rx/${visit.uploadToken}/qr`}
              alt="Prescription QR code"
              className="h-[118px] w-[118px] print:h-[108px] print:w-[108px]"
            />
            <p className="mt-1 text-[9px] font-black uppercase leading-3 text-slate-700">
              Secure RX QR
            </p>

            <p className="mt-0.5 text-[8px] font-bold leading-3 text-slate-500">
              Scan after doctor writes
            </p>

            <p className="mt-1 max-w-[132px] break-all text-[7px] font-mono leading-3 text-slate-500 print:hidden">
              {rxUrl}
            </p>
          </div>
        </section>

        <section className="mt-4 print:mt-3">
          <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-950 print:text-[12px]">
            Doctor Notes / Prescription
          </h2>

          <div className="relative mt-3 h-[705px] overflow-hidden rounded-xl print:h-[205mm]">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src="/arogya-logo.png"
                alt="Arogya watermark"
                className="h-[240px] w-[240px] object-contain print:h-[220px] print:w-[220px]"
                style={{ opacity: 0.055 }}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                className="mt-[180px] text-center text-[18px] font-bold uppercase tracking-[0.35em] text-slate-400 print:text-[16px]"
                style={{ opacity: 0.075 }}
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
