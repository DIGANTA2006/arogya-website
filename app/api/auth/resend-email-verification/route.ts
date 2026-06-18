import { NextResponse } from "next/server";
import { createAndSendPatientEmailVerification } from "@/lib/email-verification";
import { assertSameOrigin } from "@/lib/request-guard";

export const runtime = "nodejs";

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
  };

  const email = cleanEmail(body.email);

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  try {
    const result = await createAndSendPatientEmailVerification(email);

    return NextResponse.json({
      success: result.sent,
      alreadyVerified: result.alreadyVerified,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not send verification email.",
      },
      { status: 500 }
    );
  }
}
