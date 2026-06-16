"use client";
import { useSearchParams } from "next/navigation";
import AccountSettings from "@/components/challenge/AccountSettings";

export default function ChallengeSettingsPage() {
  const accountId = useSearchParams().get("account");
  if (!accountId) return <p style={{ color: "#69748C", padding: "32px" }}>Sélectionne un compte.</p>;
  return <AccountSettings accountId={accountId} />;
}
