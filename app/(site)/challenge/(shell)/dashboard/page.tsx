"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-safe";
import ChallengeDashboard from "@/components/challenge/ChallengeDashboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = getSupabaseClient() as any;

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("account");

  useEffect(() => {
    if (accountId) return;
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return;
      const { data } = await supabase
        .from("mt5_accounts").select("id").eq("user_id", user.id)
        .order("created_at").limit(1).single();
      if (data) router.replace(`/challenge/dashboard?account=${data.id}`);
      else router.replace("/challenge/onboarding");
    });
  }, [accountId]);

  if (!accountId) return null;
  return <ChallengeDashboard accountId={accountId} />;
}

export default function ChallengeDashboardPage() {
  return <Suspense><DashboardInner /></Suspense>;
}
