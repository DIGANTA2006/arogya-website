import { cookies } from "next/headers";
import {
  hasPortalRole,
  normalizePortalSubject,
  type PortalRole,
} from "@/lib/portal-auth";

export type PrescriptionAccessState = {
  allowed: boolean;
  role: PortalRole | "guest";
  subject: string;
  reason: "admin" | "owner" | "guest" | "wrong-account";
};

export async function getPrescriptionAccessState(patientEmail: string): Promise<PrescriptionAccessState> {
  const normalizedPatientEmail = normalizePortalSubject(patientEmail);

  const isAdmin = await hasPortalRole("admin");

  if (isAdmin) {
    return {
      allowed: true,
      role: "admin",
      subject: "admin",
      reason: "admin",
    };
  }

  const isClient = await hasPortalRole("client");

  if (!isClient) {
    return {
      allowed: false,
      role: "guest",
      subject: "",
      reason: "guest",
    };
  }

  const cookieStore = await cookies();
  const portalEmail = normalizePortalSubject(
    cookieStore.get("portal_email")?.value ||
      cookieStore.get("portal_subject")?.value ||
      ""
  );

  const allowed = Boolean(portalEmail && portalEmail === normalizedPatientEmail);

  return {
    allowed,
    role: "client",
    subject: portalEmail,
    reason: allowed ? "owner" : "wrong-account",
  };
}
