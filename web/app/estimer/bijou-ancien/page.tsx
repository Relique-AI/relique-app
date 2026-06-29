import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment estimer la valeur d'un bijou ancien ? Guide 2026",
  description:
    "Poinçons or et argent, pierres précieuses, signatures : tout ce qu'il faut savoir pour estimer un bijou ancien avant de le vendre ou de le faire expertiser.",
  openGraph: {
    title: "Comment estimer la valeur d'un bijou ancien ?",
    description:
      "Poinçons or et argent, pierres précieuses, signatures : estimez votre bijou avant de le vendre.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment savoir si un bijou est en or massif ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En France, l'or massif porte obligatoirement un poinçon officiel. La tête d'aigle (18 carats, 750/1000) est le plus courant sur les bijoux anciens de qualité. La tête d'hibou (9 à 18 carats) indique une importation. Le titre est gravé en chiffres : 750 pour l'or 18 carats, 585 pour le 14 carats, 375 pour le 9 carats. Un bijou sans poinçon n'est pas nécessairement faux — il peut être très ancien (avant 1838) ou étranger — mais sa valeur reste difficile à établir sans analyse.",
      },
    },
    {
      "@type": "Question",
      name: "Comment estimer la valeur d'une bague avec pierre ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La valeur dépend de quatre facteurs : la monture (or, argent, platine), la pierre (diamant, rubis, émeraude, saphir ou pierre fine), la taille et le poids de la pierre, et la signature éventuelle. Un diamant de 1 carat en bague or 18 carats vaut entre 2 000 et 8 000 € selon la qualité (couleur, clarté, taille). Une améthyste ou un grenat de même taille vaudra 10 à 50× moins. Seul un gemmologue certifié peut évaluer précisément les pierres.",
      },
    },
    {
      "@type": "Question",
      name: "Les bijoux de marque valent-ils beaucoup plus cher ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, considérablement. Un bracelet Cartier Love en or 18 carats vaut 3 000–5 000 € d'occasion, contre 800–1 200 € pour une pièce équivalente sans marque. Une broche Van Cleef & Arpels Alhambra peut atteindre 2 000–8 000 €. Les marques qui valorisent le plus : Cartier, Van Cleef & Arpels, Boucheron, Mauboussin, Chaumet. La signature doit être lisible et accompagnée d'un numéro de série pour être vérifiable.",
      },
    },
    {
      "@type": "Question",
      name: "Que vaut une parure de bijoux de famille ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une parure complète (collier, boucles d'oreilles, broche, bracelet assortis) vaut toujours plus que la somme de ses pièces séparées — souvent 20 à 40 % de plus. Les parures Art Déco (années 1920–1940) et Belle Époque (1890–1910) sont très recherchées. Une parure de deuil victorienne en jais ou en or noir peut surprendre : entre 500 et 3 000 € selon l'état.",
      },
    },
    {
      "@type": "Question",
      name: "Où faire estimer un bijou gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'application Pépite permet d'obtenir une première estimation en photographiant le bijou. Pour une expertise certifiée, les bijouteries proposent souvent une estimation gratuite lors d'un dépôt-vente, et les commissaires-priseurs évaluent gratuitement dans le cadre de ventes aux enchères. Pour les pièces importantes (plus de 1 000 €), un gemmologue certifié (GIA, FGA) est recommandé, comptez 50 à 200 € d'honoraires.",
      },
    },
  ],
};

const PRICE_RANGES = [
  { type: "Bague solitaire diamant (or 18 carats)", range: "500 € – 8 000 €", note: "Dépend du poids et de la qualité du diamant (4C)" },
  { type: "Bracelet Cartier Love (occasion)", range: "3 000 € – 5 500 €", note: "Très coté, prix stables. Vérifier vis et tournevis d'origine" },
  { type: "Broche Art Déco signée", range: "300 € – 4 000 €", note: "Platine + diamants taille ancienne = prime importante" },
  { type: "Collier de perles fines (non cultivées)", range: "1 000 € – 20 000 €", note: "Perles fines (naturelles) sont rares. Perles de culture : 100–800 €" },
  { type: "Chevalière or 18 carats", range: "150 € – 600 €", note: "Valorisée surtout au poids du métal" },
  { type: "Parure complète Belle Époque", range: "800 € – 6 000 €", note: "Prime de 20–40 % vs pièces séparées" },
  { type: "Bijou fantaisie / métal argenté", range: "10 € – 150 €", note: "Valeur esthétique uniquement sauf si signé (Chanel, Dior...)" },
];

const CRITERIA = [
  { num: "01", title: "Le métal et les poinçons", body: "Première chose à vérifier : le poinçon sous la monture ou à l'intérieur d'une bague. Tête d'aigle = or 18 carats français. Tête de Minerve = argent massif. Pas de poinçon = métal inconnu, expertise nécessaire avant toute vente." },
  { num: "02", title: "Les pierres et leur qualité", body: "Pour les diamants : les 4C (carat, couleur, clarté, taille). Pour les pierres de couleur : rubis, émeraude et saphir non traités valent 3 à 10× plus que les mêmes pierres traitées. Un certificat GIA ou Gübelin multiplie la valeur de vente." },
  { num: "03", title: "La signature et la maison", body: "Cartier, Van Cleef, Boucheron, Chaumet, Mauboussin : cherchez la signature gravée sur l'intérieur de la monture ou sur le fermoir. Les pièces signées se revendent en moyenne 3 à 5× plus cher que les équivalents non signés." },
  { num: "04", title: "La période et le style", body: "Art Déco (1920–1940), Belle Époque (1890–1910), Rétro (1940–1950) et Mid-Century sont les périodes les plus recherchées par les collectionneurs. Un bijou victorien en bon état peut avoir une forte valeur documentaire en plus de la valeur intrinsèque." },
  { num: "05", title: "L'état et la complétude", body: "Une pierre manquante, une monture tordue ou un fermoir cassé réduisent la valeur de 30 à 60 %. En revanche, une réparation bien faite par un joaillier n'est pas pénalisante. Le nettoyage professionnel (ultrasons) peut révéler des détails cachés et valoriser une pièce." },
];

export default function BijouAncienPage() {
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
          <span className="text-text-tertiary">Bijou ancien</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Comment estimer la valeur d'un bijou ancien ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Bague de famille, broche héritée, parure Art Déco oubliée dans un écrin : les bijoux anciens peuvent valoir de quelques dizaines à plusieurs milliers d'euros. Voici comment s'y retrouver.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Commencez par les poinçons : ils indiquent le métal et son titre. Ensuite les pierres, la signature éventuelle et la période stylistique. Un bijou signé Cartier ou Van Cleef vaut 3 à 5× plus qu'un équivalent non signé. Pour les pierres importantes, seul un gemmologue peut établir une valeur fiable.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez votre bijou en 10 secondes</p>
            <p className="text-text-muted text-sm">Photographiez le bijou et ses poinçons, Pépite analyse et vous donne une fourchette de prix instantanée.</p>
          </div>
          <Link href="/telecharger" className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors">
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Les 5 critères qui déterminent la valeur</h2>
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
          <h2 className="font-serif text-2xl text-text-primary mb-2">Fourchettes de prix par type de bijou</h2>
          <p className="text-text-muted text-sm mb-6">Prix indicatifs pour des bijoux en bon état, vendus entre particuliers en 2026.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Type de bijou</th>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Votre bijou vaut peut-être bien plus que vous ne le pensez</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">Scannez. Estimez. Vendez au bon prix — sans passer par un intermédiaire.</p>
          <Link href="/telecharger" className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors">
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
