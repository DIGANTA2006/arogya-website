"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  age: string;
  mobileVerified: boolean;
};

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
  });
  const [status, setStatus] = useState("Loading profile...");
  const [loading, setLoading] = useState(false);

  function updateField(event: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function loadProfile() {
    const response = await fetch("/api/client/profile", {
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || "Please login first.");
      return;
    }

    setProfile(data.profile);
    setForm({
      name: data.profile.name || "",
      phone: data.profile.phone || "",
      age: data.profile.age || "",
    });
    setStatus("");
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/client/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || data.detail || "Profile update failed.");
      setLoading(false);
      return;
    }

    setStatus(data.message || "Profile updated successfully.");
    await loadProfile();
    setLoading(false);
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-container profile-header-inner">
          <div>
            <span className="profile-chip">Patient Account</span>
            <h1>My Profile</h1>
            <p>Update your details for appointment booking and prescription access.</p>
          </div>

          <div className="profile-actions">
            <a href="/client/dashboard" className="profile-btn profile-btn-light">
              <ArrowLeft size={16} />
              Dashboard
            </a>
            <a href="/" className="profile-btn profile-btn-dark">
              Website
            </a>
          </div>
        </div>
      </header>

      <section className="profile-container profile-grid">
        <aside className="profile-summary-card">
          <div className="profile-avatar">
            <UserRound size={38} />
          </div>

          <h2>{profile?.name || "Patient"}</h2>
          <p>{profile?.email || "Logged in patient"}</p>

          <div className="summary-list">
            <SummaryRow icon={<Mail size={18} />} label="Email" value={profile?.email || "-"} />
            <SummaryRow icon={<Phone size={18} />} label="Mobile" value={profile?.phone || "Not added"} />
            <SummaryRow
              icon={<ShieldCheck size={18} />}
              label="Mobile OTP"
              value={profile?.mobileVerified ? "Verified" : "Not verified"}
            />
          </div>

          {!profile?.mobileVerified && (
            <div className="profile-warning">
              Google login is active. For final clinic use, mobile OTP verification can be required before booking.
            </div>
          )}
        </aside>

        <section className="profile-edit-card">
          <span className="profile-chip">Edit Profile</span>
          <h2>Account Information</h2>
          <p className="edit-note">
            Your email comes from Google login. You can update your full name, mobile number, and age.
          </p>

          <form onSubmit={saveProfile} className="profile-form">
            <label>
              Full Name
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Enter full name"
                required
              />
            </label>

            <label>
              Email Address
              <input value={profile?.email || ""} disabled />
            </label>

            <label>
              Mobile Number
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="+91XXXXXXXXXX"
              />
            </label>

            <label>
              Age
              <input
                name="age"
                value={form.age}
                onChange={updateField}
                placeholder="Patient age"
              />
            </label>

            <button className="save-profile-btn" type="submit" disabled={loading}>
              <Save size={18} />
              {loading ? "Saving..." : "Save Profile"}
            </button>

            {status && (
              <p className={status.toLowerCase().includes("success") ? "profile-status-ok" : "profile-status-error"}>
                {status}
              </p>
            )}
          </form>
        </section>
      </section>

      <style>{`
        .profile-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 30%),
            linear-gradient(135deg, #f8fbff 0%, #eef8ff 48%, #f8fafc 100%);
          color: #0f172a;
        }

        .profile-container {
          width: min(1120px, calc(100% - 36px));
          margin: 0 auto;
        }

        .profile-header {
          background: linear-gradient(135deg, #0057b8, #003b7a);
          color: white;
          padding: 34px 0;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
        }

        .profile-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .profile-header h1 {
          font-size: clamp(36px, 6vw, 56px);
          margin: 12px 0 6px;
          letter-spacing: -1px;
        }

        .profile-header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          font-weight: 700;
        }

        .profile-chip {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 8px 13px;
          background: #dff3ff;
          color: #0057b8;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .profile-btn {
          border-radius: 999px;
          padding: 12px 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          font-weight: 900;
        }

        .profile-btn-light {
          background: white;
          color: #0057b8;
        }

        .profile-btn-dark {
          background: #0f172a;
          color: white;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          padding: 34px 0 60px;
          align-items: start;
        }

        .profile-summary-card,
        .profile-edit-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #dbeafe;
          border-radius: 30px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        }

        .profile-avatar {
          width: 86px;
          height: 86px;
          border-radius: 28px;
          background: linear-gradient(135deg, #0057b8, #00a6a6);
          color: white;
          display: grid;
          place-items: center;
          box-shadow: 0 16px 36px rgba(0, 87, 184, 0.24);
        }

        .profile-summary-card h2 {
          font-size: 28px;
          margin: 18px 0 4px;
        }

        .profile-summary-card p {
          margin: 0;
          color: #64748b;
          overflow-wrap: anywhere;
        }

        .summary-list {
          display: grid;
          gap: 13px;
          margin-top: 24px;
        }

        .summary-row {
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 12px;
          padding: 15px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .summary-row-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: #e0f2fe;
          color: #0369a1;
          display: grid;
          place-items: center;
        }

        .summary-row small {
          display: block;
          color: #64748b;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .summary-row strong {
          overflow-wrap: anywhere;
        }

        .profile-warning {
          margin-top: 18px;
          padding: 16px;
          border-radius: 18px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          font-weight: 800;
          line-height: 1.7;
        }

        .profile-edit-card h2 {
          font-size: clamp(32px, 5vw, 48px);
          margin: 18px 0 10px;
          letter-spacing: -1px;
        }

        .edit-note {
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .profile-form {
          display: grid;
          gap: 16px;
        }

        .profile-form label {
          display: grid;
          gap: 8px;
          color: #334155;
          font-weight: 900;
        }

        .profile-form input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #f8fafc;
          padding: 16px;
          color: #0f172a;
          font-size: 16px;
          outline: none;
        }

        .profile-form input:focus {
          border-color: #0284c7;
          background: white;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.12);
        }

        .profile-form input:disabled {
          background: #e2e8f0;
          cursor: not-allowed;
        }

        .save-profile-btn {
          border: none;
          border-radius: 999px;
          padding: 16px 22px;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white;
          font-weight: 950;
          font-size: 16px;
          cursor: pointer;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          box-shadow: 0 16px 36px rgba(249, 115, 22, 0.26);
        }

        .save-profile-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .profile-status-ok {
          color: #15803d;
          font-weight: 900;
        }

        .profile-status-error {
          color: #b91c1c;
          font-weight: 900;
        }

        @media (max-width: 880px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .profile-container {
            width: min(100% - 24px, 1120px);
          }

          .profile-summary-card,
          .profile-edit-card {
            padding: 22px;
            border-radius: 24px;
          }

          .profile-actions,
          .profile-actions a {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="summary-row">
      <div className="summary-row-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}