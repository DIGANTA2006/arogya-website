import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getPrescriptions } from "@/lib/prescription-store";

export async function GET() {
  const allowed = await hasPortalRole("client");
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const cookieStore = await cookies();
  const email = cookieStore.get("portal_email")?.value || "";
  const prescriptions = await getPrescriptions(email);
  return NextResponse.json({ prescriptions });
}

