import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function safeError(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const value = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    name?: string;
  };

  return {
    name: value.name || "",
    message: value.message || "",
    code: value.code || "",
    details: value.details || "",
    hint: value.hint || "",
  };
}

function getSupabaseInfo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const projectRef = host.split(".")[0] || "";

    return {
      hasSupabaseUrl: Boolean(url),
      hasServiceRoleKey,
      supabaseHost: host,
      supabaseProjectRef: projectRef,
    };
  } catch {
    return {
      hasSupabaseUrl: Boolean(url),
      hasServiceRoleKey,
      supabaseHost: "",
      supabaseProjectRef: "",
    };
  }
}

export async function GET() {
  const allowed = await hasPortalRole("admin");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const env = getSupabaseInfo();

  try {
    const supabase = getSupabaseAdmin();

    const tableCheck = await supabase
      .from("appointment_payments")
      .select("id, appointment_id, patient_email, status, created_at")
      .limit(1);

    const countCheck = await supabase
      .from("appointment_payments")
      .select("id", { count: "exact", head: true });

    const bucketCheck = await supabase.storage.getBucket("payment-proofs");

    return NextResponse.json({
      ok: !tableCheck.error && !countCheck.error && !bucketCheck.error,
      env,
      tableCheck: {
        ok: !tableCheck.error,
        error: safeError(tableCheck.error),
        sampleRows: tableCheck.data || [],
      },
      countCheck: {
        ok: !countCheck.error,
        error: safeError(countCheck.error),
        count: countCheck.count,
      },
      bucketCheck: {
        ok: !bucketCheck.error,
        error: safeError(bucketCheck.error),
        bucket: bucketCheck.data
          ? {
              id: bucketCheck.data.id,
              name: bucketCheck.data.name,
              public: bucketCheck.data.public,
              fileSizeLimit: bucketCheck.data.file_size_limit,
              allowedMimeTypes: bucketCheck.data.allowed_mime_types,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        env,
        fatalError: safeError(error),
      },
      { status: 500 }
    );
  }
}
