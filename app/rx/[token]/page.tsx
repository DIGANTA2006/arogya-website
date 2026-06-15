import { redirect } from "next/navigation";
import { getPrescriptionVisitByToken } from "@/lib/prescription-visit-store";

export default async function RxTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const visit = await getPrescriptionVisitByToken(token);

  if (!visit) {
    return (
      <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
          <span className="rounded-full bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-700">
            Invalid QR
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-foreground">Prescription QR not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Please contact the clinic reception for help.
          </p>
        </div>
      </main>
    );
  }

  if (visit.uploadedPrescriptionToken) {
    redirect(`/prescription/${visit.uploadedPrescriptionToken}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Arogya Prescription QR
        </span>

        <h1 className="mt-5 text-3xl font-extrabold text-foreground">{visit.rxNumber}</h1>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm leading-7 text-slate-700">
          <p><strong>Patient:</strong> {visit.patientName}</p>
          <p><strong>Email:</strong> {visit.patientEmail}</p>
          {visit.patientPhone && <p><strong>Mobile:</strong> {visit.patientPhone}</p>}
          {visit.patientAge && <p><strong>Age:</strong> {visit.patientAge}</p>}
          <p><strong>Status:</strong> {visit.status}</p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          This prescription sheet has been created. The handwritten prescription has not been uploaded yet.
          Please check again after the clinic scans and uploads it.
        </p>
      </div>
    </main>
  );
}