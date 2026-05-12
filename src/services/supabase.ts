import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// expo-secure-store has a 2048-byte value limit — split large values into chunks
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_n`);
    if (!countStr) return SecureStore.getItemAsync(key);
    const n = parseInt(countStr, 10);
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (chunk === null) return null;
      parts.push(chunk);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const n = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_n`, String(n));
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
  },
  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}_n`);
    if (countStr) {
      await SecureStore.deleteItemAsync(`${key}_n`);
      for (let i = 0; i < parseInt(countStr, 10); i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Types DB ───────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  era: string;
  origin: string;
  condition: string;
  condition_note: string;
  story: string;
  price_min: number;
  price_max: number;
  price_suggested: number;
  price_final: number;
  selling_tips: string[];
  images: string[];
  status: 'active' | 'sold' | 'deleted';
  location: string | null;
  shipping_options: string[] | null;
  shipping_price: number | null;
  created_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  type: 'text' | 'offer' | 'image';
  offer_id: string | null;
}

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  parent_offer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface SavedEstimation {
  id: string;
  user_id: string;
  analysis: import('../types').AnalysisResult;
  photo_urls: string[];
  created_at: string;
}
