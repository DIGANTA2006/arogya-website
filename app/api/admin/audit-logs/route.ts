import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function recordValue(record: unknown, key: string) {
  if (!record || typeof record !== "object") return "";
  return String((record as Record<string, unknown>)[key] || "");
}

function mapAuditLog(row: any) {
  const before = row.old_data;
  const after = row.new_data;
  const patientEmail =
    recordValue(after, "patient_email") ||
    recordValue(after, "email") ||
    recordValue(before, "patient_email") ||
    recordValue(before, "email");

  return {
    id: String(row.id || ""),
    action: String(row.action || "UNKNOWN"),
    entity_type: String(row.table_name || "unknown"),
    entity_id: String(row.record_id || ""),
    patient_email: patientEmail,
    actor_role: "system",
    actor_subject: "database-trigger",
    metadata: {
      operation: String(row.action || "UNKNOWN"),
      table: String(row.table_name || "unknown"),
      status_before: recordValue(before, "status") || null,
      status_after: recordValue(after, "status") || null,
    },
    created_at: row.created_at,
  };
}

export async function GET() {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("id,table_name,record_id,action,old_data,new_data,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "Could not load audit logs.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: (data || []).map(mapAuditLog),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load audit logs." },
      { status: 500 }
    );
  }
}