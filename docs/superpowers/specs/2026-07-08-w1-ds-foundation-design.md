# Wave 1 — DS foundation: tokens + header-alignment law + dark-mode blocker

**Session:** S24 · **Branch:** `ui` · **Baseline HEAD:** `5e14d35` (clean tree)
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 Wave 1 + §5 (source of truth)
**Date:** 2026-07-08

## Goal (one sentence)

Introduce the missing design tokens (`$content-gutter`, `$success-on-dark`, `$warning-on-dark`) +
the header-alignment law, reconcile the AppHeader and content columns to one horizontal gutter,
clear the dark-mode vote-button contrast blocker, and **codify the new rules in `DESIGN_SYSTEM.md`**
so drift can't recur.

This wave changes **no product behaviour** — it is tokens + SCSS + one doc. No fixtures → **no
`DEMO_VERSION` bump**. No user-facing strings → **no i18n**.

## Decisions locked (Eston, 2026-07-08)

1. **`$content-gutter` = `$spacing-lg` (16px)** — the single app-wide horizontal content edge.
   Tightens desktop content 24→16 and lifts the 12px-mobile pages to a shared 16px; mobile-first,
   content centres in a 640px column so 16px reads clean at 360px.
2. **Header title-block top air = `$spacing-lg` (16px)** (was 12px) — more air without adding much
   chrome height at 360px; matches the gutter for a tidy inset.
3. **D-stretch (canonical page-container primitive) → split to a future W1b.** The mobile-first 360px
   flagship is fully fixed by items A/B alone; desktop (>640px) title-vs-content alignment, the
   640/720/800 width divergence, and the 72/80/64 footer-clearance drift are a bigger refactor,
   filed for W1b.

## Premises re-grounded vs HEAD `5e14d35` (all CONFIRMED)

| Premise | Verified reality |
|---|---|
| Dark vote buttons unreadable | `ProblemVoteFlow.module.scss` `@include dark` (line 252) re-themes `.voteBtn` **background + border only** (271–274); `.upBtn` keeps `$success-on-surface` (#065f46 ≈1.9:1) / `.downBtn` keeps `$error-dark` (≈2.3:1) on `$dark-bg` #1e293b |
| Vote captions fail AA in dark | `.thresholdLabels/.yourVote/.undoHint` = `$gray-500` (≈3.0:1), no dark override |
| Secondary Button fails AA in dark | `Button.module.scss` dark block (113) covers `.secondary:hover` + tertiary only; resting `.secondary` keeps `$primary` border/text ≈3.98:1 |
| Tokens missing | `$success-on-dark`, `$warning-on-dark`, `$content-gutter` do NOT exist. `$primary-on-dark` (#60a5fa), `$error-on-dark` (#f87171), `$heading-gap` (8px), `$spacing-lg` (16px), `$content-max-width` (640px), the `$dark-*` palette all exist. No `$spacing-2xs` (2px) token exists |
| Header gutter < content | `.header` (brand bar, line 39) + `.titleBlock` (181) both pad `$spacing-md` (12px) horizontally; `.titleBlock` bottom `$spacing-xs` (4px); raw `gap: 2px` at line 179 |
| Content columns diverge by breakpoint | Container `.content` 24px desktop / 16px mobile; CommunityView `.body` & StageFeedView `.feedContainer` 16px desktop / **12px mobile**; DiscussionStageView `.main` **double-pads** (own 16px nested inside `cs.content`) |

Dark palette for the contrast math: `$dark-bg` #1e293b, `$dark-text-secondary` #94a3b8.

## Scope — the edits

### A. Dark-mode contrast (self-contained; ship first)

**A1 — `src/styles/variables.scss`** (beside `$error-on-dark`, ~line 144): add the two missing on-dark
TEXT tokens, completing the family.
```scss
$success-on-dark: #34d399; // green-400 — ≈7.6:1 on $dark-bg; semantic-success TEXT on a plain dark surface
$warning-on-dark: #fbbf24; // amber-400 — completes the on-dark family beside $primary/$error-on-dark
```

**A2 — `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss`**, inside the existing
`@include dark { … }` (line 252) — re-declare the button TEXT the background re-theme dropped, and
lift the captions to AA:
```scss
.upBtn,
.upBtn.active { color: $success-on-dark; }
.downBtn,
.downBtn.active { color: $error-on-dark; }
.voteCount { color: inherit; }               // count follows its button's on-dark colour
.thresholdLabels,
.yourVote,
.undoHint { color: $dark-text-secondary; }   // was $gray-500 ≈3.0:1 → ≈5.5:1
```

**A3 — `src/components/shared/Button.module.scss`**, inside the existing `@include dark { … }`
(line 113): re-declare the resting secondary colour/border on the dark surface.
```scss
.secondary {
  color: $primary-on-dark;
  border-color: $primary-on-dark;            // ≈5.75:1 — fixes the community "Menu" + all secondary buttons in dark
}
```
NOT the locked white-on-`$primary` fill case — **`$primary` is untouched.**

### B. Header-alignment law (16px)

**B1 — `src/styles/variables.scss`** (layout section, near `$content-max-width`): add the gutter token.
```scss
$content-gutter: $spacing-lg; // 16px — THE app-wide horizontal content edge (header title block, brand bar, every content column). No ad-hoc per-file/per-breakpoint horizontal padding.
```

**B2 — `src/components/AppHeader.module.scss`:**
- `.header` (brand bar, line 39): `padding: $spacing-sm $spacing-md` → `padding: $spacing-sm $content-gutter` (vertical unchanged)
- `.titleBlock` (line 181): `padding: $spacing-md $spacing-md $spacing-xs` → `padding: $spacing-lg $content-gutter $heading-gap` (top 16, sides 16, bottom 8)
- `.titleBlock` (line 179): `gap: 2px` → `gap: $spacing-xs` (4px; kills the raw literal, keeps tight eyebrow→h1→subtitle rhythm)

**B3 — content columns → `$content-gutter` at base; mobile media queries stop re-specifying
horizontal** (the law: the gutter is set once). Convert the mobile `padding: $spacing-md` shorthands
to vertical-only longhand so the single base gutter is inherited:

- `src/pages/Container.module.scss`:
  - `.content` (line 16): `padding: 0 $spacing-xl $spacing-xl` → `padding: 0 $content-gutter $spacing-xl` (keeps line 17 `padding-bottom: 72px`)
  - mobile media query (line 158): **remove** the `.content { padding: 0 $spacing-lg $spacing-lg }` override → `.content` inherits base (16px horizontal + 72px footer clearance at mobile too). Keep the nested `.nav`/`.navItem` responsive tweaks.
- `src/pages/CommunityView.module.scss`:
  - `.body` (line 15): `padding: $spacing-lg` → `padding: $content-gutter` (net-zero, tokenized)
  - mobile `.body` (line 147): `padding: $spacing-md` → `padding-top: $spacing-md` (keep 12px vertical tighten; horizontal inherits 16). Line 148 `padding-bottom` unchanged.
- `src/pages/StageFeedView.module.scss`:
  - `.feedContainer` (line 4): `padding: $spacing-lg` → `padding: $content-gutter` (keep line 5 `padding-bottom: 80px`)
  - mobile `.feedContainer` (line 232): `padding: $spacing-md` → `padding-top: $spacing-md`. Line 233 unchanged. **Do not** touch `.card` interior padding (line 17 / mobile 237) — that is W5.
- `src/components/collaboration/DiscussionStageView.module.scss`:
  - `.main` (line 10): `padding: $spacing-lg $spacing-lg calc(...)` → `padding: $spacing-lg 0 calc(...)` — drop horizontal so the parent `cs.content` (`$content-gutter`) is the **sole** gutter, collapsing the 32/40px double-pad. Keep top air (16) + `max-width: $content-max-width` + `margin: 0 auto` + bottom clearance.

### C. Codify in `DESIGN_SYSTEM.md`

1. **Header-gutter law** — the AppHeader title block, brand bar, and every page content column share
   ONE horizontal gutter = `$content-gutter` (16px). No ad-hoc per-file/per-breakpoint horizontal
   padding; mobile media queries may tighten vertical only.
2. **Complete on-dark TEXT family** — document `$success-on-dark`/`$warning-on-dark` beside
   `$primary-on-dark`/`$error-on-dark`. Rule: semantic TEXT on a plain dark surface MUST use a
   `*-on-dark` token — never a `*-on-surface` (those are light tinted-chip colours) and never the raw
   brand/semantic colour.
3. **Dark-authoring rule** — any `@include dark` block that re-themes an element's background MUST
   re-declare that element's text/icon colour on the new surface. (Why: `.voteBtn` re-themed bg but
   left green/red text ≈1.9–2.3:1; `Button.secondary` shipped ≈3.98:1.)
4. **Header vertical rhythm** — title-block top air `$spacing-lg` (16px), bottom `$heading-gap` (8px),
   eyebrow→h1→subtitle gap on the spacing scale (`$spacing-xs`), no raw `2px`.

## Explicit scope boundaries

- **Deferred to W1b:** the canonical page-container primitive; desktop (>640px) title-vs-content
  alignment; 640/720/800 width divergence; 72/80/64 footer-clearance tokenization.
- **Deferred (Round-2 unreviewed, campaign §7):** `CreateCommunityPage`/`CreateInitiativePage`
  `.page` (24px) — standalone full-page forms that do NOT sit under the AppHeader title block, so the
  "share one edge" rationale doesn't apply; narrowing a form is a visual call for their own review.
- **Left as-is:** `HomeView`/`LoginPage`/`NotFound` already pad 16px horizontally (an optional
  net-zero token re-point is deferred, not required for the flagship fix).
- **Later waves (do NOT pull in):** card-chin `$footer-*` tokens (W2), "In discussion" reframe (W3),
  copy/i18n like "Menu"→"Community options" (W6), kit migrations + touch-target floors (W5), card
  interior padding tokenization (W5).

## Known side-effect (flag honestly)

Removing Container's mobile `.content` horizontal override means mobile inherits the base 72px bottom
padding (today the mobile shorthand collapses it to 16px) — i.e. **more** StageFooter clearance at
mobile, a latent-bug side-benefit. Note it in the §8 changelog rather than shipping it silently.

## Locked — do not touch

- `$primary` `#3b82f6` (white-on-primary 3.68:1 is a deliberate deviation).
- The single-AppHeader model (one banner/page, no per-page header component, no header CTA).
- The 4-stage IA; 1p1v with QV framing; trust/verification model.

## Verification (measure, never eyeball)

- `npx tsc -b` → silent exit 0.
- Preview at **360px** in **both** schemes (`preview_resize` colorScheme light + dark; reload after
  each flip). Re-measure with `.claude/skills/gloki-verification-and-qa/scripts/contrast-eval.js`:
  - dark `.upBtn` (#34d399 on #1e293b) ≥ AA (target ≈7.6:1); dark `.downBtn` (#f87171) ≥ AA
  - dark vote captions (#94a3b8 on #1e293b) ≥ 4.5:1
  - dark secondary Button (#60a5fa border/text on #1e293b) ≥ 4.5:1
- Header title, eyebrow, subtitle share the 16px left edge with page body; ≥16px top air.
- Grep gates: `grep -rn 'color: $gray-400' src --include='*.module.scss'` still 0; raw-hex/rgba
  baselines unchanged; no new raw px in the touched blocks.
- Every route still has exactly one `<h1>` and one AppHeader banner after the header edits.

## Success criteria

Dark vote buttons + captions + secondary Buttons clear AA; AppHeader eyebrow/title/subtitle sit on
the same 16px edge as body content at 360px in both schemes; `$content-gutter`/`$success-on-dark`/
`$warning-on-dark` exist and are consumed; `DESIGN_SYSTEM.md` codifies the three rules; `tsc -b`
green; `ui` runnable.
