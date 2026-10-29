# Wave 1.5 — Utils & Types Consolidation  (parallel)

**When:** anytime after Wave 1 lanes A/B/C/F have merged to `ui`. Runs parallel to the design-system lane.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-wave-1.5-utils-and-types-consolidation -b wave-1.5/utils-and-types-consolidation ui
```
Open a fresh Claude Code session **in `../gloki-wave-1.5-utils-and-types-consolidation`** and paste everything below.

---

You are the **Wave 1.5 (Utils & Types Consolidation)** session for the Gloki UI reform. This is a
**UI-only mockup** — no backend, all data via `src/services/demo/`, no `?raw` Python imports.

**Read first:** `MASTER_TODO.md` §1 (north-star principles), §3 (design philosophy), §4 (parallel-session
rules); `docs/LANES.md`; and skim `CLAUDE.md` for the existing patterns (`useFlowContract`, optimistic UI).

**Mission context:** Five `formatTime` copies. Two `buildTree` copies. Three `initials` copies. Three
`InitiativeDetails` copies. Two `Tally` copies. These are silent maintenance taxes — a typo fix in one
copy doesn't propagate, and reviewers can't trust that "this is the only one." One sweep eliminates
~300 lines of duplication and gives the codebase a single source of truth for formatters, builders, and
shared types. No behavior change — pure consolidation.

**You may ONLY edit these paths:**
- `src/utils/dateFormatters.ts`, `src/utils/treeBuilders.ts`, `src/utils/textFormatters.ts`,
  `src/utils/authorFormatting.ts`, `src/utils/avatars.ts`, `src/utils/stageMetadata.ts`
- `src/types/voting.ts`, `src/types/initiative.ts`
- `src/hooks/usePrefersReducedMotion.ts`
- `src/components/shared/connectivity/useDataSaver.ts` (add SSR-safety note)
- `src/components/community/CommunityHome.tsx`
- `src/components/community/chat/ChatTopic.tsx`, `src/components/community/chat/ChatTopicList.tsx`
- `src/components/collaboration/flows/discussion/DiscussionFlow.tsx`,
  `…/DeliberationThread.tsx`, `…/CoPresenceBar.tsx`
- `src/components/collaboration/flows/modifications/ModificationSuggestions.tsx`
- `src/components/initiative/Roadmap.tsx`
- `src/components/shared/RoleDisplay.tsx`, `src/components/shared/connectivity/SmartImage.tsx`
- `src/pages/StageFeedView.tsx`
- `src/services/demo/fixtures/deliberation.ts`
- `src/store/slices/initiativeSlice.ts`, `src/store/slices/communitiesSlice.ts`

If you need anything outside these, append a request to **MASTER_TODO §10 (Coordination log)** — do
**not** edit shared files or other lanes' files.

**Tasks:**
1. Create `src/utils/dateFormatters.ts` (`formatTime`, `formatTimeAgo`); import in CommunityHome,
   ChatTopic, ChatTopicList, DiscussionFlow, StageFeedView. Delete the five private copies.
2. Create `src/utils/treeBuilders.ts` (`buildTree`); import in DeliberationThread and DiscussionFlow.
3. Create `src/utils/textFormatters.ts` (`initials`); import in RoleDisplay, SmartImage, deliberation fixture.
4. Create `src/utils/authorFormatting.ts` (`getAuthorName`); import in Roadmap and ModificationSuggestions.
5. Create `src/utils/stageMetadata.ts` — move `STAGE_META` out of CommunityHome.
6. Create `src/types/voting.ts` (`Tally`) and `src/types/initiative.ts` (`InitiativeDetails`); re-export
   from `initiativeSlice` so existing imports keep working. Delete the three/two duplicate definitions.
7. Replace `Record<string, any>` in `communitiesSlice` with a `CommunityProperties` interface.
8. Extract `usePrefersReducedMotion` from CoPresenceBar to `src/hooks/usePrefersReducedMotion.ts`.
9. Split `deliberation.ts` fixture into `deliberation.comments.ts` / `…proposals.ts` / `…adopters.ts`;
   keep `deliberation.ts` as a barrel re-export so callers don't break.
10. Add type guards for `unknown[]` casts in `demoContracts/initiative.ts` (read-only — flag if it's
    outside owned paths and add to coordination log).
11. Add an SSR-safety note (single-line `// note:`) at the top of `useDataSaver.ts`.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- `git grep -n "const formatTime"` returns one definition (in `src/utils/dateFormatters.ts`); same for
  `buildTree`, `initials`, `getAuthorName`, `Tally`, `InitiativeDetails`.
- Walk the touched routes in the preview (`mcp__Claude_Preview__*`): community home, a chat topic, a
  discussion thread, the stage feed — no console errors, no visual regressions.
- Commit, push `wave-1.5/utils-and-types-consolidation`, open a PR into `ui`. Report what changed and
  the duplicate-line count delta.

**House rules:** hardcoded UI only · every user-facing string via the i18n scaffold · design tokens &
shared components only · **simplicity beats cleverness** — pure consolidation, no behavior change · stay
strictly within owned paths.
