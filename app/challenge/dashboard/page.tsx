"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import ChallengeDashboard from "@/components/challenge/ChallengeDashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function ChallengeDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("account");

  useEffect(() => {
    if (accountId) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
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
