---
name: recipe-snap-ops
description: Run the Recipe-Snap Expo app on a phone from this Codespace, and manage its cloud Supabase backend (migrations, seed, edge functions, secrets, auth users). Use when asked to start/run the app, show a QR code, deploy or query Supabase, set secrets, confirm/list users, or check backend status.
---

# Recipe-Snap ops

Recipe-Snap is an Expo (SDK 54, expo-router) app backed by Supabase + OpenAI edge functions. It runs from a GitHub Codespace, so the phone cannot reach the dev machine directly — everything below accounts for that.

## Key facts

- App env lives in `.env.local` (gitignored). `EXPO_PUBLIC_SUPABASE_*` point at the **cloud** project `recipe-snap`, ref `qpaerdjpqpqtdnxvzvpy`. The local Docker block is commented out.
- `.env.local` also holds `SUPABASE_ACCESS_TOKEN` (PAT, `sbp_…`) and the `OPENAI_API_KEY` (in a comment line). Read secrets from this file at runtime — never hardcode them in commands you write back.
- The `supabase` MCP in `.mcp.json` is `--read-only` and its tools are usually **not connected** in-session. Don't rely on it; use the Management API or CLI directly.
- **Network is sandboxed.** Any `curl`/`npx expo`/`supabase` command that hits the network needs the Bash sandbox disabled.

## Run the app on a phone (tunnel + QR)

A device can't reach `127.0.0.1` in a Codespace, so use **tunnel mode** (ngrok via `@expo/ngrok`, already installed). The `exp://` URL and QR only print to a real terminal — in headless/background mode Expo suppresses them, so run under a PTY with `script`:

```bash
# start (background); -c clears Metro cache (use after installing deps)
script -qfc "npx expo start --tunnel" /tmp/expo-pty.log >/dev/null 2>&1   # run_in_background + sandbox off
```

Then read the URL and render a scannable QR:

```bash
grep -aoE "exp://[a-z0-9-]+\.exp\.direct" /tmp/expo-pty.log | head -1
cd /tmp && npm i qrcode-terminal --no-save --silent
node -e "require('/tmp/node_modules/qrcode-terminal').generate(process.argv[1],{small:true})" "exp://…"
```

The user scans with **Expo Go** (this is a managed app, not a dev client). Do **not** pass `--android`/`--ios` — those try to launch a local emulator via `adb` and crash (no SDK in the Codespace). After changing `.env.local` or adding native deps, restart with `-c`.

## Manage the cloud backend (Management API)

The project is **not** linked via `supabase link` (that needs the DB password). Run SQL and set secrets through the Management API with the PAT — no DB password required. Helper for running a `.sql` file:

```js
// /tmp/runsql.mjs — PAT=… REF=… node /tmp/runsql.mjs path/to.sql
import { readFileSync } from 'fs';
const r = await fetch(`https://api.supabase.com/v1/projects/${process.env.REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.PAT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: readFileSync(process.argv[2], 'utf8') }),
});
console.log(r.status, (await r.text()).slice(0, 1500));
```

Common operations (read `PAT`/`REF` from `.env.local`; sandbox off):

- **Apply migration / seed:** `node /tmp/runsql.mjs supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
- **Ad-hoc query:** `POST /v1/projects/{ref}/database/query` with `{"query":"select …"}`. Quote the JSON carefully — shell single-quote stripping has bitten this before; prefer the node helper or a heredoc.
- **Set secrets:** `POST /v1/projects/{ref}/secrets` with `[{"name":"OPENAI_API_KEY","value":"…"},{"name":"OPENAI_MODEL","value":"gpt-4o-mini"}]`.
- **List/inspect:** `GET /v1/projects/{ref}` (status), `…/functions` (deployed), `…/secrets` (names only), `…/api-keys?reveal=true` (anon/publishable/service keys).

## Deploy edge functions

Use the CLI (PAT via env, no DB password). Functions: `import-recipe`, `ai-tools` (both need `OPENAI_API_KEY`). Deployed with `--no-verify-jwt` so guest mode works:

```bash
export SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN' .env.local | cut -d= -f2)
npx supabase functions deploy import-recipe --project-ref qpaerdjpqpqtdnxvzvpy --no-verify-jwt
npx supabase functions deploy ai-tools     --project-ref qpaerdjpqpqtdnxvzvpy --no-verify-jwt
```

Smoke-test: `POST https://qpaerdjpqpqtdnxvzvpy.supabase.co/functions/v1/ai-tools` with the anon key as both `apikey` and `Authorization: Bearer`, body `{"tool":"substitute","ingredient":"butter","recipe":{"title":"x","ingredients":[{"qty":1,"unit":"","item":"butter"}],"steps":[]}}` → expect a `substitutions` array.

## Auth users (Auth Admin API)

Needs the **service_role** key (get via `…/api-keys?reveal=true`), sent as both `apikey` and `Authorization: Bearer`, against `https://{ref}.supabase.co/auth/v1/admin/users`:

- **List:** `GET …/admin/users` → check `email_confirmed_at`.
- **Force-confirm a user:** `PUT …/admin/users/{id}` with `{"email_confirm": true}`.

## Verify changes

Always run `npx tsc --noEmit` after edits. Reload Expo Go to see UI changes; restart Metro with `-c` after dep/env changes.

## Conventions

- Match existing component style: `useApp()` for app state (`src/store/AppState.tsx`), `useTheme()` for tokens, atoms from `src/components/atoms.tsx` (`Sheet`, `Tag`, `PrimaryButton`, etc.). Persisted user state lives in `UserState` (`src/lib/repo.ts`) and syncs to the `user_state` table automatically.
- New Expo native modules: install with `npx expo install <pkg>` (version-matched, Expo-Go-compatible), then restart Metro with `-c`.
