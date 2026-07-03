# S19 W2 build plan — card recomposition + title blocks + sizing floors

Spec: `../specs/2026-07-03-s19-w2-card-recomposition-design.md`. Direct execution (tightly
coupled UI + one shared preview — S10/S11/S13 precedent), sequential tasks, one commit each,
`npx tsc -b` green per chunk. UI-only wave: no fixtures, no DEMO_VERSION bump, wire names
untouched.

| # | Task | Files | Verify |
|---|---|---|---|
| 1 | M3 strip → dotted pills, pure marker | `src/components/initiative/InitiativeStageStrip.tsx`, `.module.scss`; `stage.goTo` removed from `src/i18n/{en,fr,sw}.ts` | tsc; preview: expanded card at 360px light+dark, aria-current present, row ≤ ~32px; parity scanner |
| 2 | M2 QVFlow recomposition (both ballot states) | `QVFlow.tsx`, `QVFlow.module.scss`, `welcomeHints.ts` (+`qvGuide` id), `{en,fr,sw}.ts` (guide-toggle + region-key labels; removed keys ×3) | tsc; preview re-measure: ≤5 blocks, ≤2 boxed depth, panel height logged; first-visit expand behavior (clear `gloki.welcomeHints`); hearts still allocate + cast re-fetches |
| 3 | M2 tail: measure other stage panels | read-only measure of problem/solutions/mandate engage panels | log block-count/depth per panel; fix only broken bars |
| 4 | D3 AppHeader restructure + rule | `AppHeader.tsx`, `AppHeader.module.scss` | tsc; preview: SuggestionDmView + CollaborationFullView title zone (rule, spacing, truncation), bar stays sticky, title scrolls |
| 5 | D3 adoption sweep | `HomeView.tsx`, `StageFeedView.tsx`, `identity/{Communities,JoinCommunity,AboutPage,ContactPage,Profile}.tsx`, `CreateCommunityPage.tsx`, `community/Currency.tsx` (h1→h2 ×3) + their SCSS | tsc; per-route: exactly 1 h1, eyebrow/title render, no double name; 360px |
| 6 | D4 Button md 44px + D5 icon sweep + ProblemVoteFlow squeeze | `Button.module.scss`, `MandateCard.tsx/scss`, `DiscussionPill`, source-chip sites, `ProblemVoteFlow.module.scss`, others from grep `size={1[0-5]}` | tsc; 360px walk HomeView/feed/onboarding/MandatePage both schemes; touch-target spot-checks |
| 7 | Full gates + before/after evidence | — | `npm run build`; grep-gates; parity; block-count eval before/after table; screenshots (strip, ballot, title zones) both schemes |
| 8 | Opus whole-branch review → fixes → Eston gate | — | 0 Critical / 0 Important; present screenshots + summary; wait for explicit push green light |
| 9 | Closeout | MASTER_TODO §7/§8, i18n packet, memory, `docs/session-prompts/session-20-w3-stage-feed-inline.md` | docs committed |

Deferred (do NOT pull in): W3 stage-feed inline expansion, W4 theme toggle + menu
LanguageSwitcher, m6 progress-bar kit extraction (Wave-1.5).
