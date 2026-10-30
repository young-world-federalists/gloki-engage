# Signing on the ibc node: seven decisions (29 Oct 2026)

Recommendations for Ouri's seven open questions, written against `ouripoupko/ibc` at `2622314` and `gloki-engage`
`server-side` at `0cbbf6e`, read-only. Companion to `2026-10-29-signatures-sizing.md`, whose file:line claims were
checked against the code (results in the last section). Every line reference below was read, not copied.

**Summary for non-engineers.** Today the Gloki node believes whatever a request says about who sent it, and anyone
can install code on it. Fixing that means giving every person a real cryptographic key, making the app sign every
change with it, and making nodes check the signature before acting. The decisions here keep that as small as a
two- or three-person volunteer team can build: a person's identity *is* their public key (no directory to run),
nodes get their own keys for talking to each other, contracts say in code who may call them, the beta's existing
accounts are retired rather than migrated (they were never secret), the unowned central account `gloki-application`
is removed rather than given to someone, and each node keeps a short list of approved contract code. What this does
not do: it does not stop a node operator from misbehaving on behalf of the people on their node, it does not
recover a lost key (nothing can, by design), it does not protect a key from a hacked browser page, and it does not
make the node's Python contract runner a real sandbox. Those are named, not hidden, below.

---

## The seven decisions

### 1. Agent id: make it the Ed25519 public key

**Recommendation.** The agent id is the Ed25519 public key, encoded as 64 lowercase hex characters. No separate
key registration.

**Why.** The node has nowhere to look a key up: a partner's node holds only `address` and `profile` for each
partner (`execution/contract_execution.py:63-64`), and `register_agent` stores only `address`
(`execution/execution_navigator.py:46-55`). If the id were not the key, every node that checks a signature would
need a directory, and that directory would need its own trust story. With id = key the check is local and total.
Hex happens to fit: it is 64 alphanumeric characters, which is exactly what the app validates today
(`src/pages/LoginPage.tsx:71-72`) and what every URL, Mongo `_id` and partner table already carries. Legacy ids are
mixed-case, so `^[0-9a-f]{64}$` tells a key id from a legacy id with no realistic false positive
((16/62)^64 ≈ 2×10⁻³⁸); decision 4 relies on that.

**Costs.** App: M (generate, store, export, import; `generateKeyString` at `LoginPage.tsx:16-23` goes, and the
`user` blob in `localStorage` at `AuthContext.tsx:120` must now hold a private key, see "Honest limits"). Node: S
(accept new registrations only for hex ids). Breaks every existing id and the name `gloki-application` (decision 5).

**Would change my mind.** A plan to support several key algorithms per agent, or key rotation without changing id.
Both need an indirection layer; neither is on the table for a beta.

**Confidence.** High.

### 2. Node-to-node messages: node keys, with the agent's signed request as the delegation

**Recommendation.** Each node has one long-lived Ed25519 node key and signs every agent-to-agent HTTP message
(`a2a_connect`, `a2a_reply_join`, `a2a_consent`, `a2a_get_ledger`). A node is allowed to speak for an agent because
the agent's *signed* `register_agent` and `join_contract` requests name that node's address and public key; the
receiving node pins the node key per partner at `a2a_connect` and verifies against it from then on. The original
client request keeps travelling inside consensus as `'o'` with its own signature, so partners can verify the person
and the node separately.

**Why.** PBFT here runs between *agents*, one replica per agent, hosted on the agent's node (`partners_db` maps pid
to address, `consensus/consensus_navigator.py:39-41`; `Partner.consent` posts to the partner's address with the
sender only as a body field `from`, `common/partner.py:36-41`). The agent's browser is offline when the protocol
runs, so the node must be the signer of PRE-PREPARE, PREPARE and COMMIT; nothing else fits without changing the
protocol. Two things make a plain node signature insufficient, and both are already needed: the agent must bind
itself to the node (otherwise any node could claim any agent), which the signed `register_agent`/`join_contract`
gives for free once decision 1 and the signed-write envelope exist; and the PBFT code must *use* the authenticated
sender. Today `check_phase` counts votes by the unauthenticated field `i` (`consensus/pbft.py:206-208`),
`receive_pre_prepare` checks neither the digest nor that the sender is the leader (`pbft.py:142-147`), and
`receive_prepare`/`receive_commit` check nothing (`pbft.py:177-187`). One forged partner can commit any block alone.
Signing the messages and then ignoring who signed would change nothing, so piece 6 includes: `i` must equal the
verified sender, pre-prepare must come from `names[order[view]]`, and `d` must equal `sha256(block)`.

**Costs.** L. Adds a key file to the node (generated on first start, kept in a volume), a `GET /ibc/node` that
returns the public key, one extra GET in the app before `register_agent`, a `node_key` field in `pda_partners`, and
the PBFT checks above. Breaks nothing for a single-node contract; mixed old/new nodes cannot talk, which is fine at
beta scale.

**Would change my mind.** If Ouri intends agents to move between nodes often, the node binding should be a
separate short-lived delegation the browser re-signs at sign-in rather than the registration record. If he
intends to replace PBFT (the `nakamoto.py` stub), stop and design for that instead.

**Confidence.** Medium. The shape is right; the number of places PBFT needs touching is where estimates slip.

### 3. A signer who is not the URL's agent: accept it, and let the contract decide, closed by default

**Recommendation.** The node verifies the signature of whoever signed, exposes it to the contract as `signer()`
next to `master()`, and applies one default rule before queueing a write: `signer() == master()`. A contract that
wants to accept other signers defines `approve_signer(self, signer, method)`, the same pattern as
`approve_partner`. Permitted methods are expressed in contract code, nowhere else.

**Why.** The hosted-contract pattern is how most Gloki writes work (`src/services/api.ts:37-45`,
`src/services/contractHosts.ts:7-9`), and the right owner of "who may call `vouch`" is the verification contract,
which already encodes that rule, just on an unauthenticated argument (`gloki_verification_contract.py:100-112`).
`master()` is set from the URL agent at `common/state.py:29-30` and `:117-118`; `signer()` is one more field on the
record. Closed-by-default matters because contracts that know nothing about signing become owner-only
automatically: `digital_agent_contract.py:6-13` checks nobody today and would be protected without an edit, and
`gloki_engage_community_contract.py:10-15` uses `master()` through members' own agents, which still passes. The
hook mirrors `approve_partner`'s default at `state.py:132-133`, so Ouri's authors learn one convention.

**Costs.** M. Node: record field, `signer` builtin, default check in `dispatcher/navigator.py` before
`send_to_consensus` (`:107-113`) and again in `execution/execution_navigator.py:86-94` (partners replay there).
Contracts: the four Gloki contracts drop their `agent`/`voucher`/`steward` arguments and read `signer()`
(appendix B lists the lines). Breaks the app's call shapes for those methods; they live in three service files.

**Would change my mind.** If Ouri wants the node, not the contract, to carry an access policy. I would not: it
duplicates logic the contract must have anyway, and it would mean node config per contract.

**Confidence.** High.

### 4. Data on gdi.gloki.contact: fresh start, legacy ids frozen

**Recommendation.** Fresh start. Signed nodes refuse writes and new registrations for any id that is not a hex
key; legacy agents and their contracts stay readable. No claim mechanism.

**Why.** A claim is only safe if the old id proves something, and it proves nothing: the id is the only secret, and
it is in every URL, every partner list, and the verified list itself (`a2a_get_ledger` hands anyone any ledger,
`dispatcher/navigator.py:125-133`). Whoever claims first wins, and an attacker can script "first". There is also
little to save: the trust-model note found the live app back in the founder phase with no settings contract, and
the founder is about to be created on node1. Anything a person wants to keep (a profile, a community) is re-created
by them under a new key in minutes. The regex from decision 1 is the whole implementation.

**Costs.** S in code, plus an announcement. Breaks every existing account, on purpose, once.

**Would change my mind.** A community with real history on gdi that its members want carried over. Even then the
safe path is manual: Ouri and YWF confirm each owner out of band and re-create, which is operator attestation,
not a claim protocol.

**Confidence.** High.

### 5. `gloki-application`: nobody holds its key; retire the account

**Recommendation.** Remove the central account. The app ships the verification hosts as build-time
configuration, next to the default server URL it already ships, and finds the verification contract on a host by
name. Changing the list is a reviewed pull request merged by a maintainer from each operator. When a second
steward holds a copy, replace the list with a *joined* settings contract whose `approve_signer` requires
`signer() in partners()`, so changes go through PBFT between the stewards' nodes. That is on-chain multi-sig using
machinery the node already has; no threshold cryptography.

**Why.** The account is a name with no owner (`.env`: `VITE_APPLICATION_AGENT=gloki-application`), and anything
built on it inherits that: `register_verification` lets any caller repoint any host entry
(`gloki_engage_application_settings.py:31`), and `ensureSettingsId` deploys the signpost from whichever browser gets
there first (`src/services/applicationSettings.ts:54-86`, first contract listed wins at `:48-49`). Giving one
person the key does not fix the governance; it names the single point of control. The honest observation is that
the app build is already the root of trust: it ships the contract code, the default node URL and this account
name. A host list in the same place adds no new trust and removes a writable, unauthenticated one. The rehearsal
note already treats "when node1 is down, the signpost still answers" as the signpost's main value; a built-in list
gives the same.

**Costs.** S, and it deletes code (`applicationSettings.ts`, the settings contract, the signpost step in
`becomeFounder`, `verificationRegistry.ts:195-224`). Breaks the signpost design Ouri just added; this needs his
agreement, not just a PR. The joined-contract follow-up is M and needs decision 3 first.

**Would change my mind.** If Ouri wants a settings record that non-developers can change without a release. Then
build the joined stewards' contract first and skip the list.

**Confidence.** Medium on the second step, high that nobody should hold a single key for this.

### 6. Python library: PyNaCl

**Recommendation.** PyNaCl (`nacl.signing.SigningKey` / `VerifyKey`), pinned to a release at least a month old.

**Why.** The node needs exactly Ed25519 sign and verify, and PyNaCl's API has one way to do each, which is the
property that matters for a volunteer team. It wraps libsodium and ships wheels for the `python:3.12-slim` image on
x86-64 and arm64, so the Dockerfile only gains a line in `requirements.txt`. `cryptography` would also work
(`hazmat.primitives.asymmetric.ed25519`) and is already a transitive dependency of nothing here; it is larger and
its API has more ways to hold it wrong. In the browser use `@noble/ed25519` (audited, small, works in tests under
Node); WebCrypto's Ed25519 is in current Chrome, Safari and Firefox but not in every embedded webview, and the
app's "paste your key" model needs an exportable seed anyway. Do not canonicalise JSON: sign the exact UTF-8 bytes
of a payload string and have the node verify those bytes before parsing (appendix A). That removes a whole class of
"Python and JavaScript serialise differently" bugs, and the contracts' use of integers and strings only
(`gloki_engage_initiative_contract.py:36-47` goes out of its way to avoid floats) means no numeric edge cases.

**Costs.** S.

**Would change my mind.** A need for anything beyond Ed25519 (X25519 for encryption, hashing beyond `hashlib`),
in which case `cryptography` is the one dependency to carry.

**Confidence.** High.

### 7. Contract upgrades under a hash allow-list: new version beside old, list file per node, hot-read

**Recommendation.** The node reads an allow-list file (`IBC_CONTRACT_ALLOWLIST`, JSON: SHA-256 of the code → name,
version, `active` or `legacy`) on every deploy, no restart. `active` hashes may be deployed; `legacy` hashes may
only be replayed on join and read. An upgrade is a new file in `src/assets/contracts/` with a new hash, deployed as
a new contract; data does not migrate, the app knows which version it is talking to by hashing the `code` that
`get_contracts` already returns (`dispatcher/navigator.py:68-74`). The list lives in the gloki-engage repo,
generated from the contract files by a script that CI runs so the two cannot drift; operators copy it when they
pull. Unset variable means allow all with a loud startup warning, so a developer's local node is unchanged.

**Why.** This matches how ibc already treats contracts as immutable (the `set_account_kind` comment in
`digital_agent_contract.py:15-17` says so, and Ouri added a method rather than edit one). Enforce at
`execution/execution_navigator.py:57-72`: both the client deploy and the join-replay path end there
(`consensus/consensus_navigator.py:62-65` replays `deploy_contract` records fetched from an address the *message*
supplies, `:60-62`), so one check covers both. Add an early refusal in `dispatcher/navigator.py:86-90` for a
useful error. This is also the one piece that closes today's remote-code-execution path on its own, with no keys
involved (see "Wrong or missing").

**Costs.** S–M in the node, S in the app (hash script, CI check). The real cost is process: every contract change
needs both operators to update a file before the app release that uses it. That is the point of the list, and it
is cheap while there are two operators.

**Would change my mind.** More than a handful of node operators, at which point the list should be a signed
document fetched from the app's release, or deploy should require a maintainer signature. Or a real sandbox, which
makes the list a convenience rather than a defence.

**Confidence.** High.

---

## How the answers fit together

**Chain of trust after all seven.** A person holds an Ed25519 key; their id is its public half (1). They sign each
write with it; the node checks the signature, the timestamp and a nonce before queueing, and derives the record
hash from the signed bytes so partners can check it too (3, 6, appendix A). The write runs as `signer()`; a
contract that accepts other signers says so in code, and a contract that says nothing is owner-only (3). The
person's signed registration names their node and its key, so when that node speaks in consensus, partners know
which agent it speaks for and verify its node signature against the pinned key (2). Each node runs only contract
code on its list (7). Nobody owns a magic account; what the app trusts is in its reviewed build (5). Old ids keep
their history and lose their pen (4).

**What this defends against.** Anyone on the internet writing as someone else, vouching as someone else, repointing
the verified list, deploying code on any node, forging consensus votes, or replaying a captured write on the same
or another node. These are the attacks that are trivial today and that the two-operator setup makes urgent: node1's
founder would otherwise be impersonable by anyone who reads the URL.

**What it explicitly does not defend against.**

- **A dishonest node operator.** The node signs consensus for its agents; it can vote however it likes for them. It
  cannot forge a person's *write* (that needs the person's key), but it can drop, delay or reorder. With two
  operators, PBFT's f=0; that is a feature of beta, not a property of the design.
- **Replay beyond the window.** The nonce store is per node with a TTL; a request older than the window is refused
  by timestamp, so the window is the bound. Partners re-verify the signature on `'o'` but rely on the originating
  node's nonce check for freshness.
- **Key loss.** There is no recovery and must not be: a recovery path is a second key held by someone else. A lost
  key is a new person to the system; vouchers must vouch again. Mitigate with a backup step at creation (the
  rehearsal script already does this by hand) and, later, a signed "successor key" statement contracts can honour.
- **A compromised browser page.** The private key lives where the app runs. A GitHub Pages SPA with third-party
  dependencies has an XSS surface, and XSS can sign. WebCrypto non-extractable keys would stop theft but not use,
  and conflict with "paste your key". Passphrase-encrypting the stored seed raises the bar against a stolen
  device, not against XSS. State this to users plainly.
- **Contract code.** `exec` with a reduced `__builtins__` (`common/state.py:76-85`) is not a sandbox. The dict
  leaves `type` and `__build_class__`, and attribute access is syntax, not a builtin: `().__class__.__base__` and
  friends reach the whole interpreter. Approved code has the node's full rights inside its container (the Dockerfile
  at least runs it as uid 1000). The allow-list means *reviewed* code runs, nothing more. Note also that contract
  code runs in the web process on every read (`dispatcher/contract_view.py:14-15` via `navigator.py:51-56`), not
  only in the execution service.
- **Privacy.** Reads stay unsigned and every ledger is public. Separate question, unchanged.

---

## Revised build order

| # | Piece | Size | Change from the sizing note |
|---|---|---|---|
| 1 | Allow-list, enforced in `execution_navigator.deploy_contract`, early refusal in the dispatcher, hot-read file, `active`/`legacy` | S–M | Same piece; pin the enforcement point, and do it first because it closes RCE without keys |
| 2 | Keypairs in the app (`@noble/ed25519`), id = hex pubkey, backup/export/import; node accepts only hex ids for `register_agent` | M | Same |
| 3 | Signed-write envelope (appendix A): verify at the dispatcher, timestamp window, nonce in Redis, `hash_code` from signed bytes | M | Same; adds the hash-derivation change |
| 4 | `signer()`, default `signer == master`, `approve_signer` hook; the four Gloki contracts switch to `signer()`; **retire `gloki-application`, build-time host list** | M | Merges decision 5 here: the same contracts and service files change, and it removes code |
| 5 | Partners re-verify the signature on `'o'` in `receive_request` and before `execute`; refuse a duplicate `d` (today a duplicate request id would be appended twice at `pbft.py:116` and crash on the second `pop` at `:269`) | M | Same, plus the dedupe |
| 6 | Node key, `GET /ibc/node`, node signature on all a2a messages, `node_key` pinned in `pda_partners`, PBFT uses the authenticated sender, checks leader and digest | L | Same size; the PBFT check fixes are now named as part of it |
| 7 | Cutover on gdi and node1: fresh start, legacy ids frozen, announcement | S | "Claims" dropped |

1 and 2 in parallel; 3 after 2; 4 and 5 after 3; 6 independent of 3–5 but after 2 (it needs the node key field in
the signed registration); 7 last. Pieces 1–5 are testable on one local node; 5 and 6 need two.

---

## Wrong or missing in the sizing note

Every file:line reference in the sizing note's appendix checked out against the code. The corrections are about
emphasis and omissions:

1. **Missing: the join-replay path is remote code execution today, and the fix is piece 1, not signatures.**
   `a2a_reply_join` fetches a ledger from the address in the *message* (`consensus/consensus_navigator.py:60-62`)
   and replays each record with `direct=True` (`:63-65`), which skips consensus (`pbft.py:224-229`). A ledger
   containing a `deploy_contract` record lands in `execution_navigator.deploy_contract` and `exec`s. Anyone can PUT
   that message to `/ibc/app/<victim>/<contract>?action=a2a_reply_join`. The note says "anyone can deploy"; it
   should say this makes the allow-list the first thing to ship, enforced at the execution choke point.
2. **Missing: PBFT has no Byzantine tolerance without authenticated senders**, independent of client signatures
   (`pbft.py:142`, `:180`, `:186`, and the `i` count at `:206-208`). Piece 6 must change the checks, not only add
   signatures. The note sizes 6 as L; that still holds, but the content is different.
3. **Missing: `hash_code` is set by the receiving node** over `str(record)` including the server's own timestamp
   (`ibc.py:44-45`), so the request id and the contract id are not derivable by anyone else. Under signing, derive
   it from the signed bytes, or partners cannot check `d` against `o`.
4. **Overstated: "Nothing new needs storing at sign-up."** Decision 2 adds `node_key` to the partner record.
5. **Understated: the central account.** The note calls it "a governance question". It is also a code question with
   a small answer (retire it), and it belongs in piece 4, not piece 7.
6. **Missing: the web process runs contract code on reads** (`dispatcher/contract_view.py:14-15`), so a sandbox
   escape has two homes, not one.
7. **Minor:** join is `api.ts:271-295`, not `:280-295`; `nakamoto.py` is 51 lines and referenced nowhere, so
   question 7 of the note ("can it stay out of scope") is yes.

---

## Appendix A: the signed-write envelope

```
PUT/POST /ibc/app/<agent>/<contract>/<method>?action=<action>
{
  "payload": "<UTF-8 JSON string, produced by the client, not re-serialised by the node>",
  "signer":  "<64 hex, Ed25519 public key>",
  "sig":     "<128 hex, Ed25519 signature over the payload bytes>"
}
```

`payload` decodes to `{ "v": 1, "action", "agent", "contract", "method", "values", "parameters"?, "aud": "<node base
URL>", "ts": <unix ms>, "nonce": "<16 random bytes, hex>" }`. The node:

1. Verifies `sig` over the raw `payload` bytes with `VerifyKey(bytes.fromhex(signer))`. No parsing before this.
2. Parses `payload`; refuses if `action`, `agent`, `contract`, `method` disagree with the URL and query (the URL is
   routing, the payload is truth), if `aud` is not this node, if `|now - ts| > 300 s`, or if `SET NX EX 600` on
   `nonce:<signer>:<nonce>` fails in Redis.
3. Sets `record['signer'] = signer`, `record['hash_code'] = sha256(payload bytes)`, keeps `record['message'] =
   parsed payload` so execution code is unchanged, and stores the envelope so partners can re-verify.
4. Applies the default `signer == agent` unless the contract's `approve_signer(signer, method)` returns true.

`register_agent` and `join_contract` payloads add `"node": { "address", "key" }`, obtained by the app from
`GET <address>/ibc/node` first; that is the delegation decision 2 relies on. Reads stay unsigned; `signer()` is
`None` in a read. `a2a_*` messages carry a second envelope signed by the node key over the body bytes.

## Appendix B: contract changes for decision 3

| Contract | Today | Under `signer()` |
|---|---|---|
| `gloki_verification_contract.py` | `initialize(steward, …)` `:47`; `request_vouch(requester, approver, …)` `:75`; `vouch(voucher, requester)` `:100`; `decline_vouch(approver, …)` `:114`; `register(newcomer, vouchers, …)` `:125`; `reset_candidate(steward)` `:162` | Drop the first argument of each; use `signer()`. `approve_signer` returns true for all methods (the methods check `signer()` against the verified list themselves) |
| `gloki_engage_initiative_contract.py` | `agent` argument on ~25 methods, e.g. `set_details(agent, …)` `:54`, `set_stage(agent, …)` `:79`, `allocate(agent, …)` `:437` | Replace `caller = agent` with `caller = signer()`; `approve_signer` returns true (membership is checked in the UI today and must become `signer() in partners()` of the community later) |
| `gloki_engage_application_settings.py` | `register_verification(server, agent, contract)` `:23`; any caller may overwrite any host `:31` | Retired under decision 5; if kept, require `agent == signer()` |
| `digital_agent_contract.py` | `set_profile` `:6`, `set_account_kind` `:18` check nobody | No edit: the default `signer == master` closes it |
| `gloki_engage_community_contract.py` | `master()` `:14` | No edit |

App call sites that stop passing the actor: `src/services/verificationRegistry.ts:226-245`,
`src/services/contractHosts.ts` member methods via `api.ts:40-42`, and `src/services/contracts/glokiEngageInitiative.ts`.

## Appendix C: node-key details for decision 2

- Key file: `node_key.bin` (32-byte seed) in the data volume, created on first start, mode 0600, owned by uid 1000.
  Back it up with the Mongo volume; losing it means every partner must re-pin, which in v1 means re-joining.
- `GET /ibc/node` → `{ "key": "<64 hex>", "address": "<base URL>" }`. Served from the same process, no auth.
- `pda_partners[pid]` gains `node_key`; set at `a2a_connect` from the joiner's signed `join_contract` payload (the
  `node` field), after verifying the joiner's agent signature. Not updated afterwards in v1.
- Every outbound a2a request body becomes `{ "body": "<json string>", "node": "<64 hex>", "sig": "<128 hex>" }`.
  The receiver finds `from` inside `body`, looks up `pda_partners[from].node_key`, checks it equals `node`, verifies
  `sig`, then proceeds. For `a2a_connect` (no partner record yet) it uses the `node.key` inside the agent-signed
  join payload instead.
- PBFT: `receive_pre_prepare` requires sender == `names[order[view]]` and `d == sha256(str(block))`;
  `receive_prepare`/`receive_commit` set `data['i']` to the verified sender rather than trusting the field;
  `receive_request` verifies the agent signature on `data['o']` and refuses if `d` is already known or already in
  the ledger.

## Appendix D: what I could not verify

- Browser support figures for WebCrypto Ed25519 and the current PyNaCl release are from memory, not checked
  against live sources (no network calls were made beyond cloning `ibc`). Pin whatever is current when building.
- Whether `gloki-application` holds anything on the live node right now. The trust-model note's 09:56 UTC reading
  is the latest I have; nothing live was contacted.
- Ouri's intent for `nakamoto.py` and for agents moving between nodes. Both are assumptions stated in decisions 2
  and 7 and would change those answers if wrong.
