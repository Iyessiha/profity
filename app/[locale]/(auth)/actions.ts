"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

// ─── helpers ───────────────────────────────────────────────────────────────

function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * Error keys returned to the client, mapped to `auth.error*` translation keys.
 * Unknown Supabase errors are returned as-is (already in English).
 */
export type AuthResult = { error?: string; sent?: boolean };

// ─── sign up ───────────────────────────────────────────────────────────────

export async function signup(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const locale = await getLocale();

  if (!email || !password) return { error: "required" };
  if (password.length < 8) return { error: "minLength" };
  if (password !== confirm) return { error: "mismatch" };

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin()}/${locale}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) return { error: "exists" };
    return { error: error.message };
  }

  redirect(`/${locale}/verify`);
}

// ─── sign in ───────────────────────────────────────────────────────────────

export async function login(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const locale = await getLocale();

  if (!email || !password) return { error: "required" };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login")) return { error: "invalid" };
    if (error.message.includes("Email not confirmed"))
      return { error: "notConfirmed" };
    return { error: error.message };
  }

  redirect(`/${locale}/dashboard`);
}

// ─── sign out ──────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect(`/${locale}/login`);
}

// ─── forgot password ──────────────────────────────────────────────────────

export async function forgotPassword(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "emailRequired" };

  const supabase = await createClient();
  const locale = await getLocale();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin()}/${locale}/auth/callback?next=/${locale}/reset-password`,
  });

  if (error) return { error: error.message };
  return { sent: true };
}

// ─── reset password ───────────────────────────────────────────────────────

export async function resetPassword(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const locale = await getLocale();

  if (!password) return { error: "newPasswordRequired" };
  if (password.length < 8) return { error: "minLength" };
  if (password !== confirm) return { error: "mismatch" };

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect(`/${locale}/dashboard`);
}
