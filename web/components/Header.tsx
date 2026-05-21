import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-strong bg-surface-deep/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-primary text-xl leading-none">✦</span>
          <span className="font-serif text-xl font-medium text-text-primary tracking-tight">
            Pépite
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/market" className="text-sm text-text-muted hover:text-text-primary transition-colors">
            Le Marché
          </Link>
        </nav>

        <Link
          href="/telecharger"
          className="text-sm font-semibold bg-primary text-background px-4 py-2 rounded-full hover:bg-primary-dim transition-colors"
        >
          Télécharger l'app
        </Link>
      </div>
    </header>
  );
}
