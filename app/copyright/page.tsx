export default function CopyrightPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "48px 18px" }}>
      <section className="container">
        <div className="card" style={{ padding: 34, maxWidth: 900, margin: "0 auto" }}>
          <a href="/" style={{ color: "#0284c7", fontWeight: 900, textDecoration: "none" }}>
            ← Back to website
          </a>

          <h1 style={{ fontSize: 42, margin: "28px 0 14px" }}>
            Copyright & Intellectual Property
          </h1>

          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            This website, including its design, layout, visual elements, written content,
            branding, images, user interface, patient portal flow, appointment system,
            review system, prescription workflow and related digital assets, is protected
            as intellectual property.
          </p>

          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            Unauthorized copying, reproduction, modification, redistribution, resale,
            or commercial use of this website design or source structure is not permitted.
          </p>

          <p style={{ color: "#475569", lineHeight: 1.8 }}>
            Patient information, appointments, prescriptions, reports and clinic data are
            confidential and must not be copied, downloaded, reused or distributed without
            proper authorization from the clinic.
          </p>

          <div
            style={{
              marginTop: 28,
              padding: 22,
              borderRadius: 18,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e3a8a",
              fontWeight: 800,
              lineHeight: 1.7,
            }}
          >
            © {new Date().getFullYear()} Arogya Speech Therapy & Hearing Care.
            All rights reserved.
          </div>
        </div>
      </section>
    </main>
  );
}