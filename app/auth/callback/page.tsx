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
        const error =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (error) {
          setStatus("Google login failed: " + error);
          await wait(2500);
          router.replace("/client/login");
          return;
        }

        setStatus("Reading Google account...");

        let email = "";
        let name = "";

        for (let i = 0; i < 20; i += 1) {
          const sessionResult = await supabase.auth.getSession();
          const sessionUser = sessionResult.data.session?.user;

          if (sessionUser?.email) {
            email = sessionUser.email;
            name =
              sessionUser.user_metadata?.full_name ||
              sessionUser.user_metadata?.name ||
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

        if (!email) {
          setStatus("Google login finished, but Gmail email was not received. Check Supabase Auth URL Configuration.");
          await wait(4000);
          router.replace("/client/login");
          return;
        }

        setStatus("Creating patient account...");

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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setStatus(data.error || "Portal session could not be created.");
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