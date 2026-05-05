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

    // Only notify for active listings
    if (listing.status !== 'active') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id: listingId, category, title, seller_id } = listing;

    // Find users who subscribed to this category (excluding the seller)
    const { data: favs } = await supabase
      .from('favorite_categories')
      .select('user_id')
      .eq('category', category)
      .neq('user_id', seller_id);

    if (!favs || favs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userIds = favs.map((f) => f.user_id);

    // Get their push tokens
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    const tokens = (profiles ?? []).map((p) => p.push_token).filter(Boolean);
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send batch push via Expo API
    const messages = tokens.map((token) => ({
      to: token,
      title: `Nouvelle annonce — ${category}`,
      body: title,
      sound: 'default',
      data: { type: 'new_listing', listing_id: listingId },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: tokens.length, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
