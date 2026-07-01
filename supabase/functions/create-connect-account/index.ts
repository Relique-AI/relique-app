import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETURN_URL = 'https://vpjauyzkebfayybbymqi.supabase.co/functions/v1/stripe-connect-return';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'missing_auth' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

    const body = await req.json().catch(() => ({}));
    const business_type: 'individual' | 'company' = body.business_type === 'company' ? 'company' : 'individual';
    const check_only: boolean = body.check_only === true;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    // Vérification du statut pour un compte existant
    if (accountId) {
      const stripeAccount = await stripe.accounts.retrieve(accountId);
      if (stripeAccount.charges_enabled) {
        await supabase.from('profiles').update({
          stripe_onboarded: true,
          stripe_kyc_status: 'active',
        }).eq('id', user.id);
      }

      if (check_only) {
        return new Response(JSON.stringify({ onboarded: stripeAccount.charges_enabled }), {
          status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: RETURN_URL,
        return_url: RETURN_URL,
        type: stripeAccount.charges_enabled ? 'account_update' : 'account_onboarding',
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Création d'un nouveau compte
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      business_type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        mcc: '5932',
        product_description: 'Vente d\'objets de collection et de seconde main entre particuliers via la plateforme Pépite.',
      },
    } as any);

    accountId = account.id;

    await supabase.from('profiles').update({
      stripe_account_id: accountId,
    }).eq('id', user.id);

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: RETURN_URL,
      return_url: RETURN_URL,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
