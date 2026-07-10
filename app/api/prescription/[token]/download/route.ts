import { NextResponse } from "next/server";
import { getPrescriptionAccessState } from "@/lib/prescription-access";
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

    const access = await getPrescriptionAccessState(prescription.patientEmail);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            access.reason === "wrong-account"
              ? "This prescription belongs to a different patient account."
              : "Login required to download this prescription.",
        },
        { status: 403 }
      );
    }

    const download = await getPrescriptionDownload(prescription);

    return NextResponse.redirect(download.redirectUrl, {
      headers: { "Cache-Control": "private, no-store" },
    });
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
