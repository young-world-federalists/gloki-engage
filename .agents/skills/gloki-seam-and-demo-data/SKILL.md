---
name: gloki-seam-and-demo-data
description: Use when touching any data read/write in Communities2/Gloki — the real/demo split per page (?demo=true, Page.demo.tsx, useDemoMode), adding a contract call, a new contract method, seeded demo content, fixtures, or personas; when a page looks frozen after a write; when demo data looks stale, wrong, or missing; when deciding whether to bump DEMO_VERSION; when resetting local demo state; when a byline shows a raw key; when tempted to fetch/axios/EventSource from a component or to rename a contract method to match UI vocabulary ("solution", "mandate").
---

# Gloki: The Seam, Real vs Demo, and Demo Data

## Overview

**Core principle: one app, two data layers, chosen by the URL flag — never by the id.** `/page` uses
the real network; `/page?demo=true` uses the demo layer (`docs/DEMO_MODE.md` is the spec). Every
contract call follows the page's layer, so an id from the other layer is simply "not found".
Components never touch a server: they go through `src/services/`. Wire names — contract method and
field names — byte-match the real contracts in `src/assets/contracts/`, in both layers.

Eston designs new pages and features as demo variants on top of the working real app; Ouri builds
their real side; both compare `/page` and `/page?demo=true`; the demo variant is deleted by hand when
it's no longer needed.

## When NOT to use this skill

| If the task is about... | Use instead |
|---|---|
| The Python contract dialect (`Storage()`, `master()`, `__init__` re-runs, immutability) | **gloki-python-contracts** |
| `useFlowContract`, Redux slices, flow registry, routing, directory map | **gloki-frontend-architecture** |
| Build commands, dev server, deploy, the local node | **gloki-build-env-run** |
| What the methods MEAN (QV math, trust, mandates) | **gloki-governance-domain** |
| "UI not updating" triage beyond the refresh rule | **gloki-debugging-playbook** |
| Push gates, locked decisions, change classes | **gloki-change-control** |
| Deleting demo/fixture code safely | **gloki-refactor-and-dead-code** |

## 1. Two states per page

Every route is wrapped as one of three kinds (`src/components/shared/PageModes.tsx`):

| Wrapper | Without the flag | With `?demo=true` |
|---|---|---|
| `TwoStatePage` (same component, or `real` + `demo` variants) | real page | demo version + `<DemoNotice />` |
| `RealOnlyPage` | real page | real page + "the demo flag is ignored" notice |
| `DemoOnlyPage` | "not yet implemented" + link to the demo | demo page + `<DemoNotice />` |

| Piece | Where | Does |
|---|---|---|
| `useDemoMode()` | `src/hooks/useDemoMode.ts` | demo mode: `?demo=true`, or carried over from the previous page |
| `DemoFlagUrlSync` | same file (mounted in `App.tsx`) | writes `?demo=true` into the URL of a page reached in demo mode |
| `setDemoDataMode` / `isDemoDataMode` | `src/services/dataMode.ts` | the page's data layer — set by the wrappers while the page renders, reset to real by `App` on navigation |
| `communitiesForMode(contracts)` | same file | the communities a page lists (demo communities in demo mode, real ones otherwise) |
| `<DemoNotice />` | `src/components/shared/DemoNotice.tsx` | the demo banner, with "Show real data" |
| `useInitiativeFound(id)` | `src/hooks/useInitiativeFound.ts` | "not found" for issue/mandate pages in the page's layer |

Rules (full text in `docs/DEMO_MODE.md`):

1. **The flag decides the layer for every call**; never branch on `isDemoContract(id)` to pick one.
2. **Demo data uses demo ids** (`demo-…`), so both states can share the Redux store and browser storage
   (keyed by id) without colliding — even in two tabs. A reload doesn't clean mixed browser storage.
3. **The flag sticks to in-app navigation** until "Show real data" / "Leave demo mode" (a navigation with
   `LEAVE_DEMO_STATE`) or `?demo=false`; no link needs to carry it by hand.
4. **The flag covers page content, not the frame** — header, menu, footer, identity are real.
5. A separate demo variant lives in `*.demo.tsx` next to its page; a cleanup is one search:
   `git ls-files '*.demo.tsx'`.

Known limit: the layer is one setting for the page being shown; an async call from the previous page
that finishes after a navigation can land in the new page's layer.

## 2. The real seam

`src/services/api.ts` exports: `isExistAgent`, `registerAgent`, `getContracts`, `getContractsOnChain`,
`deployContractOnChain`, `contractWriteOnChain`, `contractReadOnChain`, `deployContract`,
`joinContract`, `contractWrite`, `contractRead`.

- **`*OnChain`** — the raw IBC protocol (`/ibc/app/<identity>/<contract>/<method>?action=…`). Used by the
  real service modules: `services/contracts/glokiEngage{Community,Initiative}.ts`,
  `components/identity/agent/digitalAgentContract.ts`, `verificationRegistry.ts`,
  `applicationSettings.ts`.
- **`contractRead` / `contractWrite`** — real for real ids. A contract registered in
  `contractHosts.ts` (every issue contract) is called on its **creator's** node as the creator's agent,
  and member-specific methods get the caller's key added as `agent` (`INITIATIVE_MEMBER_METHODS`).
  Members never join issue contracts.
- **`joinContract`** — real `join_contract` (the joiner's node connects to the inviter's).
- **Writes are confirmed by their event.** A write returns only an ack id; the result (the method's
  return value, including `{error}` refusals) arrives on the SSE stream. `contractWrite` waits for it
  (`watchForChainAck` on the user's stream, or `openScopedAckStream` when writing through another
  agent). Other people's writes arrive the same way: `useContractSync` / `useContractSyncMany`
  re-read on a `contract_write` event, including for issues followed on their creator's node
  (`eventStreamService.watchContract`).

Convenience wrappers (`flows/voting/qvApi.ts`, `services/contracts/community.ts`, …) are fine — they
call the seam internally.

## 3. The demo layer

- **Ids** look like `demo-<kind>-<ts36>-<rnd>`; `isDemoContract` (`demo/demoRegistry.ts`) is a prefix check.
- **Routing**: `demo/demoRouter.ts` looks up the contract's Python filename in the registry and
  dispatches to one of 13 handlers in `demo/demoContracts/` (community, initiative, problemVote,
  approval, qv, conviction, modification, chat, discussion, concerns, merge, profile, funding).
- **Orphans**: an id that arrives without a registered deploy (e.g. rehydrated from an old demo
  generation) auto-registers as a stub — reads `null`, writes no-ops — so stale ids degrade instead of
  crashing (`autoRegister`).
- **Other demo modules**: `verificationDemo.ts` / `verificationSim.ts` / `dailyVerificationSim.ts`
  (simulated invitations, calls, daily session), `betaForum.ts`, `notificationRuntime.ts`,
  `demoUrlShare.ts` (`#demo=<base64url>` share links, hydrated in `App.tsx` before first render).
- **localStorage keys**: `gloki_demo_contracts` (registry), `gloki_demo_state_<contractId>` (per-contract
  state), `gloki_demo_seeded_<communityId>` (seed flag), `gloki_demo_version`.

`getContracts` merges the seeded demo communities into the signed-in user's contract list; pages list
only their own layer through `communitiesForMode`.

## 4. The refresh rule — it differs per layer

- **Demo writes emit no events.** After a demo write, re-run the read explicitly (one memoised fetch,
  called on mount and after every write). Waiting for an event in a demo variant waits forever.
- **Real writes are confirmed by their event**, and other people's writes arrive as events. A real
  variant awaits the write, then relies on `useContractSync` — no polling hacks.

Components that serve both layers (most stage flows) do
`if (isDemoDataMode()) await fetchData();` after a write.

## 5. IMethod and wire-name discipline

`IMethod` (`src/services/interfaces.ts`): `{ name, arguments?, values?, parameters? }` — Python kwargs go
in `values`, keyed by the exact Python parameter name.

```ts
await contractWrite({
  serverUrl, publicKey, contractId,
  method: { name: 'add_proposal', values: { text, co_authors, commitments, sources, metrics, cause_id } } as IMethod,
});
```

**The one rule that must not break** (`docs/FOR_OURI_seam.md`): `method.name` and every field name match
the real contract — snake_case, `proposal` vocabulary. The UI says "Solutions" and "Mandate"; the wire
says `add_proposal`, `get_proposals`, `proposal_id`, `get_results`. Never rename wire methods for
consistency with UI copy.

**Finding valid names**: the real contract's `def` lines (`src/assets/contracts/*.py`) for real
variants; the demo handler's `case` labels for demo variants — and the two must agree:

```bash
grep -n "    def " src/assets/contracts/gloki_engage_initiative_contract.py
grep -n "case '" src/services/demo/demoContracts/approval.ts
```

## 6. deployContract return shape (demo)

The mocked `deployContract` may return `{ id }` or a plain string. Guard:
`const contractId = (response as { id?: string }).id || (response as string)` (as in `useFlowContract.ts`).

## 7. DEMO_VERSION discipline

`DEMO_VERSION` lives in `src/services/demo/mockApi.ts` and is persisted under `gloki_demo_version`. On
`getContracts`, `ensureDefaultDemoCommunity` compares stored vs current; on mismatch it deletes every
key starting `gloki_demo` or `gloki_default_demo` and re-seeds.

| Change | Bump? | Why |
|---|---|---|
| Fixture content/shape, seed logic, personas, seeded permissions | **YES** | Seed flags block re-seeding; without a bump returning visitors keep the old world |
| UI-only change, copy, styling, new read of existing state | **NO** | A bump wipes everyone's accumulated demo state for nothing |

The bump lands in the same commit as the fixture change; mention it at the push gate — it resets every
visitor's demo data.

**Reset your own local demo state** (DevTools console — don't bump DEMO_VERSION for this):

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('gloki_demo') || k.startsWith('gloki_default_demo'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

## 8. Fixture and seeding discipline

`src/services/demo/fixtures/` is split by area: `identity.ts` (globally diverse `PERSONAS`, publicKey
format `demo-user-<cc>-<name>`, deterministic `pick()` LCG), `problems.ts` (`INITIATIVES`),
`deliberation.ts` (`PROPOSALS_BY_KEY`, `EXPERTS`, …), `mechanisms.ts`, `mandate.ts`, `community.ts`
(`DEMO_COMMUNITIES`), `presence.ts`, `verification.ts`. `seedDemoCommunity.ts` joins them **by initiative
`key`** and spreads initiatives so every pipeline stage is populated somewhere.

- **Seeded-persona identity needs three pieces or bylines show a truncated key**: a profile registration
  (a `gloki_contract.py` demo contract whose id IS the publicKey), community membership
  (`become_member`), and content referencing that key as author/expert.
- **Scope expert memberships** to communities hosting an initiative they reviewed — joining every expert
  everywhere inflated member counts and participation gates app-wide.
- **The logged-in user authors nothing seeded.** Author-only UI is unreachable in a fresh demo unless
  you create content through the UI, or inject it with a `*.demo.ts` helper (e.g.
  `src/components/stages/ProblemStage.demo.ts`).
- **Last index wins the QV vote**: `qvAllocationPattern` gives leftover credits to the LAST proposal — seed
  the intended winner last.
- Seeded timestamps are `Date.now()` **milliseconds** — render the state, don't just review the code.

## 9. docs/FOR_OURI_seam.md moves with the contracts

`docs/FOR_OURI_seam.md` records every contract method and field the UI relies on — what a demo variant
does on the demo layer, and what the real variant needs from the real contract. Any change to a real
contract's methods, or to a demo handler a page relies on, updates that doc in the same change. Note
where a demo stub is more permissive than the real contract must be (e.g. role-gated methods).

## 10. Read paths that secretly write

`useFlowContract` **deploys a contract on mount** when none is stored (demo/collab flows). A display-only
component must use `resolveInitiativeStageContract` (`src/services/contracts/initiative.ts`) instead,
which only reads. Detail: **gloki-frontend-architecture**.

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Re-verify volatile facts before relying on them:

| Fact | Re-verify with |
|---|---|
| api.ts exports | `grep -n "^export" src/services/api.ts` |
| Pages with two states | `git ls-files '*.demo.tsx'`; table in `docs/DEMO_MODE.md` |
| `DEMO_VERSION` value | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| Demo localStorage keys | `grep -n "gloki_demo" src/services/demo/{demoRegistry,demoState,seedDemoCommunity,mockApi}.ts` |
| 13 demo handlers | `ls src/services/demo/demoContracts/` |
| Real contract methods | `grep -n "    def " src/assets/contracts/<file>.py` |
| Member-specific issue methods | `grep -n -A10 "INITIATIVE_MEMBER_METHODS" src/services/contracts/glokiEngageInitiative.ts` |
| No id-based layer choice left | `grep -rn "isDemoContract(" src --include=*.tsx --include=*.ts \| grep -v services/demo` |
| Route kinds | `grep -rn "TwoStatePage\|RealOnlyPage\|DemoOnlyPage" src/App.tsx src/pages` |
