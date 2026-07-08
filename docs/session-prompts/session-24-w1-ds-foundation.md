# Session 24 — UI Polish Wave 1: DS foundation (tokens + header-alignment law + dark-mode blocker)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 1 of the
UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md`, produced 2026-07-08 from
Eston's walkthrough + a 14-agent read-only review). Current HEAD at plan time: `5e14d35`, in sync with
`origin/ui`, deployed & live (deploy green, 200).

**This IS a build session** (unlike the review that produced the plan): brainstorm → spec → build on
`ui` → `tsc -b` → preview-verify 360px light+dark → Opus whole-branch review → **Eston's explicit push
green light**. Change no product behaviour — this wave is tokens + SCSS + one doc.

**Why Wave 1 first:** almost every complaint in Eston's walkthrough traces to two *missing tokens* and
one *uncodified law*. Fixing them here makes ~half the header/padding issues disappear by inheritance,
and clears the one reading-blocker. Later waves consume these tokens — nothing downstream should
hardcode a gutter or an on-dark colour before they exist.

## The goal (one sentence)
Introduce the missing design tokens + the header-alignment law, reconcile the header + content to them,
clear the dark-mode contrast blocker, and **codify the new rules in `DESIGN_SYSTEM.md`** so drift can't
recur (the whole point — Eston: *"the design system exists but isn't enforced"*).

## Scope — do exactly these

### A. Dark-mode contrast (the blocker + its token gap) — do first, it's self-contained
1. **Add the missing on-dark TEXT tokens** in `src/styles/variables.scss`, beside `$error-on-dark`:
   - `$success-on-dark: #34d399;`  // green-400, ≈7.6:1 on `$dark-bg`
   - `$warning-on-dark: #fbbf24;`  // amber-400
2. **BLOCKER — dark vote buttons unreadable.** In `ProblemVoteFlow.module.scss`, inside the existing
   `@include dark { … }` block, override the button TEXT (currently the dark block only re-themes the
   background, so green ≈1.9:1 / red ≈2.3:1):
   `.upBtn, .upBtn.active { color: $success-on-dark; }`
   `.downBtn, .downBtn.active { color: $error-on-dark; }` (token already exists)
   `.voteCount { color: inherit; }`
3. **Vote captions AA in dark.** Same file: give `.thresholdLabels`, `.yourVote`, `.undoHint` a dark
   override → `$dark-text-secondary` (currently `$gray-500` ≈3.0:1 on the dark surface).
4. **Secondary Button dark contrast.** In `src/components/shared/Button.module.scss` add
   `@include dark { .secondary { color: $primary-on-dark; border-color: $primary-on-dark; } }`
   (≈5.75:1). This is NOT the locked white-on-`$primary` fill case — **do not touch `$primary`.** Fixes
   the community "Menu" button and every secondary button in dark.

### B. Header-alignment law (the pervasive flush-left complaint)
5. **Add one gutter token** in `variables.scss`: `$content-gutter: $spacing-lg;` (16px). This becomes THE
   app-wide horizontal content edge.
6. **Align the AppHeader to it.** In `src/components/AppHeader.module.scss`:
   - `.titleBlock` horizontal padding → `$content-gutter` (it's smaller than the content today — that's
     why eyebrow/title/subtitle hang left of the body).
   - The brand bar (`.header`) horizontal padding → `$content-gutter` too, so back/brand/bell line up
     with the title and body.
   - **Vertical rhythm:** add top air (see the open decision below), set the title→content bottom gap to
     `$heading-gap` (8px — currently 4px), and put the eyebrow→h1 gap on the spacing scale (kill any raw
     `2px`).
7. **Point the content columns at the same token.** Set the horizontal padding of the main content
   containers to `$content-gutter` so header and body share ONE edge value:
   `src/pages/Container.module.scss` (`.content`), and the page bodies that self-pad —
   `CommunityView.module.scss` (`.body`), `StageFeedView`, `DiscussionStageView.module.scss` (`.main` —
   also collapses the double-padding there), and any subpage root that hardcodes its own horizontal
   padding. Verify none rely on the old 24px for layout.

### C. Codify it (so it's enforced, not just fixed)
8. Update `DESIGN_SYSTEM.md`:
   - **Header-gutter law:** "The AppHeader title block, the brand bar, and every page content column
     share one horizontal gutter = `$content-gutter` (16px). No ad-hoc per-file/per-breakpoint
     horizontal padding."
   - **Complete on-dark family + dark-authoring rule:** document `$success-on-dark`/`$warning-on-dark`
     beside `$primary`/`$error-on-dark`; state that **semantic TEXT on a plain dark surface MUST use a
     `*-on-dark` token — never a `*-on-surface` (those are light tinted-chip colours) and never the raw
     brand colour**, and that any `@include dark` block re-theming a background MUST re-declare that
     element's text/icon colour.
   - Note the header vertical rhythm (top air value chosen below; bottom = `$heading-gap`).

### D. Stretch (only if scope allows — else split to a "W1b" and say so honestly in the changelog)
9. **Canonical page-container + desktop alignment.** On >640px the content centres in a 640px column
   but the title block spans full-width left-aligned, so they re-misalign on desktop. The clean fix is
   one shared page-container primitive (`max-width:$content-max-width` + `margin:auto` + `$content-gutter`
   + `$footer-height` bottom) used by BOTH the title block and content — which also kills the
   640/720/800 width divergence and the 72-vs-64 footer-clearance drift (a `subpages`/`tokens` finding).
   This is a bigger refactor than 5–8; **if it risks the wave, defer it and file it** (the mobile-first
   360px flagship is fixed by 5–8 alone).

**Out of scope (later waves — do NOT pull them in):** the card-chin `$footer-*` tokens (W2), the
"In discussion" reframe (W3), any copy/i18n change like "Menu"→"Community options" (W6), the kit
migrations + touch-target floors (W5).

## Re-verify these premises vs HEAD (the recurring S10–S23 lesson — line numbers drift)
Run these before trusting any file:line from the plan:
- **AppHeader title-block gutter** is smaller than content: `grep -n "titleBlock\|\.header\b" src/components/AppHeader.module.scss` — confirm `.titleBlock` horizontal padding (plan saw `$spacing-md`/12px ≈ line 181) and the brand `.header` padding. S23 rewrote AppHeader (subtitle law + per-section headers) — the structure is recent, re-read it whole.
- **Container content padding** is 24/16: `grep -n "padding\|content-max-width" src/pages/Container.module.scss`.
- **ProblemVoteFlow dark block** re-themes bg but not text: `grep -n "upBtn\|downBtn\|voteCount\|include dark\|thresholdLabels\|yourVote\|undoHint" src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss`.
- **on-dark tokens:** `grep -n "on-dark\|on-surface" src/styles/variables.scss` — confirm `$error-on-dark`/`$primary-on-dark` exist and `$success-on-dark`/`$warning-on-dark` do NOT.
- **`$heading-gap` = 8px, `$spacing-lg` = 16px** exist: `grep -nE "heading-gap|spacing-lg:" src/styles/variables.scss`.
- **Button.secondary** has no dark override: `grep -n "secondary\|include dark" src/components/shared/Button.module.scss`.
- **Locked, do not touch:** `$primary` `#3b82f6` (white-on-primary 3.68:1 is a deliberate deviation); the single-AppHeader model (one banner/page, no per-page header component, no header CTA); the 4-stage IA.

## Read first (carry the context)
- **`docs/ui-polish-campaign-2026-07.md`** — the campaign plan; §3 Wave 1 (the item table with fixes),
  §4 (card-chin, for W2 context only), §5 (the DS-gap list you're codifying), §6 (taste calls). **Source
  of truth for this wave.**
- `DESIGN_SYSTEM.md` — Colors (dark palette + the `$primary-on-dark` note), Spacing, Typography
  (page-title / `$heading-gap`), Accessibility (the locked `$primary` deviation, the AA thresholds),
  App-shell primitives (AppHeader contract). You're editing this file.
- `src/styles/variables.scss` (token home), `src/components/AppHeader.tsx` + `.module.scss`,
  `src/pages/Container.module.scss` — source of truth.
- Skills: **gloki-ui-review-campaign** (measure, never eyeball; the contrast-eval script), **gloki-change-control**
  (push gate + what's locked), **gloki-session-lifecycle** (spec→build→review→push), **gloki-verification-and-qa**
  (preview walk, contrast measurement, 360px). Memory: `project_ui_polish_campaign_jul2026`, `project_session23_jul2026`.

## Workflow + constraints (same discipline as S1–S23)
- **Brainstorm → spec → build.** Write the spec at `docs/superpowers/specs/2026-07-<dd>-w1-ds-foundation-design.md`
  (+ plan in `docs/superpowers/plans/`) before editing SCSS.
- **Tokens only** — no raw hex/px/rgba in component styles; the whole wave is about tokenizing.
- **Slow USB drive:** small sequential reads, path-scoped greps, never scan `node_modules`/`dist`.
- **Verify, don't eyeball:** after building, `npx tsc -b` (silent exit 0), then preview at **360px** in
  **both** schemes (`preview_resize` colorScheme light + dark; reload after each flip). Re-measure the
  fixed elements with the contrast script
  (`.claude/skills/gloki-verification-and-qa/scripts/contrast-eval.js`): the green/red vote buttons and
  captions in dark must clear AA; the secondary Button in dark must clear ≥4.5:1. Run the Phase-1 grep
  gates (`grep -rn 'color: $gray-400' src --include='*.module.scss'` → still 0; raw-hex/rgba baselines
  unchanged). Confirm every route still has exactly one h1 and one AppHeader banner after the header edits.
- **No `DEMO_VERSION` bump** (no fixtures touched). **No i18n** (no user-facing strings change in W1 —
  if you find you need one, you've drifted into a later wave; stop and reconsider).
- **Push is a production deploy of the live demo — confirm with Eston before pushing to `origin/ui`.**
  PR #20 (`ui`→`main`) showing ✗ is expected Ouri-divergence, not a build failure — don't debug it.
- Commit style: `feat(s24): …` for the SCSS/token work, `docs(s24): …` for the DESIGN_SYSTEM.md +
  spec. Small self-contained commits, each leaving `ui` runnable. Close the session per
  gloki-session-lifecycle (MASTER_TODO §7 flip P7-W1 + §8 changelog + memory).

## Open decisions to lock (Eston's calls — surface with your recommendation, don't assume)
1. **`$content-gutter` value = `$spacing-lg` (16px)?** (recommended). This tightens *desktop* content
   from 24→16, but the app is mobile-first and desktop content centres in a 640px column, so 16px reads
   clean. Confirm before rippling it through the content containers.
2. **Header title-block top air:** `$spacing-lg` (16px, recommended — clearly more air than today
   without adding much chrome at 360px) vs `$spacing-xl` (24px, more generous — Eston did ask for "a
   little more padding above the header"). Pick the app-wide value.
3. **Do the D-stretch canonical container this wave, or split it to W1b?** (recommended: split unless
   items 5–8 land with room to spare — desktop alignment is lower priority than the mobile flagship).

When ready: read `docs/ui-polish-campaign-2026-07.md` §3 (Wave 1) + §5, re-verify the premises above,
then brainstorm the spec.
