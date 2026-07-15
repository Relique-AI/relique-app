-- Segmentation du marketplace par pays (préparation lancement US).
-- Nullable comme `username` : les profils/annonces existants sont backfillés en 'FR'
-- (seul marché actif à ce jour), les nouveaux profils restent NULL jusqu'à ce que
-- le client détermine le pays depuis la locale de l'appareil (voir AuthContext.tsx).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
UPDATE profiles SET country = 'FR' WHERE country IS NULL;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS country text;
UPDATE listings SET country = 'FR' WHERE country IS NULL;

CREATE INDEX IF NOT EXISTS listings_country_idx ON listings (country);

-- get_personalized_listings doit filtrer par pays comme les autres requêtes du marketplace,
-- sinon le fil "Pour toi" mélange les annonces FR et US.
CREATE OR REPLACE FUNCTION get_personalized_listings(
  p_limit   integer DEFAULT 20,
  p_offset  integer DEFAULT 0,
  p_country text DEFAULT 'FR'
)
RETURNS TABLE (listing_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH preferred_cats AS (
    SELECT lv.category
    FROM listing_views lv
    WHERE lv.user_id = auth.uid()
      AND lv.viewed_at > now() - interval '30 days'
    GROUP BY lv.category
    ORDER BY count(*) DESC
    LIMIT 3
  )
  SELECT l.id
  FROM listings l
  WHERE l.status = 'active'
    AND l.country = p_country
  ORDER BY
    CASE WHEN EXISTS (
      SELECT 1 FROM preferred_cats pc
      WHERE l.category ILIKE '%' || pc.category || '%'
    ) THEN 0 ELSE 1 END ASC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
