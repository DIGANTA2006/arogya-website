import { NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: Request) {
  const allowed = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (siteUrl) allowed.add(normalizeOrigin(siteUrl));
  if (vercelUrl) allowed.add(normalizeOrigin(`https://${vercelUrl}`));

  if (!siteUrl) {
    allowed.add(normalizeOrigin(request.url));
  }

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  allowed.delete("");
  return allowed;
}

function rejectInvalidOrigin() {
  return {
    ok: false as const,
    response: NextResponse.json(
      { error: "Invalid or missing request origin." },
      { status: 403 }
    ),
  };
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { ok: true as const };
  }

  const fetchSite = String(request.headers.get("sec-fetch-site") || "").toLowerCase();

  if (fetchSite === "cross-site") {
    return rejectInvalidOrigin();
  }

  const allowedOrigins = getAllowedOrigins(request);
  const origin = normalizeOrigin(request.headers.get("origin") || "");

  if (origin) {
    return allowedOrigins.has(origin)
      ? { ok: true as const }
      : rejectInvalidOrigin();
  }

  const referer = normalizeOrigin(request.headers.get("referer") || "");

  if (referer) {
    return allowedOrigins.has(referer)
      ? { ok: true as const }
      : rejectInvalidOrigin();
  }

  if (fetchSite === "same-origin" || process.env.NODE_ENV !== "production") {
    return { ok: true as const };
  }

  return rejectInvalidOrigin();
}