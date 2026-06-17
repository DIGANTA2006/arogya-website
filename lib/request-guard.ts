import { NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.origin.toLowerCase();
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: Request) {
  const allowed = new Set<string>();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (siteUrl) {
    allowed.add(normalizeOrigin(siteUrl));
  }

  if (vercelUrl) {
    allowed.add(normalizeOrigin(`https://${vercelUrl}`));
  }

  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (host) {
    allowed.add(normalizeOrigin(`https://${host}`));
    allowed.add(normalizeOrigin(`http://${host}`));
  }

  if (forwardedHost) {
    allowed.add(normalizeOrigin(`${forwardedProto}://${forwardedHost}`));
  }

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  allowed.delete("");

  return allowed;
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { ok: true as const };
  }

  const originHeader = request.headers.get("origin");

  /*
    Some server-side requests, cron calls, older browser form posts, or tools may
    not include an Origin header. We do not block missing Origin to avoid breaking
    legitimate same-site flows. When Origin exists, it must match the site.
  */
  if (!originHeader) {
    return { ok: true as const };
  }

  const requestOrigin = normalizeOrigin(originHeader);
  const allowedOrigins = getAllowedOrigins(request);

  if (allowedOrigins.has(requestOrigin)) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    ),
  };
}