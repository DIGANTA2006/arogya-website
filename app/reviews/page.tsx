"use client";

import { useState } from "react";

const ratingOptions = [
  { value: 5, emoji: "😍", label: "Excellent" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 3, emoji: "🙂", label: "Average" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 1, emoji: "😟", label: "Bad" },
];

export default function ReviewsPage() {
  const [form, setForm] = useState({
    name: "",
    rating: 5,
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRating =
    ratingOptions.find((item) => item.value === form.rating) || ratingOptions[0];

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
        name: form.name,
        rating: form.rating,
        message: `${selectedRating.emoji} ${selectedRating.label} - ${form.message}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not submit review.");
      setLoading(false);
      return;
    }

    setStatus(data.message || "Thank you. Your review has been submitted for approval.");
    setForm({
      name: "",
      rating: 5,
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
      <div className="card" style={{ width: "min(680px, 100%)", padding: 34 }}>
        <a href="/" style={{ color: "#0284c7", fontWeight: 900, textDecoration: "none" }}>
          ← Back to website
        </a>

        <div style={{ marginTop: 26 }}>
          <span className="badge">Patient Review</span>
          <h1 style={{ fontSize: 42, margin: "18px 0 12px", letterSpacing: "-1px" }}>
            Share your experience
          </h1>
          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            Select an emoji rating and write your experience. Reviews are checked by the clinic before publishing.
          </p>
        </div>

        <form onSubmit={submitReview} style={{ display: "grid", gap: 16, marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {ratingOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    rating: item.value,
                  })
                }
                style={{
                  border: form.rating === item.value ? "2px solid #0284c7" : "1px solid #cbd5e1",
                  background: form.rating === item.value ? "#e0f2fe" : "#ffffff",
                  borderRadius: 18,
                  padding: "14px 8px",
                  cursor: "pointer",
                  display: "grid",
                  gap: 6,
                  justifyItems: "center",
                }}
              >
                <span style={{ fontSize: 30 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 900 }}>{item.label}</span>
              </button>
            ))}
          </div>

          <input
            className="field"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
            required
          />

          <textarea
            className="field"
            name="message"
            placeholder="Write your experience..."
            rows={5}
            value={form.message}
            onChange={(event) =>
              setForm({
                ...form,
                message: event.target.value,
              })
            }
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>

          {status && (
            <p
              style={{
                margin: 0,
                color: status.includes("Thank") ? "#15803d" : "#b91c1c",
                fontWeight: 800,
              }}
            >
              {status}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}