# Recipe-Snap

A cross-platform (iOS + Android) recipe app built with **Expo / React Native**, a
**Supabase** backend, and **OpenAI** for AI-powered recipe import and cooking
tools. The UI is a faithful port of the *Recipe-Snap* design handed off from
[Claude Design](https://claude.ai/design) — a ReciMe-style app for importing,
planning, shopping for, and cooking recipes.

## Features

- **Onboarding** — welcome + 3 value slides + taste preferences
- **Home** — greeting, search, category pills, recipe grid **personalized by your onboarding tastes** (matching recipes float to the top; shows as "For you")
- **Search** — live filtering, trending searches, **recent searches** (per-user, synced), browse-by-category, filter sheet
- **Recipe detail** — stat circles, serving **scaling**, numbered steps, nutrition macros, **rate it yourself** (your star rating blends into the shown score), AI tools (**Scale / Substitute / Make easier**), **add to cookbook**, and **share & export** (copy link, native share sheet, print, save as **PDF**)
- **Import (hero flow)** — paste from Instagram / TikTok / YouTube / website, **snap a photo with the camera**, or write your own → AI extraction (vision for photos, which also become the recipe’s image) → editable preview → save to your library, optionally filing it into one of your cookbooks
- **Cook mode** — full-screen step-by-step with step **timers** (fire a local **notification** when they finish, so they alert you even if the app is backgrounded) and screen-keep-awake; finishing a cook records it to your **cooked history with a star rating**
- **Meal planner** — weekly calendar with breakfast / lunch / dinner slots, plus an optional **meal reminders** toggle that schedules weekly local notifications ("Time to cook X") for planned meals
- **Smart grocery list** — **auto-generated from your meal plan**: the planned recipes' ingredients are aggregated (duplicates merged across recipes, quantities summed and shown in your unit system) and grouped by aisle or recipe, with progress, **add/remove your own items**, and an order-delivery flow
- **Dietary preferences** — pick diets in Settings to filter the home feed and search to matching recipes
- **Cookbooks** — browse, **create and delete your own**, and add/remove recipes (new accounts start with a few **starter cookbooks** built from the catalog); plus **Profile** (created / saved / cooked tabs, with **star ratings + re-rate** on cooked recipes, and live **recipes / cookbooks / cooked** counts), **Notifications** (a real **activity feed** — your cooks, saves, meal-plan adds and imports, plus cook-timer reminders — with an unread badge), **Settings**
- **Languages** — **English, French, Spanish, German**; defaults to the device language and switchable in Settings. Translates the whole UI, the seed recipe catalog (titles/descriptions/ingredients/steps), and **AI output** — imported recipes and the Substitute / Make-easier tools come back in the active language (enum-ish fields stay English so filtering keeps working)
- **Units** — switch ingredient quantities between **metric and imperial** in Settings; conversion flows through recipe detail, cook mode, the grocery list, and exports
- **Export** — save your created + saved recipes as a single PDF from Settings
- **Recipe-Snap Pro** — free users get a set number of **AI actions per month** (recipe imports + Substitute / Make-easier); a **paywall** offers **Pro** for unlimited AI. Price and free quota are **admin-configurable** (a Supabase config row). The purchase is a **mock** flow (no real charge) with the payment call isolated so it can be swapped for Stripe / store IAP later
- **Theme** — **System / Light / Dark** mode and an **accent-colour picker** in Settings (the canonical "Sunny" visual direction)

## Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 54, React Native 0.81, expo-router (file-based) |
| Language | TypeScript |
| UI | react-native-svg icons, expo-image, expo-linear-gradient, Plus Jakarta Sans |
| Device | expo-image-picker (camera + library), expo-clipboard, expo-print, expo-sharing, expo-notifications (local cook-timer reminders) |
| State | React context + AsyncStorage (offline-first) |
| i18n | expo-localization (device locale) + a typed `tr()` selector, 4 languages |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | OpenAI, called **server-side** from Supabase Edge Functions |
| Quality | TypeScript (`tsc --noEmit`), ESLint (`eslint-config-expo`) |

## Project structure

```
src/
  app/                 expo-router routes
    _layout.tsx        providers (theme, auth, app state) + root stack
    index.tsx          gate → onboarding / auth / tabs
    onboarding.tsx  auth.tsx  reset-password.tsx
    (tabs)/            home, cookbooks, planner, grocery, profile + pill tab bar
    recipe/[id].tsx    cook/[id].tsx  cookbook/[id].tsx
    import.tsx  search.tsx  notifications.tsx  settings.tsx  checkout.tsx  cook-done.tsx
  components/          Icon, Txt, atoms, RecipeCard, Home, Screen, CookbookCover
  theme/               tokens (Sunny), ThemeProvider (accent + dark, persisted)
  data/                seed content + types
  store/               auth + AppState contexts
  lib/                 supabase client, repo (data access), ai (edge-function client), share (print/PDF/export HTML), notify (local cook-timer notifications)
  i18n/                I18nProvider + tr() selector, ui/{en,fr,es,de} dictionaries, enums + recipe content localization
  utils/               formatting helpers (incl. metric↔imperial unit conversion) + grocery-list builder
supabase/
  migrations/                0001 schema · 0002 avatars bucket · 0003 billing
  seed.sql                   shared recipe catalog (generated)
  functions/import-recipe/   OpenAI recipe extraction (AI-quota gated)
  functions/ai-tools/        OpenAI substitutions + step simplification (AI-quota gated)
  functions/subscribe/       mock Pro purchase (flips subscriptions.pro)
  functions/delete-account/  removes the user's rows, avatars + auth record
  functions/_shared/         cors + billing helpers (quota / Pro checks)
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

### Type-check, lint & bundle

```bash
npx tsc --noEmit                    # or: npm run typecheck
npm run lint                        # ESLint (eslint-config-expo)
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

# Lets import-recipe persist the user's photo to Storage as the recipe image.
# (The platform-injected SUPABASE_* vars aren't reliably available at runtime,
#  so set these explicitly.)
supabase secrets set SB_URL=https://<ref>.supabase.co
supabase secrets set SB_SERVICE_ROLE_KEY=<service-role key>

supabase functions deploy import-recipe
supabase functions deploy ai-tools
supabase functions deploy subscribe
```

- **`import-recipe`** — given a link / pasted text / photo, fetches the page (for
  URLs) or uses **vision** (for photos) and returns a structured recipe. For
  photo/screenshot imports it also uploads the photo to the `recipe-images`
  Storage bucket and uses that as the recipe's hero image (so the imported
  recipe shows a relevant picture, not a stock one).
- **`ai-tools`** — returns ingredient substitutions or simplified step text.
- **`subscribe`** — mock Pro purchase: flips the signed-in user's
  `subscriptions.pro`, valid for **one month** from the purchase date (the single seam a real Stripe/RevenueCat/IAP
  integration would replace).

Both AI functions accept a `lang` field (the active UI language) and respond in
it: `import-recipe` writes the recipe's free text (title/desc/ingredients/steps)
in that language while keeping enum-ish fields (meal/difficulty/cuisine/tags) in
English so filtering still works; `ai-tools` answers in the language too. They
also **enforce the free monthly AI quota** for signed-in non-Pro users (via the
shared `_shared/billing.ts` helper) — guests are gated client-side instead.

**Admin: change the price or free quota** by updating the `app_config` row, e.g.
`update public.app_config set price_cents = 299, free_ai_quota = 10 where id = 'default';`
(run via the SQL editor or the Management API — see the `recipe-snap-ops` skill).

**Cancelling a subscription.** The mock has no auto-renew, so a subscription
simply **lapses one month after purchase** (once `subscriptions.renews_at` is in
the past the user reverts to the free tier on next load). There is no in-app
cancel button — to cancel/revoke a user's Pro in the mock, act on the
`subscriptions` row in Supabase (SQL editor or Management API):

```sql
-- revoke Pro immediately
update public.subscriptions set pro = false, renews_at = null where user_id = '<uid>';
```

(To instead let it expire at the end of the paid month, do nothing — without
auto-renew it lapses on its own when `renews_at` passes.)

With real **store subscriptions** the user cancels in the **App Store / Play
Store** (the stores require it, not the app); a RevenueCat/store webhook would
then clear `subscriptions.pro` here — the same row the mock writes.

The app calls these via `supabase.functions.invoke(...)` in `src/lib/ai.ts`, and
gracefully falls back to local results if they're unavailable.

The photo import needs a **public Storage bucket** named `recipe-images`. Create
it in the dashboard (Storage → New bucket → public), or via SQL:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 10485760,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
```

(`[storage]` is enabled in `config.toml` for local dev too.)

## Data model

- **`recipes`** — shared catalog (world-readable) plus each user's own imports
  (`owner = auth.uid()`, protected by RLS).
- **`profiles`** — auto-created on sign-up via a trigger.
- **`user_state`** — per-user JSON blob (saved recipes, meal plan, grocery
  checks/extras, tastes, cooked history with ratings, your own per-recipe
  ratings, dietary preferences,
  unit system, cookbooks (seeded with starter collections for new accounts),
  recent searches, app-generated reminders
  + a last-seen timestamp for the notifications badge, and the cached Pro flag +
  monthly AI-usage counter), RLS-scoped to the owner.
- **`app_config`** — single admin-tunable row (monthly `price_cents`, `currency`,
  `free_ai_quota`); world-readable so the app can show the price and enforce the
  quota, writable only by the service role (admin via SQL/dashboard).
- **`subscriptions`** — authoritative per-user Pro state (`pro`, `renews_at`) +
  AI usage (`ai_period`, `ai_count`); users read their own row, only the edge
  functions (service role) write it.
- **Storage `recipe-images`** — public bucket holding photos captured during
  import; the uploaded photo becomes the imported recipe's hero image.
- **Storage `avatars`** — public bucket holding profile photos, namespaced per
  user (`<uid>/…`, RLS write-scoped to the owner); the public URL is stored on
  `profiles.avatar` so it renders and syncs across devices.

### Auth & sync behaviour

- **Offline-first:** updates apply locally and sync to Postgres in the
  background (debounced). The AsyncStorage cache is namespaced per user, so one
  account never sees another's cached data.
- **Guest → account migration:** anything you build before signing in (saved
  recipes, plan, tastes) is pushed up the first time you log in to an empty
  account.
- **Tokens** auto-refresh only while the app is foregrounded (RN best practice).
- **Password reset:** the sign-in screen's **Forgot password?**
  (`supabase.auth.resetPasswordForEmail` with a `redirectTo` deep link) emails a
  recovery link that **opens the app** on a **set-a-new-password** screen
  (`app/reset-password.tsx` → `supabase.auth.updateUser`), which establishes the
  recovery session from the link, validates the new password, and signs you in.
  The deep-link scheme (`recipesnap://reset-password`, plus an `exp://` pattern
  for Expo Go) must be in the project's auth **redirect allow-list**. *Note:*
  custom schemes only resolve in a **dev/standalone build**, so completing the
  link in **Expo Go** is unreliable (the in-app screen itself works).
- **Account management:** Settings → **Delete account** calls the
  `delete-account` function to remove the user's rows, avatars and auth record
  (irreversible, behind a confirm).
- **Avatars sync:** a profile photo picked from the library is uploaded to the
  public `avatars` Storage bucket on save, and its public URL is stored on
  `profiles.avatar` — so it renders across devices. If the upload fails (or in
  guest mode) the app keeps the device-local URI so the rest of the profile
  still saves.
- **Cook-timer notifications:** step timers schedule a **local** notification
  (`src/lib/notify.ts`) that fires at the end even when the app is backgrounded,
  and log an in-app reminder shown on the Notifications screen. *Known
  limitation:* local notifications were removed from **Expo Go on Android**
  (SDK 53+), so the OS alert no-ops there (the in-app timer + reminder still
  work) — use a dev/standalone build or Expo Go on iOS to see it fire.

## Design notes

- The original design shipped a live "tweaks" panel with three visual directions
  (Sunny / Editorial / Fresh) and several layout/nav/cook-mode variants. This app
  ships the **canonical Sunny** direction the designer landed on, with the
  accent-colour and dark-mode choices exposed in **Settings**.
- Food images load from the Unsplash CDN with a graceful gradient fallback
  (`<Dish/>`), matching the prototype.
- **i18n** mirrors the theme: `I18nProvider` defaults to the device locale, persists
  the choice to AsyncStorage, and reloads it on launch. Translation uses a type-safe
  selector — `tr((s) => s.settings.title)` — and every language implements the full
  `UIStrings` shape, so a missing key is a compile error. Recipe enum fields
  (cuisine/meal/difficulty/tags) stay English in the data for filtering and are
  localized at display time via `trEnum()`; free-text recipe fields are overlaid by
  `localizeRecipe()` in `AppState`, so they translate app-wide.
