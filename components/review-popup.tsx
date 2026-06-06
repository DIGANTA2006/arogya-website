"use client";

import { useEffect, useMemo, useState } from "react";

const ratingOptions = [
  { value: 5, emoji: "😍", label: "Excellent" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 3, emoji: "🙂", label: "Average" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 1, emoji: "😟", label: "Bad" },
];

const SUBMITTED_KEY = "arogya_review_submitted";
const LAST_SHOWN_KEY = "arogya_review_last_shown";
const DISMISSED_KEY = "arogya_review_dismissed_today";

export default function ReviewPopup() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({
    name: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRating = useMemo(
    () => ratingOptions.find((item) => item.value === rating) || ratingOptions[0],
    [rating]
  );

  function canShowPopup() {
    if (typeof window === "undefined") return false;

    const submitted = localStorage.getItem(SUBMITTED_KEY);
    if (submitted === "true") return false;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || "0");
    const oneDay = 24 * 60 * 60 * 1000;

    if (dismissed === "true" && lastShown && Date.now() - lastShown < oneDay) {
      return false;
    }

    return true;
  }

  function showPopup(reason: string) {
    if (!canShowPopup()) return;

    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    setOpen(true);

    if (reason === "appointment") {
      setStatus("Your appointment is booked. Please share your website experience.");
    }
  }

  function closePopup() {
    localStorage.setItem(DISMISSED_KEY, "true");
    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    setOpen(false);
    setStatus("");
  }

  useEffect(() => {
    const timeTimer = window.setTimeout(() => {
      showPopup("time");
    }, 45000);

    function handleExitIntent(event: MouseEvent) {
      if (event.clientY <= 8) {
        showPopup("exit");
      }
    }

    function handleAppointmentBooked() {
      window.setTimeout(() => {
        showPopup("appointment");
      }, 1200);
    }

    function handleManualOpen() {
      showPopup("manual");
    }

    document.addEventListener("mouseleave", handleExitIntent);
    window.addEventListener("arogya-appointment-booked", handleAppointmentBooked);
    window.addEventListener("arogya-open-review-popup", handleManualOpen);

    return () => {
      window.clearTimeout(timeTimer);
      document.removeEventListener("mouseleave", handleExitIntent);
      window.removeEventListener("arogya-appointment-booked", handleAppointmentBooked);
      window.removeEventListener("arogya-open-review-popup", handleManualOpen);
    };
  }, []);

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
        rating,
        message: `${selectedRating.emoji} ${selectedRating.label} - ${form.message}`,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error || data.detail || "Review could not be submitted.");
      setLoading(false);
      return;
    }

    localStorage.setItem(SUBMITTED_KEY, "true");
    setStatus(data.message || "Thank you. Your review has been submitted for approval.");

    window.setTimeout(() => {
      setOpen(false);
      setLoading(false);
      setForm({
        name: "",
        message: "",
      });
      setRating(5);
      setStatus("");
    }, 1600);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="review-popup-backdrop" role="dialog" aria-modal="true">
      <section className="review-popup-card">
        <button type="button" className="review-popup-close" onClick={closePopup}>
          ×
        </button>

        <div className="review-popup-top">
          <div className="review-popup-emoji">{selectedRating.emoji}</div>
          <span>Patient Feedback</span>
          <h2>How was your experience?</h2>
          <p>
            Your feedback helps Arogya improve patient service. Reviews are checked before publishing.
          </p>
        </div>

        <form onSubmit={submitReview} className="review-popup-form">
          <div className="review-popup-ratings">
            {ratingOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRating(item.value)}
                className={rating === item.value ? "rating-option active" : "rating-option"}
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
              rows={4}
              required
            />
          </label>

          <button className="review-submit-btn" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>

          {status && (
            <p className={status.toLowerCase().includes("thank") ? "review-success" : "review-error"}>
              {status}
            </p>
          )}

          <button type="button" className="review-later-btn" onClick={closePopup}>
            Maybe later
          </button>
        </form>
      </section>

      <style>{`
        .review-popup-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.52);
          display: grid;
          place-items: center;
          padding: 18px;
          backdrop-filter: blur(8px);
        }

        .review-popup-card {
          width: min(620px, 100%);
          max-height: min(92vh, 820px);
          overflow: auto;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #dbeafe;
          border-radius: 32px;
          box-shadow: 0 32px 100px rgba(15, 23, 42, 0.28);
          position: relative;
        }

        .review-popup-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: none;
          background: rgba(15, 23, 42, 0.92);
          color: white;
          font-size: 26px;
          cursor: pointer;
          z-index: 2;
        }

        .review-popup-top {
          padding: 28px 30px;
          background: linear-gradient(135deg, #0057b8, #008f8f);
          color: white;
        }

        .review-popup-emoji {
          font-size: 42px;
          margin-bottom: 8px;
        }

        .review-popup-top span {
          display: inline-flex;
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.28);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .review-popup-top h2 {
          font-size: clamp(30px, 6vw, 46px);
          margin: 16px 0 10px;
          letter-spacing: -1px;
        }

        .review-popup-top p {
          margin: 0;
          color: rgba(255, 255, 255, 0.88);
          line-height: 1.7;
          font-weight: 650;
        }

        .review-popup-form {
          padding: 28px 30px 30px;
          display: grid;
          gap: 16px;
        }

        .review-popup-ratings {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .rating-option {
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: white;
          padding: 12px 8px;
          display: grid;
          gap: 5px;
          justify-items: center;
          cursor: pointer;
          color: #0f172a;
        }

        .rating-option.active {
          border: 2px solid #0284c7;
          background: #e0f2fe;
          box-shadow: 0 12px 28px rgba(2, 132, 199, 0.16);
        }

        .rating-option span {
          font-size: 28px;
        }

        .rating-option strong {
          font-size: 11px;
        }

        .review-popup-form label {
          display: grid;
          gap: 8px;
          font-weight: 900;
          color: #334155;
        }

        .review-popup-form input,
        .review-popup-form textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          background: #f8fafc;
          padding: 15px 16px;
          color: #0f172a;
          font-size: 16px;
          outline: none;
        }

        .review-popup-form input:focus,
        .review-popup-form textarea:focus {
          border-color: #0284c7;
          background: white;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.12);
        }

        .review-submit-btn {
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

        .review-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .review-later-btn {
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 900;
          cursor: pointer;
        }

        .review-success {
          color: #15803d;
          font-weight: 900;
          margin: 0;
        }

        .review-error {
          color: #b91c1c;
          font-weight: 900;
          margin: 0;
        }

        @media (max-width: 620px) {
          .review-popup-card {
            border-radius: 24px;
          }

          .review-popup-top,
          .review-popup-form {
            padding: 22px;
          }

          .review-popup-ratings {
            grid-template-columns: 1fr;
          }

          .rating-option {
            grid-template-columns: 40px 1fr;
            justify-items: start;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}