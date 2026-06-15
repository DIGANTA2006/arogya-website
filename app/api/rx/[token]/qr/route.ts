import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const pageUrl = `${siteUrl}/rx/${token}`;

  const png = await QRCode.toBuffer(pageUrl, {
    type: "png",
    width: 360,
    margin: 2,
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}