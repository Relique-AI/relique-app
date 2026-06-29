import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comment fonctionne Pépite ? Scanne, Estime, Vends",
  description:
    "Photographiez un objet, l'IA l'estime en quelques secondes. Publiez, vendez, expédiez — tout depuis l'application Pépite. Gratuit, sans abonnement.",
  openGraph: {
    title: "Comment fonctionne Pépite ?",
    description:
      "Photographiez un objet, l'IA l'estime en quelques secondes. Publiez, vendez, expédiez.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment l'IA de Pépite estime-t-elle la valeur d'un objet ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'IA de Pépite analyse les photos de l'objet pour identifier sa catégorie, son style, son époque probable, son état et son origine. Elle croise ces informations avec les prix réels du marché de l'occasion pour proposer une fourchette de prix et un prix de vente suggéré. L'analyse prend moins de 15 secondes.",
      },
    },
    {
      "@type": "Question",
      name: "Pépite est-il gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, l'application Pépite est gratuite à télécharger et à utiliser. Une commission est prélevée uniquement lors d'une vente réalisée sur la plateforme. Il n'y a pas d'abonnement ni de frais de publication.",
      },
    },
    {
      "@type": "Question",
      name: "Comment se passe l'expédition d'un objet vendu ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une fois la vente confirmée, Pépite génère automatiquement une étiquette d'expédition prépayée directement dans l'application. Le vendeur imprime l'étiquette, dépose le colis en point relais, et le suivi est assuré pour l'acheteur et le vendeur.",
      },
    },
    {
      "@type": "Question",
      name: "L'acheteur est-il protégé en cas de problème ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Les fonds sont conservés pendant 7 jours après la réception de l'objet. Si l'acheteur constate un problème (objet non conforme, dommage), il peut ouvrir un litige depuis l'application dans ce délai. En cas de litige, l'équipe Pépite intervient pour trouver une résolution équitable.",
      },
    },
    {
      "@type": "Question",
      name: "Quels types d'objets peut-on vendre sur Pépite ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pépite est spécialisé dans les objets anciens, vintage et de seconde main : meubles, bijoux, montres, sacs, vaisselle, tableaux, livres anciens, objets de décoration, argenterie. L'IA est entraînée sur ces catégories pour donner les estimations les plus précises possible.",
      },
    },
  ],
};

const STEPS = [
  {
    num: "01",
    icon: "📸",
    title: "Scanne",
    subtitle: "Photographiez l'objet depuis l'app",
    details: [
      "Ouvrez Pépite et appuyez sur le bouton de scan.",
      "Prenez 1 à 5 photos sous différents angles — face, profil, détail significatif.",
      "Pas besoin d'être photographe : une bonne lumière naturelle suffit.",
      "L'IA analyse mieux avec des photos nettes et un fond neutre.",
    ],
  },
  {
    num: "02",
    icon: "✦",
    title: "Estime",
    subtitle: "L'IA analyse en moins de 15 secondes",
    details: [
      "L'IA identifie la catégorie, le style, l'époque et l'état de l'objet.",
      "Elle croise avec les prix réels du marché de l'occasion en temps réel.",
      "Vous recevez une fourchette de prix (min / max) et un prix de vente suggéré.",
      "Des conseils personnalisés vous expliquent comment valoriser l'objet.",
    ],
  },
  {
    num: "03",
    icon: "🚀",
    title: "Vends",
    subtitle: "Publiez, encaissez, expédiez",
    details: [
      "Validez l'annonce générée automatiquement (titre, description, prix).",
      "L'objet est visible sur le marché Pépite en quelques secondes.",
      "L'acheteur paye en ligne, les fonds sont sécurisés pendant 7 jours.",
      "Générez l'étiquette d'expédition directement depuis l'app, déposez en point relais.",
    ],
  },
];

const FEATURES = [
  {
    icon: "🔍",
    title: "Estimation IA en temps réel",
    body: "Pas de base de données figée. L'IA analyse les prix du marché en continu pour donner des estimations actualisées, pas des fourchettes théoriques.",
  },
  {
    icon: "🛡️",
    title: "Protection acheteur 7 jours",
    body: "Les fonds restent bloqués pendant 7 jours après réception. Si un problème survient, l'acheteur peut ouvrir un litige. Le vendeur est payé une fois la réception confirmée.",
  },
  {
    icon: "📦",
    title: "Étiquette d'expédition intégrée",
    body: "Plus besoin de chercher un transporteur. Pépite génère une étiquette prépayée dans l'app. Déposez votre colis en point relais, le suivi est automatique.",
  },
  {
    icon: "💬",
    title: "Messagerie intégrée",
    body: "Acheteurs et vendeurs communiquent directement dans l'app. Les offres, contre-offres et confirmations se font dans le même fil de conversation.",
  },
  {
    icon: "📊",
    title: "Conseils de vente personnalisés",
    body: "L'IA ne se contente pas d'estimer : elle vous dit comment présenter l'objet, quels détails photographier, et quels arguments mettre en avant dans la description.",
  },
  {
    icon: "🆓",
    title: "Gratuit, sans abonnement",
    body: "L'app est gratuite. Une commission est prélevée uniquement sur les ventes réalisées. Aucun frais pour publier, aucun abonnement mensuel.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,184,46,0.08),transparent)]" />
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center relative">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-6">Comment ça marche</p>
            <h1 className="font-serif text-4xl md:text-6xl text-text-primary leading-tight mb-6">
              Scanne. Estime. Vends.
            </h1>
            <p className="text-text-muted text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Pépite transforme n'importe quel objet ancien en annonce prête à vendre en moins de 30 secondes.
              L'IA estime, vous validez, l'acheteur paye.
            </p>
            <Link
              href="/telecharger"
              className="inline-block bg-primary text-background font-semibold px-8 py-3.5 rounded-full hover:bg-primary-dim transition-colors"
            >
              Télécharger l'app gratuitement
            </Link>
          </div>
        </section>

        {/* Les 3 étapes en détail */}
        <section className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h2 className="font-serif text-3xl text-text-primary text-center mb-14">
            Les 3 étapes en détail
          </h2>
          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-surface border border-border rounded-2xl p-7 relative overflow-hidden">
                <div className="absolute top-4 right-6 font-serif text-6xl text-text-muted/8 leading-none select-none">
                  {step.num}
                </div>
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-4xl">{step.icon}</span>
                  <div>
                    <p className="font-serif text-2xl text-text-primary leading-none">{step.title}</p>
                    <p className="text-text-muted text-sm mt-1">{step.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-text-muted">
                      <span className="text-primary font-bold leading-5 flex-shrink-0">→</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Ce qui est inclus */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
            <h2 className="font-serif text-3xl text-text-primary text-center mb-4">
              Tout ce dont vous avez besoin, dans une seule app
            </h2>
            <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
              Estimation, publication, paiement sécurisé, expédition, messagerie. Rien à ajouter.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-background border border-border rounded-xl p-5">
                  <span className="text-2xl block mb-3">{f.icon}</span>
                  <p className="font-semibold text-text-primary mb-2 text-sm">{f.title}</p>
                  <p className="text-text-muted text-sm leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h2 className="font-serif text-3xl text-text-primary mb-8">Questions fréquentes</h2>
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

        {/* Lien vers les guides */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-serif text-xl text-text-primary mb-1">Vous ne savez pas ce que vaut votre objet ?</p>
              <p className="text-text-muted text-sm">Nos guides d'estimation vous donnent des fourchettes de prix par catégorie.</p>
            </div>
            <Link
              href="/estimer"
              className="flex-shrink-0 border border-border-strong text-text-primary font-semibold px-6 py-3 rounded-full hover:border-primary/40 transition-colors text-sm"
            >
              Voir les guides →
            </Link>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <div className="text-primary text-4xl mb-6">✦</div>
            <h2 className="font-serif text-4xl md:text-5xl text-text-primary mb-4">
              Prêt à vendre votre première pépite ?
            </h2>
            <p className="text-text-muted mb-10 text-lg">Disponible sur iOS et Android. Gratuit, sans abonnement.</p>
            <Link
              href="/telecharger"
              className="inline-block bg-primary text-background font-semibold px-10 py-4 rounded-full hover:bg-primary-dim transition-colors text-base"
            >
              Télécharger Pépite
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
