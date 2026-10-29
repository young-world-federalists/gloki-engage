# Session 32 — Mandate-page recompose (walkthrough-campaign Wave D)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This session
implements **Wave D** (the final wave) of the 2026-07-13 walkthrough campaign
([docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) — read §5
(Wave D, F1–F6) and §6 (decisions D6–D9) FIRST; they hold the verified findings, file:line
evidence, and the recommended decisions). Waves A–C shipped in S30 + S31 (push HELD for Eston).
This is new work on top of them.

UI-composition only — **no contract methods, no fixtures, no DEMO_VERSION bump, no routes.**

## Tasks (build order — campaign §5)

### F1 — Top air on the mandate page
`padding-top: $spacing-lg` on `.page` in `MandatePage.module.scss` (the first card tucks under the
sticky bar, measured −2.5px gap). **Never** touch `Container.module.scss` — five other pages add
their own top air and would double up.

### F2 — Summary-card eyebrow → "Mandate summary" (decision D6)
New key `mandate.card.eyebrow`, en "Mandate summary" — the fr/sw copy already exists verbatim on
`mandate.card.aria` ("Résumé du mandat" / "Muhtasari wa agizo"), so lift those values into the new
key. Switch the section to `aria-labelledby` pointing at the now-visible eyebrow (avoid a duplicate
SR announcement). The **document card keeps `mandate.card.brand`** ("Gloki Mandate") untouched — it's
a shared key (S23 "one brand label everywhere"); never edit the shared key. Shield icon: **keep it**
on the summary eyebrow (D6 recommendation — visual continuity; the text change is enough).

### F3 — Document-card status badge → top-right (F3)
Move the "Pending ratification" Badge from `.metaRow` into the eyebrow flex row with
`margin-left:auto` (mirror the summary card / `MandateCard`). Keep the "Ratified {date}" pairing
logic intact (the S17 rule: the ratified-date line pairs with the badge, never sits beside a Pending
badge); use a flex row (not absolute) so a 360px title wrap stays safe. `.metaRow` dissolves.

### F4/F5 — Document-card reorder + provenance strip (decision D7)
Target order: eyebrow+status → h2 title → preamble → commitments → indicators → **bottom provenance
strip**: the turnout line ("16 of 18 eligible voters", + its InfoDisclosure "(i)" — relocate as one
unit) + the plain/spec `SegmentedControl`. Recommended (**D7 = chin**): style the strip as the
document card's two-tone chin (`$footer-*` tokens), tying into Wave A's chin vocabulary. Documented
trade-offs Eston accepts by choosing this: the view toggle sits after the content it swaps
(SR/keyboard order), the plain↔spec height jump happens at the bottom, and the W4 4.7
"turnout-up-high carries the is-this-vote-real moment" placement is deliberately reversed. **Keep:**
single-h1 law (document title stays h2), the `aria-labelledby` ids, the indicators-disclosure wiring,
and `#docAnchor` scroll-target behaviour ("View full" must still land with the title visible).

### F6 — "From mandate to action" becomes a card (decision D8)
Restyle the bare `<section>` in place — add sibling card chrome (white/`$dark` bg, `$gray-200`
border, `$radius-lg`, `$shadow-sm`, `padding: $spacing-lg`) in `AdoptionFramework.module.scss`
(**D8 = in place**; the mandate siblings all hand-roll chrome, so shared-`Card` adoption here would
be the page's odd one out). **AdopterCard `<li>`s are white-on-white inside a card** → switch to
border-only or `$gray-50`. Keep the h2 + `aria-labelledby`, the disclosure collapse (Eston likes it),
and the `$info-surface` summary box (re-check dark contrast).

### D9 — Share affordance near "From mandate to action"
**Recommendation: skip** — the hero `MandateCard`'s S11 clean-link Share already exists on the same
page. If Eston wants it anyway: extract the link-builder from `MandateCard.tsx` and pass the ROUTE
mandateId down (AdoptionFramework currently gets the fixture key, not guaranteed identical).

## Open decisions to lock BEFORE building (batch to Eston, recommend-then-confirm)

- **D6** — Shield icon stays on the renamed "Mandate summary" eyebrow? **Keep** [recommended].
- **D7** — Doc-card bottom block: plain block vs **two-tone chin** [recommended] (one card language app-wide).
- **D8** — AdoptionFramework chrome: **hand-rolled sibling-style in place** [recommended] vs shared `Card` kit.
- **D9** — Add a share affordance near From-mandate-to-action: **skip** [recommended] (hero Share exists).

If Eston already annotated the campaign doc §6, take those as locked.

## Re-verify these premises vs HEAD (the recurring lesson — 18 straight sessions caught rot; S31's catch was in DESIGN_SYSTEM.md's own §5-rule-11)

**The campaign doc's line numbers are from `c91bd86` (pre-S30/S31) — grep the CURRENT ranges; do not
trust them.** Verify each before building:

- `MandatePage.module.scss` `.page` still lacks top padding (grep — S31 didn't touch it).
- `MandateDocument.tsx` order still masthead → turnout → toggle → body; `mandate.card.brand` still
  shared by both the summary and document cards; `mandate.card.aria` still carries the "Mandate
  summary" copy in fr/sw (the source for the new `mandate.card.eyebrow`).
- `AdoptionFramework.module.scss` still surface-less (`.section` = bare flex column); AdopterCard
  `<li>` still white bg; the `showAdopters` disclosure still exists.
- `MandateCard.tsx` still the hero with the S11 pubkey-free Share link (D9 fallback source).
- en.ts is still the partial-dictionary model (English in inline `t()` fallbacks; parity 1137 after
  S31). Copy changes touch tsx + fr + sw, never en.ts. Run the parity scanner
  (`.claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`).
- **S30/S31 shipped:** the `chinExtras` slot, `ProblemChinExtras`, the two-tone stage-feed chin, the
  `ProgressBar` threshold bar (S30), the pinned suggest ContextCard, and the icon+caption
  action-button pattern (S31) all now exist — reuse the `$footer-*` chin tokens + the codified
  icon+caption law; don't rebuild them.

## Read first

- [docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) §5 + §6
- [docs/superpowers/specs/2026-07-14-suggest-flow-captions-design.md](../superpowers/specs/2026-07-14-suggest-flow-captions-design.md) (S31, for the shipped chin/caption context)
- DESIGN_SYSTEM.md "Card chin / footer" + "Buttons → icon+caption action buttons" + "ContextCard" (the S30/S31 laws)
- `src/pages/collaboration/MandatePage.*`, `src/components/**/MandateDocument.tsx`, `AdoptionFramework.*`, `MandateCard.tsx`
- Memory: `project_session31_jul2026` (Waves B+C), `project_session30_jul2026` (Wave A), `project_walkthrough_campaign_jul2026` (the plan)

## Workflow + constraints (same discipline as S1–S31)

Brainstorm-lock D6–D9 → spec commit (`docs/superpowers/specs/2026-07-XX-mandate-page-recompose-design.md`)
→ build in small `feat(s32):` commits, `ui` runnable each → per-chunk `npx tsc -b` + `npm run build`
+ grep gates → controller-only preview at 360px light+dark en/fr/sw on the **published-mandate page**
(the mandate hero + document card + adoption framework; the mandate ActivityCard is reachable from
the Mandate stage feed / identity mandate page) → i18n parity + packet append for new keys → Opus
whole-branch review → **hold the push for Eston's explicit green light** (S30+S31 pushes are likely
still held; coordinate — Eston may want S30+S31+S32 pushed together, closing the whole P8 campaign).
Slow-drive I/O: targeted reads, sequential subagents only, controller drives the one preview. PR
#20's ✗ vs main stays expected divergence.

When ready: verify the premises, then batch D6–D9 to Eston with your recommendations. This is the
**final wave** — on completion, mark P8 ✅ DONE in MASTER_TODO §7.
