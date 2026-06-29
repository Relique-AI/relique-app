import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Combien vaut un meuble ancien ?",
  description:
    "Fourchettes de prix, critères d'estimation et conseils pour évaluer la valeur d'un meuble ancien avant de le vendre. Estimation gratuite en 10 secondes avec Pépite.",
  openGraph: {
    title: "Combien vaut un meuble ancien ?",
    description:
      "Fourchettes de prix, critères d'estimation et conseils pour évaluer la valeur d'un meuble ancien avant de le vendre.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment savoir si un meuble est vraiment ancien ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Un meuble ancien a généralement plus de 100 ans. Examinez les assemblages : les véritables meubles anciens sont fabriqués à la main avec des queues d'aronde irrégulières, des clous forgés et des bois qui varient légèrement. Les vis à tête fendue et les traces d'outil à la main sont de bons indicateurs. L'arrière et le dessous du meuble, moins travaillés, révèlent souvent l'époque de fabrication.",
      },
    },
    {
      "@type": "Question",
      name: "Quels meubles anciens valent le plus cher ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les meubles les plus recherchés sont les commodes et secrétaires Louis XV et Louis XVI en marqueterie, les meubles Art Nouveau signés (Gallé, Majorelle), les meubles de maître estampillés et les pièces Art Déco en matériaux nobles. La signature d'un ébéniste reconnu peut multiplier la valeur par 5 à 10.",
      },
    },
    {
      "@type": "Question",
      name: "Où faire estimer un meuble ancien gratuitement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vous pouvez faire estimer un meuble ancien gratuitement via l'application Pépite : photographiez le meuble sous plusieurs angles, l'IA analyse le style, l'époque et l'état pour vous donner une fourchette de prix en quelques secondes. Pour une expertise certifiée (vente aux enchères, succession), un commissaire-priseur peut intervenir.",
      },
    },
    {
      "@type": "Question",
      name: "Comment vendre un meuble ancien au meilleur prix ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le meilleur prix s'obtient en connaissant la valeur exacte avant de fixer un prix, en photographiant sous une bonne lumière et en décrivant précisément l'état et l'époque. Évitez de sous-estimer : un meuble mal pricé part vite, mais vous laissez de l'argent sur la table. Utilisez une estimation IA pour partir du bon prix, puis négociez légèrement.",
      },
    },
    {
      "@type": "Question",
      name: "L'état du meuble ancien influe-t-il beaucoup sur le prix ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, considérablement. Un meuble en excellent état peut valoir 2 à 3 fois plus qu'un exemplaire identique très abîmé. Paradoxalement, une restauration amateur peut faire chuter la valeur : les collectionneurs préfèrent souvent une patine d'origine légèrement usée à un recollage maladroit ou une peinture recouvrant le bois d'origine.",
      },
    },
  ],
};

const PRICE_RANGES = [
  {
    style: "Louis XV / Louis XVI",
    period: "XVIIIe siècle",
    range: "500 € – 8 000 €",
    note: "Marqueterie et bronzes dorés font monter le prix",
  },
  {
    style: "Art Nouveau",
    period: "1890 – 1910",
    range: "300 € – 5 000 €",
    note: "Les pièces signées Gallé ou Majorelle dépassent souvent 3 000 €",
  },
  {
    style: "Art Déco",
    period: "1920 – 1940",
    range: "200 € – 4 000 €",
    note: "Laque, galuchat et palissandre sont très cotés",
  },
  {
    style: "Napoléon III",
    period: "XIXe siècle",
    range: "150 € – 2 500 €",
    note: "Très abondant, le marché est sélectif sur la qualité",
  },
  {
    style: "Rustique / Régional",
    period: "XVIIIe – XIXe siècle",
    range: "80 € – 1 200 €",
    note: "Les buffets bretons et armoires normandes restent populaires",
  },
  {
    style: "Mid-Century Modern",
    period: "1950 – 1970",
    range: "200 € – 3 000 €",
    note: "Tendance forte : Scandinave et Knoll très recherchés",
  },
];

export default function MeubleAncienPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">

        {/* Breadcrumb */}
        <nav className="text-xs text-text-muted mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-text-primary transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/estimer" className="hover:text-text-primary transition-colors">Estimer</Link>
          <span>›</span>
          <span className="text-text-tertiary">Meuble ancien</span>
        </nav>

        {/* Hero */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Combien vaut un meuble ancien ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Une armoire normande, une commode Louis XV, un secrétaire Napoléon III... les greniers et brocantes
            regorgent de meubles anciens dont la valeur est souvent mal connue. Voici comment l'évaluer.
          </p>
        </div>

        {/* CTA app */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez en 10 secondes</p>
            <p className="text-text-muted text-sm">
              Photographiez le meuble, Pépite analyse le style, l'époque et l'état pour vous donner une fourchette de prix instantanée.
            </p>
          </div>
          <Link
            href="/telecharger"
            className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors"
          >
            Estimer avec Pépite →
          </Link>
        </div>

        {/* Section 1 : Facteurs */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">
            Les 5 critères qui déterminent la valeur
          </h2>
          <div className="space-y-4">
            {[
              {
                num: "01",
                title: "L'époque de fabrication",
                body: "Un meuble du XVIIIe siècle vaut en général bien plus qu'un meuble de style XVIIIe fabriqué au XIXe. La date réelle de fabrication, difficile à établir sans expertise, peut faire varier le prix du simple au quintuple.",
              },
              {
                num: "02",
                title: "La signature ou l'estampille",
                body: "Les ébénistes du roi, maîtres de la corporation, apposaient une estampille sur leurs meubles. Une pièce signée Jacob, Riesener ou Oeben peut dépasser 10 000 €, quand un meuble non signé de même époque plafonne à 1 500 €.",
              },
              {
                num: "03",
                title: "L'état de conservation",
                body: "La patine d'origine, même légèrement usée, est un atout. Une restauration ancienne bien menée n'est pas pénalisante. En revanche, une peinture posée sur le bois, un vernis brillant récent ou des éléments de remplacement dévalorisent fortement le meuble.",
              },
              {
                num: "04",
                title: "Les matériaux et la technique",
                body: "La marqueterie, les bronzes dorés, le galuchat, l'écaille de tortue ou le laque sont des marqueurs de qualité. Un meuble en bois massif d'essence noble (acajou, palissandre, noyer) vaut plus qu'un équivalent en bois commun recouvert de placage.",
              },
              {
                num: "05",
                title: "La rareté et la demande du marché",
                body: "Les tendances jouent. Le Mid-Century Modern (années 50-70) est en forte hausse depuis dix ans. Les meubles rustiques massifs sont moins courus qu'avant. La rareté d'un modèle ou d'un style dans une région donnée influe aussi sur le prix final.",
              },
            ].map((item) => (
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

        {/* Section 2 : Fourchettes de prix */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-2">
            Fourchettes de prix par style
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Ces fourchettes sont indicatives pour un meuble en bon état, sans signature particulière, vendu entre particuliers.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Style</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Époque</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Fourchette</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-primary hidden md:table-cell">À savoir</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_RANGES.map((row, i) => (
                  <tr key={row.style} className={i < PRICE_RANGES.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.style}</td>
                    <td className="px-4 py-3 text-text-muted">{row.period}</td>
                    <td className="px-4 py-3 text-primary font-semibold">{row.range}</td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3 : FAQ */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((item) => (
              <details
                key={item.name}
                className="group bg-surface border border-border rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-text-primary text-sm">
                  {item.name}
                  <span className="text-primary text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-text-muted text-sm leading-relaxed">
                  {item.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-primary/8 border border-primary/20 rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl text-text-primary mb-3">
            Votre meuble vaut peut-être plus que vous ne le pensez
          </p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Scannez-le avec Pépite, obtenez une estimation IA en quelques secondes, puis mettez-le en vente directement dans l'app.
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
