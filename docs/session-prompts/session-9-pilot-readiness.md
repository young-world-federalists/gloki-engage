# Session 9 — Pilot-readiness quick wins (P0)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The whole redesign arc
(Wave 1 → UX-overhaul → the S1–S6 consistency/pipeline roadmap → S7 consolidation → S8 Minors + i18n packet)
is **complete and deployed** on `origin/ui`. On 2026-06-29 a **nine-persona milestone review** ran against
the live preview and `MASTER_TODO.md` §7 was restructured into a build-ordered roadmap (P0–P6) with the
findings logged in §8. **This session is P0 — the cheap, self-contained, highest-trust fixes.** It is
implementation work: spec → plan → build, on the stub layer. Not a redesign.

## Read first (carry the context)
- `MASTER_TODO.md` §1–2 (the two north-stars + the Voices-for-the-Climate mission), §3 (philosophy — note
  how **one-person-one-vote and quadratic voting coexist**: everyone gets an equal *budget* of voice [1p1v,
  Sybil-resistant, no plutocracy]; QV is how you *spend* that equal budget across issues), §7 **P0**, §8.
- Project memory: `project_session8_jun2026`, `project_consistency_pipeline_redesign_jun2026` (the
  Solutions→Vote→Mandate spine), `project_hierarchy_a11y_review_jun2026` (AA gates + the 5 redesign
  primitives), and the `MEMORY.md` index.
- `CLAUDE.md` (branch model + seam rule), `DESIGN_SYSTEM.md` (tokens, AA, the shared primitives),
  `docs/FOR_OURI_seam.md` (contract seam).

## Open with one decision (recommend-then-confirm)
The **claims-honesty BLOCKER** is mostly copy, but it rests on a product framing only Eston can lock:
the personas read "one person, one vote — no one can buy more say" as contradicting the quadratic ballot.
Per §3 they're compatible (equal budget vs. how you spend it). **Confirm the framing with Eston** — keep
1p1v *and* QV, and rewrite the copy to explain the relationship (recommended) — before touching strings.
Also confirm the "blockchain-backed/transparent" wording: soften to what the UI can actually show, or leave
for the backend track. Everything else in P0 is unambiguous; proceed once the framing is set.

## Scope — P0 (see MASTER_TODO §7 for the full list)
1. **[BLOCKER] Claims honesty (copy).** Reconcile 1p1v ↔ QV wording (onboarding step 3, About, ballot);
   "no ID papers / face scan" ↔ "confirming real-world identity" (onboarding step 2 ↔ Identity & Trust page);
   qualify "blockchain-backed". Add a plain **"what's public · private · permanent"** line at the ballot and
   the comment composer. New/changed strings ship at **fr + sw parity** (en inline default).
2. **[BLOCKER] Make the back half reachable (demo data).** Seed ≥1 un-gated initiative that sits at the
   Solutions & Vote stages so a fresh demo user reaches the live QV ballot + interactive `SolutionsBoard`.
   Seed discussion threads consistently (some currently have only the user's own comment). **Bump
   `DEMO_VERSION` (mockApi.ts) to global-v13** since demo fixtures change.
3. **[BLOCKER] A11y: announce comment posts.** `aria-live` status ("Comment posted") + move focus to the new
   comment in `ThreadedDiscussion` (WCAG 4.1.3).
4. **[MAJOR] Inviter-country default bug.** The profile country pre-fills the *inviter's* country and rides to
   profile/mandate — default empty (or locale-guess), required + visibly unset. (Onboarding step 4 / profile.)
5. **[MAJOR] A11y micro-fixes.** Like button `aria-label` must include the count; **extend the S8 `.liked` AA
   fix to the base `.actionBtn`** (gray-500 ≈ 4.0:1 → AA — same `ThreadedDiscussion.module.scss`); localize
   `<title>`; fix "across 1 countries" pluralization (mandate adoption); add stage to the discussion `<h1>`;
   de-dupe the community heading; `aria-haspopup` on the menu button.
6. **[MINOR] Momentum + affordance.** SolutionsBoard threshold bar reacts to an upvote; whole feed/problem
   card is tappable (not only the inner button).

> Two of these connect straight to S8: the **gray-500 base-button contrast** is the un-liked sibling of the
> `.liked` fix, and the **empty mandate KPI targets** (P4, not this session) are the data behind the S8 `<dd>`
> change — leave P4 for later but don't be surprised by empty `target`/`title` in the spec.

## Workflow + constraints (same discipline as S1–S8)
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a
  component. The demo seam emits **no `contract_write` events** → re-fetch after writes.
- **Tokens only**; reuse the kit + the 5 redesign primitives (AppHeader / InfoDisclosure / StageStrip /
  CountryMultiSelect / Banner-role) + `UserIdentity` + `CountryPresence`. 360px flagship; verify **light +
  dark**; **AA gates** per `DESIGN_SYSTEM.md`.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys, en inline via
  `t('key','English')`). Run the parity check (sorted-key diff empty) + a code-ref↔i18n cross-check after any
  i18n change.
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` tools (`gloki-dev`, port 5173) at 360px. **Bump `DEMO_VERSION` → global-v13** (demo data
  changes this session).
- For multi-file changes use spec → `superpowers:writing-plans` → `superpowers:subagent-driven-development`
  (fresh implementer/task, cheapest tier when the plan carries full code; per-task spec+quality review; Opus
  whole-branch review at the end). Ledger namespaced `.superpowers/sdd/s9-*`; clean only your own at the end.
  Do your own grep cross-check for i18n parity / dead code.
- **Gate:** local multi-model review panel (`/code-review` → `local-review`) on the session diff — do **not**
  pass `--free-ram` / `--quit-chrome` (Eston keeps Chrome open). Usually zero diff-coverage /
  false-positives-only — if so, say so and lean on per-task + Opus reviews (accepted S5–S8).
- Repo is on a **slow external USB drive** — throttle to small sequential I/O; subagents avoid heavy parallel
  greps. The preview is a single shared browser — drive it one agent at a time.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence.
- Update project memory after the session.

When ready, ask Eston the claims-honesty framing decision first, then proceed P0 top-to-bottom (the BLOCKERs
deliver the most trust per line).
