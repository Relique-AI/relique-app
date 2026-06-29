import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Valeur argenterie ancienne : prix et estimation 2026",
  description:
    "Comment estimer la valeur de votre argenterie ancienne : poinçons français, prix au gramme, fourchettes par type de pièce et conseils pour bien vendre.",
  openGraph: {
    title: "Valeur argenterie ancienne : prix et estimation",
    description:
      "Poinçons français, prix au gramme, fourchettes par type de pièce et conseils pour bien vendre votre argenterie.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment reconnaître de l'argenterie en argent massif ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En France, l'argent massif est obligatoirement poinçonné. Le poinçon de garantie (tête de Minerve pour les pièces depuis 1838, ou poinçon de la garantie ancienne avant) atteste d'une teneur minimale en argent. Le poinçon de titre indique la teneur : 950/1000 pour l'argent pur, 800/1000 pour le métal d'argenterie courant. Le métal argenté (argenture sur métal blanc ou cuivre) ne porte pas ces poinçons — cherchez plutôt 'EPNS', 'EP', 'A1' ou 'Métal Blanc'.",
      },
    },
    {
      "@type": "Question",
      name: "Combien vaut un kilo d'argenterie ancienne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le cours de l'argent métal en 2026 est d'environ 28–32 € le gramme. Un kilo d'argenterie en argent 950 contient 950 g d'argent pur, soit une valeur métal d'environ 26 600–30 400 €. En pratique, les fondeurs rachètent l'argenterie à 80–90 % du cours, soit 850–950 €/kg. Mais l'argenterie de qualité (marques reconnues, service complet) se vend bien au-dessus de la valeur métal : jusqu'à 3× pour les grandes marques.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle argenterie vaut le plus cher ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les marques les plus valorisées : Puiforcat, Christofle (argent massif), Odiot, Cardeilhac, Tétard. Un service de table complet Puiforcat peut atteindre 10 000–40 000 €. Les pièces exceptionnelles (soupières, coupes sportives, pièces d'orfèvrerie signées) dépassent souvent la valeur métal de 5 à 10 fois. La complétude du service est déterminante : un service de 12 couverts complet vaut toujours plus que le double de 6 couverts.",
      },
    },
    {
      "@type": "Question",
      name: "Comment vendre de l'argenterie ancienne au meilleur prix ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Évitez de vendre au poids sans expertise préalable. Les options : vente aux enchères (Drouot, Artcurial) pour les pièces de valeur, dépôt-vente chez un antiquaire spécialisé, vente entre particuliers via Pépite (sans commission de l'intermédiaire), ou orfèvre pour le rachat au poids si les pièces sont abîmées. Polissez légèrement avant de photographier : l'aspect visuel impacte fortement le prix en ligne.",
      },
    },
    {
      "@type": "Question",
      name: "L'argenterie noircie a-t-elle encore de la valeur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Le noircissement (oxydation de l'argent) est naturel et réversible avec un produit adapté. Une argenterie noircie n'est pas dévalorisée si elle est en argent massif. En revanche, les rayures profondes, les soudures visibles ou les pièces manquantes dans un service réduisent effectivement la valeur. Le noircissement peut même être un signe d'ancienneté pour certains collectionneurs.",
      },
    },
  ],
};

const PRICE_RANGES = [
  { type: "Service de table 12 couverts (marque connue)", range: "2 000 € – 15 000 €", note: "Puiforcat ou Odiot : jusqu'à 40 000 €" },
  { type: "Service de table 6 couverts", range: "600 € – 4 000 €", note: "Toujours moins que le prorata de 12 couverts" },
  { type: "Théière / cafetière en argent massif", range: "300 € – 2 500 €", note: "Selon le poids et la marque" },
  { type: "Coupe ou trophée sportif", range: "200 € – 3 000 €", note: "Gravures personnelles diminuent légèrement la valeur" },
  { type: "Saucière, légumier, soupière", range: "150 € – 1 800 €", note: "Pièces de service très demandées si marque reconnue" },
  { type: "Métal argenté (EPNS, métal blanc)", range: "10 € – 200 €", note: "Valeur essentiellement esthétique, pas de valeur métal" },
];

const POINCONS = [
  { poincon: "Tête de Minerve (1838–aujourd'hui)", signification: "Argent massif français, titre 950 ou 800/1000" },
  { poincon: "Poinçon de la garantie (avant 1838)", signification: "Argent massif, formes variables selon la période" },
  { poincon: "Poinçon du fabricant (initiales + symbole)", signification: "Identifie l'orfèvre. Détermine la cote de marque" },
  { poincon: "Poinçon d'importation (tête de hibou)", signification: "Pièce étrangère en argent massif importée en France" },
  { poincon: "EPNS / EP / A1 / Métal Blanc", signification: "Métal argenté (pas d'argent massif). Valeur métal nulle" },
];

export default function ArgenterieAnciennePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">

        <nav className="text-xs text-text-muted mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-text-primary transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/estimer" className="hover:text-text-primary transition-colors">Guides</Link>
          <span>›</span>
          <span className="text-text-tertiary">Argenterie ancienne</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Valeur argenterie ancienne : comment estimer ce que ça vaut ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Un service de table hérité, une théière oubliée dans un buffet, une coupe sportive au fond d'un placard :
            l'argenterie ancienne peut valoir de quelques dizaines à plusieurs dizaines de milliers d'euros.
            Voici comment s'y retrouver.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            La première question à poser : est-ce de l'argent massif ou du métal argenté ?
            L'argent massif porte un poinçon officiel (tête de Minerve en France). Sa valeur minimum est le cours du métal :
            environ 28–32 €/g en 2026. Un service signé Puiforcat ou Odiot peut valoir 5 à 10× cette valeur de base.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez votre argenterie en 10 secondes</p>
            <p className="text-text-muted text-sm">
              Photographiez les poinçons et les pièces, Pépite analyse et vous donne une fourchette de prix instantanée.
            </p>
          </div>
          <Link
            href="/telecharger"
            className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors"
          >
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-4">Lire les poinçons : le guide rapide</h2>
          <p className="text-text-muted text-sm mb-6">
            Les poinçons sont gravés sous les pièces, sur les manches, ou sur la partie intérieure des couverts.
            Une loupe 10× suffit à les lire.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Poinçon</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Signification</th>
                </tr>
              </thead>
              <tbody>
                {POINCONS.map((row, i) => (
                  <tr key={row.poincon} className={i < POINCONS.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.poincon}</td>
                    <td className="px-4 py-3 text-text-muted">{row.signification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-2">Fourchettes de prix par type de pièce</h2>
          <p className="text-text-muted text-sm mb-6">
            Prix indicatifs pour de l'argent massif en bon état, vendu entre particuliers.
            Le métal argenté (EPNS) vaut 5 à 20× moins.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Type de pièce</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Fourchette</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary hidden md:table-cell">Remarque</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_RANGES.map((row, i) => (
                  <tr key={row.type} className={i < PRICE_RANGES.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.type}</td>
                    <td className="px-4 py-3 text-primary font-semibold">{row.range}</td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((item) => (
              <details key={item.name} className="group bg-surface border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-text-primary text-sm">
                  {item.name}
                  <span className="text-primary text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-text-muted text-sm leading-relaxed">{item.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-primary/8 border border-primary/20 rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl text-text-primary mb-3">Ne vendez pas au poids sans savoir</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Un service signé Puiforcat ou Odiot vaut 5× sa valeur métal. Estimez avant de décider.
          </p>
          <Link
            href="/telecharger"
            className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors"
          >
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
