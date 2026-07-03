---
name: gloki-seam-and-demo-data
description: Use when touching any data read/write in Communities2/Gloki — adding a contract call, a new contract method, seeded demo content, fixtures, or personas; when the UI looks frozen after a write; when demo data looks stale, wrong, or missing after a change; when deciding whether to bump DEMO_VERSION; when resetting local demo state; when a byline shows a raw key; when tempted to fetch/axios/EventSource from a component or to rename a contract method to match UI vocabulary ("solution", "mandate").
---

# Gloki: The Data Seam and the Demo Layer

## Overview

**Core principle: every component reads and writes data through ONE seam — `src/services/api.ts` — which on this branch is backed entirely by a localStorage mock (`src/services/demo/`). The seam's method and field names are Ouri's real Python contract wire names and must byte-match them forever; everything behind the seam is disposable demo plumbing.**

Context a zero-knowledge session needs: this repo is the `ui` branch of a three-branch flow (`ui` = UI built on stubs → `new-features` = Ouri, the backend partner, wires real server calls → `main` = live). The whole point of the seam is that Ouri swaps the internals of `src/services/` without touching a single component. Anything that leaks past the seam — a direct fetch, a "consistent" method rename, a component importing the mock router — silently breaks that hand-off in a way nothing on this branch can detect (there is no test framework and no real server here).

The demo layer is not a toy: it is the production deploy. Push to `ui` deploys to GitHub Pages, and every visitor's "backend" is this localStorage mock. Demo-data mistakes are live-site mistakes.

## When NOT to use this skill

| If the task is about... | Use instead |
|---|---|
| Writing/reading the Python contract dialect itself (`Storage()`, `master()`, `__init__` re-run rules, immutability patterns) | **gloki-python-contracts** |
| `useFlowContract` vs `resolveInitiativeStageContract`, Redux slices, flow registry, routing, directory map | **gloki-frontend-architecture** |
| Build commands, dev server, deploy pipeline, base paths, slow-drive I/O discipline | **gloki-build-env-run** |
| QV math, trust/verification model, mandate semantics (what the methods MEAN) | **gloki-governance-domain** |
| "UI not updating" triage beyond the write-then-refetch rule | **gloki-debugging-playbook** |
| Push gates, locked product decisions, who owns `main` | **gloki-change-control** |
| Verifying a change actually works (preview lore, evidence standards) | **gloki-verification-and-qa** |
| Deleting demo/fixture code safely | **gloki-refactor-and-dead-code** |

## 1. The seam rule

`src/services/api.ts` exports exactly seven functions (verified 2026-07-02 @ c26cdc4):

| Export | Signature (shape) | Returns |
|---|---|---|
| `contractRead` | `({ serverUrl, publicKey, contractId, method: IMethod })` | contract-defined value |
| `contractWrite` | same shape as `contractRead` | contract-defined value (may be `{ error }`) |
| `deployContract` | `({ serverUrl, publicKey, name, contract, code, profile? })` | `{ id }` **or** plain string — see §5 |
| `joinContract` | `({ serverUrl, publicKey, address, agent, contract, profile? })` | — |
| `getContracts` | `({ serverUrl, publicKey })` | `IContract[]` |
| `isExistAgent` / `registerAgent` | `({ serverUrl, publicKey })` | — |

Rules, each with its reason:

- **All contract data access goes through these seven functions.** Never `fetch`, `axios`, or `new EventSource(...)` from a component — the mock intercepts nothing at the network layer; a direct call either hits a nonexistent server or, worse, works in a way Ouri's swap breaks.
- **Never import `mockApi`, `demoRouter`, `demoRegistry`, or `demoState` from a component.** Those are the mock's internals; they will not exist behind the real seam. Sanctioned exceptions that DO exist in the codebase (don't "fix" them, don't multiply them):
  - `services/demo/fixtures/*` imports for **display data** (personas, presence copy, mandate display extras) — e.g. `OnboardingFlow.tsx`, `MandateDocument.tsx`. Fixtures are demo-branch presentation content, not data access.
  - `*.demo.ts` sidecar modules (e.g. `src/components/stages/ProblemStage.demo.ts`) — explicitly-labeled demo-only helpers that reach into the mock layer (`mockDeployDirect`, `initiativeWrite`) to fabricate demo state. If you must bypass the seam for demo scaffolding, put it in a `.demo.ts` file with a header comment saying so.
- **New backend behavior = a new `case` in the matching `src/services/demo/demoContracts/<type>.ts` handler + an entry in `docs/FOR_OURI_seam.md`** (see §8). Never a new endpoint, never a new transport.
- Convenience wrappers (e.g. `src/components/collaboration/flows/voting/qvApi.ts`, `src/services/contracts/community.ts`) are fine and encouraged — they call `contractRead`/`contractWrite` internally.

## 2. The IMethod convention and wire-name discipline

`IMethod` (`src/services/interfaces.ts:16`):

```ts
export interface IMethod {
  name: string;                          // EXACT Python method name
  arguments?: string[];
  values?: Record<string, unknown>;      // Python kwargs go here
  parameters?: Record<string, unknown>;
}
```

Callers put Python kwargs in `values`. Real example (`src/services/contracts/community.ts:44`):

```ts
await contractWrite({
  serverUrl, publicKey, contractId,
  method: { name: 'set_property', values: { key: 'name', value: communityName } } as IMethod,
});
```

**THE one rule that must not break** (codified in `docs/FOR_OURI_seam.md`): `method.name` and every field name in `values`/returned objects must **byte-match Ouri's real Python contracts** — snake_case, `proposal` vocabulary. The UI says "Solutions" and "Mandate"; the wire says `add_proposal`, `get_proposals`, `proposal_id`, `get_results`. History: when the app-wide Proposals→Solutions rename happened (S5/S6, 2026-06), the temptation to rename `add_proposal → add_solution` "for consistency" was explicitly rejected and codified — a rename would pass every check on this branch and break invisibly at the real-server swap. During the funding work (2026-06-25), *inferred* method names broke parity with Ouri's real contract (it's `distribute`, not `distribute_commons`; monetary params travel on a transfer carrier — there is NO `set_parameters`). Before adding any contract call, read the real definition: `git show main:src/...` for Ouri's wrappers and the `.py` sources where they exist.

**Discovering valid method names:** grep the `case` labels of the demo handler for that contract type. Example (verified):

```bash
grep -n "case '" src/services/demo/demoContracts/approval.ts
# get_proposals / get_approvals / get_approval_counts / get_my_approvals /
# add_proposal / approve / withdraw_approval / request_expert_review /
# add_expert_review / suggest_proposal_merge
grep -n "case '" src/services/demo/demoContracts/qv.ts
# get_config / get_proposals / get_allocations / get_my_allocation /
# get_results / add_proposal / set_credits / set_status / allocate
```

If the method you need has no `case`, it does not exist — add it to the stub AND to `docs/FOR_OURI_seam.md` in the same change (§8).

## 3. The demo-state model (what's actually in localStorage)

All demo state is localStorage. Key inventory (every name verified in code):

| Key | Defined at | Contents |
|---|---|---|
| `gloki_demo_contracts` | `demoRegistry.ts:5` | Registry: demo contract id → metadata incl. its Python filename (`contract: 'qv_contract.py'` etc.) |
| `gloki_demo_state_<contractId>` | `demoState.ts:5` | Per-contract state blob mirroring the Python contract's Storage dicts |
| `gloki_demo_seeded_<communityId>` | `seedDemoCommunity.ts:33` | `'true'` flag — this community's fixtures were seeded |
| `gloki_demo_version` | `mockApi.ts:18` | Last-seeded `DEMO_VERSION` string |

Mechanics:

- **Demo IDs** look like `demo-<kind>-<ts36>-<rnd>` (`kind ∈ comm|init|stage|mod`); detection is a prefix check, `isDemoContract` at `demoRegistry.ts:34`.
- **Routing:** `demoRouter.ts` looks up the contract's Python filename in the registry and dispatches `routeRead`/`routeWrite` to one of **13 handlers** in `demoContracts/`: community, initiative, problemVote, approval, qv, conviction, modification, chat, discussion, concerns, merge, profile (`gloki_contract.py`), funding.
- **Orphan auto-registration** (`demoRouter.ts`, `autoRegister`): a contract ID that arrives before/without a registered deploy — typically a flowId rehydrated from a previous demo generation's localStorage — is auto-registered as a generic stub (`contract: 'unknown'`): reads return `null`, writes are accepted no-ops. This is why stale IDs degrade instead of crashing. If a flow mysteriously reads nothing, check whether its ID resolves to an `orphan` entry in `gloki_demo_contracts`.
- Fake latency lives in `api.ts`: 50ms agent calls, 200ms deploys — don't add more delays in components.
- `demoUrlShare.ts` serialises the entire demo state into a `#demo=<base64url>` URL hash so a populated session can be shared; `App.tsx` hydrates from it before first render.

## 4. THE write-then-refetch rule

**The demo seam emits NO `contract_write` events.** `src/services/eventStream.ts` is a *real* SSE client (`new EventSource(serverUrl + '/stream...')`) that the mock layer never feeds — `mockApi.ts` contains zero eventStream/emit calls (verified). On the real backend, writes trigger SSE events and event-driven refreshes; on this branch those paths are permanently dead.

**Therefore: after every `contractWrite`, explicitly re-run the read.** Never build UI that waits on a `useEventStream('contract_write')` refresh.

History: during the Community Funds work (2026-06-25) the UI froze after contribute/allocate — code review passed, only a browser pass caught it — because the flows waited for write events that never fire. The fix pattern is now canonical. Real example, `QVFlow.tsx` (verified @ c26cdc4, lines ~145-149):

```ts
const handleSubmitAllocation = async () => {
  ...
  await api.allocate(serverUrl, publicKey, contractId, credits);
  await fetchData(); // demo seam emits no write events → re-fetch; flips to locked
  ...
};
```

where `fetchData` is the same `useCallback` the mount effect uses (`useEffect(() => { if (isReady) fetchData(); }, [isReady, fetchData])`). Pattern: one memoized fetch function, called on mount AND after every write.

## 5. deployContract return-shape guard

`deployContract` may return `{ id: string }` or a plain string (ARCHITECTURE.md documents both; the real server and the mock have differed). Always guard:

```ts
const contractId = (response as { id?: string }).id || (response as string);
```

Real occurrences: `useFlowContract.ts:96` and `:201`, `services/contracts/community.ts:40`. Copy the guard; don't assume one shape.

## 6. DEMO_VERSION discipline

`DEMO_VERSION = 'global-v16'` at `src/services/demo/mockApi.ts:17`, persisted under `gloki_demo_version`. On every `getContracts`, `ensureDefaultDemoCommunity` (`mockApi.ts:143`) compares stored vs current: on mismatch it **deletes every localStorage key starting `gloki_demo` or `gloki_default_demo`** and re-runs `seedAllDemoCommunities`.

| Change you made | Bump? | Why |
|---|---|---|
| Fixture content/shape, seed logic, personas, seeded permissions — anything a *returning* visitor must see | **YES** | Their `gloki_demo_seeded_*` flags block reseeding; without a bump they keep the old world. "Stale demo" reports from returning visitors are cache, not code. |
| Component/UI-only change, copy, styling, new read of existing state | **NO** | A bump wipes every visitor's accumulated demo state (their votes, posts, created communities) for nothing. S14 and S15 both shipped with no bump, deliberately. |

Precedent: versions have marched `global-v2 … global-v16` across sessions; the bump lands in the same commit as the fixture change. Because push-to-`ui` is a production deploy, a bump is a user-visible reset — mention it to Eston at the push gate (see gloki-change-control).

**Reset your own local demo state** (DevTools console — do NOT bump DEMO_VERSION just to reseed locally):

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('gloki_demo') || k.startsWith('gloki_default_demo'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Removing `gloki_demo_version` alone also forces a full wipe+reseed on next load (the version-mismatch path clears the rest).

## 7. Fixture and seeding discipline

Layout (verified): `src/services/demo/fixtures/` is split by lane — `identity.ts` (16 globally-diverse `PERSONAS`, publicKey format `demo-user-<cc>-<name>`, plus deterministic `pick()` LCG so seeded state is reproducible), `problems.ts` (`INITIATIVES`), `deliberation.ts` (`PROPOSALS_BY_KEY`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY`, `EXPERTS`, …), `mechanisms.ts` (vote/allocation patterns), `mandate.ts`, `community.ts` (`DEMO_COMMUNITIES`: exactly 4 keys — `health`, `digital`, `climate`, `economy`), `presence.ts`. `seedDemoCommunity.ts` joins them **by initiative `key`** (`PROPOSALS_BY_KEY[seed.key]` etc.) and deploys that community's 2–3 initiatives (9 total across the 4 seeded communities), spread so every pipeline stage is populated somewhere *globally* — not one-per-stage per community (per the `problems.ts` header comment).

Hard-won rules:

- **Seeded-persona identity needs THREE coordinated pieces or bylines show a truncated raw key** (S12 incident, recorded in project memory 2026-07):
  1. a profile registration — each persona/expert is registered as a `gloki_contract.py` contract **whose id IS the publicKey** (`seedDemoCommunity.ts` `registerDemoContract({ id: p.publicKey, contract: 'gloki_contract.py', ... })`), so `profileRead` resolves it (`demoContracts/profile.ts` falls back `getPersona(contractId) → expertProfile(contractId)`);
  2. community membership via `communityWrite(communityId, { name: 'become_member', values: { key, value: [] } })`;
  3. the content itself referencing that key as author/expert.
- **Scope expert memberships.** Experts join ONLY communities hosting an initiative they actually reviewed (`reviewingExperts` set in `seedDemoCommunity.ts`, S12). The original version joined every expert to every community, which inflated member counts, country tallies, and 50%-support participation gates **app-wide** — an Opus review catch. Any new seeded cohort must be scoped the same way.
- **The logged-in demo user authors nothing.** All seeded content is authored by `demo-user-*` personas; the visitor's key is whatever they generated at login (preview sessions conventionally seed `'a'.repeat(64)` — see gloki-verification-and-qa). Consequence: **author-only UI branches (edit/withdraw/own-post affordances) are unreachable in a fresh demo** unless you inject content authored by the current user (a `.demo.ts` helper like `ProblemStage.demo.ts` is the sanctioned way) or create it live through the UI first.
- **Last-index wins the QV vote** (S6 trap): `qvAllocationPattern` in `fixtures/mechanisms.ts` hands the leftover credits to the LAST proposal, so the last-seeded index reliably wins. Seed the intended winner at the last index; don't fight the pattern.
- Seeded timestamps are `Date.now()` **milliseconds**. A card that multiplies by 1000 (expecting seconds) shows "20598159 days left" (Batch 16 incident) — render the state, don't just review the code.

## 8. FOR_OURI_seam.md moves with the stub

`docs/FOR_OURI_seam.md` is the single source of truth Ouri implements against: every stub method, field, and behavioral note the UI relies on, organized by stage. **Any change to a `demoContracts/*` handler (new method, new field, changed semantics) must update FOR_OURI_seam.md in the same change.** Cautionary counter-example: S13 added `set_property`/`get_properties` to the initiative stub (they existed only on community) but FOR_OURI_seam.md was **NOT** updated — at HEAD `c26cdc4` the doc (untouched since S7) still omits those methods and the `mandate_ratification` property, an open gap flagged in gloki-docs-and-writing §2 as the first candidate fix when touching that doc. The rule "the stub layer and the FOR_OURI doc must move together" exists precisely because it was violated here. A stub the doc doesn't mention is a method Ouri will never build.

Also note in the doc when the stub is deliberately more permissive than production should be (e.g. `add_expert_review` — the stub accepts anyone; the real contract MUST role-gate).

## 9. Read paths that secretly write

One seam-adjacent trap worth stating here (full detail in **gloki-frontend-architecture**): `useFlowContract` **deploys a contract on mount** when none is stored — a display-only component calling it is a write past the trust gate (S11 confirmed bug: a preview card silently deployed contracts). For read-only access to a parent's stage sub-contract use `resolveInitiativeStageContract` (`src/services/contracts/initiative.ts:65`), which is pure `contractRead`.

## Provenance and maintenance

All facts verified 2026-07-02 against branch `ui` @ commit `c26cdc4` by direct file reads/greps, except items marked "recorded in project memory" (S6/S11/S12/S13, funding 2026-06-25, Batch 16 — incident history, not re-reproducible from HEAD). Re-verify the volatile ones before relying on them:

| Fact | Re-verify with |
|---|---|
| api.ts export list (7 functions) | `grep -n "^export" src/services/api.ts` |
| `DEMO_VERSION` current value + line | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| localStorage key names | `grep -n "gloki_demo" src/services/demo/{demoRegistry,demoState,seedDemoCommunity,mockApi}.ts` |
| 13 demo handlers | `ls src/services/demo/demoContracts/` |
| Valid methods for a contract type | `grep -n "case '" src/services/demo/demoContracts/<type>.ts` |
| Mock emits no events | `grep -n "eventStream\|emit" src/services/demo/mockApi.ts` (expect no hits) |
| Write-then-refetch example | `grep -n "fetchData" src/components/collaboration/flows/voting/QVFlow.tsx` |
| Return-shape guard sites | `grep -rn "id?: string" src/components/collaboration/flows/shared/useFlowContract.ts src/services/contracts/community.ts` |
| Seam doc current | `head -15 docs/FOR_OURI_seam.md` |

Slow-drive discipline applies to every command above: run them one at a time, with specific paths — never a broad recursive grep (see gloki-build-env-run).
