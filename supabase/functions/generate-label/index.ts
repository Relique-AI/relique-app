import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

// kg par tranche de colis
const PARCEL_WEIGHTS: Record<string, string> = {
  xs: '0.800',
  s:  '2.500',
  m:  '4.500',
  l:  '8.000',
};

function parseAddress(addr: string) {
  // Format attendu : "12 rue de la Paix, 75001 Paris" ou "..., France"
  const match = addr.match(/^(.+),\s*(\d{5})\s+(.+?)(?:,\s*\w+)?$/);
  if (match) {
    return { address: match[1].trim(), postal_code: match[2], city: match[3].trim(), country: 'FR' };
  }
  const parts = addr.split(',').map(p => p.trim());
  return { address: parts[0] || addr, postal_code: '75000', city: parts[1] || 'Paris', country: 'FR' };
}

async function getShipmentId(carrier: string, apiAuth: string): Promise<number> {
  try {
    const res = await fetch(
      'https://panel.sendcloud.sc/api/v2/shipping_methods?from_country=FR&to_country=FR',
      { headers: { Authorization: `Basic ${apiAuth}` } },
    );
    const data = await res.json();
    const methods: any[] = data.shipping_methods ?? [];

    const keywords: Record<string, string[]> = {
      relay:      ['mondial relay', 'relay'],
      colissimo:  ['colissimo'],
      chronopost: ['chronopost'],
    };
    const kws = keywords[carrier.toLowerCase()] ?? [carrier.toLowerCase()];
    const found = methods.find(m => kws.some(kw => m.name.toLowerCase().includes(kw)));
    return found?.id ?? 8; // 8 = Colissimo standard, fallback
  } catch {
    return 8;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Non autorisé' }, 401);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: 'Non autorisé' }, 401);

    const { payment_intent_id } = await req.json();
    if (!payment_intent_id) return json({ error: 'payment_intent_id requis' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: tx } = await admin
      .from('transactions')
      .select('id, buyer_id, seller_id, listing_id, delivery_address, shipping_method, label_url')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .maybeSingle();

    if (!tx) return json({ error: 'Transaction introuvable' }, 404);
    if (tx.buyer_id !== user.id) return json({ error: 'Non autorisé' }, 403);
    if (tx.shipping_method === 'hand') return json({ skipped: true });
    if (!tx.delivery_address) return json({ error: 'Adresse de livraison manquante' }, 400);

    // Idempotent : étiquette déjà générée
    if (tx.label_url) return json({ label_url: tx.label_url });

    const SENDCLOUD_API_KEY = Deno.env.get('SENDCLOUD_API_KEY');
    const SENDCLOUD_API_SECRET = Deno.env.get('SENDCLOUD_API_SECRET');
    if (!SENDCLOUD_API_KEY || !SENDCLOUD_API_SECRET) {
      return json({ error: 'Sendcloud non configuré' }, 500);
    }

    const [listingRes, buyerRes] = await Promise.all([
      admin.from('listings').select('name, parcel_size').eq('id', tx.listing_id).single(),
      admin.from('profiles').select('username').eq('id', tx.buyer_id).single(),
    ]);

    const listing = listingRes.data;
    const buyer = buyerRes.data;

    const weight = PARCEL_WEIGHTS[listing?.parcel_size ?? 's'];
    const parsedAddr = parseAddress(tx.delivery_address);
    const apiAuth = btoa(`${SENDCLOUD_API_KEY}:${SENDCLOUD_API_SECRET}`);
    const shipmentId = await getShipmentId(tx.shipping_method, apiAuth);

    const scRes = await fetch('https://panel.sendcloud.sc/api/v2/parcels', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parcel: {
          name: buyer?.username ?? 'Acheteur',
          address: parsedAddr.address,
          city: parsedAddr.city,
          postal_code: parsedAddr.postal_code,
          country: parsedAddr.country,
          weight,
          order_number: tx.id,
          request_label: true,
          shipment: { id: shipmentId },
        },
      }),
    });

    if (!scRes.ok) {
      const err = await scRes.text();
      console.error('Sendcloud error:', err);
      return json({ error: 'Génération étiquette échouée', details: err }, 500);
    }

    const scData = await scRes.json();
    const rawLabel = scData.parcel?.label?.normal_printer;
    const labelUrl: string = Array.isArray(rawLabel) ? rawLabel[0] : rawLabel;
    const trackingNumber: string | null = scData.parcel?.tracking_number ?? null;

    await admin
      .from('transactions')
      .update({ label_url: labelUrl, tracking_number: trackingNumber ?? undefined })
      .eq('id', tx.id);

    // Notification push au vendeur
    const { data: seller } = await admin
      .from('profiles')
      .select('push_token')
      .eq('id', tx.seller_id)
      .single();

    if (seller?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: seller.push_token,
          title: '📦 Étiquette prête !',
          body: `L'étiquette pour "${listing?.name}" est disponible dans votre profil.`,
          sound: 'default',
          data: { type: 'label_ready', listing_id: tx.listing_id },
        }),
      });
    }

    return json({ label_url: labelUrl, tracking_number: trackingNumber });
  } catch (err: any) {
    console.error('generate-label error:', err?.message ?? String(err));
    return json({ error: err?.message ?? 'Erreur interne' }, 500);
  }
});
