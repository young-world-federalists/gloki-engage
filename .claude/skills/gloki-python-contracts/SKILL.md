---
name: gloki-python-contracts
description: "Use when reading, writing, or modifying Gloki Python blockchain contracts (src/assets/contracts/*.py), adding or renaming a contract method the UI calls (contractRead/contractWrite IMethod names), touching a demoContracts/*.ts stub handler, updating docs/FOR_OURI_seam.md, or debugging contract-shaped failures: first read of a fresh contract 500s, .get(key, default) errors, import statements rejected, method missing on an old community, wrong author/country on seeded proposals, 'solution' vs 'proposal' naming questions."
---

# Gloki Python Contracts — the dialect, the runtime traps, the wire discipline

## Overview

Gloki contracts are Python classes executed inside a sandboxed blockchain runtime
owned by Ouri (the backend maintainer). They are **not normal Python**: no imports,
a fixed set of injected globals, dict-like Storage documents where missing keys
return `None`, an `__init__` that re-runs on **every** invocation, read calls that
**forbid writes**, and total immutability after deploy.

**Core principle: a contract method name is a wire protocol, and the contract
itself is unpatchable.** Every method you invent must survive forever on every
community that ever deploys it, must byte-match Ouri's real contract, and must be
declared in three coupled places at once. Design for absence-tolerance and
append-only growth; never design anything that assumes you can fix it later.

On the `ui` branch you will almost never write a real `.py` contract — you extend
**stub handlers** that emulate them (see "When NOT to write a new contract"). But
the stubs must behave like the dialect, so you need the dialect anyway.

Jargon used below, defined once:

| Term | Meaning |
|---|---|
| **seam** | `src/services/api.ts` — the only module components may use to reach contracts (`contractRead`/`contractWrite`/`deployContract`/`joinContract`). On `ui` it delegates entirely to the mock layer in `src/services/demo/`. |
| **wire name** | The exact Python method/field name sent in `IMethod.name`/payloads. Must match Ouri's real contract byte-for-byte. |
| **stub / demo handler** | A TypeScript emulation of one contract type in `src/services/demo/demoContracts/<type>.ts`, dispatched by `.py` filename. |
| **FOR_OURI** | `docs/FOR_OURI_seam.md` — the single source of truth for every stub method Ouri must back with a real contract. |
| **shared mode** | `useFlowContract` with `parentContractId` + `stageKey`: one sub-contract per initiative stage shared by all members, registered on the parent. |
| **Ouri** | Backend maintainer. Owns real contracts, the runtime, and `ui` → `new-features` → `main`. |

## When NOT to use this skill

| You are actually doing... | Use instead |
|---|---|
| Working on the mock layer itself — fixtures, seeding, DEMO_VERSION, localStorage state model | **gloki-seam-and-demo-data** |
| React-side plumbing: `useFlowContract` modes, flow registry, Redux slices, routing | **gloki-frontend-architecture** |
| Reasoning about QV math, trust layers, mandate/ratification semantics (what the methods *mean*) | **gloki-governance-domain** |
| Deciding whether a change is allowed at all / push gates / product decisions | **gloki-change-control** |
| Digging into why something was deleted or reverted beyond the QV lesson here | **gloki-failure-archaeology** |
| Running/building the app, dev-server issues | **gloki-build-env-run** |

## 1. The sandbox — what a contract may use

No `import` statements, ever. Both real contracts in-repo contain zero imports.
The runtime injects exactly these globals (every one verified in
`src/assets/contracts/community_contract.py` at commit c26cdc4):

| Global | Signature / behavior | Verified at |
|---|---|---|
| `Storage(name)` | Persistent named collection; behaves like a dict-of-documents backed by MongoDB in the real runtime (`storage_interface.py` at repo root is the real bridge). | community_contract.py:4,10–13 |
| `master()` | Public key of the **caller** of this invocation. | :46, :77 |
| `timestamp()` | Current time value; also usable as a PRNG seed. | :15 |
| `partners()` | Contract partners list (present in the dialect; only a commented-out alternative to `get_members` in-repo). | :58 (comment) |
| `random(seed, state, n)` | Seeded PRNG. Returns `[r, s]` = index in `[0, n)` + next state; chain calls by passing `s` back with `random(None, s, n)`. Deterministic across nodes — never use for anything needing secrecy. | :97, :104 |
| `elapsed_time(a, b)` | Seconds between two timestamps. | :168 |
| `parameters(key)` | Runtime-level configured parameter (e.g. `'burn'`, `'mint'`, `'commons_mint'`). | :173, :178, :180 |

Nothing else. No `datetime`, no `json`, no `uuid`, no `print`. If a stub handler
emulates behavior a real contract couldn't express with these globals, the stub
is lying and will break at the `ui` → `new-features` hand-off.

## 2. Storage semantics — the `.get()` trap

`Storage('name')[key]` returns a **Document**. Documents index like dicts, but
`storage_interface.py` (`Document.__getitem__`) is implemented as
`self.get_dict().get(key)` — **a missing key returns `None`**, and there is **no
two-argument `.get(key, default)` on a Document**. CLAUDE.md states this as the
rule: "no imports, no `.get(key, default)`".

The dialect idiom, straight from `community_contract.py`:

```python
# CORRECT — the 'or default' idiom (community_contract.py:272, :287)
payment_count = self.properties['payment_count'] or 0

# WRONG — Documents have no default-arg get
payment_count = self.properties.get('payment_count', 0)   # runtime error / not the dialect
```

Plain-dict `.get(key, default)` IS fine — but **only after** `.get_dict()`, which
snapshots the document into a real Python dict (strips the Mongo `_id`):

```python
# CORRECT — .get on a real dict after get_dict() (community_contract.py:174, :248)
account_data = self.accounts[account].get_dict()
account_type = account_data.get('type')            # fine, it's a plain dict now
```

Two follow-on rules the real contracts model:

- **Mutate via snapshot-then-writeback.** `get_dict()` returns a detached copy;
  mutating it does nothing until you assign it back:
  `self.accounts[sender] = sender_account` (community_contract.py:204).
- **Membership tests work directly on Storage**: `if requester in self.members`
  (:78), `for key in self.issues` (:22). Iteration yields keys.
- Beware `x or default` with falsy-but-valid values: `0 or 0` is harmless, but
  `stored_flag or True` would clobber a stored `False`. Use `if key in doc`
  checks when `0`/`''`/`False` are meaningful.

## 3. The runtime semantics that bite

**`__init__` re-runs on EVERY invocation, and read calls forbid writes.**
In `storage_interface.py`, every `Document.__setitem__`/`__delitem__`/`append`
raises `WritePermissionException` unless the invocation was dispatched as a
write. So this classic pattern **500s on the first read** of a fresh contract:

```python
# WRONG — conditional write in __init__: the first *read* call re-runs
# __init__, hits the write, and raises WritePermissionException → HTTP 500
def __init__(self):
    self.db = Storage('mydata')
    if 'counter' not in self.db:
        self.db['counter'] = 0        # boom on first read
```

This is a documented architecture learning (ARCHITECTURE.md "Gloki contracts
re-run `__init__` on every invocation AND disallow writes during read calls").
The fix pattern:

- **Never keep counters.** Counter-keyed IDs also caused the concurrency half of
  the QV revert (§6). Use `timestamp()`-keyed IDs / `Storage.append` instead —
  the pattern used by the discussion/chat/concerns contracts.
- `__init__` should only bind `Storage()` handles to `self`. All writes live in
  explicitly-invoked write methods.

**Known dialect edge, owned by Ouri — do not copy it:**
`community_contract.py:14–15` DOES conditionally write `centralAccount` in
`__init__`. It survives because of runtime specifics on Ouri's side; treat it as
a grandfathered exception in Ouri's contract, not a license for the pattern.

## 4. Immutability after deploy — design escape hatches, tolerate absence

CLAUDE.md, verbatim: **"Contracts are immutable after deploy — new methods
require new communities."** A method you add today never reaches any community
deployed yesterday. Every design must answer: *what happens on a contract that
predates this feature?*

Escape hatches that already exist (use these before inventing methods):

| Hatch | What it gives you | Where |
|---|---|---|
| `set_property(key, value)` / `get_properties()` | Arbitrary key→value on the community contract without new methods. Ratification data rides this on the initiative contract (added in S13). | community_contract.py:66–70; stub `demoContracts/community.ts:183`, `initiative.ts` |
| `register_stage_contract(stage_key, contract_id, address, agent)` / `get_stage_contract(stage_key)` | Attach arbitrary sub-contracts (chat, discussion, stage flows) to a parent without the parent knowing about them in advance. **First-write-wins idempotent**: if the key exists the existing payload is returned, never overwritten — this is how concurrent deploy races resolve (`demoContracts/initiative.ts:137–155`). | Stubs: `initiative.ts:68,137`, `community.ts:121,253`; documented ARCHITECTURE.md:60 |
| `set_sub_contract(name, invite)` / `get_sub_contract(name)` | Older generic sub-contract slot on the community contract. | community_contract.py:33–37 |

⚠️ Snapshot honesty: the in-repo `community_contract.py` (ui AND main copies)
contains `set_sub_contract` but **not** `register_stage_contract`, even though
ARCHITECTURE.md:60 attributes it to that file. The demo stubs implement it and
the UI relies on it; the in-repo `.py` files are **dialect exemplars, not the
current wire surface**. Wire truth = FOR_OURI + the stub case labels.

Consequences to encode in every change:

- **New fields, not new methods, wherever possible** — and always optional +
  backward-compatible. FOR_OURI S4 is the template: `add_proposal` *gained*
  optional `commitments`/`co_authors`; old proposals simply lack the field.
- **Readers tolerate absence.** The canonical fallback template is
  `getInitiativeRoles` (`src/services/initiativeRoles.ts:24–67`): it reads
  `get_roles` AND `get_details` in parallel, and when `get_roles` is missing or
  empty (older/demo contracts don't implement it) it recovers the author from
  `get_details`. Copy this shape for any read of a possibly-newer method.
- **Old communities silently no-op missing methods** — a community deployed
  before `register_stage_contract` can never host chat/discussion sub-contracts;
  `useFlowContract` shared mode surfaces a "feature isn't available" error card
  (ARCHITECTURE.md Known Limitations). The only "fix" is a fresh community.

## 5. How a `.py` method becomes callable UI-side — three things move together

A contract method exists in **three coupled places**; changing any one without
the others breaks either the demo today or Ouri's hand-off later:

```
Python method name  ⟷  demoContracts/<type>.ts case label  ⟷  docs/FOR_OURI_seam.md entry
   (Ouri's real           (what the ui branch actually          (the hand-off ledger Ouri
    contract)              executes)                             implements against)
```

Routing mechanics (`src/services/demo/demoRouter.ts`): at deploy time the
registry stores the contract's `.py` **filename**; `routeRead`/`routeWrite` look
the filename up in a `READ`/`WRITE` map of 13 handler pairs:

`community_contract.py`, `initiative_contract.py`, `problem_vote_contract.py`,
`approval_contract.py`, `qv_contract.py`, `conviction_contract.py`,
`modification_contract.py`, `chat_contract.py`, `discussion_contract.py`,
`concerns_contract.py`, `merge_contract.py`, `gloki_contract.py` (profiles),
`funding_flow_contract.py`.

Only **two** of those have real `.py` source in-repo
(`src/assets/contracts/community_contract.py`, `funding_flow_contract.py`); the
other 11 exist only as stubs awaiting Ouri's real implementations. Unknown or
stale contract IDs (e.g. rehydrated localStorage flow IDs from a previous demo
generation) auto-register as orphan stubs — reads return `null`, writes no-op —
so the UI degrades instead of crashing (`demoRouter.ts:56`).

**The wire-name rule ("the one rule that must not break", FOR_OURI):** UI method
and field names MUST match Ouri's real contract exactly. "solution" and
"mandate" are **presentation vocabulary only** — the wire stays `proposal`. The
Solutions UI calls `add_proposal`/`get_proposals`/`approve`/`withdraw_approval`
(case labels in `demoContracts/approval.ts:93–210`); the Mandate page reads
`qv.get_results` + `approval.get_proposals`. This nearly broke once: when the UI
renamed Proposals→Solutions (2026-06-21), renaming the wire methods was
explicitly rejected and the rule was codified. Never "clean up" wire names to
match UI copy.

**Discovering valid method names:** grep the stub's case labels — they ARE the
wire surface:

```bash
grep -n "case '" src/services/demo/demoContracts/approval.ts
```

### The UI-side calling convention

`IMethod` (`src/services/interfaces.ts:16`):
`{ name: string; arguments?: string[]; values?: Record<string, unknown>; parameters?: Record<string, unknown> }`
— Python kwargs go in `values`, keyed by the **exact Python parameter name**
(snake_case). Real worked example (`src/services/contracts/community.ts`):

```ts
await contractWrite({
  serverUrl, publicKey, contractId,
  method: {
    name: 'set_property',                       // exact .py method name
    values: { key: 'name', value: communityName }, // exact .py kwarg names
  } as IMethod,
});
```

Client-side companion rules (full treatment in **gloki-frontend-architecture**;
listed here because they pair with contract semantics):

- **Deploy return-shape guard** — `deployContract` may return `{ id }` OR a
  plain string. Always: `const contractId = (resp as { id?: string })?.id ?? (resp as string)`
  (pattern at `src/services/contracts/community.ts:40`).
- **Write-then-refetch** — the demo seam emits NO `contract_write` events
  (`eventStream.ts` is a real SSE client the mock layer never feeds). After
  every `contractWrite`, explicitly re-run the read or the UI shows stale state.
- **Read-only means `resolveInitiativeStageContract`** — a "read-only" component
  calling `useFlowContract` is NOT read-only: shared mode joins-or-**deploys**
  (S11 incident). Use `resolveInitiativeStageContract`
  (`src/services/contracts/initiative.ts`) for pure reads of a sub-contract.
- **`?raw` imports** — contract source reaches `deployContract` via Vite's
  `?raw` suffix. Exactly ONE site exists:
  `src/components/community/Currency.tsx:21` importing
  `funding_flow_contract.py?raw` (passed as `code` at :312). MASTER_TODO §4's
  working model forbids **new** `?raw` Python imports on `ui` — new data goes in
  demo fixtures; this one site is grandfathered.

### Checklist: adding a wire method (rare — see §7 first)

- [ ] Confirm no existing method/field/escape-hatch covers it (grep stub case labels; check `set_property`, `register_stage_contract`)
- [ ] Name it in Ouri's vocabulary (`proposal`, snake_case), never UI vocabulary
- [ ] Add the `case '<name>'` to the right `demoContracts/<type>.ts` handler (read or write side); emulate only what §1–§3 dialect could express
- [ ] New fields optional + backward-compatible; reader gets an absence fallback (§4 template)
- [ ] Add the method to `docs/FOR_OURI_seam.md` with semantics, caps, and any role-gating the REAL contract must enforce (demo stubs are permissive by convention — e.g. `add_expert_review` must be role-gated for real, stub isn't)
- [ ] Component calls it only through the seam (`contractRead`/`contractWrite` from `src/services/api.ts`)
- [ ] Re-fetch after the write; `npx tsc -b` clean
- [ ] S13 precedent: the addition was made **with Eston/Ouri sign-off** — treat wire-surface growth as a recommend-then-confirm decision (see gloki-change-control)

## 6. The QV carry-over revert — the settled contract-design anti-pattern

The **only true revert in the repo's history** is a contract-integration lesson:
`963170d` on `archive/blockchain-main` (2026-04-24), "revert(qv): drop top-3
carry-over". The feature seeded the Vote stage's QV contract from the Proposals
stage **client-side**; a post-implementation review found three blocking
data-integrity bugs (`master()`-as-author misattribution, a per-browser-ref
double-seed race, and cross-initiative contract bleed). The full postmortem —
bug-by-bug, from the revert commit body — is homed in **gloki-failure-archaeology**
entry 2 (`git log -1 --format=%B 963170d`).

The settled contract-design rules it encodes (never re-fight):

- **Never seed shared contract state from a per-browser ref.** Any "first
  visitor initializes it" client logic is bugs 1+2 waiting to happen.
- **Cross-contract data migration belongs contract-side**: the revert body
  prescribes the shape — an idempotent `seed_from_approvals`-style method that
  preserves canonical author/country and rejects if state already exists
  (`proposal_count > 0`).
- **Key any cached contract ID by its collaboration/initiative ID**, never hold
  it in a ref across navigations.
- The concept was later rebuilt **safely** on `ui` as the S5 "carry spine"
  (`169a149`, 2026-06-27): the vote card **reads** the approval contract and
  joins rows by proposal id at render time — carry by read-join, not by
  write-copy. `register_stage_contract`'s first-write-wins idempotency (§4) is
  the same race-resolution philosophy applied to deploys.

## 7. When NOT to write a new contract at all

Default answer on `ui`: **don't.**

| Situation | Do this instead |
|---|---|
| Feature needs data the UI doesn't have | New fixture in `src/services/demo/fixtures/*`, read through the mock layer (MASTER_TODO §4: "Hardcoded UI only... No real backend; no `?raw` Python imports") — see **gloki-seam-and-demo-data** |
| Feature needs a new backend behavior | New `case` in an existing stub handler + FOR_OURI entry (§5 checklist), with Eston sign-off |
| Existing contract "needs" a new method on deployed communities | It can't get one (§4). Use `set_property`/`register_stage_contract`, or accept the old-community error card |
| Behavior truly needs a new contract **type** | That is a product + backend decision: recommend to Eston, coordinate with Ouri (he owns real contracts and the runtime). Both real `.py` files in-repo are Ouri's; the `ui` branch has never added one |
| Tempted to edit `src/assets/contracts/*.py` | Treat as read-only exemplars of the dialect. Changing them changes what `deployContract` ships as `code` — Ouri's domain |

Also remember the unwritten rules that bound this skill: pushes to `ui` are
production deploys gated on Eston's explicit green light; `ui` → `main` lands
via Ouri, never by you; locked product decisions (1p1v, trust model, etc.) are
not relitigated through contract design. See **gloki-change-control**.

## Provenance and maintenance

Verified 2026-07-02 at commit `c26cdc4` (branch `ui`) by direct reads of:
`src/assets/contracts/community_contract.py` (337 lines) and
`funding_flow_contract.py` (57 lines), `storage_interface.py`,
`src/services/demo/demoRouter.ts`, `demoContracts/{initiative,community,approval,qv}.ts`
case labels, `src/services/api.ts`, `src/services/interfaces.ts`,
`src/services/contracts/community.ts`, `src/services/initiativeRoles.ts`,
`src/components/community/Currency.tsx`, `docs/FOR_OURI_seam.md`,
ARCHITECTURE.md, CLAUDE.md, MASTER_TODO.md §4, and `git show 963170d`.
QV-revert details are from that commit body; S11/S13 incident framing is
recorded in project memory (2026-07) and consistent with ARCHITECTURE.md.

Volatile facts — re-verify before relying on them:

| Claim | Re-verify with |
|---|---|
| 13 stub contract types / filename map | `grep -n "contract.py" src/services/demo/demoRouter.ts` |
| Only 2 real `.py` files in src | `ls src/assets/contracts/` |
| Exactly one `?raw` Python import | `grep -rn "py?raw" src --include='*.ts' --include='*.tsx'` |
| Wire surface of a contract type | `grep -n "case '" src/services/demo/demoContracts/<type>.ts` |
| In-repo community contract still lacks `register_stage_contract` | `grep -n "def " src/assets/contracts/community_contract.py` |
| FOR_OURI still the hand-off ledger / "one rule" wording | `sed -n '1,15p' docs/FOR_OURI_seam.md` |
| `__init__` learning + read-only-access learning line numbers | `grep -n "re-run" ARCHITECTURE.md` |
| Runtime day-length still test-accelerated (÷600 not ÷86400) | `grep -n "/ 600" src/assets/contracts/community_contract.py` |
