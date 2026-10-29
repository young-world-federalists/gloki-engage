# S19 — Campaign Wave 2: card recomposition + title blocks + sizing floors

**Session 19, 2026-07-03. Base: local `ui` @ `30e6d22` (2 docs commits ahead of origin; they
ride with this wave's push). Source findings: `2026-07-03-s18-ui-campaign-findings.md`
(M2, M3, m5/D3, m4/D4, m7/D5). Method: S15 recomposition vocabulary
(`2026-07-01-solutionsboard-recomposition-design.md`) — fold, flatten, demote; never revert
shipped features.**

## Re-grounded premises (verified vs HEAD 30e6d22, 2026-07-03)

| S19-prompt premise | Measured reality at HEAD |
|---|---|
| Engage panel ~12 blocks ≈ 1,890px, depth 4 | **1,704px, 8 co-equal QVFlow blocks** (status 22 / guide 149 / privacy hint 58 / sol 384 / sol 384 / sol 363 / cast 48 / turnout 92) **+ VoteExplainer row above; boxed depth 4** ✓. Campaign counted sub-blocks — same surface, same verdict. Ballot items 384px ✓ |
| Strip circles ~52px | **32px** (`InitiativeStageStrip.module.scss:60`); ring + padding inflated the campaign number. 86px total strip height; visual-weight complaint unchanged ✓ |
| Kit Button md min-height 40px | Fixed `height: 40px` (`Button.module.scss:42`), not min-height; "clear 44 in context" comment at line 34 ✓ |
| 4 title-zone patterns | ✓ — and **AppHeader already renders an eyebrow+h1 `titleBlock`** (`AppHeader.tsx:101–106`); the missing piece is the bar↔title rule + adoption. Census: ~10 pages with in-content h1s. **Pre-existing bug found: `/community/:id/currency` renders TWO h1s** (CommunityView hidden h1 + Currency's own, ×3 conditional variants) |
| W1 pushed / deploy green / parity 1121=1121 / gates clean / QVFlow `padding: 0` intact | All ✓ (scanner + grep-gates + `gh run list` + `tsc -b` clean) |

The guide box's support-used progressbar is **live feedback while allocating hearts** — it must
NOT fold with the prose (folding it hides your remaining budget mid-vote).

## Decisions locked (Eston, 2026-07-03, this session)

1. **Strip = dotted pills, pure marker.** ~28px flush row (no container box): 8px stage-colour
   dot + 12px label per stage. Current pill: `rgba($stage-X, .12)` tint + stage-colour border +
   `$gray-900` semibold label. Done: full-colour dot, `$gray-700` label. Upcoming: dot at 0.35
   opacity, `$gray-500` label. **Nothing in the strip navigates** — one affordance rule = zero
   affordances; the Mandate shortcut leaves the strip (pre-mandate initiatives had no real
   destination anyway; the published mandate is reachable from mandate-stage card content).
2. **CommunityView keeps the hidden-h1 + hero-card exception** (S17 decision reaffirmed).
   Title block is **non-sticky** app-wide: the brand bar stays sticky; eyebrow+h1 scroll away
   with content (360px screens don't permanently lose ~46px).
3. **Hearts explainer folds, first-visit expanded.** Guide prose + privacy line fold behind ONE
   inline expand; expanded the first time a user opens a ballot, collapsed after
   (`welcomeHints` id `qvGuide`). Support bar + % always visible.
4. **Ballot items: one merged expand.** Reviewer chip inline; "What this commits to" + "How
   we'll know it's working" merge into one "Commitments & metrics (n)" expand per solution
   (post-vote view already does this). Post-vote regional bars stay visible (north star 2);
   the separate region-key legend folds behind an inline expand.

## M3 — InitiativeStageStrip recomposition

`InitiativeStageStrip.tsx` + `.module.scss`. Drop `useNavigate`, `targetFor`, the `.go`
button branch and lucide icons; every stage renders the same static pill `<span>` inside its
`<li>` (semantics kept: `<ol aria-label>`, `aria-current="step"` on the current stage).
`current === 'discussion'` keeps rendering as between-stages (Problem done, nothing current).
Stage colours via the existing `$stage-*` tokens; dots are the only colour carrier. Kill the
stale "five stage markers" SCSS comment. i18n: `stage.goTo` becomes unused → remove from
en+fr+sw together (packet note). DiscussionPill next to the strip is untouched.

## M2 — engage-panel recomposition (VoteEngage/QVFlow)

Target: ≤5 co-equal blocks, ≤2 boxed depth, both ballot states.

**Pre-vote** (5 blocks): status line · guide (bar + % + inline expand "how hearts work"
containing guide prose + privacy line, `qvGuide` first-visit default) · ballot list · Cast
button · turnout footer.

**Per-solution flatten** (~384px → ~230px): solHead (n° + reviewer chip) · hearts stepper row
**flush** (steppers keep their 44px hit area & W1 `padding: 0` fix; the outer boxed bar
surface goes — `svg` keeps fixed box) · text · byline · ONE flush inline-expand
"Commitments & metrics (n)" (chevron + `aria-expanded`; replaces the two bordered `details`
boxes; keeps `<details>` element, restyled borderless).

**Post-vote**: same flatten; regional bars + counts stay visible per solution; `regionKey`
grid folds behind a flush inline expand; merged details row already exists — restyle flush.

VoteExplainer (S11 pre-gate modal) and VotePreview (non-participant) are already compact —
untouched beyond what the SCSS restyle shares. Wire names and all contract reads untouched.
New/changed i18n keys at en+fr+sw parity; removed keys removed from all three.

**After M2: measure problem/solutions/mandate engage panels against the same bars** (S15
SolutionsBoard sits ~4 blocks; expectation: milder). Fix only if a bar is broken; log otherwise.

## D3 — page-title standard

**AppHeader restructure:** sticky `<header>` keeps ONLY the bar (brand · back · bell · menu).
The `titleBlock` (eyebrow + h1) moves to a non-sticky sibling rendered by AppHeader directly
below the header, separated from the bar by the header's full-width bottom rule, with real
breathing room (`$spacing-md` top padding vs today's 0-gap hairline). `titleVisuallyHidden`
keeps working (CommunityView). Existing title/eyebrow callers (CollaborationFullView,
SuggestionDmView, DiscussionStageView) inherit the new treatment unchanged.

**Adoption (in-content h1 → AppHeader title prop):** HomeView ("Across your communities";
intro paragraph stays as content lead) · StageFeedView (sr-only h1 → visible block, eyebrow
"Browse by stage") · Identity subpages: Communities, JoinCommunity, About, Contact, Profile
(sr-only → visible "Profile") · CreateCommunityPage. Eyebrow convention stays "section name",
title = specific page/community name.

**Exceptions (sanctioned, unchanged):** onboarding step heroes · MandateCard document h1
(MandatePage) · CommunityView hidden h1 (decision 2) · LoginPage + NotFound centered heroes ·
`/lab/presence`. CreateInitiativePage already nests under CommunityView's h1 (its title is an
h2) — inherits, no change.

**Bug fix folded in:** Currency's three `<h1>Community Funds</h1>` → `<h2>` (route already
gets its h1 from CommunityView; today it renders two h1s).

## D4/D5 — sizing floors

- `Button.module.scss`: `.md` height 40 → **44px**; the line-34 "md/lg clear the 44px touch
  target with vertical padding in context" comment goes (no longer needed); `.lg` 48px stays;
  `.sm` 32px stays (documented DESIGN_SYSTEM exceptions survive).
- Icon floor **≥16px inline, ≥20px inside buttons/CTAs**: sweep `size={1[0-5]}` lucide
  instances (known: MandateCard "View full"/"View all" 11px arrows; DiscussionPill 13px;
  source-chip 13px…) and SCSS font-size icon boxes under 16px. Judgment call per site;
  decorative micro-glyphs inside 44px targets get raised to the floor, not beyond.
- ProblemVoteFlow "Second it"/"Not for me": `svg { flex-shrink: 0 }` so text pressure can't
  squeeze the 18px icons to 16.3px; labels wrap instead.
- After the Button change: 360px walk of HomeView, community feed, onboarding, MandatePage,
  both schemes, hunting wrapped buttons/grown fixed bars.

## Definition of done (from the S19 prompt)

M2 ≤5 blocks & ≤2 depth re-measured · M3 strip no longer out-shouts (screenshot judgment at
the gate) · D3 rule + title block on every standard page, 1 h1 per route (currency double-h1
fixed) · D4/D5 floors swept · build/parity/gates green · Opus whole-diff review 0 Crit/0 Imp ·
before/after screenshots presented · **Eston's explicit push green light** · closeout
(§7/§8, packet, memory, W3 prompt with its own re-verify table).
