import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'missing_auth' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // 1. Supprimer toutes les identités OAuth (Google, Apple…) via fonction SECURITY DEFINER
    await supabaseAdmin.rpc('admin_delete_user_identities', { target_user_id: userId });

    // 2. Changer l'email + bannir (libère l'email original, empêche toute reconnexion)
    const anonymizedEmail = `deleted_${userId}@pepite-deleted.com`;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: anonymizedEmail,
      ban_duration: '876600h',
      user_metadata: {},
      app_metadata: {},
    });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Anonymiser le profil
    await supabaseAdmin.from('profiles').update({
      username: `deleted_${userId.slice(0, 8)}`,
      avatar_url: null,
      push_token: null,
    }).eq('id', userId);

    // 4. Dépublier toutes les annonces actives
    await supabaseAdmin.from('listings')
      .update({ status: 'removed' })
      .eq('seller_id', userId)
      .eq('status', 'active');

    return new Response(JSON.stringify({ anonymized: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
