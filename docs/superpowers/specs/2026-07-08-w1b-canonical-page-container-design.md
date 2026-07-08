# Wave 1b — canonical page-container primitive (desktop alignment + width/footer unification)

**Session:** S24 (continuation) · **Branch:** `ui` · **Baseline HEAD:** `57f464c` (W1 shipped)
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 items 1.5 + 1.6 (the D-stretch W1 deferred)
**Date:** 2026-07-08

## Goal (one sentence)
Introduce ONE canonical page-column primitive (`@mixin page-column` + `$footer-clearance`) and
reconcile the AppHeader and every page content column to it, so on desktop (>640px) the header title
block and content share ONE centred 640px column — killing the 600/640/680/720/800 width divergence
and the 64/72/80/…-footer-clearance drift. **360px mobile is byte-for-byte unchanged** (`max-width`
is a cap). No product behaviour, no fixtures, no i18n.

## Decisions locked (Eston, 2026-07-08)
1. **Full unification** — every content column + the header share ONE canonical width app-wide (not a
   surgical flagship-only fix). The 800px mini-apps / 720px chat / 600px identity+create pages narrow
   to the canonical width on desktop.
2. **Canonical width = `$content-max-width` (640px)** — reuse the existing token; no new width token.
3. Build via a **shared SCSS mixin** (not a React component) — SCSS-only, idiomatic (mirrors the
   `dark` mixin's single-home pattern); no TSX churn except where an inner wrapper must be dropped.

## The two primitives (in `src/styles/variables.scss`, beside the `dark` mixin)
```scss
// Canonical page column: one max-width, centred, with the app-wide horizontal gutter.
// The AppHeader brand row + title block AND every page content column @include this, so the
// header and content share one edge AND one centred column on desktop. Horizontal only —
// vertical padding (top air, $footer-clearance bottom) stays per-context.
@mixin page-column {
  width: 100%;
  max-width: $content-max-width;   // 640
  margin-inline: auto;
  padding-inline: $content-gutter; // the W1 16px gutter
  box-sizing: border-box;
}
$footer-clearance: calc(#{$footer-height} + #{$spacing-lg}); // 80px — unified scroll-region bottom pad (clears the StageFooter)
```

## The model — "outer wrapper owns the column, inners fill it"
The scroll wrapper directly under each AppHeader owns the column; nested wrappers drop their bespoke
`max-width`/`margin:auto`/horizontal-padding and simply fill it. This is the DiscussionStageView
pattern from W1, generalized.

### A. AppHeader (`src/components/AppHeader.module.scss`) — fixes the header on ALL 12 AppHeader pages at once
- `.header` (sticky brand bar): keep the **full-width background + bottom rule**; move horizontal
  gutter off it → `padding: $spacing-sm 0;` (vertical only).
- `.bar` (the flex row inside `.header`): `@include page-column;` → back/brand/bell constrain + centre.
- `.titleBlock`: `@include page-column;` (keep its vertical padding — top `$spacing-lg`, bottom
  `$heading-gap` — and its background). On desktop the eyebrow/title/subtitle now centre in the 640
  column, aligned with content. (Evaluate at preview whether the title-block background should drop to
  transparent on desktop; default keep.)

### B. Outer scroll wrappers → `@include page-column` + `padding-bottom: $footer-clearance`
(each keeps its own top padding; horizontal gutter + max-width + centring now come from the mixin)
- `src/pages/Container.module.scss` `.content` — serves IdentityView, DiscussionStageView,
  SuggestionDmView, CollaborationFullView, MandatePage. (Replace `padding: 0 $content-gutter $spacing-xl`
  + `padding-bottom: 72px`.)
- `src/pages/CommunityView.module.scss` `.body` (replace `padding: $content-gutter` + footer calc).
- `src/pages/StageFeedView.module.scss` `.feedContainer` (replace `padding: $content-gutter` + `80px`).
- `src/pages/HomeView.module.scss` `.home`.
- `src/pages/NotFound.module.scss` `.main`.
- `src/pages/CreateCommunityPage.module.scss` `.page` (top-level route, own AppHeader; was 600 + 24px).
- `src/components/onboarding/OnboardingFlow.module.scss` `.container` (already 640 + gutter → mixin).

### C. Inner wrappers → drop `max-width` + `margin:auto` (+ remove any horizontal padding they self-add)
They now fill the parent column. Verify each is inside a section-B outer before stripping; read the
root wrapper to catch self-padding (would otherwise double the gutter).
- **Identity (inside IdentityView `cs.content`):** `Communities.module.scss` (600), `InfoPage.module.scss`
  (600), `JoinCommunity.module.scss` (800).
- **Community mini-apps (inside CommunityView `.body`):** `Members` (800), `Currency` (800),
  `IdentityTrust` (800), `CollabList` (800), `Share` (800), `CommunitySettings` (640).
- **Chat (inside `.body`):** `chat/ChatTopicList.module.scss` (720), `chat/ChatTopic.module.scss` (720).
  (Keep their *inner* `max-width: 380px` message-bubble caps — those are not the page column.)
- **writeTogether (inside `.body`):** `writeTogether/StartDraftForm` (640), `WriteTogetherPage` (640),
  `DraftEditor` (640).
- **CreateInitiativePage (inside `.body`, community sub-route):** `.page` (600 + 24px padding → drop
  max-width/margin, drop horizontal padding).
- **FundingFlow (inside Currency inside `.body`):** three 640 wrappers → drop max-width/margin.
- **DiscussionStageView `.main`:** drop `max-width: $content-max-width` + `margin: 0 auto` (already 0
  horizontal from W1); keep top air + `$footer-clearance` bottom.

### D. Footer-clearance unification
Replace the bespoke bottom pads (`72px`, `80px`, `calc(footer + $spacing-md/lg/xl/2xl)`) on the
section-B outers with `padding-bottom: $footer-clearance`. Leave `StageFooter` itself.

## Skip / out of scope
- **`DiscussionFlow.module.scss` (680px) — DEAD**: not mounted anywhere (grep-confirmed). Do not touch
  (dead-code removal is a separate concern).
- **`PresenceShowcase` (640) — dev-only** `/lab/presence` route. Skip.
- **Small non-column max-widths (200–480px):** message bubbles, modals, QR, notification panel, empty
  states, error boundary, login card. NOT page columns — leave untouched.
- Later waves: card-chin (W2), etc. No copy/i18n; no `DEMO_VERSION` bump.

## Locked — do not touch
`$primary` #3b82f6; single-AppHeader model; 4-stage IA; the W1 tokens/law (consume, don't re-hardcode).

## Verification (measure, never eyeball) — DESKTOP is now first-class
Build in phases; `npx tsc -b` clean each. Preview at **1024px** (desktop) AND **360px** (mobile),
light + dark, across every page type: community home + each mini-app (members/currency/trust/collab/
share/chat/settings/create-initiative/writeTogether), discussion, stage feed, home, identity
(communities/join/about), create-community, mandate, funding, onboarding.
- **Desktop:** the AppHeader eyebrow/title/subtitle left edge == the content column's left edge == the
  brand-bar content left edge; the column is centred (equal left/right margins); no page has content
  wider than 640 (except deliberately-skipped small caps).
- **Mobile 360px:** unchanged from HEAD — spot-check the left edge is still 16px and nothing reflowed.
- Every route still has exactly one `<h1>` + one AppHeader banner.
- Grep gate: no bespoke page-level `max-width: (600|680|720|800)px` remains on a section-C inner;
  `grep -rn "margin: 0 auto" ` on the touched files returns only intended inner cases.

## Success criteria
On desktop, header + content share one centred 640 column on every AppHeader page; the width and
footer-clearance divergence is gone; 360px is unchanged; `tsc -b` green; `ui` runnable each phase.
