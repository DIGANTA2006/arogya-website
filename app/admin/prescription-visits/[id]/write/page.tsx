import DigitalPrescriptionWriter from "@/components/admin/digital-prescription-writer";
import { getPrescriptionVisitById } from "@/lib/prescription-visit-store";

export default async function DigitalWritePrescriptionPage({
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
            Please go back and select a valid prescription visit.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <DigitalPrescriptionWriter visit={visit} />
      </div>
    </main>
  );
}