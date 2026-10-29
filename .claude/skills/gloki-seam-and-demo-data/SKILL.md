---
name: gloki-seam-and-demo-data
description: Use when touching any data read/write in Communities2/Gloki — the real/demo split per page (?demo=true, Page.demo.tsx, useDemoMode), adding a contract call, a new contract method, seeded demo content, fixtures, or personas; when a page looks frozen after a write; when demo data looks stale, wrong, or missing; when deciding whether to bump DEMO_VERSION; when resetting local demo state; when a byline shows a raw key; when tempted to fetch/axios/EventSource from a component or to rename a contract method to match UI vocabulary ("solution", "mandate").
---

# Gloki: The Seam, Real vs Demo, and Demo Data

## Overview

**Core principle: one app, two data layers, chosen per page by the URL.** `/page` is the real page on
the real network; `/page?demo=true` is the page's demo variant on demo data (`docs/DEMO_MODE.md` is
the spec). Components never touch a server: real variants go through the real services in
`src/services/`, demo variants through the demo layer in `src/services/demo/`. Wire names — contract
method and field names — byte-match the real contracts in `src/assets/contracts/`, in both layers.

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

```tsx
// Page.tsx — the default export is the switch
const Page: React.FC<Props> = (props) =>
  useDemoMode() ? <PageDemo {...props} /> : <PageReal {...props} />;
```

| Piece | Where | Does |
|---|---|---|
| `useDemoMode()` | `src/hooks/useDemoMode.ts` | `true` when the URL has `?demo=true` |
| `useDemoLink()` / `withDemo(path)` | same file | keeps `?demo=true` on a demo variant's links |
| `<DemoNotice />` | `src/components/shared/DemoNotice.tsx` | the banner every demo variant shows first, with "Show real data" |
| `PageDemo` | `Page.demo.tsx`, next to the page | the demo variant; deleted by hand when done |

Rules (full text in `docs/DEMO_MODE.md`):

1. **A demo variant never reaches the network**; a real variant never uses the demo layer. New code
   imports `services/demo` only from `*.demo.tsx` files.
2. **Demo data uses demo ids** (`demo-…`). Both states share the Redux store and some browser storage
   (starred/hidden, the flow-contract cache), all keyed by id, so disjoint ids keep them apart — even in
   two tabs. A reload doesn't clean mixed browser storage; don't rely on it.
3. **Links inside a demo variant keep the flag** (`useDemoLink()`); shared chrome (menu, header,
   footer) uses plain paths, so there's always a way back to real.
4. **The flag covers page content, not the frame** — header, menu, footer and the signed-in identity
   are real in both states.
5. **Every demo variant shows `<DemoNotice />` first** and lives in `*.demo.tsx`, so it is never mistaken
   for real and a cleanup is one search: `git ls-files '*.demo.tsx'`.

A page without a demo variant ignores the flag. Which pages have two states, which are still mixed,
real-only or demo-only: the table in `docs/DEMO_MODE.md`.

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

**Transition.** Pages without a demo variant still mix the layers by id: `contractRead` /
`contractWrite` send any `demo-…` id to the demo layer, and `getContracts` merges the seeded demo
communities into the real list. Some components branch on `isDemoContract(id)` for that reason. Each
page's two-state split removes its share of this; don't add new id-based branching.

## 4. The refresh rule — it differs per layer

- **Demo writes emit no events.** After a demo write, re-run the read explicitly (one memoised fetch,
  called on mount and after every write). Waiting for an event in a demo variant waits forever.
- **Real writes are confirmed by their event**, and other people's writes arrive as events. A real
  variant awaits the write, then relies on `useContractSync` — no polling hacks.

Transitional components that serve both layers show the pattern
`if (isDemoContract(contractId)) await fetchData();` after a write.

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
| Transitional id branching left | `grep -rln "isDemoContract(" src/components src/pages` |
