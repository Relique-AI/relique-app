import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload = await req.json();
    const listing = payload.record ?? payload;

    if (listing.status !== 'active') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id: listingId, category, name: listingName, seller_id } = listing;

    // 1. Users who follow this category
    const { data: catFavs } = await supabase
      .from('favorite_categories')
      .select('user_id')
      .eq('category', category)
      .neq('user_id', seller_id);

    // 2. Users with a matching keyword alert
    const { data: kwAlerts } = await supabase
      .from('keyword_alerts')
      .select('user_id, keyword')
      .neq('user_id', seller_id);

    const nameLower = (listingName ?? '').toLowerCase();
    const kwUserIds = new Set<string>(
      (kwAlerts ?? [])
        .filter((ka: any) => nameLower.includes(ka.keyword.toLowerCase()))
        .map((ka: any) => ka.user_id),
    );
    const catUserIds = new Set<string>((catFavs ?? []).map((f: any) => f.user_id));
    const allUserIds = [...new Set([...catUserIds, ...kwUserIds])];

    if (allUserIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', allUserIds)
      .not('push_token', 'is', null);

    const messages = (profiles ?? [])
      .filter((p: any) => p.push_token)
      .map((p: any) => {
        const isKeyword = kwUserIds.has(p.id);
        return {
          to: p.push_token,
          title: isKeyword ? `"${listingName}"` : `Nouvelle annonce — ${category}`,
          body: isKeyword ? `Correspond à l'un de vos mots-clés · ${category}` : listingName,
          sound: 'default',
          data: { type: 'new_listing', listing_id: listingId },
        };
      });

    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: messages.length, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
