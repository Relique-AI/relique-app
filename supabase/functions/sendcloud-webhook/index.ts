import { createClient } from 'npm:@supabase/supabase-js@2';

const STATUS_MAP: Record<number, string | null> = {
  1:  'to_ship',
  11: 'to_ship',
  12: 'shipped',
  13: 'shipped',
  14: 'shipped',
  15: 'shipped',
  93: 'delivered',
  92: 'delivered',
};

Deno.serve(async (req: Request) => {
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
