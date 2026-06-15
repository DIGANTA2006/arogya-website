"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type FormState = {
  name: string;
  age: string;
  phone: string;
  email: string;
  password: string;
  otp: string;
  consent: boolean;
};

export default function ClientRegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    age: "",
    phone: "",
    email: "",
    password: "",
    otp: "",
    consent: false,
  });

  const [status, setStatus] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function sendOtp() {
    setStatus("");

    if (!form.phone) {
      setStatus("Please enter mobile number first.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/send-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: form.phone }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Could not send OTP.");
      return;
    }

    setOtpSent(true);
    setStatus(data.devOtp ? `OTP generated: ${data.devOtp}` : "OTP sent successfully.");
  }

  async function verifyOtp() {
    setStatus("");

    if (!form.phone || !form.otp) {
      setStatus("Please enter mobile number and OTP.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/verify-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: form.phone, otp: form.otp }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "OTP verification failed.");
      return;
    }

    setOtpVerified(true);
    setStatus("Mobile number verified successfully.");
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!otpVerified) {
      setStatus("Please verify your mobile number first.");
      return;
    }

    if (!form.consent) {
      setStatus("Please accept the Privacy Policy and consent notice.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        age: form.age,
        phone: form.phone,
        email: form.email,
        password: form.password,
        consent: form.consent,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Registration failed.");
      return;
    }

    setStatus("Account created successfully. Please login now.");
    window.location.href = "/client/login";
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-8">
        <a href="/portal" className="text-sm font-bold text-primary">
          ← Back to portal
        </a>

        <h1 className="mt-5 text-3xl font-black text-foreground">
          Create Patient Account
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Verify your mobile number and create your secure patient portal account.
        </p>

        <form onSubmit={submitForm} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Patient Name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Age
            <input
              name="age"
              value={form.age}
              onChange={updateField}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Mobile Number
            <div className="flex gap-2">
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                className="min-w-0 flex-1 rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
                required
              />

              <button
                type="button"
                onClick={sendOtp}
                disabled={loading || otpVerified}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
              >
                {otpVerified ? "Verified" : otpSent ? "Resend" : "Send OTP"}
              </button>
            </div>
          </label>

          {otpSent && !otpVerified && (
            <label className="grid gap-2 text-sm font-bold text-foreground">
              Enter OTP
              <div className="flex gap-2">
                <input
                  name="otp"
                  value={form.otp}
                  onChange={updateField}
                  className="min-w-0 flex-1 rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-extrabold text-foreground disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
            </label>
          )}

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Email Address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              minLength={8}
              required
            />
            <span className="text-xs font-normal text-muted-foreground">
              Minimum 8 characters.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <input
              name="consent"
              type="checkbox"
              checked={form.consent}
              onChange={updateField}
              className="mt-1 h-4 w-4"
            />

            <span>
              I consent to Arogya Speech Therapy & Hearing Care collecting and using my personal and appointment information for patient account creation, appointment management, OTP verification, prescription/report access, and clinic communication. I have read the{" "}
              <a href="/privacy-policy" target="_blank" className="font-bold text-primary">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !otpVerified || !form.consent}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Create Account"}
          </button>

          {status && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-foreground">
              {status}
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/client/login" className="font-extrabold text-primary">
              Login
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}