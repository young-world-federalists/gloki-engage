# UI walkthrough campaign — 2026-07-13 (Eston's click-through → S30+ implementation)

**Status: PLANNED, not built.** This is the successor campaign to
[docs/ui-polish-campaign-2026-07.md](ui-polish-campaign-2026-07.md) (S24–S29, COMPLETE).

**Source:** Eston's live walkthrough dictation, 2026-07-13. Every critique below was verified the
same day against HEAD `c91bd86` (branch `ui`, clean tree) by a 7-unit read-only code-facts fleet
plus a controller-driven preview walk at 360px. **No code changed in the review session.**

**How to run this:** one wave per session (S30 = Wave A, S31 = Waves B+C, S32 = Wave D). Each
session follows the standing discipline: re-verify this doc's premises vs HEAD first (they WILL
rot), spec → build in small commits → Opus whole-branch review → Eston's explicit push gate.
UI-only campaign: **no contract methods, no fixtures, no DEMO_VERSION bump, no route changes.**

---

## 1. Verified findings (what Eston saw, and what the code says)

Verdicts: ✅ confirmed · 🔶 confirmed-with-nuance · ❌ premise corrected.

| # | Critique (Eston's words, condensed) | Verdict | Ground truth |
|---|---|---|---|
| A1 | Suggest-to-author page: "no space between the problem and the name of the author" | 🔶 | Measured 8px — only the AppHeader `.titleBlock` bottom padding (`$heading-gap`, `AppHeader.module.scss:185`). `main.content` has top-padding 0 and the ContextCard is its first child (no flex gap applies). Reads as touching. |
| A3 | Problem could sit "above the text input box… like a first message in the chat" | ✅ viable | Layout wholly owned by `SuggestionDmView.tsx:122-180`; ContextCard accepts `className`, only other consumer is DiscussionStageView. Fully localized move. |
| B1/B2 | "Send suggestion to author" + "Problem code" should be pills in the chin | ✅ | Both render in ProblemEngage's card BODY (`ProblemEngage.tsx:78-93`), above the chin. The chin has **no extras slot** — contents are hard-coded in its two owners (`InitiativeStageCard.tsx:178-200`, `FeedEngagePanel.tsx:200-216`). |
| B3 | "Agreed by at least half of your community" is "just sort of randomly there" | ✅ | `problems.thresholdMetHint`, a bare muted `<p>` between the vote flow and the code chip (`ProblemEngage.tsx:72-76`). A *second* string for the same fact (`card.teaserAgreed`) renders on the collapsed card only. |
| C1 | Red "Problem" pill in the stage row "looks like a button, but it's not" | 🔶 | Correct perception; non-interactivity is the **locked S19 W2 decision** ("pure progress indicator — nothing here navigates", `InitiativeStageStrip.tsx:29-33`). The current pill borrows the same visual grammar (radius/tint/border) as the *interactive* DiscussionPill in the same card. Fix the styling, not the behavior. |
| C1b | Row is "repetitive with the problem at the top" | 🔶 | The summary Badge and the strip use the *same* i18n keys, so the stage name appears twice when expanded. But the Badge is the only stage identity when collapsed, and the strip is the only pipeline-position display. Pure removal of either loses information. |
| C2 | Red pill "is touching the edge of the card, no padding there at all" | ✅ | Community-feed cards only: `.panel` and `.stageNavRow` have zero horizontal padding while every sibling row is inset 16px (`InitiativeStageCard.module.scss:79-90` vs `:97,:120,:136`). Violates the W1 `$content-gutter` law. On the stage feed the host card pads 16px, so the strip is fine there. |
| C3 | Green progress bar "has this gray line at the very end… not sure what it's doing" | ✅ | NOT the shared ProgressBar kit. It's ProblemVoteFlow's bespoke bar: a 2×16px `$gray-600` `thresholdMarker` div hardcoded `left:'100%'` (`ProblemVoteFlow.tsx:193`), overhanging an `overflow:visible` track. The fill is normalized to the 50%-agreement threshold, so the "threshold marker" is a de-facto end-cap — fully redundant once the bar turns green. The bespoke bar also has **zero ARIA**. |
| C4 | "These issues are on all the other cards as well" | 🔶 | The strip renders from exactly 2 sites (`InitiativeStageCard.tsx:133`, `FeedEngagePanel.tsx:146`) reached by all 5 community cards + all stage-feed cards. Fix once per host; the gutter fix belongs ONLY in InitiativeStageCard (adding it globally would double-indent the stage feed). |
| D1 | Solution buttons need "small labels below the icon and the number" | ✅ | `SolutionsBoard.tsx:546-573`: ThumbsUp+count, Microscope+count, GitMerge **icon-only, no count**. No visible text. Budget at 360px ≈ 98px/button — short EN captions fit; the existing fr aria strings are sentence-length and will NOT fit → new short caption keys needed (S29 `menuButton`/`menuCaption` split precedent, `CommunityCard.tsx:52-64`). |
| E1–E3 | The chin "should be the same across all of the cards… on the initiative view the chin doesn't have this different color" | ✅ (naming 🔶) | **There is no initiative view** — `/initiative/*` root redirects to the community page with the card expanded (`InitiativeView.tsx:69-75`). The untinted surface Eston saw is the **stage feed**: `FeedEngagePanel`'s chin is deliberately rule-only per the S25 spec §1.3 (host card pads 16px + no `overflow:hidden`, so a fill would float — `FeedEngagePanel.module.scss:23-35`). Measured: community chin bg `rgb(241,245,249)`, stage-feed chin transparent. 1.5 hand-rolled implementations, no shared code. MandateCard (published page hero) has no chin at all. |
| F1 | Mandate view: "no padding between the nav bar and the first card" | ✅ | Measured gap **−2.5px** (card tucks under the sticky bar). `MandatePage.module.scss` `.page` adds no top padding while every comparable page adds its own top air (`HomeView.module.scss:5`, `StageFeedView.module.scss:5`, `DiscussionStageView.module.scss:8-10`). |
| F2 | Shield eyebrow should say "Mandate summary"/"Snapshot"; the big card owns "Gloki mandate" | ✅ | Summary eyebrow = `mandate.card.brand` ("Gloki Mandate") — a key **shared** with the document card's eyebrow (S23 "one brand label everywhere", `MandateDocument.tsx:99-106`). Bonus: the summary card's aria-label is *already* "Mandate summary" (`mandate.card.aria`, fr/sw translations exist). Rename needs a NEW key, never an edit to the shared one. |
| F3 | "Pending ratification" on the document card → top-right like the summary card | ✅ | Summary card: Badge in the eyebrow flex row with `margin-left:auto`. Document card: Badge in `.metaRow`, third child under the title (`MandateDocument.tsx:105-124`). Keep the S17 rule: the "Ratified {date}" line pairs with the badge and must never sit next to a Pending badge. |
| F4/F5 | Spec toggle + "16 of 18 eligible voters" → bottom of card, so title+summary sit together | ✅ | Current order: masthead → turnout row → SegmentedControl → preamble (`MandateDocument.tsx:105-162`). Two blocks separate title from text. NOTE: turnout-up-high was a deliberate W4 4.7 call ("carries the is-this-vote-real moment") — moving it down is a conscious reversal, Eston's call, record it. |
| F6 | "From mandate to action… not on a card, looks a little weird" | ✅ | `AdoptionFramework` renders a bare `<section>` (flex column, no surface — `AdoptionFramework.module.scss:3-7`) while all siblings hand-roll card chrome. Nuance: *no* mandate component uses the shared `Card` kit. The org-collapse Eston likes = the W4 4.7 disclosure (`showAdopters`, `AdoptionFramework.tsx:137-154`). A clean share affordance **already exists** in the hero MandateCard (S11 pubkey-free link, `MandateCard.tsx:47-71`). |
| — | (fleet extra) FeedEngagePanel also has icon-only buttons | ❌ | Refuted — its chin holds labeled controls. The one true sibling of the D1 pattern is ThreadedDiscussion's icon-only Heart like-button (`ThreadedDiscussion.tsx:180-188`) next to *labeled* Reply/Delete. |

**i18n ground rule for every wave (fleet finding):** `en.ts` is a small partial dictionary —
English lives in the inline `t(key, fallback)` defaults in the components; keys physically exist
only in `fr.ts`/`sw.ts`. Copy changes = edit the inline default + add/retire fr & sw entries at
parity + append to the native-review packet. Never "fix" missing en.ts keys.

---

## 2. Wave A — Card anatomy unification (S30)

The cross-card wave; everything here renders on multiple surfaces, so it ships first.

### A-1. Stage-strip gutter (C2)
`InitiativeStageCard.module.scss` `.stageNavRow` → `padding: 0 $spacing-lg` (mirror `.metaLine`).
**Do NOT** pad inside the strip or in FeedEngagePanel (host already pads 16px — double-indent).
Verify fr/sw at 360px: gutters cost 32px width; the 4-pill row already flex-wraps by design, but
re-check wrap points in all three locales.

### A-2. Stage-strip de-buttonization + redundancy (C1) — decision D2 below
Keep the summary Badge (sole collapsed-state stage identity), keep the strip (sole
pipeline-position display), but restyle the **current-stage pill so it stops reading as a
button**: drop the pill border + background tint; carry "current" with the dot + `$gray-900`
semibold (+ optional underline). This also increases contrast with the genuinely interactive
DiscussionPill in the chin. Constraints: never make it navigate (locked S19 W2); preserve the
`stage==='discussion'` → index 0.5 special case (`InitiativeStageStrip.tsx:38-39`).

### A-3. Threshold bar → kit (C3)
Replace ProblemVoteFlow's bespoke track/fill/marker with the shared `ProgressBar`
(`value=tally.up`, `max=Math.ceil(0.5*communityMemberCount)`, `variant={thresholdMet ? 'success'
: 'primary'}` — the documented conditional-variant pattern). The gray line disappears; the bar
gains `role=progressbar` ARIA it never had. Delete `.progressTrack/.progressFill/.thresholdMarker`
and **audit the trailing `@include dark` block for orphans** (S28 learning). `label` prop: use the
threshold-hint copy (see A-4) — no double-announcement with the visible seconded/needed row
(keep that row, mark `aria-hidden` if the label already carries the numbers). Verify on all three
host surfaces (community card, stage feed, InitiativeStagePanel), light + dark.
*Claims-honesty note: the review session could not re-render this bar live (unverified demo user
is trust-gated out of every problem stage); the code path is unambiguous but S30 should verify the
fix visually as a member — seed or use an author persona per gloki-verification-and-qa.*

### A-4. A home for "Agreed by at least half…" (B3)
Move `problems.thresholdMetHint` / `thresholdHintShort` out of the floating `<p>` and into the
threshold-bar block as its caption/label (directly under the bar it explains). The collapsed-only
`card.teaserAgreed` teaser stays as-is. No new keys — relocation only.

### A-5. Universal two-tone chin + chin-slot (E1/E2/E3 + B1/B2) — the big one
1. **Extract one chin implementation** (SCSS partial or tiny component): `$footer-surface` fill +
   `$footer-border` hairline + the S25 wrap-not-crush flex row. Both owners adopt it.
2. **Let the stage-feed chin tint**: restructure `StageFeedView` `.card` to the
   InitiativeStageCard model (card `padding:0; overflow:hidden`, padding moved onto inner
   sections) so the fill can bleed full-width. **Must survive:** the `.panelWrap` z-index /
   stretched-`::after` hit-area model (S20, `StageFeedView.tsx:64-68`). Update the
   `FeedEngagePanel.module.scss:23-26` comment (it codifies the old spec §1.3 rule-only call) —
   and note the reversal against `docs/ui-polish-campaign-2026-07.md` §1.3.
3. **Add a `chinExtras` slot** to `InitiativeStageCardProps` and the parallel path in
   FeedEngagePanel (chin contents are currently hard-coded one level above where the candidates
   live).
4. **Problem card chin contents** (via the slot): Discussion pill + "Send suggestion to author"
   as a secondary pill + the Problem-code chip. Move both OUT of ProblemEngage's body
   (`ProblemEngage.tsx:78-93`) into the two hosts' slots. **Measure intrinsic widths before
   composing** (S29 law): at 360px the chin row is ~296px usable — Discussion (~120px) + a
   "Send suggestion to author" pill (~200px+ en, wider fr) will NOT share a row. Plan: row 1 =
   Discussion + suggest pill with a SHORT label (decision D3), row 2 = full-width code chip.
   Build both compositions and screenshot for Eston (S29 method) before committing.
5. **"Open in community"** on stage-feed chins: restyle from quiet text link to pill for grammar
   consistency (decision D4).
6. **Scope line:** the published-mandate hero (MandateCard) keeps its `.actions` row (Back this
   mandate / Share) — it's a hero, not a feed card. The mandate *ActivityCard* already has the
   tinted chin + view button. DiscussionPill stays read-only (never `useFlowContract` — S11).

**Wave A verification:** build + grep gates; preview at 360px light+dark en/fr/sw on: community
feed (all 5 card stages), /stage/problem·proposals·vote expanded, collapsed teasers. Confirm chin
tint parity community↔stage-feed, strip gutter, no gray line, capped h1 counts unchanged.

---

## 3. Wave B — Suggestion flow recompose (A1/A2/A3) (S31, first half)

1. **Move the problem ContextCard down to sit directly above the composer** as a persistent
   "you're responding to" context bar — Eston's instinct, and it keeps DESIGN_SYSTEM §5 rule 11
   ("the item being acted on stays visible") satisfied even on long threads. Implementation =
   U1 option (ii): render it as a sibling of `<main>` immediately above `.inputBar`; it MUST
   `@include page-column` (same desktop-column fix the composer already carries,
   `SuggestionDmView.module.scss:33-37`). Style via `className` wrapper — never edit
   ContextCard.module.scss (shared with DiscussionStageView). Alternative if Eston prefers a
   true "first chat message": option (i), last child of `<main>` (scrolls away) — decision D1.
2. **Header stays** eyebrow "Suggestion" + h1 author name (one-h1 law; author name never moves
   into a subtitle unless D1 chooses the header-merge option — then use the `subtitle` slot, never
   the h1, and accept the async pop-in from `get_details`).
3. **Top air**: `padding-top: $spacing-lg` on `.dmMain` (local fix; `$heading-gap` is app-wide —
   don't touch it). Re-center the empty-state within the shorter thread area.
4. Sanity: `bottomRef` autoscroll anchor (end of `.thread`) still lands correctly on send.

---

## 4. Wave C — Action-button captions (D1) (S31, second half)

1. **SolutionsBoard action row** (`SolutionsBoard.tsx:546-573`): stack each button vertically —
   icon+count row on top, caption beneath. New SHORT caption keys (inline en defaults + fr/sw
   parity + packet append), precedent `community.menuButton`/`menuCaption`:
   - `mechanisms.approval.upvoteCaption` — en "Back this" (fr/sw must stay ≤ ~95px at $text-xs)
   - `mechanisms.approval.requestReviewCaption` — en "Request expert"
   - `mechanisms.approval.suggestMergeCaption` — en "Suggest merge"
   Captions are visible text INSIDE the button → reconcile aria-labels (don't double-announce;
   the existing sentence-length aria keys stay for SR clarity or get dropped — pick one, apply to
   all three). Keep `min-height:44px` as floor (buttons grow), keep `actionBtnActive` legible,
   add the dark-mode caption override in the existing dark block (dark-authoring trap).
2. Verify in the NARROWEST of the three hosts at 360px (stage feed / community card /
   InitiativeStagePanel), en+fr+sw.
3. **Bonus (decision D5):** ThreadedDiscussion's icon-only Heart gets the same caption or a
   visible label, matching its labeled Reply/Delete neighbors.

---

## 5. Wave D — Mandate page recompose (F1–F6) (S32)

1. **Top air (F1):** `padding-top: $spacing-lg` on `.page` in `MandatePage.module.scss`. Never
   touch `Container.module.scss` (five other pages add their own top air — would double up).
2. **Summary-card eyebrow (F2):** new key `mandate.card.eyebrow`, en "Mandate summary" — the copy
   (and fr "Résumé du mandat" / sw "Muhtasari wa agizo") already exists on `mandate.card.aria`.
   Switch the section to `aria-labelledby` pointing at the now-visible eyebrow (avoid duplicate
   announcement). The document card keeps `mandate.card.brand` ("Gloki Mandate") untouched —
   shared-key rule. Shield icon: keep on the summary eyebrow (decision D6 if Eston disagrees).
3. **Document-card status top-right (F3):** move the Badge into the eyebrow flex row with
   `margin-left:auto` (mirror MandateCard). Keep the "Ratified {date}" pairing logic intact;
   flex-row (not absolute) so 360px title wraps stay safe. `.metaRow` dissolves.
4. **Document-card reorder (F4/F5):** target order — eyebrow+status → h2 title → preamble →
   commitments → indicators → **bottom provenance strip**: turnout line (+ its InfoDisclosure
   "(i)" — relocates as one unit) + plain/spec SegmentedControl. Recommended: style the strip as
   the document card's two-tone CHIN (`$footer-*`), tying into Wave A's vocabulary (decision D7).
   Documented tradeoffs Eston accepts by choosing this: view toggle sits after the content it
   swaps (SR/keyboard order), plain↔spec height jump happens at the bottom, and the W4 4.7
   "turnout carries the is-this-vote-real moment" placement is deliberately reversed. Keep:
   single-h1 law (document title stays h2), `aria-labelledby` ids, indicators disclosure wiring,
   `#docAnchor` scroll-target behavior ("View full" must still land with the title visible).
5. **"From mandate to action" becomes a card (F6):** restyle the bare `<section>` in place —
   add the sibling card chrome (white/$dark bg, `$gray-200` border, `$radius-lg`, `$shadow-sm`,
   `padding: $spacing-lg`) in `AdoptionFramework.module.scss` (single-file change; the mandate
   siblings all hand-roll, so shared-`Card` adoption here would be the page's odd one out —
   decision D8). **AdopterCard `<li>`s are white-on-white inside a card** — switch them to
   border-only or `$gray-50`. Keep the h2 + aria-labelledby, the disclosure collapse (Eston
   likes it), and the `$info-surface` summary box (re-check dark contrast).
6. **Share near adoption (decision D9):** recommend NOT duplicating — the hero's S11 clean-link
   Share already exists on the same page. If Eston wants it anyway: extract the link-builder from
   `MandateCard.tsx:47-71`, and pass the ROUTE mandateId down (AdoptionFramework currently gets
   the fixture key, not guaranteed identical).
7. **Content enrichment** of the section ("provide a little more information… complete review"):
   out of scope for this structural wave — filed as a follow-up candidate in §7 backlog wording
   (post-handoff tier), pending Eston.

---

## 6. Open decisions to lock (Eston's calls — batch these at S30 kickoff)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Suggest flow: ContextCard pinned above composer (persistent) vs first-message-in-thread (scrolls) vs merged into header subtitle | **Pinned above composer** — matches the chat mental model AND rule 11 |
| D2 | Stage-strip redundancy: de-buttonize current pill only vs drop strip vs drop badge | **De-buttonize only** — both elements carry unique info |
| D3 | Chin suggest-pill label: full "Send suggestion to author" (wraps to own row) vs short "Suggest" / "Send suggestion" caption-style | **Short label** + keep full string as aria-label; screenshot both (S29 method) |
| D4 | Stage-feed "Open in community": quiet text link (today) vs pill matching Discussion | **Pill** — one interaction grammar per chin |
| D5 | Extend caption pattern to ThreadedDiscussion heart in Wave C | **Yes** — same defect class, tiny cost |
| D6 | Shield icon stays on the renamed "Mandate summary" eyebrow? | **Keep shield** (visual continuity; text change is enough) |
| D7 | Mandate doc-card bottom block: plain block vs two-tone chin treatment | **Chin** — one card language app-wide |
| D8 | AdoptionFramework chrome: hand-rolled sibling-style (in place) vs shared `Card` kit | **In place** — page-local consistency beats kit purity here; kit convergence of all 4 mandate surfaces is a separate refactor lane |
| D9 | Add share affordance near From-mandate-to-action | **Skip** (hero Share exists); revisit with the content-enrichment follow-up |

---

## 7. Re-verify these premises vs HEAD (mandatory at each session start)

- `InitiativeView.tsx:69-75` still redirects `/initiative/*` root → `/community/:id?initiative=`.
- Chin owners still `InitiativeStageCard.tsx:178-200` (tinted) + `FeedEngagePanel.tsx:200-216`
  (rule-only, comment at `.module.scss:23-26`); still no `chinExtras` slot.
- `ProblemEngage.tsx:78-93` still renders code chip + suggest button in the body;
  `:72-76` still renders the floating threshold hint.
- `ProblemVoteFlow.tsx:186-205` bespoke bar + `thresholdMarker` at `left:'100%'`; still zero ARIA;
  kit `ProgressBar` still has no marker prop.
- `InitiativeStageCard.module.scss` `.stageNavRow` still unpadded while siblings inset 16px.
- `SolutionsBoard.tsx:546-573` action row still icon+count only; `CommunityCard.tsx:52-64`
  caption precedent intact.
- `MandatePage.module.scss` `.page` still lacks top padding; `MandateDocument.tsx:105-162` order
  still masthead → turnout → toggle → body; `mandate.card.brand` still shared by both cards;
  `mandate.card.aria` still carries "Mandate summary" copy in fr/sw.
- `AdoptionFramework.module.scss:3-7` still surface-less; AdopterCard `<li>` still white bg.
- en.ts still the partial-dictionary model (~76 keys; English in inline defaults).

## 8. Cross-cutting session rules (unchanged from S24–S29)

Small commits, `ui` stays runnable; `npx tsc -b` + `npm run build` + grep-gates per chunk;
preview verification at 360px, light+dark, en/fr/sw by the CONTROLLER only; fr/sw key parity +
native-review-packet append for every new/changed string; no DEMO_VERSION bump (no fixtures
touched); Opus whole-branch review before the push is proposed; **push only on Eston's explicit
green light**. DESIGN_SYSTEM.md updates to codify in whichever wave lands them: the universal
two-tone chin law, the stage-strip gutter rule, and the icon+caption action-button pattern.
