"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AppLayout from "@/components/challenge/AppLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("account") ?? undefined;

  const currentPage =
    pathname.startsWith("/dashboard")  ? "dashboard"  :
    pathname.startsWith("/history")    ? "history"    :
    pathname.startsWith("/settings")   ? "settings"   :
    pathname.startsWith("/onboarding") ? "onboarding" : "dashboard";

  const handleAccountChange = (id: string) => router.push(`/${currentPage}?account=${id}`);
  const handleNavigate = (page: string) => {
    if (page === "onboarding") { router.push("/onboarding"); return; }
    router.push(`/${page}${accountId ? `?account=${accountId}` : ""}`);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AppLayout
      activeAccountId={accountId}
      currentPage={currentPage}
      onAccountChange={handleAccountChange}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
    >
      {children}
    </AppLayout>
  );
}
