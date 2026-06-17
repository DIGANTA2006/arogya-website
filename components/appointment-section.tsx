import { CalendarCheck, LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";

export default function AppointmentSection() {
  return (
    <section
      id="appointment"
      className="section-mobile-tight py-20 lg:py-28"
      style={{ background: "var(--section-bg)" }}
      aria-label="Book an appointment"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-white p-7 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Patient Login Required
              </span>

              <h2 className="mt-5 text-3xl font-extrabold text-foreground sm:text-4xl">
                Book appointment from patient portal
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                For secure appointment tracking, patients must login or create an account before booking. After login, you can choose clinic visit or online video consultation and check appointment status.
              </p>
            </div>

            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-primary">
              <LockKeyhole size={30} />
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <a
              href="/client/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-md transition hover:scale-[1.01]"
            >
              <CalendarCheck size={18} /> Patient Login
            </a>

            <a
              href="/client/register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-extrabold text-foreground shadow-sm transition hover:scale-[1.01]"
            >
              <UserPlus size={18} /> Create Account
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-orange-800">
            <strong>Emergency disclaimer:</strong> Online consultation and this website are not for emergency cases. For serious or urgent medical problems, visit the nearest hospital or emergency service immediately. The clinic may recommend a physical visit when required.
          </div>

          <div className="mt-4 rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-sm leading-relaxed text-muted-foreground">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                <strong className="text-foreground">Patient consent:</strong> By creating an account or booking an appointment, patients agree that the clinic may securely store appointment details, contact details, prescriptions, reports, payment references and follow-up information for clinic service and patient support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}