# Spec — S25 / UI Polish Wave 2: card-chin footer separation

**Date:** 2026-07-09 · **Branch:** `ui` · **Baseline HEAD:** `04dcd1a` (S24 W1 + W1b shipped)
**Campaign:** `docs/ui-polish-campaign-2026-07.md` — Wave 2 (§3), seeded by the UI-expert
determination in §4. Codifies §5 item 4.

> **One sentence:** make the bottom actions row (DiscussionPill + open action) read as a distinct
> **card footer** — not another content block — via ONE shared `.chin` treatment (hairline top rule +
> recessed footer fill), and codify the `$footer-*` token family in `DESIGN_SYSTEM.md`.

This wave changes **no product behaviour**: new `$footer-*` tokens + SCSS/structure on two card
components + a DESIGN_SYSTEM entry. No fixtures (no `DEMO_VERSION` bump), no strings (no i18n).

---

## 1. Decisions locked (Eston, 2026-07-09)

1. **Chin recipe = rule + fill (§4 combination).** A 1px hairline top rule (`$footer-border`) PLUS a
   recessed `$gray-100` fill (dark: `$dark-tint-subtle` raised strip). Rule = scheme-agnostic
   separator; fill = the "different colour for the very bottom."
2. **Uniform across all 5 community stage cards.** The chin lives in the shared `InitiativeStageCard`
   shell, so it applies to Problem / Discussion / Solution / Vote / Mandate ActivityCards at once. No
   per-stage conditional.
3. **Stage feed (`FeedEngagePanel`) = hairline rule only, no fill.** Its host (StageFeedView `.card`)
   pads content by `$spacing-lg` and has no `overflow:hidden`, so a filled full-bleed footer there
   would need fragile host-coupled negative margins — the ad-hoc-padding coupling the campaign fights.
   So FeedEngagePanel gets the rename + separator **rule** + openLink recolor; the two-tone **fill**
   lands on the community cards where it is structurally free.

## 2. Premises re-verified vs HEAD `04dcd1a` (three refinements to the plan)

- `.actionsRow` present: `InitiativeStageCard.module.scss:127`, `FeedEngagePanel.module.scss:24`;
  used in both TSX (`InitiativeStageCard.tsx:176`, `FeedEngagePanel.tsx:201`).
- `.card` has `overflow:hidden` (`InitiativeStageCard.module.scss:5`); shared `Card` supplies
  `border-radius:$radius-lg` (`Card.module.scss:6`) → the chin's bottom corners clip naturally.
- `$footer-*` absent; substrate present: `$gray-100 #f1f5f9`, `$gray-200 #e2e8f0`,
  `$dark-border #475569`, `$dark-tint-subtle rgba(255,255,255,.06)`, `$content-gutter:$spacing-lg`
  (16), `$primary-dark #2563eb`, `$spacing-md` (12) / `$spacing-lg` (16), `$radius-lg`, `$breakpoint-sm`.
- **Refinement A — drop §C1's "move `.teaser` above the chin".** `.teaser` renders only in the
  *collapsed* (else) branch; the chin only when *expanded*. They never coexist. Restructure is just:
  pull `.actionsRow` out of `.engage` as a sibling in `.panel`. `.teaser` untouched.
- **Refinement B — scope is all 5 cards, not Solution+Vote.** Every ActivityCard passes `stageNav`
  (chin always renders) and children (engage body always populated → the `$gray-50` engage +
  `$gray-100` chin two-tone always works). Verified across Problem/Discussion/Solution/Vote/Mandate.
- **Refinement C — FeedEngagePanel host.** StageFeedView `.card`: `padding:$spacing-lg`, **no**
  `overflow:hidden` → drives decision #3 above.
- **Contrast (measured, WCAG AA):** `.openLink` `$primary` = **3.68:1 on white** (pre-existing
  light-mode fail) / 3.36:1 on `$gray-100`. `$primary-dark` = **5.17:1 on white**, **4.72:1 on
  `$gray-100`** → clears AA either way. `$primary-on-dark` on `$dark-bg` = 5.75:1 (dark already
  correct). ⇒ recolor openLink → `$primary-dark` regardless of the fill.

## 3. Tokens (`src/styles/variables.scss`)

Add a `// Card-chin / footer` block co-located with the layout/gutter tokens (near `$content-gutter`),
reusing proven values — this is naming/one-home, **not** new raw colour:

```scss
$footer-surface:      $gray-100;          // #f1f5f9 — recessed card-footer well (light)
$footer-surface-dark: $dark-tint-subtle;  // rgba(255,255,255,.06) — raised footer strip (dark)
$footer-border:       $gray-200;          // #e2e8f0 — footer hairline top rule (light)
$footer-border-dark:  $dark-border;       // #475569 — footer hairline top rule (dark)
```

## 4. `InitiativeStageCard` — full chin (rule + fill, full-bleed)

**SCSS** (`InitiativeStageCard.module.scss`): rename `.actionsRow`→`.chin`; add the recipe. Keep the
nested `.openBtn { flex:1; min-width:200px }`. `.engage` keeps its own `border-top` (read→engage
divide). The `.openBtn` (solid `$primary` fill) is unaffected by the chin fill.

```scss
.chin {
  display: flex;
  align-items: center;
  justify-content: space-between;   // NEW — was relying on gap + openBtn flex
  gap: $spacing-sm;
  flex-wrap: wrap;
  padding: $spacing-md $content-gutter;   // 12/16 — matches .engage's 16px edge
  background: $footer-surface;
  border-top: 1px solid $footer-border;

  .openBtn { flex: 1; width: auto; min-width: 200px; }   // unchanged, re-nested under .chin
}
```
Dark block (add to existing `@include dark`):
```scss
.chin { background: $footer-surface-dark; border-top-color: $footer-border-dark; }
```
Mobile block (add to existing `@media (max-width:$breakpoint-sm)`):
```scss
.chin { padding: $spacing-md; }   // matches .engage/.summary mobile 12px
```

**TSX** (`InitiativeStageCard.tsx`): move the chin OUT of `.engage` → sibling terminal child of
`.panel`. Rename `styles.actionsRow`→`styles.chin`.

```jsx
<div className={styles.engage}>
  {children}
</div>
{(stageNav || (onOpen && openLabel)) && (
  <div className={styles.chin}>
    {stageNav && <DiscussionPill … />}
    {onOpen && openLabel && <button className={styles.openBtn} …>…</button>}
  </div>
)}
```
`.panel` has no flex-gap, so the chin stacks flush below `.engage`, divided only by its border-top.
Terminal child of the `overflow:hidden` `.card` → bottom corners clip to `$radius-lg` (no explicit
radius needed). Two-tone footer: read (white/`$dark-bg`) → engage well (`$gray-50`/`$dark-surface`) →
chin (`$gray-100`/`$dark-tint-subtle`).

## 5. `FeedEngagePanel` — hairline rule only (no fill)

**SCSS** (`FeedEngagePanel.module.scss`): rename `.actionsRow`→`.chin`; keep its existing
`justify-content:space-between`. Add the separator **rule** + air; **omit** `background` and the
horizontal `$content-gutter` padding (the host card already provides the 16px gutter — a fill/gutter
here would double-inset and float as a boxed rectangle). Recolor `.openLink`→`$primary-dark`.

```scss
.chin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  flex-wrap: wrap;
  padding-top: $spacing-md;              // air above/below the rule (panel gap sits above)
  border-top: 1px solid $footer-border;  // engage → footer divide (header-body-footer)
}
.openLink { … color: $primary-dark; … } // was $primary (3.68:1 on white → 5.17:1)
```
Dark block: keep `.panel { border-top-color: $dark-border }` + `.openLink { color: $primary-on-dark }`;
add `.chin { border-top-color: $footer-border-dark }`.

**TSX** (`FeedEngagePanel.tsx:201`): rename `styles.actionsRow`→`styles.chin`. No structural move —
the chin is already the terminal child of `.panel`; `.panel` keeps its own top rule (host→panel
divide), the chin adds the body→footer divide.

## 6. `DESIGN_SYSTEM.md` — codify the card-chin/footer pattern (campaign §5 item 4)

Add a **Card-chin / footer** subsection (extends the S24 header-gutter law + on-dark family +
dark-authoring rule). State:
- The `$footer-*` token family is the **one home** for footer surface + border (light + dark);
  never re-hardcode `$gray-100`/`$gray-200` for a footer.
- Any card that renders a **DiscussionPill + open-action row** ends in a `.chin`: a hairline
  `border-top:1px $footer-border` separator, plus a recessed `background:$footer-surface` fill **when
  the chin can be full-bleed** (terminal child of an `overflow:hidden` card, or an explicit
  `border-bottom-{left,right}-radius:$radius-lg` when the host lacks it).
- When the chin sits inside an already-padded host (no full-bleed), use the **rule only** — a fill
  would double-inset and read as a floating box. Do not add per-host negative-margin padding hacks.
- Dark-authoring: the chin re-declares its background (`$footer-surface-dark`) and border
  (`$footer-border-dark`) in `@include dark` (per the S24 dark-authoring rule).
- Links on the fill use `$primary-dark` (light) / `$primary-on-dark` (dark) — plain `$primary` fails
  AA on both white and `$gray-100`.

## 7. Verification (no test framework — preview + measure)

1. `npx tsc -b` clean.
2. Preview at **360px**, both schemes (reload after each `colorScheme` flip):
   - Solution + Vote community cards (and Problem/Discussion/Mandate): expand → the footer chin shows
     a visible hairline top rule + a recessed fill distinct from the `$gray-50` engage body; bottom
     corners clip to the card radius (no square corners).
   - `/stage/*` feed: expanded card footer shows the hairline rule dividing engage from the
     pill+openLink row; openLink is legible.
3. Contrast via `contrast-eval.js` math (already measured §2): openLink `$primary-dark` ≥ 4.5:1 on
   white (5.17) and `$gray-100` (4.72); the DiscussionPill reads on both surfaces (verify in preview).
4. One `<h1>` + one AppHeader per route unchanged (chin is intra-card, touches no page chrome).

## 8. Out of scope (do NOT pull in)

W1b canonical page-container; the "In discussion" reframe (W3); card *interior* padding tokenization
(W5); any copy/i18n (W6). No FeedEngagePanel fill/full-bleed (deferred by decision #3). No StageFeedView
layout changes.

## 9. Commit plan (docs before feat; `ui` runnable each)

1. `docs(s25): spec + plan — W2 card-chin footer separation`
2. `feat(s25): add $footer-* token family (card-chin/footer, one home)`
3. `feat(s25): InitiativeStageCard chin — rule + two-tone fill, detach from .engage`
4. `feat(s25): FeedEngagePanel chin — separator rule + openLink $primary-dark`
5. `docs(s25): DESIGN_SYSTEM — codify card-chin/footer pattern + $footer-* tokens`

Push to `origin/ui` only on Eston's explicit green light (production deploy).
