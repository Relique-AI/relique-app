import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non autorisé' }, 401);

    const { transaction_id } = await req.json();
    if (!transaction_id) return json({ error: 'transaction_id requis' }, 400);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: 'Non autorisé' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: tx } = await admin
      .from('transactions')
      .select('seller_id, buyer_id, listing_id, shipping_status')
      .eq('id', transaction_id)
      .single();

    if (!tx) return json({ error: 'Transaction introuvable' }, 404);
    if (tx.buyer_id !== user.id) return json({ error: 'Non autorisé' }, 403);
    if (tx.shipping_status === 'delivered') return json({ success: true }); // idempotent

    const { error } = await admin
      .from('transactions')
      .update({ shipping_status: 'delivered' })
      .eq('id', transaction_id);

    if (error) return json({ error: error.message }, 500);

    // Notify seller
    const { data: listing } = await admin
      .from('listings')
      .select('name')
      .eq('id', tx.listing_id)
      .single();

    const sellerProfile = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', tx.seller_id)
      .single();

    const sellerToken = sellerProfile.data?.push_token;
    if (sellerToken && listing?.name) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sellerToken,
          title: 'Réception confirmée !',
          body: `L'acheteur a confirmé la réception de « ${listing.name} ».`,
          sound: 'default',
          data: { type: 'delivered', listing_id: tx.listing_id },
        }),
      });
    }

    return json({ success: true });
  } catch (err: any) {
    console.error('confirm-reception error:', err?.message ?? String(err));
    return json({ error: err?.message ?? 'Erreur interne' }, 500);
  }
});
