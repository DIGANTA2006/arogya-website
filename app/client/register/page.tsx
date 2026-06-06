"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/auth-shell";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

export default function ClientRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    password: "",
    otp: "",
  });

  const [mobileVerified, setMobileVerified] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    if (event.target.name === "phone") {
      setMobileVerified(false);
    }
  }

  async function sendOtp() {
    setOtpLoading(true);
    setStatus("");

    const response = await fetch("/api/auth/send-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: form.phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "OTP could not be sent.");
      setOtpLoading(false);
      return;
    }

    setStatus(
      data.devOtp
        ? `Testing OTP: ${data.devOtp}`
        : "OTP sent successfully to your mobile number."
    );
    setOtpLoading(false);
  }

  async function verifyOtp() {
    setOtpLoading(true);
    setStatus("");

    const response = await fetch("/api/auth/verify-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: form.phone,
        otp: form.otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "OTP verification failed.");
      setOtpLoading(false);
      return;
    }

    setMobileVerified(true);
    setStatus("Mobile number verified successfully.");
    setOtpLoading(false);
  }

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    if (!mobileVerified) {
      setStatus("Please verify your mobile number before creating account.");
      setLoading(false);
      return;
    }

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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Registration failed.");
      setLoading(false);
      return;
    }

    setStatus("Account created successfully. Redirecting to login...");
    setTimeout(() => router.push("/client/login"), 900);
  }

  return (
    <AuthShell
      title="Create your patient account"
      subtitle="Verify your mobile number once, then book clinic visits or online consultations securely."
    >
      <span className="badge">Patient Registration</span>

      <h2 style={{ fontSize: 38, lineHeight: 1.1, margin: "18px 0 10px", color: "#0f172a" }}>
        Sign up with mobile verification
      </h2>

      <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 18 }}>
        Create your patient account manually or continue with Google.
      </p>

      <SocialLoginButtons />

      <form onSubmit={register} style={{ display: "grid", gap: 13, marginTop: 20 }}>
        <input className="field" name="name" placeholder="Full name" value={form.name} onChange={updateField} required />
        <input className="field" name="age" placeholder="Age" value={form.age} onChange={updateField} required />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
          <input className="field" name="phone" placeholder="Mobile number" value={form.phone} onChange={updateField} required />
          <button type="button" className="btn-secondary" onClick={sendOtp} disabled={otpLoading || !form.phone}>
            {otpLoading ? "Sending..." : "Send OTP"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
          <input className="field" name="otp" placeholder="Enter OTP" value={form.otp} onChange={updateField} disabled={mobileVerified} />
          <button type="button" className="btn-secondary" onClick={verifyOtp} disabled={otpLoading || mobileVerified || !form.otp}>
            {mobileVerified ? "Verified" : "Verify"}
          </button>
        </div>

        <input className="field" name="email" type="email" placeholder="Email address" value={form.email} onChange={updateField} required />
        <input className="field" name="password" type="password" placeholder="Create password" value={form.password} onChange={updateField} required />

        <button className="btn-primary" type="submit" disabled={loading || !mobileVerified}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        {status && (
          <p style={{ margin: 0, color: status.includes("successfully") || status.includes("verified") ? "#15803d" : "#b91c1c", fontWeight: 800 }}>
            {status}
          </p>
        )}
      </form>

      <p style={{ color: "#64748b", marginTop: 18 }}>
        Already have an account?{" "}
        <a href="/client/login" style={{ color: "#0284c7", fontWeight: 950, textDecoration: "none" }}>
          Login
        </a>
      </p>
    </AuthShell>
  );
}
