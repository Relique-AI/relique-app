import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment vider une maison en succession ? Guide complet 2026",
  description:
    "Étapes, délais légaux, objets à conserver ou vendre : tout ce qu'il faut savoir pour vider une maison dans le cadre d'une succession sans se précipiter.",
  openGraph: {
    title: "Comment vider une maison en succession ?",
    description:
      "Étapes, délais légaux, objets à conserver ou vendre dans le cadre d'une succession.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Dans quel délai faut-il vider une maison après un décès ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Il n'existe pas de délai légal strict pour vider le logement. Cependant, si le défunt était locataire, le bail se poursuit pour les héritiers qui ont 3 mois pour le résilier. Si le logement est en indivision ou doit être vendu, les héritiers ont en général intérêt à vider les lieux avant la mise en vente. Le notaire peut conseiller sur le calendrier optimal selon la situation fiscale.",
      },
    },
    {
      "@type": "Question",
      name: "Comment savoir ce qui a de la valeur dans une maison de succession ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plusieurs catégories méritent une attention particulière : les meubles anciens (commodes, armoires, secrétaires), l'argenterie et l'orfèvrerie, les bijoux et montres, les œuvres d'art et gravures signées, la vaisselle de marque (Limoges, Haviland), les livres anciens et la cave à vins. L'application Pépite permet d'estimer rapidement les objets en les photographiant. Pour un inventaire complet, un commissaire-priseur peut être mandaté.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il faire un inventaire pour une succession ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'inventaire n'est obligatoire que dans certains cas (succession avec mineur, bénéfice d'inventaire accepté). Mais il est toujours recommandé : il protège les héritiers en cas de désaccord ultérieur, est exigé par les assurances si la maison est assurée, et peut être demandé par l'administration fiscale. Un commissaire-priseur assermenté dresse un inventaire qui a valeur légale.",
      },
    },
    {
      "@type": "Question",
      name: "Comment vendre les objets d'une succession rapidement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Plusieurs options : vente aux enchères (adaptée aux pièces rares ou de grande valeur, délai de 4 à 8 semaines), vide-grenier / brocante sur place (rapide mais prix inférieurs), dépôt-vente en brocante (sans effort de vente mais commission de 30 à 40 %), ou plateformes entre particuliers comme Pépite (plus de marge, photos et estimation IA intégrées). Pour le gros du mobilier sans valeur, des associations comme Emmaüs interviennent gratuitement.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on jeter des objets avant la fin de la succession ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Techniquement, les biens de la succession appartiennent aux héritiers jusqu'au partage. Jeter des objets sans accord des co-héritiers peut créer des conflits juridiques. L'idéal est d'attendre l'accord de tous les héritiers ou d'organiser une visite commune pour décider ensemble ce qui est conservé, vendu ou donné. Le notaire peut jouer un rôle de médiateur en cas de désaccord.",
      },
    },
  ],
};

const STEPS = [
  {
    num: "01",
    title: "Sécuriser avant de trier",
    body: "Avant de toucher à quoi que ce soit, informez le notaire et les co-héritiers. Récupérez les documents importants (titre de propriété, contrats, relevés bancaires, testaments). Changez les serrures si nécessaire et vérifiez que l'assurance habitation est maintenue.",
  },
  {
    num: "02",
    title: "Faire l'inventaire des objets de valeur",
    body: "Photographiez systématiquement tout ce qui pourrait avoir de la valeur avant de déplacer quoi que ce soit. Meubles anciens, bijoux, argenterie, tableaux, service de table, cave à vin, bibliothèque. L'app Pépite permet d'obtenir une estimation rapide pour chaque objet.",
  },
  {
    num: "03",
    title: "Décider du sort de chaque catégorie",
    body: "Quatre cases : à conserver (partage entre héritiers), à vendre (estimation + vente), à donner (associations, Emmaüs), à jeter. Traitez par zones (chambre, cuisine, cave, grenier) plutôt que par objet : c'est plus efficace.",
  },
  {
    num: "04",
    title: "Vendre les pièces de valeur",
    body: "Pour les pièces à plus de 500 € : vente aux enchères ou plateforme spécialisée. En dessous : vide-grenier, brocante ou Pépite. Pour l'argenterie, l'or et les bijoux : un orfèvre ou une maison de rachat. Pour les livres anciens : librairies spécialisées. Pour les vins : courtier en vins.",
  },
  {
    num: "05",
    title: "Vider et remettre en état",
    body: "Une fois les objets de valeur traités, organisez une benne ou contactez une entreprise de débarras (comptez 500 à 3 000 € selon la taille du logement). Certaines entreprises rachètent le mobilier restant contre un débarras gratuit ou à coût réduit.",
  },
];

const OBJETS_VALEUR = [
  { cat: "Argenterie", note: "Poinçons français garantissent la teneur en argent. Un service complet de 12 couverts peut valoir 800–5 000 €." },
  { cat: "Bijoux et montres", note: "Montres de marque (Rolex, Cartier, Omega) : toujours expertiser avant de vendre. Une Rolex Submariner vaut 8 000–20 000 €." },
  { cat: "Meubles anciens", note: "Louis XV, Louis XVI, Napoléon III, Art Déco. Une commode estampillée peut valoir 2 000–15 000 €." },
  { cat: "Tableau et gravures", note: "Vérifiez signature + cadre. Un tableau signé non identifié peut nécessiter une expertise (100–300 €) qui peut révéler une valeur de 1 000 à 50 000 €." },
  { cat: "Vaisselle de porcelaine", note: "Services Limoges, Haviland, Sèvres complets : 300–3 000 €. Vérifiez les marques sous les pièces." },
  { cat: "Cave à vins", note: "Bordeaux et Bourgogne millésimés peuvent valoir plusieurs milliers d'euros. Un courtier en vins fait l'inventaire gratuitement en échange d'une commission." },
];

export default function ViderMaisonSuccessionPage() {
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
          <span className="text-text-tertiary">Vider une maison succession</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Comment vider une maison en succession ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Vider la maison d'un proche décédé est une épreuve autant pratique qu'émotionnelle.
            Ce guide vous aide à ne rien brader, à respecter les délais légaux et à organiser la vente de ce qui mérite d'être vendu.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Aucun délai légal ne vous oblige à vider rapidement. Commencez par photographier et estimer les objets de valeur avant de rien déplacer.
            Les principales sources de valeur dans une maison de succession : argenterie, bijoux, meubles anciens, tableaux, vaisselle de porcelaine et cave à vins.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez chaque objet avant de le vendre</p>
            <p className="text-text-muted text-sm">
              Photographiez et obtenez une fourchette de prix en 10 secondes. Idéal pour trier ce qui mérite une vente sérieuse.
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
          <h2 className="font-serif text-2xl text-text-primary mb-6">Les 5 étapes pour bien vider une succession</h2>
          <div className="space-y-4">
            {STEPS.map((item) => (
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
          <h2 className="font-serif text-2xl text-text-primary mb-2">Objets à ne pas brader</h2>
          <p className="text-text-muted text-sm mb-6">
            Ces catégories cachent souvent de la valeur inattendue. Faites-les estimer avant de les vendre en lot ou de les donner.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Catégorie</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">À savoir</th>
                </tr>
              </thead>
              <tbody>
                {OBJETS_VALEUR.map((row, i) => (
                  <tr key={row.cat} className={i < OBJETS_VALEUR.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.cat}</td>
                    <td className="px-4 py-3 text-text-muted">{row.note}</td>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Ne vendez pas sans savoir ce que ça vaut</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Pépite estime chaque objet en quelques secondes. Scannez. Estimez. Vendez au bon prix.
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
