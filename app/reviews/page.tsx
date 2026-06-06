"use client";

import { useEffect } from "react";

export default function ReviewsPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.removeItem("arogya_review_submitted");
      localStorage.removeItem("arogya_review_dismissed_today");
      localStorage.removeItem("arogya_review_last_shown");
      window.dispatchEvent(new Event("arogya-open-review-popup"));
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <div style={{ height: 18, background: "#001b31", width: "100%" }} />
    </main>
  );
}