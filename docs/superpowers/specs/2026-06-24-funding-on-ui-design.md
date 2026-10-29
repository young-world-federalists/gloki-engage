# Funding on `ui` — design spec

**Date:** 2026-06-24
**Branch:** `ui`
**Status:** Approved (approach + scope), pending spec review

## 1. Background

`ui` and `main` have diverged by design. `main` carries two of Ouri's in-progress
commits (`459e084` "fundraising with actual coins. there are still errors",
`d28594a` "flow is complete. time for QA") that add a **real-coin funding system**.
`ui` is 236 commits ahead with the UI reform built against the **stub seam**, and
during that reform it deleted the old collaboration-flow architecture the funding
work was built on (budget, fundraising, document, qa, scheduling, taskboard, voting
flows; wish components). PR #20 (`ui → main`) therefore conflicts — `modify/delete`
on ~40 files. The conflict is the expected ui↔main divergence; the canonical
reconciliation is Ouri's (ui → new-features → main).

The decision (Eston, 2026-06-24): rather than leave the divergence or do a
destructive merge, **re-apply Ouri's funding system on top of ui's architecture** —
the real integration. This spec describes that port.

## 2. What Ouri built (the thing we are porting)

A two-level community funding system.

**Per-fund (`FundingFlow` + `funding_flow_contract.py`):** a fund has a name,
description, and optional goal. Members **contribute** coins to it (progress bar,
contributor count, contributions ledger). Within a fund, members do **participatory
budgeting**: add budget items and allocate up to **1000 points** across them; a
Results tab shows the aggregated, normalized split.

**Community-wide (Currency page + `community_contract.py` coin additions):** the
community has a **Commons Treasury** (`centralAccount`, type `central`) that mints
`commons_mint`/day, plus **fund accounts** (type `fund`, owner-gated, no mint).
Members allocate **1000 points** across funds + the Commons Treasury; a daily
**"Pay to Funds"** distribution moves the commons mint to each fund by the
community's collective allocation %. Members also set personal monetary-policy
preferences (`mint`/`burn`/`commons_mint`); the community takes the median.

**Contribute is a dual write** (see `fundingApi.contribute`): (1) `transfer` on the
**community** contract moves `amount` from the member's personal account into the
fund account (real coin movement); (2) `add_contribution` on the **funding** contract
records `{id, participantId, amount, timestamp}` in the ledger. The two stay in sync
client-side.

### Contract interface (the seam the port must preserve)

`funding_flow_contract.py`:
- `set_community_and_fund(community_server, community_agent, community_id, fund_account_name)`
- `get_community()` → `{server, agent, id}`
- `get_fund_account_name()` → string
- `set_config(config)` / `get_config()` → `{name, description, goal}`
- `add_contribution(contribution)` / `get_contributions()` → `[{id, participantId, amount, timestamp}]`
- `add_item(item)` / `get_items()` → `[{id, name, createdBy}]`
- `set_my_allocation(allocation)` / `get_all_allocations()` → `[{participantId, allocation: {itemId: points}}]`

`community_contract.py` additions:
- `create_fund_account(name, owner)` — type `fund`, owner-gated, mint 0
- `fund_transfer(fund_name, to, value)` — only owner disburses
- `get_fund_balance(fund_name)`; type-aware `check_balance` (fund=0 / central=`commons_mint` / personal=`mint`, all burn over elapsed days)
- `set_allocation(allocation)` / `get_account_details()` → `{account: {type, balance}}`
- `distribute_commons()` / `get_distribution_status()` → `{days_since_creation, payment_count, can_distribute}`
- `commons_mint` added to the `parameters` / `medians` set

## 3. Goals / non-goals

**Goals**
- Full parity with Ouri's funding capabilities and UX structure, surfaced on a
  self-contained **Community Funds page** under the community.
- Keep the contract interface **identical** to Ouri's, so his eventual reconciliation
  is a seam swap, not a rewrite.
- Meet ui's quality bar: design-system tokens, `Button` kit, `useAlert`/`Modal` (no
  `alert()`), `useT` i18n with **fr/sw parity**, a11y floor (AA contrast, ≥44px
  targets, single-`h1`, keyboard-operable).
- Everything runs through the **demo stub seam** — no real server calls in components.

**Non-goals**
- Re-introducing the retired flow-menu / the other deleted flows (qa, scheduling,
  taskboard, etc.). Only funding.
- Real blockchain coin behavior or real wall-clock demurrage. The stub simulates
  enough to be legible and demo-immersive.
- Resolving PR #20 by merging `main → ui`. This port supersedes that need on `ui`;
  Ouri reconciles the real-server side separately.

## 4. Approach (chosen: A — faithful port, re-skinned)

Bring over Ouri's exact feature set and UX structure, rewrite the presentation to
ui's standards, wire through the stub seam. Rejected: **B** lift-and-shift (regresses
i18n/a11y/design-system debt the reform removed); **C** fresh re-implementation (most
work, risks drifting from "what Ouri built").

## 5. Architecture

All component reads/writes go through `services/api.ts`
(`contractRead`/`contractWrite`/`deployContract`) → `demo/mockApi.ts` →
`demo/demoRouter.ts` → per-contract JS stub. The port adds one contract type and
extends another at the stub layer; **no component touches a real server.**

### 5.1 Seam / data layer (stubs)
- **New** `src/services/demo/demoContracts/funding.ts` — `fundingRead`/`fundingWrite`
  implementing every `funding_flow_contract.py` method against `demoState`-backed
  per-contract storage.
- **Extend** `src/services/demo/demoContracts/community.ts` with the coin additions:
  `create_fund_account`, `fund_transfer`, `get_fund_balance`, `set_allocation`,
  `get_account_details`, `distribute_commons`, `get_distribution_status`, type-aware
  `check_balance`, and `commons_mint` in parameters/medians. (Already present and
  reused: `transfer`, `get_balance`/`check_balance`, `get_accounts`, parameters.)
- **Register** `'funding_flow_contract.py' → fundingRead/fundingWrite` in
  `demo/demoRouter.ts` (both READ and WRITE maps).
- **Contract sources** (`?raw` labels, not executed on `ui`, kept for fidelity +
  Ouri's handoff): add `src/assets/contracts/funding_flow_contract.py`; sync the coin
  additions into `src/assets/contracts/community_contract.py`.

### 5.2 Service + flow API
- **Extend** `src/services/contracts/community.ts`: `getAccountDetails`,
  `getAllAllocations`, `setAllocation`, `getDistributionStatus`, `distributeCommons`,
  and `commons_mint` in `setParameters`. Add the `IDistributionStatus` type.
- **New** `src/components/collaboration/flows/funding/fundingApi.ts` — ported from
  main; already seam-clean (only `contractRead/Write`). Keep types
  (`Contribution`, `FundConfig`, `FundState`, `BudgetItem`, `ParticipantAllocation`,
  `BudgetState`, `CommunityInfo`) and pure helpers (`totalRaised`,
  `contributionByUser`, `myPointsUsed`, `getAggregated`).

### 5.3 UI
- **Community Funds page** — rework `src/components/community/Currency.tsx` into the
  four sections (balance + send already exist; add monetary-policy prefs, fund list
  with live balances, community allocation across funds + Commons Treasury with "Pay
  to Funds"). Re-skinned to ui's design system + a11y; named **"Community Funds"**.
- **Per-fund detail + create** — port `FundingFlow.tsx` (setup dialog, contribute
  form, contributions list, budget items, allocation/results tabs) into a fund-detail
  view **reached from the funds page** (fund list → detail; "Create fund" → setup
  dialog → `deployContract('funding_flow_contract.py')` + `create_fund_account`). Not
  re-added to the retired flow registry.

### 5.4 Demo seed data
Seed a couple of pre-funded funds (in `demo/seedDemoCommunity.ts` / `fixtures/`) with
contributions, budget items, and allocations, plus a non-zero Commons Treasury, so the
page opens immersive (consistent with the existing "immersive sample data" standard).

### 5.5 i18n
All new strings via `useT` with English defaults, and **fr + sw overlays at parity**
(the project enforces equal key counts and zero var-drift). New keys grouped under
e.g. `funds.*`.

## 6. Behavioral decisions (defaults approved 2026-06-24)

1. **Page name** → "Community Funds", replacing the current "Community Support
   Points" Currency page (one page, not two).
2. **Per-fund UI** → reached from the funds page (list → detail), not the retired
   flow menu.
3. **Daily commons distribution** → "Pay to Funds" simulates a day-step on click
   (distributes the current Commons Treasury balance across funds by collective
   allocation %, increments `payment_count`), rather than gating on wall-clock time.
   `can_distribute` toggles per click-step so the button has visible state.

## 7. Implementation units (feeds the plan)

1. **Seam/data layer** — `funding.ts` stub, `community.ts` stub additions, router
   registration, `.py` sources. Verifiable in isolation via DevTools `contractRead`.
2. **Service + flow API** — `community.ts` service methods + `fundingApi.ts`.
3. **Community Funds page** — Currency.tsx rework (4 sections), re-skinned.
4. **Per-fund detail + create** — FundingFlow port, surfaced from the funds page.
5. **Demo seed data** — funds/contributions/items/allocations + commons balance.
6. **i18n** — en defaults + fr/sw parity for all new keys.
7. **Verification** — `tsc -b` clean, `npm run dev` walkthrough, fr/sw @360px
   light+dark.

Likely build order: 1 → 2 → (3, 4 in parallel against the stubbed seam) → 5 → 6 → 7.

## 8. Testing / verification

No test framework (per CLAUDE.md). Verify via `npm run dev` + browser DevTools and the
preview workflow:
- Create a fund → appears in the list with zero balance.
- Contribute → personal balance drops, fund balance rises, contribution appears in the
  ledger, progress bar advances (dual write stays in sync).
- Add budget items, allocate points, check Results aggregation.
- Community allocation across funds + commons; "Pay to Funds" distributes by %.
- `tsc -b` clean (production build gate). fr/sw verified at 360px, light + dark.

## 9. Risks / open items

- **Distribution fidelity.** Ouri's real `distribute_commons` is time/median-driven;
  the stub approximates. The contract *interface* stays identical, so this is a stub
  implementation detail, not a seam change — but the demo's numbers won't match a real
  chain. Acceptable per decision 3.
- **`community_contract.py` immutability.** Contracts are immutable after deploy (real
  side). On `ui` the `.py` is a label only; syncing it is for Ouri's handoff. Flag for
  Ouri that the community contract gained methods.
- **Naming reconciliation.** Ouri uses "credits" / "Community Currency"; ui uses
  "Support Points" / "points". Port standardizes on ui's vocabulary + the "Community
  Funds" page name; `CURRENCY_SYMBOL` becomes an i18n'd symbol, not a hardcoded
  "credits".
- **Seed-version bump.** Adding seed funds changes demo-data shape → bump
  `DEMO_VERSION` (currently `global-v4`) so stale localStorage re-seeds.

## 10. Out of scope / for Ouri

- Real-server wiring of the funding contracts (Ouri, on new-features).
- The other deleted flows (qa/scheduling/taskboard/etc.) — staying deleted.
- Merging `main → ui` to clear PR #20 — superseded by this port on the `ui` side.
