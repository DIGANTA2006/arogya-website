import type { PrescriptionVisit } from "@/lib/prescription-visit-store";

export function getRxUploadTokenExpiryDays() {
  const raw = process.env.RX_UPLOAD_TOKEN_EXPIRY_DAYS;
  const parsed = Number(raw);

  if (Number.isFinite(parsed) && parsed >= 7) {
    return Math.round(parsed);
  }

  return 180;
}

export function getPrescriptionVisitCreatedDate(visit: PrescriptionVisit) {
  const dateValue = visit.createdAt || visit.printedAt;
  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function getPrescriptionVisitUploadExpiryDate(visit: PrescriptionVisit) {
  const created = getPrescriptionVisitCreatedDate(visit);

  if (!created) return null;

  return new Date(
    created.getTime() + getRxUploadTokenExpiryDays() * 24 * 60 * 60 * 1000
  );
}

export function isPrescriptionVisitUploadExpired(visit: PrescriptionVisit) {
  if (visit.status === "uploaded" || visit.status === "cancelled") {
    return false;
  }

  const expiry = getPrescriptionVisitUploadExpiryDate(visit);

  if (!expiry) return false;

  return Date.now() > expiry.getTime();
}

export function getPrescriptionVisitExpiryMessage(visit: PrescriptionVisit) {
  const expiry = getPrescriptionVisitUploadExpiryDate(visit);

  if (!expiry) {
    return "This QR upload token is expired or invalid.";
  }

  return `This QR upload token expired on ${expiry.toLocaleDateString("en-IN")}. Create a new prescription sheet before uploading.`;
}
