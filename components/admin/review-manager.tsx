"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewStatus = "Pending" | "Approved" | "Rejected";

type Review = {
  id: string;
  name: string;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt: string;
};

const statusOptions: ReviewStatus[] = ["Pending", "Approved", "Rejected"];

export default function ReviewManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  async function loadReviews() {
    const response = await fetch("/api/admin/reviews", {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      setReviews(data.reviews || []);
    } else {
      setMessage("Please login as admin first.");
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    return filter === "All"
      ? reviews
      : reviews.filter((review) => review.status === filter);
  }, [reviews, filter]);

  async function updateStatus(id: string, status: ReviewStatus) {
    setMessage("");

    const response = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (!response.ok) {
      setMessage("Review update failed.");
      return;
    }

    setReviews((previous) =>
      previous.map((review) =>
        review.id === id ? { ...review, status } : review
      )
    );

    setMessage("Review status updated.");
  }

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Review Management</h2>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Approve patient reviews before showing them on the website.
            </p>
          </div>

          <select
            className="field"
            style={{ maxWidth: 220 }}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 20,
            color: message.includes("failed") ? "#b91c1c" : "#15803d",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        {filteredReviews.length === 0 ? (
          <div className="card" style={{ padding: 24 }}>
            No reviews found.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px" }}>{review.name}</h3>
                  <div style={{ color: "#f59e0b", fontSize: 20 }}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>

                <select
                  className="field"
                  style={{ maxWidth: 190 }}
                  value={review.status}
                  onChange={(event) =>
                    updateStatus(review.id, event.target.value as ReviewStatus)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <p style={{ color: "#475569", lineHeight: 1.8 }}>
                {review.message}
              </p>

              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 0 }}>
                Submitted: {new Date(review.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}