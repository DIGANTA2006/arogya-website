import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/appointment-slots";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const limit = await checkRateLimit({
      key: `appointment:available-slots:${getRequestIp(request)}`,
      limit: 120,
      windowSeconds: 60 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || "";
    const appointmentType = url.searchParams.get("appointmentType") || "Clinic Visit";

    const result = await getAvailableSlots(date, appointmentType);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Invalid date.", slots: [] },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not load available slots.", slots: [] },
      { status: 500 }
    );
  }
}
