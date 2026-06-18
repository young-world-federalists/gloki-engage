# Community-page restructure — design spec

- **Date:** 2026-06-18
- **Branch:** `ui`
- **Status:** Design approved (mockup). Pending spec review → implementation plan.
- **Workstream:** 1 of 4 — the "big restructure." Workstreams 2–4 (profile-edit polish, logo swap, ID-card QR/name fix, create-community back-button visibility) are **out of scope here** and handled separately.

## Why

The community experience currently has two competing navigation surfaces and a lot of duplication:

- A **left-hand** community hamburger (inline in `CommunityView`) sits opposite a **right-hand** homepage menu — confusing, and the only way "home" is a buried menu item.
- The **dark community header** and the separate **"our shared mission" card** (`MissionBanner`) repeat the community name and description.
- The pipeline is a **separate place you shuttle to**: stage pages live under `InitiativeView → InitiativeDashboard`, which also paints a **5-dot stage tracker** that is redundant with the global 5-stage `StageFooter`.
- On the problem page, an unlabeled one-line **statement** stacked over a **who-it-affects** line reads as two rival problems, and **"Propose a different problem"** (which actually spawns a new candidate collaboration) clashes with the mental model that an initiative is the single origin of a problem.

## Goals

1. One **global header** on every page; clicking the `Gloki` brand always goes home.
2. One menu **pattern**, two clearly-scoped surfaces; remove the left-hand community menu.
3. Collapse the dark community band + `MissionBanner` into **one community card**.
4. Bring the pipeline **onto the community page** as **expandable activity cards**; engage in place.
5. Remove the per-page **stage-dot tracker**; the global footer is the only roadmap.
6. Fix the problem-text hierarchy and adopt the **hybrid problem model**.

## Non-goals (deferred to other workstreams)

- Profile-edit polish: header spacing, rename "your digital agent", photo-icon visibility, language full-dropdown.
- Logo asset swap (Earth-flag SVG → the new app icon).
- ID-card QR/name overlap fix (`IdentityCardSVG`).
- Create-community back-button visibility (`CreateCommunityPage` — button exists, reads as hidden).
- Any deep redesign of a stage's *internal* interaction beyond (a) labeling problem text and (b) mounting the stage inline.

## Canonical model: initiative ↔ problem (hybrid co-author framing)

An **initiative is the single origin.** Someone starts an initiative; it frames **one problem**, which flows through discussion → proposals → vote → mandate. Others may **propose alternative *framings* of that same problem**, which are ranked and folded in — the same co-authoring spirit already used in the discussion stage — rather than a free-for-all board of competing problems.

Consequences:
- "Propose a different problem" → **"Propose a different framing"**, scoped to the current initiative (no longer spawns an independent candidate collaboration).
- Genuinely new topics use **"Start an initiative"** at the community level.
- The problem card labels two distinct fields: **"The problem"** (the one-line statement) and **"Who it affects"** (the `whoWhy` line).

## Architecture

### Global header — every page
Reuse and extend `PageHeader` (`src/components/PageHeader.tsx`) so its brand layout (app icon + `Gloki`, click → `/`) is shown on the community and initiative pages, with a single **right-hand** hamburger plus the notifications bell and any DEMO badge. This **replaces the custom dark header** rendered inline in `CommunityView` (lines ~244–261). Where a page needs "back," that lives in the content area; brand-home is always present in the header.

### Menus — two scoped `SlideOutMenu` surfaces (list, not bento)
Both reuse `SlideOutMenu` (`src/components/shared/SlideOutMenu.tsx`), `side="right"`. Rationale for **list over bento**: menu items are same-shaped destinations; a labelled vertical list scans faster, is far better for screen readers, and reuses existing code.

- **Global menu** (right hamburger, every page) = *you & Gloki*: welcome guide, profile, your communities, join, create community, hidden communities, about, contact, log out. This is today's `HomepageMenu` (`src/components/identity/HomepageMenu.tsx`) **promoted from homepage-only to global.**
- **Community menu** (the card's "Menu" button) = *this community*: collab, chat, currency, members, identity & trust, settings, share community link, invite members, [demo: share/reset], leave community. These are today's inline left-menu items (`CommunityView` lines ~221–239), **moved right and folded into the card.**

The left-side community menu is removed entirely.

### Consolidated community card — `CommunityCard` (new)
Replaces the dark header + `MissionBanner` (`src/components/community/MissionBanner.tsx`). Structure: eyebrow "Community" → name (the page's single `h1`) → mission line → meta row (members, countries via `CountryParticipation`, issue tags) → action row: **"Start an initiative"** (primary, left) + **"Menu"** (right). Name/description appear **once**.

### Expandable activity feed — `ActivityCard` (new)
`CommunityHome` (`src/components/community/CommunityHome.tsx`) becomes a feed of `ActivityCard`s.
- **Collapsed:** stage dot + stage name + initiative title + one-line status + "Started by … · MC …" byline + chevron-down.
- **Expanded:** mounts the initiative's **current** stage component inline for in-place engagement, plus **"Open discussion ↗"** to the focused page. Chevron-up collapses.
- Multiple cards may be open at once (not a single-open accordion); default all collapsed.

### Stage content reuse
The per-stage components are the reusable engagement units and are **mounted inside `ActivityCard`**, receiving the same props the dashboard passed. They keep their current behavior except where the model section calls for a change (`ProblemStage` gets the "The problem" / "Who it affects" labels and the "Propose a different framing" rename):
- `src/components/stages/ProblemStage.tsx` — plus labeling + framing-rename (see model section)
- `src/components/stages/DiscussionStage.tsx`
- `src/components/stages/ProposalsStage.tsx`
- `src/components/stages/VoteStage.tsx`
- `src/components/stages/MandateStage.tsx`

### Roadmap = footer only
The global `StageFooter` is the single roadmap. **Remove the 5-dot tracker** from `InitiativeDashboard` (`src/components/collaboration/InitiativeDashboard.tsx`, lines ~286–306).

### Routing & page retirement
- `/community/:communityId` becomes the hub (community card + expandable feed).
- `InitiativeDashboard`'s full-page roadmap role is retired; its stage-resolution/mounting logic moves into `ActivityCard`. A **focused page for deep discussion** is retained (existing `DiscussionStageView`, `/initiative/.../discussion`) and reached via "Open discussion."
- `PipelineView` (`src/components/collaboration/PipelineView.tsx`) is **deleted** — already orphaned, and superseded by the community feed.
- Deep links to an initiative/stage still resolve: to the community page with that card expanded, or to the focused discussion page.

## Data flow / seam

This is a presentational + routing change. All reads/writes stay behind `src/services/api.ts` and the demo seam; no component calls a server directly. Because `ActivityCard` reuses the existing stage flows and `useFlowContract`, the UI↔service boundary is untouched.

## States & edge cases

- **Loading:** card skeletons; an expanded card defers to the stage component's own loading state.
- **Empty community:** community card + "No initiatives yet — start one" CTA.
- **Locked/future stages:** respect per-stage permissions + web-of-trust verification; locked stages show a locked affordance, not engage controls.
- **Error:** preserve existing stage `ErrorBoundary`s.
- **Deep link to a stage the user can't act on:** render read-only.

## i18n

New keys for: `CommunityCard` eyebrow/actions, `ActivityCard` status + byline lines, "Propose a different framing", and the problem-field labels. Maintain fr/sw parity (currently 878 each, 0 var-drift). Native-speaker review routing stays a separate human-gated task.

## Accessibility

- `ActivityCard` expand/collapse: a `button` with `aria-expanded` controlling the panel; chevron `aria-hidden`. Collapsing returns focus to the card header.
- Keep ≥44px touch targets (shared button minimum).
- Single `h1` per page (the community name in `CommunityCard`).
- Reuse `SlideOutMenu`'s existing focus trap/restore.
- `StageFooter` keeps `aria-current` on the active stage.

## Open questions to confirm in review

1. **Multiple expanded vs. one-at-a-time** — proposed: allow multiple.
2. **Deep-link target** — proposed: focused discussion page for threads; everything else inline on the community page.
3. **Delete `PipelineView` now** vs. keep the flag-for-Ouri note — proposed: delete (superseded).
4. **"Start an initiative"** stays the full `CreateInitiativePage` vs. a lighter inline flow — proposed: keep the existing page.
