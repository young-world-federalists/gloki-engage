# Lanes — boundaries & contribution protocol

This is the in-repo contract for the parallel UI-reform sessions. Phase 0 (Foundation) has merged;
**Wave 1 lanes run in parallel and must not collide.** Read this before starting any lane.

> ## The one rule: **stay in your lane**
> A lane may edit **only the files it owns** (table below). Foundation pre-partitioned the
> conflict-prone central files (`src/App.tsx`, `src/services/demo/fixtures/`, the stage hosts) so you
> never need to touch them. If you genuinely need a change in a shared file, **append a request to
> MASTER_TODO §10** — do not edit the shared file from a lane branch.

---

## Owned paths

| Lane | Focus | Owned paths (edit only these) | Owned fixture |
|------|-------|-------------------------------|---------------|
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

## Frozen route map (`src/App.tsx` — do not edit)

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

Every area uses a `/*` wildcard — add your internal sub-routes **inside your owned component**.

---

## Workflow (one worktree + branch per session)

```bash
git worktree add .worktrees/<lane> -b lane/<lane> ui
# work in your owned paths only; commit
# verify (see below); open PR lane/<lane> → ui; rebase on ui before merge
```

Because owned paths are disjoint and the central files are pre-partitioned, merges are conflict-free.

## Guardrails every session obeys

- **Hardcoded UI only.** No real backend. New data → your lane's fixture file, read through the
  existing `src/services/demo/` mock layer. Never reintroduce `?raw` Python imports.
- **Every user-facing string** goes through `t()` (English default inline is fine).
- **Design system is law.** Tokens + shared components; no ad-hoc colours/spacing.
- **Verify before "done":** `npx tsc -b --noEmit` clean, `npm run build` clean, walk your routes in
  the preview, confirm dark mode + 360px-wide mobile + keyboard/screen-reader basics.
- **Stay in your lane.** Touching another lane's files is how we get conflicts — don't.

## Coordination

Need something in a shared/foundation file (App.tsx, a shared component, another lane's file)? **Append
a request to MASTER_TODO §10 (Coordination log)** for the Foundation owner to apply between waves.
