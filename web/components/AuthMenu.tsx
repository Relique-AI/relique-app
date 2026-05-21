"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  username: string;
}

export function AuthMenu({ username }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-text-primary hover:text-primary transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm">
          {username[0].toUpperCase()}
        </span>
        <span className="hidden md:inline font-medium">{username}</span>
        <span className="text-text-muted text-xs">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-2xl shadow-lg z-50 overflow-hidden py-1">
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-raised transition-colors"
            >
              Mon profil
            </Link>
            <Link
              href="/vendre"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-raised transition-colors"
            >
              Déposer une annonce
            </Link>
            <div className="h-px bg-border mx-3 my-1" />
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-surface-raised transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  );
}
