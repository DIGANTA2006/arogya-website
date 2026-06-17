import { assertSameOrigin } from "@/lib/request-guard";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import {
  cancelPrescriptionVisit,
  getPrescriptionVisitById,
} from "@/lib/prescription-visit-store";

type Body = {
  action?: "cancel";
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const visit = await getPrescriptionVisitById(id);

  if (!visit) {
    return NextResponse.json({ error: "Prescription visit not found." }, { status: 404 });
  }

  return NextResponse.json({ visit });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Body;

  if (body.action === "cancel") {
    const visit = await cancelPrescriptionVisit(id);
    return NextResponse.json({ success: true, visit });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}