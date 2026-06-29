import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tableau ou reproduction : comment savoir ? Guide 2026",
  description:
    "Toile vs impression, signature, galerie au dos, craquelures : comment distinguer un tableau original d'une reproduction et estimer sa valeur avant de le vendre.",
  openGraph: {
    title: "Tableau ou reproduction : comment savoir ?",
    description: "Toile vs impression, signature, craquelures : comment distinguer un original d'une reproduction.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment distinguer un tableau original d'une reproduction ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plusieurs indices sans expertise : regardez la surface en lumière rasante (une peinture originale a du relief, une impression est plate). Vérifiez les bords de la toile : une toile peinte a des traces de peinture sur les côtés. Observez au dos : les châssis anciens sont en bois irrégulier, les reproductions modernes ont un panneau MDF ou une toile tendue industriellement. Les craquelures naturelles (craquelure) ne peuvent pas être parfaitement imitées.",
      },
    },
    {
      "@type": "Question",
      name: "Une signature sur un tableau garantit-elle l'authenticité ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Les signatures peuvent être ajoutées après coup, copiées ou falsifiées. Une signature authentique doit être cohérente avec la technique et la période du reste du tableau. Pour les artistes côtés, seul un certificat d'authenticité émanant d'un expert reconnu ou du comité de l'artiste (si existant) a valeur légale. Une signature non identifiée n'est pas sans intérêt : certains peintres régionaux ou académiques du XIXe siècle ont une cote réelle.",
      },
    },
    {
      "@type": "Question",
      name: "Combien peut valoir un tableau trouvé dans un grenier ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les écarts sont immenses : de 50 € pour une œuvre d'un peintre inconnu à plusieurs millions pour une redécouverte. En pratique, la majorité des tableaux de grenier valent entre 100 et 2 000 €. Les peintures académiques du XIXe (portraits, paysages) se vendent régulièrement 300–3 000 € aux enchères. Un tableau signé par un artiste régional reconnu peut dépasser 5 000 € dans la région concernée.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il nettoyer un tableau avant de le vendre ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Ne nettoyez jamais un tableau vous-même avant une expertise. Le vernis jauni, la poussière accumulée et même certaines salissures font partie de l'histoire de l'œuvre. Un nettoyage amateur peut détruire des glacis, altérer des repentirs (corrections du peintre visibles sous la surface) ou effacer des détails importants. Seul un restaurateur professionnel peut intervenir sans risque.",
      },
    },
    {
      "@type": "Question",
      name: "Où faire expertiser un tableau gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les maisons de ventes aux enchères (Drouot, maisons régionales) proposent des séances d'estimation gratuites — elles y ont intérêt car elles perçoivent une commission si vous confiez le tableau. Les salons d'antiquaires organisent aussi des expertises gratuites. Pour une expertise indépendante certifiée, un expert agréé CNES coûte 150 à 500 €. L'application Pépite permet une première estimation rapide par IA.",
      },
    },
  ],
};

const INDICES = [
  { num: "01", title: "La surface en lumière rasante", body: "Posez une lampe torche à plat sur le tableau, parallèlement à la surface. Une peinture originale révèle du relief (impasto, coups de pinceau en relief). Une impression offset ou giclée est parfaitement plate. C'est le test le plus rapide et le plus fiable." },
  { num: "02", title: "Le dos du tableau", body: "Un châssis en bois irrégulier, noirci par le temps, avec des clous forgés et une toile ancienne collée aux fibres visibles : signes d'ancienneté. Un fond en MDF, une toile tendue industriellement ou un carton entoilé moderne indiquent une reproduction. Cherchez aussi étiquettes de galeries, cachets de douane ou annotations manuscrites." },
  { num: "03", title: "Les craquelures", body: "La craquelure naturelle (réseau de fissures dans la couche picturale) se forme sur des décennies et est impossible à reproduire parfaitement. Elle suit la structure de la peinture en profondeur. Les fausses craquelures appliquées en surface sont régulières, superficielles et ne traversent pas jusqu'à la toile." },
  { num: "04", title: "La signature et sa cohérence", body: "Une signature authentique est peinte avec le même pinceau et la même peinture que l'œuvre. Une signature ajoutée après coup présente souvent une différence de texture ou repose sur une couche de vernis. Cherchez la signature au recto ET les initiales ou mentions manuscrites au verso." },
  { num: "05", title: "La galerie et la provenance", body: "Étiquettes de galeries, numéros d'inventaire, mentions au crayon : chaque indice au dos reconstruit la provenance. Une œuvre passée dans une collection identifiable, même modeste, est plus facile à expertiser et à valoriser. Photographiez systématiquement le dos avant de détacher quoi que ce soit." },
];

const PRICE_RANGES = [
  { type: "Peintre inconnu, XIXe, paysage ou portrait", range: "100 € – 1 500 €", note: "Selon qualité technique et sujet. Portraits d'inconnus moins demandés" },
  { type: "Artiste régional identifié", range: "500 € – 8 000 €", note: "Cote variable selon la région et le marché local" },
  { type: "Artiste coté (hors grands maîtres)", range: "1 000 € – 30 000 €", note: "Dépend de la cote actuelle et du sujet" },
  { type: "Aquarelle ou pastel ancien signé", range: "200 € – 3 000 €", note: "Les techniques sur papier sont fragiles — état crucial" },
  { type: "Huile sur panneau de bois (avant XVIIIe)", range: "500 € – 50 000 €+", note: "Nécessite une expertise approfondie — les découvertes existent" },
  { type: "Reproduction lithographiée signée (édition limitée)", range: "100 € – 2 000 €", note: "Numéro de tirage et signature au crayon = critères clés" },
];

export default function TableauOuReproductionPage() {
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
          <span className="text-text-tertiary">Tableau ou reproduction</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Tableau ou reproduction : comment savoir ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Des milliers de tableaux de valeur dorment dans des greniers, confondus avec de simples reproductions. Voici les indices concrets pour distinguer un original d'une copie — sans être expert.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Le test le plus simple : éclairez la surface en lumière rasante. Une peinture originale a du relief, une reproduction est plate. Regardez aussi le dos : châssis ancien en bois irrégulier vs panneau MDF industriel. Ne nettoyez jamais un tableau avant expertise — vous risquez de détruire de la valeur.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Faites analyser votre tableau par l'IA</p>
            <p className="text-text-muted text-sm">Photographiez le recto, le verso et un détail en lumière rasante — Pépite vous donne une première estimation en quelques secondes.</p>
          </div>
          <Link href="/telecharger" className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors">
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">5 indices pour distinguer un original</h2>
          <div className="space-y-4">
            {INDICES.map((item) => (
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
          <h2 className="font-serif text-2xl text-text-primary mb-2">Fourchettes de prix par type d'œuvre</h2>
          <p className="text-text-muted text-sm mb-6">Prix indicatifs pour des œuvres en bon état, vendues aux enchères ou entre particuliers.</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Type d'œuvre</th>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Original ou reproduction ? L'IA vous répond en 10 secondes.</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">Scannez votre tableau avec Pépite pour une première estimation avant de faire appel à un expert.</p>
          <Link href="/telecharger" className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors">
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
