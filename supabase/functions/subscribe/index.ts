// subscribe — mock "purchase" of Recipe-Snap Pro. Flips the signed-in user's
// subscription to Pro for ~30 days (no real charge). This is the single place a
// real payment provider (Stripe webhook, RevenueCat, store IAP) would later set
// Pro, so the rest of the app needs no change when payments go live.
// Deploy: supabase functions deploy subscribe --no-verify-jwt
import { corsHeaders, json } from '../_shared/cors.ts';
import { userIdFromReq, startSubscription } from '../_shared/billing.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await userIdFromReq(req);
    if (!uid) return json({ error: 'Sign in required to subscribe.' }, 401);
    const sub = await startSubscription(uid);
    return json({ subscription: sub });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
