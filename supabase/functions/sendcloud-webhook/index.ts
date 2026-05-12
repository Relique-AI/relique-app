import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sendcloud tracking status → shipping_status dans la DB
const STATUS_MAP: Record<number, string | null> = {
  1:  'to_ship',    // En attente
  11: 'to_ship',    // En attente de dépôt
  12: 'shipped',    // Remis au transporteur
  13: 'shipped',    // En transit
  14: 'shipped',    // En transit
  15: 'shipped',    // En cours de livraison
  93: 'delivered',  // Livré
  92: 'delivered',  // Livré au point relais
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  }

  try {
    const payload = await req.json();

    // Sendcloud envoie un tableau de parcels
    const parcels: any[] = payload.parcel ? [payload.parcel] : (payload.parcels ?? []);
    if (parcels.length === 0) return new Response('ok', { status: 200 });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    for (const parcel of parcels) {
      const orderNumber: string | undefined = parcel.order_number;
      const statusCode: number | undefined = parcel.status?.id;
      const trackingNumber: string | undefined = parcel.tracking_number;

      if (!orderNumber || statusCode === undefined) continue;

      const newStatus = STATUS_MAP[statusCode] ?? null;
      if (!newStatus) continue;

      // order_number = transaction.id (défini dans generate-label)
      const update: Record<string, string> = { shipping_status: newStatus };
      if (trackingNumber) update.tracking_number = trackingNumber;

      await admin
        .from('transactions')
        .update(update)
        .eq('id', orderNumber);
    }

    return new Response('ok', { status: 200 });
  } catch (err: any) {
    console.error('sendcloud-webhook error:', err?.message ?? String(err));
    return new Response('error', { status: 500 });
  }
});
