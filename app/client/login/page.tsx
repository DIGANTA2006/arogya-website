"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/auth-shell";
import SocialLoginButtons from "@/components/auth/social-login-buttons";

export default function ClientLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "client",
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Invalid login details.");
      setLoading(false);
      return;
    }

    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome to Arogya Patient Portal"
      subtitle="Login to book appointments, choose clinic or online consultation, and check your appointment status."
    >
      <span className="badge">Patient Access</span>

      <h2
        style={{
          fontSize: 38,
          lineHeight: 1.1,
          margin: "18px 0 10px",
          letterSpacing: "-1px",
          color: "#0f172a",
        }}
      >
        Login to your account
      </h2>

      <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 22 }}>
        Use your email and password, or continue with Google.
      </p>

      <form onSubmit={login} style={{ display: "grid", gap: 14 }}>
        <label style={labelStyle}>
          Email address
          <input
            style={inputStyle}
            type="email"
            placeholder="patient@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            style={inputStyle}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={mainButton}
        >
          {loading ? "Checking..." : "Login"}
        </button>

        {status && (
          <p style={{ color: "#b91c1c", margin: 0, fontWeight: 800 }}>
            {status}
          </p>
        )}
      </form>

      <div style={{ marginTop: 18 }}>
        <SocialLoginButtons />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 22,
          flexWrap: "wrap",
        }}
      >
        <a href="/client/register" style={linkStyle}>
          Create new account
        </a>

        <a href="/client/forgot-password" style={linkStyle}>
          Forgot password?
        </a>
      </div>
    </AuthShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 7,
  color: "#1e293b",
  fontSize: 14,
  fontWeight: 900,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #bfdbfe",
  borderRadius: 16,
  padding: "15px 16px",
  outline: "none",
  background: "linear-gradient(135deg, #f8fbff, #ffffff)",
  color: "#0f172a",
  fontSize: 16,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
};

const mainButton: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 16,
  padding: "15px 18px",
  background: "linear-gradient(135deg, #0284c7, #0f766e)",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 16px 34px rgba(2, 132, 199, 0.28)",
};

const linkStyle: React.CSSProperties = {
  color: "#0284c7",
  fontWeight: 950,
  textDecoration: "none",
};



