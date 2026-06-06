export default function LoginRequiredAppointment() {
  return (
    <div className="card" style={{ padding: 28 }}>
      <span className="badge">Patient Login Required</span>

      <h2 style={{ fontSize: 34, margin: "18px 0 12px" }}>
        Login to book your appointment
      </h2>

      <p style={{ color: "#64748b", lineHeight: 1.8, fontSize: 17 }}>
        For patient safety and proper appointment tracking, only registered patients can book
        appointments online. Please login or create a patient account to continue.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <a href="/client/login" className="btn-primary">
          Patient Login
        </a>

        <a href="/client/register" className="btn-secondary">
          Create Account
        </a>
      </div>

      <div
        style={{
          marginTop: 22,
          padding: 16,
          borderRadius: 16,
          background: "#f0f9ff",
          color: "#0369a1",
          lineHeight: 1.6,
        }}
      >
        After login, patients can book clinic visit or online video consultation and
        check appointment status from their dashboard.
      </div>
    </div>
  );
}


