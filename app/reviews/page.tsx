"use client";

import { useState } from "react";

export default function ReviewsPage() {
  const [form, setForm] = useState({
    name: "",
    rating: "5",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        rating: Number(form.rating),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not submit review.");
      setLoading(false);
      return;
    }

    setStatus(data.message);
    setForm({
      name: "",
      rating: "5",
      message: "",
    });
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 30%), linear-gradient(135deg, #f8fbff, #ecfeff)",
        padding: "40px 18px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div className="card" style={{ width: "min(620px, 100%)", padding: 34 }}>
        <a href="/" style={{ color: "#0284c7", fontWeight: 900, textDecoration: "none" }}>
          ← BBack to website
        </a>

        <div style={{ marginTop: 26 }}>
          <span className="badge">Patient Review</span>
          <h1 style={{ fontSize: 42, margin: "18px 0 12px", letterSpacing: "-1px" }}>
            Share your experience
          </h1>
          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            Your feedback helps other patients understand the clinic experience.
            Reviews are checked by the clinic before publishing.
          </p>
        </div>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 16, marginTop: 24 }}>
          <input
            className="field"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={updateField}
            required
          />

          <select
            className="field"
            name="rating"
            value={form.rating}
            onChange={updateField}
            required
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very poor</option>
          </select>

          <textarea
            className="field"
            name="message"
            placeholder="Write your experience..."
            rows={5}
            value={form.message}
            onChange={updateField}
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>

          {status && (
            <p style={{ margin: 0, color: status.includes("Thank") ? "#15803d" : "#b91c1c", fontWeight: 800 }}>
              {status}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}


