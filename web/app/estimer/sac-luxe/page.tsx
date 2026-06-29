import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment estimer un sac de luxe ? Guide et prix 2026",
  description:
    "Fourchettes de prix par marque (Hermès, Chanel, Louis Vuitton), critères d'authentification et conseils pour vendre votre sac de luxe au meilleur prix.",
  openGraph: {
    title: "Comment estimer un sac de luxe ?",
    description:
      "Fourchettes de prix par marque, critères d'authentification et conseils pour vendre votre sac de luxe.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment savoir si mon sac de luxe a de la valeur ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La valeur d'un sac de luxe dépend principalement de la marque, du modèle, de l'état et des accessoires d'origine. Un sac Hermès Birkin conserve 100 % à 200 % de sa valeur d'achat. Un sac Chanel Classic Flap prend de la valeur chaque année. Les sacs Louis Vuitton en toile monogram bien conservés se revendent entre 30 % et 70 % du prix neuf selon le modèle.",
      },
    },
    {
      "@type": "Question",
      name: "Quels documents faut-il pour vendre un sac de luxe ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Idéalement : la facture d'achat originale, la carte d'authenticité (dust bag, clochette, cadenas, clés pour Hermès), et la boîte d'origine. Ces accessoires peuvent augmenter le prix de revente de 10 à 30 %. Sans facture, un certificat d'authenticité établi par un expert est fortement recommandé pour les pièces à plus de 500 €.",
      },
    },
    {
      "@type": "Question",
      name: "Comment vérifier l'authenticité d'un sac de luxe ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les points à vérifier : la qualité des coutures (régulières, sans surplus de colle), le numéro de série ou puce NFC selon la marque, les finitions des fermetures et quincailleries, l'odeur du cuir (un vrai cuir de luxe a une odeur distinctive), et la qualité de l'estampage du logo. Pour les Hermès, la lettre-date gravée dans l'cuir indique l'année de fabrication.",
      },
    },
    {
      "@type": "Question",
      name: "Où faire estimer un sac de luxe gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vous pouvez photographier votre sac avec l'application Pépite pour obtenir une estimation IA en quelques secondes. Pour une expertise certifiée destinée à la vente ou à l'assurance, des maisons comme Cresus, Collector Square ou des commissaires-priseurs proposent des estimations gratuites en dépôt.",
      },
    },
    {
      "@type": "Question",
      name: "Les sacs de luxe vintage valent-ils plus cher ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cela dépend du modèle. Les Chanel vintage (avant 1990) peuvent valoir 20 à 50 % de plus qu'un modèle récent équivalent, car Chanel a fortement augmenté ses prix depuis 2020. Les Hermès vintage avec la bonne lettre-date sont très recherchés. En revanche, les sacs Louis Vuitton vintage en mauvais état se revendent mal : la marque est très présente sur le marché de l'occasion.",
      },
    },
  ],
};

const PRICE_RANGES = [
  { brand: "Hermès Birkin / Kelly", range: "6 000 € – 40 000 €+", note: "Birkin 25 Togo : 8 000–15 000 €. Crocodile ou couleur rare : jusqu'à 80 000 €" },
  { brand: "Chanel Classic Flap", range: "2 500 € – 8 000 €", note: "Vintage (avant 1990) : prime de 20-50 %. Double rabat en cuir matelassé" },
  { brand: "Chanel 2.55", range: "3 000 € – 7 000 €", note: "Edition originale 1955 : très recherchée" },
  { brand: "Louis Vuitton Speedy / Neverfull", range: "300 € – 1 200 €", note: "Dépend de l'état ; modèles édition limitée 2× plus chers" },
  { brand: "Dior Lady Dior", range: "1 200 € – 4 500 €", note: "Cannage et taille M les plus demandés" },
  { brand: "Gucci GG Marmont", range: "500 € – 1 800 €", note: "Matelassé chevron, couleurs neutres mieux valorisées" },
  { brand: "Celine / Saint Laurent", range: "400 € – 2 000 €", note: "Variabilité forte selon les changements de direction artistique" },
];

const CRITERIA = [
  { num: "01", title: "La marque et le modèle iconique", body: "Hermès, Chanel et Louis Vuitton représentent à eux trois plus de 60 % du marché de la revente de luxe. Un modèle iconique (Birkin, Flap, Speedy) se revend toujours mieux qu'une pièce d'une collection secondaire, même plus récente." },
  { num: "02", title: "L'état général et le cuir", body: "Le cuir est le premier critère d'évaluation. Un coin oxydé, des éraflures sur la quincaillerie ou un intérieur taché peuvent faire baisser le prix de 30 à 50 %. Le vernis craquelé sur les coins est presque impossible à réparer sans dévaluer davantage." },
  { num: "03", title: "Les accessoires et le full set", body: "Dust bag, boîte d'origine, facture, clochette et clés pour les Hermès : chaque élément compte. Un « full set » en excellent état peut se négocier 15 à 30 % au-dessus d'un sac seul." },
  { num: "04", title: "L'année et la couleur", body: "Certaines couleurs se revendent systématiquement mieux : le noir, le caramel et l'étoupe pour Hermès, le beige clair et le bordeaux pour Chanel. Les couleurs de saison très marquées (vert fluo, collection spéciale) sont plus difficiles à écouler sauf pour les pièces rares." },
  { num: "05", title: "L'authenticité vérifiable", body: "Une puce NFC (Chanel depuis 2021), un numéro de série gravé ou brodé, et la concordance avec la base de données de la marque sont essentiels. Un sac sans preuve d'authenticité subit une décote de 20 à 40 % en revente." },
];

export default function SacLuxePage() {
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
          <span className="text-text-tertiary">Sac de luxe</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Comment estimer un sac de luxe ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Hermès, Chanel, Louis Vuitton : les sacs de luxe sont parmi les objets de seconde main les mieux valorisés.
            Voici comment évaluer le vôtre avant de le vendre.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Un sac de luxe en excellent état avec ses accessoires d'origine vaut entre 30 % et 200 % de son prix neuf selon la marque.
            Les Hermès sont les mieux valorisés, souvent au-dessus du prix boutique. L'état du cuir est le premier critère : un coin abîmé peut diviser le prix par deux.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez votre sac en 10 secondes</p>
            <p className="text-text-muted text-sm">
              Photographiez votre sac sous plusieurs angles, Pépite analyse la marque, le modèle et l'état pour vous donner une fourchette de prix.
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
          <h2 className="font-serif text-2xl text-text-primary mb-2">Prix de revente par marque</h2>
          <p className="text-text-muted text-sm mb-6">
            Fourchettes indicatives pour un sac en bon état, sans accessoires d'origine, vendu entre particuliers en 2026.
          </p>
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
          <p className="font-serif text-2xl text-text-primary mb-3">Votre sac vaut peut-être plus que vous ne le pensez</p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Scannez-le avec Pépite, obtenez une estimation en quelques secondes, puis mettez-le en vente directement dans l'app.
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
