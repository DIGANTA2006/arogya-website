import { NextResponse } from "next/server";
import { addReview, getReviews } from "@/lib/review-store";

export const dynamic = "force-dynamic";

type ReviewBody = {
  name?: string;
  rating?: number;
  message?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

export async function GET() {
  try {
    const reviews = await getReviews("Approved");

    return NextResponse.json({
      reviews,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Review API failed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewBody;

    const name = clean(body.name);
    const message = clean(body.message);
    const rating = Number(body.rating || 5);

    if (!name || !message) {
      return NextResponse.json(
        { error: "Name and review message are required." },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    await addReview({
      name,
      rating,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you. Your review has been submitted for approval.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Review could not be submitted.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}