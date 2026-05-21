import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: { default: "Pépite — Vendez vos trésors", template: "%s | Pépite" },
  description:
    "Achetez et vendez des objets de seconde main grâce à l'intelligence artificielle. Estimation instantanée, livraison intégrée.",
  openGraph: {
    siteName: "Pépite",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
