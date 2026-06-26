# Session 2 — Problem card + Discussion-as-chat (+ author DM) — Design Spec

**Date:** 2026-06-26
**Branch:** `ui` (UI-only stub layer; no backend)
**Roadmap:** `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` (§5 Session 2)
**Builds on:** Session 1 (shipped) — canonical `$stage-*` palette, `UserIdentity`, the shared kit (`Button`/`Card`/`Modal`/`Banner`/`Badge`/`EmptyState`).
**Status:** Design approved-in-principle (six brainstorm decisions + two surface choices locked, below). This spec → `writing-plans` → `subagent-driven-development`.

---

## 1. Goal

Make the **problem card** simple and unambiguous, and turn **discussion** into a plain
threaded chat. Two user-facing wins:

1. The problem card's darker body stops being a card-in-a-card, reads top-to-bottom, and offers
   two clear actions: **discuss the problem** (a conversation) and **send a suggestion to the
   author** (a private message).
2. The Discussion stage stops being a heavy co-authoring mechanic with a confusing "33% to
   advance" gate, and becomes a simple, ungated, Reddit-style threaded chat. A problem advances
   **only** by being voted a shared problem (the existing 50% "second"); the chat is conversation,
   never a threshold.

## 2. Locked decisions (from the brainstorm)

1. **Sequencing:** keep S2 → S3. Swap Discussion to the threaded chat now; leave the co-authoring
   code (`SharedStatement`/`PositionsBoard`/`AnchoredThread`/`ParticipationMeter` + the
   co-authoring contract methods) **dormant** for S3 to relocate. Remove only its *usage*.
2. **Chat backing:** the threaded discussion reuses the **existing threaded-comment mechanic** on
   the per-initiative discussion sub-contract (`add_comment`/`get_comments`/`delete_comment`,
   already nesting via `parentId`); the author DM reuses the **flat `chat` mechanic** (`chatApi` +
   the `chat` demo contract).
3. **Hearts:** a 1-person-1-vote like on each post (new `like_comment` toggle). Hearts also
   **surface "top" replies** — siblings sort by likes (default), with a **Top / Newest** toggle.
   No effect on advancement.
4. **Categories:** **stripped** — the threaded chat is plain post → reply → heart. No category
   selector, filter bar, or progress strip. Orphaned category strings pruned from i18n.
5. **Framing CTA:** "Propose a different framing" is **fully replaced** by "Send suggestion to
   author" (a DM). Raising a brand-new problem still lives in "Start an initiative"; the
   `ProposeIssueModal` UI is removed from the card.
6. **Nesting at 360px (option A):** progressive indent to a depth cap, then deeper replies collapse
   behind **"Continue this thread (N) →"**, which re-roots the view at that comment with a "← Back
   to full discussion" crumb. Pure local state — no new route.

Two surface choices:

- **DM surface = full page** (own route under the initiative), not a modal.
- **Collab-menu Discussion flow shares the new component** — one threaded UI everywhere (the
  collab `DiscussionFlow` drops its category UI too).

## 3. Current-state grounding (what exists today)

- **Problem card body** = `ProblemEngage` (inside `InitiativeStageCard`'s shaded Engage panel):
  a plain `thresholdHint` line **above** `ProblemVoteFlow`, then two text-link actions ("Discuss
  this" / "Propose a different framing") + the `ProposeIssueModal`.
- `ProblemVoteFlow` renders, inside a **boxed `.votingSection`**: the heading
  **"Is this a shared problem?"** → up/down "Second it / Not for me" vote → threshold progress bar
  → "you seconded" line. The 50% rule (`tally.up / members >= 0.5`) is unchanged and correct.
- **Discussion stage** = `DiscussionStageView` (route `/initiative/.../discussion`, rendered by
  `InitiativeView`) renders the **heavy co-authoring**: `CoPresenceBar` + `ParticipationMeter`
  (the "33% needed to advance" gate) + `SharedStatement` + `PositionsBoard` + `AnchoredThread`.
- A **separate threaded mechanic already exists**: `DiscussionFlow` (collab-menu flow, registry
  id `discussion`, group "Teamwork") renders recursive nested comments with **categories**
  (Evidence/Impact/Ideas/Concerns), a filter bar, and a progress strip — backed by the same
  discussion contract's comment group.
- **Demo contract** `discussion.ts`: the comment group (`add_comment`/`get_comments`/
  `delete_comment`, comment has `parentId`, no likes) is explicitly "legacy/untouched"; the
  co-authoring group is separate. **Flat chat** `chat.ts`: `get_topics`/`create_topic`/
  `get_messages`/`add_message` (a message has `topicId`; `get_messages(topic_id)` filters).
- `proposeCandidateIssue` (the framing template's write) is called **only** from
  `ProblemEngage`'s modal. New problems also come from **"Start an initiative"**
  (`CreateInitiativePage`).

## 4. The design

### 4.1 Problem card body — `ProblemEngage` + `ProblemVoteFlow`

**De-box.** Remove the card chrome (border / surface background / card padding) from
`ProblemVoteFlow`'s `.votingSection`/`.container` so the vote sits **flush** in the
`InitiativeStageCard` shaded panel — no card-in-a-card. Keep the heading, the vote buttons, the
threshold bar, and the "you seconded" line.

**Reorder** the Engage panel, top → bottom:
1. "Is this a shared problem?" heading + up/down vote + threshold bar (i.e. `ProblemVoteFlow`).
2. The plain-language **"Agreed by at least half of your community."** line — moved to sit
   **below** the vote (today `thresholdHint` is above it).
3. **Two CTA buttons** (shared `<Button variant="secondary">`, ≥44px, wrap at 360px):
   - **"Discuss this problem"** → navigates to the discussion thread (`/initiative/.../discussion`).
   - **"Send suggestion to author"** → navigates to the DM page (`/initiative/.../suggest`),
     passing the author via nav state.

**Remove** from `ProblemEngage`: the two `.textAction` links, the `ProposeIssueModal` +
`ProposeIssueModalProps` + its imports (`SearchableSelect`, `SDG_OPTIONS`, `COUNTRIES`,
`proposeCandidateIssue`, `sanitizeExternalUrl`, the framing form). `proposeCandidateIssue` stays
defined in `ProblemStage.demo.ts` with a "reserved for Write Together (S3)" comment (dormant, like
the co-authoring methods) so nothing is deleted prematurely.

> No content/data changes to the vote itself — only layout (de-box + reorder) and the CTA swap.

### 4.2 `ThreadedDiscussion` — the shared plain threaded chat (new)

One new component, the single threaded-chat UI used by **both** the Discussion stage and the
collab-menu flow.

- **File:** `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` (+ `.module.scss`).
- **Props:** `{ contractId: string; canParticipate: boolean; emptyHint?: string }`. One
  responsibility: render the comment thread for a given discussion contract. Contract resolution
  (`useFlowContract`) stays in the callers, so this component is pure-ish and testable in isolation.
- **Reads/writes** via `discussionApi`: `getComments` (extended with likes — §4.5) and the new
  `likeComment`, plus the existing `addComment` (top-level + reply) and `deleteComment`. **Re-fetch
  after every write** (the demo seam emits no events).
- **Rendering:**
  - Top composer ("Add to the discussion…") for a root comment; inline reply composer per node
    (reuse today's `ComposeBox` shape, minus the category selector).
  - Recursive `CommentNode`: author via **`UserIdentity`** (flag + name + verified shield —
    country from `profiles[author].country`), relative time, text, and a footer with the **heart**
    (toggle + count) and **Reply**; **Delete** on own comments. (Replaces today's avatar-initial +
    `CountryBadge` byline.)
  - **Hearts:** `likedByMe` filled/active state; tap toggles `likeComment` (1p1v) and re-fetches.
  - **Sort toggle** at the top: **Top** (siblings by `likeCount` desc, then `timestamp` asc) /
    **Newest** (siblings by `timestamp` desc). The chosen comparator applies at **every** nesting
    level. Default **Top**.
  - **Nesting (option A):** indent each level up to `DEPTH_CAP = 3` (tunable). At the cap, a node
    with children renders **"Continue this thread (N) →"** instead of its descendants. Tapping sets
    local `focusRootId` and re-renders the subtree rooted there (indent reset) with a **"← Back to
    full discussion"** crumb. State only; no route. At 360px the indent step + thread line follow
    the option-A mock (≈14px/level, thread line, text never crushed).
- **Empty state:** `EmptyState` (compact where embedded) with `emptyHint` ("Start the conversation
  about this problem.").
- **No** category selector / filter bar / progress strip / participation meter anywhere.

**Derivation:** lift `buildTree`, the recursive node, and `ComposeBox` from today's
`DiscussionFlow`; drop categories, add hearts + sort + continue-thread.

### 4.3 Discussion stage — `DiscussionStageView` + `DiscussionEngage` + collab `DiscussionFlow`

- **`DiscussionStageView`:** replace `CoPresenceBar` + `ParticipationMeter` + `SharedStatement` +
  `PositionsBoard` + `AnchoredThread` with a single `<ThreadedDiscussion contractId={contractId}
  canParticipate={canParticipate} emptyHint=… />`. Keep `AppHeader` (eyebrow "Discussion"),
  loading/error states, and the member/properties fetch. Update copy: "Setting up the co-authoring
  space…" → "Setting up the discussion…"; remove the 33%/participation strings here.
- **`DiscussionEngage`** (the stage card's Engage preview): simplify to a light teaser — **"N
  comments · M people"** from the existing **`get_summary`** read (already returns
  `{ participants, commentCount }`) + the existing empty state. **Remove** `ParticipationMeter`,
  `CoPresenceBar`, and the co-authoring `useDiscussionData` usage. The open-button label is set in
  **`community/DiscussionActivityCard.tsx:99`** via key **`deliberation.discussion.open`** — flip
  its value "Open the co-authoring space" → **"Open the discussion."**
- **Collab `DiscussionFlow`** (registry flow): refactor to resolve its contract via the existing
  `useFlowContract` and render `<ThreadedDiscussion … />`, dropping its own category UI. It becomes
  a thin wrapper (keeps `FlowProps` + the loading/error chrome it already has). Registry entry
  unchanged.

### 4.4 Author DM — `SuggestionDmView` (new, full page)

- **Route:** add `/initiative/:host/:agent/:communityId/:initiativeId/suggest` in `InitiativeView`
  (sibling of the `/discussion` branch), rendering `SuggestionDmView`. `ProblemEngage` navigates
  there with `state: { authorKey, authorName }`.
- **File:** `src/components/collaboration/SuggestionDmView.tsx` (+ `.module.scss`).
- **Backing:** reuse `chatApi` (`getMessages`/`addMessage`) against a **per-pair chat contract**
  via `useFlowContract` per-user mode: instance `dm-${initiativeId}` (per-user → unique per
  requester; the author is the single initiative author). A **constant `topicId = 'dm'`** — no
  topic record needed (`add_message`/`get_messages` only need the id string). **Zero new contract
  code.**
- **UI:** `AppHeader` (back; eyebrow "Suggestion"; title = the author via `UserIdentity`), a flat
  message stream (own vs author bubbles, like `ChatTopic`), and a composer. Re-fetch after send
  (optimistic append + rollback, mirroring `ChatTopic`). Poll is optional (single-user demo).
- **Empty state:** "Your suggestion goes privately to {author}." **Demo note:** one-way in the
  single-user demo (the author is a seeded persona and won't reply). *Optional nicety:* a one-time
  seeded author acknowledgement written at first open via a `writeState` seed helper (defer-able).
- **Out of scope:** no DM inbox/list — the DM is reached only from the problem card this session.

### 4.5 Data-layer / seam changes (documented for Ouri)

All behind `src/services/api.ts`; UI never calls a server directly. New method names are chosen to
match an eventual real contract and are listed for Ouri.

- **`discussion.ts` (demo) + `discussionApi.ts`:**
  - Extend the comment shape with `likes: string[]` (1p1v pubkey list).
  - **New write `like_comment`** — `values: { comment_id }` — toggles the caller in `likes`
    (add if absent, remove if present), dedup. Returns the updated comment. *(The single genuinely
    new contract method this session — document for Ouri.)*
  - `get_comments` returns `likes`; `discussionApi.normalizeComment` adds `likes: string[]`,
    `likeCount: number`, and derives `likedByMe` client-side from the current `publicKey`.
  - `addComment`/`deleteComment` unchanged.
- **DM:** **no new contract** — reuse the `chat` contract + `chatApi` with constant topic `'dm'`,
  keyed by the `dm-${initiativeId}` per-user contract. **For Ouri:** the real DM is a 1:1 message
  contract keyed by the unordered `{author, requester}` pair; the stub approximates it with a
  per-requester chat contract scoped to the initiative.
- **Dormant (not deleted):** the co-authoring methods in `discussion.ts`
  (`suggest_edit`/`support_edit`/…/`add_anchored_comment`) + `proposeCandidateIssue` stay, with a
  "reserved for Write Together (S3)" comment.

### 4.6 Expand-in-place audit

`InitiativeStageCard` already expands in place (collapse ⇄ expand reveals the Engage panel);
`ProblemActivityCard` passes no `onOpen` (card-only). Audit Home/`StageFeedView` problem-card taps
to confirm they **expand** rather than route to the community/initiative page; fix any that route
away. The "Discuss this problem" / "Send suggestion to author" buttons are deliberate actions to
their own surfaces — consistent with the principle (today's "Discuss this" already routes to
`/discussion`).

## 5. Component inventory (delta)

**New**
- `collaboration/flows/discussion/ThreadedDiscussion.tsx` + `.module.scss` — the plain threaded
  chat (hearts, Top/Newest, continue-thread). One responsibility: render a discussion contract's
  thread.
- `collaboration/SuggestionDmView.tsx` + `.module.scss` — the full-page author DM (reuses
  `chatApi`).

**Modified**
- `initiative/stages/ProblemEngage.tsx` (+ `.module.scss`) — de-box reorder; two `<Button>` CTAs;
  remove the framing modal + text-actions.
- `collaboration/flows/voting/ProblemVoteFlow.module.scss` — remove the `.votingSection` card chrome.
- `collaboration/DiscussionStageView.tsx` — swap co-authoring → `ThreadedDiscussion`; drop the
  33% meter / co-presence; copy.
- `initiative/stages/DiscussionEngage.tsx` (+ `.module.scss`) — light comment-count teaser; remove
  meter/co-presence.
- `collaboration/flows/discussion/DiscussionFlow.tsx` — thin wrapper rendering `ThreadedDiscussion`.
- `collaboration/flows/discussion/discussionApi.ts` — `likes`/`likeCount`/`likedByMe` + `likeComment`.
- `services/demo/demoContracts/discussion.ts` — `likes` on comments + `like_comment`.
- `pages/collaboration/InitiativeView.tsx` — add the `/suggest` route.
- `community/DiscussionActivityCard.tsx` — `deliberation.discussion.open` value "co-authoring
  space" → "discussion."
- `services/demo/.../ProblemStage.demo.ts` — dormancy comment on `proposeCandidateIssue`.

**Dormant (untouched, marked reserved for S3):** `SharedStatement`, `PositionsBoard`,
`AnchoredThread`, `ParticipationMeter`, `CoPresenceBar`, the co-authoring `discussionApi`/contract
methods, `useDiscussionData` (if no longer read after the teaser change, leave with a comment).

## 6. i18n (fr + sw parity)

- **New keys** (en + fr + sw): `card.discussProblem` ("Discuss this problem"),
  `card.suggestToAuthor` ("Send suggestion to author"); `deliberation.thread.*`
  (`addPlaceholder`, `sortTop`, `sortNewest`, `continueThread` ("Continue this thread ({n}) →"),
  `backToFull`, `like` aria, `empty`); `suggest.*` (eyebrow/title/placeholder/empty/sent).
- **Reworded (not new, not orphaned) — update en + fr + sw values together:**
  `deliberation.discussion.open` ("…co-authoring space" → "…discussion") and
  `deliberation.settingUp` ("Setting up the co-authoring space…" → "Setting up the discussion…").
- **Prune** the now-orphaned keys: the discussion **category** family
  (`discussionFlow.category.*`, filter/progress labels) and the **participation-meter / 33%**
  strings (`deliberation.meter.*`) — only those with zero remaining references after the swap.
  Keep `deliberation.empty.*` (reused). Run a reference check before deleting; hold fr/sw parity.

## 7. Out of scope

- No backend; everything on the `ui` stub seam.
- No co-authoring relocation (that's S3, "Write together") — only made dormant here.
- No Solutions/Vote/Mandate card work (S4–S6).
- No DM inbox; no fr/sw native-language review (human-gated, tracked separately) — only key parity.

## 8. Verification (no test framework)

- `npm run build` (`tsc -b`) clean before every commit.
- `npm run dev` + `preview_*` at **360px**, **light and dark**, on the seeded showcase initiative:
  1. Problem card: de-boxed, flush vote; order = vote → "agreed by half" line → two CTA buttons.
  2. Discussion: post → reply → heart; Top/Newest re-sorts; nesting indents then "Continue this
     thread →" re-roots + "← Back" returns; **no** 33% meter / categories anywhere.
  3. DM: from the problem card → full page; send a suggestion; it appears; back works.
  4. Collab-menu Discussion flow renders the same plain thread.
  5. Empty states (fresh initiative) read friendly; copy never implies a discussion gate.
- AA gates per `DESIGN_SYSTEM.md` (no `$gray-400` text; ≥44px touch on hearts/CTAs/sort; focus
  rings). Tokens only — no ad-hoc hex.

## 9. Self-review notes

- **Single new contract method:** `like_comment`. DM adds none (reuses chat). Keeps the seam change
  minimal and documented.
- **One threaded UI** after this session (`ThreadedDiscussion`) used by the stage, the "Discuss this
  problem" CTA, and the collab flow — net simplification, on-brand for the consistency roadmap.
- **Risk — `DEPTH_CAP` + re-root** is the only genuinely new interaction; verify the "← Back" crumb
  and that re-rooting never strands a user. Tunable cap noted.
- **Risk — DM author identity** at the route: resolve author from nav state with a fallback to the
  initiative author; confirm `UserIdentity` renders with country when the profile is loaded.
