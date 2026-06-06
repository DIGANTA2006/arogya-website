"use client";

import { useEffect, useMemo, useState } from "react";

const ratingOptions = [
  {
    value: 5,
    emoji: "😍",
    label: "Excellent",
    text: "Loved the experience",
  },
  {
    value: 4,
    emoji: "😊",
    label: "Good",
    text: "Good experience",
  },
  {
    value: 3,
    emoji: "🙂",
    label: "Average",
    text: "It was okay",
  },
  {
    value: 2,
    emoji: "😕",
    label: "Poor",
    text: "Needs improvement",
  },
  {
    value: 1,
    emoji: "😟",
    label: "Bad",
    text: "Not satisfied",
  },
];

const STORAGE_KEY = "arogya_review_popup_status";
const LAST_SHOWN_KEY = "arogya_review_popup_last_shown";

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

    const submitted = localStorage.getItem(STORAGE_KEY);

    if (submitted === "submitted") {
      return false;
    }

    const lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) || "0");
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastShown && Date.now() - lastShown < oneDay) {
      return false;
    }

    return true;
  }

  function showPopup(reason: string) {
    if (!canShowPopup()) return;

    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    setOpen(true);

    if (reason === "appointment") {
      setStatus("Your appointment is booked. Please share your experience with the website.");
    }
  }

  useEffect(() => {
    const timeSpentTimer = window.setTimeout(() => {
      showPopup("time");
    }, 45000);

    function handleExitIntent(event: MouseEvent) {
      if (event.clientY <= 8) {
        showPopup("exit");
      }
    }

    function handleAppointmentSuccess() {
      window.setTimeout(() => {
        showPopup("appointment");
      }, 1200);
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const requestUrl =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : "";

        const method =
          args[1]?.method ||
          (args[0] instanceof Request ? args[0].method : "GET");

        if (
          requestUrl.includes("/api/client/appointments") &&
          String(method).toUpperCase() === "POST" &&
          response.ok
        ) {
          window.dispatchEvent(new Event("arogya-appointment-booked"));
        }
      } catch {
        // Ignore fetch observer errors.
      }

      return response;
    };

    document.addEventListener("mouseleave", handleExitIntent);
    window.addEventListener("arogya-appointment-booked", handleAppointmentSuccess);

    return () => {
      window.clearTimeout(timeSpentTimer);
      document.removeEventListener("mouseleave", handleExitIntent);
      window.removeEventListener("arogya-appointment-booked", handleAppointmentSuccess);
      window.fetch = originalFetch;
    };
  }, []);

  function closePopup() {
    setOpen(false);
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
        name: form.name,
        rating,
        message: `${selectedRating.emoji} ${selectedRating.label} - ${form.message}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Review could not be submitted.");
      setLoading(false);
      return;
    }

    localStorage.setItem(STORAGE_KEY, "submitted");
    setStatus("Thank you. Your review has been submitted for approval.");

    window.setTimeout(() => {
      setOpen(false);
      setLoading(false);
    }, 1200);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.48)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        backdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Patient review popup"
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: 28,
          background: "linear-gradient(145deg, #ffffff, #f0f9ff)",
          border: "1px solid #dbeafe",
          boxShadow: "0 30px 90px rgba(15, 23, 42, 0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px 26px",
            background: "linear-gradient(135deg, #0284c7, #0f766e)",
            color: "white",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={closePopup}
            aria-label="Close review popup"
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.32)",
              background: "rgba(255,255,255,0.16)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <div style={{ fontSize: 38, marginBottom: 10 }}>{selectedRating.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>
            How was your experience?
          </h2>
          <p style={{ margin: "10px 0 0", opacity: 0.92, lineHeight: 1.6 }}>
            Your feedback helps Arogya improve patient service.
          </p>
        </div>

        <form onSubmit={submitReview} style={{ padding: 26, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {ratingOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRating(item.value)}
                style={{
                  border: rating === item.value ? "2px solid #0284c7" : "1px solid #cbd5e1",
                  background: rating === item.value ? "#e0f2fe" : "white",
                  borderRadius: 18,
                  padding: "12px 6px",
                  cursor: "pointer",
                  display: "grid",
                  gap: 5,
                  justifyItems: "center",
                  boxShadow:
                    rating === item.value
                      ? "0 12px 24px rgba(2, 132, 199, 0.16)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#0f172a" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <input
            className="field"
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
            placeholder="Write your experience..."
            rows={4}
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
                fontWeight: 800,
                color: status.includes("Thank") ? "#15803d" : "#b91c1c",
              }}
            >
              {status}
            </p>
          )}

          <button
            type="button"
            onClick={closePopup}
            style={{
              border: "none",
              background: "transparent",
              color: "#64748b",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Maybe later
          </button>
        </form>
      </div>
    </div>
  );
}