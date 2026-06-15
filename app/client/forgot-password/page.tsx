"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    setLoading(false);
    setStatus(data.message || data.error || "Please check your email.");
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-8">
        <a href="/client/login" className="text-sm font-bold text-primary">
          ← Back to Login
        </a>

        <h1 className="mt-5 text-3xl font-black text-foreground">
          Forgot Password
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Enter your patient account email. If an account exists, we will send a secure reset link.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Email Address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {status && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-foreground">
              {status}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}