import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Security Check | Arogya",
};

function checkStatus(ok: boolean) {
  return ok ? "Ready" : "Needs Attention";
}

function checkClass(ok: boolean) {
  return ok
    ? "bg-green-100 text-green-700"
    : "bg-yellow-100 text-yellow-700";
}

export default function AdminSecurityPage() {
  const authSecretOk = String(process.env.AUTH_SECRET || "").length >= 32;
  const adminEmailOk = Boolean(process.env.ADMIN_EMAIL);
  const adminHashOk = Boolean(process.env.ADMIN_PASSWORD_HASH);
  const admin2faEnabled = process.env.ADMIN_2FA_ENABLED === "true";
  const emailReady = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  const checks = [
    {
      title: "Signed admin session",
      ok: authSecretOk,
      text: "AUTH_SECRET must be at least 32 characters. It signs admin/client portal sessions.",
    },
    {
      title: "Admin email configured",
      ok: adminEmailOk,
      text: "ADMIN_EMAIL must match the email allowed to login as admin.",
    },
    {
      title: "Secure password hash",
      ok: adminHashOk,
      text: "ADMIN_PASSWORD_HASH must be configured. Do not store or deploy plain admin passwords.",
    },
    {
      title: "Admin email verification",
      ok: admin2faEnabled,
      text: "ADMIN_2FA_ENABLED=true turns on admin verification code by email.",
    },
    {
      title: "Email sender ready",
      ok: emailReady,
      text: "RESEND_API_KEY and RESEND_FROM_EMAIL are required for admin 2FA emails and verification emails.",
    },
  ];

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-white py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <strong className="text-2xl text-foreground">Admin Security Check</strong>
            <p className="mt-1 text-sm text-muted-foreground">
              Security readiness overview. Secret values are never shown here.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/dashboard"
              className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground"
            >
              Dashboard
            </a>

            <form action="/api/auth/logout" method="post">
              <button
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Protection Summary
            </span>

            <h1 className="mt-5 text-4xl font-extrabold text-foreground">
              Verify admin login protection
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Admin login uses a hashed password, signed HTTP-only portal cookies, same-origin request checks, rate limiting and optional email verification code when 2FA is enabled.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {checks.map((check) => (
              <div
                key={check.title}
                className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
              >
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${checkClass(check.ok)}`}>
                  {checkStatus(check.ok)}
                </span>

                <h2 className="mt-4 text-xl font-black text-foreground">
                  {check.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {check.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
            <h2 className="text-xl font-black">Manual verification steps</h2>

            <ol className="mt-4 grid gap-3 text-sm leading-7">
              <li>1. Open /admin/dashboard in incognito. It must redirect to /admin/login.</li>
              <li>2. Try a wrong admin password. It must reject the login.</li>
              <li>3. If ADMIN_2FA_ENABLED=true, correct password should send an email code and dashboard should stay locked until the code is verified.</li>
              <li>4. Never share admin password, OTP, verification code or email code with anyone.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
