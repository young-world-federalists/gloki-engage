# Design Consistency + Pipeline Redesign — Master Roadmap

**Date:** 2026-06-25
**Branch:** `ui` (UI-only stub layer; no backend)
**Author:** Eston (product) + Claude (planning)
**Status:** Roadmap approved-in-principle; each session gets its own focused brainstorm → plan before implementation.

> This is a **decomposition roadmap**, not a single implementation spec. It records the
> sequencing, the locked cross-cutting decisions, and the scope of six sessions. Each session
> below gets its **own** brainstorm → spec → plan → implement → `/code-review` cycle when we
> reach it, so per-card visual detail stays fresh rather than being over-specified months early.

---

## 1. Goal

Eston's feedback (2026-06-25) is a full consistency + pipeline-clarity pass on the Gloki app:
too many colors/shades that clash in dark mode, too many button styles, an over-complex
co-authoring mechanic bleaking into problem/solution cards, confusing overlapping CTAs, and a
governance pipeline whose Mandate "commitments" are invented rather than earned. The work is
large enough to span several sessions, each ending in `/code-review`.

## 2. Locked decisions (these shape the plan)

1. **Color system → disciplined reduction.** One brand blue (`$primary`, keep `#3b82f6` — the
   logo blue, ratified at prior gates) + a single neutral gray ramp + semantic
   success/warning/error + the **5 stage-identity accents** (Problem/Discussion/Solutions/Vote/
   Mandate — already needed by `StageStrip`/stage badges). **Retire** the ad-hoc teal collab
   theme (`#0d9488`), the orange initiative theme (`#c2410c`), and the purple brand gradient
   (`#667eea → #764ba2`). Rebuild dark mode on the same tokens so component overrides stop
   clashing. **Rule going forward: color means either "stage" or "status" — nothing else.**

2. **Commitments + metrics thread through the pipeline.** Solution authors enter commitments
   ("who and what needs to change"); experts add metrics during expert review; both ride the
   **winning** solution through the Vote into the Mandate. The Mandate's "What we commit to" and
   "How we'll know it's working" become **derived from real pipeline data**, not hardcoded
   fixtures. All within the demo seam (`src/services/demo/`) — no backend. New contract
   methods/fields are documented for Ouri (see §5, Session 4).

## 3. Current-state findings (grounding)

- **Color sprawl:** tokens live in `src/styles/variables.scss` (semantic + a 10-step gray ramp +
  4 semantic surfaces with dark variants). On top of that sit a teal collab theme
  (`CollabList.module.scss`), an orange initiative theme (`InitiativeStagePanel` /
  `StageAdvanceBar`), a purple brand gradient, and **~79 hardcoded hex values** across `.scss`
  and `.tsx`. Dark mode is `@media (prefers-color-scheme: dark)`; ~25 component modules add their
  own dark overrides, which is where the clashing comes from.
- **Button sprawl:** shared `Button.tsx` has 4 variants (primary/secondary/destructive/ghost) ×
  3 sizes, used in **~36** places; there are **~170** raw `<button>`s with bespoke classes, plus
  **8 duplicate button classes** in `globals.scss` (`.save-button`, `.create-button`, etc.).
  `DESIGN_SYSTEM.md` already documents legitimate bespoke exceptions (icon-only squares,
  section-themed, list-rows) — those stay; the duplicates and accidental ad-hoc ones go.
- **Identity treatment:** `TrustBadge.tsx` renders icon **+ text** ("Verified" / "Vouched by N"
  / "Unverified") in a `Badge`. A flag glyph exists (`CountryBadge.tsx`) but is used only in
  chat. Country utils: `src/utils/countries.ts` (`getCountryFlag()` etc.).
- **Cards share one shell:** `InitiativeStageCard.tsx` with a per-stage "Engage" slot
  (`ProblemEngage`, `DiscussionEngage`, `SolutionEngage`, `VoteEngage`, `MandateEngage`). The
  "forehead" = header (badge/headline/byline/trust/date); the "darker body" = the Engage slot.
- **Problem:** `ProblemEngage.tsx` — threshold hint ("agreed by at least half", 50% math),
  up/down vote (`problemVote.ts`), two text-link CTAs ("Discuss this" + "Propose a different
  framing").
- **Discussion = the heavy co-authoring mechanic:** `DiscussionFlow.tsx` + `SharedStatement.tsx`
  (track-changes edits with 1p1v fold-in, ranked positions, anchored threads, 33%
  `ParticipationMeter`). Demo: `discussion.ts`.
- **Solutions:** `ApprovalFlow.tsx` (add proposal, approve toggle) + `ProposalMergePanel` /
  `merge.ts` (suggest/vote merge) + a Proposals/Results `SegmentedControl`. Demo: `approval.ts`,
  `merge.ts`. **No commitment or metric fields exist.**
- **Vote:** `QVFlow.tsx` — quadratic hearts + usage bar + country-color results, Proposals/
  Results tabs. Demo: `qv.ts`. **No commitments/metrics.**
- **Mandate:** `MandateCard.tsx` (top-of-page: "What we decided" blue box; Reach/Mandate/
  Conviction signals; Read-full + Share stacked) + `MandateDocument.tsx` (full artifact:
  articles = commitments, indicators = metrics) + `MandateActivityCard.tsx` (community preview).
  Articles + indicators are **hardcoded fixtures** in `fixtures/mandate.ts`; the 5-vs-18 country
  numbers are *jurisdiction* (`mandate.countries`, 5) vs *deliberation reach*
  (`provenance.countries`, 18) — both real, just unlabeled.
- **SDG already exists:** `SdgTag` + `SDG_OPTIONS` (9 SDGs) in `fixtures/problems.ts`; renders
  text-only on problem cards. Extend to solution/vote cards.
- **Create initiative:** `CreateInitiativePage.tsx` back button = `ArrowLeft size={20}` (wants
  larger); `CountryMultiSelect.tsx` has regional quick-pick toggles at ~lines 91–118 (wants
  removed; the `SearchableSelect` search stays as the sole picker).

## 4. Cross-cutting principles (apply across sessions)

- **Identity component (built S1, reused everywhere):** one component renders
  `🇰🇪 Firstname Lastname` `shield` — **flag before** the name, **shield as a small superscript/
  exponent after** the name. Verified = filled shield; vouched/unverified = degraded states.
  Replaces the text `TrustBadge` in feed/card contexts (the standalone verification page can keep
  a fuller treatment). Must stay AA and ≥44px touch where interactive.
- **Expand in place:** problem/solution/vote previews **expand on the stage feed**, they do not
  route to the community/initiative page. Audit `InitiativeStageCard` open behavior and make all
  three consistent. (Applied per-card in S2/S4/S5.)
- **Whitespace + AA:** a line-height/vertical-rhythm pass for "more white between text," holding
  WCAG 2.1 AA (the `$gray-400` caption gate, focus rings, 44px targets) per `DESIGN_SYSTEM.md`.
- **`/code-review` gate** after every session (local multi-model panel and/or `/code-review`),
  fix findings before moving on.
- **Seam discipline:** every read/write stays behind `src/services/api.ts`; the demo seam emits
  no `contract_write` events, so flows **re-fetch after writes** (the ConcernsFlow/funding
  pattern). New contract method names are chosen cleanly and **documented for Ouri**.

## 5. The six sessions

### Session 1 — Design-system consistency (foundation)
**Why first:** the color tokens, button kit, and identity component underpin every later card.
- Rebuild the color system to the disciplined set (decision #1); migrate the ~79 hardcoded hex
  to tokens; retire teal/orange/purple themes; rebuild dark mode coherently so component
  overrides stop clashing.
- Consolidate buttons: retire the 8 `globals.scss` duplicate classes and the accidental ad-hoc
  `<button>`s toward `<Button>`; keep only the documented bespoke exceptions.
- Build the **identity component** (flag-before / shield-exponent-after); swap it into card/feed
  bylines and the members list.
- Whitespace/line-height + AA contrast sweep.
- Quick wins: bigger create-initiative back-button icon; remove the `CountryMultiSelect` regional
  quick-picks.
- **Out of scope:** any card-body restructure (that's S2+).
- **Review gate:** `/code-review`.

### Session 2 — Problem card + Discussion-as-chat
- Problem card darker body: **remove the box** around the "Is this a shared problem?" content;
  move the "agreed by at least half" line **below** the question; two clear **CTA buttons**:
  **Discuss this problem** → a simple Reddit-style threaded chat (hearts, nestable threads);
  **Send suggestion to author** → a DM chat with the problem's author.
- Replace the heavy Discussion co-authoring with the simple threaded chat. Reconcile the
  contradictory copy (problem card says "just needs to be voted a shared problem"; discussion
  currently implies an engagement-metric gate) — the chat is **not** a gate.
- Apply **expand-in-place** to the problem card.
- **Sequencing note:** simplify *discussion* here, but don't delete the co-authoring code until
  its new home (S3) exists; the *solution*-card co-authoring removal happens in S3/S4.
- **Open (finalize at this session's brainstorm):** chat heart semantics; DM model in the stub.
- **Review gate:** `/code-review`.

### Session 3 — "Write together" community feature
- New community-menu entry (registered like Funds in `CommunityView.tsx` `menuItems`, route
  `/community/:id/write-together`), opening a self-contained page.
- Start a **problem or solution** draft, collaborate on it (the relocated co-authoring mechanic),
  and **submit to the feed as a community** — including drafting problems/solutions **for other
  communities**.
- **Solution→problem tagging.** *Proposed:* an in-app dropdown of open problems **plus** an
  auto-generated **3-word code** (`brave-otter-river`) for word-of-mouth/cross-community sharing.
  *Finalize at this session's brainstorm.*
- Removes collaborative statement writing from the problem/solution cards (the other half of the
  relocation).
- **Open:** how much of `SharedStatement`'s mechanic to carry vs. simplify; draft→feed submission
  model in the stub.
- **Review gate:** `/code-review`.

### Session 4 — Solutions card + commitments data model
- Forehead copy: prefix the problem text with scope — **"Global problem:"** vs **"Community
  problem:"** (driven by a per-problem scope flag). *Finalize exact labels at brainstorm.*
- Add the **SDG label** to the card.
- Card body order: **"Add solution to this problem" input first**; on "Add", a **popup** collects
  **3 commitments** — *"Who and what needs to change to make this solution a reality."* Below the
  input, a list of other solutions, each with its commitments in small bullet text + the identity
  treatment (flag + name + shield).
- **Fold three actions into the one solution feed** (per solution): **upvote**, **suggest expert
  review**, **suggest a merge** (suggest only — never accept). Suggesting a merge triggers a
  **gradient animation** around all solutions prompting the user to click a target solution to
  complete the suggestion.
- **Two threshold indicators** above the input (reusing the problem-card threshold pattern):
  e.g. *"5 solutions with upvotes from 50% of community"* and *"3 experts reviewed."* (3 experts
  = three users clicked "suggest expert review" → Gloki Team solicits experts; experts edit the
  community-voted solutions, which then advance to a vote.)
- **Remove the Results tab** (you found it un-illuminating at this stage).
- **Data spine (decision #2):** extend the solution shape with `commitments` authored here; add an
  expert-review pathway that lets experts attach `metrics`. New demo methods/fields in
  `approval.ts` — **documented for Ouri** (he has no contract for these yet).
- Apply **expand-in-place** to the solution card.
- **Review gate:** `/code-review`.

### Session 5 — Vote card
- Identity treatment (flag + shield), **SDG label**, **"Global Problem:"** scope prefix.
- **Remove the solutions button** from the body.
- Show the **5 expert-reviewed solutions** (longer, nuanced), each with its **commitments** and
  the **expert-provided metrics** beneath — carried from S4.
- Keep the hearts + usage bar (you like them); **give the hearts icons**.
- **Country colors → global regions + a key at the bottom.** *Proposed:* a 6-region world scheme.
- **Results gating.** *Proposed:* show live results but **lock the vote once cast** (your "see but
  can't change" instinct; resists bandwagoning). *Finalize at brainstorm.*
- **Completion threshold** indicator: *"Votes from X% of community"* (≈75%).
- Apply **expand-in-place** to the vote card.
- **Review gate:** `/code-review`.

### Session 6 — Mandate card/page
- **Remove the blue "What we decided" box** → plain text below the title: **problem first, then
  the winning solution**.
- Move **Share next to "Read the full mandate"** (not below).
- **Swap the two-card hierarchy:** the redesigned **top card becomes the preview** on the global
  Mandate page (bottom-nav); the currently-similar second card becomes the **click-through
  detail**.
- **Label the country counts:** 5 = jurisdiction (`mandate.countries`), 18 = deliberation reach
  (`provenance.countries`) — make the distinction legible.
- **Consume the spine:** render the **commitments** (from solution authors) and **expert metrics**
  as the mandate's "What we commit to" / "How we'll know it's working" — the payoff of decision #2.
  Mandate fixtures become derived from the winning solution rather than hand-authored.
- **Review gate:** `/code-review`.

## 6. Dependencies & sequencing

```
S1 (tokens + buttons + identity)  ──underpins──▶  S2, S4, S5, S6
S3 (Write together)               ──must precede──▶ removal of solution co-authoring in S4
S4 (commitments authored)         ──feeds──▶  S5 (carries) ──feeds──▶ S6 (consumes)
```

- **S1 first**, always (foundation).
- Back half is a fixed chain: **S4 → S5 → S6** (the commitments spine).
- **S2** and **S3** are loosely coupled and could merge; **S5** and **S6** could merge — kept
  split for cleaner review gates given depth.

## 7. Non-goals / out of scope

- No backend work; everything stays on the `ui` stub seam.
- No new swipe gestures; no logo/brand-blue change (rebrand was declined).
- No fr/sw native-language review (human-gated, tracked separately in
  `docs/i18n-native-review-candidates.md`) — but **new strings ship at fr/sw key parity** as
  usual.
- Pixel-level card layouts are deferred to each session's own brainstorm.

## 8. Working agreement

Each session: brainstorm (with the visual companion for layout questions) → short spec if needed
→ implementation plan → implement → verify on the 360px target (light + dark) → `/code-review` →
fix findings → commit. New user-facing strings go through i18n at fr/sw parity. Update the
project memory after each session.
