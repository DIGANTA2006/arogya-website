type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 8% 10%, rgba(20,184,166,0.24), transparent 28%), radial-gradient(circle at 90% 12%, rgba(14,165,233,0.24), transparent 30%), linear-gradient(135deg, #e0f7ff 0%, #f8fbff 48%, #ecfeff 100%)",
        padding: "34px 18px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "min(1120px, 100%)",
          display: "grid",
          gridTemplateColumns: "0.95fr 1.05fr",
          borderRadius: 34,
          overflow: "hidden",
          background: "rgba(255,255,255,0.76)",
          boxShadow: "0 30px 90px rgba(2, 44, 72, 0.22)",
          border: "1px solid rgba(255,255,255,0.85)",
          backdropFilter: "blur(18px)",
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(160deg, #075985 0%, #0284c7 48%, #0f766e 100%)",
            color: "white",
            padding: "48px 42px",
            minHeight: 660,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              top: -120,
              right: -120,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: 999,
              background: "rgba(45,212,191,0.22)",
              bottom: -80,
              left: -90,
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <a
              href="/"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: 0.95,
              }}
            >
              ← Back to website
            </a>

            <div
              style={{
                marginTop: 48,
                width: 88,
                height: 88,
                borderRadius: 28,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "0 20px 45px rgba(0,0,0,0.12)",
              }}
            >
              <span style={{ fontSize: 42, fontWeight: 950 }}>A</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(38px, 5vw, 58px)",
                lineHeight: 1.05,
                margin: "30px 0 18px",
                letterSpacing: "-1.5px",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.75,
                opacity: 0.92,
                maxWidth: 470,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 14,
              marginTop: 34,
            }}
          >
            {[
              "Book clinic visit or online consultation",
              "Track appointment status from dashboard",
              "Secure patient access for every booking",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  padding: "16px 18px",
                  borderRadius: 18,
                  fontWeight: 800,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                }}
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            padding: "48px 44px",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,249,255,0.95))",
            display: "grid",
            alignContent: "center",
          }}
        >
          <div
            style={{
              borderRadius: 28,
              padding: "34px",
              background: "rgba(255,255,255,0.88)",
              border: "1px solid #dbeafe",
              boxShadow: "0 18px 55px rgba(15, 23, 42, 0.08)",
            }}
          >
            {children}
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 880px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
          main section:first-of-type {
            min-height: auto !important;
            padding: 32px 24px !important;
          }
          main section:last-of-type {
            padding: 24px !important;
          }
          main section:last-of-type > div {
            padding: 24px !important;
          }
        }
      `}</style>
    </main>
  );
}

