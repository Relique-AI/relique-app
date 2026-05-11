import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event | null = null;

  const secrets = [
    Deno.env.get('STRIPE_WEBHOOK_SECRET'),
    Deno.env.get('STRIPE_WEBHOOK_SECRET_CONNECT'),
  ].filter(Boolean) as string[];

  for (const secret of secrets) {
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, secret);
      break;
    } catch {
      // mauvaise clé, on essaie la suivante
    }
  }

  if (!event) {
    return new Response(JSON.stringify({ error: 'Signature invalide' }), { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { listing_id, buyer_id, seller_id } = pi.metadata;

    if (listing_id && buyer_id && seller_id) {
      const shipping_method = pi.metadata.shipping_method ?? 'hand';
      const delivery_address = pi.metadata.delivery_address ?? null;
      const shipping_status = shipping_method === 'hand' ? 'delivered' : 'to_ship';

      const { data: listing } = await supabase
        .from('listings')
        .select('name, profiles(push_token)')
        .eq('id', listing_id)
        .single();

      await supabase
        .from('listings')
        .update({ status: 'sold', buyer_id })
        .eq('id', listing_id);

      // Idempotent: skip if confirm-purchase already created this transaction
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_payment_intent_id', pi.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('transactions').insert({
          listing_id,
          buyer_id,
          seller_id,
          amount: pi.amount,
          fee: pi.application_fee_amount ?? 0,
          stripe_payment_intent_id: pi.id,
          status: 'completed',
          shipping_method,
          delivery_address,
          shipping_status,
        });
      }

      const sellerToken = (listing?.profiles as any)?.push_token;
      if (sellerToken && listing?.name) {
        const notifBody = shipping_method === 'hand'
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
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const onboarded = account.details_submitted && account.charges_enabled;
    await supabase
      .from('profiles')
      .update({
        stripe_onboarded: onboarded,
        stripe_kyc_status: onboarded ? 'active' : 'pending',
      })
      .eq('stripe_account_id', account.id);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
