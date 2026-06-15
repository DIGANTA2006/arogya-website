export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 px-6 py-16">
      <section className="max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
          Page Not Found
        </p>

        <h1 className="mt-4 text-4xl font-black text-foreground">
          This page is not available
        </h1>

        <p className="mt-4 text-muted-foreground">
          The page you are trying to open may have moved or does not exist. You can return to the homepage or contact Arogya Speech Therapy & Hearing Care for help.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground"
          >
            Go to Homepage
          </a>

          <a
            href="tel:9755018656"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-extrabold text-foreground"
          >
            Call Clinic
          </a>
        </div>
      </section>
    </main>
  );
}