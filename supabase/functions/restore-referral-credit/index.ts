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

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) return json({ error: 'payment_intent_id requis' }, 400);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

    // Verify via Stripe that the payment intent was NOT successful
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (pi.status === 'succeeded') return json({ error: 'Paiement réussi — crédit non restitué' }, 400);

    // Verify the credit was actually used and belongs to this buyer
    if (pi.metadata?.referral_credit_used !== 'true') return json({ success: true }); // nothing to restore
    if (pi.metadata?.buyer_id !== user.id) return json({ error: ErrorCode.UNAUTHORIZED }, 403);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('referral_credits')
      .eq('id', user.id)
      .single();

    await admin
      .from('profiles')
      .update({ referral_credits: (profile?.referral_credits ?? 0) + 1 })
      .eq('id', user.id);

    return json({ success: true });
  } catch (err: any) {
    console.error('restore-referral-credit error:', err?.message ?? String(err));
    return json({ error: err?.message ?? 'Erreur interne' }, 500);
  }
});
