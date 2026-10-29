# Session 2 kickoff — Problem card + Discussion-as-chat (+ DM)

> Paste this into a fresh Claude Code session in the Communities2 repo (branch `ui`) to start Session 2 of the design-consistency + pipeline-redesign roadmap. Session 1 (design-system foundation) is shipped & deployed.

---

You're picking up **Session 2** of the 6-session "design-consistency + pipeline redesign" roadmap. Start by reading these for context (don't skip — they carry the locked decisions and the foundation you build on):

- Roadmap / master spec: `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md`
- Session 1 plan (the foundation now shipped): `docs/superpowers/plans/2026-06-25-session-1-design-system-consistency.md`
- `DESIGN_SYSTEM.md` (updated in S1) and `ARCHITECTURE.md`.

**This is creative UI work → begin with the `superpowers:brainstorming` skill.** Resolve the open questions below *with Eston* (one at a time, recommend-then-confirm), write a short spec, then `superpowers:writing-plans`, then execute with `superpowers:subagent-driven-development`. Do NOT start coding before Eston approves the design.

## What Session 1 gave you (reuse it — don't reinvent)
- Canonical `$stage-*` stage colours + the disciplined palette (colour = "stage" or "status" only).
- **`UserIdentity`** (`src/components/shared/UserIdentity.tsx`) — `[flag] Name [verified-shield]`. Use it for every byline/author render in S2.
- Shared kit: `Button`, `Card`, `Modal`, `Banner`, `Badge`, `InfoDisclosure`, `EmptyState`, etc. (`src/components/shared`). Prefer these.

## Session 2 goal (from Eston's 2026-06-25 feedback + the roadmap)
Make the **problem card** simple and unambiguous, and turn **discussion** into a plain threaded chat. Specifically:

1. **Problem card darker body** (`src/components/initiative/stages/ProblemEngage.tsx`, inside the `InitiativeStageCard` shell):
   - **Remove the box** around the "Is this a shared problem?" content (it's a card-in-a-card today).
   - **Reorder:** the "Is this a shared problem?" question first, then the **"Agreed by at least half your community"** threshold line *below* it (keep the upvote/downvote + the threshold indicator — that's the real "shared problem" vote).
   - **Two clear CTA buttons** (replace today's text-link CTAs "Discuss this" + "Propose a different framing"):
     - **Discuss this problem** → opens a **simple Reddit-style threaded chat** (posts + replies, infinite nesting, a heart/like on each). NOT a gate — just conversation.
     - **Send suggestion to author** → opens a **DM** (1:1 chat) with the problem's author.
2. **Discussion stage = the simple threaded chat.** Retire the heavy co-authoring UI (`SharedStatement` / ranked positions / the 33% `ParticipationMeter` gate) **from the discussion surface**, and **reconcile the contradictory copy**: the problem card says a problem just needs to be voted a shared problem, but the discussion page currently implies an engagement-metric gate — kill that gate; the chat is not a threshold.
3. **Expand-in-place:** problem cards should expand on the stage feed, not route away to the community/initiative page (audit `InitiativeStageCard` open behaviour; make it consistent).

## Open design questions to resolve in the brainstorm (with my leanings)
- **Sequencing of the co-authoring code.** Discussion currently *is* the co-authoring mechanic; the roadmap **relocates co-authoring to a new "Write together" community page in Session 3**, and removes collaborative writing from the problem/solution cards there. So in **S2, swap the discussion surface to the threaded chat but do NOT delete `SharedStatement` / the co-authoring contract yet** — leave it dormant for S3 to relocate. (Confirm with Eston; the alternative is to build Write-Together first.)
- **Chat backing.** Reuse the existing chat infra (`src/components/community/chat/ChatTopic.tsx` / `ChatTopicList` + its demo contract) for both the threaded discussion and the author DM, rather than a new mechanic? (Likely yes — recommend reuse.) Decide how a "DM with the author" is keyed (author pubkey + problem id) in the demo seam.
- **Heart semantics.** Are hearts on discussion posts purely a social like (no effect on advancement)? (Recommend: yes, social only — keep discussion ungated.)
- **"Propose a different framing" → "Send suggestion to author".** Confirm the old framing-proposal entry point is fully replaced by the DM suggestion (and that any framing/co-authoring lives in Write Together from S3).
- **Threaded chat at 360px.** Infinite nesting needs a mobile-sane indent/wrap strategy (cap visual indent, "continue thread" affordance). Resolve the UX in the brainstorm (consider the visual companion for layout).

## Current-state pointers (read during brainstorm)
- Problem card body: `src/components/initiative/stages/ProblemEngage.tsx`; shell `src/components/initiative/InitiativeStageCard.tsx`; community variant `src/components/community/ProblemActivityCard.tsx`.
- Problem vote tally: `src/services/demo/demoContracts/problemVote.ts`.
- Discussion (to simplify): `src/components/collaboration/flows/discussion/DiscussionFlow.tsx`, `SharedStatement.tsx`, `ParticipationMeter.tsx`; `src/components/initiative/stages/DiscussionEngage.tsx`; `DiscussionStageView`; demo `src/services/demo/demoContracts/discussion.ts`.
- Chat infra to reuse: `src/components/community/chat/ChatTopic.tsx`, `ChatTopicList`, + its demo contract.

## Workflow + constraints (same discipline as Session 1)
- **Branch `ui`, keep it runnable.** Stay behind the `src/services/api.ts` seam; never call a real server from a component. The demo seam emits **no `contract_write` events** → flows must **re-fetch after writes** (the ConcernsFlow/funding pattern).
- If S2 needs new contract methods (chat/DM in the stub), name them cleanly and **document them for Ouri** (ui method names must eventually match his real contract).
- **Tokens only**; reuse `UserIdentity` + the kit; 360px flagship, verify **light + dark**.
- **New user-facing strings ship at fr + sw key parity** (`src/i18n/`).
- **Production build runs `tsc -b`** — `npm run build` must be clean before each commit. No test framework: verify via the build + the `preview_*` tools (dev server `gloki-dev`, port 5173).
- Execute **subagent-driven** (fresh implementer per task/group + per-task review + an Opus whole-branch review at the end).
- **Gate:** run the local multi-model review panel (`/code-review` → `local-review` skill) on the session diff — **do NOT pass `--quit-chrome`** (Eston wants Chrome left open; the heavy local models may RAM-skip, which is fine — note it). Then **push `origin/ui`** to deploy (PR #20's ✗ vs `main` is expected divergence, not a build failure).
- Update project memory after the session.

When ready, kick off with the brainstorming skill and the first open question.
