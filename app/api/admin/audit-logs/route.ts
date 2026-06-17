import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
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
      logs: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load audit logs.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}