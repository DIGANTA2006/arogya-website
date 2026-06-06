"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing Google login...");

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      try {
        const supabase = createSupabaseBrowserClient();
        const url = new URL(window.location.href);

        const oauthError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (oauthError) {
          setStatus("Google login failed: " + oauthError);
          await wait(2200);
          router.replace("/client/login");
          return;
        }

        const code = url.searchParams.get("code");
        let email = "";
        let name = "";

        if (code) {
          setStatus("Verifying Google account...");

          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setStatus("Google session failed: " + error.message);
            await wait(2500);
            router.replace("/client/login");
            return;
          }

          if (data.session?.user?.email) {
            email = data.session.user.email;
            name =
              data.session.user.user_metadata?.full_name ||
              data.session.user.user_metadata?.name ||
              email.split("@")[0] ||
              "Patient";
          }
        }

        if (!email) {
          setStatus("Reading Google email...");

          for (let i = 0; i < 15; i += 1) {
            const sessionResult = await supabase.auth.getSession();
            const userFromSession = sessionResult.data.session?.user;

            if (userFromSession?.email) {
              email = userFromSession.email;
              name =
                userFromSession.user_metadata?.full_name ||
                userFromSession.user_metadata?.name ||
                email.split("@")[0] ||
                "Patient";
              break;
            }

            const userResult = await supabase.auth.getUser();
            const user = userResult.data.user;

            if (user?.email) {
              email = user.email;
              name =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                email.split("@")[0] ||
                "Patient";
              break;
            }

            await wait(400);
          }
        }

        if (!email) {
          setStatus("Google login completed, but Gmail email was not received. Check Supabase redirect URL.");
          await wait(3500);
          router.replace("/client/login");
          return;
        }

        setStatus("Creating patient portal account...");

        const response = await fetch("/api/auth/social-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus(result.error || "Portal session could not be created.");
          await wait(3000);
          router.replace("/client/login");
          return;
        }

        if (!cancelled) {
          setStatus("Opening dashboard...");
          router.replace("/client/dashboard");
          router.refresh();
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Google login failed.");
        await wait(3000);
        router.replace("/client/login");
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #e0f2fe, #ffffff)",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: 34, textAlign: "center", maxWidth: 560 }}>
        <span className="badge">Google Login</span>
        <h1 style={{ fontSize: 34, margin: "18px 0 12px" }}>
          Please wait...
        </h1>
        <p style={{ color: "#64748b", lineHeight: 1.7 }}>
          {status}
        </p>
      </div>
    </main>
  );
}
