import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Télécharger Pépite — L'app qui estime tes objets",
  description: "Télécharge l'app Pépite sur iOS et Android. Photographie un objet, notre IA l'estime en secondes. Publie, vends, expédie.",
};

// TODO: replace with actual store links when published
const IOS_URL = "#";
const ANDROID_URL = "#";

const FEATURES = [
  {
    icon: "📸",
    title: "Photo → Estimation en 3 secondes",
    desc: "Pointe ton appareil photo vers n'importe quel objet. L'IA identifie, estime et rédige la fiche de vente à ta place.",
  },
  {
    icon: "💰",
    title: "Prix du marché en temps réel",
    desc: "Notre IA analyse des milliers de transactions récentes sur Vinted, eBay, Leboncoin et BackMarket pour te donner le bon prix.",
  },
  {
    icon: "🚀",
    title: "Publie en un tap",
    desc: "Photos, titre, description, prix — tout est prêt. Confirme et ton annonce est en ligne dans Le Marché en quelques secondes.",
  },
  {
    icon: "📦",
    title: "Expédition intégrée",
    desc: "Génère ton étiquette Colissimo ou point relais directement depuis l'app. Pas besoin de quitter Pépite.",
  },
  {
    icon: "💬",
    title: "Chat acheteur-vendeur",
    desc: "Négocie, pose des questions, conviens d'une remise en main propre. Tout dans l'app, en toute sécurité.",
  },
  {
    icon: "🛡️",
    title: "Paiement sécurisé",
    desc: "Paiement en ligne via Stripe. Protection acheteur pendant 7 jours. Les fonds sont libérés uniquement à la réception.",
  },
];

const STEPS = [
  { number: "01", title: "Photographie", desc: "Prends 1 à 5 photos de ton objet depuis l'app. Pas besoin d'être photographe." },
  { number: "02", title: "L'IA estime", desc: "En quelques secondes, Pépite identifie l'objet, son état, son époque et propose un prix juste." },
  { number: "03", title: "Publie & vends", desc: "Valide l'annonce, reçois le paiement, expédie. L'argent est versé sur ton compte Stripe." },
];

const FAQS = [
  {
    q: "Pépite est-elle gratuite ?",
    a: "L'application est entièrement gratuite à télécharger. Pépite perçoit une commission de 8 % uniquement lors d'une vente réalisée (réduite à 4 % avec le programme de parrainage).",
  },
  {
    q: "Quels types d'objets puis-je vendre ?",
    a: "Tout ce qui peut se revendre légalement : meubles, bijoux, électronique, vêtements, jouets, livres, consoles, instruments de musique, objets de décoration… L'IA est entraînée sur des milliers de catégories.",
  },
  {
    q: "Comment fonctionne la protection acheteur ?",
    a: "Si l'objet reçu ne correspond pas à la description, tu disposes de 7 jours après réception pour ouvrir un litige. Pépite examine le dossier et peut ordonner un remboursement.",
  },
  {
    q: "Quand suis-je payé en tant que vendeur ?",
    a: "Le paiement est libéré 7 jours après confirmation de réception par l'acheteur (ou après expédition avec suivi). Il est viré directement sur ton compte bancaire via Stripe.",
  },
  {
    q: "L'estimation de l'IA est-elle fiable ?",
    a: "L'IA s'appuie sur des données de marché réelles et récentes. Elle est très fiable pour les objets courants. Pour les pièces rares ou de collection, elle fournit une fourchette conservatrice et conseille de consulter un expert.",
  },
];

export default function TelechargerPage() {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(245,184,46,0.15),transparent)]" />
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Texte */}
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-primary text-sm">✦</span>
                  <span className="text-primary text-xs font-semibold">Disponible sur iOS & Android</span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl text-text-primary leading-tight mb-5">
                  Vends <span className="text-primary italic">plus vite</span>,<br />
                  achète <span className="text-primary italic">mieux</span>
                </h1>
                <p className="text-text-muted text-lg leading-relaxed mb-8 max-w-md">
                  Photographie un objet, notre IA l'estime en 3 secondes. Publie, reçois le paiement, génère l'étiquette d'expédition. Tout depuis l'app.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={IOS_URL} className="group flex items-center gap-3 bg-text-primary text-background rounded-2xl px-5 py-3.5 hover:bg-white transition-colors">
                    <AppleIcon />
                    <div className="text-left">
                      <div className="text-xs leading-none mb-0.5 text-background/60">Télécharger sur</div>
                      <div className="font-semibold text-sm leading-none">App Store</div>
                    </div>
                  </a>
                  <a href={ANDROID_URL} className="group flex items-center gap-3 bg-surface border border-border-strong rounded-2xl px-5 py-3.5 hover:border-primary/40 transition-colors">
                    <AndroidIcon />
                    <div className="text-left">
                      <div className="text-xs leading-none mb-0.5 text-text-muted">Disponible sur</div>
                      <div className="font-semibold text-sm leading-none text-text-primary">Google Play</div>
                    </div>
                  </a>
                </div>
                <p className="text-xs text-text-muted mt-4">Gratuit · Sans abonnement · iOS 16+ et Android 10+</p>
              </div>

              {/* Phone mockup */}
              <div className="flex justify-center">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Comment ça marche ── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-serif text-4xl text-text-primary text-center mb-3">3 étapes, quelques secondes</h2>
          <p className="text-text-muted text-center mb-12 max-w-lg mx-auto">L'IA fait 90 % du travail. Toi tu confirmes et tu encaisses.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.number} className="relative bg-surface rounded-2xl border border-border p-6 overflow-hidden">
                <div className="absolute top-3 right-4 font-serif text-6xl text-text-muted/8 leading-none select-none">{s.number}</div>
                <div className="font-serif text-primary text-sm font-medium mb-3">{s.number}</div>
                <h3 className="font-serif text-xl text-text-primary mb-2">{s.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2 className="font-serif text-4xl text-text-primary text-center mb-3">Tout ce dont tu as besoin</h2>
            <p className="text-text-muted text-center mb-12">Une seule app pour vendre, acheter et expédier.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-background rounded-2xl border border-border p-6">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-serif text-lg text-text-primary mb-2">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "< 3 s", label: "Temps d'estimation" },
                { value: "20+", label: "Catégories d'objets" },
                { value: "8 %", label: "Commission seulement" },
                { value: "7 j", label: "Protection acheteur" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="font-serif text-4xl text-primary mb-1">{value}</div>
                  <div className="text-text-muted text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-t border-border bg-surface">
          <div className="max-w-2xl mx-auto px-6 py-20">
            <h2 className="font-serif text-4xl text-text-primary text-center mb-10">Questions fréquentes</h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group bg-background border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-text-primary font-medium text-sm select-none list-none">
                    {faq.q}
                    <span className="text-primary text-lg ml-4 flex-shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-text-muted text-sm leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="border-t border-border">
          <div className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="text-primary text-5xl mb-6">✦</div>
            <h2 className="font-serif text-4xl md:text-5xl text-text-primary mb-4">
              Prêt à vendre ta première pépite ?
            </h2>
            <p className="text-text-muted mb-10 text-lg">Gratuit, sans abonnement. Disponible sur iOS et Android.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={IOS_URL} className="flex items-center gap-3 bg-text-primary text-background rounded-2xl px-6 py-3.5 hover:bg-white transition-colors">
                <AppleIcon />
                <div className="text-left">
                  <div className="text-xs leading-none mb-0.5 text-background/60">Télécharger sur</div>
                  <div className="font-semibold text-sm leading-none">App Store</div>
                </div>
              </a>
              <a href={ANDROID_URL} className="flex items-center gap-3 bg-surface border border-border-strong rounded-2xl px-6 py-3.5 hover:border-primary/40 transition-colors">
                <AndroidIcon />
                <div className="text-left">
                  <div className="text-xs leading-none mb-0.5 text-text-muted">Disponible sur</div>
                  <div className="font-semibold text-sm leading-none text-text-primary">Google Play</div>
                </div>
              </a>
            </div>
            <p className="text-xs text-text-muted mt-6">
              Tu préfères acheter depuis le web ?{" "}
              <Link href="/market" className="text-primary hover:underline">Parcourir Le Marché →</Link>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="m3.18 23.76 10.02-5.86 2.34 2.34zM.89 1.01C.33 1.6 0 2.51 0 3.7v16.6c0 1.19.33 2.1.89 2.69l.14.13L9.89 12v-.21L1.03.88zm20.22 11.66L18 10.55V3.5l3.13 1.83a3 3 0 0 1 0 5.2zm-3.11 1.81L7.96 20.35 5.62 18l9.05-9.06z" className="text-text-primary" style={{fill:"currentColor"}}/>
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-56 h-[480px]">
      {/* Phone shell */}
      <div className="absolute inset-0 rounded-[40px] border-2 border-border-strong bg-surface-deep shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex justify-between items-center px-5 pt-3 pb-2">
          <span className="text-text-muted text-xs">9:41</span>
          <div className="flex gap-1">
            {[1,2,3].map(i=><div key={i} className="w-1 h-1 rounded-full bg-text-muted/40"/>)}
          </div>
        </div>

        {/* App content mockup */}
        <div className="px-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif text-primary text-lg">✦ Pépite</span>
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30"/>
          </div>

          {/* Camera card */}
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <div className="w-full aspect-square rounded-xl bg-surface-raised mb-3 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,184,46,0.08),transparent)]"/>
              <span className="text-4xl">📸</span>
            </div>
            <p className="text-text-muted text-xs mb-2">Photo analysée</p>
            <div className="text-primary font-serif text-base font-medium">Vase Art Déco 1930</div>
          </div>

          {/* Price estimate */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-muted">Estimation IA</span>
              <span className="text-xs text-primary">✦</span>
            </div>
            <div className="font-bold text-primary text-xl">45 – 75 €</div>
            <div className="text-xs text-text-muted mt-0.5">Prix suggéré : 60 €</div>
          </div>

          {/* Mini listings */}
          <div className="space-y-2">
            {[
              { name: "Lampe Scandinave", price: "38 €" },
              { name: "Montre Lip 1960", price: "120 €" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2 bg-surface rounded-xl border border-border p-2">
                <div className="w-9 h-9 rounded-lg bg-surface-raised flex-shrink-0 flex items-center justify-center text-sm">✦</div>
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary text-xs font-medium truncate">{item.name}</div>
                </div>
                <div className="text-primary text-xs font-bold">{item.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-surface-deep rounded-b-2xl z-10"/>

      {/* Glow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-16 bg-primary/15 rounded-full blur-2xl"/>
    </div>
  );
}
