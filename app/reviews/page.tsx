"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  message: string;
  status?: string;
  createdAt?: string;
};

const ratingOptions = [
  { value: 5, emoji: "😍", label: "Excellent" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 3, emoji: "🙂", label: "Average" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 1, emoji: "😟", label: "Bad" },
];

function getEmoji(rating: number) {
  return ratingOptions.find((item) => item.value === rating)?.emoji || "😊";
}

function cleanMessage(message: string) {
  return message
    .replace(/^😍 Excellent - /, "")
    .replace(/^😊 Good - /, "")
    .replace(/^🙂 Average - /, "")
    .replace(/^😕 Poor - /, "")
    .replace(/^😟 Bad - /, "");
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rating: 5,
    message: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRating =
    ratingOptions.find((item) => item.value === form.rating) || ratingOptions[0];

  async function loadReviews() {
    const response = await fetch("/api/reviews", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      setReviews(data.reviews || []);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || data.detail || "Review could not be submitted.");
      setLoading(false);
      return;
    }

    setStatus(data.message || "Thank you. Your review has been submitted for approval.");
    setForm({
      name: "",
      rating: 5,
      message: "",
    });

    setTimeout(() => {
      setOpen(false);
      setStatus("");
    }, 1600);

    setLoading(false);
  }

  return (
    <main className="reviews-page">
      <section className="reviews-hero">
        <a href="/" className="back-link">
          ← Back to website
        </a>

        <span className="reviews-chip">Patient Reviews</span>
        <h1>Patient experiences</h1>
        <p>
          Read patient feedback or share your own experience with Arogya Speech Therapy & Hearing Care.
        </p>

        <button type="button" className="write-review-btn" onClick={() => setOpen(true)}>
          Write a Review
        </button>
      </section>

      <section className="reviews-wrap">
        {reviews.length === 0 ? (
          <div className="empty-review-card">
            <div className="empty-emoji">💬</div>
            <h2>No published reviews yet</h2>
            <p>Be the first to share your experience after visiting the clinic.</p>
            <button type="button" className="write-review-btn secondary" onClick={() => setOpen(true)}>
              Share Your Experience
            </button>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-top">
                  <span className="review-emoji">{getEmoji(review.rating)}</span>
                  <div>
                    <h3>{review.name}</h3>
                    <p>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                  </div>
                </div>

                <p className="review-message">{cleanMessage(review.message)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div className="review-modal-backdrop" role="dialog" aria-modal="true">
          <section className="review-modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setOpen(false);
                setStatus("");
              }}
              aria-label="Close review form"
            >
              ×
            </button>

            <span className="reviews-chip">Share Your Experience</span>
            <h2>How was your experience?</h2>
            <p className="modal-note">
              Select an emoji rating and write your feedback. Reviews are checked by the clinic before publishing.
            </p>

            <form onSubmit={submitReview} className="review-form">
              <div className="emoji-rating">
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
                    className={form.rating === item.value ? "emoji-btn active" : "emoji-btn"}
                  >
                    <span>{item.emoji}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>

              <label>
                Your Name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label>
                Your Review
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      message: event.target.value,
                    })
                  }
                  placeholder="Write your experience..."
                  rows={5}
                  required
                />
              </label>

              <button className="submit-review-btn" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </button>

              {status && (
                <p className={status.toLowerCase().includes("thank") ? "review-ok" : "review-error"}>
                  {status}
                </p>
              )}
            </form>
          </section>
        </div>
      )}

      <style>{`
        .reviews-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 30%),
            linear-gradient(135deg, #f8fbff 0%, #eef8ff 48%, #f8fafc 100%);
          color: #0f172a;
          padding: 34px 18px 70px;
        }

        .reviews-hero {
          width: min(980px, 100%);
          margin: 0 auto;
          text-align: center;
          padding: 26px 0 34px;
        }

        .back-link {
          display: inline-flex;
          margin-bottom: 22px;
          color: #0284c7;
          text-decoration: none;
          font-weight: 900;
        }

        .reviews-chip {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          padding: 8px 14px;
          background: #dff3ff;
          color: #0057b8;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .reviews-hero h1 {
          font-size: clamp(42px, 7vw, 72px);
          margin: 18px 0 14px;
          letter-spacing: -1.5px;
        }

        .reviews-hero p {
          max-width: 720px;
          margin: 0 auto 24px;
          color: #64748b;
          line-height: 1.8;
          font-size: 18px;
        }

        .write-review-btn {
          border: none;
          border-radius: 999px;
          padding: 15px 26px;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 16px 36px rgba(249, 115, 22, 0.26);
        }

        .write-review-btn.secondary {
          margin-top: 10px;
        }

        .reviews-wrap {
          width: min(1100px, 100%);
          margin: 0 auto;
        }

        .empty-review-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #dbeafe;
          border-radius: 32px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
          padding: 44px 26px;
          text-align: center;
        }

        .empty-emoji {
          font-size: 48px;
          margin-bottom: 14px;
        }

        .empty-review-card h2 {
          font-size: 30px;
          margin: 0 0 8px;
        }

        .empty-review-card p {
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 14px;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .review-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #dbeafe;
          border-radius: 26px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          padding: 24px;
        }

        .review-top {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .review-emoji {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          background: #e0f2fe;
          display: grid;
          place-items: center;
          font-size: 28px;
        }

        .review-top h3 {
          margin: 0;
          font-size: 18px;
        }

        .review-top p {
          margin: 4px 0 0;
          color: #f97316;
          letter-spacing: 2px;
        }

        .review-message {
          color: #475569;
          line-height: 1.7;
          margin: 0;
        }

        .review-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.52);
          display: grid;
          place-items: center;
          padding: 18px;
          backdrop-filter: blur(8px);
        }

        .review-modal {
          width: min(720px, 100%);
          max-height: min(90vh, 820px);
          overflow: auto;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #dbeafe;
          border-radius: 32px;
          box-shadow: 0 32px 100px rgba(15, 23, 42, 0.28);
          padding: 34px;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: none;
          background: #0f172a;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .review-modal h2 {
          font-size: clamp(34px, 6vw, 54px);
          margin: 18px 0 10px;
          letter-spacing: -1px;
        }

        .modal-note {
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 22px;
        }

        .review-form {
          display: grid;
          gap: 16px;
        }

        .emoji-rating {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .emoji-btn {
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: white;
          padding: 14px 8px;
          display: grid;
          gap: 6px;
          justify-items: center;
          cursor: pointer;
          color: #0f172a;
        }

        .emoji-btn.active {
          border: 2px solid #0284c7;
          background: #e0f2fe;
          box-shadow: 0 12px 28px rgba(2, 132, 199, 0.16);
        }

        .emoji-btn span {
          font-size: 32px;
        }

        .emoji-btn strong {
          font-size: 12px;
        }

        .review-form label {
          display: grid;
          gap: 8px;
          font-weight: 900;
          color: #334155;
        }

        .review-form input,
        .review-form textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #f8fafc;
          padding: 16px;
          color: #0f172a;
          font-size: 16px;
          outline: none;
        }

        .review-form input:focus,
        .review-form textarea:focus {
          border-color: #0284c7;
          background: white;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.12);
        }

        .submit-review-btn {
          border: none;
          border-radius: 999px;
          padding: 16px 22px;
          background: linear-gradient(135deg, #f97316, #fb923c);
          color: white;
          font-weight: 950;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 16px 36px rgba(249, 115, 22, 0.26);
        }

        .submit-review-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .review-ok {
          color: #15803d;
          font-weight: 900;
        }

        .review-error {
          color: #b91c1c;
          font-weight: 900;
        }

        @media (max-width: 900px) {
          .reviews-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 620px) {
          .reviews-page {
            padding: 24px 12px 56px;
          }

          .review-modal,
          .empty-review-card {
            padding: 22px;
            border-radius: 24px;
          }

          .reviews-grid {
            grid-template-columns: 1fr;
          }

          .emoji-rating {
            grid-template-columns: 1fr;
          }

          .emoji-btn {
            grid-template-columns: 40px 1fr;
            justify-items: start;
            align-items: center;
          }
        }
      `}</style>
    </main>
  );
}