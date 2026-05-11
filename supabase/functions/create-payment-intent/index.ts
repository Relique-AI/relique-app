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

    const { listing_id, shipping_method = 'hand', delivery_address, offer_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Non autorisé' }, 401);

    const { data: listing } = await supabase
      .from('listings')
      .select('*, profiles(stripe_account_id)')
      .eq('id', listing_id)
      .single();

    if (!listing) return json({ error: 'Annonce introuvable' }, 404);
    if (listing.status !== 'active') return json({ error: 'Annonce indisponible' }, 400);
    if (listing.seller_id === user.id) return json({ error: 'Vous ne pouvez pas acheter votre propre annonce' }, 400);

    const sellerAccountId = listing.profiles?.stripe_account_id;
    if (!sellerAccountId) return json({ error: 'Vendeur non configuré pour les paiements' }, 400);

    let itemPrice = listing.price_final;
    if (offer_id) {
      const { data: offer } = await supabase.from('offers').select('*').eq('id', offer_id).single();
      if (!offer) return json({ error: 'Offre introuvable' }, 404);
      if (offer.status !== 'accepted') return json({ error: 'Offre non acceptée' }, 400);
      if (offer.buyer_id !== user.id) return json({ error: 'Non autorisé' }, 403);
      if (offer.listing_id !== listing_id) return json({ error: 'Offre invalide' }, 400);
      itemPrice = offer.amount;
    }

    const shippingCost = shipping_method === 'hand' ? 0 : (listing.shipping_price ?? 0);
    const amount = Math.round((itemPrice + shippingCost) * 100);
    const fee = Math.round(amount * 0.03);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      application_fee_amount: fee,
      transfer_data: { destination: sellerAccountId },
      metadata: {
        listing_id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        shipping_method,
        ...(delivery_address ? { delivery_address } : {}),
        ...(offer_id ? { offer_id } : {}),
      },
    });

    return json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('create-payment-intent error:', msg);
    return json({ error: msg }, 500);
  }
});
