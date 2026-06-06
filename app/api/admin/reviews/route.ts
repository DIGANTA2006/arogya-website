import { NextResponse } from "next/server";
import {
  getReviews,
  ReviewStatus,
  updateReviewStatus,
} from "@/lib/review-store";
import { hasPortalRole } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

const validStatuses: ReviewStatus[] = ["Pending", "Approved", "Rejected"];

export async function GET() {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const reviews = await getReviews();

    return NextResponse.json({
      reviews,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Admin review API failed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      status?: ReviewStatus;
    };

    if (!body.id || !body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid review update." },
        { status: 400 }
      );
    }

    const review = await updateReviewStatus(body.id, body.status);

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Review status could not be updated.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}