import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { AuthMenu } from "./AuthMenu";
import { HeaderSearch } from "./HeaderSearch";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = data?.username ?? user.email?.split("@")[0] ?? "Moi";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-strong bg-surface-deep/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-primary text-xl leading-none">✦</span>
          <span className="font-serif text-xl font-medium text-text-primary tracking-tight">
            Pépite
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/market" className="text-sm text-text-muted hover:text-text-primary transition-colors">
            Le Marché
          </Link>
          {user && (
            <>
              <Link href="/vendre" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Vendre
              </Link>
              <Link href="/messages" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                Messages
              </Link>
            </>
          )}
        </nav>

        <Suspense>
          <HeaderSearch />
        </Suspense>

        <div className="flex items-center gap-3">
          {user && username ? (
            <AuthMenu username={username} />
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:inline"
              >
                Connexion
              </Link>
              <Link
                href="/telecharger"
                className="text-sm font-semibold bg-primary text-background px-4 py-2 rounded-full hover:bg-primary-dim transition-colors"
              >
                Télécharger l'app
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
