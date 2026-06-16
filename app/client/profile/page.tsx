"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  age: string;
  mobileVerified: boolean;
};

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    age: "",
    mobileVerified: false,
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setStatus("");

      const response = await fetch("/api/client/profile", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Profile unavailable.");
        return;
      }

      setProfile(data.profile);
    }

    loadProfile();
  }, []);

  function updateField(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
      mobileVerified:
        name === "phone" && value !== previous.phone
          ? false
          : previous.mobileVerified,
    }));
  }

  async function sendOtp() {
    setStatus("");

    if (!profile.phone) {
      setStatus("Please enter mobile number first.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/send-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: profile.phone,
      }),
    });

    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Could not send OTP.");
      return;
    }

    setOtpSent(true);
    setStatus("OTP sent successfully. Please check your mobile.");
  }

  async function verifyOtp() {
    setStatus("");

    if (!profile.phone || !otp) {
      setStatus("Please enter mobile number and OTP.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/verify-mobile-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: profile.phone,
        otp,
        email: profile.email,
      }),
    });

    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "OTP verification failed.");
      return;
    }

    setProfile((previous) => ({
      ...previous,
      phone: data.phone || previous.phone,
      mobileVerified: true,
    }));

    setOtp("");
    setOtpSent(false);
    setStatus("Mobile number verified successfully.");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const response = await fetch("/api/client/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: profile.name,
        age: profile.age,
        phone: profile.phone,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Profile update failed.");
      return;
    }

    setProfile(data.profile);
    setStatus("Profile updated successfully.");
  }

  async function requestAccountDeletion() {
    const confirmed = window.confirm(
      "Do you want to submit an account deletion request? The clinic will review prescriptions, reports, and appointment history before deleting data."
    );

    if (!confirmed) return;

    setStatus("");
    setLoading(true);

    const response = await fetch("/api/client/profile", {
      method: "DELETE",
    });

    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Could not submit deletion request.");
      return;
    }

    setStatus(data.message || "Account deletion request submitted.");
  }

  return (
    <main className="min-h-screen bg-secondary/40 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-8">
        <a href="/client/dashboard" className="text-sm font-bold text-primary">
          ← Back to Dashboard
        </a>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
              Patient Profile
            </p>
            <h1 className="mt-2 text-4xl font-black text-foreground">
              Account Details
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep your patient details updated for appointment reminders and prescription access.
            </p>
          </div>

          <span className="rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-foreground">
            {profile.mobileVerified ? "Mobile Verified" : "Mobile Not Verified"}
          </span>
        </div>

        <form onSubmit={saveProfile} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Name
            <input
              name="name"
              value={profile.name}
              onChange={updateField}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Email
            <input
              name="email"
              value={profile.email}
              className="rounded-2xl border border-border bg-secondary/50 px-4 py-3 font-normal text-muted-foreground"
              disabled
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              Phone
              <input
                name="phone"
                value={profile.phone}
                onChange={updateField}
                className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-foreground">
              Age
              <input
                name="age"
                value={profile.age}
                onChange={updateField}
                className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
              />
            </label>
          </div>

          {!profile.mobileVerified && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <h2 className="text-sm font-black text-orange-800">
                Mobile Verification Required
              </h2>
              <p className="mt-1 text-sm text-orange-700">
                Verify your mobile number to book appointments and receive reminders.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading || !profile.phone}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
                >
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>

                {otpSent && (
                  <>
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder="Enter OTP"
                      className="min-w-0 flex-1 rounded-full border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                    />

                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={loading}
                      className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground disabled:opacity-60"
                    >
                      Verify OTP
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Save Profile"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-5">
          <h2 className="text-lg font-black text-foreground">
            Review / Rating
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your experience with the clinic.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/reviews";
            }}
            className="mt-4 rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
          >
            ⭐ Give Rating / Review
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-lg font-black text-red-700">
            Account Deletion Request
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700/80">
            This will not instantly delete medical records. The clinic will review prescriptions, reports, and appointment history before deleting or anonymizing account data.
          </p>

          <button
            type="button"
            onClick={requestAccountDeletion}
            disabled={loading}
            className="mt-4 rounded-full bg-red-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            Request Account Deletion
          </button>
        </div>

        {status && (
          <p className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-foreground">
            {status}
          </p>
        )}
      </section>
    </main>
  );
}