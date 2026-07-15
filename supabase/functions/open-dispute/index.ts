import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ErrorCode } from '../_shared/errors.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

const DISPUTE_WINDOW_DAYS = 7;

const REASON_LABELS: Record<string, string> = {
  not_received: 'Objet non reçu',
  not_as_described: 'Non conforme à la description',
  damaged: 'Objet endommagé',
  other: 'Autre',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return json({ error: ErrorCode.UNAUTHORIZED }, 401);

  let transaction_id: string, reason: string, description: string;
  try {
    ({ transaction_id, reason, description } = await req.json());
  } catch {
    return json({ error: ErrorCode.INVALID_BODY }, 400);
  }

  if (!transaction_id || !reason || !description?.trim()) {
    return json({ error: 'transaction_id, reason et description sont requis' }, 400);
  }

  const validReasons = ['not_received', 'not_as_described', 'damaged', 'other'];
  if (!validReasons.includes(reason)) {
    return json({ error: 'Motif invalide' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Charger la transaction
  const { data: tx } = await admin
    .from('transactions')
    .select('id, buyer_id, seller_id, listing_id, shipping_status, created_at, amount')
    .eq('id', transaction_id)
    .single();

  if (!tx) return json({ error: ErrorCode.TRANSACTION_NOT_FOUND }, 404);
  if (tx.buyer_id !== user.id) return json({ error: ErrorCode.UNAUTHORIZED }, 403);

  // Vérifier que la livraison est confirmée ou expédiée
  const allowedStatuses = ['delivered', 'shipped', 'to_hand', 'completed'];
  if (!allowedStatuses.includes(tx.shipping_status)) {
    return json({ error: 'Un litige ne peut être ouvert qu\'après expédition ou réception.' }, 400);
  }

  // Fenêtre de 7 jours
  const txDate = new Date(tx.created_at);
  const now = new Date();
  const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > DISPUTE_WINDOW_DAYS) {
    return json({ error: `Le délai de ${DISPUTE_WINDOW_DAYS} jours pour ouvrir un litige est dépassé.` }, 400);
  }

  // Vérifier qu'il n'y a pas déjà un litige
  const { data: existing } = await admin
    .from('disputes')
    .select('id, status')
    .eq('transaction_id', transaction_id)
    .maybeSingle();

  if (existing) {
    return json({ error: 'Un litige existe déjà pour cette transaction.', dispute_id: existing.id }, 400);
  }

  // Charger le nom de l'annonce
  const { data: listing } = await admin
    .from('listings')
    .select('name')
    .eq('id', tx.listing_id)
    .single();

  // Créer le litige
  const { data: dispute, error: insertError } = await admin
    .from('disputes')
    .insert({
      transaction_id,
      listing_id: tx.listing_id,
      buyer_id: tx.buyer_id,
      seller_id: tx.seller_id,
      reason,
      description: description.trim(),
      status: 'open',
    })
    .select('id')
    .single();

  if (insertError || !dispute) {
    return json({ error: insertError?.message ?? 'Erreur lors de la création du litige' }, 500);
  }

  // Notifier le vendeur
  try {
    const { data: sellerProfile } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', tx.seller_id)
      .single();

    if (sellerProfile?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sellerProfile.push_token,
          title: '⚠️ Litige ouvert',
          body: `Un litige a été ouvert sur « ${listing?.name ?? 'votre annonce'} » : ${REASON_LABELS[reason]}.`,
          sound: 'default',
          data: { type: 'dispute_opened', dispute_id: dispute.id, listing_id: tx.listing_id },
        }),
      });
    }
  } catch (err) {
    console.error('open-dispute notify seller error:', err);
  }

  // Notifier les admins
  try {
    const { data: admins } = await admin
      .from('profiles')
      .select('push_token')
      .eq('is_admin', true)
      .not('push_token', 'is', null);

    if (admins?.length) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: admins.map((a: any) => a.push_token),
          title: '⚠️ Nouveau litige',
          body: `Litige sur « ${listing?.name ?? 'annonce'} » — ${REASON_LABELS[reason]}`,
          sound: 'default',
          data: { type: 'dispute_admin', dispute_id: dispute.id },
        }),
      });
    }
  } catch (err) {
    console.error('open-dispute notify admin error:', err);
  }

  return json({ success: true, dispute_id: dispute.id });
});
