import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Que vaut une montre ancienne ? Estimation et prix 2026",
  description:
    "Rolex, Omega, Lip, Yema, Patek Philippe : comment estimer la valeur d'une montre ancienne. Références, état du cadran, boîte et papiers.",
  openGraph: {
    title: "Que vaut une montre ancienne ?",
    description: "Rolex, Omega, Lip, Yema : références, état du cadran, boîte et papiers pour estimer votre montre.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment identifier la valeur d'une vieille montre ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les éléments clés à identifier : la marque (gravée sur le cadran et le mouvement), la référence (numéro au dos du boîtier ou sur la carrure), le calibre du mouvement, le matériau du boîtier (acier, or, plaqué or), et l'état général. Une Rolex Submariner ref. 5513 des années 1960 vaut 8 000–20 000 €. La même montre avec un cadran tropical (viré au brun) peut dépasser 50 000 €.",
      },
    },
    {
      "@type": "Question",
      name: "Une montre sans boîte ni papiers perd-elle beaucoup de valeur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, significativement pour les montres de luxe. Une Rolex avec boîte et papiers d'origine se revend en moyenne 20 à 40 % plus cher que la même montre nue. Pour une Patek Philippe, la décote peut atteindre 50 %. Pour les montres françaises (Lip, Yema, LIP) ou d'entrée de gamme, l'absence de boîte est moins pénalisante.",
      },
    },
    {
      "@type": "Question",
      name: "Les montres françaises (Lip, Yema) ont-elles de la valeur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le marché des montres françaises vintage est en forte croissance depuis 2018. Une Lip Nautic-Ski des années 1970 vaut 300–1 500 €. Une Yema Superman en bon état : 400–2 000 €. La Lip Électronique (1952), première montre électronique du monde, peut dépasser 5 000 € en parfait état. Les montres avec cadrans colorés (orange, jaune) ou bracelets d'origine sont les plus recherchées.",
      },
    },
    {
      "@type": "Question",
      name: "Comment savoir si ma Rolex est authentique ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les points à vérifier : trotteuse qui glisse sans à-coups (sweep), couronne vissée avec gravure Rolex, fond du boîtier gravé (pas de fond transparent sur les Rolex classiques), numéro de série entre les cornes à 6h. Le hologramme autocollant sur les modèles récents. Pour être certain : expertise chez un horloger agréé Rolex ou dans une maison de vente.",
      },
    },
    {
      "@type": "Question",
      name: "Où vendre une montre ancienne au meilleur prix ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pour les montres de luxe (Rolex, Patek, AP) : spécialistes en ligne, maisons de vente aux enchères, ou revendeurs certifiés. Pour les montres de marque secondaire en bon état : plateformes entre particuliers comme Pépite. Pour les montres cassées ou en pièces : brocanteurs spécialisés ou vente à la pièce. Évitez les rachats express en boutique : ils achètent à 30–50 % de la valeur marché.",
      },
    },
  ],
};

const PRICE_RANGES = [
  { brand: "Rolex Submariner (acier, vintage)", range: "6 000 € – 25 000 €", note: "Réf. 5513, 1680 : les plus recherchées. Cadran tropical = forte prime" },
  { brand: "Patek Philippe (ancienne)", range: "5 000 € – 80 000 €+", note: "Complications (perpétuel, chronographe) : valeur décuplée" },
  { brand: "Omega Speedmaster (pre-Moon)", range: "2 000 € – 8 000 €", note: "Calibre 321 et cadrans Ed White : prime de collection" },
  { brand: "Omega Seamaster / Constellation", range: "400 € – 2 500 €", note: "Or massif ou cadran pie-pan en hausse" },
  { brand: "Lip Nautic-Ski / R27", range: "300 € – 1 500 €", note: "Marché français en forte croissance depuis 2018" },
  { brand: "Yema Superman / Rallygraf", range: "400 € – 2 000 €", note: "Bracelets d'origine et cadrans tropicaux très valorisés" },
  { brand: "Montre gousset en or", range: "200 € – 3 000 €", note: "Valeur au poids + complications (répétition minutes : 2 000–10 000 €)" },
];

const CRITERIA = [
  { num: "01", title: "La marque et la référence exacte", body: "Deux montres du même fabricant peuvent valoir 500 € et 50 000 €. La référence (numéro gravé sur la carrure ou entre les cornes) est essentielle. Sur Rolex : les références à 4 chiffres (1680, 5513, 6239) sont les plus collectionnées. Photographiez toujours le cadran ET le fond du boîtier." },
  { num: "02", title: "L'état du cadran", body: "Le cadran est l'élément le plus sensible. Un cadran d'origine, même avec une légère patine, vaut infiniment plus qu'un cadran reconditionné ou repeint. Les cadrans 'tropicaux' (virant au brun sous l'effet des UV) sont paradoxalement les plus recherchés sur les Rolex vintage." },
  { num: "03", title: "Le mouvement et son état", body: "Un mouvement qui fonctionne et a été révisé régulièrement vaut toujours plus qu'un mouvement HS. Les mouvements avec complications (chronographe, calendrier perpétuel, répétition minutes) ajoutent considérablement à la valeur. Un calibre Rolex 1570 ou un Valjoux 72 en bon état est un argument de vente." },
  { num: "04", title: "Boîte, papiers et bracelet d'origine", body: "Full set (boîte, papiers, bracelet et boucle déployante d'origine) : prime de 20 à 50 % selon la marque. Les bracelets intégrés d'origine (Omega Speedmaster, Lip Nautic-Ski) sont quasi introuvables et très valorisés. Conservez tout, même le plastique de protection." },
  { num: "05", title: "Le matériau du boîtier", body: "Or 18 carats : prime de valeur métal (environ 15–30 g selon le modèle). Platine : très rare, forte prime. Acier : paradoxalement plus coté en vintage sur Rolex (les références acier étaient moins produites). Plaqué or : décote importante, surtout si le plaqué s'est écaillé." },
];

export default function MontreAnciennePage() {
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
          <span className="text-text-tertiary">Montre ancienne</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Que vaut une montre ancienne ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Le marché des montres vintage est l'un des plus dynamiques de l'occasion de luxe. Rolex, Omega, Patek Philippe, mais aussi les françaises Lip et Yema : voici comment évaluer votre montre avant de la vendre.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            La référence exacte et l'état du cadran sont les deux critères les plus importants. Un cadran d'origine légèrement patiné vaut toujours plus qu'un cadran refait. La boîte et les papiers ajoutent 20 à 50 % sur les marques de luxe. Les françaises Lip et Yema vintage sont en forte hausse depuis 2018.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez votre montre en 10 secondes</p>
            <p className="text-text-muted text-sm">Photographiez le cadran, le fond et les flancs du boîtier — Pépite identifie la marque et vous donne une fourchette de prix.</p>
          </div>
          <Link href="/telecharger" className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors">
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Les 5 critères qui font le prix</h2>
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
          <h2 className="font-serif text-2xl text-text-primary mb-2">Prix par marque et modèle</h2>
          <p className="text-text-muted text-sm mb-6">Fourchettes indicatives pour une montre en bon état avec boîte et papiers, marché 2026.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Marque / Modèle</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Fourchette</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary hidden md:table-cell">À savoir</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_RANGES.map((row, i) => (
                  <tr key={row.brand} className={i < PRICE_RANGES.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.brand}</td>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Votre montre. Sa valeur. En 10 secondes.</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">Scannez votre montre avec Pépite et obtenez une estimation avant de la vendre ou de la faire expertiser.</p>
          <Link href="/telecharger" className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors">
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
