# S16 Track C — Discussion-as-function IA + fix wave (design)

**2026-07-03, against `ui` @ `8fab58d`. Findings source:
`2026-07-03-s16-ui-review-findings.md`. Eston's decisions 1–3 (2026-07-03) are locked
inputs; the stage==='discussion' rendering sub-decision follows the session prompt's
own recommendation and is flagged for confirmation at the push gate.**

## 1. Discussion is a function, not a pipeline step (Eston decision 1)

Presentation-only. `PipelineStage`, the `discussion` stage key, routes, discussion
contract, wire names: ALL untouched.

- **`StageStrip.tsx`** (read-only anchor on create screens): drop the `discussion`
  entry → 4 stages. `stage.pipelineOverview` default copy "The 5 governance stages" →
  "The governance stages" (en/fr/sw all updated; packet append).
- **`InitiativeStageStrip.tsx`** (follow-this-initiative control): drop `discussion`
  from `STAGES` + `ORDER` → Problem → Solutions → Vote → Mandate. `current==='discussion'`
  renders Problem as done, nothing current (the initiative sits in the Problem→Solutions
  gap); the Discussion pill (below) carries the "in discussion" state. Mandate keeps its
  tap-through; the discussion tap-through moves to the pill.
- **NEW `DiscussionPill.tsx`** (`src/components/initiative/`): persistent Discussion
  button with live activity count, rendered in the `InitiativeStageCard` expanded panel
  on the same row as the strip (the card IS the inline dashboard; "near the title").
  - Read-only count: `resolveInitiativeStageContract(server, key, initiativeId,
    'discussionContractId')` → if found, `getComments()` → live count. **Never
    `useFlowContract` here** (it deploys — S11 lesson). No contract → count 0, button
    still navigates to the discussion page (deploy happens there on real user intent).
  - Active ("In discussion") state when the initiative's `stage === 'discussion'`:
    warning-tone accent matching the existing Discussion badge tone.
  - ≥44px target, icon ≥16px, `aria-label` includes the count.
- **Kept as-is**: `STAGE_META.discussion` (activity-type chip on discussion cards),
  HomeView "In discussion" section, `DiscussionActivityCard`, all routes.

## 2. Touch-target fixes (Eston decision 3 / findings T1–T4)

| Control | Now | Fix |
|---|---|---|
| NotificationsBell `bellBtn` | 30×30 | 44×44 (padding), icon 20 |
| AppHeader menu/back already 44? verify; fix if not | — | — |
| Banner dismiss | 24×24 | 44×44 tap area (padding, negative margin to keep visual size) |
| MandatePage "View full"/"View all" | ×14 | min-height 44 inline-flex tap area |
| Discussion Like / Collapse-replies | 22–34 wide | min-width 44 |

## 3. Contrast fixes (C1–C3)

- New token `$primary-on-dark: #60a5fa` (blue-400; ≥4.5:1 on $dark-bg/$dark-surface) —
  dark-scheme TEXT blue. Swap dark-mode `color: $primary-dark` text uses (HomeView
  "See all", MandatePage eyebrow) to it.
- Green text on white (vote-card "expert reviewed", "How we'll know it's working"):
  `color: $success` → `$success-on-surface` (#065f46) in light; dark scheme keeps a
  light green ($success at 2.54 is a *light-bg* failure only — verify dark equivalents
  during implementation).

## 4. Heading normalisation + padding (Eston decision 2 / N1–N2)

New tokens in `variables.scss`:
`$font-size-page-title: 1.5rem` (24px) · `$font-weight-page-title: 700` ·
`$font-size-section: 1.125rem` (18px) · `$heading-gap: $spacing-sm` (8px).

Two sanctioned h1 contexts (documented in DESIGN_SYSTEM):
1. **AppHeader bar title** (community-scoped pages): stays 18px/600 — a bar, not a hero.
2. **In-content page title**: 24px/700, margin-bottom 8px — applied to HomeView (20→24),
   StageFeedView (32→24), IdentityView (20→24), CreateCommunityPage (20→24),
   /welcome step titles (20→24); MandatePage already 24.
Section h2s: 18px/600 + margin-bottom 8px where currently 0 (HomeView, community feed).

## 5. Page-model repairs (L1–L2)

- CreateCommunityPage: render `AppHeader` (showBack) — in-content h1 stays the page h1.
- CommunityView not-found branch: wrap in AppHeader + `<main id="main">` so the error
  state stays inside the page model.

## Explicitly deferred to S17 / Wave-1.5

C4/C5 (slate captions on tints), N3 (duplicate title semantics), N4 (vote-card missing
initiative title — needs a data decision), T5–T7 ("See all", StageFooter 37px height,
source chips), kit-adoption leads, the 10 rgba scrims, persona wave.

## Verification per chunk

`npx tsc -b` + build green; preview at 360 light/dark on: community feed (strip 4-stage +
pill + count), stage feeds, mandate page; parity script PARITY OK; grep gates clean;
no DEMO_VERSION bump (no fixture changes).
