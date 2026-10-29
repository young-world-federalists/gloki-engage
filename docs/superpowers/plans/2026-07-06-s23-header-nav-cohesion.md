# S23 plan — header/nav cohesion (execution tracker)

Spec: `docs/superpowers/specs/2026-07-06-s23-header-nav-cohesion-design.md`.
Direct execution with checkpoints (cross-cutting nav work — no parallel subagents).
Each chunk: `npx tsc -b` clean → commit → next. Push HELD for Eston's green light.

| # | Chunk | Commit | Status |
|---|---|---|---|
| 1 | Spec + plan docs | `b02ef9b` | ✅ |
| 2 | AppHeader `subtitle` + HomeView + StageFeedView + DESIGN_SYSTEM law | `184a6ca` | ✅ |
| 3 | Community section headers + universal back + mini-app header strip | `c4fcfe4` | ✅ |
| 4 | DiscussionPill → card footer; SolutionsBoard (i) anchored | `53e0a7d` | ✅ |
| 5 | `useUrlExpandedSet` + expansion persistence + `$sticky-scroll-offset` anchors | `e7f5410` | ✅ |
| 6 | Discussion page context header | `7558abb` | ✅ |
| 7 | Mandate: labels, doc dedup, MandateEngage summary header | `9a6a3a9` | ✅ |
| 8 | i18n key cleanup + preview walk + review + closeout | `7ef0dac` + closeout | ◐ review running; push HELD for Eston |

**Verification:** `tsc -b` + `npm run build` clean; preview walk (360px, light+dark) of
home, Solutions/Mandate stage feeds, community home + Members/Funds mini-apps, the
solution card → discussion → back round-trip (expansion retained via `?open=`), and the
mandate page ↔ community mandate card identity. fr/sw parity 1134=1134 (−6 orphaned
mandate keys). No fixture seed change → **no DEMO_VERSION bump**.

Decisions taken within Eston's direction (flag in the handback):
- Back semantics: history-back with hierarchical fallback; community home included,
  hub tabs (Home, stage feeds, Identity) excluded.
- StageFeedView eyebrow removed entirely (footer already provides the context).
- IdentityTrust's long intro paragraph becomes the header subtitle unchanged.
- WriteTogether keeps its (i) explainer, moved beside the "Start a draft" action.
