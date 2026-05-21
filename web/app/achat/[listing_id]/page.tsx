import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase-server";
import { CONDITION_COLORS, type Listing } from "@/lib/supabase";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = { title: "Paiement — Pépite" };

export default async function AchatPage({
  params,
}: {
  params: Promise<{ listing_id: string }>;
}) {
  const { listing_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/achat/${listing_id}`);

  const { data } = await supabase
    .from("listings")
    .select("*, profiles(username, stripe_account_id)")
    .eq("id", listing_id)
    .single();

  const listing = data as (Listing & { profiles?: { username: string | null; stripe_account_id: string | null } | null }) | null;
  if (!listing) notFound();
  if (listing.status !== "active") redirect(`/listing/${listing_id}`);
  if (listing.seller_id === user.id) redirect(`/listing/${listing_id}`);

  const conditionColor = CONDITION_COLORS[listing.condition] ?? "#E0D4BA";
  const hasStripe = !!(listing.profiles as any)?.stripe_account_id;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <h1 className="font-serif text-3xl text-text-primary mb-8">Finaliser l'achat</h1>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Récapitulatif */}
          <div className="md:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-5 sticky top-24">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-raised mb-4">
                {listing.images?.[0] ? (
                  <Image src={listing.images[0]} alt={listing.name} fill sizes="300px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">✦</div>
                )}
              </div>
              <h2 className="font-serif text-lg text-text-primary mb-1 leading-snug">{listing.name}</h2>
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: conditionColor + "22", color: conditionColor, border: `1px solid ${conditionColor}44` }}
                >
                  {listing.condition}
                </span>
                <span className="font-bold text-primary text-xl">{listing.price_final} €</span>
              </div>
              <p className="text-xs text-text-muted">Vendu par <span className="text-text-secondary">{listing.profiles?.username ?? "Vendeur"}</span></p>
            </div>
          </div>

          {/* Checkout */}
          <div className="md:col-span-3">
            {!hasStripe ? (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
                <div className="text-3xl">📱</div>
                <h3 className="font-serif text-xl text-text-primary">Achat disponible uniquement dans l'app</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Ce vendeur n'a pas encore activé les paiements en ligne. Télécharge l'app Pépite pour contacter le vendeur et finaliser la transaction.
                </p>
                <a
                  href={`pepite://listing/${listing_id}`}
                  className="inline-block bg-primary text-background font-semibold px-8 py-3 rounded-full hover:bg-primary-dim transition-colors"
                >
                  Ouvrir dans l'app
                </a>
              </div>
            ) : (
              <CheckoutClient
                listingId={listing_id}
                basePrice={listing.price_final}
                accessToken=""
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
