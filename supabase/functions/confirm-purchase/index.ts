import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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

    // Verify caller identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: 'Non autorisé' }, 401);

    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) return json({ error: 'payment_intent_id requis' }, 400);

    // Confirm payment status directly with Stripe
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (pi.status !== 'succeeded') return json({ error: 'Paiement non confirmé' }, 400);

    const { listing_id, buyer_id, seller_id, shipping_method, delivery_address } = pi.metadata;
    if (!listing_id || !buyer_id || !seller_id) return json({ error: 'Métadonnées manquantes' }, 400);
    if (buyer_id !== user.id) return json({ error: 'Non autorisé' }, 403);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotent: skip insert if transaction already exists (e.g. webhook fired first)
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .maybeSingle();

    if (!existing) {
      const shippingStatus = (shipping_method ?? 'hand') === 'hand' ? 'delivered' : 'to_ship';
      await admin.from('transactions').insert({
        listing_id,
        buyer_id,
        seller_id,
        amount: pi.amount,
        fee: pi.application_fee_amount ?? 0,
        stripe_payment_intent_id: pi.id,
        status: 'completed',
        shipping_method: shipping_method ?? 'hand',
        delivery_address: delivery_address ?? null,
        shipping_status: shippingStatus,
      });

      // Notify seller
      const { data: listing } = await admin
        .from('listings')
        .select('name, profiles(push_token)')
        .eq('id', listing_id)
        .single();

      const sellerToken = (listing?.profiles as any)?.push_token;
      if (sellerToken && listing?.name) {
        const notifBody = (shipping_method ?? 'hand') === 'hand'
          ? `${listing.name} · Remise en main propre`
          : `${listing.name} · À expédier à : ${delivery_address ?? 'adresse non renseignée'}`;
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: sellerToken,
            title: 'Votre article a été vendu !',
            body: notifBody,
            sound: 'default',
            data: { type: 'sale', listing_id, buyer_id },
          }),
        });
      }
    }

    // Always update listing status (idempotent)
    await admin
      .from('listings')
      .update({ status: 'sold', buyer_id })
      .eq('id', listing_id);

    return json({ success: true });
  } catch (err: any) {
    console.error('confirm-purchase error:', err?.message ?? String(err));
    return json({ error: err?.message ?? 'Erreur interne' }, 500);
  }
});
