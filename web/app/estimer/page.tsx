import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Guides d'estimation — Pépite",
  description:
    "Guides pratiques pour estimer la valeur de vos objets : meubles anciens, bijoux, montres, sacs de luxe, argenterie, tableaux, vins. Fourchettes de prix et conseils avant de vendre.",
};

const GUIDES = [
  {
    href: "/estimer/meuble-ancien",
    title: "Meuble ancien",
    desc: "Louis XV, Art Déco, rustique... fourchettes de prix et critères d'estimation.",
    emoji: "🪑",
  },
  {
    href: "/estimer/bijou-ancien",
    title: "Bijou ancien",
    desc: "Poinçons, pierres précieuses, signatures : comment estimer un bijou.",
    emoji: "💍",
  },
  {
    href: "/estimer/montre-ancienne",
    title: "Montre ancienne",
    desc: "Rolex, Omega, Lip, Yema : référence, cadran, boîte et papiers.",
    emoji: "⌚",
  },
  {
    href: "/estimer/sac-luxe",
    title: "Sac de luxe",
    desc: "Hermès, Chanel, Louis Vuitton : comment estimer et vendre au bon prix.",
    emoji: "👜",
  },
  {
    href: "/estimer/argenterie-ancienne",
    title: "Argenterie ancienne",
    desc: "Lire les poinçons, valeur au gramme, fourchettes par type de pièce.",
    emoji: "🥄",
  },
  {
    href: "/estimer/tableau-ou-reproduction",
    title: "Tableau ou reproduction ?",
    desc: "5 indices concrets pour distinguer un original sans être expert.",
    emoji: "🖼️",
  },
  {
    href: "/estimer/cave-a-vins",
    title: "Cave à vins",
    desc: "Millésimes, conservation, courtiers : vendre sa cave au bon prix.",
    emoji: "🍷",
  },
  {
    href: "/estimer/vider-maison-succession",
    title: "Vider une maison (succession)",
    desc: "Étapes, délais, objets à ne pas brader : le guide complet.",
    emoji: "🏠",
  },
  {
    href: "/estimer/vendre-en-ligne",
    title: "Vendre en ligne",
    desc: "Choisir la bonne plateforme, photographier, fixer son prix, éviter les arnaques.",
    emoji: "📦",
  },
  {
    href: "/estimer/vide-grenier-ou-vente-en-ligne",
    title: "Vide-grenier ou vente en ligne ?",
    desc: "Comparatif factuel : effort, prix obtenus, objets adaptés à chaque canal.",
    emoji: "🏷️",
  },
];

export default function EstimerPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-text-primary mb-4">
            Guides d'estimation
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Tout ce qu'il faut savoir pour évaluer vos objets avant de les vendre — ou simplement par curiosité.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="flex gap-4 bg-surface border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group"
            >
              <span className="text-3xl flex-shrink-0">{g.emoji}</span>
              <div>
                <p className="font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
                  {g.title}
                </p>
                <p className="text-text-muted text-sm">{g.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimation instantanée avec l'IA</p>
            <p className="text-text-muted text-sm">
              Photographiez n'importe quel objet avec Pépite et obtenez une fourchette de prix en 10 secondes, sans expert.
            </p>
          </div>
          <Link
            href="/telecharger"
            className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors"
          >
            Télécharger l'app →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
