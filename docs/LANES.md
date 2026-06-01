# Codebase map & conventions

> **The parallel-lane execution model this file once enforced is retired** (history:
> [archive/WAVE_1_HISTORY.md](archive/WAVE_1_HISTORY.md)). It now serves as a quick **map of where
> features live** plus the conventions that still apply. The current working model + branch/seam
> rules are in [CLAUDE.md](../CLAUDE.md) and [MASTER_TODO.md](../MASTER_TODO.md) §4.

---

## Feature → files map

| Area | Focus | Primary files | Fixture |
|------|-------|---------------|---------|
| **A** | Onboarding & Identity | `src/pages/IdentityView.*`, `src/components/identity/**`, new `src/components/onboarding/**` (stub at `OnboardingFlow.tsx`) | `src/services/demo/fixtures/identity.ts` |
| **B** | Issue selection & Problem framing | `src/components/stages/ProblemStage.*` | `src/services/demo/fixtures/problems.ts` |
| **C** | Deliberation & Co-authoring | `src/components/stages/DiscussionStage.*`, `src/components/stages/ProposalsStage.*`, `src/components/collaboration/flows/discussion/**`, `flows/modifications/**`, `flows/merge/**`, `src/components/collaboration/DiscussionStageView.*` | `src/services/demo/fixtures/deliberation.ts` |
| **D** | The three mechanisms | ALL of `src/components/collaboration/flows/voting/**` (`ProblemVoteFlow`, `ApprovalFlow`, `QVFlow`, `ConvictionStaking`, + new `Delegation*`) | `src/services/demo/fixtures/mechanisms.ts` |
| **E** | Mandate & Impact | `src/components/stages/VoteStage.*`, `src/components/stages/MandateStage.*`, `src/components/collaboration/InitiativeDashboard.*` (thin shell + completed-state summaries), new `src/components/mandate/**` (stub at `MandatePage.tsx`) | `src/services/demo/fixtures/mandate.ts` |
| **F** | Presence, multilingual & low-tech | `src/components/shared/AITools.*`, new `src/components/shared/presence/**`, new `src/components/shared/connectivity/**`, i18n overlays `src/i18n/fr.ts` + `src/i18n/sw.ts` (translation content) | `src/services/demo/fixtures/presence.ts` |
| **G** | Community home & Currency | `src/components/community/**` (except `chat/**`), `src/pages/CommunityView.*`, `Currency.*` | `src/services/demo/fixtures/community.ts` |

**Mechanisms vs stages:** Lane D owns the voting flow *components*; Lanes B/C/E own the stage *shells*
that import them. You import a flow, you don't edit it (and vice-versa).

---

## What Foundation built — inherit these read-only

- **Design tokens** — `src/styles/variables.scss`. **No ad-hoc values** (no raw hex/px/rgba in
  components). See `DESIGN_SYSTEM.md` for the full token reference, dark-mode palette, and semantic
  surfaces.
- **Shared component kit** — `src/components/shared/` exports `Button`, `Card`, `Modal`, `Stepper`,
  `EmptyState`, `Banner`, `Badge`, `CountryFlag`, `CountryPresence`, `LanguageSwitcher`,
  `LanePlaceholder` (+ existing `PageHeader`, `StageFooter`, `CountryParticipation`, `EarthFlag`,
  `SearchableSelect`). Import from the barrel: `import { Card, Button } from '../shared'`. Prefer these
  over hand-rolled markup. They are dark-mode-aware and take **translated strings via props**.
- **i18n** — `import { useT } from '../../i18n'`, then `t('namespace.key', 'English default')`. Pass
  the English default inline in your own component; **lanes do not edit `src/i18n/` except Lane F**
  (fr/sw overlays). Lookup falls back active-locale → English → your default → key.
- **Stage components** — `src/components/stages/{Problem,Discussion,Proposals,Vote,Mandate}Stage.tsx`
  each render with a `variant: 'feed' | 'dashboard'` prop. `StageFeedView` and `InitiativeDashboard`
  are thin shells that compose them — **don't edit the shells**, edit your stage component.
- **Per-lane fixtures** — `src/services/demo/fixtures/*.ts`, joined by the seed orchestrator
  (`seedDemoCommunity.ts`). Add your lane's sample data to your fixture file only.

## Route map (`src/App.tsx`)

```
/                                     → redirect to /stage/problem
/welcome/*                            → Lane A   onboarding journey
/stage/:stageId                       → (shell)  stage feed mini-apps
/identity/*                           → Lane A   identity / profile / about
/create-community                     → (shell)  create-community onboarding
/community/:communityId/*             → Lane G   community home + currency
/initiative/:host/:agent/:cid/:iid/*  → Lanes B/C/D/E via stage components
/mandate/:communityId/:mandateId/*    → Lane E   published mandate + adoption
```

Every area uses a `/*` wildcard — add internal sub-routes inside the area's component where possible.

---

## Conventions that still apply

- **Hardcoded UI only.** New data → a `src/services/demo/fixtures/*` file, read through the
  `src/services/demo/` mock layer (the seam rule, [CLAUDE.md](../CLAUDE.md)). Never reintroduce `?raw` Python imports.
- **Every user-facing string** goes through `t()` (English default inline is fine).
- **Design system is law.** Tokens + shared components; no ad-hoc colours/spacing ([DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)).
- **Verify before "done":** `npx tsc -b` clean, `npm run build` clean, walk the routes in the
  preview; confirm dark mode + 360px mobile + keyboard/screen-reader basics.
- **Ship small, self-contained chunks** that leave `ui` runnable.
