export default function ProductionTrustSections() {
  return (
    <section className="bg-secondary/40 px-4 py-14">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
              Doctor & Clinic Trust
            </p>

            <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">
              Care led by Dr. Shilpi Roy
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Arogya Speech Therapy & Hearing Care supports patients with speech therapy, hearing care, appointment follow-up, secure prescription/report access, and QR-based prescription upload workflow.
            </p>

            <p className="mt-3 text-xs font-bold text-muted-foreground">
              Note: Add verified qualification and RCI registration number here after the clinic confirms the exact details.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-black text-foreground">Speech Therapy</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Support for speech, voice, language, and communication needs.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-black text-foreground">Hearing Care</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Hearing guidance, assessment support, and hearing aid counselling.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-black text-foreground">Secure Portal</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Patient dashboard, reminders, and QR prescription download system.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="/portal"
            className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
          >
            Open Patient Portal
          </a>

          <a
            href="tel:9755018656"
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            Call Clinic
          </a>

          <a
            href="https://wa.me/919755018656"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}