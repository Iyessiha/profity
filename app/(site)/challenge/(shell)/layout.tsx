"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AppLayout from "@/components/challenge/AppLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function ShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("account") ?? undefined;

  const currentPage =
    pathname.includes("/challenge/dashboard")  ? "dashboard"  :
    pathname.includes("/challenge/history")    ? "history"    :
    pathname.includes("/challenge/settings")   ? "settings"   :
    pathname.includes("/challenge/onboarding") ? "onboarding" : "dashboard";

  const go = (page: string, id?: string) => {
    const q = (id ?? accountId) ? `?account=${id ?? accountId}` : "";
    router.push(page === "onboarding" ? "/challenge/onboarding" : `/challenge/${page}${q}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AppLayout
      activeAccountId={accountId}
      currentPage={currentPage}
      onAccountChange={(id) => go(currentPage, id)}
      onNavigate={(page) => go(page)}
      onSignOut={handleSignOut}
    >
      {children}
    </AppLayout>
  );
}

export default function ChallengeShell({ children }: { children: React.ReactNode }) {
  return <Suspense><ShellInner>{children}</ShellInner></Suspense>;
}
