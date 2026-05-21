import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <nav className="text-sm text-text-muted mb-8 flex gap-4 flex-wrap">
          <Link href="/legal/cgu" className="hover:text-primary transition-colors">CGU</Link>
          <Link href="/legal/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
          <Link href="/legal/mentions" className="hover:text-primary transition-colors">Mentions légales</Link>
        </nav>
        <article className="prose-legal">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
