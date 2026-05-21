import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase, type Listing } from "@/lib/supabase";

async function getFeaturedListings(): Promise<Listing[]> {
  const { data } = await supabase
    .from("listings")
    .select("*, profiles(username, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data as Listing[]) ?? [];
}

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,184,46,0.12),transparent)]" />
          <div className="max-w-4xl mx-auto px-6 py-24 md:py-36 text-center relative">
            <h1 className="font-serif text-5xl md:text-7xl text-text-primary leading-tight mb-6">
              Tes objets valent<br />
              <span className="text-primary italic">plus que tu ne crois</span>
            </h1>
            <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Photographiez un objet, notre IA l'estime en secondes. Publiez,
              vendez, expédiez — tout depuis l'application.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/telecharger"
                className="bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors shadow-lg text-base"
              >
                Télécharger l'app
              </Link>
              <Link
                href="/market"
                className="text-text-primary border border-border-strong px-8 py-3.5 rounded-full hover:border-primary/40 transition-colors text-base"
              >
                Parcourir le marché →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Comment ça marche ────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-text-primary mb-4">
            Vendre n'a jamais été aussi simple
          </h2>
          <p className="text-center text-text-muted mb-14 max-w-xl mx-auto">
            Trois étapes, quelques secondes. L'IA fait le travail.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📸",
                step: "01",
                title: "Photographiez",
                desc: "Prenez quelques photos de votre objet depuis l'app. Pas besoin d'être photographe.",
              },
              {
                icon: "✦",
                step: "02",
                title: "L'IA estime",
                desc: "Notre IA identifie l'objet, son époque, son état et vous propose un prix de marché en temps réel.",
              },
              {
                icon: "🚀",
                step: "03",
                title: "Vendez",
                desc: "Publiez en un tap. L'acheteur paye en ligne, vous générez une étiquette d'expédition intégrée.",
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="bg-surface rounded-2xl p-7 border border-border relative overflow-hidden">
                <div className="absolute top-4 right-5 font-serif text-5xl text-text-muted/10 leading-none select-none">
                  {step}
                </div>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-serif text-xl text-text-primary mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Annonces récentes ────────────────────────────── */}
        {listings.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-20 md:pb-28">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl text-text-primary">
                Dernières pépites
              </h2>
              <Link href="/market" className="text-sm text-primary hover:text-primary-dim transition-colors font-semibold">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA téléchargement ───────────────────────────── */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <div className="text-primary text-4xl mb-6">✦</div>
            <h2 className="font-serif text-4xl md:text-5xl text-text-primary mb-4">
              Prêt à vendre votre première pépite ?
            </h2>
            <p className="text-text-muted mb-10 text-lg">
              Disponible sur iOS et Android. Gratuit, sans abonnement.
            </p>
            <Link
              href="/telecharger"
              className="inline-block bg-primary text-background font-semibold px-10 py-4 rounded-full hover:bg-primary-dim transition-colors text-base"
            >
              Télécharger Pépite
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
