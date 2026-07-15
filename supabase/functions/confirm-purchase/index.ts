import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ErrorCode } from '../_shared/errors.ts';

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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  let payment_intent_id: string;
  try {
    ({ payment_intent_id } = await req.json());
  } catch {
    return json({ error: ErrorCode.INVALID_BODY }, 400);
  }
  if (!payment_intent_id) return json({ error: 'payment_intent_id requis' }, 400);

  const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
  if (pi.status !== 'succeeded') return json({ error: 'Paiement non confirmé' }, 400);

  const { listing_id, buyer_id, seller_id, shipping_method, delivery_address } = pi.metadata;
  if (!listing_id || !buyer_id || !seller_id) return json({ error: 'Métadonnées manquantes' }, 400);
  if (buyer_id !== user.id) return json({ error: ErrorCode.UNAUTHORIZED }, 403);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Transaction insert (idempotent)
  try {
    const { data: existing } = await admin
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .maybeSingle();

    if (!existing) {
      const shippingStatus = (shipping_method ?? 'hand') === 'hand' ? 'to_hand' : 'to_ship';
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

      const { data: listing } = await admin
        .from('listings')
        .select('name, profiles(push_token)')
        .eq('id', listing_id)
        .single();

      const sellerToken = (listing?.profiles as any)?.push_token;
      if (sellerToken && listing?.name) {
        const notifBody = (shipping_method ?? 'hand') === 'hand'
          ? `${listing.name} · Remise en main propre à convenir avec l'acheteur`
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
  } catch (err: any) {
    console.error('confirm-purchase transaction error:', err?.message ?? String(err));
  }

  // Listing status update (idempotent)
  try {
    await admin
      .from('listings')
      .update({ status: 'sold', buyer_id })
      .eq('id', listing_id);
  } catch (err: any) {
    console.error('confirm-purchase listing update error:', err?.message ?? String(err));
  }

  // Referral: credit parrain on filleul's first purchase
  try {
    const { data: buyerProfile } = await admin
      .from('profiles')
      .select('referred_by, referral_first_purchase_done')
      .eq('id', buyer_id)
      .single();

    if (buyerProfile?.referred_by && !buyerProfile?.referral_first_purchase_done) {
      await admin
        .from('profiles')
        .update({ referral_first_purchase_done: true })
        .eq('id', buyer_id);

      const { data: parrain } = await admin
        .from('profiles')
        .select('referral_credits, push_token')
        .eq('id', buyerProfile.referred_by)
        .single();

      await admin
        .from('profiles')
        .update({ referral_credits: (parrain?.referral_credits ?? 0) + 3 })
        .eq('id', buyerProfile.referred_by);

      if (parrain?.push_token) {
        const { data: filleul } = await admin
          .from('profiles')
          .select('username')
          .eq('id', buyer_id)
          .single();
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: parrain.push_token,
            title: '🎉 Votre filleul a fait son premier achat !',
            body: `${filleul?.username ?? 'Votre filleul'} a effectué son premier achat. Vous avez gagné 3 achats à −50% de frais !`,
            sound: 'default',
            data: { type: 'referral_reward' },
          }),
        });
      }
    }
  } catch (err: any) {
    console.error('confirm-purchase referral error:', err?.message ?? String(err));
  }

  return json({ success: true });
});
