# Session prompt — Batch 9b: finish the cleanup waves (W2 remainder → W3 → W4 → Gates → W5)

Paste this whole file into a fresh Claude Code session on the `ui` branch. This **continues Batch 9**
(`docs/session-prompts/batch-9-cleanup-i18n-and-parity.md` is the full roadmap; read it for the wave
definitions and the non-negotiables). The first Batch-9 session shipped **W1 + part of W2** as local commits
(NOT pushed). This session finishes the long tail in the same priority order.

> **Still a roadmap of ordered waves, not one session.** Do as many as fit cleanly; **gate the two
> product/brand decisions** before touching them; write the next-session prompt for whatever remains.

---

## What already shipped (local commits on `ui`, NOT pushed — Eston controls deploy)

Read these first: the build-review **worklist** `docs/superpowers/specs/2026-06-09-batch8-build-review-findings.md`
(§4 fix list, §7 deferred, §8 seam checklist), the a11y log `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md`
(§1b token-debt), `CLAUDE.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and the auto-memory `project_ui_redesign_apr2026`.

- **W1 dead-code removal — COMPLETE (3 commits, ~3,200 lines, 21 files):**
  - `3b4e486` — dead `pages/InitiativeView.tsx` shell + the whole `components/initiative/` tree
    (Roadmap/Gaps/Steps + dialogs) + `initiativeSlice` (+ its `store/index.ts` registration).
    **MandatePage** read `state.initiative.initiativeDetails`, but its only writer `fetchInitiative` had **no
    live dispatcher** (the live dashboard uses router `location.state`), so the read always resolved to
    `undefined` → flagship fallback; replaced with `getPublishedMandate(undefined)` + a `SEAM` marker.
    Behavior unchanged.
  - `97c87d0` — dead `services/openai.ts` (old OpenAI client, 0 live importers, superseded by `services/ai.ts`).
  - `c1de903` — 0-importer dialogs: `CreateIssueDialog`, `CreateCommunityDialog`, `CollaborationPanel`.
  - **FLAG (do early in W3 or a cleanup commit):** `createEditProposal` / `addGap` / `addStep` are now
    orphaned **exports** in the still-live `src/services/contracts/initiative.ts`. Rollup tree-shakes them
    (zero bundle cost), so they were left rather than edit a contract-seam file mid-W1. Trim if convenient,
    but verify zero references first (`rg -n 'createEditProposal|addGap|addStep' src`).
- **W2 i18n wiring — STARTED (2 commits):**
  - `3c76ea1` — **InitiativeDashboard** (the headline "zero `useT`" offender): all stage labels/descriptions,
    statuses, completed-stage metrics, readiness/advance copy, and the merged banner.
  - `ce313fc` — **ContactPage** (had no `useT`) + **NotificationsBell** dropdown (+ a `t()`-wired aria-label on
    ContactPage's previously-unlabeled icon-only back button).

**The i18n convention (settled — follow it exactly):** `src/i18n/en.ts` is **foundation/shared only**; feature
copy uses **inline defaults** `t('ns.key', 'English default')` and does NOT get added to en.ts (the en.ts header
documents this). `fr`/`sw` fall through the en dict to the inline default, so wiring = **English-now in all
locales** automatically and makes strings greppable for W5. Reuse existing `common.*` / `nav.*` keys where the
English matches. For **plurals**, the existing pattern (used in the dashboard) passes a suffix var:
`t('k','{n} item{s}',{n, s: n!==1?'s':''})` — preserves the original English exactly. For **inline `<strong>`/markup
inside a sentence**, split pre/`<element>`/post keys (no `<Trans>` mechanism exists); note it for W5 to restructure.

---

## How we work (non-negotiable — unchanged from every batch)

- **Branch + seam:** develop on `ui` against the **stub layer** only (`src/services/api.ts` / `src/services/demo/`).
  Never call a real server from a component. Don't widen the seam leaks documented in review §8.
- **Design system is law** (`DESIGN_SYSTEM.md`): tokens only (no ad-hoc hex/px/literal-rgba; derived `rgba($token,a)`
  OK), AA contrast, focus-visible on every control, ≥44px targets, light + dark, flagship **360px**.
- **Verify before "done":** `npx tsc -b` **and** `npm run build` exit 0 (note: in **zsh** `$PIPESTATUS` is empty —
  use `cmd && echo OK || echo FAIL`, or `${pipestatus[1]}`), then walk affected routes in the preview
  (`preview_start({name:"gloki-dev"})`, port 5173) in **light + dark + 360px**. Judge by exit codes + a live DOM
  check, not source. No ErrorBoundary/console errors. (For pure i18n-wiring areas where nothing visual changes,
  a light-mode render-identical check per surface is enough; reserve dark/360px for W3/W4 visual changes.)
- **Commit locally** in small, clearly-described chunks (`Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>` trailer). **Do NOT push** — hand back when verified.
- **Product/brand calls via the question tool** (Gates A/B below — don't pre-empt).
- **Slow external drive:** throttle heavy parallel file I/O — small sequential batches; use `rg` via Bash (no
  Grep/Glob/TodoWrite tools are exposed in this harness). Preview idle-stops between long gaps — just `preview_start` again.

## Demo facts (save time)

- Authed routes: `localStorage.user = {publicKey:'<64 alnum>', serverUrl:'https://gdi.gloki.contact'}`. To land on
  Home (not `/welcome`), also set `gloki.digitalAgent` (full agent: `{displayName,photo:'',country:'DE',languages:['en'],createdAt:<num>,vouchedBy:[...]}` — `languages` must be present) **and** `gloki.onboarding={step:6,completed:true}`, then reload.
- Direct route URLs that render: `/`, `/welcome`, `/community/demo-comm-mq4adhe7-daa1ds1b`,
  `/initiative/_/_/demo-comm-mq4adhe7-daa1ds1b/demo-init-mq4adhe8-0rr7tgxb/roadmap` (host/agent accept `_`),
  `/mandate/demo-comm-mq4adhe7-daa1ds1b/demo-init-mq4adhe8-0rr7tgxb`, `/identity/contact`.
- `preview_click` fires real `<button>` onClicks; synthetic clicks don't blur inputs and `<div role=button>` cards
  may not navigate. To open the NotificationsBell dropdown without preview_click: `preview_eval` →
  `document.querySelector('button[aria-label="Notifications"]').click()`.

---

## The remaining waves (ordered)

### W2 — finish the i18n wiring sweep (resume here)
Same approach as above (inline defaults, reuse common/nav, suffix-var plurals). Remaining offenders from review §2/§3.1:
- **`StageFeedView`** — `STAGE_CONFIG` (per-stage names/descriptions) + threshold / loading / sample-data banners.
  (It already imports `useT` — these are stranded literals within a partially-wired file.)
- **`CreateInitiativePage`** — also partially wired; sweep the remaining literals + the "Problem Recognition"-style
  vocabulary (keep the settled vocab: initiative = the effort; problem = its Stage-1 statement).
- **`Members`** — status/label literals.
- **`formatTimeAgo`** (`src/utils/formatTimeAgo.ts`) — **tricky: it's a util, not a component, so it can't call the
  `useT` hook.** Options: (a) have it return a key + vars and let callers `t()` it, or (b) pass `t` in as an arg.
  This also intersects review §7 "three duplicate `formatTimeAgo` → consolidate to `utils/formatTimeAgo`" — consider
  doing the consolidation in the same pass. Scope carefully; it touches several call sites.
- **Stranded `aria-label` / `title` / placeholder literals** app-wide — grep
  `rg -n 'aria-label="|title="|placeholder="' src --glob '*.tsx'` and wire the English ones through `t()`.
  (When you touch an icon-only control that has **no** accessible name, add a `t()`-wired one — small a11y win.)
Chunk by area, commit per area, verify each renders identically.

### W3 — token-debt cleanup (design-system canonicalization) — visual; verify light + dark + 360px
Per a11y §1b + review §3. Convert the **hardcoded dark-palette family** to theme-aware tokens: `NotificationsBell`
dropdown panel, `RoleChip`, `RoleDisplay`, `ExpertEndorseButton`, the merge flow
(`MergeProposalCard`/`MergeProposalsList`/`MergeProposalSubmitModal`), and `InitiativeDashboard` `.absorbedBanner`
(**replace with `<Banner tone="warning">`** — note the banner's text is already `t()`-wired as `dashboard.merged.*`).
Then the dialogs (`ApprovalDialog`, `CreateCollabDialog`, `IdentityCardDialog`). **Bundle:** make jsPDF/svg2pdf in
`IdentityCardPDFGenerator.ts` a **dynamic `import()`** so the **484KB** `IdentityCardDialog` chunk loads on demand
(confirmed still 484KB in the W1/W2 build output). Verify no contrast regressions, light + dark.

### W4 — smaller a11y (bounded)
- Shared `Modal` (`src/components/shared/Modal.tsx`): add **focus-on-open** + **focus-trap** (Esc + `role` +
  `aria-modal` already present; only focus management is missing).
- `StageFooter`: `aria-current="page"` on the active tab + `aria-label` on the `<nav>` landmark.
- (Optional) migrate remaining hand-rolled buttons (chat send/back, `Stepper`) to the shared `Button`.

### 🚦 GATE A (brand) — `$primary` contrast
White on `$primary` `#3b82f6` = **3.68:1** (< AA 4.5:1), every primary button. **Ask Eston** (question tool):
darken `$primary` → ~`#2563eb` (≈5.1:1, app-wide but shifts the blue identity) **vs** keep + document. He kept it at
the Batch-8 gate; confirm before acting.

### 🚦 GATE B (product) — stage-advance gating
The dashboard "Move to {stage}" button shows for every member and swallows `set_stage` errors. **Ask Eston:**
author/admin-only, or community self-governs? At minimum surface the swallowed error. Don't implement a gating model
without his call. (The advance copy is now `t()`-wired, so a gating change is UI/logic only.)

### W5 — fr/sw multilingual parity (its own session; AFTER W2 is fully wired)
Translate the en keys → fr/sw in `src/i18n/{fr,sw}.ts`, and add the pre-auth **language switcher** (deferred a11y
finding #11). Gated on W2 (can't translate keys that aren't wired). The wiring uses inline defaults, so the W5
translator must **grep the codebase for `t('…','…')` calls** (not just mirror en.ts) to find every key + its English
default. Scope as its own batch.

## The `ui → main` review PR (#20)
Already refreshed for Ouri (points at the review report + §8). Keep current if scope shifts materially; **Ouri
reviews/merges — don't merge it yourself**; the 2 upstream `main` commits still need reconciling first.

## Sizing + when done
`tsc -b` + `npm run build` green; verify affected routes live (light/dark/360px for W3/W4 visual changes; render-identical
for i18n); small local commits; **no push**. Hand back with what shipped vs deferred, and **write the next-session
prompt** for the remainder.
