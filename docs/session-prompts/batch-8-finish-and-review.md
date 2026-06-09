# Session prompt — Batch 8: launch-readiness finish + whole-build multi-agent review

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> **Two parts, in order.** **Part 1** finishes the launch-readiness long tail (the a11y items Batch 7
> flagged + light polish) — small, safe, verified. **Part 2** is the headline: **launch an agent team
> (a `Workflow`) to review the *entire* `ui` build** the way Ouri will, across every dimension and all 7
> flows — read-only, adversarially verified — and produce one prioritized findings report. Then **review
> gate with Eston** before any large fix. This is the pre-flight check before the `ui → main` PR.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. The redesign's core arc (welcome guide +
diverse-persona a11y capstone) is **complete and live**; this session is about **finishing the tail and
proving the whole build is launch-ready**. First, read these:

- `CLAUDE.md`, `ARCHITECTURE.md` (the 8 flows + the data-layer seam), `DESIGN_SYSTEM.md` (tokens are law).
- **The a11y findings doc** — `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md`. Read **§1a
  Resolution** (what Batch 7 fixed) and the **flagged/deferred long tail** (that's Part 1's worklist).
- **The review prior art** — `docs/session-prompts/REVIEW-AND-REFACTOR-WORKFLOW.md` (the Wave-1 22-agent
  review — the *template* for Part 2's workflow) and `REVIEW-STRUCTURE.md` (read-only GitHub-hygiene check).
- The auto-memory entry `project_ui_redesign_apr2026` (full batch history + conventions).

## What just shipped (Batch 7 — a11y capstone, live — don't regress it)

Deployed to Pages at `ui` HEAD **`5de46cd`**. 14 a11y fixes across the 7 flows + 2 systemic token fixes:
keyboard-accessible discussion cards (stretched-link title button — the one task-blocker), AA error/caption
contrast (incl. fixing the DESIGN_SYSTEM-prescribed `$gray-400` caption bug and the `$error-on-surface`
token), ≥44px shared touch targets (Banner dismiss / NotificationsBell via invisible `::after`, back
buttons), single-h1 mandate page, SlideOutMenu focus-trap + focus-restore. **Invariant:** all presentational
/ localStorage / token-level — **no seam/contract/fixture change; `DEMO_VERSION` stays `global-v4`.**

## How we work (non-negotiable)

- **Branch + seam:** develop on `ui` against the **stub layer** only — everything through
  `src/services/api.ts` / `src/services/demo/`. **Never** call a real server from a component. Keeping this
  boundary clean is *the* thing the `ui → main` handoff to Ouri depends on.
- **Design system is law** (DESIGN_SYSTEM.md): tokens only (no ad-hoc hex/px/rgba; derived `rgba($token,a)`
  OK), AA contrast, focus-visible on every control, ≥44px targets, light + `prefers-color-scheme: dark`,
  flagship **360px**. Strings via `t('ns.key','English default')`. (fr/sw stays English-now — Batch 6
  decision; full parity is a separate wave-1.5 task.)
- **Verify before "done":** `npx tsc -b` **and** `npm run build` both exit 0, then walk the routes in the
  preview (`preview_start({name:"gloki-dev"})`, port 5173) in **light + dark + 360px**. Judge "clean" by
  exit codes + a live DOM check (real `preview_click`/`preview_eval` + short `await`), **not** from source.
  No ErrorBoundary/console errors. Screenshots for fixed surfaces.
- **Commit locally** in small, clearly-described chunks (`Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>` trailer). **Do NOT push** — a push to `origin/ui` auto-publishes to Pages;
  Eston controls the deploy. Hand back when verified; he says "push".
- **Product calls** via the question tool; don't relitigate settled decisions (trust model, the 5-stage
  pipeline, the seam, 1p1v, the Batch 5 redesigns, the welcome guide, the Batch 7 a11y fixes).
- **Slow external drive:** throttle heavy parallel file I/O — small sequential batches (see the memory).

---

## Part 1 — Finish the launch-readiness tail

The a11y findings doc flagged a C-tranche that Eston deferred at the Batch-7 review gate. Now that the
patterns + tokens are set, knock out the safe ones. **Triage first, then fix high-value/low-risk; flag the
rest. Don't gold-plate.** Confirm scope/appetite with Eston (question tool) if any item looks larger than a
quick fix.

- **#2 (systemic) — finish the `$gray-400`-caption sweep.** Batch 7 fixed the audited-flow instances + the
  DESIGN_SYSTEM guidance (`$gray-500` for caption text). Now sweep the rest:
  `grep -rn 'color: $gray-400' src --include='*.module.scss'` → for each, confirm it's *text* on a light
  surface (not decorative/border) and bump to `$gray-500`; re-verify a couple live. Leave a grep-gate note.
- **#15 — heading-level skips.** InitiativeDashboard + Discussion stage/section cards jump H1→H3 (no H2).
  Demote those card headings to `<h2>` where they sit directly under the page h1 — **but first check the
  heading component isn't reused in a context that needs a different level** (make the level a prop if so).
- **#16 — wordmark touch target.** `PageHeader .wordmark` is 40px tall (<44px) — `min-height: 44px`.
- **#18 — CommunityView duplicate heading.** The community name renders as both `<h1>` and `<h2>`; drop or
  repurpose the duplicate so there's one clean h1.
- **Token-debt long tail (flag, mostly out of a11y scope):** ~25 `.module.scss` files carry ad-hoc hex.
  *Triage:* fix any that fail contrast (a11y); for the pure design-token debt (e.g. PageHeader notification
  badge pinks, dialog hexes, `NotificationsBell` `#e6edf7`), either knock out the easy token swaps or flag
  a focused cleanup — Eston's call on appetite.

Each fix: `tsc -b` + `npm run build` clean, live-verify the surface (light/dark/360px), small commit. **No push.**

---

## Part 2 — Launch the agent team: whole-build review (a `Workflow`)

> **This is the explicit opt-in to multi-agent orchestration.** Eston asked for "an agent team to review
> everything." Author and run a **`Workflow`** (read-only) that audits the *entire* `ui` build — the way
> Ouri will when the `ui → main` PR lands. Model it on `REVIEW-AND-REFACTOR-WORKFLOW.md`, **updated** for
> today's state: the lane model is retired, so organize the review by **dimension × the 7 flows**, not by
> lane. All review agents are **read-only** (`Explore` / read-only general-purpose). The workflow **does not
> modify files** — it produces findings; the human/parent session fixes after the gate.

**Scout inline first**, then author the workflow (discover the work-list before orchestrating): list the
routes/flows, the `src/services/` seam surface, the component tree, and skim the build output (note bundle
outliers — e.g. `IdentityCardDialog` was ~484KB). Then run the workflow.

**Phases (≈ the established 5-phase shape):**

1. **Map state** (1 agent) — snapshot: routes/flows, the seam (`api.ts` + `demo/`), shared kit usage,
   `DEMO_VERSION`, bundle outliers, `ui` vs `origin/main` divergence.
2. **Audit dimensions** (parallel, one agent per dimension):
   - **a11y** — confirm the Batch-7 fixes held (no regressions) + any remaining WCAG 2.1 AA gaps across the
     7 flows (contrast, keyboard, roles/labels/headings, live-regions, 44px, 360px, dark).
   - **Design-system compliance** — tokens only (grep ad-hoc hex/px/literal-rgba), dark mode, focus-visible,
     ≥44px, 360px integrity, shared-kit reuse vs re-rolled styles.
   - **Seam integrity (critical for Ouri)** — verify **no component imports/calls a real server**; all data
     flows through `contractRead/Write`/`deployContract`/`joinContract` in `src/services/api.ts`, backed by
     `src/services/demo/`. The stub→server swap must stay a localized change inside `src/services/`. Flag any
     leak (a `fetch`/SSE/axios in a component, business logic in the seam, etc.).
   - **Correctness / regressions** — the 8 flows + global nav still work; `StageGate`/trust gating intact;
     **one person, one vote preserved everywhere (never vote *weight*)**; optimistic-UI rollbacks; no dead ends.
   - **i18n hygiene** — `t()`-wiring, stranded English literals, long-string (~+35%) overflow, RTL-readiness
     (hardcoded `left/right` vs logical props).
   - **Tech debt / code quality** — dead/0-importer components, duplication, type safety (`any`, unsafe
     casts), bundle size (the 484KB outlier), `Date.now()`/`Math.random()` in seedable paths.
   - **Content / UX & vocabulary** — does the journey teach unaided (≥70%)? `initiative`=effort /
     `problem`=Stage-1 vocab consistent? copy/empty-states coherent? felt transnational collaboration?
3. **Per-flow review** (parallel, one agent per the 7 flows: onboarding, stage feed, Stage-2 co-authoring,
   Stage-5 mandate, initiative dashboard, community home, identity/about) — Ouri's lens: *"if you do ONE
   thing to make this flow more correct / elegant / reviewable, what is it?"*
4. **Adversarially verify** (parallel) — every `blocker`/`refactor` finding gets a skeptic prompted to
   **refute** it; default to "not real" if uncertain. **Seam + regression claims must be confirmed against
   the live preview, not asserted from source.** Drop findings that don't survive.
5. **Synthesize** (1) — top issues, recurring themes, a **prioritized fix list (severity × effort)**, quick
   wins, deferred/dropped, and a one-line **`ui → main` readiness verdict**.

**Schemas** (mirror the prior workflow):
`FINDINGS = { findings: [{ severity ∈ blocker|refactor|polish|note, dimension, flow, location, issue,
evidence, recommendation }] }` ·
`SYNTHESIS = { topIssues, themes, fixList:[{ severity, effort:S|M|L, dimension, fix }], quickWins,
deferred, uiToMainReadiness }`.

**North stars baked into the synthesis prompt:** usability-first (≥70% complete the journey unaided) + felt
transnational collaboration · one person, one vote (never plutocratic) · deliberation precedes aggregation ·
the seam stays clean (Ouri swaps stubs → server with a localized change) · design system is law · elegance
over verbosity for Ouri's review.

**Output:** one report at `docs/superpowers/specs/<run-date>-batch8-build-review-findings.md` (severity ×
effort table + the readiness verdict). Commit it. **Then REVIEW GATE with Eston** — present the prioritized
list; he sets the fix appetite. **Do not start large fixes before that.** Then fix the agreed items in small
local commits (each verified live), and **flag** the long tail. **No push.**

> Sizing note: scale the fleet to the task — a thorough pre-launch review warrants the full dimension panel +
> per-flow agents + a real adversarial-verify pass. But it's read-only and bounded; don't let it sprawl past
> the phases above.

## Demo facts you'll want (save time)

- **Preview authed routes:** the real `Get Started` login can't complete in the sandbox (`AuthContext.login`
  opens an SSE to the real server). **Seed instead:** `localStorage.setItem('user', JSON.stringify({
  publicKey:'<64 alphanumeric chars>', serverUrl:'https://gdi.gloki.contact' }))` then navigate
  (`isAuthenticated` derives from Redux `user.publicKey`+`serverUrl`). For `/welcome`: seed `user` but leave
  `gloki.digitalAgent`/`gloki.onboarding` unset.
- **Seeded data:** real initiatives at every stage (`src/services/demo/seedDemoCommunity.ts`). A live
  initiative: community `demo-comm-mq4adhe7-daa1ds1b`, initiative `demo-init-mq4adhe8-0rr7tgxb`. Dashboard:
  `/initiative/<encServerUrl>/<encPublicKey>/<communityId>/<initiativeId>/roadmap` (swap `/roadmap`→`/discussion`
  for co-authoring); mandate: `/mandate/<communityId>/<initiativeId>`.
- **`preview_click` focuses inputs but synthetic clicks don't *blur* them** — onBlur-gated UI (field errors,
  some dropdowns) won't trigger that way; use the element's own affordances or seed state (e.g. LoginPage
  reads `localStorage.loginError` on mount to render the error block without a network call).
- The preview defaults to the system colour scheme — **always test light *and* dark explicitly**
  (`preview_resize({colorScheme})`); several issues only show in one mode (e.g. `$gray-400` fails on white,
  passes on dark).
- **Slow drive:** the dev preview server may idle-stop between long gaps — just `preview_start` again.

## When done

- `npx tsc -b` + `npm run build` clean; Part-1 fixes verified in the preview (light + dark + 360px) with
  screenshots; the **build-review findings report committed**; any post-gate fixes in small local commits.
- **Do not push.** Hand back to Eston with: a brief Part-1 summary (fixed vs flagged), the review report's
  top issues + the **`ui → main` readiness verdict**, and anything broader than expected.

> **Roadmap after this:** with launch-readiness confirmed, the next move is the **`ui → main` review PR with
> Ouri** (see `REVIEW-STRUCTURE.md` + PR #20) and/or **fr+sw multilingual parity** (the wave-1.5 task).
