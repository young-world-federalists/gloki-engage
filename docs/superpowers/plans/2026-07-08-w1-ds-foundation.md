# Wave 1 — DS foundation Implementation Plan

> **For agentic workers:** this repo has **no test framework** — verification is `npx tsc -b` (silent
> exit 0) + a controller-driven preview walk at 360px (light + dark) with the contrast-eval script.
> Implementer subagents (if used) verify via `tsc -b` only and NEVER touch the preview; the controller
> drives the one shared preview. Steps use checkbox (`- [ ]`) syntax.

**Goal:** add the missing DS tokens + header-alignment law, reconcile header + content to one 16px
gutter, clear the dark-mode vote/secondary-button contrast blocker, and codify the rules in
`DESIGN_SYSTEM.md`.

**Architecture:** pure token + SCSS edits inside existing `@include dark` blocks and existing padding
declarations; one doc. No TSX, no fixtures, no strings. Spec:
`docs/superpowers/specs/2026-07-08-w1-ds-foundation-design.md`.

**Tech Stack:** SCSS modules, `src/styles/variables.scss` token home, the `@include dark` mixin
(`variables.scss:176`), Vite + `tsc -b`.

## Global Constraints

- **Tokens only** — no raw hex/px/rgba in the touched blocks (except the two new hex token *values*).
- **`$primary` #3b82f6 is locked** — do not touch (white-on-primary deviation).
- **Single-AppHeader model locked**; 4-stage IA locked; 1p1v locked.
- **No `DEMO_VERSION` bump** (no fixtures). **No i18n** (no user-facing strings).
- Each commit leaves `ui` runnable + `tsc -b` green. Commit tags: `feat(s24)` / `docs(s24)`.
- Slow USB drive: small sequential reads, path-scoped greps.

---

### Task 0: Commit spec + plan (docs-first)

**Files:** `docs/superpowers/specs/2026-07-08-w1-ds-foundation-design.md`,
`docs/superpowers/plans/2026-07-08-w1-ds-foundation.md`

- [ ] **Step 1: Commit the docs before any feat commit**

```bash
git add docs/superpowers/specs/2026-07-08-w1-ds-foundation-design.md \
        docs/superpowers/plans/2026-07-08-w1-ds-foundation.md \
        docs/ui-polish-campaign-2026-07.md docs/session-prompts/session-24-w1-ds-foundation.md
git commit -m "docs(s24): W1 DS-foundation spec + plan (+ campaign plan, session prompt)"
```

---

### Task 1: Dark-mode contrast (A — self-contained, ship first)

**Files:**
- Modify: `src/styles/variables.scss` (after `$error-on-dark`, ~line 144)
- Modify: `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss` (inside `@include dark`, line 252)
- Modify: `src/components/shared/Button.module.scss` (inside `@include dark`, line 113)

**Interfaces:**
- Produces: `$success-on-dark`, `$warning-on-dark` (consumed by Task 1 + documented in Task 3).

- [ ] **Step 1: Add the two on-dark TEXT tokens** in `variables.scss` immediately after
  `$error-on-dark: #f87171;`:

```scss
$success-on-dark: #34d399; // green-400 — ≈7.6:1 on $dark-bg; semantic-success TEXT on a plain dark surface
$warning-on-dark: #fbbf24; // amber-400 — completes the on-dark family beside $primary/$error-on-dark
```

- [ ] **Step 2: ProblemVoteFlow dark block** — add to the `@include dark { … }` at line 252 (after the
  `.voteBtn` rule, before the block closes):

```scss
  .upBtn,
  .upBtn.active { color: $success-on-dark; }

  .downBtn,
  .downBtn.active { color: $error-on-dark; }

  .voteCount { color: inherit; }

  .thresholdLabels,
  .yourVote,
  .undoHint { color: $dark-text-secondary; }
```

- [ ] **Step 3: Button.secondary dark override** — add to the `@include dark { … }` at line 113:

```scss
  .secondary {
    color: $primary-on-dark;
    border-color: $primary-on-dark;
  }
```

- [ ] **Step 4: Build** — `npx tsc -b` → silent exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/styles/variables.scss \
        src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss \
        src/components/shared/Button.module.scss
git commit -m "feat(s24): dark-mode vote + secondary-button contrast (+ on-dark text tokens)"
```

---

### Task 2: Header-alignment law (B)

**Files:**
- Modify: `src/styles/variables.scss` (layout section, near `$content-max-width` line 158)
- Modify: `src/components/AppHeader.module.scss` (lines 39, 179, 181)
- Modify: `src/pages/Container.module.scss` (lines 16, 158)
- Modify: `src/pages/CommunityView.module.scss` (lines 15, 147)
- Modify: `src/pages/StageFeedView.module.scss` (lines 4, 232)
- Modify: `src/components/collaboration/DiscussionStageView.module.scss` (line 10)

**Interfaces:**
- Consumes: `$spacing-lg` (16px), `$heading-gap` (8px), `$spacing-xs` (4px), `$content-max-width`.
- Produces: `$content-gutter` (consumed by AppHeader + all content columns + documented in Task 3).

- [ ] **Step 1: Add `$content-gutter`** in `variables.scss` layout section (near `$content-max-width`):

```scss
$content-gutter: $spacing-lg; // 16px — THE app-wide horizontal content edge (header title block, brand bar, every content column). No ad-hoc per-file/per-breakpoint horizontal padding; mobile media queries tighten vertical only.
```

- [ ] **Step 2: AppHeader** — three edits in `AppHeader.module.scss`:
  - `.header` line 39: `padding: $spacing-sm $spacing-md;` → `padding: $spacing-sm $content-gutter;`
  - `.titleBlock` line 179: `gap: 2px;` → `gap: $spacing-xs;`
  - `.titleBlock` line 181: `padding: $spacing-md $spacing-md $spacing-xs;` → `padding: $spacing-lg $content-gutter $heading-gap;`

- [ ] **Step 3: Container** — `Container.module.scss`:
  - `.content` line 16: `padding: 0 $spacing-xl $spacing-xl;` → `padding: 0 $content-gutter $spacing-xl;`
  - mobile media query line 158: **delete** the line `padding: 0 $spacing-lg $spacing-lg;` (the `.content` selector keeps its nested `.nav`/`.main` rules; `.content` inherits the base 16px horizontal + 72px footer clearance at mobile).

- [ ] **Step 4: CommunityView** — `CommunityView.module.scss`:
  - `.body` line 15: `padding: $spacing-lg;` → `padding: $content-gutter;`
  - mobile `.body` line 147: `padding: $spacing-md;` → `padding-top: $spacing-md;` (line 148 `padding-bottom: calc(...)` unchanged; horizontal now inherits 16).

- [ ] **Step 5: StageFeedView** — `StageFeedView.module.scss`:
  - `.feedContainer` line 4: `padding: $spacing-lg;` → `padding: $content-gutter;`
  - mobile `.feedContainer` line 232: `padding: $spacing-md;` → `padding-top: $spacing-md;` (line 233 unchanged). **Do NOT** touch `.card` (line 17 / mobile 237).

- [ ] **Step 6: DiscussionStageView** — `DiscussionStageView.module.scss`:
  - `.main` line 10: `padding: $spacing-lg $spacing-lg calc(#{$footer-height} + #{$spacing-2xl});` → `padding: $spacing-lg 0 calc(#{$footer-height} + #{$spacing-2xl});`

- [ ] **Step 7: Build** — `npx tsc -b` → silent exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/styles/variables.scss src/components/AppHeader.module.scss \
        src/pages/Container.module.scss src/pages/CommunityView.module.scss \
        src/pages/StageFeedView.module.scss \
        src/components/collaboration/DiscussionStageView.module.scss
git commit -m "feat(s24): \$content-gutter + header-alignment law across header and content columns"
```

---

### Task 3: Codify in DESIGN_SYSTEM.md (C)

**Files:** Modify `DESIGN_SYSTEM.md` (Colors/dark section + Spacing/gutter + Typography/header rhythm)

- [ ] **Step 1:** Add the **Header-gutter law** (Spacing/layout section): the AppHeader title block,
  brand bar, and every page content column share ONE horizontal gutter = `$content-gutter` (16px);
  no ad-hoc per-file/per-breakpoint horizontal padding; mobile media queries tighten vertical only.
- [ ] **Step 2:** Add the **complete on-dark TEXT family** beside `$primary-on-dark`/`$error-on-dark`:
  document `$success-on-dark`/`$warning-on-dark` + the rule: semantic TEXT on a plain dark surface
  MUST use a `*-on-dark` token — never a `*-on-surface`, never the raw brand/semantic colour.
- [ ] **Step 3:** Add the **dark-authoring rule**: any `@include dark` block that re-themes a
  background MUST re-declare that element's text/icon colour on the new surface.
- [ ] **Step 4:** Add the **header vertical rhythm**: top air `$spacing-lg` (16px), bottom
  `$heading-gap` (8px), eyebrow→h1→subtitle gap `$spacing-xs`, no raw `2px`.
- [ ] **Step 5: Commit**

```bash
git add DESIGN_SYSTEM.md
git commit -m "docs(s24): codify header-gutter law + on-dark family + dark-authoring rule"
```

---

### Task 4: Verify (controller-driven)

- [ ] `npx tsc -b` clean.
- [ ] `preview_start gloki-dev`; resize 360px; seed a route showing the vote flow + a titled page.
- [ ] colorScheme dark → reload → `contrast-eval.js`: dark `.upBtn` ≥AA, `.downBtn` ≥AA, vote captions
  ≥4.5:1, secondary Button ≥4.5:1.
- [ ] colorScheme light → reload → header eyebrow/title/subtitle share the 16px left edge with body;
  ≥16px top air; screenshot both schemes.
- [ ] Grep gates: `grep -rn 'color: $gray-400' src --include='*.module.scss'` → 0; one `<h1>` +
  one AppHeader per route.

---

## Self-Review

- **Spec coverage:** A1/A2/A3 → Task 1; B1/B2/B3 → Task 2; C → Task 3; verification → Task 4. Scope
  boundaries (W1b defer, CreateCommunity defer) carry no task by design. ✅ complete.
- **Placeholder scan:** none.
- **Type/name consistency:** token names (`$content-gutter`, `$success-on-dark`, `$warning-on-dark`,
  `$primary-on-dark`, `$error-on-dark`, `$dark-text-secondary`, `$heading-gap`, `$spacing-xs`) match
  spec + verified-present-in-HEAD list. ✅
