# Session 3 kickoff — "Write together" community page (+ relocate the dormant co-authoring)

> Paste this into a fresh Claude Code session in the Communities2 repo (branch `ui`) to start Session 3 of the design-consistency + pipeline-redesign roadmap. Sessions 1 (design-system foundation) and 2 (problem card + discussion-as-chat + author DM) are shipped & deployed.

---

You're picking up **Session 3** of the 6-session "design-consistency + pipeline redesign" roadmap. Start by reading these for context (don't skip — they carry the locked decisions and the foundation you build on):

- Roadmap / master spec: `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (see §5 Session 3 + §6 dependencies)
- Session 1 plan (shipped): `docs/superpowers/plans/2026-06-25-session-1-design-system-consistency.md`
- Session 2 spec + plan (shipped): `docs/superpowers/specs/2026-06-26-problem-card-discussion-chat-design.md` and `docs/superpowers/plans/2026-06-26-session-2-problem-card-discussion-chat.md`
- `DESIGN_SYSTEM.md` (updated in S1) and `ARCHITECTURE.md`.

**This is creative UI work → begin with the `superpowers:brainstorming` skill.** Resolve the open questions below *with Eston* (one at a time, recommend-then-confirm; offer the visual companion the first time a layout question is genuinely clearer shown than told). Write a short spec, then `superpowers:writing-plans`, then execute with `superpowers:subagent-driven-development`. Do NOT start coding before Eston approves the design.

## What S1 + S2 gave you (reuse it — don't reinvent)
- **`UserIdentity`** (`src/components/shared/UserIdentity.tsx`) — `[flag] Name [verified-shield]`. Use it for every byline/author/co-author render.
- **`ThreadedDiscussion`** (`src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx`) — the plain threaded chat (post/reply/heart, Top/Newest, "Continue this thread →"). Props `{ contractId, communityId?, canParticipate, emptyHint? }`. Reuse if Write-Together drafts want discussion attached.
- Canonical `$stage-*` palette + the disciplined token set (colour = "stage" or "status" only).
- Shared kit: `Button`, `Card`, `Modal`, `Banner`, `Badge`, `EmptyState`, `InfoDisclosure`, `SearchableSelect`, `CountryMultiSelect`, `StageStrip` (`src/components/shared`). Prefer these.
- The community menu pattern: `CommunityView.tsx` `menuItems` (≈line 221) — Funds is registered as `{ key: 'currency', icon, label, onClick: navigate('/community/:id/currency') }`. Register Write-Together the same way.

## Session 3 goal (from the roadmap §5 + the S2 hand-off)
Build the **"Write together"** community feature: a self-contained page where members **co-author a problem or solution draft as a community and submit it to the feed** — and where the **co-authoring mechanic relocated from the discussion surface** finally lives. This is the move the roadmap fixed as **"S3 must precede the solution-card co-authoring removal in S4."**

1. **New community-menu entry + route.** Register a "Write together" item in `CommunityView.tsx` `menuItems` (like Funds), route `/community/:communityId/write-together`, opening a self-contained page.
2. **Draft → collaborate → submit.** Start a **problem or solution** draft, collaborate on it (the relocated co-authoring), and **submit it to the feed as a community** — including drafting **for other communities** (a target-community picker).
3. **Relocate the dormant co-authoring** (built in S2's discussion, left dormant for exactly this): the co-owned `Statement` + track-changes `EditSuggestion`s (1p1v fold-in) ± ranked `Position`s / `AnchoredThread` — decide how much to carry vs. simplify (see open questions). This is the new home; remove collaborative statement-writing from the cards (the problem-card half was already removed in S2; the solution-card half is S4's job — confirm the boundary).
4. **Solution→problem tagging.** *Proposed:* an in-app **dropdown of open problems** to tag a solution to its problem, **plus** an auto-generated **3-word code** (`brave-otter-river`) for word-of-mouth / cross-community sharing. *Finalize at this session's brainstorm.*

## Open design questions to resolve in the brainstorm (with my leanings)
- **How much of the co-authoring mechanic to carry.** The dormant pieces are the co-owned `Statement` + track-changes `EditSuggestion`s (1p1v fold-in) + ranked country-tagged `Position`s + `AnchoredThread` + the `ParticipationMeter`/`CoPresenceBar` ambience. S2 deliberately made *discussion* a plain chat, so the rich mechanic belongs here. **Lean: carry the co-owned `Statement` + track-changes edits (the actual "write together" value); reconsider whether ranked `Position`s + `AnchoredThread` are still needed or are redundant now that `ThreadedDiscussion` exists — and drop the 33%-style `ParticipationMeter` gate (S2 killed that framing). Confirm.**
- **Draft → feed submission model in the stub.** What does "submit to the feed as a community" do in the demo seam? **Lean: a submitted *problem* draft becomes a new Problem initiative in the target community's feed via the existing creation path (`deployContract` / the `proposeCandidateIssue` demo fn, currently dormant in `ProblemStage.demo.ts`); a submitted *solution* draft becomes a solution proposal tagged to its problem. "As a community" = authored by the community + the co-authors list.** Finalize the exact stub mechanics + which contract methods (named cleanly, documented for Ouri).
- **Solution→problem tagging: dropdown + 3-word code.** Confirm both: an in-app dropdown of the community's open problems, AND an auto-generated human-memorable 3-word code for cross-community word-of-mouth (paste a code → resolves the target problem). Decide the wordlist + how a pasted code resolves in the stub.
- **Cross-community drafting.** "Drafting for *other* communities" → a target-community picker on the Write-Together page. Confirm the picker (your communities + a way to reach others) and how the target is keyed in the stub.
- **Where co-authoring removal lands.** S2 removed it from the problem card (framing modal → DM). The roadmap says S3 removes "collaborative statement writing from the problem/solution cards." **Lean: S3 builds the new home; the *solution-card* co-authoring removal happens in S4 when that card is redesigned. Confirm the boundary so we don't half-redo S4.**
- **Page layout at 360px.** The Write-Together page (mode picker problem/solution, target-community picker, the co-authored draft editor, the submit affordance) needs a mobile-sane layout. Resolve in the brainstorm (use the visual companion for the editor + tagging UI).

## Current-state pointers (read during brainstorm)
- **The dormant co-authoring to relocate** (all still in the repo, S2 removed only their *usage*):
  - Components: `src/components/collaboration/flows/discussion/SharedStatement.tsx`, `PositionsBoard.tsx`, `AnchoredThread.tsx`, `ParticipationMeter.tsx`, `CoPresenceBar.tsx`, `useDiscussionData.ts`.
  - Demo contract: the co-authoring method group in `src/services/demo/demoContracts/discussion.ts` (`get_statement`/`get_edits`/`get_positions`/`get_anchored_comments` + `suggest_edit`/`support_edit`/`withdraw_edit_support`/`add_position`/`support_position`/`withdraw_position_support`/`add_anchored_comment`).
  - API: the co-authoring group in `src/components/collaboration/flows/discussion/discussionApi.ts` (`Statement`/`EditSuggestion`/`Position`/`AnchoredComment` + their getters/writers).
  - Seed: `DISCUSSION_SEED` (statement/edits/positions/anchored) + the `DELIBERATION_PARTICIPANTS`/`PRESENCE_NOW`/`PRESENCE_TICKER` presence fixtures in `src/services/demo/fixtures/deliberation.ts`; `initDiscussion` still writes the co-authoring seed.
  - `proposeCandidateIssue` in `src/components/stages/ProblemStage.demo.ts` (the "propose a new candidate/framing" demo fn, dormant — likely the submission hook).
- **Community shell + creation:** `src/pages/CommunityView.tsx` (`menuItems` + the nested `<Route>`s), `src/pages/CreateInitiativePage.tsx` (`/community/:id/create-initiative` → `deployContract`) — the model for "submit a draft → feed."
- **Funds page** (the most recent self-contained community page, the closest precedent for a new menu page) — see `project_funding_on_ui_jun2026` in memory and the `currency` route.

## S2 hand-off — fold these into S3 (you're already in this code)
Three non-blocking cleanups S2 deferred here because S3 touches the co-authoring code:
- **Trim `src/components/collaboration/flows/discussion/DiscussionFlow.module.scss`** — it's now ~375 lines of mostly-dead CSS (the S2 thin wrapper uses only `.container`/`.empty`/`.btnSubmit`).
- **The orphaned presence fixtures** (`DELIBERATION_PARTICIPANTS`/`PRESENCE_NOW`/`PRESENCE_TICKER`) — zero live consumers; they feed the dormant `CoPresenceBar`. Relocate them with `CoPresenceBar` if Write-Together uses presence, else delete.
- **`.liked` like-count AA** in `ThreadedDiscussion.module.scss` — the count rides `$error` (~3.95:1 on white); strict-AA would want `$error-dark`, but that regresses dark mode, so it needs a light/dark split if you touch it.

## Workflow + constraints (same discipline as S1/S2)
- **Branch `ui`, keep it runnable.** Stay behind the `src/services/api.ts` seam; never call a real server from a component. The demo seam emits **no `contract_write` events** → flows **re-fetch after writes** (the ConcernsFlow/funding pattern).
- New contract methods for the draft/submission/tagging flow: **name them cleanly and document them for Ouri** (ui method names must eventually match his real contract). The DM/discussion seams in S2 are the reference for documenting.
- **Tokens only**; reuse `UserIdentity` + `ThreadedDiscussion` + the kit; **360px flagship, verify light + dark.**
- **New user-facing strings ship at fr + sw key parity** (`src/i18n/fr.ts` + `src/i18n/sw.ts`; en is inline defaults). After adding, run a key-parity check (extract `'key':` lines, sort, diff fr vs sw — must be empty). Append new/reworded strings to `docs/i18n-native-review-candidates.md`.
- **Production build runs `tsc -b`** — `npm run build` must be clean before each commit. No test framework: verify via the build + the `preview_*` tools (dev server `gloki-dev`, port 5173) at 360px.
- If new demo data is seeded (e.g. a sample draft), **bump `DEMO_VERSION`** in `src/services/demo/mockApi.ts` so returning users re-seed (S2 went `global-v5→v6`; next is `v7`).
- Execute **subagent-driven** (fresh implementer per task — cheapest tier when the plan carries the full code, mid-tier for integration; per-task spec+quality review; an **Opus whole-branch review** at the end). Track progress in a ledger; for i18n parity + prune do your own grep cross-check (code-refs vs i18n presence) — S2 caught a near-over-prune that way.
- **Gate:** run the local multi-model review panel (`/code-review` → `local-review` skill) on the session diff — **do NOT pass `--quit-chrome`** (Eston wants Chrome left open; the heavy local Ollama models may RAM-skip, which is fine — note it; `GEMINI_API_KEY` from `.env` gives the gemini-flash architecture reviewer). Then **push `origin/ui`** to deploy (PR #20's ✗ vs `main` is expected divergence, not a build failure). Confirm the seed/demo-content + the deploy with Eston before pushing.
- Update project memory after the session (`project_consistency_pipeline_redesign_jun2026` + the `MEMORY.md` index line).

When ready, kick off with the brainstorming skill and the first open question (how much of the co-authoring mechanic to carry).
