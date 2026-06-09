# Maintenance

Maintainer-facing log for Recipe-Snap. README.md is the user-facing mirror; this file tracks change history, deferred work, and operational gotchas.

## Changelog

- 2026-06-09 — Reviews on the recipe detail screen: own review pinned on top ("Your review"), inline list capped at 3 with a "Show all N reviews" toggle, each review now shows a relative timestamp (`src/app/recipe/[id].tsx`; reuses `timeAgo` from `src/utils/format.ts`; new i18n `recipe.yourReview` + `recipe.showAllReviews` in en/fr/es/de). The DB query already returned newest-first (`listReviews`, `src/lib/repo.ts`).

## Known limitations & follow-ups

- **Cooked log has no notes** — `CookLog` (`src/lib/repo.ts`) stores only `{ id, rating, at }`; the cook-done screen captures a rating but no free-text note. Candidate next feature (rides the `user_state` blob, no migration).
- **Single rolling-week meal planner** — `WeekPlan` is keyed by weekday name only (`src/data/types.ts`), so there is exactly one week; no date-based or multi-week planning. Re-keying touches the grocery aggregator and the Home "Today" card.
- **No "search my library" scope** — Home/Search filter the whole catalog (`src/app/search.tsx`); there's no saved-only/own-recipes search scope.
- **Local notifications no-op in Expo Go on Android** (SDK 53+) — cook-timer/meal alerts (and tap-to-open) don't fire there; the in-app timer + reminder still work. Use a dev/standalone build or Expo Go on iOS. (README → Auth & sync behaviour.)
- **Password-reset deep link unreliable in Expo Go** — custom `recipesnap://` schemes only resolve in a dev/standalone build; the in-app reset screen itself works. (README → Auth & sync behaviour.)
- **Mock Pro purchase** — `subscribe` flips `subscriptions.pro` with no real charge and no in-app cancel; cancel/revoke is a SQL edit. The payment call is isolated as the single Stripe/RevenueCat/IAP seam.

## Schema & migrations

All under `supabase/migrations/`; applied to the cloud project (ref `qpaerdjpqpqtdnxvzvpy`).

- `0001` — initial schema (recipes, profiles, user_state, app_config, subscriptions + RLS)
- `0002` — `avatars` Storage bucket
- `0003` — billing (subscriptions / AI usage)
- `0004` — `recipe_reviews` table
- `0005` — review→rating recompute trigger (`recompute_recipe_rating`)
- `0006` — `ingredient-images` Storage bucket
- `0007` — `step-images` Storage bucket
- `0008` — `recipe-images` upload RLS (owner-scoped `<uid>/…` writes)

## Operational gotchas

- App env lives in `.env.local` (gitignored); `EXPO_PUBLIC_SUPABASE_*` point at the cloud project. Restart Metro with `-c` after changing it.
- Edge functions read the explicit `SB_URL` / `SB_SERVICE_ROLE_KEY` secrets for Storage — the platform-injected `SUPABASE_*` vars aren't reliably readable at runtime, and the reserved `SUPABASE_` prefix can't be used for new secrets.
- Functions are deployed `--no-verify-jwt` so guest mode works.
- Running the app on a phone, deploying functions, applying SQL/secrets, and auth-admin tasks are all automated by the `recipe-snap-ops` skill (tunnel/QR, Management-API helper, PAT/REF source, sandbox-off requirement) — see it rather than duplicating the mechanics here.
