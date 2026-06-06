// billing.ts — shared server helpers for Pro state + AI quota.
// Uses the service role (SB_* secrets, with the platform vars as fallback) to
// read app_config / subscriptions and to bump usage. The caller is identified
// from the request's Authorization JWT; guests (no user) are not enforced
// server-side (the client gates them), so this only limits signed-in users.
const SB_URL = Deno.env.get('SB_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/** Resolve the signed-in user's id from the request JWT, or null for guests. */
export async function userIdFromReq(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth || !SB_URL) return null;
  const token = auth.replace(/^Bearer\s+/i, '');
  try {
    const res = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const u = await res.json();
    return u?.id ?? null;
  } catch {
    return null;
  }
}

function rest(path: string, init?: RequestInit) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
}

export async function freeAiQuota(): Promise<number> {
  try {
    const rows = await (await rest('app_config?id=eq.default&select=free_ai_quota')).json();
    return rows[0]?.free_ai_quota ?? 5;
  } catch {
    return 5;
  }
}

// deno-lint-ignore no-explicit-any
async function getSub(uid: string): Promise<any | null> {
  try {
    const rows = await (await rest(`subscriptions?user_id=eq.${uid}&select=*`)).json();
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// deno-lint-ignore no-explicit-any
export function isPro(sub: any): boolean {
  return !!sub?.pro && (!sub.renews_at || new Date(sub.renews_at).getTime() > Date.now());
}

/** Flip the user to Pro, valid for one month from today (mock "payment"). */
export async function startSubscription(uid: string) {
  const d = new Date();
  d.setMonth(d.getMonth() + 1); // exactly one calendar month from the subscription date
  const renews_at = d.toISOString();
  const res = await rest('subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ user_id: uid, pro: true, renews_at }),
  });
  const rows = await res.json();
  return rows[0] ?? { pro: true, renews_at };
}

/**
 * Enforce the monthly AI quota for signed-in non-Pro users. Returns
 * { allowed:false, limit } when the quota is spent; otherwise bumps usage and
 * returns { allowed:true }. Guests and Pro users always pass.
 */
export async function checkAiQuota(req: Request): Promise<{ allowed: boolean; limit?: number }> {
  const uid = await userIdFromReq(req);
  if (!uid || !SB_URL) return { allowed: true };
  const [quota, sub] = await Promise.all([freeAiQuota(), getSub(uid)]);
  if (isPro(sub)) return { allowed: true };
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const count = sub?.ai_period === period ? (sub.ai_count ?? 0) : 0;
  if (count >= quota) return { allowed: false, limit: quota };
  await rest('subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ user_id: uid, ai_period: period, ai_count: count + 1, updated_at: new Date().toISOString() }),
  });
  return { allowed: true };
}
