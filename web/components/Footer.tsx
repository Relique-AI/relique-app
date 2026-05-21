import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <span className="text-primary">✦</span>
          <span className="font-serif text-text-secondary">Pépite</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/mentions-legales" className="hover:text-text-primary transition-colors">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-text-primary transition-colors">
            Confidentialité
          </Link>
          <Link href="/telecharger" className="hover:text-text-primary transition-colors">
            Télécharger l'app
          </Link>
        </div>
        <span>© {new Date().getFullYear()} Pépite</span>
      </div>
    </footer>
  );
}
