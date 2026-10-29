# One `main` instead of `ui` + `server-side`: a plan (29 Oct 2026)

A proposal for Ouri and Eston to agree on. Nothing has been merged or pushed to `main`, `ui` or `server-side`.
Measured on 29 Oct at `ui` `1861b31`, `server-side` `0cbbf6e`, `main` `d28594a`.

## How far apart the branches are

**`ui` and `server-side`: close, and today is the cheapest day to join them.**

- Shared base: `5469cc4` (26 Oct, the S45 closeout). Since then `ui` has 7 commits and `server-side` 32.
- `ui`'s 7 commits are docs and CI only (the Pages workflow, `public/404.html`, the handoff, session notes). `ui`'s
  app code is still the 26 Oct base.
- `server-side`'s 32 are Ouri's real-node work: `api.ts` (+256), `eventStream.ts`, `verificationRegistry.ts`,
  `applicationSettings.ts`, `contractHosts.ts`, the community and initiative contracts, `communitiesSlice.ts`,
  `userSlice.ts`, onboarding and verification pages.
- Code diff between the two tips (`src`, `vite.config.ts`, `package.json`, `.env`, CI): **72 files, +4,216 / −1,045**.
  The full tree diff is 183 files, but about half of those are review screenshots under `docs/reviews/`.
- **Trial merge of `ui` into `server-side`: 2 conflicts, both docs** (`MASTER_TODO.md`, `docs/FOR_OURI_seam.md`).
  No code conflicts.

**`main`: far behind, with two commits of its own.**

- Last commit 5 May 2026. It is 777 commits behind `server-side` and 752 behind `ui`.
- Two Ouri commits exist only on `main`: `459e084` "fundraising with actual coins. there are still errors" and
  `d28594a` "flow is complete. time for QA" (53 files, collaboration flows and their contracts).
- **Trial merge of `server-side` into `main`: 34 conflicting files**, all in collaboration flows, their contracts,
  `App.tsx`, `api.ts` and `services/contracts/`.

## What "demo vs working version" is today

Two separate things are mixed together:

| | Feature set | Data |
|---|---|---|
| Site root (`server-side`, `build:prod`) | full | real nodes |
| `/demo/` (`ui`, `build:beta`) | beta trim | mock data |

- **Feature set is already a build switch:** `VITE_APP_MODE` in `src/appMode.ts` (`beta`, or anything else =
  `demo`, meaning the full page set). Same scripts on both branches.
- **Data source is only partly a switch; mostly it is which branch you build.** `ui` calls no real-node functions
  (0 `*OnChain` references in `src`). `server-side` calls them in 9 files (43 references). There is a start: on
  `server-side`, a contract whose id starts with `demo-` is routed to mock data (`isDemoContract`,
  `src/services/demo/demoRegistry.ts:34`, checked in `api.ts` and about ten components). But sign-up, the digital
  agent, community and initiative creation, and verification call the node directly.

So merging is easy. What takes work is making the data source a switch, so one codebase can still build the
mock-data demo. The `demo-` routing is the natural thing to build on.

## Proposed steps

1. **Merge `ui` into `server-side`** (resolving the 2 doc conflicts), as a PR that Ouri merges. Result:
   `server-side` plus the docs and CI changes from `ui`.
2. **Make that the new `main`.**
   - Recommended: keep today's `main` as `archive/main-2026-05` (as was done with `archive/blockchain-main`), then
     point `main` at the step-1 result. Ouri checks whether the May fundraising work (`459e084`, `d28594a`) was
     redone later. If parts are still wanted, they come back as one feature branch off the new `main`.
   - Alternative: merge into the old `main` and resolve the 34 conflicts. Only worth it if the May work is wanted
     as it is.
3. **Add the data-source switch on `main`:** for example `VITE_DATA_SOURCE=mock|node`, read in one module like
   `appMode.ts`. Services choose the mock or node implementation behind one interface, not in each page. The
   verification registry needs a mock implementation with the 30 demo personas and V ≥ 4: this is where Ouri's
   earlier `ui` stub request ends up. Rename the feature switch values to `full` and `beta` at the same time, since
   `demo` currently means "full page set", not "mock data".
4. **Switch Pages to one branch:** the workflow triggers on `main` only and builds twice from the same commit:
   root = full + node, `/demo/` = beta + mock (or whatever pairs you choose). Until step 3 is done, keep building
   `/demo/` from a frozen `ui`, because a `main` build would talk to real nodes.
5. **Set `main` as the default branch** (today it is `ui`), freeze `ui` and `server-side`, and archive them after a
   few weeks.
6. **From then on:** short feature branches off `main`, one PR each, merged back after each feature.

## Risks

- **The demo could start talking to real nodes.** If `/demo/` is built from `main` before the data-source switch
  exists, visitors to the demo would register on `gdi.gloki.contact`. Hence step 4's order.
- **Shared browser storage.** Both apps share localStorage keys (`user`, `gloki.*`) on one Pages origin, so a person
  who opens both can carry a mock session into the real app, or the reverse. Namespace the keys by data source when
  the switch is added.
- **Losing the May work.** If `main` is replaced, `459e084`/`d28594a` survive only on the archive branch. Ouri should
  say whether anything in them is still needed before step 2.
- **Deploy on push.** Pages deploys on every push to the deploy branch, so after step 4 every merge to `main` goes
  live. None of `main`, `ui` or `server-side` is protected today. Consider requiring a PR on `main`.
- **Open work on old branches.** Any branch cut from `ui` or `server-side` after the freeze has to be rebased onto
  `main`. The only open PR is #20 (`ui` → `main`, opened 1 June, now conflicting). Step 2 makes it redundant, so
  close it with a pointer to this plan.
- **Docs that name the branches.** 16 files under `.claude/skills/` refer to `ui` and `server-side` as the working
  and deploy branches, as do docs under `docs/`. They need updating in the same change as step 5.
