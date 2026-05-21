import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase, CONDITION_COLORS, type Listing } from "@/lib/supabase";

export const revalidate = 60;

async function getListing(id: string): Promise<Listing | null> {
  const { data } = await supabase
    .from("listings")
    .select("*, profiles(username, avatar_url)")
    .eq("id", id)
    .single();
  return (data as Listing) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Annonce introuvable" };

  return {
    title: listing.name,
    description: listing.story ?? `${listing.name} — ${listing.condition} — ${listing.price_final} €`,
    openGraph: {
      title: listing.name,
      description: `${listing.condition} · ${listing.price_final} €`,
      images: listing.images?.[0] ? [{ url: listing.images[0] }] : [],
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const conditionColor = CONDITION_COLORS[listing.condition] ?? "#E0D4BA";
  const images = listing.images ?? [];
  const seller = listing.profiles;
  const appLink = `pepite://listing/${listing.id}`;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">

        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
          <Link href="/market" className="hover:text-text-primary transition-colors">Marché</Link>
          <span>›</span>
          <span className="text-text-tertiary">{listing.category}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14">

          {/* Galerie */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={listing.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-5xl">✦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                    <Image src={img} alt={`${listing.name} ${i + 2}`} fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="font-serif text-3xl text-text-primary leading-snug">{listing.name}</h1>
                <span
                  className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full mt-1"
                  style={{ backgroundColor: conditionColor + "22", color: conditionColor, border: `1px solid ${conditionColor}44` }}
                >
                  {listing.condition}
                </span>
              </div>
              <p className="text-3xl font-bold text-primary">{listing.price_final} €</p>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {[listing.category, listing.era, listing.origin].filter(Boolean).map((tag) => (
                <span key={tag} className="text-xs bg-surface-raised text-text-tertiary px-3 py-1 rounded-full border border-border">
                  {tag}
                </span>
              ))}
            </div>

            {/* Histoire */}
            {listing.story && (
              <div>
                <h2 className="font-serif text-lg text-text-primary mb-2">Histoire de l'objet</h2>
                <p className="text-text-muted text-sm leading-relaxed">{listing.story}</p>
              </div>
            )}

            {/* Vendeur */}
            {seller && (
              <Link
                href={`/seller/${listing.seller_id}`}
                className="flex items-center gap-3 bg-surface rounded-xl p-4 border border-border hover:border-border-strong transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {(seller.username ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-semibold text-sm">{seller.username ?? "Vendeur"}</p>
                  <p className="text-text-muted text-xs">Voir le profil →</p>
                </div>
              </Link>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href={appLink}
                className="w-full bg-primary text-background font-semibold py-4 rounded-full text-center hover:bg-primary-dim transition-colors"
              >
                Acheter dans l'app
              </a>
              <Link
                href="/telecharger"
                className="w-full border border-border-strong text-text-primary py-3.5 rounded-full text-center text-sm hover:border-primary/40 transition-colors"
              >
                Télécharger Pépite
              </Link>
            </div>

            <p className="text-xs text-text-muted text-center">
              Paiement sécurisé · Livraison intégrée · Protection acheteur
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
