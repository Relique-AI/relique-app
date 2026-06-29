import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment vendre ses affaires en ligne ? Guide pratique 2026",
  description:
    "Conseils concrets pour vendre vos objets en ligne : choisir la bonne plateforme, photographier, fixer son prix et éviter les pièges. Estimez d'abord pour ne pas brader.",
  openGraph: {
    title: "Comment vendre ses affaires en ligne ?",
    description:
      "Choisir la bonne plateforme, photographier, fixer son prix et éviter les pièges de la vente en ligne.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quelle est la meilleure plateforme pour vendre ses affaires en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cela dépend du type d'objet. Pour les vêtements et accessoires : plateformes dédiées à la mode. Pour les objets anciens, déco et meubles : Pépite (estimation IA intégrée), brocantes en ligne ou sites généralistes. Pour l'électronique : sites spécialisés en reconditionnement. Pour les pièces de valeur (art, bijoux, mobilier de qualité) : vente aux enchères en ligne ou Pépite. La règle : choisissez la plateforme où votre acheteur cible se trouve déjà.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fixer le bon prix pour vendre ses affaires ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Commencez par estimer la valeur marchande réelle — une application comme Pépite vous donne une fourchette en quelques secondes pour les objets anciens ou déco. Ensuite : regardez le prix des annonces similaires déjà vendues (pas seulement publiées), déduisez les frais de plateforme (5 à 15 %), et laissez une marge de négociation de 10 à 15 %. Évitez de sous-estimer : un prix trop bas signale un objet douteux aux acheteurs expérimentés.",
      },
    },
    {
      "@type": "Question",
      name: "Comment faire de bonnes photos pour vendre en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lumière naturelle, fond neutre (blanc ou bois clair), objet propre et dépoussiéré. Photographiez sous 4 angles minimum : face, profil, détail, et marque/poinçon si pertinent. Évitez le flash qui crée des reflets. Un smartphone récent avec mode portrait ou macro suffit pour la quasi-totalité des objets. Pour les meubles : vidéo courte de 10–15 secondes en faisant le tour de la pièce.",
      },
    },
    {
      "@type": "Question",
      name: "Vente en ligne : faut-il déclarer ses revenus ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En France, la vente d'objets personnels (mobilier, vêtements, électroménager) est exonérée d'impôt pour un usage personnel. Cependant, si vos revenus dépassent 3 000 € par an et concernent plus de 20 transactions, la plateforme transmet vos informations aux impôts. La vente régulière à des fins lucratives peut être requalifiée en activité commerciale. Les métaux précieux (or, argent) ont un régime fiscal spécifique avec taxe sur les métaux précieux (11,5 %).",
      },
    },
    {
      "@type": "Question",
      name: "Comment éviter les arnaques lors d'une vente en ligne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Privilégiez les plateformes avec protection acheteur/vendeur intégrée. En vente directe : préférez PayPal Biens & Services (pas virement) pour les envois, ou la remise en main propre avec paiement en espèces ou virement immédiat. Méfiez-vous des chèques (délai d'encaissement), des offres au-dessus du prix demandé avec demande de remboursement partiel, et des acheteurs pressés qui ne veulent pas passer par la messagerie de la plateforme.",
      },
    },
  ],
};

const TIPS = [
  {
    num: "01",
    title: "Estimez avant de publier",
    body: "C'est l'erreur la plus fréquente : publier sans savoir la valeur réelle. Un objet sous-pricé part vite, mais vous perdez de l'argent. Un objet sur-pricé ne se vend jamais. Utilisez Pépite pour les objets anciens et de déco, regardez les ventes terminées (pas les annonces actives) pour les produits courants.",
  },
  {
    num: "02",
    title: "La photo, c'est 80 % de la vente",
    body: "Les acheteurs en ligne achètent une photo avant d'acheter un objet. Lumière naturelle (fenêtre, pas soleil direct), fond propre et neutre, objet nettoyé. Pas de flash. Minimum 4 photos. Pour les défauts : photographiez-les et signalez-les — ça rassure l'acheteur et prévient les litiges.",
  },
  {
    num: "03",
    title: "Rédigez une description factuelle",
    body: "Dimensions exactes, matière, marque, état précis (traces d'usage, manques), origine si connue (héritage, achat chez X). Évitez les superlatifs (\"magnifique\", \"rarissime\") : ils sonnent faux. Dites plutôt \"petite égrenure sur le coin supérieur droit\" — la précision inspire confiance.",
  },
  {
    num: "04",
    title: "Choisissez le bon canal selon l'objet",
    body: "Vêtements et accessoires : plateformes mode. Objets anciens, meubles, déco : Pépite ou brocante en ligne. Électronique : sites de reconditionnement. Livres : agrégateurs de librairies. Ne mettez pas tout au même endroit : le bon acheteur ne cherche pas partout.",
  },
  {
    num: "05",
    title: "Gérez les frais et la fiscalité",
    body: "Frais de plateforme : 5–15 %. Frais d'expédition : pesez et mesurez avant de calculer. Fiscalité : déclaration obligatoire au-delà de 3 000 €/an ou 20 transactions (la plateforme transmet aux impôts automatiquement). Les métaux précieux (or, argent) : taxe spécifique à 11,5 %.",
  },
];

const CHECKLIST = [
  "Objet nettoyé et légèrement mis en valeur",
  "Photos : 4 angles minimum, lumière naturelle",
  "Prix fixé à partir d'une estimation réelle (pas au pif)",
  "Description avec dimensions, matière, état, origine",
  "Défauts signalés et photographiés",
  "Mode d'expédition et délai précisés",
  "Paiement sécurisé (pas de virement bancaire pour les inconnus)",
];

export default function VendreEnLignePage() {
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
          <span className="text-text-tertiary">Vendre en ligne</span>
        </nav>

        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary leading-tight mb-6">
            Comment vendre ses affaires en ligne ?
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Vendre en ligne n'est pas juste publier une photo et attendre. C'est fixer le bon prix, choisir la bonne plateforme,
            rédiger une description qui rassure et sécuriser la transaction. Ce guide vous donne les bases pour ne pas brader.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">En bref</p>
          <p className="text-text-muted text-sm leading-relaxed">
            L'erreur la plus fréquente : fixer son prix sans savoir ce que l'objet vaut vraiment.
            Estimez d'abord, publiez ensuite. Pour les objets anciens et déco, Pépite vous donne une fourchette en quelques secondes.
            La photo et la description font 80 % du travail.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-serif text-lg text-text-primary mb-1">Estimez avant de publier</p>
            <p className="text-text-muted text-sm">
              Photographiez votre objet, Pépite analyse et vous donne une fourchette de prix réaliste en 10 secondes. Puis mettez-le en vente directement dans l'app.
            </p>
          </div>
          <Link
            href="/telecharger"
            className="flex-shrink-0 bg-primary text-background font-semibold px-5 py-3 rounded-full text-sm hover:bg-primary-dim transition-colors"
          >
            Essayer Pépite →
          </Link>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl text-text-primary mb-6">Les 5 règles pour bien vendre en ligne</h2>
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
          <h2 className="font-serif text-2xl text-text-primary mb-4">Checklist avant de publier</h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            {CHECKLIST.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-primary font-bold leading-5 flex-shrink-0">✓</span>
                <span className="text-text-muted text-sm">{item}</span>
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
          <p className="font-serif text-2xl text-text-primary mb-3">
            Scanne. Estime. Vends.
          </p>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Pépite estime vos objets en quelques secondes et vous permet de les mettre en vente directement. Sans brader, sans approximation.
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
