import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy social sync endpoint is disabled. Use the verified OAuth callback flow.",
    },
    { status: 410 }
  );
}
