import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/html";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type ProfileBody = {
  name?: string;
  age?: string;
  phone?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

async function getClientSession() {
  const allowed = await hasPortalRole("client");
  const cookieStore = await cookies();

  const email = String(cookieStore.get("portal_email")?.value || "")
    .trim()
    .toLowerCase();

  const name = String(cookieStore.get("portal_name")?.value || "").trim();

  return {
    allowed,
    email,
    name,
  };
}

function mapProfile(row: any) {
  return {
    name: row?.name || "",
    email: row?.email || "",
    phone: row?.phone || "",
    age: row?.age || "",
    mobileVerified: Boolean(row?.mobile_verified),
  };
}

async function sendDeletionRequestEmail(input: {
  name: string;
  email: string;
  phone: string;
  age: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const appointmentEmail = process.env.APPOINTMENT_EMAIL;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Arogya Clinic <onboarding@resend.dev>";

  if (!resendApiKey || !appointmentEmail) {
    return false;
  }

  const html = `
    <h2>Patient Account Deletion Request</h2>
    <p>A patient has requested account deletion/data review from the website portal.</p>
    <p><strong>Name:</strong> ${escapeHtml(input.name || "Not provided")}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(input.phone || "Not provided")}</p>
    <p><strong>Age:</strong> ${escapeHtml(input.age || "Not provided")}</p>
    <p><strong>Important:</strong> Review prescriptions, reports, appointment history, and any required clinic retention rules before deleting or anonymizing data.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [appointmentEmail],
      subject: "Patient Account Deletion Request",
      html,
    }),
  });

  return response.ok;
}

export async function GET() {
  try {
    const session = await getClientSession();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patients")
      .select("name,email,phone,age,mobile_verified")
      .eq("email", session.email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        profile: {
          name: session.name,
          email: session.email,
          phone: "",
          age: "",
          mobileVerified: false,
        },
      });
    }

    return NextResponse.json({ profile: mapProfile(data) });
  } catch (error) {
    return NextResponse.json({ error: "Profile unavailable." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const session = await getClientSession();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ProfileBody;

    const name = clean(body.name);
    const age = clean(body.age);
    const phone = clean(body.phone);

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from("patients")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (existing) {
      const { data, error } = await supabase
        .from("patients")
        .update({
          name,
          age,
          phone,
        })
        .eq("email", session.email)
        .select("name,email,phone,age,mobile_verified")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, profile: mapProfile(data) });
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name,
        age,
        phone,
        email: session.email,
        password_hash: null,
        mobile_verified: true,
      })
      .select("name,email,phone,age,mobile_verified")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: mapProfile(data) });
  } catch (error) {
    return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getClientSession();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data } = await supabase
      .from("patients")
      .select("name,email,phone,age")
      .eq("email", session.email)
      .maybeSingle();

    const sent = await sendDeletionRequestEmail({
      name: data?.name || session.name || "Patient",
      email: session.email,
      phone: data?.phone || "",
      age: data?.age || "",
    });

    return NextResponse.json({
      success: true,
      message: sent
        ? "Account deletion request submitted to the clinic. The clinic will review medical records before deletion."
        : "Account deletion request noted, but email service is not configured. Please contact the clinic directly for deletion review.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not submit deletion request." },
      { status: 500 }
    );
  }
}