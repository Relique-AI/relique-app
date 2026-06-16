import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  let listing_id: string, category: string, era: string, origin: string, seller_id: string;
  try {
    ({ listing_id, category, era, origin, seller_id } = await req.json());
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  if (!listing_id || !category || !seller_id) {
    return json({ error: 'listing_id, category et seller_id sont requis' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Priorité 1 : même catégorie + même époque
  const { data: primary } = await admin
    .from('listings')
    .select('*')
    .eq('category', category)
    .eq('era', era)
    .eq('status', 'active')
    .neq('id', listing_id)
    .neq('seller_id', seller_id)
    .order('created_at', { ascending: false })
    .limit(10);

  const results = primary ?? [];

  // Priorité 2 : même catégorie seulement si on n'a pas 10 résultats
  if (results.length < 10) {
    const excludeIds = [listing_id, ...results.map((r: any) => r.id)];
    const { data: secondary } = await admin
      .from('listings')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .neq('seller_id', seller_id)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(10 - results.length);

    return json({ data: [...results, ...(secondary ?? [])] });
  }

  return json({ data: results });
});
