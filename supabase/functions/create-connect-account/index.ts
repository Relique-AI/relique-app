import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  let accountId = profile?.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'pepite://stripe/refresh',
    return_url: 'pepite://stripe/return',
    type: 'account_onboarding',
  });

  return new Response(JSON.stringify({ url: accountLink.url }), { status: 200 });
});
