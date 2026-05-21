import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Listing = {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  era: string;
  origin: string;
  condition: "Excellent" | "Bon" | "Correct" | "À restaurer";
  condition_note: string | null;
  story: string | null;
  price_min: number;
  price_max: number;
  price_final: number;
  images: string[];
  status: "active" | "sold" | "draft";
  created_at: string;
  location: string | null;
  profiles?: { username: string | null; avatar_url: string | null } | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { username: string | null } | null;
  listing: { name: string } | null;
};

export const CATEGORIES = [
  "Mobilier", "Arts décoratifs", "Bijoux", "Argenterie",
  "Céramique & Porcelaine", "Horlogerie", "Tableaux & Gravures",
  "Livres & BD", "Jouets & Jeux", "Vintage & Mode", "Appareils photo",
  "Vinyles & Musique", "Informatique & Électronique", "Téléphones & Tablettes",
  "Consoles & Jeux vidéo", "Électroménager", "Sport & Loisirs",
  "Instruments de musique", "Véhicules & Accessoires", "Divers",
];

export const CONDITION_COLORS: Record<string, string> = {
  "Excellent": "#B5D479",
  "Bon": "#F5B82E",
  "Correct": "#E0D4BA",
  "À restaurer": "#E08766",
};
