// Integration test for the auth + data-sync feature against a Supabase instance.
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-supabase.mjs
// Verifies: sign-up, profile auto-creation, user_state read/write round-trip,
// shared recipe catalog readability, and RLS isolation between two users.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
if (!URL || !ANON) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(2);
}

let passed = 0, failed = 0;
const ok = (cond, msg) => { (cond ? passed++ : failed++); console.log(`${cond ? '✅' : '❌'} ${msg}`); };

const mkClient = () => createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const rnd = Math.floor(Date.now() % 1e6);
const emailA = `a_${rnd}@example.com`;
const emailB = `b_${rnd}@example.com`;
const PW = 'password123!';

const A = mkClient();
const B = mkClient();

// 1. Sign up two users (confirmations disabled locally -> immediate session)
const { data: aUp, error: aErr } = await A.auth.signUp({ email: emailA, password: PW });
ok(!aErr && !!aUp.session, `user A signs up and gets a session ${aErr ? '(' + aErr.message + ')' : ''}`);
const { data: bUp } = await B.auth.signUp({ email: emailB, password: PW });
ok(!!bUp.session, 'user B signs up and gets a session');
const aId = aUp.user?.id;

// 2. Profile auto-created by trigger
{
  const { data } = await A.from('profiles').select('id, handle').eq('id', aId).maybeSingle();
  ok(!!data && data.id === aId, 'profile row auto-created for user A via trigger');
}

// 3. Shared recipe catalog readable
{
  const { data, error } = await A.from('recipes').select('id', { count: 'exact' });
  ok(!error && (data?.length ?? 0) >= 12, `seeded recipe catalog readable (${data?.length ?? 0} recipes)`);
}

// 4. user_state write + read round-trip
const stateA = { saved: ['curry', 'pizza'], plan: { Mon: { dinner: 'curry' } }, groceryChecked: ['g1'], groceryExtra: [], tastes: ['Italian'] };
{
  const { error } = await A.from('user_state').upsert({ user_id: aId, state: stateA });
  ok(!error, `user A writes user_state ${error ? '(' + error.message + ')' : ''}`);
  const { data } = await A.from('user_state').select('state').eq('user_id', aId).maybeSingle();
  ok(JSON.stringify(data?.state?.saved) === JSON.stringify(stateA.saved), 'user A reads back identical user_state');
}

// 5. RLS isolation — B cannot see A's state
{
  const { data } = await B.from('user_state').select('state').eq('user_id', aId);
  ok((data?.length ?? 0) === 0, 'RLS blocks user B from reading user A\'s state');
}

// 6. RLS — B cannot write to A's row
{
  const { error } = await B.from('user_state').upsert({ user_id: aId, state: { hacked: true } });
  ok(!!error, 'RLS blocks user B from writing to user A\'s row');
}

// 7. Profile edit round-trip
{
  await A.from('profiles').upsert({ id: aId, name: 'Test Cook', bio: 'hello' });
  const { data } = await A.from('profiles').select('name, bio').eq('id', aId).maybeSingle();
  ok(data?.name === 'Test Cook' && data?.bio === 'hello', 'user A edits and reads back profile');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
