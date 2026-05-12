export interface AnalysisResult {
  unsellable?: boolean;
  humourMessage?: string;
  name: string;
  category: string;
  era: string;
  origin: string;
  condition: 'Excellent' | 'Bon' | 'Correct' | 'À restaurer';
  conditionNote: string;
  story: string;
  priceMin: number;
  priceMax: number;
  priceSuggested: number;
  sellingTips: string[];
  clarifyingQuestions?: string[];
}

export interface CapturedPhoto {
  uri: string;
  base64: string;
}

// ─── Scanner stack ───────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Review: { photos: CapturedPhoto[] };
  Loading: { photos: CapturedPhoto[]; memory?: string };
  Result: { analysis: AnalysisResult; photos: CapturedPhoto[]; memory?: string };
  Sell: { analysis: AnalysisResult; photos: CapturedPhoto[]; preUploadedPhotoUrls?: string[] };
};

// ─── Marketplace stack ───────────────────────────────────────────────────────

export type MarketStackParamList = {
  Market: undefined;
  Listing: { id: string };
  Chat: { listing_id: string; receiver_id: string; listing_name: string };
  Inbox: undefined;
};

// ─── Browse stack ─────────────────────────────────────────────────────────────

export type BrowseStackParamList = {
  Browse: undefined;
  BrowseListings: { category: string };
  Listing: { id: string };
};

// ─── Profile stack ───────────────────────────────────────────────────────────

export type ProfileStackParamList = {
  Profile: { initialTab?: 'listings' | 'favorites' | 'purchases' } | undefined;
  EditProfile: undefined;
  EditListing: { id: string };
  Listing: { id: string };
  Chat: { listing_id: string; receiver_id: string; listing_name: string };
  Wallet: undefined;
  Settings: undefined;
  Legal: undefined;
  PrivacyPolicy: undefined;
  Admin: undefined;
  Alerts: undefined;
  Purchases: undefined;
  StripeOnboarding: undefined;
};

// ─── Messages stack ───────────────────────────────────────────────────────────

export type MessagesStackParamList = {
  Inbox: undefined;
  Chat: { listing_id: string; receiver_id: string; listing_name: string };
  Listing: { id: string };
};

// ─── Bottom tabs ─────────────────────────────────────────────────────────────

export type TabParamList = {
  Scanner: undefined;
  Parcourir: undefined;
  Marché: undefined;
  Messages: undefined;
  Profil: undefined;
};
