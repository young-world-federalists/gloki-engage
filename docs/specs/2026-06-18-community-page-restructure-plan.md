# Community-page restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the per-initiative "roadmap" pipeline onto the community page as expandable activity cards, behind one global `Gloki` header with a single right-hand menu — eliminating the left-hand community menu, the duplicated headers, and the redundant per-page stage tracker.

**Architecture:** A reusable `GlobalHeader` (brand → home, right hamburger → account menu) tops every community page. `CommunityHome` renders one consolidated `CommunityCard` (absorbing the dark header + `MissionBanner` + the start/menu actions) above a feed of `ActivityCard`s. Each `ActivityCard` is collapsed by default and, when expanded, mounts `InitiativeStagePanel` — the active-stage engagement + author advance bar extracted from `InitiativeDashboard` — so members engage in place. The old `/roadmap` route redirects to the community page with that card auto-expanded; deep threaded work still opens the focused `DiscussionStageView`.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. Icons: `lucide-react`. Contract I/O via `src/services/api.ts` (`contractRead`/`contractWrite`). i18n via `useT()` (`src/i18n`). No test framework.

## Global Constraints

These apply to **every** task:

- **Seam rule:** components read/write only through `src/services/api.ts` / existing flow hooks. Never call a server directly. This restructure is presentational + routing; it must not touch the UI↔service seam.
- **No test framework.** Verify each task by: `npx tsc -b` (must report **zero** errors — the production build runs `tsc -b`), then `npm run dev` + browser/preview check (console clean, snapshot/screenshot) at **360px** width in **both light and dark** mode.
- **i18n parity:** every new user-facing string goes through `t('key', 'English default')` **and** is added to all three locale files — `en`, `fr`, `sw` — in the same task. fr and sw currently sit at 878 keys each with **0 variable-drift**; keep them equal. Native-speaker review is a separate human-gated task — use a faithful literal translation for now.
- **Design tokens:** follow `DESIGN_SYSTEM.md`. Use the shared `Button`, `Card`, `Badge`, `Banner`, `Modal`, `SlideOutMenu` components and SCSS token variables. No hard-coded hex; `$primary` is `#3b82f6`. Reuse existing `*.module.scss` token patterns.
- **Accessibility:** interactive controls ≥44px touch target; expand/collapse buttons use `aria-expanded`; decorative icons `aria-hidden`; exactly one `<h1>` per page (the community name). Sentence case everywhere.
- **Keep `ui` runnable** at every commit. Commit after each task.

---

## File structure

**Create:**
- `src/components/GlobalHeader.tsx` (+ `GlobalHeader.module.scss`) — brand + account menu, reusable across pages.
- `src/components/community/CommunityCard.tsx` (+ `.module.scss`) — consolidated community header/mission/meta/actions.
- `src/components/community/ActivityCard.tsx` (+ `.module.scss`) — collapsible initiative card (collapsed summary ⇄ expanded engagement).
- `src/components/collaboration/InitiativeStagePanel.tsx` (+ `.module.scss`) — active-stage engagement + author advance bar, extracted from `InitiativeDashboard`.

**Modify:**
- `src/pages/CommunityView.tsx` — swap the dark header for `GlobalHeader`; flip the community `SlideOutMenu` to `side="right"`; thread `onOpenMenu`/`memberCount` to `CommunityHome`.
- `src/components/community/CommunityHome.tsx` — render `CommunityCard`; turn the feed into `ActivityCard`s with expand state + `?initiative=` auto-expand; stop navigating to `/roadmap`.
- `src/pages/collaboration/InitiativeView.tsx` — redirect the default/roadmap route to the community page; keep `/discussion`.
- `src/components/stages/ProblemStage.tsx` — label "The problem" / "Who it affects"; rename CTA to "Propose a different framing".

**Delete:**
- `src/components/collaboration/InitiativeDashboard.tsx` — superseded by `ActivityCard` + `InitiativeStagePanel` (verify no other importers first).
- `src/components/collaboration/PipelineView.tsx` — already orphaned; superseded by the community feed.

---

### Task 1: CommunityCard — consolidate the dark header + mission card

**Files:**
- Create: `src/components/community/CommunityCard.tsx`, `src/components/community/CommunityCard.module.scss`
- Modify: `src/components/community/CommunityHome.tsx` (replace the `MissionBanner` + primary-button + `ParticipationSummary` block, lines ~132–151)
- Modify: `src/pages/CommunityView.tsx` (pass `onOpenMenu`, `memberCount`, `isDemo` to `CommunityHome` — but `CommunityHome` reads members itself; pass only `onOpenMenu` and `isDemo`)

**Interfaces:**
- Produces:
  ```ts
  interface CommunityCardProps {
    communityId: string;
    name: string;
    description?: string;
    mission?: string;
    journey?: string[];               // optional deliberation phases (was MissionBanner's journey)
    memberCount: number;
    participation: { code: string; participants: number }[];
    isDemo?: boolean;
    onStartInitiative: () => void;
    onOpenMenu: () => void;
  }
  ```
- Consumes: shared `Button` from `../shared`; `ParticipationSummary` from `../shared/presence`.

- [ ] **Step 1: Create `CommunityCard.tsx`**

```tsx
import React from 'react';
import { Plus, Menu as MenuIcon, Users } from 'lucide-react';
import { Button } from '../shared';
import { ParticipationSummary } from '../shared/presence';
import { useT } from '../../i18n';
import styles from './CommunityCard.module.scss';

export interface CommunityCardProps {
  communityId: string;
  name: string;
  description?: string;
  mission?: string;
  journey?: string[];
  memberCount: number;
  participation: { code: string; participants: number }[];
  isDemo?: boolean;
  onStartInitiative: () => void;
  onOpenMenu: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  name, description, mission, journey, memberCount, participation,
  isDemo, onStartInitiative, onOpenMenu,
}) => {
  const t = useT();
  const blurb = mission || description;
  return (
    <section className={styles.card} aria-label={name}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>{t('community.eyebrow', 'Community')}</span>
        {isDemo && <span className={styles.demoPill}>{t('community.demo', 'Demo')}</span>}
      </div>
      <h1 className={styles.name}>{name}</h1>
      {blurb && <p className={styles.mission}>{blurb}</p>}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Users size={15} aria-hidden />
          {memberCount === 1
            ? t('community.members.one', '1 member')
            : t('community.members.many', '{n} members', { n: memberCount })}
        </span>
      </div>

      {participation.length > 0 && <ParticipationSummary participation={participation} />}

      {journey && journey.length > 0 && (
        <ul className={styles.journey}>
          {journey.map((j, i) => <li key={i} className={styles.journeyItem}>{j}</li>)}
        </ul>
      )}

      <div className={styles.actions}>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onStartInitiative} className={styles.startBtn}>
          {t('initiative.start', 'Start an initiative')}
        </Button>
        <Button
          variant="secondary"
          leftIcon={<MenuIcon size={18} />}
          onClick={onOpenMenu}
          aria-haspopup="menu"
        >
          {t('community.menuButton', 'Menu')}
        </Button>
      </div>
    </section>
  );
};

export default CommunityCard;
```

- [ ] **Step 2: Create `CommunityCard.module.scss`**

Use card tokens (white surface, `0.5px` border, `border-radius` lg, padding `1rem 1.25rem`). Key rules: `.eyebrow` — `font-size: 0.75rem; letter-spacing: 0.08em; color: var(--color-text-tertiary); font-weight: 500;` (sentence case, NOT uppercase). `.name` — the page `h1`, ~1.5rem/500. `.mission` — secondary text, `line-height: 1.5`. `.actions` — `display: flex; gap: 8px;` with `.startBtn { flex: 1; }`. Reuse the `.demoPill` style from `CommunityView.module.scss` (the `$warning`/`$gray-900` version). Ensure both buttons render ≥44px tall.

- [ ] **Step 3: Use it in `CommunityHome.tsx`**

Replace the `<MissionBanner …/>`, the `{participation.length > 0 && <ParticipationSummary …/>}` line, and the promoted `<Button …>Start an initiative</Button>` (current lines ~132–151) with:

```tsx
<CommunityCard
  communityId={communityId}
  name={props.name || t('community.fallbackName', 'Community')}
  description={props.description}
  mission={fixture?.mission}
  journey={fixture?.journey}
  memberCount={memberCount}
  participation={participation}
  isDemo={isDemo}
  onStartInitiative={() => navigate(`/community/${communityId}/create-initiative`)}
  onOpenMenu={onOpenMenu}
/>
```

Add to `CommunityHomeProps`: `onOpenMenu: () => void; isDemo?: boolean;`. Add imports for `CommunityCard`; remove the now-unused `MissionBanner` import (and `ParticipationSummary` if no longer referenced elsewhere in the file — it is now inside `CommunityCard`, so remove it here). Replace `import { Card, Badge, Button, TrustBadge } from '../shared';` only if `Button`/`ParticipationSummary` become unused — keep `Card, Badge, TrustBadge`.

- [ ] **Step 4: Pass props from `CommunityView.tsx`**

In the `<Route path="*" element={<CommunityHome communityId={communityId!} />} />` line (~315), change to:
```tsx
<Route path="*" element={<CommunityHome communityId={communityId!} onOpenMenu={() => setShowMenu(true)} isDemo={isDemo} />} />
```
Add `t` key for `community.eyebrow`, `community.menuButton`, `community.demo` to `en`, `fr`, `sw`.

- [ ] **Step 5: Typecheck** — Run `npx tsc -b`. Expected: zero errors.
- [ ] **Step 6: Verify** — `npm run dev`; open a community page at 360px (light + dark). Confirm one consolidated card: eyebrow → name → mission → member/countries → `Start an initiative` + `Menu`. Console clean. The dark header still exists above it for now (removed in Task 2).
- [ ] **Step 7: Commit**

```bash
git add src/components/community/CommunityCard.tsx src/components/community/CommunityCard.module.scss src/components/community/CommunityHome.tsx src/pages/CommunityView.tsx src/i18n
git commit -m "feat(community): consolidated CommunityCard (header + mission + actions)"
```

---

### Task 2: GlobalHeader + remove the left-hand community menu

**Files:**
- Create: `src/components/GlobalHeader.tsx`, `src/components/GlobalHeader.module.scss`
- Modify: `src/pages/CommunityView.tsx` (replace the dark header block, lines ~243–261; flip `SlideOutMenu` to `side="right"`)
- Reuse: `src/components/identity/HomepageMenu.tsx` (the global account menu — already props `isOpen`/`onClose`)
- Reuse: `src/components/shared/EarthFlag.tsx` (brand mark — until the logo swap workstream replaces it)

**Interfaces:**
- Produces: `const GlobalHeader: React.FC` — renders brand (icon + `Gloki`, click → `navigate('/')`) and a right-hand hamburger that toggles `HomepageMenu`. Owns its own menu open state.
- Consumes: `HomepageMenu` (account menu), `EarthFlag`.

- [ ] **Step 1: Create `GlobalHeader.tsx`**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import EarthFlag from './shared/EarthFlag';
import HomepageMenu from './identity/HomepageMenu';
import { useT } from '../i18n';
import styles from './GlobalHeader.module.scss';

const GlobalHeader: React.FC = () => {
  const navigate = useNavigate();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={styles.header}>
      <button className={styles.brand} onClick={() => navigate('/')} aria-label={t('nav.home', 'Home')}>
        <EarthFlag size={26} />
        <span className={styles.wordmark}>Gloki</span>
      </button>
      <button
        className={styles.menuButton}
        onClick={() => setMenuOpen(true)}
        aria-label={t('nav.openMenu', 'Open menu')}
        aria-expanded={menuOpen}
      >
        <Menu size={22} strokeWidth={2.5} />
      </button>
      <HomepageMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
};

export default GlobalHeader;
```

> Verify `EarthFlag`'s prop name for size and `HomepageMenu`'s exact props during implementation; adjust the call to match (`HomepageMenu` is currently triggered from `HomeView` with `isOpen`/`onClose`).

- [ ] **Step 2: Create `GlobalHeader.module.scss`** — sticky top bar: `display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; border-bottom: 0.5px solid` token. `.brand` — transparent button, `display: flex; align-items: center; gap: 8px;`, `.wordmark` 18px/500. `.menuButton` ≥44px hit area.

- [ ] **Step 3: Swap into `CommunityView.tsx`** — replace the entire dark header `<div className={styles.header}>…</div>` (lines ~243–261) with `<GlobalHeader />`. The community name/description/member-count now live in `CommunityCard` (Task 1), so they are intentionally dropped from the top band. Remove the now-unused `Menu` import and the `menuButton`/header markup. Keep `showMenu`/`setShowMenu` (still drives the community menu).

- [ ] **Step 4: Flip the community menu to the right** — change `side="left"` to `side="right"` on the `SlideOutMenu` (~269). It is now opened by `CommunityCard`'s `Menu` button (wired in Task 1 via `onOpenMenu`).

- [ ] **Step 5: Typecheck** — `npx tsc -b`. Zero errors.
- [ ] **Step 6: Verify** — community page at 360px (light/dark): top shows `Gloki` + icon (click → home) and a right hamburger opening the account menu; the `Menu` button on the card opens the community menu **from the right**; no left-hand menu remains. Console clean.
- [ ] **Step 7: Commit**

```bash
git add src/components/GlobalHeader.tsx src/components/GlobalHeader.module.scss src/pages/CommunityView.tsx src/i18n
git commit -m "feat(nav): global Gloki header on community view; right-side menus; drop left menu"
```

---

### Task 3: InitiativeStagePanel — extract active-stage engagement + advance bar

**Files:**
- Create: `src/components/collaboration/InitiativeStagePanel.tsx`, `src/components/collaboration/InitiativeStagePanel.module.scss`
- Source to extract from: `src/components/collaboration/InitiativeDashboard.tsx` (do **not** modify it in this task — copy/adapt; it is deleted in Task 6)

**Interfaces:**
- Produces:
  ```ts
  interface InitiativeStagePanelProps {
    initiativeId: string;     // the collaboration/initiative contract id
    communityId: string;
    title: string;
    hostServer: string;
    hostAgent: string;
  }
  ```
- Consumes: `ProblemStage`, `DiscussionStage`, `ProposalsStage`, `VoteStage`, `MandateStage`, `StageGate`, `JourneyRecap`, `RoleDisplay`, role helpers (`getInitiativeRoles`, `isAuthorOrCoAuthor`), stage-metrics helpers, `resolveInitiativeStageContract`, `setInitiativeStage`.

- [ ] **Step 1: Create `InitiativeStagePanel.tsx`** by moving these pieces out of `InitiativeDashboard` (current line refs in parens), wrapped to take props instead of `useParams`/route title:
  - State + effects: `stage`, `details`, `roles`, `problemTally`, `discussion/proposals/voteSummary`, `advancing`, `confirmAdvance`, `advanceError` and their fetch effects (lines 66–175).
  - Derived: `memberCount`/`activeMemberCount` (177–179), `STAGES`, `currentStageIndex`, `nextStage`, `getStageReadiness`, `handleAdvance`, `stageReadiness` (39–45, 181–240).
  - Render: the **merged-into banner** (258–275), `RoleDisplay` (277–279) — author/MC, the **active-stage `StageGate` block** (397–439), the **mandate `JourneyRecap`** (309–317), and the **advance bar** (445–482).
  - **Omit:** `PageHeader` (247–254), the standalone `description` paragraph (the card title carries it), the **5-dot progress bar** (286–306), and the completed/locked `stageCards` scaffolding (320–443 except the active `StageGate` block you kept). The footer is the only roadmap now.

  Replace `useParams` host/agent + `title` with the new props. Keep `navigate` for the merged-into CTA and the mandate `onViewMandate` (`/mandate/${communityId}/${initiativeId}`).

- [ ] **Step 2: Create `InitiativeStagePanel.module.scss`** — reuse the relevant rules from `InitiativeDashboard.module.scss` for `.absorbedBanner`, the active-stage container, and `.advanceBar`/`.confirmRow`/`.advanceButton`/`.advanceWarning`. Drop all `.progressBar`/`.stepDot`/`.stageCard`/`.connector` rules.

- [ ] **Step 3: Typecheck** — `npx tsc -b`. Zero errors. (Not yet rendered anywhere — this task delivers a clean, compiling, reusable unit.)
- [ ] **Step 4: Commit**

```bash
git add src/components/collaboration/InitiativeStagePanel.tsx src/components/collaboration/InitiativeStagePanel.module.scss
git commit -m "refactor(initiative): extract InitiativeStagePanel (active stage + advance) from dashboard"
```

---

### Task 4: ActivityCard — collapsible initiative card

**Files:**
- Create: `src/components/community/ActivityCard.tsx`, `src/components/community/ActivityCard.module.scss`
- Consumes: `InitiativeStagePanel` (Task 3), shared `Card`/`Badge`/`TrustBadge`, `STAGE_META` (move it out of `CommunityHome` into a shared spot or re-declare locally — see note).

**Interfaces:**
- Produces:
  ```ts
  interface ActivityCardProps {
    item: import('../../services/contracts/community').Collaboration;
    communityId: string;
    stage: string;               // PipelineStage; used only for the collapsed badge
    authorName: string;
    authorKey?: string;
    trustState: React.ComponentProps<typeof TrustBadge>['state'];  // derive, don't assume an exported name
    vouchCount: number;
    hostServer: string;
    hostAgent: string;
    expanded: boolean;
    onToggle: () => void;
  }
  ```
  > The collapsed byline shows **only** the author ("Started by …"). The **MC/moderator** and co-author roles appear in the *expanded* panel via `RoleDisplay` (inside `InitiativeStagePanel`) — this is how the spec's "fold author/MC into the card" is satisfied without fetching roles for every collapsed card.
- Note on `STAGE_META`: it currently lives in `CommunityHome.tsx` (lines 19–32). Move it to a small shared module `src/components/community/stageMeta.ts` and import from both `CommunityHome` and `ActivityCard` (DRY).

- [ ] **Step 1: Create `src/components/community/stageMeta.ts`** — move the `StageMeta` interface + `STAGE_META` record verbatim out of `CommunityHome.tsx`; export both.

- [ ] **Step 2: Create `ActivityCard.tsx`**

```tsx
import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, TrustBadge } from '../shared';
import type { Collaboration } from '../../services/contracts/community';
import { useT } from '../../i18n';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { STAGE_META } from './stageMeta';
import InitiativeStagePanel from '../collaboration/InitiativeStagePanel';
import styles from './ActivityCard.module.scss';

export interface ActivityCardProps {
  item: Collaboration;
  communityId: string;
  stage: string;
  authorName: string;
  authorKey?: string;
  trustState: React.ComponentProps<typeof TrustBadge>['state'];
  vouchCount: number;
  hostServer: string;
  hostAgent: string;
  expanded: boolean;
  onToggle: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  item, communityId, stage, authorName, authorKey, trustState, vouchCount,
  hostServer, hostAgent, expanded, onToggle,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const meta = STAGE_META[stage] || STAGE_META.problem;
  const Icon = meta.icon;
  const panelId = `activity-panel-${item.id}`;

  return (
    <Card as="article" className={styles.card}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.summaryMain}>
          <Badge tone={meta.tone}>
            <span className={styles.badgeInner}><Icon size={12} />{t(meta.labelKey, meta.labelDefault)}</span>
          </Badge>
          <span className={styles.title}>{item.title || t('community.untitled', 'Untitled Initiative')}</span>
          {authorName && (
            <span className={styles.byline}>
              {t('community.startedBy', 'Started by {name}', { name: authorName })}
              {authorKey && <TrustBadge state={trustState} vouchCount={vouchCount} size="sm" />}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
      </button>

      {expanded && (
        <div id={panelId} className={styles.panel}>
          <InitiativeStagePanel
            initiativeId={item.id}
            communityId={communityId}
            title={item.title || ''}
            hostServer={hostServer}
            hostAgent={hostAgent}
          />
          <button
            type="button"
            className={styles.deepLink}
            onClick={() =>
              navigate(`/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${item.id}/discussion`)
            }
          >
            {t('community.openDiscussion', 'Open discussion')} <ExternalLink size={14} aria-hidden />
          </button>
        </div>
      )}
    </Card>
  );
};

export default ActivityCard;
```

- [ ] **Step 3: Create `ActivityCard.module.scss`** — `.summary` is a full-width transparent button: `display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left;`, min-height 44px. `.title` 1rem/500. `.byline` secondary 0.8125rem, `display: inline-flex; align-items: center; gap: 6px;`. `.panel` — top border `0.5px` token, `padding-top: 12px; margin-top: 12px;`. `.deepLink` — secondary text link button, right-aligned. `.badgeInner` mirror `CommunityHome.module.scss`.

- [ ] **Step 4: Typecheck** — `npx tsc -b`. Zero errors. Also update `CommunityHome.tsx` import to pull `STAGE_META`/`StageMeta` from `./stageMeta` (delete the in-file copy) so the project still compiles.
- [ ] **Step 5: Commit**

```bash
git add src/components/community/ActivityCard.tsx src/components/community/ActivityCard.module.scss src/components/community/stageMeta.ts src/components/community/CommunityHome.tsx
git commit -m "feat(community): ActivityCard (collapsible, expands to inline stage engagement)"
```

---

### Task 5: Wire the feed — expand inline instead of navigating to /roadmap

**Files:**
- Modify: `src/components/community/CommunityHome.tsx` (the `initiatives.map(...)` feed, lines ~164–210; the `handleCardClick`, lines ~120–126)

**Interfaces:**
- Consumes: `ActivityCard` (Task 4). Adds expand state + `?initiative=` auto-expand.

- [ ] **Step 1: Add expand state + deep-link read** in `CommunityHome`:

```tsx
import { useSearchParams } from 'react-router-dom';
// …
const [searchParams] = useSearchParams();
const deepLinked = searchParams.get('initiative');
const [expandedIds, setExpandedIds] = useState<Set<string>>(
  () => new Set(deepLinked ? [deepLinked] : []),
);
const toggleExpanded = (id: string) =>
  setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
```

- [ ] **Step 2: Replace the real-initiative `<Card>` block** (lines ~175–208) with:

```tsx
const hostServer = item.hostServer || serverUrl || 'local';
const hostAgent = item.hostAgent || publicKey || 'local';
return (
  <ActivityCard
    key={item.id}
    item={item}
    communityId={communityId}
    stage={stage}
    authorName={authorName}
    authorKey={item.author}
    trustState={trust.trustOf(item.author || '')}
    vouchCount={trust.vouchCountOf(item.author || '')}
    hostServer={hostServer}
    hostAgent={hostAgent}
    expanded={expandedIds.has(item.id)}
    onToggle={() => toggleExpanded(item.id)}
  />
);
```

Delete `handleCardClick` (no longer used). Keep the sample-data block as-is (samples remain non-interactive preview cards). Remove now-unused imports (`Card` if only samples use it — samples still use `Card`, so keep it; remove `formatTimeAgo`/`Badge`/`TrustBadge` only if unused — samples still use them, so keep).

- [ ] **Step 3: Typecheck** — `npx tsc -b`. Zero errors.
- [ ] **Step 4: Verify (the headline feature)** — community page at 360px (light/dark): tap a real initiative card → it expands inline showing the active stage's engagement (e.g. the problem second/threshold UI) + "Open discussion"; tap again → collapses; multiple can be open. Visiting `/community/:id?initiative=<id>` auto-expands that card. Console clean. (If there are no real initiatives in the demo, seed one via the existing demo flow to verify.)
- [ ] **Step 5: Commit**

```bash
git add src/components/community/CommunityHome.tsx
git commit -m "feat(community): activity feed expands initiatives inline (no roadmap shuttle)"
```

---

### Task 6: Retire the roadmap page

**Files:**
- Modify: `src/pages/collaboration/InitiativeView.tsx` (redirect the default route to the community page)
- Delete: `src/components/collaboration/InitiativeDashboard.tsx`
- Verify: the global `StageFooter` renders on the community route (it is the roadmap now)

- [ ] **Step 1: Confirm importers** — Run `grep -rn "InitiativeDashboard" src/`. Expected: only `InitiativeView.tsx`. If anything else imports it, stop and reassess.

- [ ] **Step 2: Redirect in `InitiativeView.tsx`** — change the default route that renders `InitiativeDashboard` to redirect to the community page with the card expanded:

```tsx
import { Navigate, useParams } from 'react-router-dom';
// in the default/index + "roadmap" route element:
const { communityId, initiativeId } = useParams();
return <Navigate to={`/community/${communityId}?initiative=${initiativeId}`} replace />;
```
Keep the `/discussion` → `DiscussionStageView` route untouched. (Match the actual param names used in `InitiativeView`.)

- [ ] **Step 3: Delete the dashboard** — `git rm src/components/collaboration/InitiativeDashboard.tsx src/components/collaboration/InitiativeDashboard.module.scss` and remove its import from `InitiativeView.tsx`.

- [ ] **Step 4: Confirm the footer roadmap** — Run `grep -rn "StageFooter" src/`. Ensure `StageFooter` is mounted app-wide (likely in `App.tsx` or a layout). If it is **not** shown on `/community/*`, add it to the community layout so the 5-stage roadmap is always present in the footer. If it already renders globally, no change — note that in the commit.

- [ ] **Step 5: Global header on the focused page** — the spec wants the `Gloki` header on *every* page. Read `src/pages/collaboration/DiscussionStageView.tsx` (the threaded page reached via "Open discussion"); if it does not already render a top brand/back affordance that returns home, add `<GlobalHeader />` at its top for consistency. If it already has an equivalent header, leave it and note so in the commit.
- [ ] **Step 6: Typecheck** — `npx tsc -b`. Zero errors.
- [ ] **Step 7: Verify** — Navigating an old `/initiative/.../roadmap` (or the initiative default) link lands on the community page with that card expanded; the footer shows the 5-stage roadmap; no dot tracker anywhere; "Open discussion" reaches the threaded page and that page also has the global `Gloki` header. Console clean.
- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(nav): retire roadmap page — redirect to community page; footer is the only roadmap"
```

---

### Task 7: Problem stage — label the text, adopt the hybrid framing

**Files:**
- Modify: `src/components/stages/ProblemStage.tsx` (the `whoWhy` paragraph ~174; the propose link ~242–245; the modal title/CTA ~373/380)

- [ ] **Step 1: Label the two fields** — wrap the statement/`whoWhy` rendering so each has a small label. Replace the bare `{whoWhy && <p className={styles.whoWhy}>{whoWhy}</p>}` and add a labeled statement above it:

```tsx
{(framing?.statement || details?.description) && (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>{t('problems.labelProblem', 'The problem')}</span>
    <p className={styles.statement}>{framing?.statement || details?.description}</p>
  </div>
)}
{whoWhy && (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>{t('problems.labelWho', 'Who it affects')}</span>
    <p className={styles.whoWhy}>{whoWhy}</p>
  </div>
)}
```
> Confirm the exact statement source field on `ProblemFraming`/`details` during implementation; use whatever currently supplies the one-line statement. Add `.field`/`.fieldLabel` SCSS (label = the same eyebrow style: 0.6875rem, letter-spacing, tertiary).

- [ ] **Step 2: Rename the CTA to the hybrid model** — change `t('problems.proposeCta', 'Propose a different problem')` → `t('problems.proposeFramingCta', 'Propose a different framing')`; modal title `t('problems.proposeTitle', 'Propose a problem')` → `t('problems.proposeFramingTitle', 'Propose a framing')`; intro copy → "Suggest a different way to frame **this** problem — others rank framings together." Keep the submit pipeline (`proposeCandidateIssue`) — copy-only change for now; the data model stays seam-backed.

- [ ] **Step 3: i18n** — add `problems.labelProblem`, `problems.labelWho`, `problems.proposeFramingCta`, `problems.proposeFramingTitle`, and the revised intro to `en`/`fr`/`sw`. Leave the old `problems.proposeCta`/`proposeTitle` keys in place if referenced elsewhere; otherwise remove from all three.

- [ ] **Step 4: Typecheck** — `npx tsc -b`. Zero errors.
- [ ] **Step 5: Verify** — Expand a problem card: "The problem" and "Who it affects" are clearly labeled and no longer read as rival problems; the CTA reads "Propose a different framing". en/fr/sw spot-check at 360px.
- [ ] **Step 6: Commit**

```bash
git add src/components/stages/ProblemStage.tsx src/components/stages/ProblemStage.module.scss src/i18n
git commit -m "feat(problem): label problem/who-it-affects; reframe propose CTA (hybrid model)"
```

---

### Task 8: Delete the orphaned PipelineView

**Files:**
- Delete: `src/components/collaboration/PipelineView.tsx` (+ its `.module.scss` if present)

- [ ] **Step 1: Confirm orphaned** — `grep -rn "PipelineView" src/`. Expected: no importers (only the file itself).
- [ ] **Step 2: Delete** — `git rm src/components/collaboration/PipelineView.tsx` (and its module SCSS if any). Its i18n keys can stay (harmless) or be pruned if clearly unique to it.
- [ ] **Step 3: Typecheck** — `npx tsc -b`. Zero errors.
- [ ] **Step 4: Commit**

```bash
git commit -am "chore: remove orphaned PipelineView (superseded by the community feed)"
```

---

### Task 9: Final verification pass

- [ ] **Step 1: Clean typecheck** — `npx tsc -b` reports zero errors.
- [ ] **Step 2: Full build** — `npm run build` succeeds.
- [ ] **Step 3: Manual sweep** — `npm run dev`; at 360px in light **and** dark: global `Gloki` header click → home from a community page; right hamburger account menu; card `Menu` (community) opens from the right; consolidated community card reads cleanly; an initiative expands inline through its current stage and the author advance bar works; "Open discussion" reaches the threaded page; the footer carries the 5-stage roadmap; no left-hand menu, no per-page dots. Repeat the key screens in `en`/`fr`/`sw`.
- [ ] **Step 4: i18n parity check** — confirm `fr` and `sw` key counts are equal and cover all new keys (no missing-key fallbacks in the console).
- [ ] **Step 5: Commit any fixes** found during the sweep.

---

## Notes / risks

- **`InitiativeStagePanel` extraction (Task 3)** is the highest-risk step — it carries the stage data-fetching and the author-only advance logic. Extract faithfully; do not change the seam calls. The mandate `JourneyRecap` and merged-into banner must survive the move.
- **Host params** (`hostServer`/`hostAgent`) feed deep links and contract resolution; preserve the `item.hostServer || serverUrl` fallback already used in `CommunityHome`.
- **StageGate / web-of-trust permissions** stay wrapped around the active stage inside `InitiativeStagePanel` — do not bypass them when moving the block.
- **Deferred (other workstreams):** profile-edit polish, logo swap, ID-card QR/name fix, create-community back-button visibility. Not in this plan.
