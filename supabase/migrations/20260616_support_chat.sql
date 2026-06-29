-- Allow support conversations that have no associated listing
ALTER TABLE messages ALTER COLUMN listing_id DROP NOT NULL;
