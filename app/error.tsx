"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-secondary/40 px-6 py-16">
      <section className="max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-extrabold uppercase tracking-widest text-red-600">
          Something Went Wrong
        </p>

        <h1 className="mt-4 text-4xl font-black text-foreground">
          We could not load this page
        </h1>

        <p className="mt-4 text-muted-foreground">
          Please try again. If the problem continues, contact Arogya Speech Therapy & Hearing Care.
        </p>

        {error?.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground"
          >
            Try Again
          </button>

          <a
            href="/"
            className="rounded-full border border-border bg-white px-6 py-3 text-sm font-extrabold text-foreground"
          >
            Go to Homepage
          </a>
        </div>
      </section>
    </main>
  );
}