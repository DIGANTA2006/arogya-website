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
          setStatus(`Google login failed: ${oauthError}`);
          await wait(1800);
          router.replace("/client/login");
          return;
        }

        const code = url.searchParams.get("code");

        if (code) {
          setStatus("Verifying Google login...");

          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setStatus(`Google login session failed: ${error.message}`);
            await wait(2200);
            router.replace("/client/login");
            return;
          }
        }

        setStatus("Opening your patient dashboard...");

        let userEmail = "";
        let userName = "";

        for (let attempt = 0; attempt < 12; attempt += 1) {
          const { data } = await supabase.auth.getUser();

          if (data.user?.email) {
            userEmail = data.user.email;
            userName =
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email.split("@")[0] ||
              "Patient";
            break;
          }

          await wait(300);
        }

        if (!userEmail) {
          setStatus("Google login completed, but portal session was not created. Please try again.");
          await wait(2200);
          router.replace("/client/login");
          return;
        }

        const response = await fetch("/api/auth/social-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            name: userName,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus(data.error || "Portal session could not be created.");
          await wait(2200);
          router.replace("/client/login");
          return;
        }

        if (!cancelled) {
          router.replace("/client/dashboard");
          router.refresh();
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Google login failed.");
        await wait(2200);
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
      <div className="card" style={{ padding: 34, textAlign: "center", maxWidth: 520 }}>
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