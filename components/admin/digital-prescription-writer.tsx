"use client";

import { useEffect, useRef, useState } from "react";

type Visit = {
  id: string;
  rxNumber: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge: string;
  appointmentType: string;
};

type Props = {
  visit: Visit;
};

export default function DigitalPrescriptionWriter({ visit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextTherapyDate, setNextTherapyDate] = useState("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");

  function getContext() {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    return canvas.getContext("2d", {
      willReadFrequently: true,
    });
  }

  function drawTemplate() {
    const canvas = canvasRef.current;
    const context = getContext();

    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#0f172a";
    context.font = "bold 28px Arial";
    context.fillText("Arogya Speech Therapy & Hearing Care", 40, 50);

    context.font = "bold 16px Arial";
    context.fillText(`RX: ${visit.rxNumber}`, 40, 85);
    context.fillText(`Patient: ${visit.patientName}`, 40, 115);
    context.fillText(`Age: ${visit.patientAge || "-"}`, 40, 145);
    context.fillText(`Mobile: ${visit.patientPhone || "-"}`, 340, 145);
    context.fillText(`Email: ${visit.patientEmail || "-"}`, 40, 175);
    context.fillText(`Type: ${visit.appointmentType || "Clinic Visit"}`, 40, 205);

    context.strokeStyle = "#0f172a";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(40, 225);
    context.lineTo(canvas.width - 40, 225);
    context.stroke();

    context.font = "bold 15px Arial";
    context.fillText("Doctor Notes / Prescription:", 40, 260);

    context.fillStyle = "rgba(0, 82, 180, 0.05)";
    context.font = "bold 64px Arial";
    context.textAlign = "center";
    context.fillText("AROGYA", canvas.width / 2, canvas.height / 2);
    context.textAlign = "left";

    context.strokeStyle = "#0f172a";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
  }

  useEffect(() => {
    drawTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = getContext();

    if (!context) return;

    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = getPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;

    const context = getContext();

    if (!context) return;

    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore pointer capture release errors.
    }
  }

  function clearCanvas() {
    const confirmed = window.confirm("Clear the digital prescription writing area?");

    if (!confirmed) return;

    drawTemplate();
  }

  async function savePrescription() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    setSaving(true);
    setStatus("");

    const response = await fetch(
      `/api/admin/prescription-visits/${visit.id}/digital-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: canvas.toDataURL("image/png"),
          nextTherapyDate,
          nextAppointmentDate,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    setSaving(false);

    if (!response.ok) {
      setStatus(data.detail || data.error || "Digital prescription could not be saved.");
      return;
    }

    setStatus("Digital prescription saved and uploaded to patient account.");

    if (data.securePage) {
      window.open(data.securePage, "_blank");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-[2rem] border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary">
              Digital Prescription
            </p>
            <h1 className="mt-2 text-3xl font-black text-foreground">
              Write with mouse or tablet pen
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Patient: {visit.patientName} · RX: {visit.rxNumber}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/prescription-visits"
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
            >
              Back
            </a>

            <button
              type="button"
              onClick={clearCanvas}
              className="rounded-full border border-border bg-white px-5 py-3 text-sm font-extrabold text-foreground"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={savePrescription}
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save & Upload"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Next Therapy Date Optional
            <input
              type="date"
              value={nextTherapyDate}
              onChange={(event) => setNextTherapyDate(event.target.value)}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-foreground">
            Next Appointment Date Optional
            <input
              type="date"
              value={nextAppointmentDate}
              onChange={(event) => setNextAppointmentDate(event.target.value)}
              className="rounded-2xl border border-border px-4 py-3 font-normal outline-none focus:border-primary"
            />
          </label>
        </div>

        {status && (
          <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-foreground">
            {status}
          </p>
        )}
      </div>

      <div className="overflow-auto rounded-[2rem] border border-border bg-white p-4 shadow-sm">
        <canvas
          ref={canvasRef}
          width={900}
          height={1200}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="mx-auto block w-full max-w-[900px] touch-none rounded-2xl border border-border bg-white shadow-sm"
        />
      </div>
    </section>
  );
}