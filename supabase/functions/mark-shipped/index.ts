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

    const { transaction_id, tracking_number } = await req.json();
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
      .select('seller_id, buyer_id, listing_id, delivery_address')
      .eq('id', transaction_id)
      .single();

    if (!tx) return json({ error: 'Transaction introuvable' }, 404);
    if (tx.seller_id !== user.id) return json({ error: 'Non autorisé' }, 403);

    const { error } = await admin
      .from('transactions')
      .update({
        shipping_status: 'shipped',
        tracking_number: tracking_number?.trim() || null,
      })
      .eq('id', transaction_id);

    if (error) return json({ error: error.message }, 500);

    // Notify buyer
    const { data: listing } = await admin
      .from('listings')
      .select('name, profiles(push_token)')
      .eq('id', tx.listing_id)
      .single();

    const buyerProfile = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', tx.buyer_id)
      .single();

    const buyerToken = buyerProfile.data?.push_token;
    if (buyerToken && listing?.name) {
      const trackingMsg = tracking_number?.trim()
        ? ` · Suivi : ${tracking_number.trim()}`
        : '';
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: buyerToken,
          title: 'Votre commande est en route !',
          body: `${listing.name}${trackingMsg}`,
          sound: 'default',
          data: { type: 'shipped', listing_id: tx.listing_id },
        }),
      });
    }

    return json({ success: true });
  } catch (err: any) {
    console.error('mark-shipped error:', err?.message ?? String(err));
    return json({ error: err?.message ?? 'Erreur interne' }, 500);
  }
});
