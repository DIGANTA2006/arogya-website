import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/portal-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ProfileBody = {
  name?: string;
  phone?: string;
  age?: string;
};

function clean(value?: string) {
  return String(value || "").trim();
}

async function getPortalEmail() {
  const cookieStore = await cookies();
  return clean(cookieStore.get("portal_email")?.value).toLowerCase();
}

export async function GET() {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const email = await getPortalEmail();

  if (!email) {
    return NextResponse.json({ error: "Patient email not found." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("patients")
      .select("name,email,phone,age,mobile_verified")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      profile: {
        name: data?.name || "Patient",
        email,
        phone: data?.phone || "",
        age: data?.age || "",
        mobileVerified: Boolean(data?.mobile_verified),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Profile could not be loaded.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const allowed = await hasPortalRole("client");

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const email = await getPortalEmail();

  if (!email) {
    return NextResponse.json({ error: "Patient email not found." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as ProfileBody;

    const name = clean(body.name);
    const phone = clean(body.phone).replace(/\s/g, "");
    const age = clean(body.age);

    if (!name) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid mobile number. Example: +919876543210" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: findError } = await supabase
      .from("patients")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (existing) {
      const { error } = await supabase
        .from("patients")
        .update({
          name,
          phone,
          age,
        })
        .eq("email", email);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("patients").insert({
        name,
        email,
        phone,
        age,
        mobile_verified: false,
        password_hash: null,
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        name,
        email,
        phone,
        age,
      },
    });

    response.cookies.set("portal_name", name, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Profile could not be updated.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}