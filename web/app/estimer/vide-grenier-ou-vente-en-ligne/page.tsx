import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vide-grenier ou vente en ligne : que choisir ? Guide 2026",
  description:
    "Comparatif factuel : effort, prix obtenus, types d'objets adaptés à chaque canal. Vide-grenier, brocante, plateforme en ligne — lequel vous convient ?",
  openGraph: {
    title: "Vide-grenier ou vente en ligne : que choisir ?",
    description: "Comparatif factuel : effort, prix obtenus et types d'objets adaptés à chaque canal de vente.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Gagne-t-on plus en vendant en ligne qu'en vide-grenier ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En général, oui — pour les objets de valeur. La vente en ligne touche un public national ou international, ce qui crée de la concurrence entre acheteurs et monte les prix. Un objet vendu 5 € sur un vide-grenier peut se vendre 25–50 € en ligne si l'acheteur recherche précisément cet objet. En revanche, pour les objets courants (vêtements, livres de poche, jouets ordinaires), le vide-grenier est souvent plus adapté : les acheteurs veulent voir et toucher.",
      },
    },
    {
      "@type": "Question",
      name: "Quels objets se vendent mieux en vide-grenier ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les vide-greniers favorisent les objets que les gens achètent à l'impulsion : vêtements, livres, jouets, vaisselle courante, outillage. Les acheteurs de vide-greniers cherchent des bonnes affaires rapides, pas des pièces rares. Les objets encombrants (meubles, électroménager) sont plus faciles à vendre sur place qu'à expédier. En revanche, les pièces rares, les objets de collection et tout ce qui nécessite un acheteur spécifique se vendent mieux en ligne.",
      },
    },
    {
      "@type": "Question",
      name: "Combien coûte un emplacement en vide-grenier ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Entre 5 et 20 € pour un emplacement de 3 à 10 mètres linéaires selon la taille et la notoriété du marché. Les vide-greniers associatifs sont souvent moins chers (5–8 €) que les marchés aux puces professionnels (15–25 €). À cela s'ajoutent le transport, l'installation (tréteaux, tables), et la journée passée sur place. Pour rentabiliser, il faut en général vendre entre 80 et 200 € selon votre investissement initial.",
      },
    },
    {
      "@type": "Question",
      name: "Quels sont les frais des plateformes de vente en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les frais varient selon les plateformes : de 0 % pour les annonces gratuites sans protection (risque d'arnaques) à 5–15 % du prix de vente pour les plateformes avec protection acheteur/vendeur intégrée. Ajoutez les frais d'expédition (3–15 € selon le poids et la taille) que vous pouvez répercuter sur l'acheteur. En net, une vente en ligne sur un objet à 50 € vous rapporte souvent 40–45 € après frais.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on combiner vide-grenier et vente en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "C'est la stratégie optimale. Mettez d'abord en ligne les pièces de valeur (objets anciens, marques recherchées, pièces rares) — elles atteindront un meilleur prix. Ce qui n'est pas vendu après 2–3 semaines passe en vide-grenier. Ce qui reste après le vide-grenier est donné à des associations. Cette approche maximise le revenu total tout en limitant le temps passé sur chaque canal.",
      },
    },
  ],
};

const COMPARATIF = [
  {
    critere: "Prix obtenus",
    videGrenier: "Bas à modérés (pression à la baisse, acheteurs cherchent des affaires)",
    enLigne: "Modérés à élevés (acheteur ciblé, moins de négociation)",
  },
  {
    critere: "Effort demandé",
    videGrenier: "Élevé (transport, installation, journée entière sur place)",
    enLigne: "Modéré (photos, description, emballage et expédition)",
  },
  {
    critere: "Délai de vente",
    videGrenier: "Rapide (même jour ou jamais)",
    enLigne: "Variable (quelques jours à quelques semaines)",
  },
  {
    critere: "Objets adaptés",
    videGrenier: "Vêtements, livres, jouets, vaisselle courante, outillage",
    enLigne: "Objets anciens, de marque, de collection, spécialisés",
  },
  {
    critere: "Frais",
    videGrenier: "Emplacement 5–20 € + transport",
    enLigne: "Commission 5–15 % + expédition 3–15 €",
  },
  {
    critere: "Objets encombrants",
    videGrenier: "Mieux (acheteur vient chercher sur place)",
    enLigne: "Difficile (frais d'expédition élevés, logistics)",
  },
];

const TIPS = [
  { num: "01", title: "Estimez avant de décider du canal", body: "Un objet dont vous ignorez la valeur ne doit pas partir en vide-grenier sans vérification. Une montre, un bijou, un tableau, un meuble ancien méritent 5 minutes d'estimation. Pépite vous donne une fourchette en quelques secondes — si la valeur dépasse 30 €, la vente en ligne est presque toujours plus rentable." },
  { num: "02", title: "La règle des 3 seuils", body: "Moins de 5 € : donnez ou bradez en vide-grenier, l'effort en ligne n'est pas rentable. Entre 5 et 30 € : vide-grenier ou plateforme selon le volume. Au-dessus de 30 € : vente en ligne systématiquement — l'acheteur existe quelque part et paiera le bon prix." },
  { num: "03", title: "Photo = prix", body: "En ligne, la qualité photo est directement corrélée au prix obtenu. Lumière naturelle, fond neutre, 4 angles minimum. Un objet mal photographié se vend au prix d'un vide-grenier même si sa valeur est bien supérieure." },
  { num: "04", title: "Ne négligez pas la description", body: "Marque, dimensions, état précis, origine si connue. Les acheteurs en ligne font confiance à la précision. Une description factuelle avec les défauts clairement mentionnés évite les litiges et rassure les acheteurs sérieux." },
  { num: "05", title: "Stratégie combinée", body: "Objets de valeur → en ligne en premier. Reste après 2–3 semaines → vide-grenier. Invendus du vide-grenier → don à des associations (déduction fiscale possible). Cette séquence optimise le retour sur temps investi." },
];

export default function VideGrenierOuVenteEnLignePage() {
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
          <span className="text-text-tertiary">Vide-grenier ou vente en ligne</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Vide-grenier ou vente en ligne : que choisir ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Vider un grenier, une cave ou une maison : deux options face à vous. Chacune a ses avantages selon le type d'objet, le temps disponible et l'objectif de prix. Voici le comparatif factuel.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            La vente en ligne rapporte plus pour les objets de valeur ou rares. Le vide-grenier est plus adapté aux objets courants, aux vêtements et aux gros volumes. La stratégie optimale : estimez d'abord, mettez en ligne les pièces à plus de 30 €, le reste part en vide-grenier.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez avant de décider</p>
            <p className="text-text-muted text-sm">Photographiez vos objets avec Pépite — en 10 secondes vous savez si ça vaut la vente en ligne ou le vide-grenier.</p>
          </div>
          <Link href="/telecharger" className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors">
            Estimer avec Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-4">Comparatif objectif</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Critère</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Vide-grenier</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Vente en ligne</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((row, i) => (
                  <tr key={row.critere} className={i < COMPARATIF.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.critere}</td>
                    <td className="px-4 py-3 text-text-muted">{row.videGrenier}</td>
                    <td className="px-4 py-3 text-text-muted">{row.enLigne}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">5 règles pour maximiser ce que vous gagnez</h2>
          <div className="space-y-4">
            {TIPS.map((item) => (
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
          <p className="font-serif text-2xl text-text-primary mb-3">Scanne. Estime. Décide.</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">Pépite vous dit en 10 secondes si votre objet mérite la vente en ligne — ou peut partir en vide-grenier sans remords.</p>
          <Link href="/telecharger" className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors">
            Télécharger Pépite gratuitement
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
