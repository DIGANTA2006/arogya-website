import { readFile } from "node:fs/promises";

const checks = [];

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function expect(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
}

const mutatingRoutes = [
  "app/api/admin/appointments/route.ts",
  "app/api/admin/payments/route.ts",
  "app/api/admin/prescription-scan-upload/route.ts",
  "app/api/admin/prescription-visits/route.ts",
  "app/api/admin/prescription-visits/[id]/route.ts",
  "app/api/admin/prescription-visits/[id]/digital-upload/route.ts",
  "app/api/admin/prescriptions/route.ts",
  "app/api/admin/reviews/route.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/request-password-reset/route.ts",
  "app/api/auth/resend-email-verification/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/api/auth/send-mobile-otp/route.ts",
  "app/api/auth/verify-admin-2fa/route.ts",
  "app/api/auth/verify-mobile-otp/route.ts",
  "app/api/client/appointments/route.ts",
  "app/api/client/payments/route.ts",
  "app/api/client/profile/route.ts",
  "app/api/reviews/route.ts",
];

for (const path of mutatingRoutes) {
  const text = await source(path);
  expect(`${path} has same-origin protection`, text.includes("assertSameOrigin"));
}

const tokenSource = await source("lib/portal-token.ts");
expect("portal tokens include an expiry", tokenSource.includes("expiresAt <= now"));
expect("portal tokens include a nonce", tokenSource.includes("crypto.randomUUID()"));

const otpSource = await source("app/api/auth/verify-mobile-otp/route.ts");
expect(
  "OTP database update is bound to the signed session subject",
  otpSource.includes("markPatientMobileVerified(portalEmail") &&
    !otpSource.includes("markPatientMobileVerified(email")
);

const legacyBooking = await source("app/api/appointment/route.ts");
expect(
  "legacy booking endpoint uses verified workflow",
  legacyBooking.includes('export { POST } from "@/app/api/client/appointments/route"')
);

const prescriptionStore = await source("lib/prescription-store.ts");
expect(
  "prescriptions verify actual file signatures",
  prescriptionStore.includes("verifyUploadedDocument")
);

const paymentStore = await source("lib/payment-store.ts");
expect(
  "payment proofs verify actual file signatures",
  paymentStore.includes("verifyUploadedDocument")
);

const patientHistory = await source("app/api/admin/patient-history/route.ts");
expect(
  "patient history does not select complete patient rows",
  !patientHistory.includes('.from("patients")\n    .select("*")')
);

const csvExport = await source("app/api/admin/appointments/export/route.ts");
expect(
  "CSV export neutralizes spreadsheet formulas",
  csvExport.includes("spreadsheetSafe")
);

const housekeeping = await source("app/api/cron/daily-housekeeping/route.ts");
expect(
  "cron secret is not accepted through a query string",
  !housekeeping.includes("secretFromQuery")
);

const auditApi = await source("app/api/admin/audit-logs/route.ts");
expect(
  "audit API returns a redacted projection",
  auditApi.includes("mapAuditLog") &&
    !auditApi.includes('.from("admin_audit_logs")\n      .select("*")')
);

const meetingFlow = await source("lib/consultation-flow.ts");
expect(
  "meeting window matches the one-hour slot",
  meetingFlow.includes("MEETING_CLOSE_AFTER_MINUTES = 60")
);

const migration = await source("supabase/PHASE_10_PRODUCTION_HARDENING.sql");
expect(
  "database migration prevents active slot duplicates",
  migration.includes("appointments_one_active_booking_per_slot") &&
    migration.includes("create unique index")
);
expect(
  "audit records are scrubbed at the database layer",
  migration.includes("redact_admin_audit_json") &&
    migration.includes("- 'password_hash'")
);

const appointmentStore = await source("lib/appointment-store.ts");
expect(
  "production appointment writes cannot silently fall back to JSON",
  appointmentStore.includes('throw new Error("Appointment creation returned no record.")')
);

const failed = checks.filter((check) => !check.passed);

for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"}  ${check.label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} security regression check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} security regression checks passed.`);
