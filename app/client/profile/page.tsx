"use client";

import { useEffect, useState } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  age: string;
  mobileVerified: boolean;
};

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("Loading profile...");

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/client/profile", {
        cache: "no-store",
      });

      if (!response.ok) {
        setStatus("Please login first.");
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
      setStatus("");
    }

    loadProfile();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "18px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <strong style={{ fontSize: 24 }}>My Profile</strong>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Patient account details
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/client/dashboard" className="btn-secondary">
              Dashboard
            </a>
            <a href="/" className="btn-secondary">
              Website
            </a>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 30, maxWidth: 760 }}>
            <span className="badge">Patient Profile</span>
            <h1 style={{ fontSize: 38, margin: "18px 0 14px" }}>
              Account Information
            </h1>

            {status && <p style={{ color: "#64748b" }}>{status}</p>}

            {profile && (
              <div style={{ display: "grid", gap: 16, marginTop: 22 }}>
                <ProfileRow label="Name" value={profile.name} />
                <ProfileRow label="Email" value={profile.email} />
                <ProfileRow label="Mobile" value={profile.phone || "Not added"} />
                <ProfileRow label="Age" value={profile.age || "Not added"} />
                <ProfileRow
                  label="Mobile verification"
                  value={profile.mobileVerified ? "Verified" : "Not verified"}
                />

                {!profile.mobileVerified && (
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      color: "#9a3412",
                      fontWeight: 800,
                      lineHeight: 1.7,
                    }}
                  >
                    Google login is active. For appointment booking, the clinic may require mobile verification.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 12,
        padding: 16,
        borderRadius: 16,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <strong>{label}</strong>
      <span style={{ color: "#475569" }}>{value}</span>
    </div>
  );
}