"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PortalLoginFormProps = {
  role: "admin" | "client";
  title: string;
  description: string;
};

type LoginResponse = {
  success?: boolean;
  role?: "admin" | "client";
  requiresTwoFactor?: boolean;
  challengeId?: string;
  error?: string;
};

export default function PortalLoginForm({
  role,
  title,
  description,
}: PortalLoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (role === "admin" && data.requiresTwoFactor && data.challengeId) {
        setChallengeId(data.challengeId);
        setStatus("Verification code sent to admin email.");
        return;
      }

      router.push(role === "admin" ? "/admin/dashboard" : "/client/dashboard");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdmin2fa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/auth/verify-admin-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: twoFactorCode }),
      });

      const data = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin2faStep = role === "admin" && Boolean(challengeId);

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-7 shadow-2xl sm:p-9">
        <a href="/" className="text-sm font-bold text-primary hover:underline">
          ← Back to website
        </a>

        <div className="mt-7">
          <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            {role === "admin" ? "Admin Access" : "Client Access"}
          </span>

          <h1 className="mt-5 text-3xl font-extrabold text-foreground sm:text-4xl">
            {isAdmin2faStep ? "Verify Admin Login" : title}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {isAdmin2faStep
              ? "Enter the 6-digit verification code sent to the admin email. The code expires in 10 minutes."
              : description}
          </p>
        </div>

        {!isAdmin2faStep ? (
          <form onSubmit={handleLogin} className="mt-7 grid gap-4">
            <input
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Checking..."
                : role === "admin"
                  ? "Continue Secure Login"
                  : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdmin2fa} className="mt-7 grid gap-4">
            <input
              className="rounded-xl border border-input bg-background px-4 py-3 text-center text-lg font-extrabold tracking-[0.35em] outline-none transition focus:ring-2 focus:ring-ring"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={twoFactorCode}
              onChange={(event) =>
                setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />

            <button
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Open Dashboard"}
            </button>

            <button
              type="button"
              onClick={() => {
                setChallengeId("");
                setTwoFactorCode("");
                setStatus("");
              }}
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-bold text-foreground"
            >
              Back to Login
            </button>
          </form>
        )}

        {status && (
          <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm font-bold text-foreground">
            {status}
          </p>
        )}

        <div className="mt-6 rounded-2xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
          <strong>
            {role === "admin"
              ? "Admin login is protected with email verification."
              : "Patient portal is protected with secure login."}
          </strong>
          <br />
          Never share passwords or verification codes with anyone.
        </div>
      </div>
    </main>
  );
}