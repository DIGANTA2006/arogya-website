"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/client/login");
        return;
      }

      const user = data.user;

      await fetch("/api/auth/social-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Patient",
        }),
      });

      router.replace("/client/dashboard");
      router.refresh();
    }

    finishLogin();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: 30, textAlign: "center" }}>
        <h1>Signing you in...</h1>
        <p style={{ color: "#64748b" }}>
          Please wait while we open your patient dashboard.
        </p>
      </div>
    </main>
  );
}

