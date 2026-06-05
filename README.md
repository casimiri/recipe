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
- **Recipe detail** — stat circles, serving **scaling**, numbered steps, nutrition macros, and AI tools (**Scale / Substitute / Make easier**)
- **Import (hero flow)** — paste from Instagram / TikTok / YouTube / website / photo → AI extraction → editable preview → save
- **Cook mode** — full-screen step-by-step with timers and screen-keep-awake
- **Meal planner** — weekly calendar with breakfast / lunch / dinner slots
- **Smart grocery list** — grouped by aisle or recipe, progress, order-delivery flow
- **Cookbooks**, **Profile / social**, **Notifications**, **Settings**
- **Light + dark mode** and an **accent-colour picker** in Settings (the canonical "Sunny" visual direction)

## Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 56, React Native 0.85, expo-router (file-based) |
| Language | TypeScript |
| UI | react-native-svg icons, expo-image, expo-linear-gradient, Plus Jakarta Sans |
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

### Type-check & bundle

```bash
npx tsc --noEmit
npx expo export --platform ios     # full Metro bundle
```

## Connecting the backend (optional)

### 1. Create a Supabase project & set env vars

Copy `.env.example` → `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

`EXPO_PUBLIC_*` vars are inlined into the bundle (safe for the anon key). When
present, the app uses real email/password auth and syncs each user's saved
recipes, meal plan, grocery list, and tastes to Postgres.

### 2. Apply the schema + seed

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ref>
supabase db push                            # applies migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # or run seed.sql in the SQL editor
```

`supabase/seed.sql` is generated from the app's seed recipes:

```bash
node scripts/gen-seed-sql.mjs
```

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
  checks/extras, tastes), RLS-scoped to the owner.

## Design notes

- The original design shipped a live "tweaks" panel with three visual directions
  (Sunny / Editorial / Fresh) and several layout/nav/cook-mode variants. This app
  ships the **canonical Sunny** direction the designer landed on, with the
  accent-colour and dark-mode choices exposed in **Settings**.
- Food images load from the Unsplash CDN with a graceful gradient fallback
  (`<Dish/>`), matching the prototype.
