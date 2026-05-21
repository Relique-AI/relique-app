import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VendreForm } from "./VendreForm";

export const metadata = {
  title: "Déposer une annonce — Pépite",
};

export default function VendrePage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-text-primary mb-1">Déposer une annonce</h1>
          <p className="text-text-muted text-sm">Notre IA analyse tes photos et pré-remplit la fiche en quelques secondes.</p>
        </div>
        <VendreForm />
      </main>
      <Footer />
    </>
  );
}
