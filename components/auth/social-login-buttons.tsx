"use client";

import type { CSSProperties } from "react";

export default function SocialLoginButtons() {
  function loginWithGoogle() {
    window.location.href = "/api/auth/google";
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "8px 0 4px",
          color: "#64748b",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        <div style={{ height: 1, background: "#cbd5e1", flex: 1 }} />
        <span>or continue with</span>
        <div style={{ height: 1, background: "#cbd5e1", flex: 1 }} />
      </div>

      <button type="button" onClick={loginWithGoogle} style={googleButton}>
        <span style={googleIcon}>G</span>
        Continue with Google
      </button>
    </div>
  );
}

const googleButton: CSSProperties = {
  width: "100%",
  border: "1px solid #dbeafe",
  borderRadius: 16,
  padding: "14px 16px",
  background: "linear-gradient(135deg, #ffffff, #eff6ff)",
  color: "#0f172a",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 11,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
};

const googleIcon: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  display: "inline-grid",
  placeItems: "center",
  background: "#ffffff",
  color: "#dc2626",
  fontWeight: 950,
};