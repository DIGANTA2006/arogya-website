import ReviewManager from "@/components/admin/review-manager";

export default function AdminReviewsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "18px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong style={{ fontSize: 24 }}>Patient Reviews</strong>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Review approval panel
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/admin/dashboard" className="btn-secondary">
              Dashboard
            </a>

            <form action="/api/auth/logout" method="post">
              <button className="btn-secondary" type="submit">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <ReviewManager />
        </div>
      </section>
    </main>
  );
}

