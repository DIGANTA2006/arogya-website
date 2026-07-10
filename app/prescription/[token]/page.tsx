import { getPrescriptionAccessState } from "@/lib/prescription-access";
import { getPrescriptionByToken } from "@/lib/prescription-store";

function LoginRequiredCard({ reason }: { reason: "guest" | "wrong-account" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <span className="rounded-full bg-yellow-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-yellow-700">
          Protected Prescription
        </span>

        <h1 className="mt-5 text-3xl font-extrabold text-foreground">
          Login required
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {reason === "wrong-account"
            ? "This prescription belongs to a different patient account. Please login with the correct patient account or ask the clinic admin for help."
            : "Please login to the matching patient account to view or download this prescription."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/client/login"
            className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
          >
            Patient Login
          </a>

          <a
            href="/admin/login"
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            Admin Login
          </a>
        </div>
      </div>
    </main>
  );
}

export default async function PrescriptionSecurePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const prescription = await getPrescriptionByToken(token);

  if (!prescription) {
    return (
      <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold">Secure file not found</h1>
          <p className="mt-3 text-muted-foreground">
            Please contact the clinic for help.
          </p>
        </div>
      </main>
    );
  }

  const access = await getPrescriptionAccessState(prescription.patientEmail);

  if (!access.allowed) {
    return <LoginRequiredCard reason={access.reason === "wrong-account" ? "wrong-account" : "guest"} />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 p-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Secure Prescription
        </span>

        <h1 className="mt-5 text-3xl font-extrabold text-foreground">
          {prescription.title}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This file is protected. Only the matching patient account or clinic admin
          can download it.
        </p>

        <img
          src={`/api/prescription/${token}/qr`}
          alt="Prescription QR code"
          className="mx-auto mt-6 h-48 w-48 rounded-2xl border border-border bg-white p-3"
        />

        <a
          href={`/api/prescription/${token}/download`}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md"
        >
          Download Prescription
        </a>
      </div>
    </main>
  );
}
