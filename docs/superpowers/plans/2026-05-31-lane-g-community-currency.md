# Lane G — Community Home & Currency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the community surface into a welcoming transnational "town square" — a mission-led home (mission banner → country-presence strip → activity feed) and a simplified "community support points" currency page — with a focused dark-mode/mobile/a11y pass.

**Architecture:** Extract the home out of the 554-line `CommunityView` shell into a new `CommunityHome` (data owner) composing a new presentational `MissionBanner`, the already-merged Lane F `ParticipationSummary`, and the migrated activity feed. Reframe `Currency` by removing the mint/burn voting card while keeping the balance (with read-only community rates) and send-support action. Remove the redundant inline tab bar so navigation is hamburger-only.

**Tech Stack:** React 19 + TypeScript + Vite, Redux Toolkit, SCSS Modules, shared component kit (`Card`/`Badge`/`Button`/`EmptyState`), i18n via `useT()`. UI-only mockup — data from `src/services/demo/`; no backend/contract changes.

**Spec:** `docs/superpowers/specs/2026-05-31-lane-g-community-currency-design.md`

---

## Conventions for this plan

- **All file paths and commands are relative to the worktree root** `.worktrees/lane-g` (the working directory during execution).
- **No test framework exists** (confirmed: `package.json` has no test script; adding one is a Foundation/out-of-lane change). The per-task gate is therefore: **`npx tsc -b --noEmit` clean** + a **manual preview check** via `npm run dev`. Structural tasks additionally run **`npm run build`**.
- **Stay in owned paths:** `src/components/community/**` (NOT `chat/**`), `src/pages/CommunityView.*`, `src/components/community/Currency.*`, fixture `src/services/demo/fixtures/community.ts`. The shared kit and Lane F presence kit are **imported, never edited**.
- **i18n:** every NEW/CHANGED user-facing string uses `t('key', 'English default')`. Do **not** edit `src/i18n/**` (Lane F owns the dictionaries; inline defaults are the mechanism).
- **Tokens only:** no raw hex/px/rgba in SCSS — use `src/styles/variables.scss` tokens.
- **Commits:** one per task, message prefix `feat(lane-g):` / `refactor(lane-g):` / `chore(lane-g):`.

---

## File structure

| File | Status | Responsibility |
|------|--------|----------------|
| `src/services/demo/fixtures/community.ts` | Modify | Flagship community data + `mission`/`countries`/`journey` and their types |
| `src/components/community/MissionBanner.tsx` | Create | Presentational mission banner (name, mission, description, journey badges) |
| `src/components/community/MissionBanner.module.scss` | Create | MissionBanner styles (tokens + dark mode) |
| `src/components/community/CommunityHome.tsx` | Create | Home data owner; composes banner + presence strip + activity feed |
| `src/components/community/CommunityHome.module.scss` | Create | Home band layout + feed card meta styles |
| `src/pages/CommunityView.tsx` | Modify | Route `*` → `CommunityHome`; remove inline feed; remove inline tab bar |
| `src/pages/CommunityView.module.scss` | Modify | Remove `.tabBar`/`.tabItem*` styles |
| `src/components/community/Currency.tsx` | Modify | Reframe to "support points"; remove mint/burn voting card |
| `src/components/community/Currency.module.scss` | Modify | Remove orphaned preference styles |

---

## Task 1: Extend the community fixture

**Files:**
- Modify: `src/services/demo/fixtures/community.ts`

- [ ] **Step 1: Replace the fixture file contents**

Replace the entire contents of `src/services/demo/fixtures/community.ts` with:

```ts
// Lane G — community fixtures: the flagship community shell.

export type JourneyStatus = 'done' | 'active' | 'upcoming';

export interface JourneyPhase {
  key: string;
  /** i18n key for the phase label. */
  labelKey: string;
  /** Inline English default for the label. */
  labelDefault: string;
  status: JourneyStatus;
}

export interface CommunityFixture {
  name: string;
  description: string;
  /** One-line tagline framing the shared mission. */
  mission: string;
  /** Participating countries (ISO 3166-1 alpha-2) — presence-strip fallback. */
  countries: string[];
  /** Deliberation phases for the journey line. */
  journey: JourneyPhase[];
}

export const VFTC_COMMUNITY: CommunityFixture = {
  name: 'Voices for the Climate',
  description:
    'A transnational youth deliberation on climate action across Kenya, Nigeria, Malawi, and DR Congo — framing shared problems, co-writing proposals, and committing to a collective mandate.',
  mission: 'A youth-led mandate for climate action, built across borders.',
  countries: ['KE', 'NG', 'MW', 'CD'],
  journey: [
    { key: 'codesign',     labelKey: 'journey.codesign',     labelDefault: 'Co-Design',                 status: 'done' },
    { key: 'deliberation', labelKey: 'journey.deliberation', labelDefault: 'Open Deliberation',         status: 'active' },
    { key: 'voting',       labelKey: 'journey.voting',       labelDefault: 'Consolidation & Voting',    status: 'upcoming' },
    { key: 'distribution', labelKey: 'journey.distribution', labelDefault: 'Distribution & Evaluation', status: 'upcoming' },
  ],
};
```

> Note: existing consumers (`src/services/demo/mockApi.ts`, `src/services/demo/seedDemoCommunity.ts`) only read `.name` and `.description`, so the added fields are backward-compatible.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: PASS (no errors). This confirms the new types are valid and no consumer broke.

- [ ] **Step 3: Commit**

```bash
git add src/services/demo/fixtures/community.ts
git commit -m "feat(lane-g): add mission, countries, journey to community fixture"
```

---

## Task 2: Create the MissionBanner component

**Files:**
- Create: `src/components/community/MissionBanner.tsx`
- Create: `src/components/community/MissionBanner.module.scss`

- [ ] **Step 1: Create `MissionBanner.module.scss`**

```scss
@use '../../styles/variables' as *;

.banner {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.eyebrow {
  font-size: $text-xs;
  font-weight: $font-semibold;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $primary;
  margin: 0;
}

.name {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: $gray-800;
  margin: 0;
  line-height: 1.2;
}

.mission {
  font-size: $text-base;
  font-weight: $font-medium;
  color: $gray-700;
  margin: 0;
  line-height: 1.4;
}

.description {
  font-size: $text-sm;
  color: $gray-600;
  margin: 0;
  line-height: 1.5;
}

.journey {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}

@media (prefers-color-scheme: dark) {
  .name { color: $dark-text; }
  .mission { color: $dark-text; }
  .description { color: $dark-text-secondary; }
}
```

- [ ] **Step 2: Create `MissionBanner.tsx`**

```tsx
import React from 'react';
import { useT } from '../../i18n';
import { Card, Badge } from '../shared';
import type { BadgeTone } from '../shared';
import type { JourneyPhase } from '../../services/demo/fixtures/community';
import styles from './MissionBanner.module.scss';

export interface MissionBannerProps {
  /** Community name (real, from community properties). */
  name: string;
  /** Community description (real, from community properties). */
  description?: string;
  /** One-line mission tagline (flagship only; omit to hide). */
  mission?: string;
  /** Deliberation journey phases (flagship only; omit to hide). */
  journey?: JourneyPhase[];
}

const STATUS_TONE: Record<JourneyPhase['status'], BadgeTone> = {
  done: 'success',
  active: 'primary',
  upcoming: 'neutral',
};

/**
 * Mission banner band atop the community home. Pure presentational —
 * degrades to just name + description when mission/journey are absent.
 */
const MissionBanner: React.FC<MissionBannerProps> = ({ name, description, mission, journey }) => {
  const t = useT();

  return (
    <Card as="section" className={styles.banner}>
      <p className={styles.eyebrow}>{t('community.missionEyebrow', 'Our shared mission')}</p>
      <h2 className={styles.name}>{name}</h2>
      {mission && <p className={styles.mission}>{mission}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {journey && journey.length > 0 && (
        <div className={styles.journey} aria-label={t('community.journeyAria', 'Deliberation journey')}>
          {journey.map((phase) => (
            <Badge key={phase.key} tone={STATUS_TONE[phase.status]} dot={phase.status === 'active'}>
              {t(phase.labelKey, phase.labelDefault)}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MissionBanner;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: PASS. (The component is not yet imported anywhere; an unused exported module does not fail `tsc`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/community/MissionBanner.tsx src/components/community/MissionBanner.module.scss
git commit -m "feat(lane-g): add MissionBanner presentational component"
```

---

## Task 3: Create the CommunityHome component

**Files:**
- Create: `src/components/community/CommunityHome.tsx`
- Create: `src/components/community/CommunityHome.module.scss`

This moves the activity-feed logic out of `CommunityView`'s inline `CommunityFeed` and adds the mission banner + presence strip. Stage badges switch from ad-hoc hex colors to design-system `Badge` tones.

- [ ] **Step 1: Create `CommunityHome.module.scss`**

```scss
@use '../../styles/variables' as *;

.home {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.feedHeader {
  margin-bottom: $spacing-xs;
}

.feedTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-800;
  margin: 0 0 $spacing-xs 0;
}

.feedDescription {
  font-size: $text-sm;
  color: $gray-500;
  margin: 0;
  line-height: 1.5;
}

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badgeInner {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.time {
  font-size: $text-xs;
  color: $gray-400;
}

.cardTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-800;
  margin: 0;
  line-height: 1.3;
}

.cardDesc {
  font-size: $text-sm;
  color: $gray-600;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author {
  font-size: $text-xs;
  color: $gray-400;
}

.sampleBanner {
  font-size: $text-xs;
  color: $gray-400;
  text-align: center;
  padding: $spacing-sm;
  font-style: italic;
}

.sampleCard {
  opacity: 0.85;
  border-style: dashed;
  border-color: rgba($primary, 0.25);
}

@media (prefers-color-scheme: dark) {
  .feedTitle { color: $dark-text; }
  .feedDescription { color: $dark-text-secondary; }
  .cardTitle { color: $dark-text; }
  .cardDesc { color: $dark-text-secondary; }
  .author,
  .time { color: $dark-text-secondary; }
}
```

- [ ] **Step 2: Create `CommunityHome.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import type { Collaboration } from '../../services/contracts/community';
import { VFTC_COMMUNITY } from '../../services/demo/fixtures/community';
import { useT } from '../../i18n';
import { Card, Badge } from '../shared';
import type { BadgeTone } from '../shared';
import { ParticipationSummary } from '../shared/presence';
import MissionBanner from './MissionBanner';
import styles from './CommunityHome.module.scss';

interface StageMeta {
  tone: BadgeTone;
  icon: React.ComponentType<{ size?: number }>;
  labelKey: string;
  labelDefault: string;
}

const STAGE_META: Record<string, StageMeta> = {
  problem:    { tone: 'error',   icon: AlertCircle,   labelKey: 'stage.problem',    labelDefault: 'Problem' },
  discussion: { tone: 'warning', icon: MessageCircle, labelKey: 'stage.discussion', labelDefault: 'Discussion' },
  proposals:  { tone: 'info',    icon: Lightbulb,     labelKey: 'stage.proposals',  labelDefault: 'Proposals' },
  vote:       { tone: 'primary', icon: Vote,          labelKey: 'stage.vote',       labelDefault: 'Vote' },
  mandate:    { tone: 'success', icon: ScrollText,    labelKey: 'stage.mandate',    labelDefault: 'Mandate' },
};

interface SampleItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  authorName: string;
  createdAt: number;
}

const SAMPLE_FEED: SampleItem[] = [
  { id: 's1', title: 'Access to Clean Drinking Water', description: 'Over 2 billion people lack safe drinking water globally.', stage: 'problem', authorName: 'Maria S.', createdAt: Date.now() - 3600000 },
  { id: 's2', title: 'Ocean Plastic Pollution', description: '8 million tons of plastic enter our oceans annually.', stage: 'discussion', authorName: 'Lin W.', createdAt: Date.now() - 7200000 },
  { id: 's3', title: 'Antibiotic Resistance', description: 'Drug-resistant infections threaten global health security.', stage: 'proposals', authorName: 'Dr. Chen L.', createdAt: Date.now() - 86400000 },
  { id: 's4', title: 'Digital Privacy Standards', description: 'Personal data harvested at unprecedented scale.', stage: 'vote', authorName: 'Sam R.', createdAt: Date.now() - 172800000 },
  { id: 's5', title: 'Universal Climate Fund', description: 'Decentralized climate adaptation resources for communities.', stage: 'mandate', authorName: 'Elena V.', createdAt: Date.now() - 259200000 },
];

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CommunityHomeProps {
  communityId: string;
}

const CommunityHome: React.FC<CommunityHomeProps> = ({ communityId }) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityCollaborations, communityMembers, communityProperties, profiles } = useAppSelector(
    (s) => s.communities,
  );
  const [stages, setStages] = useState<Record<string, string>>({});

  // Fetch collaborations if not already loaded.
  useEffect(() => {
    if (!serverUrl || !publicKey || communityCollaborations[communityId]) return;
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, communityCollaborations, dispatch]);

  const initiatives = useMemo(() => {
    const collabs = communityCollaborations[communityId] ?? [];
    return collabs
      .filter((c) => c.type === 'initiative')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityCollaborations, communityId]);

  // Fetch each initiative's current stage.
  useEffect(() => {
    if (!serverUrl || !publicKey || initiatives.length === 0) return;
    initiatives.forEach((item) => {
      if (stages[item.id]) return;
      contractRead({
        serverUrl,
        publicKey,
        contractId: item.id,
        method: { name: 'get_stage', values: {} } as IMethod,
      })
        .then((result: unknown) => {
          setStages((prev) => ({ ...prev, [item.id]: typeof result === 'string' ? result : 'problem' }));
        })
        .catch(() => {
          setStages((prev) => ({ ...prev, [item.id]: 'problem' }));
        });
    });
  }, [serverUrl, publicKey, initiatives]);

  const props = communityProperties[communityId] || {};
  const isFlagship = props.name === VFTC_COMMUNITY.name;
  const members: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const memberCount = members.length;

  // Presence: tally member countries from profiles; fall back to fixture
  // countries (flagship only) so the demo always shows the strip.
  const participation = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pk of members) {
      const c = profiles[pk]?.country;
      if (c) counts[c] = (counts[c] ?? 0) + 1;
    }
    let list = Object.entries(counts).map(([code, participants]) => ({ code, participants }));
    if (list.length === 0 && isFlagship) {
      const per = Math.max(1, Math.round(memberCount / VFTC_COMMUNITY.countries.length) || 1);
      list = VFTC_COMMUNITY.countries.map((code) => ({ code, participants: per }));
    }
    return list;
  }, [members, profiles, isFlagship, memberCount]);

  const handleCardClick = (item: Collaboration) => {
    const hostServer = item.hostServer || serverUrl || 'local';
    const hostAgent = item.hostAgent || publicKey || 'local';
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${item.id}/roadmap`,
    );
  };

  const usingSampleData = initiatives.length === 0;

  return (
    <div className={styles.home}>
      <MissionBanner
        name={props.name || t('community.fallbackName', 'Community')}
        description={props.description}
        mission={isFlagship ? VFTC_COMMUNITY.mission : undefined}
        journey={isFlagship ? VFTC_COMMUNITY.journey : undefined}
      />

      {participation.length > 0 && <ParticipationSummary participation={participation} />}

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <h3 className={styles.feedTitle}>{t('community.activityTitle', 'Community Activity')}</h3>
          <p className={styles.feedDescription}>
            {t(
              'community.activityDesc',
              'Recent initiatives and updates. Tap an initiative to see its progress through the governance pipeline.',
            )}
          </p>
        </div>

        {initiatives.map((item) => {
          const stage = stages[item.id] || 'problem';
          const meta = STAGE_META[stage] || STAGE_META.problem;
          const Icon = meta.icon;
          const authorProfile = item.author ? profiles[item.author] : undefined;
          const authorName = authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`.trim()
            : item.author
              ? item.author.slice(0, 8) + '…'
              : '';

          return (
            <Card
              key={item.id}
              as="article"
              interactive
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(item);
                }
              }}
            >
              <div className={styles.cardHeader}>
                <Badge tone={meta.tone}>
                  <span className={styles.badgeInner}>
                    <Icon size={12} />
                    {t(meta.labelKey, meta.labelDefault)}
                  </span>
                </Badge>
                {item.createdAt > 0 && <span className={styles.time}>{formatTimeAgo(item.createdAt)}</span>}
              </div>
              <h4 className={styles.cardTitle}>{item.title || t('community.untitled', 'Untitled Initiative')}</h4>
              {item.description && <p className={styles.cardDesc}>{item.description}</p>}
              {authorName && <span className={styles.author}>{authorName}</span>}
            </Card>
          );
        })}

        {usingSampleData && (
          <>
            <div className={styles.sampleBanner}>
              {t('community.sampleBanner', 'Example initiatives — start an initiative to participate')}
            </div>
            {SAMPLE_FEED.map((sample) => {
              const meta = STAGE_META[sample.stage] || STAGE_META.problem;
              const Icon = meta.icon;
              return (
                <Card key={sample.id} as="article" className={`${styles.card} ${styles.sampleCard}`}>
                  <div className={styles.cardHeader}>
                    <Badge tone={meta.tone}>
                      <span className={styles.badgeInner}>
                        <Icon size={12} />
                        {t(meta.labelKey, meta.labelDefault)}
                      </span>
                    </Badge>
                    <span className={styles.time}>{formatTimeAgo(sample.createdAt)}</span>
                  </div>
                  <h4 className={styles.cardTitle}>{sample.title}</h4>
                  <p className={styles.cardDesc}>{sample.description}</p>
                  <span className={styles.author}>{sample.authorName}</span>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityHome;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: PASS. (Still not routed; compiles as an unused module.)

- [ ] **Step 4: Commit**

```bash
git add src/components/community/CommunityHome.tsx src/components/community/CommunityHome.module.scss
git commit -m "feat(lane-g): add CommunityHome (mission banner + presence + feed)"
```

---

## Task 4: Wire CommunityHome into CommunityView; remove the inline feed

**Files:**
- Modify: `src/pages/CommunityView.tsx`

- [ ] **Step 1: Add the CommunityHome import**

After the existing lazy imports block (the line `const CreateInitiativePage = lazy(() => import('./CreateInitiativePage'));`), add:

```tsx
import CommunityHome from '../components/community/CommunityHome';
```

(Direct import, not lazy — it's the default/most-common view; matches the old inline `CommunityFeed` which was also non-lazy.)

- [ ] **Step 2: Remove the `STAGE_META` constant**

Delete this block (the stage-metadata map with hex colors — now lives in `CommunityHome` as tones):

```tsx
// ─── Stage metadata ──────────────────────────
const STAGE_META: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; label: string }> = {
  problem:    { icon: AlertCircle,   color: '#ef4444', label: 'Problem' },
  discussion: { icon: MessageCircle, color: '#f59e0b', label: 'Discussion' },
  proposals:  { icon: Lightbulb,     color: '#8b5cf6', label: 'Proposals' },
  vote:       { icon: Vote,          color: '#3b82f6', label: 'Vote' },
  mandate:    { icon: ScrollText,    color: '#10b981', label: 'Mandate' },
};

// Sample data for empty communities
const SAMPLE_FEED = [
  { id: 's1', title: 'Access to Clean Drinking Water', description: 'Over 2 billion people lack safe drinking water globally.', stage: 'problem', authorName: 'Maria S.', createdAt: Date.now() - 3600000 },
  { id: 's2', title: 'Ocean Plastic Pollution', description: '8 million tons of plastic enter our oceans annually.', stage: 'discussion', authorName: 'Lin W.', createdAt: Date.now() - 7200000 },
  { id: 's3', title: 'Antibiotic Resistance', description: 'Drug-resistant infections threaten global health security.', stage: 'proposals', authorName: 'Dr. Chen L.', createdAt: Date.now() - 86400000 },
  { id: 's4', title: 'Digital Privacy Standards', description: 'Personal data harvested at unprecedented scale.', stage: 'vote', authorName: 'Sam R.', createdAt: Date.now() - 172800000 },
  { id: 's5', title: 'Universal Climate Fund', description: 'Decentralized climate adaptation resources for communities.', stage: 'mandate', authorName: 'Elena V.', createdAt: Date.now() - 259200000 },
];

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 3: Remove the entire inline `CommunityFeed` component**

Delete the whole block from the comment `// ─── Community activity feed ─────────────────` through the end of the `CommunityFeed` component (the `};` immediately before `// ─── Main community view ─────────────────`). This is the `const CommunityFeed: React.FC<{ communityId: string }> = ({ communityId }) => { ... };` definition.

- [ ] **Step 4: Point the `*` route at `CommunityHome`**

In the `<Routes>` block, change:

```tsx
              <Route path="*" element={<CommunityFeed communityId={communityId!} />} />
```

to:

```tsx
              <Route path="*" element={<CommunityHome communityId={communityId!} />} />
```

- [ ] **Step 5: Remove now-unused imports**

In the top-of-file imports, remove the symbols that were only used by the deleted code:
- From the `lucide-react` import, remove `AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText` (they moved to `CommunityHome`). Keep the rest (`Home, Menu, X, Users2, MessageSquare, Users, Coins, Share2, UserPlus, LogOut, PlusCircle, Shield, Link2, RotateCcw, MoreHorizontal`).
- Remove `import { contractRead } from '../services/api';`
- Remove `import type { IMethod } from '../services/interfaces';`
- Remove `import type { Collaboration } from '../services/contracts/community';`
- Keep `import { recordActivity } from '../services/contracts/community';` (still used by the main view's activity effect).

> If any of these symbols turn out to still be referenced, `tsc` in the next step will flag it — re-add only what's genuinely used.

- [ ] **Step 6: Typecheck and build**

Run: `npx tsc -b --noEmit`
Expected: PASS (no "unused variable" / "cannot find name" errors).

Run: `npm run build`
Expected: PASS — `tsc -b && vite build` completes, "built in …".

- [ ] **Step 7: Preview check**

Run: `npm run dev`, open the demo community home. Confirm: mission banner shows "Voices for the Climate" + tagline + 4 journey badges (the second, "Open Deliberation", has the active dot); presence strip shows KE·NG·MW·CD; the initiative cards render with stage badges and navigate on click/Enter.

- [ ] **Step 8: Commit**

```bash
git add src/pages/CommunityView.tsx
git commit -m "refactor(lane-g): render CommunityHome at the community home route"
```

---

## Task 5: Remove the redundant inline tab bar (hamburger-only nav)

**Files:**
- Modify: `src/pages/CommunityView.tsx`
- Modify: `src/pages/CommunityView.module.scss`

- [ ] **Step 1: Delete the inline tab-bar `<nav>` block**

Remove the entire block beginning with the comment `{/* Inline community nav tab bar */}` and ending with the closing `</nav>` (the `<nav className={styles.tabBar} aria-label="Community navigation"> … </nav>`). The header menu button and the slide-out menu remain the navigation.

- [ ] **Step 2: Remove the now-unused `useLocation`**

- In the top import from `react-router-dom`, remove `useLocation` (keep `Routes, Route, useParams, useNavigate, Navigate`).
- Remove the line `const location = useLocation();` from the `CommunityView` component body.

(The tab bar was the only consumer of `location`.)

- [ ] **Step 3: Remove the now-unused `MoreHorizontal` icon**

In the `lucide-react` import, remove `MoreHorizontal` (it was only the tab bar's "More" trigger). All other menu icons stay.

- [ ] **Step 4: Remove the tab-bar styles**

In `src/pages/CommunityView.module.scss`, delete these rules:

Light-mode block:
```scss
// ─── Inline community tab bar ─────────────────
.tabBar {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: $gray-800;
  border-top: 1px solid rgba(white, 0.08);
  border-bottom: 1px solid rgba(white, 0.08);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tabItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  flex: 1;
  min-width: 60px;
  min-height: 56px;
  padding: $spacing-sm $spacing-xs;
  background: transparent;
  border: none;
  color: rgba(white, 0.55);
  font-size: $text-xs;
  font-weight: $font-medium;
  cursor: pointer;
  transition: color $transition-base, background $transition-base;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    color: rgba(white, 0.85);
    background: rgba(white, 0.06);
  }
}

.tabItemActive {
  color: white;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 2px;
    background: $primary;
    border-radius: $radius-full;
  }
}
```

Dark-mode block (inside the `@media (prefers-color-scheme: dark)` rule):
```scss
  .tabBar {
    background: $dark-bg;
    border-color: $dark-border;
  }

  .tabItem {
    color: $dark-text-secondary;

    &:hover {
      color: $dark-text;
      background: rgba(white, 0.04);
    }
  }

  .tabItemActive {
    color: $dark-text;
  }
```

- [ ] **Step 5: Typecheck and build**

Run: `npx tsc -b --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Preview check**

In `npm run dev`: the inline tab bar is gone; the header hamburger button opens the slide-out menu; every former tab destination (Home, Collab, Chat, Currency, Members) plus the rest is reachable from the menu.

- [ ] **Step 7: Commit**

```bash
git add src/pages/CommunityView.tsx src/pages/CommunityView.module.scss
git commit -m "refactor(lane-g): remove redundant inline tab bar (hamburger-only nav)"
```

---

## Task 6: Reframe Currency as "Community Support Points"

**Files:**
- Modify: `src/components/community/Currency.tsx`
- Modify: `src/components/community/Currency.module.scss`

- [ ] **Step 1: Replace `Currency.tsx` contents**

Replace the entire file with:

```tsx
import React, { useState, useEffect } from 'react';
import { Coins, Send } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUserBalance } from '../../store/slices/currencySlice';
import { useT } from '../../i18n';
import styles from './Currency.module.scss';
import { transfer } from '../../services/contracts/community';

interface CurrencyProps {
  communityId: string;
}

const Currency: React.FC<CurrencyProps> = ({ communityId }) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);
  const { communityMembers, membersLoading } = useAppSelector((state) => state.communities);
  const { userBalance, parameters, loading: balanceLoading } = useAppSelector((state) => state.currency);

  const symbol = t('currency.symbol', 'points');

  // Read-only community-set daily rates (shown as observable info, not editable).
  const medianMintRate = parameters?.medians?.mint || 0;
  const medianBurnRate = parameters?.medians?.burn || 0;

  // Membership / loading guards.
  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const isMembersLoading = membersLoading[communityId] || false;

  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (publicKey && serverUrl && communityId) {
      dispatch(fetchUserBalance({ serverUrl, publicKey, contractId: communityId }));
    }
  }, [communityId, publicKey, serverUrl, dispatch]);

  const handlePayment = async () => {
    if (!selectedMember || !amount || parseFloat(amount) <= 0) return;

    const paymentAmount = parseFloat(amount);
    if (userBalance !== null && paymentAmount > userBalance) {
      alert(t('currency.insufficient', 'Insufficient balance'));
      return;
    }

    if (serverUrl && publicKey && communityId) {
      await transfer(serverUrl, publicKey, communityId, selectedMember, paymentAmount);
    }

    setAmount('');
    setSelectedMember('');
  };

  if (isMembersLoading || balanceLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('currency.title', 'Community Support Points')}</h2>
          <p>
            {isMembersLoading
              ? t('currency.loadingMembers', 'Loading community members...')
              : t('currency.loadingBalance', 'Loading balance...')}
          </p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('currency.title', 'Community Support Points')}</h2>
          <p>{t('currency.notMember', 'You are not yet a member of this community.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{t('currency.title', 'Community Support Points')}</h2>
        <p>{t('currency.subtitle', 'Signal what matters and support fellow members')}</p>
      </div>

      <div className={styles.explainer}>
        <div className={styles.explainerIcon}>
          <Coins size={24} />
        </div>
        <div className={styles.explainerText}>
          <h3>{t('currency.explainerTitle', 'How Support Points Work')}</h3>
          <p>
            {t(
              'currency.explainerBody1',
              'Support points are a shared way to signal what matters — back initiatives, support proposals, and send points to fellow members.',
            )}
          </p>
          <p>
            {t(
              'currency.explainerBody2',
              'The community sets how points flow. Check your balance below and send support to any member.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.balanceSection}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <Coins size={24} />
              <h3>{t('currency.yourBalance', 'Your Support Points')}</h3>
            </div>
            <div className={styles.balanceAmount}>
              <span className={styles.amount}>{userBalance !== null ? userBalance : '-'}</span>
              <span className={styles.currency}>{symbol}</span>
            </div>
            <div className={styles.balanceStats}>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.label}>{t('currency.addedRate', 'Points added across the community')}</span>
                  <span className={styles.value}>{t('currency.perDay', '{n}/day', { n: medianMintRate })}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>{t('currency.removedRate', 'Points removed across the community')}</span>
                  <span className={styles.value}>{t('currency.perDay', '{n}/day', { n: medianBurnRate })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.actionCard}>
            <h3>{t('currency.sendTitle', 'Send Support')}</h3>
            <div className={styles.paymentForm}>
              <div className="form-group">
                <label htmlFor="memberSelect">{t('currency.selectMember', 'Select Member')}</label>
                <select
                  id="memberSelect"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="input-field"
                >
                  <option value="">{t('currency.chooseMember', 'Choose a member...')}</option>
                  {allMembers
                    .filter((member) => member !== publicKey)
                    .map((member, index) => (
                      <option key={member} value={member}>
                        {t('currency.memberLabel', 'Member {n}', { n: index + 1 })} ({member.slice(0, 8)}...)
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentAmount">{t('currency.amountLabel', 'Amount ({symbol})', { symbol })}</label>
                <input
                  id="paymentAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('currency.amountPlaceholder', 'Enter amount')}
                  className="input-field"
                  min="1"
                  max={userBalance || undefined}
                />
                <div className={styles.balanceInfo}>
                  <span>
                    {t('currency.available', 'Available: {n} {symbol}', {
                      n: userBalance !== null ? userBalance : '-',
                      symbol,
                    })}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handlePayment} className={`send-button ${styles.sendButton}`}>
                  <Send size={16} />
                  {t('currency.sendButton', 'Send Support')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Currency;
```

What changed vs. the original: removed the `currency` info object, the `TrendingUp`/`TrendingDown` imports, the `setParameters` import, the mint/burn preference state (`mintPreference`, `burnPreference`, `mintFocused`, `burnFocused`), `hasChanges`, the preferences-reset `useEffect`, `handleUpdatePreferences`, `handleRevertPreferences`, and the entire "Your Currency Preferences" card. Kept balance (with read-only rates), send-support, membership/loading guards. All visible strings now go through `t()`.

- [ ] **Step 2: Remove orphaned styles in `Currency.module.scss`**

Delete these now-unused blocks (orphaned by removing the preferences card):

Inside `.actionCard`, the `.preferences` block:
```scss
        .preferences {
          display: flex;
          flex-direction: column;
          gap: $spacing-lg;

          .preferenceItem {
            display: flex;
            align-items: center;
            gap: $spacing-lg;

            label {
              flex: 1;
              font-weight: $font-medium;
              color: $gray-700;
              font-size: $text-sm;
            }

            .inputField {
              width: 120px;
              text-align: center;
            }
          }
        }
```

Inside `.actionCard`, the `.preferenceActions` block:
```scss
        .preferenceActions {
          display: flex;
          gap: $spacing-md;
          margin-top: $spacing-lg;
          padding-top: $spacing-lg;
          border-top: 1px solid $gray-200;

          .updateButton {
            flex: 1;
            padding: $spacing-sm $spacing-lg;
            background-color: $primary;
            color: white;
            border: none;
            border-radius: $radius-md;
            font-size: $text-sm;
            font-weight: $font-medium;
            cursor: pointer;
            transition: all $transition-base;

            &:hover:not(.disabled) {
              background-color: $primary-dark;
              transform: translateY(-1px);
            }

            &:active:not(.disabled) {
              transform: translateY(0);
            }

            &.disabled {
              background-color: $gray-300;
              color: $gray-500;
              cursor: not-allowed;
              opacity: 0.6;
            }
          }

          .revertButton {
            flex: 1;
            padding: $spacing-sm $spacing-lg;
            background-color: transparent;
            color: $gray-600;
            border: 1px solid $gray-300;
            border-radius: $radius-md;
            font-size: $text-sm;
            font-weight: $font-medium;
            cursor: pointer;
            transition: all $transition-base;

            &:hover:not(.disabled) {
              background-color: $gray-100;
              color: $gray-800;
              border-color: $gray-400;
            }

            &.disabled {
              background-color: $gray-100;
              color: $gray-400;
              border-color: $gray-200;
              cursor: not-allowed;
              opacity: 0.6;
            }
          }
        }
```

The `.mintIcon` / `.burnIcon` rules:
```scss
  .mintIcon {
    color: $success;
  }

  .burnIcon {
    color: $error;
  }
```

The responsive preferences override (inside `@media (max-width: $breakpoint-md)`):
```scss
      .actionsSection .actionCard .preferences .preferenceItem {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;

        .inputField {
          width: 100%;
        }
      }
```

The dark-mode preferences label (inside the dark `.actionsSection .actionCard` group):
```scss
        .preferences .preferenceItem label {
          color: $dark-text;
        }
```

> Leave `.actionButton` and the `.paymentFormOverlay` block as-is — they are pre-existing dead code outside this change's scope (logged as debt in the spec, not introduced here).

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc -b --noEmit`
Expected: PASS (no unused-symbol errors — confirms all removed state/imports are fully gone).

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Preview check**

In `npm run dev`, open a community's Currency page. Confirm: title reads "Community Support Points"; explainer + balance ("Your Support Points", `points`) + the two read-only daily-rate lines render; "Send Support" form works; **no** mint/burn input card remains.

- [ ] **Step 5: Commit**

```bash
git add src/components/community/Currency.tsx src/components/community/Currency.module.scss
git commit -m "feat(lane-g): reframe Currency as community support points"
```

---

## Task 7: G3 polish + audit-and-log

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-lane-g-community-currency-design.md` (append audit findings to §9)

- [ ] **Step 1: Dark-mode + 360px + a11y walk on touched surfaces**

With `npm run dev`, in DevTools toggle `prefers-color-scheme: dark` and set width to 360px. Walk: community home (mission banner, presence strip, feed cards) and Currency. Verify no clipped text, no contrast loss, no horizontal scroll, touch targets ≥44px. Confirm keyboard: feed cards focus and activate on Enter/Space; the hamburger menu opens/closes and traps focus reasonably. Fix any token/spacing issues found **only in the files this lane created/edited** (CommunityHome, MissionBanner, Currency, CommunityView). If a fix is made, re-run `npx tsc -b --noEmit` and `npm run build`.

- [ ] **Step 2: Audit the remaining `community/**` surfaces (log only)**

Skim `Members.tsx`, `Share.tsx`, `CollabList.tsx`, `IdentityTrust.tsx`, and `dialogs/**` for dark-mode/mobile/i18n/ad-hoc-value gaps. Do **not** rewrite them. Append a bullet list of findings under §9 of the spec (`docs/superpowers/specs/2026-05-31-lane-g-community-currency-design.md`), beginning each line with the file name. Fix only trivial one-line quick wins (and only if `tsc`/`build` stay green).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-05-31-lane-g-community-currency-design.md src/components/community src/pages/CommunityView.module.scss
git commit -m "chore(lane-g): G3 polish on touched surfaces + audit log"
```

---

## Task 8: Final verification gate

**Files:** none (verification only, plus optional doc sync)

- [ ] **Step 1: Full typecheck + production build**

Run: `npx tsc -b --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS — `tsc -b && vite build`, "built in …", no errors.

- [ ] **Step 2: Full preview walk (the spec's "done when" gate)**

With `npm run dev`, confirm every item in spec §8:
- Home: three bands render; journey line shows for the demo; presence strip shows KE·NG·MW·CD; empty-community sample fallback still works (test by viewing a community with no initiatives).
- Currency: explainer + balance with read-only daily rates + send-support; no mint/burn inputs remain.
- Dark mode correct on every touched surface.
- 360px layout holds.
- Keyboard + screen-reader basics OK.
- No console errors.

- [ ] **Step 3: Confirm clean tree**

Run: `git status --porcelain`
Expected: empty (everything committed).

- [ ] **Step 4 (optional — shared-doc sync, per A/F precedent):** If following the Lane A/F precedent of self-reporting in the root planning docs, in a **separate commit** tick the §9 Lane G boxes (G1/G2/G3) in `MASTER_TODO.md` and add a one-line Lane G self-report to §11, and update the `CommunityView`/`Currency` blurbs in `CLAUDE.md` to match (tab bar removed; currency = support points). These files are **outside Lane G's owned paths** — they are shared/root docs — so this step is optional and conflict-prone; it may instead be left to the PR description / Foundation owner. Do not bundle it with code commits.

```bash
git add MASTER_TODO.md CLAUDE.md
git commit -m "docs(lane-g): tick §9 G-boxes, §11 self-report, sync CLAUDE.md"
```

- [ ] **Step 5:** Lane G implementation complete. Hand off to the `superpowers:finishing-a-development-branch` flow (push `lane/lane-g`, open PR → `ui`) when ready — see the spec's verification section.

---

## Self-review

**1. Spec coverage:**
- G1 mission-led home → Tasks 1 (fixture), 2 (MissionBanner), 3 (CommunityHome: banner + presence strip + feed), 4 (wired into route). ✓
- G2 currency reframe (explainer + balance w/ read-only rates + send; remove mint/burn voting) → Task 6. ✓
- G3 consistency/dark-mode/mobile + new-strings i18n → Tasks 2/3/6 (tokens + `t()` in new/rewritten surfaces) and Task 7 (polish + audit-log). ✓
- Nav decision (remove tab bar, hamburger-only) → Task 5. ✓
- Verification gate (spec §8) → Task 8. ✓
- Follow-ups/debt (spec §9) → Task 7 step 2 appends audit findings. ✓

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to" — every code step shows complete code; every removal step shows the exact text to delete. ✓

**3. Type consistency:** `JourneyPhase`/`JourneyStatus`/`CommunityFixture` defined in Task 1 and imported by `MissionBanner` (Task 2) and used via `VFTC_COMMUNITY` in `CommunityHome` (Task 3). `BadgeTone` imported from the `../shared` barrel (verified it re-exports `BadgeTone`). `ParticipationSummary` used with its real prop `participation: { code; participants }[]` (verified against source). `Card`/`Badge` props (`as`, `interactive`, `tone`, `dot`) match their definitions. `MissionBanner` prop names (`name`/`description`/`mission`/`journey`) are consistent between Task 2 (definition) and Task 3 (call site). ✓

**4. Owned-paths check:** Tasks 1–7 touch only Lane G owned paths + the spec doc. Task 8 step 4 (shared root docs) is explicitly marked optional/out-of-lane. ✓
