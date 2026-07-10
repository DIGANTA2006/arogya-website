// Keep the legacy endpoint as a compatibility alias, but route it through the
// same verified patient workflow so it cannot bypass current booking rules.
export { POST } from "@/app/api/client/appointments/route";
