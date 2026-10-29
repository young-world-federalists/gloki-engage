# Mandate-page recompose — design spec (S32, walkthrough-campaign Wave D)

**Session:** S32 · **Date:** 2026-07-14 · **Branch:** `ui` · **Class:** UI-only
(no contract methods, no fixtures, no `DEMO_VERSION` bump, no routes)

Final wave of the 2026-07-13 walkthrough campaign
([docs/ui-walkthrough-campaign-2026-07-13.md](../../ui-walkthrough-campaign-2026-07-13.md) §5 F1–F6,
§6 D6–D9). Waves A (S30) + B/C (S31) shipped and are **already pushed/live** (origin/ui ==
`5009ef1`; the prompt's "push HELD" note is stale — verified at kickoff). This wave recomposes the
**published-mandate page** (`/mandate/:communityId/:mandateId`), which stacks four hand-rolled
sibling cards inside `MandatePage`:

```
MandateCard (hero/summary)  →  RatificationPanel  →  MandateDocument (in #docAnchor)  →  AdoptionFramework
```

All target files live in `src/components/mandate/` (the prompt's `src/pages/collaboration/` path is
wrong — corrected here).

## Decisions locked (Eston, 2026-07-14, via kickoff batch)

| # | Decision | Locked |
|---|---|---|
| D6 | Shield icon on the renamed "Mandate summary" eyebrow | **Keep shield** (visual continuity; only the text changes) |
| D7 | Doc-card bottom provenance strip styling | **Two-tone chin** — and extend the DESIGN_SYSTEM chin law to cover the new padded-card variant |
| D8 | AdoptionFramework chrome | **Hand-rolled sibling-style in place** (matches the 3 other mandate cards) |
| D9 | Share affordance near "From mandate to action" | **Skip** (the hero's S11 clean-link Share already exists on the page) |

Eston accepts the D7 trade-offs on the record: the view toggle sits **after** the content it swaps
(SR/keyboard order), the plain↔spec height jump now happens at the card bottom, and the W4 4.7
"turnout carries the is-this-vote-real moment" up-high placement is deliberately reversed.

## Premises re-grounded vs HEAD `5009ef1` (all hold)

- `MandatePage.module.scss` `.page` = flex column, no `padding-top`; outer owns `cs.container`.
- `MandateDocument` order = masthead(eyebrow `mandate.card.brand` + `.metaRow`[badge + ratified]) →
  turnout+‌(i) → SegmentedControl → plain/spec body.
- `mandate.card.aria` (fr "Résumé du mandat" / sw "Muhtasari wa agizo") is used **only** as the hero
  section's `aria-label` (MandateCard.tsx:77). `mandate.card.brand` ("Gloki Mandate") is shared by
  `MandateDocument`, `MandateEngage`, and the hero `MandateCard`. `mandate.card.eyebrow` does not
  exist. en.ts holds no `mandate.card.*` keys (partial-dictionary model). Parity 1137/1137.
- `AdoptionFramework` `.adoption` = bare flex column (surface-less); AdopterCard `<li>.card` =
  `background: white`/`$dark-bg`; `$info-surface` `.summary` box; `showAdopters` disclosure present.
- Hero `MandateCard` has the S11 pubkey-free `share()` built from route `communityId`/`mandateId`
  props; `AdoptionFramework` receives `mandate.id` (fixture key) — the D9 divergence is real.
- Default fixture (`adaptation`) is `status: 'ratified'` → the demo renders the **"Ratified" success
  badge + "Ratified {date}" line**. The pending state (`status: 'published'`) exists only via code
  path and must stay correct.

## The build (F1–F6)

### F1 — Top air on the mandate page
Add `padding-top: $spacing-lg` to `.page` in `MandatePage.module.scss`. **Never** touch
`Container.module.scss` (five other pages add their own top air — would double up). The first card
currently tucks −2.5px under the sticky bar.

### F2 — Summary-card eyebrow → "Mandate summary" (D6)
In `MandateCard.tsx`:
- Add i18n key `mandate.card.eyebrow`: en fallback `"Mandate summary"`, fr `"Résumé du mandat"`,
  sw `"Muhtasari wa agizo"` (values lifted from `mandate.card.aria`).
- The visible `.brand` span shows `t('mandate.card.eyebrow', 'Mandate summary')` (was
  `mandate.card.brand`). Give the span a stable id (`mandate-summary-eyebrow`).
- Switch the `<section>` from `aria-label={mandate.card.aria}` to
  `aria-labelledby="mandate-summary-eyebrow"` so the accessible name is the visible eyebrow text
  only (the id sits on the **text span**, not the `.eyebrow` row, so the "Pending ratification"
  badge is not swept into the accessible name). Keep the ShieldCheck icon (D6).
- **Retire `mandate.card.aria`** (delete from fr + sw) — it is now orphaned; its values live in
  `mandate.card.eyebrow`. Net parity: −1 +1 = **unchanged (1137)**.
- The document card and `MandateEngage` keep `mandate.card.brand` ("Gloki Mandate") untouched — the
  shared brand key (S23 "one brand label everywhere"). F2 only removes the hero as one of its
  consumers; it does not edit the key.

Result: the hero reads "Mandate summary", the formal document reads "Gloki Mandate" — the two cards
stop saying the same thing.

### F3 — Document-card status badge → top-right
In `MandateDocument.tsx` / `.module.scss`:
- The `.masthead` eyebrow becomes a **flex row**: eyebrow text (left) + status Badge
  (`margin-left:auto`), mirroring the hero `MandateCard` eyebrow. New class `.eyebrowRow`
  (`display:flex; align-items:center; gap:$spacing-sm`); the `<p class="eyebrow">` keeps its type.
- `.metaRow` **dissolves**. The badge conditional (`status === 'ratified' ? Ratified : Pending`)
  moves into the eyebrow row.
- The `.ratified` "Ratified {date}" line stays **gated by `status === 'ratified'`** and renders on
  its own line directly under the title (still `.ratified`, `CalendarCheck` + date). This keeps the
  S17 rule intact: the ratified-date only appears when ratified and is **never adjacent to a Pending
  badge** (pending → no date line, badge alone in the eyebrow row).
- Flex row (not absolute) so a 360px title wrap stays safe.

### F4/F5 — Document-card reorder + bottom provenance chin (D7)
Target render order in `MandateDocument.tsx`:
```
masthead (eyebrowRow[eyebrow + status] → h2 title → [ratified date])
→ preamble → commitments → indicators              (plain view)
   OR spec body                                     (spec view)
→ provenance chin: turnout line + (i)  //  SegmentedControl (plain/spec toggle)
```
Move the `.turnout` block **and** the `SegmentedControl` from directly-after-masthead to **after**
the plain/spec body, wrapped in a new `.provChin` element that is the terminal child of `.document`.

**The chin bleed technique (new — the document card is uniformly padded).** Unlike
`InitiativeStageCard` (whose card is `padding:0; overflow:hidden` with per-section padding), the
`.document` card has `padding: $spacing-lg` + `gap: $spacing-xl`. So `.provChin` bleeds to the card
edges with negative margins that cancel the card padding, and rounds its own bottom corners to match:

```scss
.provChin {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  // cancel the card's $spacing-lg inset on left/right/bottom; the flex `gap:$spacing-xl`
  // above still provides the top separation.
  margin: 0 (-$spacing-lg) (-$spacing-lg);
  padding: $spacing-md $content-gutter;      // chin padding law (matches other chins)
  background: $footer-surface;
  border-top: 1px solid $footer-border;
  border-bottom-left-radius: $radius-lg;     // match the card corner so the fill doesn't square off
  border-bottom-right-radius: $radius-lg;

  @include dark {                            // dark-authoring rule: re-declare bg AND border
    background: $footer-surface-dark;
    border-top-color: $footer-border-dark;
  }
}
```
The turnout row keeps its icon + text + `.verifyInfo` (i) at `margin-left:auto`; the `.turnout`
class loses its own `$gray-50` pill background/border/radius/padding (the chin now provides the
surface) — it becomes a plain flex row inside the chin. The `SegmentedControl` stays `fullWidth`
below the turnout row.

**Keep:** single-h1 law (document title stays `<h2>`), the `aria-labelledby` ids on
commitments/indicators sections, the indicators-disclosure wiring, and `#docAnchor` scroll-target
behaviour ("View full" must still land with the title visible — the title is still the first content
after the eyebrow row, so `scroll-margin-top` is unaffected).

### F6 — "From mandate to action" becomes a card (D8)
In `AdoptionFramework.module.scss` (single-file; hand-rolled sibling-style, D8):
- `.adoption` gains card chrome: `background: white` (dark `$dark-bg`), `border: 1px solid
  $gray-200` (dark `$dark-border`), `border-radius: $radius-lg`, `box-shadow: $shadow-sm`,
  `padding: $spacing-lg`. (Keep the existing `gap: $spacing-lg`.) This matches the three sibling
  mandate cards (`MandateCard`/`MandateDocument`/`RatificationPanel`), which all hand-roll chrome.
- AdopterCard `<li>.card` is now **white-on-white** inside the white card → switch its fill to
  `$gray-50` (light) so it reads as a nested item, keeping the `$gray-200` border. Dark stays
  `$dark-bg` on the `$dark-bg` card → switch to `$dark-surface` so nested items stay distinct
  (re-check: `$dark-surface` is the recessed tone, visibly separate from the `$dark-bg` card).
- **Re-check the `$info-surface` `.summary` box contrast** inside the new white card (light: `$info-
  on-surface` #1e40af on `$info-surface` #dbeafe is unchanged and AA; dark: `.summary` already
  overrides to `$info-surface-dark` + `$dark-text` per the S16 C5 note — verify still ≥4.5:1).
- Keep the `<h2 id="adoption-heading">` + `aria-labelledby`, the `showAdopters` disclosure collapse
  (Eston likes it), the Banner, and the modal.

### D9 — Share affordance — SKIP
No change. The hero `MandateCard` Share (clean, pubkey-free) already sits on the same page. If
revisited later, the follow-up must extract the link-builder from `MandateCard.tsx:47-71` and thread
the **route** `mandateId` down (AdoptionFramework currently receives the fixture key).

## DESIGN_SYSTEM.md — chin-law extension (required by D7)

The §"Card chin / footer" law currently scopes chins to (a) full-bleed only as the terminal child
of an `overflow:hidden; padding:0` card, (b) "DiscussionPill + open-action row" content, (c) "one
interaction grammar per chin — every control is an action button." D7 introduces a second chin
kind. Add a subsection defining the **provenance/utility chin**:

- **Padded-card bleed variant:** on a card with uniform `padding`, a terminal chin bleeds via
  `margin: 0 (-$pad) (-$pad)` + its own `padding: $spacing-md $content-gutter` + matching
  `border-bottom-*-radius`. Same `$footer-surface(-dark)` fill + `$footer-border(-dark)` hairline
  top rule and the same dark-authoring re-declaration rule.
- **Content:** a provenance/utility chin MAY carry non-action content (a short provenance line, a
  disclosure (i), a view toggle) — the "every control is an action button" rule is specific to
  **engage chins** (DiscussionPill + open-action). Name `MandateDocument`'s `.provChin` as the
  reference implementation.
- The `MandateCard` hero remains chin-exempt (it keeps `.actions`).

## i18n

- **Add** `mandate.card.eyebrow` → fr `"Résumé du mandat"`, sw `"Muhtasari wa agizo"` (en = inline
  fallback `"Mandate summary"`).
- **Delete** `mandate.card.aria` from fr + sw (orphaned by F2).
- Net: parity **1137 → 1137**. Touch tsx + fr + sw only, never en.ts. Append an "S32" section to
  `docs/i18n-native-review-candidates.md` (the one changed/renamed key).

## Verification

- `npx tsc -b` + `npm run build` clean after each chunk; `ui` runnable each commit.
- Grep gates: no ad-hoc hex/px/`rgba(...)` literals in the touched SCSS; `$gray-400` text gate clean.
- Parity scanner (`.claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`) → OK, 1137.
- Controller-only preview at **360px, light + dark, en/fr/sw** on the published-mandate page
  (hero + document card chin + adoption card). Verify: F1 top gap; F2 hero eyebrow "Mandate
  summary"/localized + shield + SR name; F3 badge top-right + ratified date placement (ratified
  state; reason about pending via code); F4/F5 chin bleed + rounded corners + toggle-after-body +
  turnout/(i)/toggle legible on `$footer-surface(-dark)`; F6 nested AdopterCard distinct from the
  card + `.summary` AA in dark; `#docAnchor` "View full" still lands on the title.
- Opus whole-branch review → 0 Critical / 0 Important (or fixes applied). Hold the push for Eston.

## Out of scope

- Content enrichment of the adoption section (campaign §5.7) — post-handoff tier, filed for later.
- Any shared-`Card`-kit convergence of the four mandate surfaces (separate refactor lane).
- Contract/fixture/route/DEMO_VERSION changes.
