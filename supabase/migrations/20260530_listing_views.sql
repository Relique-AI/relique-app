-- Table de suivi des consultations d'annonces
CREATE TABLE IF NOT EXISTS listing_views (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  category   text,
  viewed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_views_user_viewed_idx  ON listing_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS listing_views_user_category_idx ON listing_views(user_id, category);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_views_insert" ON listing_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listing_views_select" ON listing_views
  FOR SELECT USING (auth.uid() = user_id);

-- Retourne les IDs d'annonces ordonnés par pertinence personnalisée.
-- Utilise auth.uid() en interne : p_user_id n'est pas utilisé (conservé pour compatibilité).
CREATE OR REPLACE FUNCTION get_personalized_listings(
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
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
  ORDER BY
    CASE WHEN EXISTS (
      SELECT 1 FROM preferred_cats pc
      WHERE l.category ILIKE '%' || pc.category || '%'
    ) THEN 0 ELSE 1 END ASC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;
