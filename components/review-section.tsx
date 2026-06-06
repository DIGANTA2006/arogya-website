"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  message: string;
};

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    async function loadReviews() {
      const response = await fetch("/api/reviews", {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    }

    loadReviews();
  }, []);

  return (
    <section className="section" style={{ background: "#f8fafc" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 42px" }}>
          <span className="badge">Patient Reviews</span>
          <h2 style={{ fontSize: 42, margin: "18px 0 12px" }}>
            Patient experiences
          </h2>
          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            Read patient feedback or share your own experience with the clinic.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
            <h3 style={{ marginTop: 0 }}>No published reviews yet</h3>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>
              Be the first to share your experience.
            </p>
            <a href="/reviews" className="btn-primary" style={{ textDecoration: "none" }}>
              Write a Review
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {reviews.slice(0, 6).map((review) => (
              <div key={review.id} className="card" style={{ padding: 26 }}>
                <div style={{ color: "#f59e0b", fontSize: 22, marginBottom: 12 }}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>

                <p style={{ color: "#475569", lineHeight: 1.8 }}>
                  “{review.message}”
                </p>

                <strong>{review.name}</strong>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <a href="/reviews" className="btn-secondary" style={{ textDecoration: "none" }}>
            Share Your Experience
          </a>
        </div>
      </div>
    </section>
  );
}

