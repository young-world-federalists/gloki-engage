---
name: gloki-python-contracts
description: Use when reading, writing, or modifying Gloki Python blockchain contracts (src/assets/contracts/*.py), adding or renaming a contract method the UI calls (contractRead/contractWrite IMethod names), passing a member's key as `agent`, touching a demoContracts/*.ts stub handler, updating docs/FOR_OURI_seam.md, or debugging contract-shaped failures: first read of a fresh contract 500s, .get(key, default) errors, import statements rejected, method missing on an older contract, a write that silently does nothing, wrong author/country on seeded proposals, 'solution' vs 'proposal' naming questions.
---

# Gloki Python Contracts

## Overview

Gloki contracts are Python classes executed by the IBC node's sandbox. They are **not normal Python**:
no imports, a fixed set of injected globals, dict-like Storage documents where missing keys return
`None`, an `__init__` that re-runs on **every** invocation, read calls that **forbid writes**, and total
immutability after deploy.

**Core principle: a method name is a wire protocol, and a deployed contract is unpatchable.** Every
method must byte-match what the UI sends, must survive on every contract deployed with it, and older
contracts never gain it. Design for absence-tolerance and additive growth.

### The contracts

| File | Deployed by | Role |
|---|---|---|
| `gloki_engage_community_contract.py` | `services/contracts/glokiEngageCommunity.ts` | a community: details + references to its issues; members = the contract's partners |
| `gloki_engage_initiative_contract.py` | `services/contracts/glokiEngageInitiative.ts` | one issue, every stage on one contract, on its creator's agent |
| `digital_agent_contract.py` | `components/identity/agent/digitalAgentContract.ts` | a person's profile (and account kind) |
| `gloki_verification_contract.py` | `services/verificationRegistry.ts` | the app-wide verified list, on the first verified person's agent |
| `gloki_engage_application_settings.py` | `services/applicationSettings.ts` | on the central application account; says where the verification contract lives |
| `funding_flow_contract.py` | `Currency.tsx` (through the demo layer's mocked deploy) | community funds (demo-only page) |
| `community_contract.py` | — | an older, richer community contract (membership graph, accounts). Not deployed by the app; a dialect reference and the model for the demo layer's community handler |

Every other contract type the UI talks to (approval, qv, conviction, chat, discussion, concerns, merge,
modification, problemVote, profile) exists only as a demo handler in `src/services/demo/demoContracts/`,
used by demo variants and demo communities.

## When NOT to use this skill

| You are actually doing... | Use instead |
|---|---|
| The demo layer itself — fixtures, seeding, DEMO_VERSION, localStorage | **gloki-seam-and-demo-data** |
| React-side plumbing: `useFlowContract`, flow registry, Redux, routing | **gloki-frontend-architecture** |
| What the methods *mean* (QV, trust, mandates) | **gloki-governance-domain** |
| Whether a change is allowed / push gates | **gloki-change-control** |
| Running the node, reading its logs | **gloki-build-env-run** |

## 1. The sandbox — what a contract may use

No `import` statements, ever. The runtime injects:

| Global | Behavior |
|---|---|
| `Storage(name)` | Persistent named collection, dict-of-documents (MongoDB in the node; `storage_interface.py` at the repo root is the bridge) |
| `master()` | Identity of the agent the call came **through** — see §2 |
| `timestamp()` | Current time value (a sortable string) |
| `partners()` | The contract's partner ids |
| `random(seed, state, n)` | Seeded PRNG: `[r, s]` = index in `[0, n)` + next state; chain with `random(None, s, n)`. Deterministic across nodes — never for secrets |
| `elapsed_time(a, b)` | Seconds between two `timestamp()` values |
| `parameters(key)` | Consensus value of a governance parameter |
| `hashcode(x)` | sha256 hex of `str(x)` |
| `read(contract_id, method, args)` | Read another contract (only when this contract's partners are all partners there) |

**Builtins allowed:** `str int list range dict len print type set enumerate abs sum min round`. Not
defined: everything else — `isinstance`, `bool`, `max`, `sorted`, `float`, `any`, `all`, `zip`,
`getattr` raise `name '…' is not defined`. Operators work (`x ** 0.5`, `type(a) == type(b)`). No
`datetime`, `json`, `uuid`.

A demo handler must only emulate behaviour these globals could express, or the demo variant promises
something the real contract can't do.

## 2. Contracts used without joining: the `agent` argument

Joining a contract makes the joiner a partner, and every write then goes through consensus among
partners. To keep interaction fast, the app **does not join** issue, verification or settings
contracts: everyone calls them on their host's node **through the host's agent**. So `master()` is
always the host, and **every member-specific method takes the acting person's key as an explicit
argument**:

```python
def upvote(self, agent):
    if self.get_stage() != 'problem':
        return {'error': 'Problem voting is closed'}
    self.votes[agent] = {'vote': 'up'}
```

- The issue contract names it `agent`; the UI never passes it by hand — `contractRead`/`contractWrite`
  add `agent: <signed-in key>` for the methods listed in `INITIATIVE_MEMBER_METHODS`
  (`services/contracts/glokiEngageInitiative.ts`), routed by `services/contractHosts.ts`. **A new
  member-specific method must be added to that list** — the two must match.
- The verification and settings contracts take the keys as named arguments (`requester`, `voucher`,
  `steward`, …) from their service modules.
- There are no signatures: anyone can send any key. That is the same trust model as everything else
  today; signatures are the G2/H1 work (MASTER_TODO §7).

The community contract *is* joined (membership = partnership), so it may use `master()` for the caller.

## 3. Storage semantics — the `.get()` trap and the `in` trap

`Storage('name')[key]` returns a **Document**. Missing keys return `None`, and a Document has **no
two-argument `.get(key, default)`** (CLAUDE.md: "no imports, no `.get(key, default)`").

```python
payment_count = self.properties['payment_count'] or 0       # CORRECT — the 'or default' idiom
payment_count = self.properties.get('payment_count', 0)     # WRONG
data = self.accounts[account].get_dict(); kind = data.get('type')   # fine: a plain dict now
```

- **Snapshot-then-writeback**: `get_dict()` returns a detached copy; assign it back to persist.
- **`in` works only for keys you set yourself** (a public key, a composite string such as
  `caller + ':' + proposal_id`). `append()` returns `str(ObjectId)` while the stored `_id` stays an
  ObjectId, so `append_id in self.comments` is **always False** — `like_comment`, `delete_comment`,
  `request_expert_review`, `add_expert_review`, `suggest_proposal_merge` are silent no-ops on a real
  node today. Iterating and comparing `str(key)` works (the ballot guards' `allocate` does this).
  `append()` also mints a different ObjectId in each partner's copy. Fix: key documents yourself, e.g.
  `pid = hashcode(agent + timestamp())`, `self.proposals[pid] = {..., 'id': pid}`.
- **`_`-prefixed methods aren't private**: hidden from the method list, callable by anyone. Don't
  write in them.
- Beware `x or default` with falsy-but-valid values; use `if key in doc` when `0`/`''`/`False` matter.

## 4. Runtime semantics that bite

**`__init__` re-runs on EVERY invocation, and read calls forbid writes.** Any write in `__init__` raises
on the first read of a fresh contract (HTTP 500):

```python
def __init__(self):
    self.db = Storage('mydata')
    if 'counter' not in self.db:
        self.db['counter'] = 0        # WRONG — boom on the first read
```

- `__init__` only binds `Storage()` handles; all writes live in explicitly-invoked methods. Initialise
  through a write method that refuses to run twice (the verification contract's `initialize`).
- Never keep counters (concurrency + this trap). Use self-chosen string keys.
- Reads must be pure. A refusal from a write returns `{'error': ...}` and writes nothing; it reaches the
  UI as the write's SSE reply.

## 5. Immutability — design for older contracts

A method or argument you add reaches only contracts deployed afterwards. Every change answers *what
happens on a contract that predates it?*

- **Add optional trailing arguments** (`cause_id=''`), never required ones, when older callers or
  readers must keep working. A caller that sends an argument an old contract doesn't know gets an
  error back — so when the UI starts sending a new argument, only new contracts accept it (the
  `add_proposal(..., cause_id)` incident: every solution failed on older issues).
- **A separate new method** fails only that one call on an old contract, which is often safer than a
  new argument on an existing method (the account-kind choice: `set_account_kind` rather than a new
  `set_profile` argument).
- **Readers tolerate absence**: read the newer method, fall back to an older one
  (`getInitiativeRoles` in `src/services/initiativeRoles.ts`: `get_roles` and `get_details` in
  parallel).
- Old contracts silently answer `null` to a method they don't define (reads) or ack it (writes).

The demo-layer escape hatches `set_property` / `get_properties` and `register_stage_contract` /
`get_stage_contract` (sub-contracts per stage) exist only on demo handlers and on the old
`community_contract.py` model — **not** on the real community or issue contracts, which keep every stage
on one contract.

## 6. How a method becomes callable

```
real .py method ⟷ real service wrapper (+ INITIATIVE_MEMBER_METHODS if member-specific) ⟷ docs/FOR_OURI_seam.md
                 ⟷ demo handler case (only if a demo variant or demo community uses it)
```

Change them together. **The wire-name rule** (`docs/FOR_OURI_seam.md`): method and field names match
exactly — "solution" and "mandate" are presentation words; the wire stays `proposal`
(`add_proposal`, `get_proposals`, `approve`, `get_results`). Never rename wire methods to match UI copy.

Finding names: `grep -n "    def " src/assets/contracts/<file>.py` (real);
`grep -n "case '" src/services/demo/demoContracts/<type>.ts` (demo).

### Calling convention (UI side)

`IMethod` (`src/services/interfaces.ts`): `{ name, arguments?, values?, parameters? }` — kwargs in
`values`, keyed by the exact Python parameter names.

- **Real writes** resolve when their event arrives; the reply is the method's return value
  (`{error}` → `throwIfContractError` in the flow APIs).
- **Demo writes** emit no events — re-fetch after the write (**gloki-seam-and-demo-data** §4).
- **Deploy return shape** (demo): `{ id }` or a plain string — guard both.
- **Read-only means `resolveInitiativeStageContract`** — `useFlowContract` deploys on mount
  (**gloki-frontend-architecture**).
- **Contract source** reaches a deploy through Vite's `?raw` import of the `.py` file, in the service
  that deploys it.

### Checklist: adding or changing a method

- [ ] No existing method or argument covers it
- [ ] Wire name in `proposal` vocabulary, snake_case
- [ ] Member-specific? Take `agent` (issue contract) and add it to `INITIATIVE_MEMBER_METHODS`
- [ ] Older deployed contracts considered (§5); readers have an absence fallback
- [ ] Writes refuse with `{'error': ...}` and write nothing on refusal; reads are pure
- [ ] `docs/FOR_OURI_seam.md` updated; demo handler updated if a demo variant uses it
- [ ] Checked on a local node (**gloki-build-env-run**): the write's `execution.log` line and SSE reply
- [ ] `npx tsc -b` clean

## 7. The QV carry-over revert — a settled anti-pattern

The only true revert in the repo's history (`963170d` on `archive/blockchain-main`, "revert(qv): drop
top-3 carry-over") seeded the Vote stage from the Proposals stage **client-side** and hit three data
bugs (author misattribution, a per-browser double-seed race, cross-initiative bleed). Full story:
**gloki-failure-archaeology**. Rules it settled:

- **Never seed shared contract state from one browser.** "First visitor initialises it" client logic is
  a race. Initialisation belongs in a contract method that refuses to run twice.
- **Cross-contract migration belongs contract-side**, idempotent, preserving canonical author/country.
- **Carry by read-join, not by write-copy**: the vote card reads proposals and joins by id at render time.

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Claim | Re-verify with |
|---|---|
| Contract files and who deploys them | `ls src/assets/contracts/`; `grep -rln "py?raw" src` |
| Member-specific methods | `grep -n -A10 "INITIATIVE_MEMBER_METHODS" src/services/contracts/glokiEngageInitiative.ts` vs `grep -n "def .*agent" src/assets/contracts/gloki_engage_initiative_contract.py` |
| Demo handler types | `ls src/services/demo/demoContracts/` |
| Sandbox builtins | the node's `common/state.py` (`docker compose exec ibc cat common/state.py`) |
| `in`-check no-ops still present | `grep -n "not in self.comments\|not in self.proposals" src/assets/contracts/gloki_engage_initiative_contract.py` |
| Wire-name rule wording | `sed -n '/one rule that must not break/,+6p' docs/FOR_OURI_seam.md` |
