import { assertSameOrigin } from "@/lib/request-guard";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/html";
import {
  hasPortalRole,
  PORTAL_SESSION_MAX_AGE_SECONDS,
} from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cleanPhone } from "@/lib/mobile-otp-store";
import {
  normalizeIndianPhone,
  normalizePatientAge,
  validatePatientName,
} from "@/lib/input-validation";
import { checkRateLimit, getRequestIp, rateLimitPayload } from "@/lib/rate-limit";
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

  const email = String(cookieStore.get("portal_subject")?.value || "")
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
    emailVerified: Boolean(row?.email_verified),
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
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !appointmentEmail || !fromEmail) {
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
      .select("name,email,phone,age,mobile_verified,email_verified")
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
          emailVerified: false,
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

    const name = validatePatientName(body.name);
    const rawAge = clean(body.age);
    const age = normalizePatientAge(rawAge);
    const phone = normalizeIndianPhone(body.phone);

    if (!name || !phone || (rawAge && !age)) {
      return NextResponse.json(
        { error: "Enter a valid name, age, and Indian mobile number." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from("patients")
      .select("id,phone,mobile_verified,email_verified")
      .eq("email", session.email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (existing) {
      const cookieStore = await cookies();
      const verifiedMobile = cleanPhone(
        cookieStore.get("verified_mobile")?.value || ""
      );
      const phoneChanged = cleanPhone(existing.phone || "") !== phone;
      const mobileVerified = phoneChanged
        ? verifiedMobile === phone
        : Boolean(existing.mobile_verified);

      const { data, error } = await supabase
        .from("patients")
        .update({
          name,
          age,
          phone,
          mobile_verified: mobileVerified,
        })
        .eq("email", session.email)
        .select("name,email,phone,age,mobile_verified,email_verified")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const response = NextResponse.json({
        success: true,
        profile: mapProfile(data),
        message: phoneChanged && !mobileVerified
          ? "Profile saved. Verify the new mobile number before booking."
          : "Profile updated successfully.",
      });

      response.cookies.set("portal_name", name, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
      });

      return response;
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name,
        age,
        phone,
        email: session.email,
        password_hash: null,
        mobile_verified: false,
      })
      .select("name,email,phone,age,mobile_verified,email_verified")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: mapProfile(data) });
  } catch (error) {
    return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const originCheck = assertSameOrigin(request);

  if (!originCheck.ok) {
    return originCheck.response;
  }

  try {
    const session = await getClientSession();

    if (!session.allowed || !session.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const limit = await checkRateLimit({
      key: `client:deletion-request:${session.email}:${getRequestIp(request)}`,
      limit: 2,
      windowSeconds: 24 * 60 * 60,
    });

    if (!limit.allowed) {
      return NextResponse.json(rateLimitPayload(limit), { status: 429 });
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

    if (!sent) {
      return NextResponse.json(
        {
          error:
            "The request could not be delivered. Please contact the clinic directly for deletion review.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Account deletion request submitted to the clinic. The clinic will review medical records before deletion.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not submit deletion request." },
      { status: 500 }
    );
  }
}