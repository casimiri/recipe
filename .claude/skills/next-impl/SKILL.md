---
name: next-impl
description: Suggest what to implement next in Recipe-Snap — survey the README + codebase for functional gaps and present prioritized, code-grounded candidates. Use when asked "what's next", "what should I build/implement next", "what's missing", or to pick the next feature.
---

# What to implement next

Produce a short, prioritized list of the **next things worth building** in Recipe-Snap, each grounded in a specific file/line — not generic product ideas. The app is feature-complete on the surface, so the job is finding **functional gaps**: features that look done but are static, stubbed, or have a documented follow-up.

## Process

1. **Read `README.md`** — the *Features* list is the surface area; the *Auth & sync behaviour* and *Design notes* sections often name explicit "known limitation" / "follow-up" items. Those are the highest-signal candidates (the author already flagged them).
2. **Probe for gaps** in the codebase. Fast greps that have paid off:
   - Static/seed-backed screens pretending to be live: `grep -rn "from '../data/seed'" src/app` — e.g. a screen that only renders a seed array (notifications did this).
   - Missing capabilities: grep for a module you'd expect but isn't there (`expo-notifications`, upload helpers, search history).
   - In-code admissions: `grep -rn "for now\|TODO\|FIXME\|stub\|fallback\|known limitation\|don't sync\|not.*yet" src`.
   - Persisted-state gaps: compare `UserState` in `src/lib/repo.ts` against what the UI actually tracks — a feature with no backing field usually isn't persisting/syncing.
3. **Cross off what's already done.** Check git log / recent commits and the current branch so you don't re-suggest shipped work (e.g. avatar sync, recent searches, units toggle, cookbooks are done).
4. **Rank by impact × effort.** Prefer: documented follow-ups > static-screen-made-live > self-contained quick wins. Note rough effort (tiny / small / medium).

## Output format

- 3–5 candidates, each: **bold title** + *(effort)*, one-line what's-wrong-today with a `file:line` citation, and a one-line scope of the fix.
- End with a single **recommendation** (highest impact, or the smallest shippable win if they want momentum) and ask which to pick.
- Keep it tight — this is a decision aid, not a spec. Don't start implementing until the user picks one.

## Conventions to respect when scoping

- New persisted state extends `UserState` + `DEFAULT_STATE` in `src/lib/repo.ts` and is exposed through `AppState` (`src/store/AppState.tsx`); hydration merges over `DEFAULT_STATE`, so older rows pick up new fields without a migration.
- Reuse atoms from `src/components/atoms.tsx` and tokens from `useTheme()`.
- Backend changes (Storage buckets, RLS, schema) go in a new `supabase/migrations/000N_*.sql` AND are applied to the live cloud project via the Management API — see the `recipe-snap-ops` skill for the exact `runsql.mjs` helper, PAT/REF source, and sandbox-off requirement.
- After any code change, run both gates: `npx tsc --noEmit` and `npm run lint` (0 errors; pre-existing warnings tolerated).
