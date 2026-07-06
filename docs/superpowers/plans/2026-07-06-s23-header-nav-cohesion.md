# S23 plan — header/nav cohesion (execution tracker)

Spec: `docs/superpowers/specs/2026-07-06-s23-header-nav-cohesion-design.md`.
Direct execution with checkpoints (cross-cutting nav work — no parallel subagents).
Each chunk: `npx tsc -b` clean → commit → next. Push HELD for Eston's green light.

| # | Chunk | Files (primary) | Status |
|---|---|---|---|
| 1 | Spec + plan docs | this file + spec | ☐ |
| 2 | AppHeader `subtitle` + HomeView + StageFeedView + DESIGN_SYSTEM law | AppHeader.tsx/.scss, HomeView.tsx/.scss, StageFeedView.tsx/.scss | ☐ |
| 3 | Community section headers + universal back + mini-app header strip | CommunityView.tsx, CollabList, Members, Currency, ChatTopicList, IdentityTrust, CommunitySettings, WriteTogetherPage, CollaborationPage | ☐ |
| 4 | DiscussionPill → card footer; SolutionsBoard (i) anchored | InitiativeStageCard, FeedEngagePanel, SolutionsBoard | ☐ |
| 5 | `useUrlExpandedSet` + expansion persistence + `$sticky-scroll-offset` anchors | hooks/useUrlExpandedSet.ts, StageFeedView, CommunityHome, variables.scss, MandatePage.scss | ☐ |
| 6 | Discussion page context header | DiscussionStageView | ☐ |
| 7 | Mandate: labels, doc dedup, MandateEngage summary header | MandateCard, MandateDocument, MandateEngage, fixtures/mandate.ts | ☐ |
| 8 | i18n parity + preview walk + Opus review + closeout docs | fr.ts, sw.ts, MASTER_TODO §8, i18n packet, memory | ☐ |

Decisions taken within Eston's direction (flag in the handback):
- Back semantics: history-back with hierarchical fallback; community home included,
  hub tabs (Home, stage feeds, Identity) excluded.
- StageFeedView eyebrow removed entirely (footer already provides the context).
- IdentityTrust's long intro paragraph becomes the header subtitle unchanged.
- WriteTogether keeps its (i) explainer, moved beside the "Start a draft" action.
