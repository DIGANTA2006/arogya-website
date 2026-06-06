import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { findPatientByEmail } from "@/lib/patient-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();

  const email = cookieStore.get("portal_email")?.value || "";
  const nameFromCookie = cookieStore.get("portal_name")?.value || "Patient";

  const patient = email ? await findPatientByEmail(email) : undefined;

  return NextResponse.json({
    profile: {
      name: patient?.name || nameFromCookie,
      email,
      phone: patient?.phone || "",
      age: patient?.age || "",
      mobileVerified: Boolean(patient?.mobileVerified),
    },
  });
}