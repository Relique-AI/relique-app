-- Système de parrainage : crédits d'achats à -50%
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_credits INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_first_purchase_done BOOLEAN NOT NULL DEFAULT FALSE;
