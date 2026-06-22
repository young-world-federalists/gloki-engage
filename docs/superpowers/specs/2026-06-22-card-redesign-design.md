# Card System Redesign — Design Spec (2026-06-22)

Status: **approved direction** (Eston, 2026-06-22). Companion to the
[requirements brief](./2026-06-22-card-redesign-brief.md). This is the contract the
implementation plan + build team work against.

## 1. North star

**Layered: scan fast, dive on tap.** A user can read the gist of any item in seconds;
depth (full text, voting, threaded discussion) is one tap away, never forced. Initiatives
move briskly; the UI never makes a quick contribution feel like a chore.

Design consequences:
- Cards are **collapsed summaries by default**, expand to a full read + engage (the
  Mandate-card model, generalized to every stage).
- Each card is **two clearly separated zones**: **Read** (understand it) over **Engage**
  (act on it). Never interleaved.
- Deep work (full threaded discussion, the ballot) lives on the item's **own page**,
  reached by one blue "Open…" button. The card carries only the *quick* action inline.

## 2. The unified card shell (all stages)

One shared primitive — call it `InitiativeStageCard` — with a per-stage **engage** slot.

**Read zone (top):**
- Stage badge: a small coloured **pill** only (red Problem, etc.) — never a full-width
  coloured bar. Type is tagged, not shouted.
- Headline = **the content itself**, as a short paragraph. For a Problem, the problem
  statement + who-it-affects **merged into one paragraph** — not a topic title.
- Byline: "Started by {name}" + Verified badge + relative date. **Author shown once**
  (drop the duplicate initials avatar).
- One quiet meta line: SDG · a flag icon with **country count** · source link. (No "N
  countries" flag-wall, no "We chose this together" banner.)

**Engage zone (bottom, visually distinct — shaded panel + divider):**
- The stage's **one quick action** (see §3), with clear affordance and live counts.
- A light status line (e.g. "Agreed by half your community — ready to advance").
- Secondary text actions where relevant: **Discuss this**, **Propose a different framing**.
- One primary blue button: **Open the full {stage}** → the item's own page.

**Collapsed state (feed):** badge + headline (clamped) + byline + a one-line engage teaser
("12 agree · weigh in") + chevron. Expanding reveals the full Read + Engage.

## 3. Per-stage engage zones

| Stage | Quick action (inline) | Open button → |
|-------|----------------------|---------------|
| **Problem** | "Is this a shared problem?" → Yes/No + counts | Open the full problem (read + discuss + framings) |
| **Solution** (proposals) | "Back this solution" + support count | Open the full solution (read + discuss) |
| **Vote** | "Cast your vote" teaser (the ballot is on the page) | Open the ballot |
| **Mandate** | — (read-only artifact) | View the published mandate (already this pattern) |

The **Solution** card keeps its richness but gains hierarchy: the proposal text is the
headline; supporting detail/options sit in the Read zone; backing + discuss in Engage.
"Whose view is this" is answered by the byline, like every other card.

## 4. Discussion model (DECISION: one thread per post + keep chat)

- Every Problem / Solution post has **its own discussion thread** — a tree *about that exact
  post* — reached via **Discuss this** (card) or the item's page.
- The **community chat** (`/community/:id/chat`) stays, for free-form, cross-cutting talk.
- The **standalone discussion *stage*** (the old `/…/discussion` page with the
  quadratic-voting "discuss the statement" UI) is **retired or redirected** into the
  per-post thread. Discussion is no longer a pipeline "stage type" you browse; it's the
  destination of "Discuss this." (`/stage/discussion` feed can remain as "posts currently
  being discussed," but cards there behave like every other card.)
- **BUG to fix:** opening a problem's discussion currently loads an unrelated statement
  (the affordable-housing problem opened a "Fair Futures Forum / algorithmic" statement).
  The thread must key off the actual `initiativeId` (+ host/agent). Root-cause in the
  discussion view's id resolution.
- **"Why this matters to us"** (the Diego-style insights list) is removed as a separate,
  confusing block; notable contributions live *inside* the thread.

## 5. "Propose a different framing" (proposed — confirm during plan)

- Keep it as a button in the Problem engage zone.
- Its popup is simplified: the reframed problem text + an optional **single-select country
  dropdown** (reuse `SearchableSelect` / a single-select `CountrySelect`, not the full
  multi-select grid).
- A reframing is posted as a **suggested alternative surfaced in the post's discussion
  thread** (not an automatic fork). It can gather support there; the author/co-authors can
  **adopt** it via the existing 1p1v co-authoring fold-in. No parallel initiative is spawned.

## 6. Community page cleanups (`CommunityCard` + `CommunityHome`)

- **Members line:** "{n} members" (people icon) **+** a flag icon with the **country
  count** ("16 countries") on one line. Remove "16 participants from 16 countries" (the
  17-vs-16 redundancy).
- **Remove the journey** arrow/bullet list (`journey` prop).
- Keep only **Start an initiative** (+ Menu) as actions. Thinner card.
- The community name stays the visible page title here (the `<h2>` in the card); the header
  `<h1>` remains hidden (Track A shipped). Confirm one canonical visible name.
- Feed below = `InitiativeStageCard`s (the shared shell), collapsed, deep-link expands one.

## 7. Components touched

- **New / refactor:** `InitiativeStageCard` (the shared shell) — Read zone + per-stage
  Engage slot + collapsed/expanded. Replaces the bespoke bodies of `ActivityCard` and the
  per-stage panels' "framing" chrome.
- **Per-stage engage components:** slim down `ProblemStage` / `ProposalsStage` /
  `VoteStage` / `MandateStage` to render only their Engage slot (the quick action), not the
  whole post chrome (which the shell now owns). Removes today's duplication.
- **Discussion view** (`DiscussionStageView` / `DiscussionStage`): become the per-post
  thread; fix id resolution; drop the "why this matters" list.
- **`CommunityCard`** (§6), **`StageFeedView`** (already compact — adopt the shared shell
  so feed + community page match), **`ActivityCard`** (becomes a thin expand wrapper around
  the shell or is absorbed into it).
- **Seam:** all reads/writes stay through `src/services/api.ts`. No component calls a
  server directly. (Note the existing `.demo.ts` bypasses for ProblemStage/MandatePage —
  keep behaviour identical through the refactor.)

## 8. Non-goals / out of scope (this pass)

- No change to the governance rules/thresholds, the trust model, or the contract methods.
- No new pipeline stages. No backend.
- Currency, Members, Identity sub-pages unchanged except incidental heading fixes.

## 9. Implementation approach

Stage-by-stage behind the shared shell, each verified at 360px in en/fr/sw, light + dark,
before the next. Sequence (each a plan unit):
1. `InitiativeStageCard` shell + **Problem** engage + adopt in feed & community page.
2. **Solution** engage. 3. **Vote** engage. 4. **Mandate** (mostly done) + remove dead chrome.
5. **Discussion** thread per post + id-bug fix + retire standalone page.
6. **Community page** cleanups (§6).
A focused build team (one agent per stage) can run against this spec once the plan is written.

## 10. Open items to confirm in the plan
- §5 propose-a-framing flow (adopt-via-co-authoring vs lightweight suggestion).
- Exact "quick action" for Vote on the card (teaser vs a first credit allocation inline).
- Whether `/stage/discussion` remains a browse feed or is dropped from the footer.
