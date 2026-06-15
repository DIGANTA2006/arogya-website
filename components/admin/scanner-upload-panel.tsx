"use client";

import { useEffect, useState } from "react";
import jsQR from "jsqr";

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

type ScanItem = {
  id: string;
  file: File;
  token: string;
  status: "waiting" | "detected" | "manual" | "uploading" | "done" | "error";
  message: string;
  securePage?: string;
  rxNumber?: string;
  patientName?: string;
  patientEmail?: string;
};

function extractToken(input: string) {
  const value = String(input || "").trim();

  if (!value) return "";

  try {
    const url = new URL(value, window.location.origin);
    const rxMatch = url.pathname.match(/\/rx\/([^/?#]+)/);

    if (rxMatch?.[1]) {
      return decodeURIComponent(rxMatch[1]);
    }

    const queryToken =
      url.searchParams.get("token") ||
      url.searchParams.get("uploadToken") ||
      url.searchParams.get("qrToken");

    if (queryToken) {
      return queryToken;
    }
  } catch {
    // Direct token fallback.
  }

  return value
    .replace(/^token:/i, "")
    .replace(/^rx:/i, "")
    .trim();
}

function detectWithJsQr(canvas: HTMLCanvasElement) {
  try {
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      return "";
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    return extractToken(result?.data || "");
  } catch {
    return "";
  }
}

async function detectWithBarcodeDetector(source: ImageBitmapSource) {
  if (!window.BarcodeDetector) {
    return "";
  }

  try {
    const detector = new window.BarcodeDetector({
      formats: ["qr_code"],
    });

    const codes = await detector.detect(source);

    for (const code of codes) {
      const token = extractToken(code.rawValue || "");

      if (token) {
        return token;
      }
    }

    return "";
  } catch {
    return "";
  }
}

function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const crop = document.createElement("canvas");
  const context = crop.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    return null;
  }

  crop.width = Math.max(1, Math.floor(width));
  crop.height = Math.max(1, Math.floor(height));

  context.drawImage(
    sourceCanvas,
    Math.max(0, Math.floor(x)),
    Math.max(0, Math.floor(y)),
    Math.max(1, Math.floor(width)),
    Math.max(1, Math.floor(height)),
    0,
    0,
    crop.width,
    crop.height
  );

  return crop;
}

async function detectQrFromCanvas(canvas: HTMLCanvasElement) {
  const jsQrToken = detectWithJsQr(canvas);

  if (jsQrToken) {
    return jsQrToken;
  }

  const barcodeToken = await detectWithBarcodeDetector(
    canvas as unknown as ImageBitmapSource
  );

  if (barcodeToken) {
    return barcodeToken;
  }

  const cropAreas = [
    {
      x: canvas.width * 0.58,
      y: 0,
      width: canvas.width * 0.42,
      height: canvas.height * 0.38,
    },
    {
      x: canvas.width * 0.30,
      y: 0,
      width: canvas.width * 0.55,
      height: canvas.height * 0.40,
    },
    {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height * 0.45,
    },
    {
      x: canvas.width * 0.15,
      y: canvas.height * 0.10,
      width: canvas.width * 0.70,
      height: canvas.height * 0.45,
    },
  ];

  for (const area of cropAreas) {
    const cropped = cropCanvas(
      canvas,
      area.x,
      area.y,
      area.width,
      area.height
    );

    if (!cropped) {
      continue;
    }

    const tokenFromJsQr = detectWithJsQr(cropped);

    if (tokenFromJsQr) {
      return tokenFromJsQr;
    }

    const tokenFromBarcodeDetector = await detectWithBarcodeDetector(
      cropped as unknown as ImageBitmapSource
    );

    if (tokenFromBarcodeDetector) {
      return tokenFromBarcodeDetector;
    }
  }

  return "";
}

async function detectQrFromImage(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      bitmap.close();
      return "";
    }

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return await detectQrFromCanvas(canvas);
  } catch {
    return "";
  }
}

async function detectQrFromPdf(file: File) {
  try {
    const pdfjsLib = (await import("pdfjs-dist/build/pdf")) as any;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const scales = [2.5, 3.5, 4.5, 5.5];

    for (const scale of scales) {
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!context) {
        continue;
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const token = await detectQrFromCanvas(canvas);

      if (token) {
        await pdf.destroy?.();
        return token;
      }
    }

    await pdf.destroy?.();

    return "";
  } catch {
    return "";
  }
}
async function detectTokenFromFile(file: File) {
  if (!window.BarcodeDetector) {
    return {
      token: "",
      message: "Browser QR detector not available. Use Chrome or paste token manually.",
    };
  }

  if (file.type.startsWith("image/")) {
    const token = await detectQrFromImage(file);

    return {
      token,
      message: token
        ? "QR detected automatically from image."
        : "No readable QR found in image. Make sure the printed QR is visible and clear.",
    };
  }

  if (file.type === "application/pdf") {
    const token = await detectQrFromPdf(file);

    return {
      token,
      message: token
        ? "QR detected automatically from PDF first page."
        : "No readable QR found in PDF first page. Make sure QR is visible on page 1.",
    };
  }

  return {
    token: "",
    message: "Unsupported file type for QR reading.",
  };
}

export default function ScannerUploadPanel() {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [manualToken, setManualToken] = useState("");
  const [status, setStatus] = useState("");
  const [nextTherapyDate, setNextTherapyDate] = useState("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token =
      params.get("token") ||
      params.get("uploadToken") ||
      params.get("qrToken") ||
      "";

    if (token) {
      setManualToken(extractToken(token));
    }
  }, []);

  function updateItem(id: string, patch: Partial<ScanItem>) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setStatus("Reading QR codes from selected files...");

    const prepared: ScanItem[] = [];

    for (const file of files) {
      const detected = await detectTokenFromFile(file);

      prepared.push({
        id: crypto.randomUUID(),
        file,
        token: detected.token,
        status: detected.token ? "detected" : "manual",
        message: detected.message,
      });
    }

    setItems(prepared);
    setStatus(`${prepared.length} file(s) scanned for QR. Upload only files where token is detected or manually provided.`);
  }

  function applyManualTokenToEmptyItems() {
    const token = extractToken(manualToken);

    if (!token) {
      setStatus("Enter a valid /rx/... URL or token first.");
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.token
          ? item
          : {
              ...item,
              token,
              status: "manual",
              message: "Manual token applied.",
            }
      )
    );

    setStatus("Manual token applied to files without QR token.");
  }

  async function uploadOne(item: ScanItem) {
    const token = extractToken(item.token);

    if (!token) {
      updateItem(item.id, {
        status: "error",
        message: "Missing QR token. This file cannot be auto-matched.",
      });
      return;
    }

    updateItem(item.id, {
      status: "uploading",
      message: "Uploading...",
    });

    const form = new FormData();
    form.set("uploadToken", token);
    form.set("file", item.file);

    if (nextTherapyDate) {
      form.set("nextTherapyDate", nextTherapyDate);
    }

    if (nextAppointmentDate) {
      form.set("nextAppointmentDate", nextAppointmentDate);
    }

    const response = await fetch("/api/admin/prescription-scan-upload", {
      method: "POST",
      body: form,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      updateItem(item.id, {
        status: "error",
        message: data.detail || data.error || "Upload failed.",
      });
      return;
    }

    updateItem(item.id, {
      status: "done",
      message: "Uploaded successfully.",
      securePage: data.securePage,
      rxNumber: data.visit?.rxNumber,
      patientName: data.visit?.patientName,
      patientEmail: data.visit?.patientEmail,
    });
  }

  async function uploadAll() {
    if (items.length === 0) {
      setStatus("Select scanned prescription files first.");
      return;
    }

    setBulkUploading(true);
    setStatus("Uploading all prescriptions with detected/manual tokens...");

    for (const item of items) {
      if (item.status !== "done") {
        await uploadOne(item);
      }
    }

    setBulkUploading(false);
    setStatus("Bulk upload finished. Check each file status below.");
  }

  function clearAll() {
    setItems([]);
    setStatus("");
    // Keep manualToken so staff can reuse it after clearing file list.
    setNextTherapyDate("");
    setNextAppointmentDate("");
  }

  const doneCount = items.filter((item) => item.status === "done").length;
  const errorCount = items.filter((item) => item.status === "error").length;
  const missingTokenCount = items.filter((item) => !item.token).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          Bulk Scanner Upload
        </span>

        <h2 className="mt-5 text-2xl font-extrabold text-foreground">
          Upload Scanned Prescriptions
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Upload scanned prescription sheets that were generated from Smart Prescription Sheets. The QR must be visible on the image or PDF first page.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-foreground">
            Select Scanned Prescription Files
            <input
              className="field"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFiles}
            />
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <strong>Important:</strong>
            <p className="mt-1">
              This will work only if the uploaded file contains the printed QR from the prescription sheet. Random images without the QR will show missing token.
            </p>
          </div>

          <details open className="rounded-2xl border border-border bg-white p-4">
            <summary className="cursor-pointer text-sm font-extrabold text-foreground">
              Enter token manually if QR is not detected
            </summary>

            <div className="mt-4 grid gap-3">
              <textarea
                className="field min-h-20"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Paste the printed /rx/... URL or QR token here"
              />

              <button
                type="button"
                onClick={applyManualTokenToEmptyItems}
                className="rounded-full border border-border bg-white px-6 py-3 text-sm font-extrabold text-foreground"
              >
                Apply Manual Token To Missing Files
              </button>
            </div>
          </details>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-foreground">
              Next Therapy Date Optional
              <input
                className="field"
                type="date"
                value={nextTherapyDate}
                onChange={(event) => setNextTherapyDate(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-foreground">
              Next Appointment Date Optional
              <input
                className="field"
                type="date"
                value={nextAppointmentDate}
                onChange={(event) => setNextAppointmentDate(event.target.value)}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={uploadAll}
            disabled={bulkUploading || items.length === 0}
            className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkUploading ? "Uploading All..." : "Upload All Matched Prescriptions"}
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white"
          >
            Clear List
          </button>

          {status && (
            <p className="text-sm font-bold text-slate-700">
              {status}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Upload Queue
            </span>

            <h2 className="mt-5 text-2xl font-extrabold text-foreground">
              Files Ready
            </h2>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
            <p>Total: {items.length}</p>
            <p>Done: {doneCount}</p>
            <p>Errors: {errorCount}</p>
            <p>Missing token: {missingTokenCount}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-sm font-bold text-muted-foreground">
              No files selected yet.
            </p>
          )}

          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-foreground">
                    {index + 1}. {item.file.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(item.file.size / 1024).toFixed(1)} KB · {item.file.type || "Unknown type"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    item.status === "done"
                      ? "bg-green-100 text-green-700"
                      : item.status === "error"
                        ? "bg-red-100 text-red-700"
                        : item.status === "uploading"
                          ? "bg-orange-100 text-orange-700"
                          : item.status === "detected"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-bold text-foreground">
                Detected QR Token / RX URL
                <input
                  className="field"
                  value={item.token}
                  onChange={(event) =>
                    updateItem(item.id, {
                      token: extractToken(event.target.value),
                      status: event.target.value ? "manual" : "waiting",
                      message: event.target.value ? "Manual token entered." : "Token missing.",
                    })
                  }
                  placeholder="Auto-detected token appears here"
                />
              </label>

              <p className="mt-3 text-sm font-bold text-muted-foreground">
                {item.message}
              </p>

              {item.rxNumber && (
                <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                  <p><strong>RX:</strong> {item.rxNumber}</p>
                  {item.patientName && <p><strong>Patient:</strong> {item.patientName}</p>}
                  {item.patientEmail && <p><strong>Email:</strong> {item.patientEmail}</p>}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => uploadOne(item)}
                  disabled={bulkUploading || item.status === "done"}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload This File
                </button>

                {item.securePage && (
                  <a
                    href={item.securePage}
                    target="_blank"
                    className="rounded-full bg-green-700 px-4 py-2 text-xs font-extrabold text-white"
                  >
                    Open Secure Page
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}