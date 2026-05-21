import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase, CATEGORIES, type Listing } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Le Marché",
  description: "Parcourez des milliers d'objets de seconde main estimés par l'IA.",
};

export const revalidate = 60;

async function getListings(category?: string): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select("*, profiles(username, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data as Listing[]) ?? [];
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const listings = await getListings(category);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">

        <div className="mb-8">
          <h1 className="font-serif text-4xl text-text-primary mb-2">Le Marché</h1>
          <p className="text-text-muted">
            {listings.length} objet{listings.length !== 1 ? "s" : ""} en vente
          </p>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/market"
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !category
                ? "bg-primary text-background border-primary font-semibold"
                : "border-border-strong text-text-muted hover:border-primary/40 hover:text-text-primary"
            }`}
          >
            Tout
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/market?category=${encodeURIComponent(cat)}`}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                category === cat
                  ? "bg-primary text-background border-primary font-semibold"
                  : "border-border-strong text-text-muted hover:border-primary/40 hover:text-text-primary"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-32 text-text-muted">
            <div className="text-4xl mb-4">✦</div>
            <p>Aucune annonce dans cette catégorie pour l'instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
