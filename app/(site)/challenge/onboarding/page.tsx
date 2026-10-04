"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-safe";
import ChallengeOnboarding from "@/components/challenge/ChallengeOnboarding";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = getSupabaseClient() as any;

export default function ChallengeOnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);
  if (!userId) return null;
  return (
    <ChallengeOnboarding
      userId={userId}
      onDone={(id) => router.push(`/challenge/dashboard?account=${id}`)}
    />
  );
}
