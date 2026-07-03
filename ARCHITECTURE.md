# Architecture

Companion to [CLAUDE.md](./CLAUDE.md) — the app's structure, flows, learnings, and known
limitations. (CLAUDE.md holds the stack, branch model, key patterns, routing, and deployment;
the design system is [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).)

## App Structure

**Navigation**: Global footer (`StageFooter.tsx`) — fixed bottom "Browse by stage" bar with the **4 browseable stage icons** (Problem, Solutions, Vote, Mandate), navigates to `/stage/:stageId`, appears on all authenticated pages. **Discussion is a function, not a pipeline step** (S16): it has no stage feed; each initiative carries a persistent Discussion button (`DiscussionPill`) beside its 4-stage strip, reachable at every stage. `HomepageMenu` (slide-out) provides access to Profile, Communities, Join, Create, About, Contact.

**Stage Feed Mini-Apps** (`StageFeedView.tsx`): Per-stage browse surfaces behind the footer (the app lands on **HomeView at `/`**; first-run users redirect to `/welcome`). Each stage is a purpose-built participation interface. Problem: inline up/down voting with optimistic UI + threshold bars. Proposals ("Solutions" in the UI): inline `ApprovalFlow` with approve/withdraw per card. Vote: inline `QVFlow` with credit allocation per card. Mandate: inline `ConvictionStaking` with conviction staking per card. Sample data shown as empty-state fallback only.

**Community** (`CommunityView.tsx`): Dark header with name, description, member count. No inline tab bar — all navigation through slide-out hamburger menu (Home, Create Initiative, Collab, Chat, Currency, Members, Identity & Trust, Share, Invite, Leave). Default view is the activity feed with "Community Activity" section header showing initiatives with stage badges.

**Initiative Dashboard** (`InitiativeDashboard.tsx`): Full 5-stage overview when clicking an initiative. Progress bar (green=completed, blue=active, grey=locked). Vertically stacked stage cards:
- Completed stages: metrics summary, "Completed" badge
- Active voting stages (Problem, Proposals, Vote, Mandate): interactive flows rendered inline
- Active Discussion: summary + "Join Discussion" button → dedicated `DiscussionStageView`
- Locked stages: greyed out, "Awaiting earlier stages"
- Advance bar at bottom with threshold checks and confirm/cancel
- All stage flows use shared contracts via `parentContractId={collaborationId}`
- `ConvictionStaking` flow for mandate stage: time-weighted staking with duration multipliers (1w=1x to 1y=12x), country breakdown

**Identity** (`IdentityView.tsx`): At `/identity/*`, default `/identity/communities`. Communities list with "Your Communities" title/description, single-column cards with description, member count (Users icon), mandate count (ScrollText icon), star/hide controls (high-contrast buttons), and "Create a community" dashed card linking to `/create-community`. Profile page with identity info hints. Join page with tutorial text. About, Contact pages.

**Create Initiative** (`CreateInitiativePage.tsx`): Full onboarding page at `/community/:communityId/create-initiative`. Educates users with "What is an Initiative?", 5-stage stepper, tips, then form (title, description, evidence URLs, countries). Replaces the old `CreateInitiativeDialog` modal.

**Create Community** (`CreateCommunityPage.tsx`): Full onboarding page at `/create-community`. Explains communities, features, then form (name, description). Replaces the old `CreateCommunityDialog` modal.

**Identity & Trust** (`IdentityTrust.tsx`): Dedicated page at `/community/:communityId/identity`. QR-based identity verification, ID cards, sharing. Extracted from Members page.

**Collab**: Template-based workspaces via `CollaborationPage`. Navigates from community collab tab to `/community/:communityId/collab/:collabId`. Templates in `collabTemplates.ts`. Per-user contracts.

**Chat**: `ChatTopicList` + `ChatTopic` in `community/chat/`. On-chain via `chat_contract.py` using `useFlowContract` shared mode (`stageKey='chatContractId'`). Topics and messages persist across sessions and sync across community members. Light polling (10s list, 5s topic view) for liveness. Optimistic send with rollback. `ActivityHub` preview card reads the chat contract read-only — it does not auto-deploy.

**Currency**: Balance display, send payment, median-voted mint/burn preferences. Explainer card at top. Single-column card layout.

## Flows

**Blockchain-backed** (contract methods match Python ↔ TypeScript):
1. **ProblemVoteFlow** — upvote/downvote with tally + threshold progress bar
2. **DiscussionFlow** — threaded comments, participation threshold. Contract: `discussion_contract.py` (shared via community `stage_contracts`).
3. **ApprovalFlow** — proposals + approve/withdraw + country-segmented results
4. **QVFlow** — proposals + credit allocation + sqrt voting + results
5. **ConvictionStaking** — time-weighted conviction staking for mandates, country breakdown. Contract: `conviction_contract.py`.
6. **ConcernsFlow** — raise concerns, propose resolutions, author resolves (removed from pipeline UI, component retained). Contract: `concerns_contract.py` (timestamp-keyed, no counters).
7. **ModificationSuggestions** — suggest changes to title/description, community votes, original author accept/reject. Used in Discussion (Stage 2) and Proposals (Stage 3). Contract: `modification_contract.py`.
8. **Chat** — community topics + messages. Contract: `chat_contract.py` (shared via community `stage_contracts`). See Chat under App Structure.

**Local (in-memory)**: Document, Q&A, Roles, Scheduling, Taskboard — keyed by `instanceId` (next targets for on-chain migration)

**AI Tools** (`components/shared/AITools.tsx`): `TranslateButton` (12 languages via OpenAI API), `SummaryButton` (discussion summarizer), `AIToolbar` (combined). Requires OpenAI API key in user profile. Shows key hint icon if no key set. Service layer in `services/ai.ts`.

**Shared UI**: `EarthFlag` (`components/shared/EarthFlag.tsx`) — International Flag of Planet Earth SVG (flower of life pattern), used in `PageHeader` as logo.

## Architecture Learnings

- **Flow components are reusable across contexts**: `ApprovalFlow`, `QVFlow`, `ProblemVoteFlow`, and `ConvictionStaking` work both in the Initiative Dashboard (expanded) and in StageFeedView cards (compact). The `compact` prop on `ConvictionStaking` controls density. Other flows adapt naturally.
- **Shared contract mode is the standard for initiative flows**: All initiative stage flows use `parentContractId={collaborationId}` + `stageKey` to share one contract per stage across all community members. Per-user mode is only for Collab workspaces.
- **Community-hosted sub-contracts**: `community_contract.py` exposes generic `register_stage_contract(stage_key, contract_id, address, agent)` + `get_stage_contract(stage_key)` so communities host arbitrary sub-contracts without needing the community contract to know about them in advance. Used by Chat and (from initiative parents) Discussion. No allowlist — any `stage_key` is accepted.
- **Read-only sub-contract access**: `resolveInitiativeStageContract` (in `services/contracts/initiative.ts`) is generic despite the name — it calls `get_stage_contract` on any parent. Use it when you want to *read* a sub-contract without triggering the full `useFlowContract` deploy path (e.g., `ActivityHub` chat preview).
- **Gloki contracts re-run `__init__` on every invocation AND disallow writes during read calls**: never do `if not self.counter.exists(): self.counter['x'] = 0` in `__init__` — it will 500 on the first read. Prefer `timestamp()`-keyed IDs over counters (pattern: `discussion_contract.py`, `chat_contract.py`, `concerns_contract.py`).
- **`deployContract` return value handling**: Returns either `{ id: string }` object or a plain string. Pattern: `const id = (response as { id?: string }).id || (response as string)`.
- **Optimistic UI pattern**: Snapshot state before async write, update UI immediately, rollback on error. Used in ProblemVoteFlow, StageFeedView inline voting, and ChatTopic message send.
- **Route sub-views via pathname check**: `InitiativeView` checks `location.pathname.endsWith('/discussion')` to render `DiscussionStageView` vs `InitiativeDashboard` — no extra route entries needed since the parent route uses `/*` wildcard.

## Known Limitations

- **Collab contracts are per-user** — need shared mode (like Pipeline) to be truly collaborative
- **Collab Document / Taskboard / Q&A / Roles / Scheduling** — still in-memory; ephemeral on refresh, not shared across users. Migrate to on-chain using the Chat/Discussion template (`useFlowContract` shared mode + stage_contracts registration).
- **Completed stage metrics** — Initiative Dashboard only shows problem tally for completed stages; discussion/proposals/vote completed summaries not yet fetched
- **Test data seeding** — auto-seeds 5 initiatives in communities with "test" in name on first load
- **Top 3 carry-over** from Proposals → Vote not yet implemented
- **Old communities can't host Chat/Discussion sub-contracts** — any community deployed before `register_stage_contract` was added silently no-ops. The `useFlowContract` shared mode shows the "feature isn't available on this community" error card in those cases. Fresh communities work.
- **`chat_contract.get_messages` is O(N)** — scans all messages, filters in Python. Fine at community-scale; add a per-topic index if it bites.
- **Activity/quorum thresholds use raw member count** — current 67% / 33% thresholds operate on total community members, not "active" members. No last-seen tracking yet.
- **Modification Suggestions author-decide**: `originalAuthor` prop not yet wired — author accept/reject buttons won't show until initiative contract stores author in details
