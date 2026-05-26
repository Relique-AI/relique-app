"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Reason = "not_received" | "not_as_described" | "damaged" | "other";

const REASONS: { id: Reason; label: string; icon: string; desc: string }[] = [
  { id: "not_received", label: "Objet non reçu", icon: "📦", desc: "Je n'ai pas reçu mon colis" },
  { id: "not_as_described", label: "Non conforme", icon: "⚠️", desc: "L'objet ne correspond pas à l'annonce" },
  { id: "damaged", label: "Endommagé", icon: "🔧", desc: "L'objet est arrivé abîmé" },
  { id: "other", label: "Autre", icon: "•••", desc: "Autre problème" },
];

type Props = {
  transactionId: string;
  listingName: string;
  amount: number;
};

export function DisputeForm({ transactionId, listingName, amount }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = reason !== null && description.trim().length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("open-dispute", {
        body: { transaction_id: transactionId, reason, description: description.trim() },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error || res.data?.error) {
        setError(res.data?.error ?? res.error?.message ?? "Une erreur est survenue.");
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="font-serif text-2xl text-text-primary mb-3">Litige ouvert</h2>
        <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto">
          Votre litige a été enregistré. Notre équipe l'examinera dans les plus brefs délais et vous notifiera de la décision.
        </p>
        <button
          onClick={() => router.push("/profil")}
          className="bg-primary text-background text-sm font-semibold px-6 py-3 rounded-full hover:bg-primary-dim transition-colors"
        >
          Retour à mon profil
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      {/* Récap commande */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4">
        <span className="text-2xl">📦</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm truncate">{listingName}</p>
          <p className="text-text-muted text-xs mt-0.5">{(amount / 100).toFixed(2)} €</p>
        </div>
      </div>

      {/* Protection banner */}
      <div className="flex items-start gap-3 bg-primary/8 border border-primary/20 rounded-xl p-4">
        <span className="text-primary mt-0.5">🛡</span>
        <p className="text-text-muted text-sm">
          Protection acheteur · Délai de signalement :{" "}
          <span className="text-primary font-semibold">7 jours</span> après la transaction
        </p>
      </div>

      {/* Raison */}
      <div>
        <p className="font-semibold text-text-primary mb-3">Quel est le problème ?</p>
        <div className="grid grid-cols-2 gap-3">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                reason === r.id
                  ? "border-primary bg-primary/8"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span className="text-xl block mb-2">{r.icon}</span>
              <p className={`font-semibold text-sm ${reason === r.id ? "text-primary" : "text-text-primary"}`}>
                {r.label}
              </p>
              <p className="text-text-muted text-xs mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="font-semibold text-text-primary mb-3">Décrivez le problème</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Expliquez le problème en détail (minimum 20 caractères). Plus vous êtes précis, plus vite nous pourrons vous aider."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
        />
        <p className={`text-xs mt-1 text-right ${description.length > 0 && description.length < 20 ? "text-danger" : "text-text-muted"}`}>
          {description.length} / 20 min
        </p>
      </div>

      {/* Avertissement */}
      <div className="flex items-start gap-3 bg-surface border border-border rounded-xl p-4">
        <span className="text-text-muted mt-0.5">⚠</span>
        <p className="text-text-muted text-xs">
          Les faux litiges peuvent entraîner la suspension de votre compte. Assurez-vous d'avoir d'abord tenté de résoudre le problème directement avec le vendeur.
        </p>
      </div>

      {error && (
        <p className="text-danger text-sm text-center bg-danger/8 border border-danger/20 rounded-xl p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full bg-danger text-background font-semibold py-3.5 rounded-full disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {loading ? "Envoi en cours…" : "Ouvrir le litige"}
      </button>
    </form>
  );
}
