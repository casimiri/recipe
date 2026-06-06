// delete-account — permanently removes the signed-in user: their app rows
// (subscriptions, user_state, owned recipes), their avatars in Storage, and
// finally the auth record itself (service-role admin API). Irreversible.
// Deploy: supabase functions deploy delete-account --no-verify-jwt
import { corsHeaders, json } from '../_shared/cors.ts';
import { userIdFromReq } from '../_shared/billing.ts';

const SB_URL = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const headers = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };

async function delRows(table: string, filter: string) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await userIdFromReq(req);
    if (!uid) return json({ error: 'Sign in required.' }, 401);
    if (!SB_URL || !SERVICE) return json({ error: 'Server not configured.' }, 500);

    // App data (RLS-bypassing service role). owner/user_id scoped to this user.
    await delRows('subscriptions', `user_id=eq.${uid}`);
    await delRows('user_state', `user_id=eq.${uid}`);
    await delRows('recipes', `owner=eq.${uid}`);

    // Avatars in Storage (best effort).
    try {
      const list = await fetch(`${SB_URL}/storage/v1/object/list/avatars`, {
        method: 'POST', headers, body: JSON.stringify({ prefix: `${uid}/` }),
      });
      const objs = (await list.json()) as { name: string }[];
      if (Array.isArray(objs) && objs.length) {
        await fetch(`${SB_URL}/storage/v1/object/avatars`, {
          method: 'DELETE', headers, body: JSON.stringify({ prefixes: objs.map((o) => `${uid}/${o.name}`) }),
        }).catch(() => {});
      }
    } catch { /* no avatars */ }

    // Finally the auth user itself.
    const res = await fetch(`${SB_URL}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers });
    if (!res.ok) return json({ error: `auth delete ${res.status}: ${(await res.text()).slice(0, 200)}` }, 502);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
