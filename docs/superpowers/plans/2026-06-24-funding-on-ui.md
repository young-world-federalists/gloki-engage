# Funding on `ui` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-apply Ouri's real-coin funding system (per-fund crowdfund + budget allocation, community-wide commons distribution) onto ui's stub seam and design system, as a self-contained Community Funds page.

**Architecture:** All reads/writes go through `services/api.ts` → `demo/mockApi.ts` → `demo/demoRouter.ts` → per-contract JS stub. We add one contract type (`funding_flow_contract.py`) with a new stub, extend the community stub with coin/fund/allocation methods, port Ouri's service + flow API (already seam-clean), and re-skin his two UI surfaces (Currency page + FundingFlow) to ui's design system. No component calls a real server.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules; localStorage-backed demo state; `useT` i18n (en/fr/sw); lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-06-24-funding-on-ui-design.md`

## Global Constraints

- **Seam rule:** components read/write ONLY through `contractRead`/`contractWrite`/`deployContract` from `src/services/api.ts`. Never call a real server. New backend behavior lives in `src/services/demo/`.
- **No test framework.** Verify via `npx tsc -b` (production build gate — must be clean before any push) and `npm run dev` + browser DevTools / the preview workflow. There is no unit-test runner; do not invent one.
- **Design system:** use SCSS tokens (no raw hex), the shared `Button` (`src/components/shared`), `InfoDisclosure`, and `useAlert`/`Modal` instead of `alert()`/`confirm()`.
- **i18n:** every user-facing string via `useT()` with an English default; add **fr + sw** overlays at **exact key parity** (equal key counts, zero variable drift). New keys namespaced `funds.*`.
- **a11y floor:** AA contrast, interactive targets ≥44px, exactly one `<h1>` per page, all controls keyboard-operable, meaningful `aria-label`s.
- **Vocabulary:** ui uses "Support Points" / "points" and the page is named **"Community Funds"** — not Ouri's "credits"/"Community Currency". The currency symbol is an i18n string (`currency.symbol`), never a hardcoded "credits".
- **Contract interface parity:** keep contract method names/shapes identical to Ouri's (listed in the spec §2) so his later real-server wiring is a seam swap.

---

## File Structure

**Data / seam layer**
- Modify `src/services/demo/demoContracts/community.ts` — fund accounts, allocations, distribution, parameters/medians.
- Create `src/services/demo/demoContracts/funding.ts` — the funding flow contract stub.
- Modify `src/services/demo/demoRouter.ts` — register `funding_flow_contract.py`.
- Create `src/assets/contracts/funding_flow_contract.py` — `?raw` source (fidelity + Ouri handoff).
- Modify `src/assets/contracts/community_contract.py` — sync coin additions (fidelity; not executed on ui).
- Modify `src/services/demo/mockApi.ts` — bump `DEMO_VERSION`.

**Service / flow API**
- Modify `src/services/contracts/community.ts` — `getAccountDetails`, `getAllAllocations`, `setAllocation`, `getDistributionStatus`, `distributeCommons`, `commons_mint` in `setParameters`, `IDistributionStatus`.
- Create `src/components/collaboration/flows/funding/fundingApi.ts` — ported from main (seam-clean).

**UI**
- Modify `src/components/community/Currency.tsx` + `Currency.module.scss` — Community Funds page (4 sections), re-skinned.
- Create `src/components/collaboration/flows/funding/FundingFlow.tsx` + `FundingFlow.module.scss` — per-fund detail + setup dialog, re-skinned, rendered by the funds page (not the flow registry).
- Modify `src/pages/CommunityView.tsx` — relabel the `currency` menu item to "Community Funds".

**Seed / i18n**
- Modify `src/services/demo/seedDemoCommunity.ts` (+ optional `fixtures/funds.ts`) — seed funds/contributions/items/allocations + commons balance.
- Modify `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts` (+ `types.ts` if it enumerates keys) — `funds.*` keys at parity.

**Build order:** Task 1 → 2 → 3 → (4, 5) → 6 → 7 → 8.

---

### Task 1: Community demo-stub — coin, fund, allocation, distribution, parameters

**Files:**
- Modify: `src/services/demo/demoContracts/community.ts`
- Modify: `src/assets/contracts/community_contract.py` (sync from `origin/main`)

**Interfaces:**
- Consumes: existing `readState`/`writeState`/`updateState` from `../demoState`.
- Produces (community contract methods the service layer in Task 3 calls):
  - `create_fund_account` `{name, owner}` → `boolean`
  - `fund_transfer` `{fund_name, to, value}` → `boolean`
  - `get_fund_balance` `{fund_name}` → `number`
  - `set_allocation` `{allocation: Record<string,number>}` → `boolean`
  - `get_all_allocations` → `Record<string, Record<string, number>>` (member → account → points)
  - `get_account_details` → `Record<string, {type: string; balance: number}>`
  - `distribute_commons` → `{days_since_creation, payment_count, can_distribute}`
  - `get_distribution_status` → `{days_since_creation, payment_count, can_distribute}`
  - `get_parameters` → `{parameters: {mint,burn,commons_mint}, medians: {mint,burn,commons_mint}}`
  - `set_parameters` `{mint, burn, commons_mint}` → `boolean`

- [ ] **Step 1: Extend the state shape and `initCommunity`**

In `src/services/demo/demoContracts/community.ts`, replace the `Account` inline type and `CommunityState` interface, and update `defaultState()` + `initCommunity()`:

```ts
interface Account {
  balanceOf: number;
  creationTime: number;
  elapsedDays: number;
  type?: 'personal' | 'central' | 'fund';
  owner?: string;
}

interface MonetaryParams { mint: number; burn: number; commons_mint: number; }

interface CommunityState {
  members: Record<string, unknown[]>;
  properties: Record<string, unknown>;
  collaborations: Collaboration[];
  accounts: Record<string, Account>;
  allocations: Record<string, Record<string, number>>; // member -> { account: points }
  parameters: Record<string, MonetaryParams>;           // member -> prefs
  distribution: { paymentCount: number; dayStep: number };
  stage_contracts: Record<string, { contractId: string; address: string; agent: string }>;
  stage_permissions: Record<string, StageRule>;
}

function defaultState(): CommunityState {
  return {
    members: {}, properties: {}, collaborations: [], accounts: {},
    allocations: {}, parameters: {}, distribution: { paymentCount: 0, dayStep: 0 },
    stage_contracts: {}, stage_permissions: {},
  };
}
```

In `initCommunity`, tag the founder + central account types and give the founder default monetary prefs:

```ts
  state.accounts[publicKey] = { balanceOf: 1000, creationTime: Date.now(), elapsedDays: 0, type: 'personal' };
  state.accounts['centralAccount'] = { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'central' };
  state.parameters[publicKey] = { mint: 10, burn: 1, commons_mint: 5 };
```

Also set `type: 'personal'` and a `parameters[caller]` default in the `request_join` and `become_member` write handlers (same `{ mint: 10, burn: 1, commons_mint: 5 }`).

- [ ] **Step 2: Add a median helper near the top of the file**

```ts
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
```

- [ ] **Step 3: Add the read handlers**

In `communityRead`'s `switch`, add before `default:`:

```ts
    case 'get_fund_balance': {
      const fundName = method.values?.fund_name as string | undefined;
      if (!fundName) return 0;
      return state.accounts[fundName]?.balanceOf ?? 0;
    }
    case 'get_all_allocations':
      return state.allocations;
    case 'get_account_details': {
      const result: Record<string, { type: string; balance: number }> = {};
      for (const [name, acct] of Object.entries(state.accounts)) {
        result[name] = { type: acct.type ?? 'personal', balance: acct.balanceOf };
      }
      return result;
    }
    case 'get_distribution_status': {
      const hasFund = Object.values(state.accounts).some((a) => a.type === 'fund');
      return {
        days_since_creation: state.distribution.dayStep,
        payment_count: state.distribution.paymentCount,
        can_distribute: hasFund,
      };
    }
    case 'get_parameters': {
      const mints: number[] = [], burns: number[] = [], commons: number[] = [];
      for (const p of Object.values(state.parameters)) {
        mints.push(p.mint); burns.push(p.burn); commons.push(p.commons_mint);
      }
      return {
        parameters: state.parameters[caller] ?? { mint: 0, burn: 0, commons_mint: 0 },
        medians: { mint: median(mints), burn: median(burns), commons_mint: median(commons) },
      };
    }
```

- [ ] **Step 4: Add the write handlers**

In `communityWrite`'s `switch`, add before `default:`:

```ts
    case 'create_fund_account': {
      const name = method.values?.name as string | undefined;
      const owner = (method.values?.owner as string) ?? caller;
      if (!name) return false;
      let created = false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (next.accounts[name]) return next;
        next.accounts = { ...next.accounts, [name]: { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'fund', owner } };
        created = true;
        return next;
      });
      return created;
    }
    case 'fund_transfer': {
      const fundName = method.values?.fund_name as string | undefined;
      const to = method.values?.to as string | undefined;
      const value = (method.values?.value as number) ?? 0;
      if (!fundName || !to) return false;
      let ok = false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        const fund = next.accounts[fundName];
        const recipient = next.accounts[to];
        if (fund && fund.type === 'fund' && fund.owner === caller && recipient && fund.balanceOf >= value) {
          next.accounts = { ...next.accounts, [fundName]: { ...fund, balanceOf: fund.balanceOf - value }, [to]: { ...recipient, balanceOf: recipient.balanceOf + value } };
          ok = true;
        }
        return next;
      });
      return ok;
    }
    case 'set_allocation': {
      const allocation = method.values?.allocation as Record<string, number> | undefined;
      if (!allocation) return false;
      const total = Object.values(allocation).reduce((sum, v) => sum + v, 0);
      if (total > 1000) return false;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.allocations = { ...next.allocations, [caller]: allocation };
        return next;
      });
      return true;
    }
    case 'set_parameters': {
      const mint = (method.values?.mint as number) ?? 0;
      const burn = (method.values?.burn as number) ?? 0;
      const commons_mint = (method.values?.commons_mint as number) ?? 0;
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        next.parameters = { ...next.parameters, [caller]: { mint, burn, commons_mint } };
        return next;
      });
      return true;
    }
    case 'distribute_commons': {
      let status = { days_since_creation: 0, payment_count: 0, can_distribute: false };
      updateState<CommunityState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        // One simulated day: mint the median commons into the treasury, then split it
        // across funds by the community's collective allocation points.
        const commonsMint = median(Object.values(next.parameters).map((p) => p.commons_mint));
        const central = next.accounts['centralAccount'] ?? { balanceOf: 0, creationTime: Date.now(), elapsedDays: 0, type: 'central' as const };
        central.balanceOf += commonsMint;
        const fundNames = Object.keys(next.accounts).filter((n) => next.accounts[n].type === 'fund');
        const fundPoints: Record<string, number> = {};
        let totalFundPoints = 0;
        for (const alloc of Object.values(next.allocations)) {
          for (const fn of fundNames) {
            const pts = alloc[fn] ?? 0;
            fundPoints[fn] = (fundPoints[fn] ?? 0) + pts;
            totalFundPoints += pts;
          }
        }
        const pool = central.balanceOf;
        const updated: Record<string, Account> = { ...next.accounts };
        if (totalFundPoints > 0 && pool > 0) {
          for (const fn of fundNames) {
            const share = (fundPoints[fn] ?? 0) / totalFundPoints;
            const amount = Math.round(pool * share);
            updated[fn] = { ...updated[fn], balanceOf: updated[fn].balanceOf + amount };
          }
          central.balanceOf = 0;
        }
        updated['centralAccount'] = central;
        next.accounts = updated;
        next.distribution = { paymentCount: next.distribution.paymentCount + 1, dayStep: next.distribution.dayStep + 1 };
        status = { days_since_creation: next.distribution.dayStep, payment_count: next.distribution.paymentCount, can_distribute: fundNames.length > 0 };
        return next;
      });
      return status;
    }
```

- [ ] **Step 5: Sync the `.py` contract source (fidelity only)**

Overwrite `src/assets/contracts/community_contract.py` with `origin/main`'s version so the label matches the new methods (it is `?raw`-imported, not executed on ui):

Run: `git show origin/main:src/assets/contracts/community_contract.py > src/assets/contracts/community_contract.py`

- [ ] **Step 6: Type-check**

Run: `npx tsc -b`
Expected: clean (no errors).

- [ ] **Step 7: Manual stub check in the browser**

Run `npm run dev`, open the app, open DevTools console, and exercise the new methods against a seeded community id (grab one via `JSON.parse(localStorage.gloki_demo_contracts)`):

```js
const { contractWrite, contractRead } = await import('/src/services/api.ts');
const cid = Object.values(JSON.parse(localStorage.gloki_demo_contracts)).find(m => m.contract === 'community_contract.py').id;
await contractWrite({ serverUrl:'', publicKey:'me', contractId:cid, method:{ name:'create_fund_account', values:{ name:'Test Fund', owner:'me' } }});
await contractRead({ serverUrl:'', publicKey:'me', contractId:cid, method:{ name:'get_account_details', values:{} }});
```
Expected: `get_account_details` includes `"Test Fund": { type: "fund", balance: 0 }`.

- [ ] **Step 8: Commit**

```bash
git add src/services/demo/demoContracts/community.ts src/assets/contracts/community_contract.py
git commit -m "feat(funding): community stub gains fund accounts, allocation, commons distribution"
```

---

### Task 2: Funding flow demo-stub + contract source + router registration

**Files:**
- Create: `src/services/demo/demoContracts/funding.ts`
- Create: `src/assets/contracts/funding_flow_contract.py`
- Modify: `src/services/demo/demoRouter.ts`

**Interfaces:**
- Consumes: `readState`/`updateState` from `../demoState`.
- Produces (funding contract methods Task 3's `fundingApi.ts` calls): `get_config`/`set_config`, `get_contributions`/`add_contribution`, `get_items`/`add_item`, `get_all_allocations`/`set_my_allocation`, `get_community`/`set_community_and_fund`, `get_fund_account_name`.

- [ ] **Step 1: Add the `.py` source**

Run: `git show origin/main:src/assets/contracts/funding_flow_contract.py > src/assets/contracts/funding_flow_contract.py`

- [ ] **Step 2: Create the funding stub**

Create `src/services/demo/demoContracts/funding.ts`:

```ts
// Mock funding_flow_contract.py — fund config, contributions, budget items, allocations.
import type { IMethod } from '../../interfaces';
import { readState, updateState } from '../demoState';

interface Contribution { id: string; participantId: string; amount: number; timestamp: number; }
interface BudgetItem { id: string; name: string; createdBy: string; }
interface FundConfig { name: string; description: string; goal: number | null; }
interface CommunityLink { server: string; agent: string; id: string; }

interface FundingState {
  config: FundConfig | null;
  contributions: Contribution[];
  items: BudgetItem[];
  allocations: Record<string, Record<string, number>>; // participant -> { itemId: points }
  community: CommunityLink | null;
  fundAccountName: string;
}

function defaultState(): FundingState {
  return { config: null, contributions: [], items: [], allocations: {}, community: null, fundAccountName: '' };
}

function load(contractId: string): FundingState {
  return { ...defaultState(), ...readState<Partial<FundingState>>(contractId) };
}

export function fundingRead(contractId: string, method: IMethod, _caller: string): unknown {
  void _caller;
  const s = load(contractId);
  switch (method.name) {
    case 'get_config':
      return s.config ?? {};
    case 'get_contributions':
      return s.contributions;
    case 'get_items':
      return s.items;
    case 'get_all_allocations':
      return Object.entries(s.allocations).map(([participantId, allocation]) => ({ participantId, allocation }));
    case 'get_community':
      return s.community ?? {};
    case 'get_fund_account_name':
      return s.fundAccountName;
    default:
      return null;
  }
}

export function fundingWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'set_config': {
      const config = method.values?.config as FundConfig | undefined;
      if (!config) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, config }));
      return null;
    }
    case 'set_community_and_fund': {
      const community: CommunityLink = {
        server: (method.values?.community_server as string) ?? '',
        agent: (method.values?.community_agent as string) ?? '',
        id: (method.values?.community_id as string) ?? '',
      };
      const fundAccountName = (method.values?.fund_account_name as string) ?? '';
      updateState<FundingState>(contractId, (s) => {
        const next = { ...defaultState(), ...s };
        if (!next.community?.id) { next.community = community; next.fundAccountName = fundAccountName; }
        return next;
      });
      return null;
    }
    case 'add_contribution': {
      const contribution = method.values?.contribution as Contribution | undefined;
      if (!contribution) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, contributions: [...(s.contributions ?? []), contribution] }));
      return contribution;
    }
    case 'add_item': {
      const item = method.values?.item as BudgetItem | undefined;
      if (!item) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, items: [...(s.items ?? []), item] }));
      return item;
    }
    case 'set_my_allocation': {
      const allocation = method.values?.allocation as Record<string, number> | undefined;
      if (!allocation) return null;
      updateState<FundingState>(contractId, (s) => ({ ...defaultState(), ...s, allocations: { ...(s.allocations ?? {}), [caller]: allocation } }));
      return null;
    }
    default:
      return null;
  }
}
```

- [ ] **Step 3: Register the contract in the router**

In `src/services/demo/demoRouter.ts`, add the import and both map entries:

```ts
import { fundingRead, fundingWrite } from './demoContracts/funding';
```
Add to `READ`: `'funding_flow_contract.py': fundingRead,`
Add to `WRITE`: `'funding_flow_contract.py': fundingWrite,`

- [ ] **Step 4: Type-check**

Run: `npx tsc -b`
Expected: clean.

- [ ] **Step 5: Manual stub check**

In the dev-server DevTools console:

```js
const { deployContract, contractWrite, contractRead } = await import('/src/services/api.ts');
const { id } = await deployContract({ serverUrl:'', publicKey:'me', name:'f', contract:'funding_flow_contract.py', code:'' });
await contractWrite({ serverUrl:'', publicKey:'me', contractId:id, method:{ name:'set_config', values:{ config:{ name:'Garden', description:'', goal:500 } }}});
await contractRead({ serverUrl:'', publicKey:'me', contractId:id, method:{ name:'get_config', values:{} }});
```
Expected: returns `{ name:'Garden', description:'', goal:500 }`.

- [ ] **Step 6: Commit**

```bash
git add src/services/demo/demoContracts/funding.ts src/services/demo/demoRouter.ts src/assets/contracts/funding_flow_contract.py
git commit -m "feat(funding): funding_flow_contract demo stub + router registration"
```

---

### Task 3: Service layer + flow API

**Files:**
- Modify: `src/services/contracts/community.ts`
- Create: `src/components/collaboration/flows/funding/fundingApi.ts`

**Interfaces:**
- Consumes: Task 1 community methods, Task 2 funding methods, `contractRead`/`contractWrite` from `services/api`.
- Produces:
  - `community.ts`: `getAccountDetails(server, pk, cid)` → `Record<string,{type,balance}>`; `getAllAllocations(server, pk, cid)` → `Record<string,Record<string,number>>`; `setAllocation(server, pk, cid, allocation)` → `void`; `getDistributionStatus(server, pk, cid)` → `IDistributionStatus`; `distributeCommons(server, pk, cid)` → `void`; `setParameters(..., commonsMint)`.
  - `fundingApi.ts`: types `Contribution`, `FundConfig`, `FundState`, `BudgetItem`, `ParticipantAllocation`, `BudgetState`, `CommunityInfo`; fns `loadFund`, `configureFund`, `loadCommunityInfo`, `contribute`, `loadBudget`, `addItem`, `saveMyAllocation`; helpers `totalRaised`, `contributionByUser`, `myPointsUsed`, `getAggregated`; consts `TOTAL_POINTS`, `CURRENCY_SYMBOL`.

- [ ] **Step 1: Read the existing `setParameters` signature**

Run: `sed -n '465,484p' src/services/contracts/community.ts`
Note the current parameter list so you can add `commonsMint` consistently (the contract write uses `set_parameters` with `values: { mint, burn, commons_mint }`).

- [ ] **Step 2: Add the new community service functions**

Append to `src/services/contracts/community.ts` (use the existing file's `contractRead`/`contractWrite` import and its established call shape):

```ts
export interface IDistributionStatus {
  days_since_creation: number;
  payment_count: number;
  can_distribute: boolean;
}

export async function getAccountDetails(serverUrl: string, publicKey: string, contractId: string): Promise<Record<string, { type: string; balance: number }>> {
  const res = await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_account_details', values: {} } });
  return (res && typeof res === 'object') ? res as Record<string, { type: string; balance: number }> : {};
}

export async function getAllAllocations(serverUrl: string, publicKey: string, contractId: string): Promise<Record<string, Record<string, number>>> {
  const res = await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_all_allocations', values: {} } });
  return (res && typeof res === 'object') ? res as Record<string, Record<string, number>> : {};
}

export async function setAllocation(serverUrl: string, publicKey: string, contractId: string, allocation: Record<string, number>): Promise<void> {
  await contractWrite({ serverUrl, publicKey, contractId, method: { name: 'set_allocation', values: { allocation } } });
}

export async function getDistributionStatus(serverUrl: string, publicKey: string, contractId: string): Promise<IDistributionStatus> {
  const res = await contractRead({ serverUrl, publicKey, contractId, method: { name: 'get_distribution_status', values: {} } });
  const r = (res ?? {}) as Partial<IDistributionStatus>;
  return { days_since_creation: r.days_since_creation ?? 0, payment_count: r.payment_count ?? 0, can_distribute: r.can_distribute ?? false };
}

export async function distributeCommons(serverUrl: string, publicKey: string, contractId: string): Promise<void> {
  await contractWrite({ serverUrl, publicKey, contractId, method: { name: 'distribute_commons', values: {} } });
}
```

Then update `setParameters` to take and pass `commonsMint` (add a 6th param `commonsMint: number` and include `commons_mint: commonsMint` in the write `values`). Update any existing caller accordingly (search: `rg -n "setParameters\(" src` — pass the current `commons_mint` preference or `0`).

- [ ] **Step 3: Create `fundingApi.ts`**

Run: `git show origin/main:src/components/collaboration/flows/funding/fundingApi.ts > src/components/collaboration/flows/funding/fundingApi.ts`

Then change one line for vocabulary parity — replace the hardcoded constant:
```ts
export const CURRENCY_SYMBOL = 'credits';
```
with:
```ts
export const CURRENCY_SYMBOL = 'points';
```
(Leave the rest as-is; it already imports `contractRead`/`contractWrite` from `../../../../services/api` and is seam-clean.)

- [ ] **Step 4: Type-check**

Run: `npx tsc -b`
Expected: clean. (If `setParameters` callers break, fix them to pass the 6th arg.)

- [ ] **Step 5: Commit**

```bash
git add src/services/contracts/community.ts src/components/collaboration/flows/funding/fundingApi.ts
git commit -m "feat(funding): service methods (accounts/allocation/distribution) + fundingApi port"
```

---

### Task 4: Community Funds page (Currency.tsx rework)

**Files:**
- Modify: `src/components/community/Currency.tsx`
- Modify: `src/components/community/Currency.module.scss`
- Modify: `src/pages/CommunityView.tsx` (relabel menu item)

**Interfaces:**
- Consumes: Task 3 `getAccountDetails`, `getAllAllocations`, `setAllocation`, `getDistributionStatus`, `distributeCommons`, `setParameters`, existing `transfer`; existing `fetchUserBalance` slice; Task 5 `FundingFlow` + `FundingSetupDialog` (imported for the fund list → detail and create flow — if Task 5 is not yet done, stub the import behind the fund-list "Create"/row click with a `// TODO Task 5` no-op handler and wire it in Task 5's Step for the page).
- Produces: the `/community/:id/currency` page (route unchanged), now titled "Community Funds".

This is a **port-and-reskin** of `git show origin/main:src/components/community/Currency.tsx` (read it first). Keep its four working sections; apply the reskin deltas below.

- [ ] **Step 1: Start from main's component, keep ui's existing imports/guards**

Read main's version and ui's current version side by side:
```bash
git show origin/main:src/components/community/Currency.tsx
sed -n '1,40p' src/components/community/Currency.tsx
```
Keep ui's existing top matter: `useT`, `useAlert`, `InfoDisclosure`, the `isMember`/loading guards, and the existing balance + send section (already reskinned). Layer main's three additional sections (monetary-policy preferences, fund list, community allocation + distribution) on top.

- [ ] **Step 2: Apply the reskin deltas (every one of these is required)**

- Replace every `alert('…')` with `showAlert(t('funds.<key>', '<English>'), { title: t('funds.<key>Title', '<Title>') })` (the page already calls `useAlert()`).
- Replace every hardcoded English string with `t('funds.<key>', '<English default>')`. Enumerate keys in Task 7; namespace `funds.*`. Replace `'credits'` with the i18n `symbol = t('currency.symbol', 'points')`.
- Replace raw `<button>`s with the shared `Button` from `src/components/shared` (variants per the existing ui usage; primary for Save/Update/Pay, secondary for Revert/Cancel). Keep `min-height: 44px` on any control that stays a native input/select.
- Replace any hex colors introduced by the port in `Currency.module.scss` with SCSS tokens (mirror the tokens already used in that file; e.g. `$primary`, `$gray-*`, `$warning`, `$error`). No raw hex.
- Page title: exactly one `<h1>` reading `t('funds.title', 'Community Funds')`. Demote any inner section titles to `<h2>`/`<h3>`.
- Add `aria-label`s to icon-only controls and the points inputs (e.g. `aria-label={t('funds.allocationPointsFor', 'Points for {name}', { name })}`).
- Ensure the allocation `<input type="number">` rows and the "Pay to Funds" button meet ≥44px and have visible focus.

- [ ] **Step 3: Wire the data loaders**

Port main's `loadAllocationData` (Promise.all of `getAccountDetails`, `getAllAllocations`, `getDistributionStatus`), the `useEventStream('contract_write', …)` refresh, `collectivePercentages`, `totalAllocated`, `fundAccounts`, `handleSetAccountPoints`, `handleSaveAllocation`, `handleDistribute`, `handleUpdatePreferences`. They already use the seam via Task 3 — no server calls.

- [ ] **Step 4: Add the fund list + create entry point**

Render the `fundAccounts` (from `getAccountDetails`) as a tappable list. Each row → opens the per-fund detail (Task 5 `FundingFlow`) via in-page state `const [selectedFundId, setSelectedFundId] = useState<string|null>(null)`. Add a "Create fund" `Button` that opens `FundingSetupDialog` (Task 5). The fund's funding-contract id is stored on the community: when a fund is created (Task 5), persist a `fundContracts` map via `set_property` so the list can map fund account name → funding contract id. (If Task 5 isn't done yet, render the list read-only and leave the create button disabled with `// TODO Task 5`.)

- [ ] **Step 5: Relabel the community menu item**

In `src/pages/CommunityView.tsx`, change the `currency` menu label default from `'Currency'` to the Community Funds label:
```ts
{ key: 'currency', icon: Coins, label: t('community.menu.funds', 'Community Funds'), onClick: closeAfter(() => navigate(`/community/${communityId}/currency`)) },
```

- [ ] **Step 6: Type-check + browser walkthrough**

Run: `npx tsc -b` (expected clean), then `npm run dev` and the preview workflow:
- Open a community → Community Funds. One `<h1>` "Community Funds".
- Balance shows; Send Support works (existing).
- Monetary-policy inputs update; Update/Revert toggle correctly.
- Fund list renders seeded funds (after Task 6); allocation inputs accept points; total/1000 guard works; Save persists (reload keeps it).
- "Pay to Funds" moves commons → funds by % (balances change).

- [ ] **Step 7: Commit**

```bash
git add src/components/community/Currency.tsx src/components/community/Currency.module.scss src/pages/CommunityView.tsx
git commit -m "feat(funding): Community Funds page — funds, allocation, commons distribution"
```

---

### Task 5: Per-fund detail + create (FundingFlow port)

**Files:**
- Create: `src/components/collaboration/flows/funding/FundingFlow.tsx`
- Create: `src/components/collaboration/flows/funding/FundingFlow.module.scss`
- Modify: `src/components/community/Currency.tsx` (wire create + detail from Task 4 Step 4)

**Interfaces:**
- Consumes: Task 3 `fundingApi` (`loadFund`, `configureFund`, `loadCommunityInfo`, `contribute`, `loadBudget`, `addItem`, `saveMyAllocation`, helpers, consts); `deployContract` from `services/api`; Task 1 `create_fund_account` (community write); `funding_flow_contract.py` via `?raw`.
- Produces: `FundingFlow` (per-fund detail) + exported `FundingSetupDialog`.

Port from `git show origin/main:src/components/collaboration/flows/funding/FundingFlow.tsx` and `…/FundingFlow.module.scss`.

- [ ] **Step 1: Copy the SCSS, tokenize it**

```bash
git show origin/main:src/components/collaboration/flows/funding/FundingFlow.module.scss > src/components/collaboration/flows/funding/FundingFlow.module.scss
```
Replace every raw hex / rgba color with the SCSS tokens used elsewhere in ui (import the shared variables the other flow `.module.scss` files import; mirror `concerns`/`discussion` flow styles). No raw hex remains.

- [ ] **Step 2: Port the component, apply reskin deltas**

Create `FundingFlow.tsx` from main's source with these required changes:
- The ui `FlowProps` differ from main's. ui surfaces this from the funds page, so define the props this component actually needs: `{ fundContractId: string; communityId: string; currentUser: string; serverUrl: string; onBack: () => void }`. Replace main's `flowServer`/`flowAgent`/`instanceId` plumbing with `serverUrl`/`currentUser`/`fundContractId` passed from the page. (The `fundingApi` functions take `(server, agent, contractId, …)`; pass `serverUrl`, `currentUser`, `fundContractId`.)
- Replace `FlowLoading`/`FlowError` (from the retired `FlowShell`) with ui equivalents: a simple spinner/`<p>` and an error `<p>` + retry `Button`. (Confirm whether `FlowShell` still exists: `rg -n "FlowShell" src`. If absent, inline minimal loading/error UI.)
- Replace every hardcoded string with `t('funds.<key>', '<English>')` via `useT`. Replace `api.CURRENCY_SYMBOL` display with the i18n `symbol`.
- Replace raw `<button>`s with the shared `Button`; the setup dialog overlay must use the shared `Modal` (focus-trap/restore) rather than a hand-rolled overlay `<div>`.
- Add a back affordance (`onBack`) to return to the funds list. One `<h2>` for the fund name within the page (the page's `<h1>` is "Community Funds").
- a11y: number inputs get `aria-label`s; tab bar buttons use `aria-selected`/`role="tab"` or `aria-pressed`; ≥44px targets.

- [ ] **Step 3: Implement fund creation in the page (Task 4 Step 4 entry point)**

In `Currency.tsx`, implement the create handler the setup dialog calls:
```ts
import fundingContractSrc from '../../assets/contracts/funding_flow_contract.py?raw';
import { deployContract } from '../../services/api';
// ...
const handleCreateFund = async (config: { name: string; description: string; goal: number | null }) => {
  if (!serverUrl || !publicKey || !communityId) return;
  const { id } = await deployContract({ serverUrl, publicKey, name: config.name, contract: 'funding_flow_contract.py', code: fundingContractSrc });
  await contractWrite({ serverUrl, publicKey, contractId: id, method: { name: 'set_config', values: { config } } });
  await contractWrite({ serverUrl, publicKey, contractId: id, method: { name: 'set_community_and_fund', values: { community_server: serverUrl, community_agent: publicKey, community_id: communityId, fund_account_name: config.name } } });
  await contractWrite({ serverUrl, publicKey, contractId: communityId, method: { name: 'create_fund_account', values: { name: config.name, owner: publicKey } } });
  // persist account-name -> funding-contract-id so the list can open the detail
  await contractWrite({ serverUrl, publicKey, contractId: communityId, method: { name: 'set_property', values: { key: `fund_${config.name}`, value: id } } });
  await loadAllocationData();
};
```
Read the fund→contract map back from `get_properties` (keys prefixed `fund_`) to render the list and resolve `selectedFundId`. Import `contractWrite` from `services/api`.

- [ ] **Step 4: Type-check + browser walkthrough**

Run: `npx tsc -b` (clean), then `npm run dev`:
- Community Funds → "Create fund" → dialog (Modal, focus-trapped) → Launch.
- New fund appears in the list with 0 balance.
- Open the fund → Contribute N points: personal balance drops by N, fund balance rises by N, contribution appears in the ledger, progress bar advances (dual write in sync).
- Add a budget item; allocate points; Results tab shows normalized %.
- Back returns to the funds list.

- [ ] **Step 5: Commit**

```bash
git add src/components/collaboration/flows/funding/FundingFlow.tsx src/components/collaboration/flows/funding/FundingFlow.module.scss src/components/community/Currency.tsx
git commit -m "feat(funding): per-fund detail (contribute + budget) and fund creation"
```

---

### Task 6: Demo seed data

**Files:**
- Modify: `src/services/demo/seedDemoCommunity.ts`
- Modify: `src/services/demo/mockApi.ts` (bump `DEMO_VERSION`)

**Interfaces:**
- Consumes: `mockDeployDirect` / the seeder's existing deploy helpers; Task 1/2 contract methods.
- Produces: at least one community pre-seeded with 1–2 funds (each with contributions, 2–3 budget items, and a couple of members' allocations) and a non-zero Commons Treasury + member allocations across funds.

- [ ] **Step 1: Read the seeder to learn its helpers**

Run: `sed -n '1,80p' src/services/demo/seedDemoCommunity.ts` and skim how it deploys child contracts and writes initial state (it uses `mockDeployDirect` + direct `routeWrite`/state writes). Follow that exact pattern.

- [ ] **Step 2: Seed funds for one flagship community**

After a community is seeded, for that community id:
- Deploy a `funding_flow_contract.py` per fund via the seeder's deploy helper; capture each `id`.
- Write `set_config` (name/description/goal), a few `add_contribution`, 2–3 `add_item`, and 1–2 members' `set_my_allocation` to each funding contract.
- On the community contract: `create_fund_account` for each fund (owner = a seeded persona), set a non-zero `centralAccount.balanceOf` (e.g. 300), seed a couple of members' community-level `set_allocation` across the funds + commons, and `set_property` `fund_<name>` → funding contract id.

Use concrete fixtures (names like "Clean Water Fund", "Community Garden"). Keep amounts small and legible.

- [ ] **Step 3: Bump the demo version**

In `src/services/demo/mockApi.ts`, change:
```ts
const DEMO_VERSION = 'global-v4';
```
to:
```ts
const DEMO_VERSION = 'global-v5';
```

- [ ] **Step 4: Verify fresh seed**

Run `npm run dev`, then in DevTools: `localStorage.clear()` and reload. Open the flagship community → Community Funds.
Expected: funds appear pre-populated (balances, contributors), Commons Treasury non-zero, allocation rows show community %.

- [ ] **Step 5: Commit**

```bash
git add src/services/demo/seedDemoCommunity.ts src/services/demo/mockApi.ts
git commit -m "feat(funding): seed demo funds, contributions, allocations; bump DEMO_VERSION v5"
```

---

### Task 7: i18n parity (en defaults + fr/sw overlays)

**Files:**
- Modify: `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts` (and `src/i18n/types.ts` if it enumerates keys)

**Interfaces:**
- Consumes: the `funds.*` (and any new `currency.*`/`community.menu.funds`) keys used in Tasks 4 & 5.
- Produces: equal key sets across en/fr/sw.

- [ ] **Step 1: Enumerate every new key**

Run: `rg -no "t\('(funds|currency|community\.menu)\.[a-zA-Z0-9]+'" src/components/community/Currency.tsx src/components/collaboration/flows/funding/FundingFlow.tsx src/pages/CommunityView.tsx | sort -u`
Produce the authoritative list of new keys + their English defaults.

- [ ] **Step 2: Read the i18n file shape**

Run: `sed -n '1,40p' src/i18n/en.ts` and the matching region in `fr.ts`/`sw.ts` to match the nesting/style (the project keeps fr/sw as full overlays at parity). Check `types.ts` for whether keys are typed.

- [ ] **Step 3: Add the `funds.*` block to en, fr, sw**

Add identical key sets to all three (English text in `en.ts`; French in `fr.ts`; Swahili in `sw.ts`). Cover: title/subtitle, balance/send labels, monetary-policy labels, fund list (empty state, create, balances), allocation (points used/remaining/over, save, community %), distribution (Pay to Funds, day/payment status), per-fund detail (contribute, contributions, contributors, goal, total raised, progress, budget items, add item, allocation, results, back), and dialog (name/description/goal, launch, cancel, validation messages).

- [ ] **Step 4: Verify parity**

Run a key-count check (adapt to the file shape — counts must be equal):
```bash
node -e "const c=s=>[...require('fs').readFileSync(s,'utf8').matchAll(/funds\./g)].length; console.log('en',c('src/i18n/en.ts'),'fr',c('src/i18n/fr.ts'),'sw',c('src/i18n/sw.ts'))"
```
Expected: three equal counts. Then `npx tsc -b` clean.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/en.ts src/i18n/fr.ts src/i18n/sw.ts src/i18n/types.ts
git commit -m "i18n(funding): funds.* keys at en/fr/sw parity"
```

---

### Task 8: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Production build gate**

Run: `npx tsc -b && npm run build`
Expected: clean build, no TS errors.

- [ ] **Step 2: Full walkthrough (en)**

`npm run dev`, `localStorage.clear()`, reload. Community Funds: create fund → contribute → add items → allocate → results → community allocation → Pay to Funds. Confirm dual-write sync (personal ↓, fund ↑, ledger entry) and no console errors (`preview_console_logs`).

- [ ] **Step 3: fr/sw + responsive + dark**

Switch language to fr then sw; at 360px width, light + dark. Confirm no untranslated keys, no clipping, AA contrast. Capture screenshots (`preview_screenshot`).

- [ ] **Step 4: a11y spot-check**

Keyboard-only: tab through the funds page and a fund detail — every control reachable, visible focus, dialog focus-trapped and restores on close. One `<h1>` per page.

- [ ] **Step 5: Final commit (if any fixes)**

```bash
git add -A
git commit -m "fix(funding): verification fixes (build, i18n, a11y)"
```

---

## Self-Review

**Spec coverage:** §2 interface → Tasks 1–3 (every contract method has a stub handler + service fn). §5.1 seam → Tasks 1–2. §5.2 service/API → Task 3. §5.3 UI (funds page + per-fund) → Tasks 4–5. §5.4 seed → Task 6. §5.5 i18n → Task 7. §6 decisions: page name → Task 4 Step 5; per-fund from page → Task 5; distribution day-step → Task 1 Step 4 `distribute_commons`. §8 verification → Task 8. §9 DEMO_VERSION bump → Task 6 Step 3; naming/`CURRENCY_SYMBOL` → Task 3 Step 3 + Task 4 Step 2.

**Placeholder scan:** UI Tasks 4–5 reference main's source via `git show` plus an explicit reskin-delta checklist rather than reproducing 500 lines verbatim — deliberate (the source exists in git; the deltas are the actual work). The two cross-task soft dependencies (Task 4 ↔ Task 5 page wiring) are called out with explicit `// TODO Task 5` fallbacks so each task still builds/commits independently.

**Type consistency:** community service fns return the same shapes the stub produces (`{type,balance}` map; `Record<member,Record<account,points>>`; `IDistributionStatus`). `fundingApi` types are taken verbatim from main and matched by the funding stub's return shapes (`get_all_allocations` → `[{participantId, allocation}]`; `get_config` → `{}` when unset, which `loadFund` treats as `null`). `CURRENCY_SYMBOL` standardized to "points" in one place.
