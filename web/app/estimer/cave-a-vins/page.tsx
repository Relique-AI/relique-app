import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment vendre une cave à vins ? Estimation et prix 2026",
  description:
    "Millésimes, conservation, courtiers en vins, enchères en ligne : tout ce qu'il faut savoir pour estimer et vendre une cave à vins au meilleur prix.",
  openGraph: {
    title: "Comment vendre une cave à vins ?",
    description: "Millésimes, conservation, courtiers et enchères : estimez et vendez votre cave au meilleur prix.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment savoir si mes bouteilles de vin ont de la valeur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les critères principaux : l'appellation (Bordeaux grands crus, Bourgogne, Côte du Rhône septentrionale, Champagne de prestige), le millésime (1982, 1990, 1996, 2000, 2005, 2010, 2015 sont des années exceptionnelles pour Bordeaux), le producteur (châteaux classés, domaines reconnus), et l'état de conservation (niveau, étiquette, température de stockage). Une bouteille de Pétrus 1982 vaut plus de 5 000 €. Un Bordeaux générique de 2015 vaut 10–30 €.",
      },
    },
    {
      "@type": "Question",
      name: "Comment faire estimer une cave à vins gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les courtiers en vins proposent systématiquement une estimation gratuite sur place ou sur photos, en échange d'une commission si vous vendez via eux (généralement 10 à 15 %). Les maisons de ventes aux enchères spécialisées (Acker, Hart Davis Hart, Drouot Estimations) font de même. Pour un premier tri, des applications de scan d'étiquettes permettent d'identifier rapidement les bouteilles à valeur.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il vendre en lot ou à la bouteille ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les caisses de 6 ou 12 bouteilles d'origine non ouvertes (OWC - Original Wooden Case) valent systématiquement plus que les bouteilles séparées : prime de 15 à 30 %. Les lots homogènes (même château, même millésime) sont plus faciles à vendre. Les bouteilles uniques de grande valeur se vendent mieux séparément aux enchères. La caisse en bois d'origine doit être conservée.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est l'importance des conditions de conservation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Capitale. Un vin gardé à 12–14°C, dans l'obscurité et à hygrométrie constante conserve toute sa valeur. Un vin stocké dans un appartement chaud (plus de 20°C) sur plusieurs années peut avoir subi une oxydation prématurée — même si la bouteille semble intacte. Les acheteurs professionnels examinent le niveau (ullage) : un niveau bas dans le col est un défaut majeur. Les bouteilles avec étiquettes abîmées subissent une décote de 10 à 20 %.",
      },
    },
    {
      "@type": "Question",
      name: "Vaut-il mieux vendre via un courtier ou aux enchères ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pour des caves importantes (plus de 5 000 €) ou des vins très rares : les enchères spécialisées offrent les meilleurs prix mais avec un délai de 4 à 8 semaines et des frais vendeur de 10 à 15 %. Pour des caves moyennes avec de bons vins : un courtier est plus rapide (15 jours en moyenne) avec une commission comparable. Pour du vin courant (Bordeaux génériques, vins de région) : la revente directe entre particuliers ou à un caviste est plus simple.",
      },
    },
  ],
};

const MILLESIMES = [
  { appellation: "Bordeaux (Médoc, Pomerol, Saint-Émilion)", top: "1982, 1990, 2000, 2005, 2009, 2010, 2015", note: "Le 1982 reste le millésime mythique — Pétrus 1982 : 5 000 €+" },
  { appellation: "Bourgogne (Côte de Nuits, Côte de Beaune)", top: "1990, 1996, 2002, 2005, 2010, 2015, 2019", note: "La Romanée-Conti est hors marché (30 000–100 000 € la bouteille)" },
  { appellation: "Côte du Rhône Nord (Côte-Rôtie, Hermitage)", top: "1990, 1991, 1999, 2010, 2015", note: "Chave, Chapoutier, Guigal : domaines les plus côtés" },
  { appellation: "Champagne prestige", top: "1996, 2002, 2008, 2012", note: "Dom Pérignon, Krug, Cristal : 100–800 € la bouteille selon l'année" },
  { appellation: "Vins du Monde (Italie, Espagne)", top: "Barolo 1996, 2010 / Vega Sicilia 2005", note: "Marché plus étroit mais en forte croissance" },
];

const CRITERIA = [
  { num: "01", title: "L'inventaire complet avant tout", body: "Photographiez chaque bouteille avec l'étiquette lisible. Notez le niveau du vin dans la bouteille (idéalement : dans le goulot ou mi-épaule). Conservez les caisses en bois d'origine — elles ont une vraie valeur marchande. Un inventaire bien fait rassure les acheteurs professionnels." },
  { num: "02", title: "Les conditions de stockage", body: "Temperature, lumière, humidité : documentez les conditions réelles de conservation. Si la cave était climatisée ou enterrée, c'est un argument de vente. Si les bouteilles ont vécu dans un placard chaud, soyez transparent — les acheteurs s'en aperçoivent à l'ouverture." },
  { num: "03", title: "Identifier les pépites", body: "Bordeaux premiers crus classés (Margaux, Latour, Mouton, Haut-Brion, Pétrus), grands Bourgognes (DRC, Leroy, Rousseau), Champagnes de prestige : ce sont les bouteilles qui justifient une vente aux enchères séparée. Le reste peut partir en lot via un courtier." },
  { num: "04", title: "Choisir le bon canal de vente", body: "Bouteilles à plus de 500 € : enchères spécialisées. Cave complète ou lots homogènes : courtier en vins. Vins courants et régionaux : cavistes locaux, ou vente directe. Ne bradez pas à un restaurateur qui achète en vrac — les prix sont très bas." },
  { num: "05", title: "Timing et fiscalité", body: "La vente de vin est soumise à une taxe sur les métaux précieux et objets de collection (TVA sur la marge ou taxe forfaitaire de 6,5 % + CRDS). Pour une cave importante, consultez un notaire ou un conseiller fiscal. Le timing peut jouer : les grandes ventes de printemps et d'automne obtiennent de meilleurs prix." },
];

export default function CaveAVinsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">

        <nav className="text-xs text-text-muted mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-text-primary transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/estimer" className="hover:text-text-primary transition-colors">Guides</Link>
          <span>›</span>
          <span className="text-text-tertiary">Cave à vins</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Comment vendre une cave à vins ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Une cave à vins héritée ou constituée sur des années peut représenter des milliers d'euros. Mais encore faut-il savoir ce qu'on a, comment le valoriser et par où vendre. Voici le guide complet.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Commencez par photographier et inventorier chaque bouteille. Les caisses en bois d'origine augmentent la valeur de 15 à 30 %. Pour les grands crus et millésimes exceptionnels (Bordeaux 1982, 1990, 2005 ; Bourgogne 1996, 2010), les enchères spécialisées offrent les meilleurs prix. Pour le reste, un courtier en vins est le moyen le plus rapide.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez vos bouteilles avec Pépite</p>
            <p className="text-text-muted text-sm">Photographiez les étiquettes, Pépite identifie appellation, millésime et vous donne une fourchette de prix.</p>
          </div>
          <Link href="/telecharger" className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors">
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Les 5 étapes pour bien vendre</h2>
          <div className="space-y-4">
            {CRITERIA.map((item) => (
              <div key={item.num} className="flex gap-5 bg-surface border border-border rounded-xl p-5">
                <span className="font-serif text-3xl text-primary/30 leading-none flex-shrink-0">{item.num}</span>
                <div>
                  <p className="font-semibold text-text-primary mb-1">{item.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-2">Grands millésimes par appellation</h2>
          <p className="text-text-muted text-sm mb-6">Si vos bouteilles correspondent à ces années et ces régions, elles méritent une estimation sérieuse.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Appellation</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Millésimes phares</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary hidden md:table-cell">Remarque</th>
                </tr>
              </thead>
              <tbody>
                {MILLESIMES.map((row, i) => (
                  <tr key={row.appellation} className={i < MILLESIMES.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.appellation}</td>
                    <td className="px-4 py-3 text-primary font-semibold text-xs">{row.top}</td>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Ne vendez pas vos bouteilles sans les identifier</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">Un Pétrus 1982 vendu à un caviste au prix d'un Bordeaux générique : ça arrive. Estimez d'abord.</p>
          <Link href="/telecharger" className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors">
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
