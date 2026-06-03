# Batch 5 — Stage-UX redesigns: discussion-as-co-authoring + mandate card

**Branch:** `ui` · **Date:** 2026-06-04 · **Status:** approved design, pending spec review

Two stage redesigns that turn passive surfaces into the *artifacts* the platform is about:

- **Redesign A — Discussion-as-co-authoring (Stage 2):** the deliberation surface becomes one
  **co-authoring space** for a community's *shared understanding of the problem* — a living,
  co-owned **statement** plus member-raised, country-tagged **positions** — instead of a flat
  comment thread bolted under a co-authoring panel.
- **Redesign B — Mandate card (Stage 5):** the published mandate gains a scannable, shareable
  **hero card** that says *what the community decided* and *why it's legitimate* at a glance, sitting
  above the existing institution-grade `MandateDocument`.

Both render **inside the existing `StageGate`** (Batch 4), keep the `StageVariant = 'feed' |
'dashboard'` contract, stay **one person, one vote**, and read/write only through the
`src/services/` seam. The design below was confirmed with Eston via the question tool on 2026-06-04.

---

## 1. The confirmed design (product calls, owned by Eston)

### Redesign A — Discussion-as-co-authoring (Stage 2)

| Decision | Choice | Notes |
|----------|--------|-------|
| What's co-authored | **A shared statement + positions** | A core statement everyone broadly agrees on, *plus* country/region-tagged "positions" that capture where members differ. |
| The old comment thread | **Anchored discussion** | No separate flat thread. Discussion becomes replies anchored to the statement and to each position. The old categories (evidence/impact/solutions/concerns) become the **types** of positions. |
| How edits land | **Community vote (1p1v)** | A suggested edit folds into the core statement when its 1p1v support crosses a threshold. No single owner/gatekeeper. Contributors are credited as co-authors. |
| How positions behave | **Open + supported, ranked** | Anyone eligible adds a position (typed, country-tagged from their profile); others support 1p1v; positions sort by support; low-support ones collapse under "also raised". |
| Co-presence + 33% | **Survive, pinned at top** | `CoPresenceBar` stays; the 33%-participation motif becomes a visible **participation meter** that gates stage advancement. |
| Seam | **Seam-backed** | New behaviour moves off fixture-local state onto `discussionApi.ts` + `demoContracts/discussion.ts` (version-gated), so Ouri can wire a real server with a localized change. |

### Redesign B — Mandate card (Stage 5)

| Decision | Choice | Notes |
|----------|--------|-------|
| Where the card lives | **Hero atop the published page** | Top of `/mandate/:communityId/:mandateId`, above `MandateDocument`. One shareable URL; the full document scrolls below. |
| Legitimacy signal | **Three signals, never conflated** | **Reach** (transnational), **Mandate** (verified + 1p1v), **Conviction** (sustained staking) shown as visibly distinct things, so time-weighted conviction never reads as weighted voting. |
| Share | **Native share + copy fallback** | `navigator.share` where available; else copy the page URL with a "Copied" confirmation (`aria-live`). Card laid out to crop/screenshot cleanly. |
| The journey | **Compact `JourneyRecap`** | A condensed problem→…→mandate arc reusing `JourneyRecap`'s step data via a new compact variant (DRY). |

### Shared invariants (do not break)

- **One person, one vote** — every support action (edit support, position support) is 1p1v;
  eligibility is gated by `StageGate`, never vote weight. Conviction staking remains a *separate*
  signal, never presented as a vote.
- **`StageGate`** — read-only **viewing** (statement, positions, discussion, the mandate card) lives
  **outside** the gate and is always visible; every **action** renders **inside** it. The gate's
  blocked/allowed states are untouched.
- **`StageVariant` contract** — each stage component keeps its `'feed'` (compact card in
  `StageFeedView`) and `'dashboard'` (expanded in `InitiativeDashboard`) variants.
- **Design system is law** — tokens only (no ad-hoc hex/px/rgba; derived `rgba($token, a)` OK), AA
  contrast, focus-visible on every control, ≥44px targets, light + `prefers-color-scheme: dark`,
  flagship **360px**. Strings via `t('ns.key', 'English default')`.

---

## 2. Architecture — seam & data layer

Everything reads/writes through `src/services/api.ts`. New mock behaviour lives in
`src/services/demo/`, version-gated. **`DEMO_VERSION` bumps `global-v3` → `global-v4`**
(`mockApi.ts:17`) because Redesign A seeds new discussion sub-contract state.

### 2.1 `discussionApi.ts` (edit) — add the co-authoring method group

The existing flat-comment methods (`addComment`/`getComments`/`deleteComment` → `add_comment`/
`get_comments`/`delete_comment`) **stay untouched** — they back the legacy collab `DiscussionFlow`
in `PipelineView`. We add a new, clearly-namespaced co-authoring group (typed payloads, normalizers
mirroring the existing `normalizeComment`):

```text
// --- shared statement (the co-owned core framing) ---
getStatement(...)      -> { title, body, coAuthors: string[] }            // read get_statement
suggestEdit(..., { field:'title'|'body', text, rationale })               // write suggest_edit
getEdits(...)          -> EditSuggestion[] (open + resolved, + supporters) // read get_edits
supportEdit(..., { editId, target })                                      // write support_edit (1p1v)
withdrawEditSupport(..., { editId })                                      // write withdraw_edit_support

// --- positions (typed, ranked, country-tagged) ---
getPositions(...)      -> Position[] (+ supporters, replyCount)           // read get_positions
addPosition(..., { type, text })                                          // write add_position
supportPosition(..., { positionId })                                      // write support_position (1p1v)
withdrawPositionSupport(..., { positionId })                              // write withdraw_position_support

// --- anchored discussion (replies under statement or a position) ---
getAnchoredComments(..., { anchor })  -> Comment[]  // anchor = 'statement' | positionId
addAnchoredComment(..., { anchor, text, parentId })
```

**Country tagging** is resolved **client-side** from the author's profile (`profiles[pk].country`,
exactly as `deliberationParticipant` does today) — the contract only stores the author `pk`. Keeps
the contract small and avoids duplicating profile data.

### 2.2 `demoContracts/discussion.ts` (edit) — handlers + seed

Add state keys alongside the existing comment store, **timestamp-keyed, no counters** (per the
contract rule in ARCHITECTURE.md — `__init__` re-runs every call):

- `statement: { title, body, coAuthors }`, `edits: { [ts]: EditSuggestion }`,
  `positions: { [ts]: Position }`, `anchored: { [ts]: AnchoredComment }`,
  and `*_supporters: { [id]: pk[] }` maps.
- **Seed on init** from the deliberation fixture so any discussion contract shows the rich demo
  (today's contract-backed `DiscussionFlow` starts empty; the redesigned surface needs the seeded
  statement/positions to feel alive). Documented as mock seeding.
- **Edit fold-in rule:** `support_edit` appends the supporter (dedup → 1p1v) and, when
  `len(supporters) >= target`, folds the edit into `statement[field]`, appends the author to
  `coAuthors`, marks the edit `accepted`, and marks sibling open edits to the *same field* `stale`.
  `target` (a majority of members who've taken part, floor 3) is **passed in by the UI** from the
  member count and applied in the contract, so the fold-in is server-portable. Documented
  simplification: contested spans resolve as "most-supported wins; siblings need reworking".

No `demoRouter.ts` change (new methods on an existing handler).

### 2.3 `fixtures/deliberation.ts` (edit) — recast existing data, add positions

The fixture already carries everything; we **recast** it rather than invent new copy:

- **Statement** = existing `PROBLEM_STATEMENT` (title + description→`body`); **co-authors** = existing
  `CO_AUTHORS`.
- **Open edits** = existing `EDIT_SUGGESTIONS` + a seeded `supporters: pk[]` per edit (so the support
  bars read as in-progress).
- **Positions** (new `POSITIONS: Position[]`) — derive from the **root** `DISCUSSION_COMMENTS` (each
  top-level comment is effectively a position: it has a category=type, an author with a country, and
  hearts→seed support). Themed to the misinformation hero.
- **Anchored discussion** = the existing **reply** comments, re-keyed to anchor under their parent
  position. The `hearts` field seeds support counts.
- Keep `diffWords`, `deliberationParticipant`, `relativeTimeKey` as-is (reused).

### 2.4 Redesign B — no new fixture data

`MandateCard` reads the existing `PublishedMandate` (`getPublishedMandate`/`MANDATES_BY_KEY`). All
three signals come from existing fields: **reach** = `provenance.participants` + `provenance.countries`
+ `countries[]`; **mandate** = `provenance.participants` framed as *verified* members (the Vote stage
defaults to Verified-only in Batch 4, so vote participants are verified) + the 1p1v label +
`provenance.voteWinner`; **conviction** = `provenance.convictionBackers`. **No new fields, no
`DEMO_VERSION` impact from B.**

---

## 3. Redesign A — components & surfaces

### 3.1 `SharedStatement` (new — `flows/discussion/SharedStatement.tsx` + `.module.scss`)

The hero of the co-authoring space; supersedes the fixture-local `CoAuthoringPanel` (retired, §5).
Reads through `discussionApi`. Renders:

- The **current statement** (title + body) with **co-author credit** (flags + names) — reuse today's
  `statement`/`credit` markup.
- **"Suggest an edit"** → the existing `SuggestEditModal` with the live track-changes preview
  (`diffWords`), now writing via `suggestEdit`.
- **Open edits** as track-changes diffs, each with a **1p1v support bar toward the fold-in target**
  (reuse the Progress Bars spec: `$gray-100` track, `$primary` fill → `$success` at target) +
  **Support / Withdraw** (replaces today's author-only Accept/Decline). At target the edit folds in
  and credits the author. Resolved edits show a `Banner` ("folded in — now a co-author" / "didn't
  reach support").

### 3.2 `PositionsBoard` (replace `flows/discussion/DeliberationThread.tsx`)

The positions + anchored discussion block:

- **"Where we stand"** header + **"Add a position"** action → a compose with the type chips
  (evidence/impact/solutions/concerns, reuse the `Badge`-toned `CategoryLabel`).
- **Ranked position cards** (sorted by support desc): type chip + author + country flag + text +
  **Support (1p1v)** + anchored-reply count; tap to expand → the **anchored discussion** (compose +
  threaded replies, reusing today's recursive `CommentItem`/`ComposeBox`). Low-support positions
  collapse under an **"also raised"** disclosure.
- Anchored discussion under the **statement** itself is available via a "Discuss the statement"
  affordance on the `SharedStatement` block (anchor `'statement'`).

### 3.3 `ParticipationMeter` (small, in `flows/discussion/`)

Pinned near the top with `CoPresenceBar`. Shows "**{taken} of {members} taking part · 33% needed to
advance**" with a threshold bar (Progress Bars spec). **"Taking part"** = *any* contribution: suggest
or support an edit, add or support a position, or post an anchored reply (computed from the seam
reads). Reuses the existing 33% framing; distinct from the edit fold-in target.

### 3.4 `DiscussionStage` (edit) — feed variant

Glanceable + tap-through (the card navigates to the full view, as today). Compact `CoPresenceBar` +
truncated statement **title** + a one-line **leaning signal** ("3 positions · 2 open edits · 47
taking part") + "Tap to co-author". No editing in the feed.

### 3.5 `DiscussionStage` (edit) — dashboard variant

A **summary + entry point**, not the full editor (screen space): `CoPresenceBar` +
`ParticipationMeter` + a compact preview ("Statement forming · 3 positions · 2 open edits") +
**"Open the co-authoring space"** → `DiscussionStageView`.

### 3.6 `DiscussionStageView` (edit) — full route assembly

Top→bottom: `PageHeader` → `CoPresenceBar` + `ParticipationMeter` → `SharedStatement` →
`PositionsBoard`, all inside the existing `ErrorBoundary`. (Replaces today's `CoAuthoringPanel` +
`DeliberationThread` stack.)

### 3.7 `StageGate` integration (unchanged pattern)

Viewing the statement, positions and discussion is **always visible**; the **action** controls
(suggest, support, add position, reply, compose) render **inside** `StageGate`. Because the feed and
dashboard already wrap the stage component in `StageGate`, a blocked user sees the full read-only
co-authoring space with the action affordances replaced by the gate's friendly blocked state.
Where finer-grained gating is cleaner (e.g. show positions read-only but gate the compose), the
component uses the same `useCommunityTrust().canCurrentUserParticipate('discussion')` predicate
`StageGate` uses — no new gating logic.

---

## 4. Redesign B — components & surfaces

### 4.1 `MandateCard` (new — `src/components/mandate/MandateCard.tsx` + `.module.scss`)

Hero atop `MandatePage`, above `MandateDocument`. Props: `{ mandate: PublishedMandate }`. Layout
(top→bottom, 360px):

1. **Eyebrow + status** — `mandate.subtitle` + a **Ratified** `Badge` + formatted `ratifiedOn`.
2. **Title** — `mandate.title`.
3. **"What we decided"** — `provenance.voteWinner` (the winning proposal) in a line or two — the
   heart of the card.
4. **Three legitimacy signals** (see 4.2).
5. **Mini-journey arc** (see 4.3).
6. **Actions** — **Share** (4.4) + **Read the full mandate** (scrolls to / anchors the document
   below; a secondary `Button`).

Tokens only; its own surface treatment (a raised `Card`-like container) in light + dark.

### 4.2 The three trust signals (clearly separated)

A labelled, scannable strip — three distinct tiles/rows, never a single blended number:

- **Reach (transnational):** "{participants} people · {countries} countries" + a flag cluster
  (`CountryPresence`, reused).
- **Mandate (democratic):** "Decided by verified members · **one person, one vote**" — the
  web-of-trust + 1p1v signal, with a small `TrustBadge`-style `ShieldCheck` glyph. This is the
  *vote's* legitimacy.
- **Conviction (endurance):** "Backed by {convictionBackers} in sustained conviction" — the Stage 5
  staking, explicitly framed as enduring support *behind* the decision.

### 4.3 Mini-journey arc — `JourneyRecap` compact variant (edit `JourneyRecap.tsx`)

Add a `compact?: boolean` prop (matching the `ConvictionStaking` convention). `compact` renders the
same five steps (problem → discussion → proposals → vote → mandate) as a condensed horizontal/tight strip
(icons + short labels, no per-step paragraph, no CTA button) for embedding in `MandateCard`. The
existing full vertical timeline on the dashboard is unchanged. Single source of step data/icons.

### 4.4 Share — `shareMandate` helper

A small inline helper in `MandateCard` (extractable to `src/utils/` later): if `navigator.share` exists →
`navigator.share({ title, text, url })`; else `navigator.clipboard.writeText(url)` → set a "Copied"
state for ~2s (mirror `MandateDocument`'s copy pattern), surfaced via an `aria-live="polite"` status.
Button has all interactive states + focus-visible; `aria-label`.

### 4.5 `MandatePage` (edit) + feed/dashboard links + the gate nuance

- **`MandatePage`** renders `<MandateCard mandate={mandate} />` **above** `<MandateDocument>`; add a
  scroll anchor/`id` on the document so "Read the full mandate" targets it.
- **Dashboard** — `JourneyRecap`'s "View the published mandate" already routes to the page (outside
  the gate ✓). Unchanged.
- **Feed gate nuance (minimal, careful):** today the feed's "View the published mandate" link sits
  **inside** `StageGate` (it's in `MandateStage`'s feed variant). Since the published artifact is
  read-only, surface that link **outside** the gate in the always-visible card region of
  `StageFeedView` for the mandate stage; keep `ConvictionStaking` **inside** the gate. Net: a blocked
  (not-yet-verified) member can still reach the read-only mandate. The gate itself is not modified.

---

## 5. Files touched

**New (≈ 4 components):**
- `src/components/mandate/MandateCard.tsx` + `.module.scss`
- `src/components/collaboration/flows/discussion/SharedStatement.tsx` + `.module.scss` (supersedes `CoAuthoringPanel`)
- `src/components/collaboration/flows/discussion/PositionsBoard.tsx` + `.module.scss` (replaces `DeliberationThread`)
- `src/components/collaboration/flows/discussion/ParticipationMeter.tsx` + `.module.scss`

**Edited (≈ 10):**
- `src/services/demo/mockApi.ts` — `DEMO_VERSION` → `global-v4`.
- `src/components/collaboration/flows/discussion/discussionApi.ts` — co-authoring method group.
- `src/services/demo/demoContracts/discussion.ts` — statement/edits/positions/anchored handlers + seed.
- `src/services/demo/fixtures/deliberation.ts` — recast statement/edits/positions/anchored + supporters.
- `src/components/collaboration/DiscussionStageView.tsx` — assemble statement + positions (swap imports to `SharedStatement` + `PositionsBoard`).
- `src/components/stages/DiscussionStage.tsx` (+ scss) — feed + dashboard variant copy/previews.
- `src/components/mandate/MandatePage.tsx` — render `MandateCard` above the document + anchor.
- `src/components/mandate/JourneyRecap.tsx` (+ scss) — compact variant.
- `src/pages/StageFeedView.tsx` — surface read-only mandate link outside `StageGate`.
- `src/i18n/*` — new keys (English defaults inline via `t()`; add to locale files if a registry exists).

**Retired (deleted — each only imported by `DiscussionStageView`, now superseded):**
- `src/components/collaboration/flows/discussion/DeliberationThread.tsx` + `.module.scss` → `PositionsBoard`
- `src/components/collaboration/flows/modifications/CoAuthoringPanel.tsx` + `.module.scss` → `SharedStatement`
  (the `modifications/` folder stays — `ModificationSuggestions`/`modificationApi` are untouched.)

**Leave untouched:** `DiscussionFlow`, `PipelineView`, the flow `registry`, `ModificationSuggestions`/
`modificationApi`, `MandateDocument` internals, `AdoptionFramework`, `StageGate`,
`trust.ts`/`trustModel.ts`/`useCommunityTrust`.

---

## 6. Verification plan

- `npx tsc -b` clean **and** `npm run build` clean (production build runs `tsc -b`).
- Preview (`preview_start`, port 5173). Seed an identity via `/welcome`. Walk, in **light + dark +
  360px**, with before/after screenshots for every changed surface:
  - **A:** Stage 2 **feed** card (`/stage/discussion`), dashboard inline card, and the full
    co-authoring view — add a position, support a position (1p1v), suggest + support an edit (watch a
    fold-in), post an anchored reply, watch the participation meter move.
  - **B:** the published mandate page hero **card** (`/mandate/<comm>/<init>`) — three signals legible,
    mini-arc, Share (copy fallback shows "Copied"), "Read the full mandate" scrolls; feed mandate card
    link reachable.
  - **Gate:** confirm both stages still gate correctly — a **pending** (2-vouch) user sees read-only
    statement/positions/card but blocked action states; a **verified** user can act.
- No `ErrorBoundary`/console errors. Judge "clean" by `tsc`/`build` exit codes + a live DOM check
  (drive React with a real click + short `await` before asserting).

---

## 7. Commits (local only — Eston controls the push)

1. **Step 0** — `docs(spec)` this design doc (+ the plan doc).
2. **A1 — seam** — `discussionApi` co-authoring group + `demoContracts/discussion.ts` handlers/seed +
   `deliberation.ts` recast + `DEMO_VERSION` → `global-v4`.
3. **A2 — statement** — `SharedStatement` (seam-backed, 1p1v support + fold-in).
4. **A3 — positions** — `PositionsBoard` + anchored discussion + `ParticipationMeter`.
5. **A4 — variants** — `DiscussionStage` feed/dashboard + `DiscussionStageView` assembly.
6. **B1 — card** — `MandateCard` + three signals + `JourneyRecap` compact + Share.
7. **B2 — wiring** — `MandatePage` hero + anchor + `StageFeedView` read-only-link gate nuance.
8. **i18n + polish** — keys, dark-mode + focus-visible sweep.

(Phases A and B are independent; the plan may ship them as one batch or split A/B across sessions.)
**Do not push.**

## 8. Scope, simplifications & risks

- **In scope:** Redesigns A + B exactly as above. Seam-backed (A). No real-time sync.
- **Out of scope (YAGNI):** real-time presence (stays simulated), AI synthesis of positions,
  character-range comment anchoring (anchor at object level — statement or a whole position),
  merge-conflict UI beyond "most-supported wins", download-as-PNG sharing, edits to `MandateDocument`
  internals / `AdoptionFramework`, the legacy `DiscussionFlow`/collab pipeline.
- **Documented simplifications:** discussion contract self-seeds from the fixture (demo richness);
  edit fold-in `target` supplied by the UI from member count (server-portable); positions' country
  resolved client-side from the author profile; mandate "verified members" = vote participants (Vote
  stage is Verified-only). `DEMO_VERSION` bump forces a one-time localStorage reseed — expected.
- **Risks:** (1) Seam migration of Stage 2 from fixture-local to contract-backed is the biggest lift
  — keep the recast fixture mapping faithful so the demo looks identical, just persisted. (2) The
  feed gate-nuance change touches `StageFeedView`'s gating structure — keep it minimal and re-verify
  the gate. (3) `JourneyRecap` compact variant must not regress the dashboard's full timeline.
