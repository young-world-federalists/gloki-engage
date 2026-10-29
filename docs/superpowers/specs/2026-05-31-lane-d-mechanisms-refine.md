# Lane D — Mechanisms refine (D0 + D1 + D2)

**Date:** 2026-05-31 · **Branch:** `lane/lane-d` → `ui` · **Scope:** D0, D1, D2 (D3 liquid
delegation deferred to a later session).

UI-only mockup. `src/services/api.ts` already routes `contractRead`/`contractWrite` to the local
mock (`src/services/demo/mockApi.ts`) — the existing `useFlowContract` plumbing **is** the demo
layer, so "refine" means UX/copy/visuals, never re-architecting data flow or touching the backend.

**Owned paths (edit only these):** `src/components/collaboration/flows/voting/**`,
`src/services/demo/fixtures/mechanisms.ts`. The mock contract math
(`src/services/demo/demoContracts/{qv,conviction}.ts`) is **out of lane** and stays untouched — the
designs below are built to work against it unchanged.

**North stars:** (1) usable without a tutorial, each mechanism explainable in one plain sentence;
(2) **one person, one vote — never plutocratic.**

---

## D0 — ProblemVoteFlow copy (pinned by MASTER_TODO §10 [B→D])

Component: `ProblemVoteFlow.tsx`.

- Heading `"Does this problem truly cross borders?"` → **"Is this a shared problem?"**
- Buttons `"Problem for me"` / `"Not a problem for me"` → **"Second it"** / **"Not for me"**
- Route this file's user-facing strings through `t('mechanisms.problem.*', 'English default')`
  (house rule: every string translatable). No DOM/logic rearchitecture.
- Leave the empty `evidenceLinks`/`countries` handling as-is — `ProblemStage` (Lane B) owns that
  framing and passes them empty on purpose. The flow keeps owning the tally + progress bar.

## D1 — QV → tactile hearts, quadratic cost *felt, not shown*

Component: `QVFlow.tsx` (+ `QVFlow.module.scss`).

- **Model:** the voter's mental unit becomes **hearts** (= votes) per proposal, not credits. `draft`
  tracks `heartsByProposal`.
- **Quadratic cost, hidden:** heart *N* on the same proposal costs `2N−1` from a 100-point support
  pool under the hood (cumulative cost of `h` hearts = `h²`). Spreading is cheap; piling on one
  proposal drains fast. The voter sees a **draining support meter**, never a formula, sqrt, or
  "influence" number (the existing `0.0 influence` readout is removed).
- **Add a heart** only if `spent_after ≤ 100`; otherwise the + is disabled with a gentle "pool empty"
  hint. Tapping a proposal's hearts row adds; a − removes the last heart on that proposal.
- **Submit:** convert `hearts → credits = hearts²` per proposal and call the existing
  `allocate({ [pid]: hearts² })`. Values are integers, total ≤ 100 → satisfies the unchanged mock.
  Results remain sqrt-based (already computed in `qv.ts`, so `sqrt(hearts²) = hearts` votes — the
  results tab now reads back as whole "votes," which is *more* legible than today's decimals).
- **Copy:** replace the "How does weighted voting work?" paragraph with one plain sentence carrying
  the minority-empowerment point, e.g. *"Back what you care about. Piling onto one thing costs more
  than spreading out — so even a few people who care deeply get heard."* Tabs relabeled to plain
  language; "Submit Allocation" → "Cast my votes".

## D2 — Conviction → time-only (never plutocratic)

Component: `ConvictionStaking.tsx` (+ `.module.scss`), fixture `mechanisms.ts`.

- **Remove the free numeric Amount field entirely.** The *duration* is the commitment; everyone
  backs equally. The component pins `amount: 1` on the `stake()` call, so a person's weight = their
  duration multiplier (1w=1×, 1m=2×, 3m=4×, 6m=7×, 1y=12×) — time is the only lever. This is the
  literal reading of "support that grows the longer you back it" and removes the pay-to-win feel.
- **Reframe** "Stake / Amount / Weight" → **"How long will you back this?"** A duration picker with a
  simple **strength-fill** visual that grows as you choose longer commitments (no raw "12x" exposed;
  the multiplier drives a fill bar + plain label like "strong, long-term backing").
- Keep the community aggregate (total weight, # backers) and the **country breakdown** (felt
  transnational collaboration) — both stay correct with `amount = 1`.
- After committing, show a **"Your commitment"** summary card (duration + relative strength) instead
  of re-rendering the form. This also sidesteps the mock's re-stake amount-accumulation.
- **Fixture:** `convictionPattern` seeds `amount: 1` for every staker (duration still varies) so
  seeded demo data matches the time-only model.
- `compact` prop behavior preserved (used by `MandateStage` feed cards).

## Cross-cutting

- All new strings via `t('mechanisms.*', 'English default', vars)`; log a §10 request for Lane F to
  add FR/SW overlays (Lane F owns `src/i18n/`).
- Tokens + module SCSS only; no ad-hoc colors/px. Dark-mode + 360px + keyboard/screen-reader checks.
- **Verify before done:** `npx tsc -b --noEmit` clean, `npm run build` clean, preview walk of each
  mechanism (Problem feed/dashboard, Vote QV, Mandate conviction) with no console errors.
- **Prop shapes unchanged** — `ProblemVoteFlow`, `QVFlow`, `ConvictionStaking` keep their public
  props, so Lanes B/C/E stage shells need no changes (nothing to coordinate in §10 on that front).

## Out of scope

D3 liquid delegation (new `Delegation*` build); any change to mock contracts, stage shells, or other
lanes' files.
