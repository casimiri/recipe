---
name: update-docs
description: Update README.md to reflect the current state of the Recipe-Snap codebase — sync the Features list, Tech stack, Project structure, Data model, and Auth & sync notes after a change. Use when asked to update the docs/README, document a new feature, or after shipping work that changes user-facing behavior, schema, env, or deps.
---

# Update the README

Keep `README.md` an accurate, current description of Recipe-Snap. The goal is a README that a new contributor (or future you) can trust — every claim reflects what the code actually does today. Edit surgically; don't rewrite sections that are still correct.

## Process

1. **Find what changed.** Don't guess from memory — diff against the docs.
   - `git diff --stat main...HEAD` and `git log --oneline -8` for the shape of recent work.
   - `git status` for uncommitted edits.
   - For a specific feature, read the touched files (routes in `src/app`, state in `src/lib/repo.ts` + `src/store/AppState.tsx`, backend in `supabase/`).
2. **Map each change to its README section** (current layout):
   - **Features** (the bulleted list) — any new/changed user-facing flow. Match the existing voice: bold the feature name, terse, mention the screen it lives on.
   - **Tech stack** table — new libraries/deps (`npx expo install` additions), new tooling.
   - **Project structure** tree — new files/dirs under `src/` or `supabase/`.
   - **Running / Connecting the backend** — new env vars, setup steps, edge functions, or commands.
   - **Data model** — new tables, columns, Storage buckets, or `user_state` fields. Keep the bullet style (`**name**` — what it holds + RLS note).
   - **Auth & sync behaviour** — changes to offline/sync, guest migration, or known limitations. When a documented *"known limitation" / follow-up* is resolved, replace it with how it now works (don't just delete it).
   - **Design notes** — visual/UX direction changes.
3. **Edit only the affected lines** with the Edit tool. Preserve surrounding formatting, the `> blockquote` callouts, and code-fence languages.
4. **Verify claims before writing them.** If you state a command, env var, table, or field, confirm it exists in the repo. A wrong README is worse than a stale one.

## Conventions

- **Voice:** concise, present tense, user-facing first. Bold the feature/term, then a short clause. Mirror the density of the existing bullets — don't pad.
- **Don't duplicate** operational detail that belongs in the `recipe-snap-ops` skill (PAT/Management-API mechanics, tunnel/QR flow). The README points at that skill; keep it that way.
- **`user_state` fields:** when you add a persisted field, list it in the Data model `user_state` bullet alongside the others (saved, plan, grocery, tastes, cooked, diet, units, cookbooks, recentSearches, reminders, …).
- **Storage buckets / schema:** if a migration added it, document the bucket/table here AND ensure the migration exists in `supabase/migrations/` (the README is the human-facing mirror of the schema).
- Today's date is available in context — use absolute dates if you ever add a changelog line; don't write "recently".

## After editing

- Re-read the changed sections once to confirm they read cleanly and nothing contradicts another section (e.g. a feature listed but its limitation still claimed).
- No build/lint gate applies to Markdown, but if the change references code you also touched, make sure that code is in the working tree.
