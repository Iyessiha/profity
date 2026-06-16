"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import ChallengeOnboarding from "@/components/challenge/ChallengeOnboarding";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  if (!userId) return null;
  return (
    <ChallengeOnboarding
      userId={userId}
      onDone={(accountId) => router.push(`/dashboard?account=${accountId}`)}
    />
  );
}
