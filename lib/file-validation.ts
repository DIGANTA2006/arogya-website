export type VerifiedUploadType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type VerifiedUpload = {
  buffer: Buffer;
  contentType: VerifiedUploadType;
  extension: "pdf" | "jpg" | "png" | "webp";
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const MIME_ALIASES: Record<string, VerifiedUploadType> = {
  "application/pdf": "application/pdf",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

function startsWithBytes(buffer: Buffer, bytes: number[]) {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

function detectContentType(buffer: Buffer): VerifiedUpload | null {
  if (startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return { buffer, contentType: "application/pdf", extension: "pdf" };
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { buffer, contentType: "image/jpeg", extension: "jpg" };
  }

  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { buffer, contentType: "image/png", extension: "png" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { buffer, contentType: "image/webp", extension: "webp" };
  }

  return null;
}

export async function verifyUploadedDocument(input: {
  file: File;
  maxBytes: number;
  label: string;
  allowPdf?: boolean;
}) {
  const { file, maxBytes, label, allowPdf = true } = input;

  if (!(file instanceof File) || file.size <= 0) {
    throw new UploadValidationError(`${label} file is required.`);
  }

  if (file.size > maxBytes) {
    throw new UploadValidationError(`${label} must be ${(maxBytes / (1024 * 1024)).toFixed(0)} MB or smaller.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectContentType(buffer);

  if (!detected || (!allowPdf && detected.contentType === "application/pdf")) {
    throw new UploadValidationError(
      allowPdf
        ? `${label} must be a genuine PDF, JPG, PNG, or WEBP file.`
        : `${label} must be a genuine JPG, PNG, or WEBP image.`
    );
  }

  const declaredType = MIME_ALIASES[String(file.type || "").toLowerCase()];

  if (file.type && (!declaredType || declaredType !== detected.contentType)) {
    throw new UploadValidationError(`${label} content does not match its declared file type.`);
  }

  return detected;
}
