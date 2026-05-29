"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export function DeleteAccountButton() {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const { error: fnError } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (fnError) {
      setError("Une erreur est survenue. Réessaie plus tard.");
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-text-muted hover:text-red-400 transition-colors underline underline-offset-2"
      >
        Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="bg-surface border border-red-500/20 rounded-2xl p-5 space-y-4">
      <p className="text-sm text-text-primary font-semibold">Supprimer mon compte</p>
      <p className="text-xs text-text-muted leading-relaxed">
        Cette action est irréversible. Ton profil sera anonymisé et tes annonces retirées.
      </p>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1 border border-border text-text-muted text-sm py-2.5 rounded-full hover:border-border-strong transition-colors disabled:opacity-40"
        >
          Annuler
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold py-2.5 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-40"
        >
          {loading ? "Suppression…" : "Confirmer"}
        </button>
      </div>
    </div>
  );
}
