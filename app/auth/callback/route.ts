import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export const dynamic = "force-dynamic";

async function createSignature(value: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function upsertPatient(email: string, name: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service environment variables are missing.");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: existing, error: findError } = await admin
    .from("patients")
    .select("id,email,name")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return {
      email: String(existing.email),
      name: String(existing.name || name || "Patient"),
    };
  }

  const { data, error } = await admin
    .from("patients")
    .insert({
      name,
      age: "",
      phone: "",
      email,
      password_hash: null,
      mobile_verified: false,
    })
    .select("email,name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    email: String(data.email),
    name: String(data.name || name || "Patient"),
  };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/client/login?error=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/client/login?error=missing_google_code", request.url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL("/client/login?error=supabase_public_env_missing", request.url)
    );
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/client/login?error=${encodeURIComponent(exchangeError.message)}`,
        request.url
      )
    );
  }

  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user?.email) {
    return NextResponse.redirect(
      new URL(
        `/client/login?error=${encodeURIComponent(userError?.message || "google_email_not_found")}`,
        request.url
      )
    );
  }

  const email = data.user.email.toLowerCase();
  const name =
    data.user.user_metadata?.full_name ||
    data.user.user_metadata?.name ||
    email.split("@")[0] ||
    "Patient";

  try {
    const patient = await upsertPatient(email, name);
    const role = "client";
    const subject = patient.email.toLowerCase();
    const token = await createSignature(`${role}:${subject}`);

    const response = NextResponse.redirect(
      new URL("/client/dashboard", request.url)
    );

    cookiesToSet.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie.options as any);
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    };

    response.cookies.set("portal_role", role, cookieOptions);
    response.cookies.set("portal_token", token, cookieOptions);
    response.cookies.set("portal_subject", subject, cookieOptions);
    response.cookies.set("portal_email", subject, cookieOptions);
    response.cookies.set("portal_name", patient.name, cookieOptions);

    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/client/login?error=${encodeURIComponent(error instanceof Error ? error.message : "patient_create_failed")}`,
        request.url
      )
    );
  }
}
