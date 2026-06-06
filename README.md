# Recipe-Snap

A cross-platform (iOS + Android) recipe app built with **Expo / React Native**, a
**Supabase** backend, and **OpenAI** for AI-powered recipe import and cooking
tools. The UI is a faithful port of the *Recipe-Snap* design handed off from
[Claude Design](https://claude.ai/design) — a ReciMe-style app for importing,
planning, shopping for, and cooking recipes.

## Features

- **Onboarding** — welcome + 3 value slides + taste preferences
- **Home** — greeting, search, category pills, recipe grid
- **Search** — live filtering, trending searches, browse-by-category, filter sheet
- **Recipe detail** — stat circles, serving **scaling**, numbered steps, nutrition macros, AI tools (**Scale / Substitute / Make easier**), and **share & export** (copy link, native share sheet, print, save as **PDF**)
- **Import (hero flow)** — paste from Instagram / TikTok / YouTube / website / photo → AI extraction → editable preview → save
- **Cook mode** — full-screen step-by-step with timers and screen-keep-awake; finishing a cook records it to your **cooked history with a star rating**
- **Meal planner** — weekly calendar with breakfast / lunch / dinner slots
- **Smart grocery list** — grouped by aisle or recipe, progress, order-delivery flow
- **Dietary preferences** — pick diets in Settings to filter the home feed and search to matching recipes
- **Cookbooks**, **Profile / social** (created / saved / cooked tabs), **Notifications**, **Settings**
- **Light + dark mode** and an **accent-colour picker** in Settings (the canonical "Sunny" visual direction)

## Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 54, React Native 0.81, expo-router (file-based) |
| Language | TypeScript |
| UI | react-native-svg icons, expo-image, expo-linear-gradient, Plus Jakarta Sans |
| Device | expo-clipboard, expo-print, expo-sharing (recipe share / print / PDF export) |
| State | React context + AsyncStorage (offline-first) |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | OpenAI, called **server-side** from Supabase Edge Functions |

## Project structure

```
src/
  app/                 expo-router routes
    _layout.tsx        providers (theme, auth, app state) + root stack
    index.tsx          gate → onboarding / auth / tabs
    onboarding.tsx  auth.tsx
    (tabs)/            home, cookbooks, planner, grocery, profile + pill tab bar
    recipe/[id].tsx    cook/[id].tsx  cookbook/[id].tsx
    import.tsx  search.tsx  notifications.tsx  settings.tsx  checkout.tsx  cook-done.tsx
  components/          Icon, Txt, atoms, RecipeCard, Home, Screen, CookbookCover
  theme/               tokens (Sunny), ThemeProvider (accent + dark, persisted)
  data/                seed content + types
  store/               auth + AppState contexts
  lib/                 supabase client, repo (data access), ai (edge-function client)
  utils/               formatting helpers
supabase/
  migrations/0001_init.sql   schema + RLS + profile trigger
  seed.sql                   shared recipe catalog (generated)
  functions/import-recipe/   OpenAI recipe extraction
  functions/ai-tools/        OpenAI substitutions + step simplification
  config.toml
.env.example
```

## Running the app

```bash
npm install
npx expo start          # then press i / a, or scan the QR with Expo Go
```

> **Runs with zero config.** Without Supabase/OpenAI credentials the app falls
> back to seeded local data and offline AI stubs, so every screen and flow is
> fully interactive out of the box.

### On a physical phone (e.g. from a Codespace)

A device on another network can't reach the Metro server directly, so use
**tunnel mode** and scan the QR with **Expo Go**:

```bash
npx expo start --tunnel     # uses @expo/ngrok; prints a public exp:// URL + QR
```

Don't pass `--android` / `--ios` from a remote/headless host — those try to
launch a local emulator via `adb` and will fail. Restart with `npx expo start
--tunnel -c` after changing `.env.local` or installing native deps.

> This repo ships a `recipe-snap-ops` Claude Code skill (`.claude/skills/`) that
> automates the tunnel/QR flow and the cloud-backend tasks below.

### Type-check & bundle

```bash
npx tsc --noEmit
npx expo export --platform android  # full Metro bundle
```

## Connecting the backend (optional)

### 1. Create a Supabase project & set env vars

Copy `.env.example` → `.env.local` (Expo loads it automatically; it's gitignored)
and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-sb_publishable key>
```

`EXPO_PUBLIC_*` vars are inlined into the bundle (safe for the anon /
publishable key — **never** put the service-role or OpenAI key here). When
present, the app uses real email/password auth and syncs each user's saved
recipes, meal plan, grocery list, tastes, and cooked history to Postgres.

### 2. Apply the schema + seed

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ref>
supabase db push                            # applies migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # or run seed.sql in the SQL editor
```

> **No DB password handy?** `supabase link` / `db push` need the database
> password. You can instead apply SQL through the Management API with only a
> personal access token (`sbp_…`):
> `POST https://api.supabase.com/v1/projects/<ref>/database/query` with
> `{ "query": "<contents of the .sql file>" }`. (The `recipe-snap-ops` skill
> wraps this.)

`supabase/seed.sql` is generated from the app's seed recipes:

```bash
node scripts/gen-seed-sql.mjs
```

### Local backend (Docker) for development

Instead of a cloud project you can run the whole stack locally:

```bash
npm run db:start          # boots Postgres + Auth (applies migrations + seed.sql)
npx supabase status -o env   # prints API_URL, ANON_KEY, SERVICE_ROLE_KEY
```

Put the printed `API_URL` / `ANON_KEY` into `.env` as `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. (Storage + analytics are disabled in
`config.toml` for a lean local stack — re-enable them for production.)

> **Testing on a physical device:** a phone can't reach `127.0.0.1`. Use a cloud
> project, or forward port `54321` publicly (e.g. the Codespaces **Ports** tab)
> and use that URL. The web build (running in the same environment) works against
> localhost directly.

**Verify auth + sync end-to-end** against the running stack:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_ANON_KEY=<anon key from status> \
npm run test:supabase
```

This checks sign-up, profile auto-creation, `user_state` read/write, the seeded
catalog, and RLS isolation between two users (9 assertions).

### 3. Deploy the OpenAI Edge Functions

The OpenAI key is held **server-side** as a function secret — it never ships in
the app bundle.

```bash
supabase secrets set OPENAI_API_KEY=sk-...
# optional: supabase secrets set OPENAI_MODEL=gpt-4o-mini

supabase functions deploy import-recipe
supabase functions deploy ai-tools
```

- **`import-recipe`** — given a link / pasted text / photo, fetches the page (for
  URLs) or uses vision (for photos) and returns a structured recipe.
- **`ai-tools`** — returns ingredient substitutions or simplified step text.

The app calls these via `supabase.functions.invoke(...)` in `src/lib/ai.ts`, and
gracefully falls back to local results if they're unavailable.

## Data model

- **`recipes`** — shared catalog (world-readable) plus each user's own imports
  (`owner = auth.uid()`, protected by RLS).
- **`profiles`** — auto-created on sign-up via a trigger.
- **`user_state`** — per-user JSON blob (saved recipes, meal plan, grocery
  checks/extras, tastes, cooked history with ratings, dietary preferences),
  RLS-scoped to the owner.

### Auth & sync behaviour

- **Offline-first:** updates apply locally and sync to Postgres in the
  background (debounced). The AsyncStorage cache is namespaced per user, so one
  account never sees another's cached data.
- **Guest → account migration:** anything you build before signing in (saved
  recipes, plan, tastes) is pushed up the first time you log in to an empty
  account.
- **Tokens** auto-refresh only while the app is foregrounded (RN best practice).
- *Known limitation:* avatars from the image picker are stored as a device-local
  URI, so they don't sync across devices yet — wiring uploads to Supabase Storage
  (currently disabled locally) is the follow-up.

## Design notes

- The original design shipped a live "tweaks" panel with three visual directions
  (Sunny / Editorial / Fresh) and several layout/nav/cook-mode variants. This app
  ships the **canonical Sunny** direction the designer landed on, with the
  accent-colour and dark-mode choices exposed in **Settings**.
- Food images load from the Unsplash CDN with a graceful gradient fallback
  (`<Dish/>`), matching the prototype.
