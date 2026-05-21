import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { supabase, CATEGORIES, type Listing } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Le Marché",
  description: "Parcourez des milliers d'objets de seconde main estimés par l'IA.",
};

export const revalidate = 60;

async function getListings(category?: string, q?: string): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select("*, profiles(username, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (category) query = query.eq("category", category);

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,story.ilike.%${term}%,era.ilike.%${term}%,origin.ilike.%${term}%`);
  }

  const { data } = await query;
  return (data as Listing[]) ?? [];
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const listings = await getListings(category, q);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">

        <div className="mb-6">
          <h1 className="font-serif text-4xl text-text-primary mb-4">Le Marché</h1>
          <Suspense>
            <SearchBar
              initialQ={q ?? ""}
              placeholder="Rechercher un objet, une époque, une origine…"
              className="max-w-xl"
            />
          </Suspense>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href={q ? `/market?q=${encodeURIComponent(q)}` : "/market"}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !category
                ? "bg-primary text-background border-primary font-semibold"
                : "border-border-strong text-text-muted hover:border-primary/40 hover:text-text-primary"
            }`}
          >
            Tout
          </Link>
          {CATEGORIES.map((cat) => {
            const href = q
              ? `/market?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`
              : `/market?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                  category === cat
                    ? "bg-primary text-background border-primary font-semibold"
                    : "border-border-strong text-text-muted hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Résultats */}
        <div className="mb-4 flex items-center gap-3">
          <p className="text-text-muted text-sm">
            {q ? (
              <>
                <span className="text-text-primary font-semibold">{listings.length}</span> résultat{listings.length !== 1 ? "s" : ""} pour «{" "}
                <span className="text-primary">{q}</span> »
              </>
            ) : (
              <>{listings.length} objet{listings.length !== 1 ? "s" : ""} en vente</>
            )}
          </p>
          {q && (
            <Link href={category ? `/market?category=${encodeURIComponent(category)}` : "/market"} className="text-xs text-text-muted hover:text-text-primary underline">
              Effacer la recherche
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-32 text-text-muted">
            <div className="text-4xl mb-4">✦</div>
            <p className="mb-4">
              {q ? `Aucun résultat pour « ${q } »` : "Aucune annonce dans cette catégorie pour l'instant."}
            </p>
            {q && (
              <Link href="/market" className="text-primary hover:underline text-sm">
                Voir toutes les annonces →
              </Link>
            )}
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
