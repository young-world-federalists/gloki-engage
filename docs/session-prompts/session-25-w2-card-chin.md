# Session 25 — UI Polish Wave 2: card-chin separation (Solution + Vote footers)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 2 of the
UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md`; produced 2026-07-08 from
Eston's walkthrough + a 14-agent review). **HEAD at plan time:** `8862197` (S24/W1 shipped, in sync
with `origin/ui`, deploy run 28971810816 green, live 200).

**This IS a build session:** brainstorm → spec → build on `ui` → `tsc -b` → preview-verify 360px
light+dark → Opus/adversarial whole-branch review → **Eston's explicit push green light**. Change no
product behaviour — this wave is new `$footer-*` tokens + SCSS on two card components.

## The goal (one sentence)
Make the bottom actions row (DiscussionPill + open link) read as a **distinct card footer** — not
another content block — on the Solution card and the Vote card, via ONE shared `.chin` treatment
(hairline top rule + recessed footer fill), and codify the `$footer-*` token family in
`DESIGN_SYSTEM.md`.

## Scope — do exactly these (campaign §3 Wave 2 + the §4 UI-expert determination)

### A. New `$footer-*` tokens (in `variables.scss` — reuse proven values; naming/one-home, not new raw colour)
```scss
$footer-surface:      $gray-100;          // #f1f5f9 — recessed card-footer well (light)
$footer-surface-dark: $dark-tint-subtle;  // rgba(255,255,255,.06) — raised footer strip (dark)
$footer-border:       $gray-200;          // #e2e8f0 — footer hairline top rule (light)
$footer-border-dark:  $dark-border;       // #475569 — footer hairline top rule (dark)
```

### B. Shared `.chin` treatment (rename `.actionsRow`→`.chin` in BOTH `InitiativeStageCard.module.scss`
line 127 + `FeedEngagePanel.module.scss` line 24 — update the TSX classNames too):
```scss
.chin {
  display: flex; align-items: center; justify-content: space-between;
  gap: $spacing-sm; flex-wrap: wrap;
  padding: $spacing-md $content-gutter;       // 12/16 — matches the W1 content edge
  background: $footer-surface;
  border-top: 1px solid $footer-border;       // the key separator
}
@include dark { .chin { background: $footer-surface-dark; border-top-color: $footer-border-dark; } }
@media (max-width: $breakpoint-sm) { .chin { padding: $spacing-md; } }
```

### C. Structural requirements (from §4 — or it mis-renders)
1. **InitiativeStageCard:** pull the chin OUT of `.engage` (line 116, `$gray-50`) so it's a **sibling
   after** the engage body → the `$gray-50` body + `$gray-100` chin gives the two-tone footer. Move
   `.teaser` above it so the `.card`'s `overflow: hidden` (line 5) clips the radius.
2. The chin must be the **terminal child** of the `overflow:hidden` `.card` so the radius clips its
   bottom corners. If a host lacks `overflow:hidden`, add
   `border-bottom-{left,right}-radius: $radius-lg` to `.chin`.
3. **FeedEngagePanel:** keep `.panel`'s existing top rule (header/body divide); the chin adds its own
   top rule → header-body-footer. `.openLink` (line 34) already recolours to `$primary-dark`(light)/
   `$primary-on-dark`(dark) — **verify it still holds contrast on the `$gray-100` fill** (plain
   `$primary` on `$gray-100` is ~3.06:1; keep `$primary-dark`).
4. **DiscussionPill:** no change — the transparent pill reads fine on both footer surfaces.

### D. Vote card mirror
The Vote card uses the same shared components — confirm one treatment covers both Solution + Vote
(campaign §3 item 2.4). No separate code if they truly share `InitiativeStageCard`/`FeedEngagePanel`.

### E. Codify in `DESIGN_SYSTEM.md`
Add the **card-chin/footer pattern** (campaign §5 item 4): the hairline top rule + `$footer-surface`
fill via the `$footer-*` tokens (one home); state it applies to any card rendering a DiscussionPill +
open-action row.

**Out of scope (do NOT pull in):** W1b (canonical page-container/desktop alignment); the "In
discussion" reframe (W3); card *interior* padding tokenization (W5); any copy/i18n (W6).

## Re-verify these premises vs HEAD (the recurring S10–S24 lesson — line numbers drift)
Run before trusting any file:line:
- **`.actionsRow` exists in BOTH card files:** `grep -n "actionsRow" src/components/initiative/InitiativeStageCard.module.scss src/components/initiative/FeedEngagePanel.module.scss` (plan saw lines 127 + 24). Also grep the TSX for `styles.actionsRow` usages so you rename className + SCSS together.
- **InitiativeStageCard structure:** `grep -n "\.engage\|\.teaser\|\.actionsRow\|overflow" src/components/initiative/InitiativeStageCard.module.scss` — confirm `.engage` (`$gray-50` body), `.teaser`, and the card's `overflow: hidden` still exist; re-read the component whole (it may have moved since S24).
- **FeedEngagePanel:** `grep -n "\.panel\|\.openLink\|\.actionsRow\|include dark" src/components/initiative/FeedEngagePanel.module.scss` — confirm `.panel` top rule + `.openLink` dark recolour.
- **`$footer-*` absent, chin values present:** `grep -nE "footer-surface|footer-border|^\\\$gray-100:|^\\\$gray-200:|dark-tint-subtle|^\\\$dark-border:" src/styles/variables.scss`.
- **W1 substrate present (consume, don't re-hardcode):** `$content-gutter` (16px), `$success-on-dark`, `$warning-on-dark` exist as of S24; the header-gutter law + dark-authoring rule are in `DESIGN_SYSTEM.md`.
- **Locked, do not touch:** `$primary` `#3b82f6`; single-AppHeader model; 4-stage IA. **Discussion is a function, not a stage** — the chin holds the DiscussionPill but adds no stage semantics.

## Read first (carry the context)
- **`docs/ui-polish-campaign-2026-07.md`** — **§4 (the UI-expert card-chin determination — the spec
  seed)**, §3 Wave 2 table, §5 item 4 (what to codify). Source of truth for this wave.
- `DESIGN_SYSTEM.md` — the S24 header-gutter law + on-dark family + dark-authoring rule (you're
  extending this file); Colors/dark palette; the `$dark-tint-*` tokens.
- `src/components/initiative/InitiativeStageCard.module.scss` + `.tsx`,
  `src/components/initiative/FeedEngagePanel.module.scss` + `.tsx`, `src/styles/variables.scss`.
- Memory: `project_session24_jul2026`, `project_ui_polish_campaign_jul2026`. Skills:
  **gloki-ui-review-campaign** (measure, contrast script), **gloki-change-control**,
  **gloki-session-lifecycle**, **gloki-verification-and-qa**.

## Workflow + constraints (same discipline as S1–S24)
- **Brainstorm → spec → build.** Spec at `docs/superpowers/specs/2026-07-<dd>-w2-card-chin-design.md`
  (+ plan). Docs commits BEFORE feat commits.
- **Tokens only** — the two new light hex values live in `variables.scss` as tokens; no raw hex/px in
  the card SCSS.
- **Slow USB drive:** small sequential reads, path-scoped greps, never scan `node_modules`/`dist`.
- **Verify, don't eyeball:** `npx tsc -b` clean; preview 360px light+dark (reload after each
  colorScheme flip). Measure with `.claude/skills/gloki-verification-and-qa/scripts/contrast-eval.js`:
  the `.openLink` on the `$gray-100` fill must clear ≥4.5:1 (or ≥3:1 if large) in light; the chin
  renders a visible hairline + two-tone footer on the Solution AND Vote cards, both schemes; the chin
  is clipped by the card radius (no square corners). Confirm one h1 + one AppHeader per route unchanged.
- **No `DEMO_VERSION` bump** (no fixtures). **No i18n** (no strings — if you need one, you've drifted
  into W6; stop).
- **Push is a production deploy — confirm with Eston before pushing to `origin/ui`.** PR #20 (`ui`→
  `main`) ✗ is expected Ouri-divergence, not a build failure.
- Commit style: `feat(s25): …` SCSS/tokens, `docs(s25): …` DESIGN_SYSTEM + spec. Small self-contained
  commits, `ui` runnable each. Close per gloki-session-lifecycle (§7 flip P7-W2 ✅ + §8 changelog +
  i18n packet note + memory + session-26 W3 prompt).

## Open decisions to lock (Eston's calls — surface with your recommendation, don't assume)
1. **Chin light fill = `$gray-100` (`$footer-surface`)?** (recommended, per §4) vs a lighter/heavier
   well. §4's reasoning: rule-alone doesn't deliver Eston's "different colour for the very bottom";
   fill-alone fails in dark (`$dark-surface` is already near-black). Confirm the combination.
2. **Does the Vote card genuinely share the same components** (so one `.chin` covers both), or does it
   need its own pass? Verify against HEAD before promising "one treatment."
3. **Any card beyond Solution/Vote** that renders a DiscussionPill + open row and should inherit the
   chin now (vs deferred)? Enumerate from the grep, recommend scope.

When ready: read `docs/ui-polish-campaign-2026-07.md` §4 + §3 Wave 2, re-verify the premises above,
then brainstorm the spec.
