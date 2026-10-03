"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountSettings from "@/components/challenge/AccountSettings";

function HistoryInner() {
  const accountId = useSearchParams().get("account");
  if (!accountId) return <p style={{ color: "#69748C", padding: "32px" }}>Sélectionne un compte.</p>;
  return <AccountSettings accountId={accountId} />;
}

export default function ChallengeHistoryPage() {
  return <Suspense><HistoryInner /></Suspense>;
}
