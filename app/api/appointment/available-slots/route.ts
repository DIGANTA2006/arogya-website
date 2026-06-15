import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/appointment-slots";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || "";

    const result = await getAvailableSlots(date);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Invalid date.", slots: [] },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Could not load available slots.", slots: [] },
      { status: 500 }
    );
  }
}