import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

const BG = "#020408";
const BODY = "'Rajdhani', sans-serif";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name, public_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    const locale = await getLocale();
    redirect(`/${locale}/dashboard`);
  }

  const locale = await getLocale();
  const displayName = profile.display_name ?? profile.public_id ?? "Admin";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: BODY }}>
        <AdminNav
          locale={locale}
          displayName={displayName}
          publicId={profile.public_id ?? ""}
        />
        <main style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </>
  );
}
