import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch {
    return new Response(JSON.stringify({ error: 'Signature invalide' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { listing_id, buyer_id, seller_id } = pi.metadata;

    await supabase.from('listings').update({ status: 'sold', buyer_id }).eq('id', listing_id);

    await supabase.from('transactions').insert({
      listing_id,
      buyer_id,
      seller_id,
      amount: pi.amount,
      fee: pi.application_fee_amount ?? 0,
      stripe_payment_intent_id: pi.id,
      status: 'completed',
    });
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const onboarded = account.details_submitted && account.charges_enabled;
    await supabase
      .from('profiles')
      .update({ stripe_onboarded: onboarded })
      .eq('stripe_account_id', account.id);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
