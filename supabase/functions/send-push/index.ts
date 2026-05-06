import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const {
      receiver_id,
      sender_name,
      listing_name,
      message_preview,
      type = 'message',
      listing_id,
      sender_id,
    } = await req.json();

    if (!receiver_id) {
      return new Response(JSON.stringify({ sent: false, reason: 'missing_receiver_id' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Récupérer le push token du destinataire
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', receiver_id)
      .single();

    const token = profile?.push_token;
    if (!token) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_token' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Envoyer via l'API Expo Push
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify({
        to: token,
        title: sender_name ?? 'Nouveau message',
        body: listing_name
          ? `${listing_name} — ${message_preview}`
          : message_preview,
        sound: 'default',
        channelId: 'messages',
        data: { type, listing_id, sender_id, listing_name },
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
