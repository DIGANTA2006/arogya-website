"use client";

import { FormEvent, useState } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Password reset failed.");
      return;
    }

    setDone(true);
    setStatus(data.message || "Password reset successfully.");
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-8">
        <a href="/client/login" className="text-sm font-bold text-primary">
          ← Back to Login
        </a>

        <h1 className="mt-5 text-3xl font-black text-foreground">
          Reset Password
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Create a new password for your patient account.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            New Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              minLength={8}
              disabled={done}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              minLength={8}
              disabled={done}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading || done}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {done ? "Password Updated" : loading ? "Updating..." : "Reset Password"}
          </button>

          {status && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-foreground">
              {status}
            </p>
          )}

          {done && (
            <a
              href="/client/login"
              className="rounded-full border border-border px-6 py-3 text-center text-sm font-extrabold text-foreground"
            >
              Login Now
            </a>
          )}
        </form>
      </section>
    </main>
  );
}