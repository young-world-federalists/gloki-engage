# UI Polish & Design-System Enforcement — Campaign Plan (2026-07-08)

> **Status: PROPOSED.** This is a read-only review's output — **no code was changed** producing it.
> Each wave below becomes a normal build session (spec → build → Opus whole-branch review → Eston's
> explicit push green light). Nothing ships from the review itself.
> **Baseline:** branch `ui` @ `5e14d35`, clean tree. Re-ground every file:line vs HEAD before acting
> (the S10–S15 lesson — line numbers drift).

## 0. How this was produced & how to use it

A 14-agent read-only review fleet (12 scoped page/card reviewers + 1 card-chin design-expert +
1 synthesis/completeness critic) read the TSX + SCSS of every surface Eston walked through, measured
against `DESIGN_SYSTEM.md` and the token scale, and returned **83 findings** (2 blocker · 24 major ·
44 minor · 13 note). This doc clusters them into **6 executable waves**, ordered by dependency.

**Use it like this:** pick a wave → write its spec in `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`
→ build on `ui` → Opus review → confirm push with Eston. Waves 1→6 are dependency-ordered; do them in
order (Wave 1's tokens are the substrate everything else consumes). Within a wave, items are
independent enough to split across sittings.

## 1. The through-line (Eston's actual complaint)

> *"The design system for this app still is not made, even though I've prompted it five times... or
> there is a design system, but we need to review the app and compare it to it and make all those
> changes."*

The review confirms it precisely: **`DESIGN_SYSTEM.md` exists and is good, but almost every finding
traces to a rule or token that is informal, uncodified, or unguarded** — so components silently
rediscover wrong values (a 12px gutter here, a raw `2px` gap there, a missing on-dark color). The fix
is not "make a design system" — it's **codify the missing rules as tokens + written law (Wave 1),
then reconcile the app to them (Waves 2–6)**, so drift can't recur. That is the spine of this plan.

## 2. Theme map (what's wrong, by cluster)

| Theme | Worst sev | One-line |
|---|---|---|
| **Header-alignment law** | major | AppHeader title block sits at a 12px gutter; content at 16–24px → every page's eyebrow/title/subtitle hangs left of its content. No shared gutter token. |
| **Dark-mode contrast + incomplete on-dark tokens** | blocker | Green "Second it" ≈1.9:1, red vote ≈2.3:1 in dark — unreadable. Root cause: no `$success-on-dark`/`$warning-on-dark`. Also hits secondary Button, vote captions, mandate surfaces. |
| **Card-chin separation** | major | The bottom actions row (DiscussionPill + open link) is glued to card content. Resolved design: shared `.chin` = hairline top rule + recessed footer fill (§4). |
| **Discussion-is-a-function-not-a-stage holdover** | major | "In discussion" pill status + a `STAGE_META.discussion` badge + a sample-feed stage make Discussion read as a 5th pipeline stage — *exactly* the "some say vote, some say in discussion" confusion. |
| **Redundancy** | major | Two discussion buttons on the Problem card; two on the Discussion card; stacked local+global back arrows; two vote explainers; look-alike "Send Support" CTAs. |
| **Context restoration** | major | The Discussion page never shows the item being discussed — the "ocean plastic pollution…" body vanishes. Same gap on Suggest-to-author. |
| **Mandate & vote composition** | major | Mandate "Show your support" + Share stack on two rows; sections at 3 different left insets; long scroll. |
| **Community chrome & drawer** | major | "Menu" button under-sized/mislabelled + drawer unreachable from section pages; "Start an initiative" over-dominates the hero row (inverse of Eston's ask). |
| **Kit-first enforcement** | major | Bespoke re-implementations of shipped primitives (the clashing Problem/Solution box, open buttons, EmptyState, Card, ProgressBar, a duplicated ballot card). |
| **Spacing rhythm & tokenization** | minor | Recurring 4px icon→text gaps, 12px card padding vs the 16px standard, engage-slot gap drift, off-scale rem/px literals. |
| **Touch-target & a11y floors** | minor | Sub-44px controls (collab × at 16px, chat send/textarea at 40px, mandate utilities at 36–40px); color-alone signals. |

---

## 3. The waves

### Wave 1 — DS foundation: tokens, header law, dark-mode blocker
**Goal:** establish the missing tokens + the header-alignment law as the single substrate all later
waves build on, and clear the one reading-blocker contrast bug. **Why first:** the gutter token, the
on-dark colors, and the `$footer-*` tokens are *shared dependencies* of Waves 2/4/5 — nothing
downstream should hardcode a gutter or an on-dark color before these exist.

| # | Item | File:line | Fix | Eff |
|---|---|---|---|---|
| 1.1 | **BLOCKER: dark green/red vote buttons unreadable** | `ProblemVoteFlow.module.scss:157,171,252-277` | In the `@include dark` block add `.upBtn,.upBtn.active{color:$success-on-dark}` / `.downBtn,.downBtn.active{color:$error-on-dark}` / `.voteCount{color:inherit}`. | S |
| 1.2 | **Add the missing on-dark text tokens** | `variables.scss:144` | Add `$success-on-dark:#34d399` (green-400, ≈7.6:1 on `$dark-bg`) and `$warning-on-dark:#fbbf24` beside `$error-on-dark`. | S |
| 1.3 | **Add `$content-gutter` token (16px) + header law** | `variables.scss`, `AppHeader.module.scss:181`, `Container.module.scss:16` | `$content-gutter:$spacing-lg;` consumed by AppHeader `.titleBlock` (12→16), the brand bar, AND every content column (`.body/.content/.main/.feedContainer`). Header + body share ONE edge. | M |
| 1.4 | **Header vertical rhythm** | `AppHeader.module.scss:181` | Add top air; bottom gap = `$heading-gap` (8px, currently 4px); on-scale eyebrow→h1 gap (kill raw `2px`). | S |
| 1.5 | **Desktop alignment nuance** | `AppHeader.module.scss` | On >640px, content centers in a 640px column but the title block spans full-width left → they misalign. Fold into the canonical page-container (see 1.6). | M |
| 1.6 | **One canonical page-container primitive** | `Container`, per-subpage roots | `max-width:$content-max-width` + `margin:auto` + `$content-gutter` + `$footer-height` bottom, shared by title block and content. Kills the 640/720/800 width divergence + the 72-vs-64 footer-clearance drift. | M |
| 1.7 | **Secondary Button dark-mode contrast** | `Button.module.scss:64` | `@include dark{.secondary{color:$primary-on-dark;border-color:$primary-on-dark}}` (≈5.75:1). Fixes the community "Menu" button + all secondary buttons. NOT the locked white-on-`$primary` case. | S |
| 1.8 | **Vote-panel captions AA in dark** | `ProblemVoteFlow.module.scss:229-249` | Dark override → `$dark-text-secondary` for `.thresholdLabels/.yourVote/.undoHint`. | S |
| 1.9 | **Codify the law in DESIGN_SYSTEM.md** | `DESIGN_SYSTEM.md` | Header-gutter law, complete on-dark token family + dark-authoring rule, `$footer-*` intent (§5). | S |

**Closes for Eston:** dark-mode unreadable green button; "headers all flush-left / cramped on every
subpage"; header padding above/around.

---

### Wave 2 — Card-chin separation (Solution + Vote footers)
**Goal:** the DiscussionPill + open-link footer reads as a distinct card footer, not another content
block — on Solution and Vote cards. **Why now:** self-contained win that depends only on Wave 1's
`$footer-*` tokens; directly answers two named asks with one shared treatment. **Full spec in §4.**

| # | Item | File:line | Fix | Eff |
|---|---|---|---|---|
| 2.1 | Rename `.actionsRow`→`.chin`, add hairline rule + footer fill | `InitiativeStageCard.module.scss:127`, `FeedEngagePanel.module.scss` | Per §4 spec: `border-top:1px solid $footer-border` + `background:$footer-surface`, `padding:$spacing-md $spacing-lg`. | M |
| 2.2 | Detach chin from `.engage`; make it the terminal child | `InitiativeStageCard.module.scss` | Pull the chin out of `.engage` ($gray-50) so it's a sibling after the body; move `.teaser` above it so `overflow:hidden` clips the radius. | M |
| 2.3 | Recolor open-link on the fill | `FeedEngagePanel.module.scss` | `.openLink` → `$primary-dark` (the `$gray-100` fill drops the plain `$primary` link to ~3.06:1). | S |
| 2.4 | Mirror on the Vote card | (same shared components) | The vote card uses the same chin — one treatment covers both. | S |

**Closes for Eston:** "add a rule at the bottom to separate the chin/footer… maybe a different color
for the very bottom" — Solution card *and* Vote page.

---

### Wave 3 — Discussion-as-function + redundancy removal
**Goal:** kill the "in discussion is a stage" holdover and every duplicate control/back-arrow/label.
**Why now:** no token dependencies; clears the confusion Eston raised most; do it *before* the Wave 5
kit sweep so the sweep isn't restyling controls about to be deleted.

| # | Item | File:line | Fix | Eff |
|---|---|---|---|---|
| 3.1 | **Reframe DiscussionPill** — drop "In discussion" status | `DiscussionPill.tsx:65-67` | Always read "Discussion" (or "{n} discussing"); the live count signals activity. Stop keying tone/label on `post.stage==='discussion'`. Keep the pill; do NOT add a Discussion stage (locked). | M |
| 3.2 | **Remove the stage badge for discussion** | `stageMeta.ts:14`, `InitiativeStageCard.tsx:100-105` | Stop `STAGE_META.discussion` rendering a peer stage badge on a discussion-data card. | S |
| 3.3 | **Re-stage the sample feed + settings row** | `CommunityHome.tsx:30` (SAMPLE_FEED s2), `CommunitySettings.tsx` | Change s2 to `problem`/`proposals`; drop the "Discussion" permission row. | S |
| 3.4 | **Remove duplicate discussion button** | `ProblemEngage.tsx:90-92` | Delete "Discuss this problem"; keep the DiscussionPill (canonical, count-bearing) + "Send suggestion to author". | S |
| 3.5 | **Remove duplicate on the Discussion card** | `DiscussionActivityCard.tsx:99-100` (+ unused `openDiscussion` 86-89) | Drop `onOpen`/`openLabel`; the active pill is the single entry. | S |
| 3.6 | **Remove redundant back arrows** | `StartDraftForm.tsx:55-57`, `DraftEditor.tsx:100-107` | Delete local backs; make the header `onBack` view-aware for write-together (return to the drafts list) or make those sub-views URL-addressable. | M |
| 3.7 | **Dedupe vote explainers** | `VoteEngage`/`VotePreview`/`VoteExplainer` | Keep the at-ballot "how hearts work"; drop the overlapping second explainer. | S |
| 3.8 | **Dedupe "Send Support" + disambiguate "support" CTAs** | `Currency.tsx`, mandate CTAs | Rename the currency button ("Send"); give individual-vs-org support CTAs distinct labels (taste — §6). | S |

**Closes for Eston:** "some problems vote / some in discussion" confusion; the double discussion
button; the redundant back button; "reduce redundancy in text and buttons."

---

### Wave 4 — Context restoration + mandate composition
**Goal:** give acted-on items their context back, and put mandate actions on one row with a coherent
left edge. **Why now:** the biggest "context vanished / cramped / ragged" complaints; benefits from
Wave 1's header law; introduces the reusable **ContextCard** the DS-gap list calls for.

| # | Item | File:line | Fix | Eff |
|---|---|---|---|---|
| 4.1 | **Discussion page shows the discussed item** | `DiscussionStageView.tsx:71` (+ InitiativeView pass-through) | Add a `summary`/`description` prop; render a shared **ContextCard** (title + body) between the header and the thread so the user sees WHAT they're discussing. | M |
| 4.2 | **Fix discussion double-padding + title alignment** | `DiscussionStageView.module.scss:10` | Drop `.main` horizontal padding so `.content` is the sole gutter; align the title block to it; collapse the doubled footer clearance. | S |
| 4.3 | **Apply ContextCard to Suggest-to-author** | `SuggestionDmView.tsx` | Same pattern — show the problem being acted on. | M |
| 4.4 | **Mandate: Show-support + Share on one row** | `MandateCard.tsx`, `MandateCard.module.scss:196` | Drop `fullWidth`, `size="md"`; `.actions{display:flex;gap:$spacing-sm}` + `.supportBtn{flex:1}` / `.shareBtn{flex:0 0 auto}`. Support fills, Share sits right. Holds at 360px. | S |
| 4.5 | **Mandate: unify the ragged left edge** | `MandatePage.tsx:44` | One card inset (`$spacing-lg`) for all four sections; drop the `$spacing-xl`/mobile asymmetry. | M |
| 4.6 | **Mandate: dark-surface elevation** | `MandateDocument`/`RatificationPanel` scss | Document + ratification cards use the page bg in dark → read flat. Raise to `$dark-bg`. | S |
| 4.7 | **Mandate: progressive disclosure** (taste — §6) | `MandatePage.tsx` | Recommended: collapse indicators/verification/full adopter list behind `InfoDisclosure`, keep hero + core commitments open. **Eston confirms before building.** | M |

**Closes for Eston:** "the thing you're discussing just goes away — show it"; discussion title/eyebrow
alignment + header padding; "Show your support should be on the same line, smaller, with Share to the
right"; the long-scroll question.

---

### Wave 5 — Kit-first normalization + spacing/touch floors
**Goal:** replace hand-rolled controls with kit components and enforce spacing/touch floors app-wide
in one mechanical sweep. **Why now:** broad but low-conceptual-risk; depends on Wave 1 tokens; runs
after redundant controls are deleted (Wave 3) so effort isn't spent on doomed markup. Natural single
build session **with grep gates**.

- **Kit adoption:** SegmentedControl for the StartDraft Problem/Solution toggle (`StartDraftForm.tsx:60-75`
  — fixes the clashing box, mirrors CollaborationFullView) + ThreadedDiscussion sort; `<Button>` for
  `openBtn`/`openLink`/`createBtn`/`copyBtn`/chat composer; EmptyState for chat/members/currency states;
  Card for topic/member rows; ProgressBar for IdentityTrust's verify bar; share the ballot solution-card
  between QVFlow and VotePreview.
- **Spacing rhythm:** icon→label **8px (`$spacing-sm`) floor** across pills/chips/buttons/eyebrows
  (the pervasive 4px gap Eston flagged); icons via Button `leftIcon`/`rightIcon` (never as children —
  that collapses the gap); card padding → 16px; unify engage-slot gaps (12 vs 16); single container
  `gap` over per-child margins; off-scale literals (`1.25rem/0.7rem/3rem/2px/72px/800px`) → tokens.
- **Touch/a11y floors:** 44px min hit area — collab × (16px, and un-nest it from its button), chat
  send/textarea (40px), mandate copy/chip/input (36–40px); pair color with a label for threshold-met,
  region bars, and the "Saved" confirmation.
- **Solution card composition:** fold commitments + evidence under one disclosure; cluster the icon
  actions; verify the two progress bars stayed combined (S15). Target ≤5 co-equal blocks.

**Closes for Eston:** the "weird box around the two buttons"; "more room between icon and text"
everywhere; "padding and spacing issues everywhere — add a little more space, equal padding."

---

### Wave 6 — Community chrome & collab polish
**Goal:** fix community-drawer reachability/sizing and the remaining collab artifacts. **Why last:**
carries several taste/locked-model calls, so isolating it keeps those from blocking the mechanical
waves; Wave 1's header law + Wave 5's kit work make most of these one-line follow-throughs.

| # | Item | File:line | Fix | Eff |
|---|---|---|---|---|
| 6.1 | **"Menu" → "Community options", bigger** | `CommunityCard.tsx:52-59` (+ i18n) | Rename (en/fr/sw + native packet) and rebalance the hero row so it isn't shrink-to-fit; `aria-haspopup="dialog"`. | S |
| 6.2 | **Shrink "Start an initiative"** | `CommunityCard.tsx:49-51` | Rebalance vs the Menu button (exact flex weighting = taste, §6). | S |
| 6.3 | **Remove the blue left-border test artifact** | `CollabList.module.scss:57,113` | Delete `border-left:3px solid $primary` (light + dark). | S |
| 6.4 | **Drawer reachable on section pages** (taste — §6) | `CommunityView.tsx:311` | Touches the locked single-AppHeader model → **approach is Eston's call**. | M |
| 6.5 | **Collab createBtn contrast + max-width** | `CollabList` scss | `$primary`-on-tint fails AA → `$primary-dark` or Button kit; `800px` → `$content-max-width`. | S |
| 6.6 | **Confirm collab header inherits the header law** | (from Wave 1) | The "Climate Resilience Assembly" header padding should now be fixed by 1.3 — verify. | S |

**Closes for Eston:** the blue collab highlight; hamburger rename + sizing; smaller Start button; the
"Climate Resilience Assembly" header padding.

---

## 4. Card-chin separation — the UI-expert determination (seeds Wave 2's spec)

Eston delegated this one ("something a UI-expert agent can determine, so please launch that agent").
The determination:

**Recommendation:** a **combination** — a permanent **1px hairline top rule** *plus* a **light
recessed footer fill**, unified into ONE shared `.chin` treatment on every stage surface. The rule is
the primary, scheme-agnostic separator (identical in light/dark); the fill gives Eston the "different
color for the very bottom." Rule-alone doesn't deliver the color ask; fill-alone fails in dark
(`$dark-surface #0f172a` is already near-black — you can't recess further); spacing-alone ignores the
explicit "add a rule" request.

**New tokens** (in `variables.scss`, reusing proven values → naming/one-home, not new raw color):
```scss
$footer-surface:      $gray-100;          // #f1f5f9 — recessed card-footer well (light)
$footer-surface-dark: $dark-tint-subtle;  // rgba(255,255,255,.06) — raised footer strip (dark)
$footer-border:       $gray-200;          // #e2e8f0 — footer hairline top rule (light)
$footer-border-dark:  $dark-border;       // #475569 — footer hairline top rule (dark)
```

**Shared `.chin`** (rename `.actionsRow`→`.chin` in `InitiativeStageCard.module.scss` +
`FeedEngagePanel.module.scss`):
```scss
.chin {
  display: flex; align-items: center; justify-content: space-between;
  gap: $spacing-sm; flex-wrap: wrap;
  padding: $spacing-md $spacing-lg;           // 12/16 — matches content edge
  background: $footer-surface;
  border-top: 1px solid $footer-border;       // the key separator
}
@include dark { .chin { background: $footer-surface-dark; border-top-color: $footer-border-dark; } }
@media (max-width: $breakpoint-sm) { .chin { padding: $spacing-md; } }
```

**Structural requirements (or it mis-renders):**
1. **InitiativeStageCard:** pull the chin OUT of `.engage` so it's a sibling after the engage body →
   the `$gray-50` engage body + `$gray-100` chin gives the two-tone footer.
2. The chin must be the **terminal child** of the `overflow:hidden` `.card` so the radius clips its
   bottom corners (no explicit radius). If a host lacks `overflow:hidden`, add
   `border-bottom-{left,right}-radius:$radius-lg` to `.chin`.
3. **FeedEngagePanel:** keep `.panel`'s top rule (header/body divide); the chin adds its own top rule
   → header-body-footer. Recolor `.openLink` → `$primary-dark` (light) so the link holds contrast on
   the fill.
4. **DiscussionPill:** no change — transparent pill reads fine on both footer surfaces.

**Applies to:** `InitiativeStageCard.module.scss`, `FeedEngagePanel.module.scss`, `variables.scss`,
and any future card that renders a DiscussionPill + open action row.

---

## 5. DESIGN_SYSTEM.md — the rules to codify (so it's *enforced*)

This is the answer to "the design system isn't made / isn't stuck to." Add these as written law +
tokens + (where possible) grep gates, so components can't silently rediscover wrong values:

1. **`$content-gutter` (16px)** — ONE horizontal gutter for the AppHeader title block, the brand bar,
   and every content column at all widths. Forbid ad-hoc per-file/per-breakpoint horizontal padding.
   *(Root cause of the flush-left header complaint.)*
2. **Complete the on-dark TEXT token family** (`$success-on-dark`, `$warning-on-dark` beside
   `$primary`/`$error-on-dark`) + rule: semantic TEXT on a plain dark surface MUST use a `*-on-dark`
   token — never a `*-on-surface` (those are light tinted-chip colors) and never the raw brand color.
3. **Dark-authoring rule:** any `@include dark` block that re-themes a background MUST re-declare that
   element's text/icon color on the new surface. *(Button.secondary silently shipped ~3.98:1.)*
4. **Card-chin/footer pattern** — the §4 hairline rule + `$footer-surface` fill, via the `$footer-*`
   tokens (one home).
5. **Card interior padding = `$spacing-lg` (16px)** as an enforced token; state whether/how much
   mobile may tighten. Forbid the 12px/24px drift.
6. **Header vertical rhythm** — title-block top air, bottom = `$heading-gap` (8px), on-scale
   eyebrow→h1→subtitle (no raw `2px`); add a section-header (h2) type pair mirroring `$page-title-*`.
7. **Icon↔label gap floor = `$spacing-sm` (8px)** for ALL labeled controls; reserve `$spacing-xs` (4)
   for glyph-only micro-buttons. Ban raw-px gaps.
8. **Icon-in-Button rule** — icons pass via `leftIcon`/`rightIcon`, never as children (children
   collapse into one `.label` span and kill the gap). Add a grep gate for `<Button>` with an SVG child.
9. **Kit-first table** — radiogroup→SegmentedControl; CTA→Button; empty/loading/error→EmptyState;
   determinate bar→ProgressBar; content card→Card. "A matching shared component must be used before
   writing bespoke control CSS."
10. **Discussion-is-a-function-not-a-stage** — banned-status wordlist ("In discussion"); no stage
    badge, no `STAGE_META.discussion` peer, no discussion admin-permission row, no "discussion"
    sample-feed stage; forbid keying visible state/copy on `post.stage==='discussion'`.
11. **Context-header pattern** — any sub-page that acts ON an item (discussion, suggest-to-author)
    renders a shared **ContextCard** (title + body) so the item never disappears.
12. **Spacing ownership** — a child inside a flex/grid gap container must not add its own outer margin
    (the gap owns spacing).
13. **Token-only, extended** — ban raw color keywords (`white`/`black` → add `$surface` + dark
    counterpart) and raw rem/px for spacing/font-size; add a lint that flags color + rem/px literals
    in `*.module.scss`.
14. **44px min hit area applies to ALL interactive elements**, not just `<Button>`; forbid nested
    interactive elements.
15. **`$primary` must NOT be text on white/tinted surfaces** (~3.6:1) — use `$primary-dark` (~5:1);
    only white-on-solid-`$primary` fill is the locked exception. Require the `$x-surface`/
    `$x-surface-dark` pair (with a mandatory dark override) instead of `rgba($token, α)` fills.
16. **Status/data color pairs with an icon or always-visible label** (threshold-met, region bars,
    "Saved").
17. **Composition budget: ≤5 co-equal stacked blocks per card** (name the S15 principle); beyond
    that, group under a disclosure.
18. **One canonical page-container primitive** (`$content-max-width` + `margin auto` + `$content-gutter`
    + `$footer-height` bottom) shared by title block and content.
19. **Nav/chrome rules** — a sub-view under the global AppHeader back must not add a second back arrow
    (use a labeled Cancel); `aria-haspopup` = the popup's ARIA role; one canonical list-row (no
    decorative color accent unless it encodes state); ban duplicate global CSS reimplementing kit.
20. **Single vocabulary for "support" CTAs** (individual conviction vs organizational adoption).

---

## 6. Taste calls — Eston decides (recommend-then-confirm)

These are yours; the plan carries a recommendation for each but won't build them until you confirm:

1. **Mandate: progressive disclosure vs one long scroll.** *Rec:* collapse secondary depth
   (indicators, verification, full adopter list) behind `InfoDisclosure`; keep hero + core commitments
   open. *(You said you were undecided.)*
2. **Vote page density.** *Rec:* KEEP the single scroll (the ballot is the primary action; accordions
   would bury it); only trim the duplicate explainer.
3. **Community hero row balance.** Exact flex weighting between the enlarged "Community options" and
   the shrunk "Start an initiative" — equal width, or primary still dominant?
4. **Community drawer reachability on section pages.** Inject the mini-app items into the global menu,
   vs a bottom-of-content affordance? *(Touches the locked single-AppHeader model.)*
5. **Solution-card block reduction.** How aggressively to fold commitments/evidence under one
   disclosure.
6. **Header title-block top air.** `$spacing-xl` (24, generous) vs `$spacing-lg` (16, tighter) — pick
   the app-wide value.
7. **"Open the full item" affordance.** Unify onto one Button variant (dashboard solid CTA vs
   stage-feed quiet link), or document the per-context difference?
8. **Support-CTA wording.** e.g. "Add your support" / "Back this mandate" (individual) vs "Add your
   organization" (org).
9. **Discussion-pill emphasis** after dropping the status skin — neutral "Discussion" + count, vs
   "{n} discussing".

---

## 7. Round-2 review backlog (surfaces the fleet did NOT cover)

The completeness critic flagged these as *unreviewed* — schedule a second review pass (or fold into
the relevant wave) so nothing is silently assumed clean:

- **Light-mode contrast sweep** — findings were overwhelmingly dark-mode; light mode was not
  systematically swept (only incidental fails surfaced: collab createBtn ~3.6:1, Currency "Saved" ~2.5:1).
- **"Is this a shared problem" surrounding surface** — only the vote-button text/captions were
  audited; the surface tint / threshold area / framing color (which Eston called "off") were not.
- **`/identity/*` top-level pages** — Profile, Join, About, Contact (only the per-community
  IdentityTrust tab was reviewed).
- **HomeView (`/`) + `/welcome`** — the first surfaces every new user hits.
- **CreateCommunityPage** (`/create-community`) — a long form, likely same gutter/padding/touch issues.
- **Global StageFooter** — contrast/touch-target/active-state not audited.
- **SuggestionDmView** — only the entry button was reviewed (see Wave 4.3).
- **VotePreview verified-gate flow + mandate share-link surfaces** — only partially covered.
- **InitiativeStageStrip chrome** (beyond the cards) — its own spacing/contrast/active-state.
- **i18n follow-through** — every copy change in this plan ("Menu"→"Community options",
  "Send Support"→"Send", dropping "In discussion", support-CTA disambiguation) touches en/fr/sw + the
  native-review packet. No finding tracks this; historically it goes stale silently. Route via
  `gloki-i18n-playbook` in each wave that changes copy.

---

## 8. Eston's walkthrough → where it lives (traceability)

| You said | Wave |
|---|---|
| Problems "vote on" vs "in discussion" confusion (Discussion isn't a stage) | 3.1–3.3 |
| Green "seconded" button unreadable in dark mode | 1.1 |
| "Is this a shared problem" colors off | 1.1/1.8 + **Round 2** (surrounding surface) |
| "Discuss this problem" / "Send suggestion" icon↔text padding | 5 (icon→label floor + icon-in-Button) |
| Two discussion buttons on the problem | 3.4 |
| Discussion page: padding above/around header | 1.4 + 4.2 |
| Discussion page: the discussed item vanishes — show it | 4.1 |
| Discussion title/eyebrow flush-left vs content | 1.3 + 4.2 |
| Solution card: separate the chin/footer (rule / different color) | 2 (+ §4) |
| Same on the vote page | 2.4 |
| Mandate "show your support" + Share on one row, smaller | 4.4 |
| Mandate expandable vs long scroll | 4.7 + §6.1 (your call) |
| Collab blue left highlight (test artifact) | 6.3 |
| Hamburger "Menu" bigger + "Community options" | 6.1 |
| "Start an initiative" smaller | 6.2 |
| Redundant back button above "start this draft" | 3.6 |
| "Climate Resilience Assembly" header padding | 1.3 → verified 6.6 |
| Boxed Problem/Solution buttons clash with rounded edges | 5 (SegmentedControl) |
| Headers on all subpages flush-left/weird | 1.3–1.6 (header law) |
| Padding/spacing too tight everywhere; equal padding = one DS | 5 + §5 (codified) |
| Reduce redundancy in text/buttons | 3 |
| Colors off in places | 1 + **Round 2** (light sweep) |
| Design system exists but isn't enforced | §5 + Wave 1.9 (the through-line) |

---

## 9. Proposed MASTER_TODO §7 entry (for Eston to accept — not yet applied)

```markdown
**P7 — UI polish & design-system enforcement (Eston walkthrough, 2026-07-08). 📋 PLANNED.**
Read-only 14-agent review (83 findings) → docs/ui-polish-campaign-2026-07.md. Six dependency-ordered
waves: W1 DS-foundation tokens + header-alignment law + dark-mode blocker; W2 card-chin separation;
W3 discussion-as-function + redundancy; W4 context restoration + mandate composition; W5 kit-first
normalization + spacing/touch floors; W6 community chrome & collab polish. Through-line: codify the
missing rules/tokens in DESIGN_SYSTEM.md (§5 of the plan) so drift can't recur. Each wave = a normal
spec→build→review→push session. 10 taste calls await Eston (§6); Round-2 review backlog for uncovered
surfaces (§7).
```
