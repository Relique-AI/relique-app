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
    const { receiver_id, sender_name, listing_name, message_preview } = await req.json();

    // Récupérer le push token du destinataire
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', receiver_id)
      .single();

    if (!profile?.push_token) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_token' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Envoyer via l'API Expo Push
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.push_token,
        title: sender_name ?? 'Nouveau message',
        body: listing_name
          ? `Re: ${listing_name} — ${message_preview}`
          : message_preview,
        sound: 'default',
        data: { type: 'message' },
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
