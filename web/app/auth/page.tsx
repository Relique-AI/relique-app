import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthForm } from "./AuthForm";

export const metadata = {
  title: "Connexion — Pépite",
};

export default function AuthPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Suspense>
          <AuthForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
