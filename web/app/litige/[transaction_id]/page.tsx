import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";
import { DisputeForm } from "./DisputeForm";

export const metadata = { title: "Signaler un problème — Pépite" };

export default async function LitigePage({ params }: { params: Promise<{ transaction_id: string }> }) {
  const { transaction_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/litige/${transaction_id}`);

  const { data: tx } = await supabase
    .from("transactions")
    .select("id, amount, created_at, shipping_status, buyer_id, listing:listings!listing_id(id, name)")
    .eq("id", transaction_id)
    .single();

  if (!tx || tx.buyer_id !== user.id) notFound();

  const daysSince = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-6 py-16 text-center">
          <div className="text-4xl mb-4">⏱</div>
          <h1 className="font-serif text-2xl text-text-primary mb-3">Délai dépassé</h1>
          <p className="text-text-muted text-sm mb-8">
            Le délai de signalement de 7 jours est écoulé pour cette commande.
          </p>
          <Link href="/profil" className="text-primary hover:underline text-sm">← Retour au profil</Link>
        </main>
        <Footer />
      </>
    );
  }

  const { data: existingDispute } = await supabase
    .from("disputes")
    .select("id, status")
    .eq("transaction_id", transaction_id)
    .maybeSingle();

  if (existingDispute) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-6 py-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h1 className="font-serif text-2xl text-text-primary mb-3">Litige déjà ouvert</h1>
          <p className="text-text-muted text-sm mb-8">
            Un litige a déjà été ouvert pour cette commande. Statut actuel :{" "}
            <span className="text-primary font-semibold">{existingDispute.status}</span>
          </p>
          <Link href="/profil" className="text-primary hover:underline text-sm">← Retour au profil</Link>
        </main>
        <Footer />
      </>
    );
  }

  const listingName = (tx.listing as any)?.name ?? "Commande";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-xl mx-auto px-6 py-10 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profil" className="text-text-muted hover:text-text-primary transition-colors">
            ←
          </Link>
          <h1 className="font-serif text-2xl text-text-primary">Signaler un problème</h1>
        </div>
        <DisputeForm
          transactionId={transaction_id}
          listingName={listingName}
          amount={tx.amount}
        />
      </main>
      <Footer />
    </>
  );
}
