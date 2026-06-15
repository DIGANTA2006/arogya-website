import { ImageResponse } from "next/og";

export const alt = "Arogya Speech Therapy & Hearing Care";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e6fffb 0%, #ffffff 52%, #ecfeff 100%)",
          padding: 72,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 800,
            color: "#0f766e",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Arogya Speech Therapy
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 920,
            marginTop: 28,
            fontSize: 72,
            lineHeight: 1.05,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          Speech Therapy & Hearing Care in Vidisha
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 28,
            color: "#334155",
          }}
        >
          Appointments · Patient Portal · QR Prescription Downloads
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            gap: 18,
            fontSize: 24,
            color: "#0f172a",
          }}
        >
          <span>📍 Sanchi Road, Vidisha</span>
          <span>☎ 9755018656</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}