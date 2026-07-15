import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { ErrorCode } from '../_shared/errors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

// action: 'full_refund' | 'partial_refund' | 'close_seller'
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Vérifier admin
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return json({ error: 'Accès réservé aux administrateurs' }, 403);

  let dispute_id: string, action: string, refund_amount: number | undefined, admin_note: string | undefined;
  try {
    ({ dispute_id, action, refund_amount, admin_note } = await req.json());
  } catch {
    return json({ error: ErrorCode.INVALID_BODY }, 400);
  }

  const validActions = ['full_refund', 'partial_refund', 'close_seller'];
  if (!dispute_id || !validActions.includes(action)) {
    return json({ error: 'dispute_id et action valide requis' }, 400);
  }
  if (action === 'partial_refund' && (!refund_amount || refund_amount <= 0)) {
    return json({ error: 'refund_amount requis pour un remboursement partiel' }, 400);
  }

  // Charger le litige
  const { data: dispute } = await admin
    .from('disputes')
    .select('id, status, transaction_id, buyer_id, seller_id, listing_id')
    .eq('id', dispute_id)
    .single();

  if (!dispute) return json({ error: 'Litige introuvable' }, 404);
  if (dispute.status === 'resolved_buyer' || dispute.status === 'resolved_seller' || dispute.status === 'closed') {
    return json({ error: 'Ce litige est déjà résolu' }, 400);
  }

  // Charger la transaction
  const { data: tx } = await admin
    .from('transactions')
    .select('id, amount, stripe_payment_intent_id, listing_id')
    .eq('id', dispute.transaction_id)
    .single();

  if (!tx) return json({ error: ErrorCode.TRANSACTION_NOT_FOUND }, 404);

  // Charger le nom de l'annonce
  const { data: listing } = await admin
    .from('listings')
    .select('name')
    .eq('id', dispute.listing_id)
    .single();

  let stripeRefundId: string | null = null;

  // Remboursement Stripe
  if ((action === 'full_refund' || action === 'partial_refund') && tx.stripe_payment_intent_id) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: tx.stripe_payment_intent_id,
        reason: 'requested_by_customer',
      };
      if (action === 'partial_refund' && refund_amount) {
        refundParams.amount = refund_amount; // en centimes
      }
      const refund = await stripe.refunds.create(refundParams);
      stripeRefundId = refund.id;
    } catch (err: any) {
      console.error('resolve-dispute stripe refund error:', err?.message);
      return json({ error: `Erreur Stripe : ${err?.message ?? 'remboursement échoué'}` }, 500);
    }
  }

  const newStatus = action === 'close_seller' ? 'resolved_seller' : 'resolved_buyer';

  // Mettre à jour le litige
  await admin
    .from('disputes')
    .update({
      status: newStatus,
      refund_amount: action === 'full_refund' ? tx.amount : (refund_amount ?? null),
      admin_note: admin_note ?? null,
      stripe_refund_id: stripeRefundId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', dispute_id);

  // Marquer la transaction comme remboursée
  if (action !== 'close_seller') {
    await admin
      .from('transactions')
      .update({ shipping_status: 'refunded' })
      .eq('id', dispute.transaction_id);
  }

  // Notifier l'acheteur
  try {
    const { data: buyerProfile } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', dispute.buyer_id)
      .single();

    if (buyerProfile?.push_token) {
      const isRefund = action !== 'close_seller';
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: buyerProfile.push_token,
          title: isRefund ? '✅ Litige résolu — Remboursement' : 'Litige clôturé',
          body: isRefund
            ? `Votre litige sur « ${listing?.name ?? 'votre commande'} » a été résolu. Un remboursement a été initié.`
            : `Votre litige sur « ${listing?.name ?? 'votre commande'} » a été clôturé en faveur du vendeur.`,
          sound: 'default',
          data: { type: 'dispute_resolved', dispute_id, listing_id: dispute.listing_id },
        }),
      });
    }
  } catch (err) {
    console.error('resolve-dispute notify buyer error:', err);
  }

  // Notifier le vendeur
  try {
    const { data: sellerProfile } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', dispute.seller_id)
      .single();

    if (sellerProfile?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sellerProfile.push_token,
          title: action === 'close_seller' ? '✅ Litige résolu en votre faveur' : 'Litige — Remboursement accordé',
          body: action === 'close_seller'
            ? `Le litige sur « ${listing?.name ?? 'votre annonce'} » a été clôturé en votre faveur.`
            : `Un remboursement a été accordé à l'acheteur pour « ${listing?.name ?? 'votre annonce'} ».`,
          sound: 'default',
          data: { type: 'dispute_resolved', dispute_id, listing_id: dispute.listing_id },
        }),
      });
    }
  } catch (err) {
    console.error('resolve-dispute notify seller error:', err);
  }

  return json({ success: true, status: newStatus, stripe_refund_id: stripeRefundId });
});
