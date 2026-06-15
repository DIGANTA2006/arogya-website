import { NextResponse } from "next/server";
import {
  getPrescriptionByToken,
  getPrescriptionDownload,
} from "@/lib/prescription-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const prescription = await getPrescriptionByToken(token);

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found." },
        { status: 404 }
      );
    }

    const download = await getPrescriptionDownload(prescription);

    return NextResponse.redirect(download.redirectUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Download unavailable.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}