"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

function SuccessContent() {
  const searchParams = useSearchParams();
  const pi = searchParams.get("pi");
  const listingId = searchParams.get("listing_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!pi) { setStatus("error"); return; }

    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus("error"); return; }
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/confirm-purchase`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({ payment_intent_id: pi }),
          }
        );
        const json = await res.json();
        setStatus(json.success ? "success" : "error");
      } catch {
        setStatus("error");
      }
    });
  }, [pi]);

  if (status === "loading") {
    return (
      <div className="text-center py-20">
        <span className="text-primary text-4xl animate-spin inline-block">✦</span>
        <p className="text-text-muted mt-4">Finalisation de la commande…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="font-serif text-2xl text-text-primary">Une erreur est survenue</h1>
        <p className="text-text-muted text-sm">
          Si tu as été débité, contacte-nous — ta commande sera traitée manuellement.
        </p>
        <Link href="/market" className="inline-block text-primary hover:underline text-sm">
          Retour au marché
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-20 space-y-5">
      <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mx-auto text-4xl">
        ✦
      </div>
      <h1 className="font-serif text-3xl text-text-primary">Achat confirmé !</h1>
      <p className="text-text-muted max-w-sm mx-auto text-sm leading-relaxed">
        Ta commande est enregistrée. Le vendeur a été notifié et va prendre contact avec toi pour organiser la livraison.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        {listingId && (
          <Link
            href={`/listing/${listingId}`}
            className="border border-border-strong text-text-primary px-6 py-3 rounded-full text-sm hover:border-primary/40 transition-colors"
          >
            Voir l'annonce
          </Link>
        )}
        <Link
          href="/market"
          className="bg-primary text-background font-semibold px-6 py-3 rounded-full hover:bg-primary-dim transition-colors text-sm"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="flex-1 max-w-xl mx-auto px-6 w-full">
      <Suspense>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
