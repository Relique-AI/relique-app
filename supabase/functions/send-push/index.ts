import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Maps notification type → notification_prefs column
const PREF_MAP: Record<string, string> = {
  message: 'new_message',
  question: 'question_asked',
  offer_received: 'offer_received',
  offer_accepted: 'offer_received',
  offer_declined: 'offer_received',
  offer_counter: 'offer_received',
};

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

    // Check notification preference if applicable
    const prefKey = PREF_MAP[type];
    if (prefKey) {
      const { data: userPrefs } = await supabase
        .from('notification_prefs')
        .select(prefKey)
        .eq('user_id', receiver_id)
        .maybeSingle();
      if (userPrefs && userPrefs[prefKey] === false) {
        return new Response(JSON.stringify({ sent: false, reason: 'pref_disabled' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

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

    const title = sender_name ?? 'Nouveau message';
    const body = listing_name ? `${listing_name} — ${message_preview}` : message_preview;
    const data = { type, listing_id, sender_id, listing_name };

    // Token FCM natif (fallback Android quand getExpoPushTokenAsync échoue)
    if (token.startsWith('fcm:')) {
      const fcmToken = token.slice(4);
      const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? '';
      const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';

      if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT) {
        return new Response(JSON.stringify({ sent: false, reason: 'missing_firebase_config' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Génère un access token OAuth2 via JWT service account
      const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }));
      const signingInput = `${header}.${payload}`;

      // Import de la clé privée RSA
      const pemKey = sa.private_key;
      const pemBody = pemKey.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\n/g, '');
      const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8', keyData.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false, ['sign'],
      );
      const sigBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
      const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
      const jwt = `${signingInput}.${sig}`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth2:grant-type:jwt-bearer&assertion=${jwt}`,
      });
      const { access_token } = await tokenRes.json();

      const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            android: { notification: { channel_id: 'messages', sound: 'default' } },
            data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])),
          },
        }),
      });
      const fcmResult = await fcmRes.json();
      return new Response(JSON.stringify({ sent: true, result: fcmResult }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Token Expo standard
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        channelId: 'messages',
        data,
      }),
    });

    const result = await res.json();
    // Log si erreur Expo
    if (result?.data?.status === 'error') {
      console.error('Expo push error:', JSON.stringify(result.data));
    }
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
