import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase, type Listing, type Review } from "@/lib/supabase";

export const revalidate = 120;

async function getSellerData(id: string) {
  const [profileRes, reviewsRes, listingsRes, soldRes] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url, created_at").eq("id", id).single(),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:profiles!reviewer_id(username), listing:listings!listing_id(name)")
      .eq("seller_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("listings").select("*").eq("seller_id", id).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", id).eq("status", "sold"),
  ]);

  return {
    profile: profileRes.data,
    reviews: (reviewsRes.data ?? []) as unknown as Review[],
    listings: (listingsRes.data ?? []) as Listing[],
    soldCount: soldRes.count ?? 0,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from("profiles").select("username").eq("id", id).single();
  if (!data?.username) return { title: "Profil vendeur" };
  return { title: `${data.username} — Vendeur`, description: `Découvrez les annonces de ${data.username} sur Pépite.` };
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, reviews, listings, soldCount } = await getSellerData(id);
  if (!profile) notFound();

  const avg = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  const memberSince = new Date(profile.created_at).toLocaleDateString("fr-FR", {
    month: "long", year: "numeric",
  });

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">

        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8">
          <Link href="/market" className="hover:text-text-primary transition-colors">Marché</Link>
          <span className="mx-2">›</span>
          <span className="text-text-tertiary">Profil vendeur</span>
        </nav>

        {/* En-tête profil */}
        <div className="flex flex-col items-center text-center mb-10 gap-3">
          <div className="w-20 h-20 rounded-full bg-surface-raised border-2 border-border-strong flex items-center justify-center text-primary font-serif text-3xl">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username ?? ""} width={80} height={80} className="rounded-full object-cover" />
            ) : (
              (profile.username ?? "?")[0].toUpperCase()
            )}
          </div>
          <h1 className="font-serif text-3xl text-text-primary">{profile.username ?? "Vendeur"}</h1>
          <p className="text-text-muted text-sm">Membre depuis {memberSince}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 bg-surface rounded-2xl border border-border mb-10">
          {[
            { value: avg ? `${avg} / 5` : "—", label: `${reviews.length} avis` },
            { value: String(soldCount), label: "vendus" },
            { value: String(listings.length), label: "en vente" },
          ].map(({ value, label }, i) => (
            <div key={i} className={`flex flex-col items-center py-5 gap-1 ${i < 2 ? "border-r border-border" : ""}`}>
              <span className="font-bold text-xl text-text-primary">{value}</span>
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Annonces */}
        {listings.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl text-text-primary mb-5">Annonces en vente</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {/* Avis */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl text-text-primary">Avis acheteurs</h2>
            {avg && (
              <span className="text-sm font-semibold text-primary bg-primary-light border border-primary/20 px-3 py-1 rounded-full">
                ★ {avg} / 5
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <div className="text-3xl mb-3">✦</div>
              <p>Aucun avis pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-surface rounded-xl p-5 border border-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                        {(review.reviewer?.username ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-semibold text-sm">{review.reviewer?.username ?? "Acheteur"}</p>
                        <p className="text-text-muted text-xs">
                          {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= review.rating ? "text-primary" : "text-text-muted/30"}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.listing?.name && (
                    <p className="text-text-muted text-xs italic mb-2">• {review.listing.name}</p>
                  )}
                  {review.comment && (
                    <p className="text-text-secondary text-sm leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
