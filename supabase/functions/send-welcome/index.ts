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
    const { email, username } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400 });

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), { status: 500 });

    const displayName = username || 'toi';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F7F4F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0B0907;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 40px 28px;">
              <p style="margin:0;font-size:30px;font-weight:700;color:#F5B82E;">✦ Pépite</p>
              <p style="margin:8px 0 0;font-size:13px;color:#888;font-style:italic;">Tes objets valent plus que tu ne crois.</p>
            </td>
          </tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background-color:rgba(255,255,255,0.08);"></div></td></tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#fff;">Bienvenue sur Pépite ✦</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#aaa;">
                Ton compte est actif. Tu peux dès maintenant scanner tes objets, les mettre en vente et découvrir les pépites des autres membres.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#aaa;">
                Bonne chasse aux trésors !
              </p>
              <a href="https://pepite-app.com" style="display:inline-block;background-color:#F5B82E;color:#0B0907;font-weight:600;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:50px;">
                Ouvrir Pépite
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="height:1px;background-color:rgba(255,255,255,0.08);margin-bottom:20px;"></div>
              <p style="margin:0;font-size:12px;color:#555;text-align:center;">© 2025 Pépite · <a href="https://pepite-app.com" style="color:#555;text-decoration:none;">pepite-app.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pépite <hello@pepite-app.com>',
        to: [email],
        subject: 'Bienvenue sur Pépite ✦',
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
