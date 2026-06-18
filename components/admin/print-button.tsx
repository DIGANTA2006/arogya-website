"use client";

export default function PrintButton() {
  function handlePrint() {
    const previousTitle = document.title;
    document.title = "Arogya Prescription Sheet";

    window.print();

    window.setTimeout(() => {
      document.title = previousTitle;
    }, 1000);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md transition hover:scale-[1.02]"
    >
      Print Prescription Sheet
    </button>
  );
}
