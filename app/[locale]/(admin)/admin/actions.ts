"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/server-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");
  return user;
}

export async function suspendUser(userId: string, reason: string) {
  const actor = await requireAdmin();
  const admin = getAdminClient();

  await admin.from("profiles").update({ suspended: true, suspended_reason: reason }).eq("id", userId);

  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action: "suspend_user",
    subject_id: userId,
    details: { reason },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/users/${userId}`);
}

export async function unsuspendUser(userId: string) {
  const actor = await requireAdmin();
  const admin = getAdminClient();

  await admin.from("profiles").update({ suspended: false, suspended_reason: null }).eq("id", userId);

  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action: "unsuspend_user",
    subject_id: userId,
    details: {},
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/users/${userId}`);
}

export async function promoteToAdmin(userId: string) {
  const actor = await requireAdmin();
  const admin = getAdminClient();

  await admin.from("profiles").update({ is_admin: true }).eq("id", userId);

  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action: "promote_admin",
    subject_id: userId,
    details: {},
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/users/${userId}`);
}

export async function revokeAdmin(userId: string) {
  const actor = await requireAdmin();
  const admin = getAdminClient();

  await admin.from("profiles").update({ is_admin: false }).eq("id", userId);

  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action: "revoke_admin",
    subject_id: userId,
    details: {},
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/users/${userId}`);
}

export async function cancelSubscription(subId: string, userId: string) {
  const actor = await requireAdmin();
  const admin = getAdminClient();

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", subId);

  await admin.from("admin_actions").insert({
    actor_id: actor.id,
    action: "cancel_subscription",
    subject_id: userId,
    details: { subscription_id: subId },
  });

  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/users/${userId}`);
  revalidatePath(`/${locale}/admin/subscriptions`);
}
