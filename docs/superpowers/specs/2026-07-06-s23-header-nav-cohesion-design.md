# S23 — Header/nav cohesion & stage↔community seams (design)

**Date:** 2026-07-06 · **Session:** S23 · **HEAD at grounding:** `865819e`
**Scope decided by Eston (2026-07-06, verbatim direction in-session).** The prepared
S23 prompt (kit-convergence part 2 vs D3) is superseded: liquid delegation (D3) is
**paused by Eston** — do not build it. This session is pre-handoff UI polish.

## Re-verified premises (all confirmed vs HEAD 865819e)

| # | Eston's report | Reality at HEAD |
|---|---|---|
| 1 | Home subtitle floats outside the title box | `HomeView.tsx:211` renders `.introSubtitle` as first `<p>` in `<main>`; `AppHeader` title block (`.titleBlock`) has no subtitle prop |
| 2 | Solutions page: blue info card + redundant eyebrow | `StageFeedView.tsx:216-259`: eyebrow "Browse by stage" + 4 per-stage `.thresholdBanner` info cards |
| 3 | Solution card: discussion button + (i) float | Expanded panels lead with `stageNavRow` (strip + `DiscussionPill`); `SolutionsBoard` leads with a bare `InfoDisclosure` (i) in `.helpSection`; "Open in community" sits at the bottom |
| 4 | Back from discussion loses card expansion | `expandedIds` is `useState` in `StageFeedView` + `CommunityHome`; remount on back-nav wipes it |
| 5 | Discussion page shows only community name | `DiscussionStageView` receives `title` (initiative) and **ignores it**; h1 = "Discussion — {community}" |
| 6 | Mandate: duplicate intro cards, label confusion | `MandateCard` (brand "Gloki Mandate") + `MandateDocument` masthead (fixture subtitle "A global community mandate", title again, status again, countries again, provenance again) |
| 7 | Anchor jumps cut titles off | `CommunityHome.tsx:97` scrollIntoView with **no** scroll-margin; `MandatePage` `.docAnchor` scroll-margin 32px < sticky bar (~61px) |
| 8 | Community mandate view ≠ mandate page | `MandateEngage` = JourneyRecap + ConvictionStaking, no mandate title/status/branding — arriving via "Show your support" shows nothing connecting to the mandate just viewed |
| 9 | Collabs (and all mini-apps) lack a back button | `CommunityView` renders one AppHeader, `showBack` never set for sub-routes; every mini-app repeats its own in-content `<h2>+<p>` header |

## Design

### 1. AppHeader gains `subtitle` (extends the D3 page-title standard)
`AppHeaderProps.subtitle?: string` renders inside `.titleBlock` directly under the
h1 — same box, `$text-sm`, secondary color, tight `line-height`, block gap stays
2px. Law update in DESIGN_SYSTEM.md: **page intros live in the title block; no
floating intro paragraphs below the header.**

- HomeView: `home.subtitle` → header; delete `.introSubtitle`.
- StageFeedView: per-stage `stagefeed.*.info` line → header subtitle; **eyebrow
  removed** (StageFooter already says "Browse by stage"); delete the 4
  `.thresholdBanner` blocks + styles. The dismissible "How Gloki works" hint stays.

### 2. Community section headers + universal back (community area)
`CommunityView` derives the active section from the URL and renders, per sub-route:
`showBack` + `eyebrow={communityName}` + `title={section title}` +
`subtitle={section intro}` (existing i18n copy). Mini-apps drop their own header
blocks (Collabs list, Members, Chat list, Funds, Identity & Trust, Settings, Write
together). The section title becomes the page's visible single h1 (community home
keeps the visually-hidden community-name h1).

Back semantics ("universal back", scoped to the community area): header back =
history back with a hierarchical fallback — `navigate(-1)` when in-app history
exists (`location.key !== 'default'`), else up: sub-route → community home;
`chat/:topicId` → chat list; `collab/:collabId` → collab list; community home →
`/`. Community home also gets the back button. `CollaborationPage`'s own in-content
back-arrow header is deleted (redundant with the AppHeader back).

### 3. Discussion button anchored to the card footer
`InitiativeStageCard` panel + `FeedEngagePanel`: `DiscussionPill` moves out of the
top `stageNavRow` into a bottom action row beside "Open in community" / the open
button. The strip stays alone at the top (orientation), actions live together at
the bottom (thumb zone). Discussion-stage items (pill-only engage) keep the pill in
the footer row, active state unchanged. `SolutionsBoard`'s floating `.helpSection`
(i) anchors inline with the "Add a solution" control row (explains the action it
sits next to), no longer a lone icon above the progress bars.

### 4. Expansion state survives back-nav (URL-persisted)
New hook `useUrlExpandedSet(param)` (in `src/hooks/`): a `Set<string>` synced to a
search param (`?open=id1,id2`) via `setSearchParams(..., { replace: true })` — no
history spam; back-nav restores the URL and therefore the expansion. Used by
`StageFeedView` (replaces local state + per-stage reset — the param dies with the
URL on stage change) and `CommunityHome` (union with the `?initiative=` deep-link,
which keeps its scroll+focus semantics).

### 5. Discussion page context
`DiscussionStageView` uses the initiative `title` it already receives:
eyebrow = "Discussion — {community}", h1 = initiative title. The discussed item is
now the headline, not the community.

### 6. Mandate cohesion
- **Labels:** one brand label — `mandate.card.brand` ("Gloki Mandate") — everywhere;
  the `MandateDocument` masthead eyebrow uses it too. The fixture `subtitle` field
  ("A global community mandate") is removed (runtime fallback only — not seeded, no
  DEMO_VERSION bump).
- **Dedup:** `MandateDocument` keeps its masthead (a document restates its title)
  but sheds the blocks the hero card already shows: the legitimacy stat trio and
  the provenance line (dupes of Reach/Conviction rows). Turnout, verification,
  articles, indicators stay (unique to the document). Exact trim verified against
  the live preview before committing.
- **Community ↔ page seam:** `MandateEngage` gains a compact mandate header
  (brand label + mandate title + status badge, via `useMandate` read-only) above
  JourneyRecap — landing from "Show your support" now shows the same mandate
  identity you just left.
- **Anchors:** new token `$sticky-scroll-offset` (bar height + breathing room);
  applied as `scroll-margin-top` on `CommunityHome`'s deep-linked card wrapper and
  `MandatePage`'s `.docAnchor`.

### 7. Bloat removed alongside
Mini-app header blocks (+ their SCSS), `.thresholdBanner` ×4, `.introSubtitle`,
`CollaborationPage`'s dead `subtitle` prop + in-content back header, fixture
`subtitle` field, trimmed MandateDocument blocks + styles.

## Non-goals
- Liquid delegation D3 (paused by Eston).
- No route-map changes, no contract/wire changes, no fixture seed changes
  (UI-only session → no DEMO_VERSION bump).
- StageFeedView/HomeView/IdentityView keep no back button (footer/menu tab
  destinations, not stack pages).

## Verification
`npx tsc -b` + `npm run build` clean per chunk; preview walk (360px, light+dark):
home, all four stage feeds, community home + every mini-app, expanded solution
card → discussion → back (expansion retained), mandate page ↔ community mandate
card round-trip, anchor landings un-clipped. fr/sw key parity for new keys.
