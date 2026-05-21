import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";
import { EditProfileForm } from "./EditProfileForm";

export const metadata = { title: "Modifier mon profil — Pépite" };

export default async function ModifierProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/profil/modifier");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Header />
      <main className="flex-1 max-w-md mx-auto px-6 py-10 w-full">
        <h1 className="font-serif text-3xl text-text-primary mb-8">Modifier mon profil</h1>
        <EditProfileForm
          userId={user.id}
          initialUsername={profile?.username ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </main>
      <Footer />
    </>
  );
}
