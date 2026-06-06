import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getPrescriptionByToken, getPrescriptionDownload } from "@/lib/prescription-store";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const prescription = await getPrescriptionByToken(token);
  if (!prescription) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });

  const download = await getPrescriptionDownload(prescription);
  if (download.redirectUrl) return NextResponse.redirect(download.redirectUrl);

  if (download.localPath) {
    const buffer = await readFile(download.localPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${prescription.title.replace(/[^a-zA-Z0-9._-]/g, "-")}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Download unavailable." }, { status: 500 });
}
