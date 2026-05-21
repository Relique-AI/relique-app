import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";
import { CONDITION_COLORS, type Listing } from "@/lib/supabase";
import { ListingCard } from "@/components/ListingCard";

export const metadata = { title: "Mon profil — Pépite" };

type Transaction = {
  id: string;
  amount: number;
  created_at: string;
  shipping_status: string;
  listing: { id: string; name: string; images: string[] | null; price_final: number } | null;
  seller: { username: string | null } | null;
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/profil");

  const [profileRes, listingsRes, soldRes, purchasesRes] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url, created_at").eq("id", user.id).single(),
    supabase.from("listings").select("*, profiles(username, avatar_url)").eq("seller_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "sold"),
    supabase
      .from("transactions")
      .select("id, amount, created_at, shipping_status, listing:listings!listing_id(id, name, images, price_final), seller:profiles!seller_id(username)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profile = profileRes.data;
  const listings = (listingsRes.data ?? []) as Listing[];
  const soldCount = soldRes.count ?? 0;
  const purchases = (purchasesRes.data ?? []) as unknown as Transaction[];

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "";

  const SHIPPING_STATUS_LABELS: Record<string, string> = {
    to_ship: "À expédier",
    shipped: "Expédié",
    delivered: "Livré",
    to_hand: "Remise en main propre",
    completed: "Terminé",
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-surface-raised border-2 border-border-strong flex items-center justify-center text-primary font-serif text-3xl flex-shrink-0">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username ?? ""} width={80} height={80} className="rounded-full object-cover" />
            ) : (
              (profile?.username ?? user.email ?? "?")[0].toUpperCase()
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-serif text-3xl text-text-primary">{profile?.username ?? "Mon profil"}</h1>
            <p className="text-text-muted text-sm mt-1">{user.email} · Membre depuis {memberSince}</p>
          </div>
          <Link
            href="/profil/modifier"
            className="border border-border-strong text-text-muted text-sm px-5 py-2 rounded-full hover:border-primary/40 hover:text-text-primary transition-colors"
          >
            Modifier le profil
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 bg-surface rounded-2xl border border-border mb-10">
          {[
            { value: String(listings.length), label: "en vente" },
            { value: String(soldCount), label: "vendus" },
            { value: String(purchases.length), label: "achats" },
          ].map(({ value, label }, i) => (
            <div key={i} className={`flex flex-col items-center py-5 gap-1 ${i < 2 ? "border-r border-border" : ""}`}>
              <span className="font-bold text-xl text-text-primary">{value}</span>
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA vendre */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-2xl text-text-primary">Mes annonces</h2>
          <Link
            href="/vendre"
            className="bg-primary text-background text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary-dim transition-colors"
          >
            + Déposer une annonce
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-14 text-text-muted mb-10 bg-surface rounded-2xl border border-border">
            <div className="text-3xl mb-3">✦</div>
            <p className="mb-4">Tu n'as pas encore d'annonce active.</p>
            <Link href="/vendre" className="text-primary hover:underline text-sm font-semibold">
              Déposer ma première annonce →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {listings.map((l) => (
              <div key={l.id} className="relative group">
                <ListingCard listing={l} />
                <Link
                  href={`/listing/${l.id}`}
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs text-text-muted px-2.5 py-1 rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Achats */}
        <h2 className="font-serif text-2xl text-text-primary mb-5">Mes achats</h2>

        {purchases.length === 0 ? (
          <div className="text-center py-14 text-text-muted bg-surface rounded-2xl border border-border">
            <div className="text-3xl mb-3">✦</div>
            <p className="mb-4">Tu n'as pas encore effectué d'achat.</p>
            <Link href="/market" className="text-primary hover:underline text-sm font-semibold">
              Parcourir le marché →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((tx) => (
              <Link
                key={tx.id}
                href={tx.listing ? `/listing/${tx.listing.id}` : "#"}
                className="flex items-center gap-4 bg-surface border border-border rounded-xl p-4 hover:border-border-strong transition-colors"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0">
                  {tx.listing?.images?.[0] ? (
                    <Image src={tx.listing.images[0]} alt={tx.listing.name ?? ""} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">✦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-semibold text-sm truncate">{tx.listing?.name ?? "Annonce supprimée"}</p>
                  <p className="text-text-muted text-xs mt-0.5">
                    Vendeur : {tx.seller?.username ?? "—"} · {new Date(tx.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-text-primary font-bold text-sm">{(tx.amount / 100).toFixed(2)} €</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    tx.shipping_status === "delivered" || tx.shipping_status === "completed"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {SHIPPING_STATUS_LABELS[tx.shipping_status] ?? tx.shipping_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
