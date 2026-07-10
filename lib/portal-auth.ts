import { cookies } from "next/headers";
import {
  normalizePortalSubject,
  verifyPortalToken,
  type PortalRole,
} from "@/lib/portal-token";

export {
  createPortalToken,
  normalizePortalSubject,
  PORTAL_SESSION_MAX_AGE_SECONDS,
  type PortalRole,
} from "@/lib/portal-token";

export async function hasPortalRole(requiredRole: PortalRole) {
  const cookieStore = await cookies();
  const role = cookieStore.get("portal_role")?.value;
  const token = cookieStore.get("portal_token")?.value;
  const subject = normalizePortalSubject(
    cookieStore.get("portal_subject")?.value ||
      cookieStore.get("portal_email")?.value ||
      ""
  );

  if (role !== requiredRole || !token || !subject) return false;

  try {
    return await verifyPortalToken(requiredRole, subject, token);
  } catch {
    return false;
  }
}