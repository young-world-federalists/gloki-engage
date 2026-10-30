# Signed writes on the ibc node: what it would take (29 Oct 2026)

For Eston's alignment meeting with Ouri. Read-only sizing, not a plan to change Ouri's code. Based on
`ouripoupko/ibc` at `2622314` (24 Oct, public on GitHub; the image `ghcr.io/ouripoupko/ibc` is built from it) and
`gloki-engage` `server-side` at `0cbbf6e`. File and line references are in the appendix.

## Where things stand

**The node takes every request at its word.** One web endpoint, `/ibc/app/<agent>/<contract>/<method>?action=…`,
handles everything. The agent in the URL is who the request is "from", and nothing checks it. Writes (sign-up,
deploying a contract, calling a contract method, joining a contract) are queued for consensus, and contracts see
the URL's agent as `master()`. Node-to-node messages use the same endpoint and aren't checked either. Ouri's own
comments in the consensus code say so: "I should check signatures … but I am lazy".

**There are no keys to sign with yet.** The app's "key" (for example `P4ZtJ88H…`) is 64 random letters and digits
made with `Math.random()`. It is a name, not a keypair. The node stores only the agent's server address at
sign-up. Anyone who knows a key can sign in as that person, and keys are visible: in URLs, partner lists, and the
verified list itself.

**Most app writes are made through someone else's agent.** For hosted contracts (communities, initiatives,
verification, the settings signpost), the app sends the write as the host agent and passes the real actor's key as
an argument. The contracts trust that argument. So signing has to answer two questions: who sent this, and are they
allowed to act through this host.

## What a signature would sign, and with which key

- **Key:** an Ed25519 keypair made in the browser (WebCrypto supports Ed25519 in current browsers). The private key
  stays with the person: saved, exported, imported at sign-in. The **public key becomes the agent id**, so any node
  can check a signature from the id alone, with no directory and no lookup. Nothing new needs storing at sign-up.
- **What is signed:** a canonical encoding of the request: action, target agent (URL), contract, method, arguments,
  a client timestamp or counter (to stop replays), and the signer's public key.
- **Who checks:** the receiving node, before queueing. Each partner node checks again before executing, because the
  original request is what gets copied between nodes, so the signature can travel with it.
- **What contracts see:** a new `signer()` next to `master()`. Contracts stop trusting a key passed as an argument
  and use `signer()`. The host agent stays in the URL, which keeps the hosted-contract design.
- **Reads** stay unsigned. Everything is readable today, including any contract's full ledger. That is a separate
  privacy question.

## The second gap: anyone can deploy code

Any caller can deploy Python code under any agent name. The node runs it with `exec` and a reduced set of
builtins, both in the execution service and in the web process on every read. A reduced-builtins `exec` is not a
security boundary in Python: code can reach the rest of the interpreter through object attributes, and nothing
filters those here. Treat contract code as running with the node's full rights inside its container.

**Smallest useful restriction: an allow-list of contract code hashes, per node.** Gloki ships a fixed set of
contracts (`src/assets/contracts/*.py`). The node refuses to deploy, or to replay on join, any code whose SHA-256
isn't on its list. That is small, doesn't depend on signatures, and closes the hole for a Gloki-only node. The cost:
every contract change means updating the list on every node, and old versions need a decision. "Deploy only as your
own key" needs signatures first and still lets that key deploy harmful code. A real sandbox (a separate process,
or WebAssembly) is the long-term answer and the largest piece here.

## What it breaks

- **Every existing agent.** Today's ids are random strings, not public keys, so they can't sign. Either start fresh
  on signed nodes, or let each old id claim a public key once. A one-time claim is risky, because current ids are
  public and someone else can claim first.
- **`gloki-application`, the central account.** It is a name with no owner. Under signatures someone has to hold
  its key, and whoever holds it controls the signpost. That is a governance question, not only a code one.
- **The app's write path.** It runs through a few functions in `src/services/api.ts` (sign-up, deploy, write, join)
  and the scoped ack stream. These are central enough that signing can be added in one place. The contracts need a
  matching change. Verification, settings and initiative take the actor as an argument. Community uses `master()`.
  The digital agent contract checks nobody, so any caller can change anyone's profile.
- **Node-to-node messages** (joining, the consensus rounds). The consensus rounds are sent by a node on behalf of
  its agent, whose private key sits in a browser that is usually offline. So nodes need their own keys, and agents
  need to authorise their node. This is the hardest design question and Ouri's to answer.
- **Sign-in.** "Type your key" becomes "import your private key". Backing up the key matters more, because losing
  it means losing the account.
- **The demo build:** not affected. Mock data never reaches a node.

## The pieces, in order

| # | Piece | Size | Testable on a local node |
|---|---|---|---|
| 1 | Contract-hash allow-list on deploy and on join replay | S | Yes: an approved contract deploys, an edited one is refused |
| 2 | Keypairs in the app: create, save, export, import; id = public key | S–M | Yes, two browsers |
| 3 | App signs writes; node checks at the entry point (sign-up, deploy, write, join), with replay protection | M | Yes: a tampered or replayed request is refused |
| 4 | `signer()` for contracts; Gloki contracts use it instead of key arguments | M | Yes: one agent can't vouch as another |
| 5 | Signed requests travel with consensus; partners re-check before executing and when copying a ledger on join | M | Yes, two local nodes |
| 6 | Node keys, agent-to-node authorisation, signed consensus and join messages | L | Yes, but needs Ouri's design first |
| 7 | Moving `gdi.gloki.contact` over: fresh start or claims; who holds the central account's key | S–M | Partly: a dry run on a copy |

Pieces 1 and 2 can start in parallel. 3 needs 2. 4 and 5 need 3. 6 is independent but the largest. 7 comes last.

**Questions only Ouri can answer**

1. Is "agent id = public key" acceptable, or does he want a separate key registered at sign-up?
2. For consensus messages: node keys with agent authorisation, or something else that fits his PBFT design?
3. Should the node accept a signer who isn't the URL's agent (the hosted-contract pattern), and which methods may
   a host accept from others?
4. What data on `gdi.gloki.contact` has to survive?
5. Which Python crypto library is he happy to add (PyNaCl or `cryptography`)?
6. How should contract upgrades work under a hash allow-list?
7. `consensus/nakamoto.py` isn't wired in; only BFT is used. Can it stay out of scope?

## How it would land

One short feature branch per piece, against whichever branch Ouri chooses after the `ui`/`server-side`
consolidation (and his `ibc` repo for node pieces). Each one is tested on a local node first and reviewed by Ouri
before merge. Ouri is architect and reviewer; YWF writes the code.

---

## Appendix: code references

ibc (`ouripoupko/ibc` @ `2622314`):

- `ibc.py:28-55`: the single HTTP handler. The agent comes from the URL (`:30-35`). The record hash is computed
  server-side (`:45`). There is no authentication, and CORS is open (`:16`, `:52`).
- `dispatcher/navigator.py:19-30`: the action table. The write paths: `register_agent` `:64-66`, `deploy_contract`
  `:86-90`, `join_contract` `:92-105`, `contract_write` and `a2a_connect` via `stamp_to_consensus` `:107-109`,
  `a2a_reply_join` and `a2a_consent` via `send_to_consensus` `:111-113`. Ledger export to anyone:
  `a2a_get_ledger` `:125-133`.
  **The check for pieces 3 and 6 goes here,** before anything is queued.
- `consensus/consensus_navigator.py:55-66`: `a2a_reply_join` fetches a ledger from an address given in the message
  and replays every record. `:68-72` `a2a_connect`. `:86-90` consent. **Pieces 1, 5 and 6 go here.**
- `consensus/pbft.py:101-119`: the original request record travels whole between partners (`send_request`,
  `store_request`). No checks at `:142`, `:180`, `:186` ("I should check signatures … but I am lazy"). `:261-273`
  executes. **Piece 5 checks at `:112` and before `:267`.**
- `consensus/contract_dialog.py:55`: only the `BFT` protocol is wired in.
- `execution/execution_navigator.py:46-55`: `register_agent` stores only `address`. `:57-72`: `deploy_contract`
  stores the submitted code as is (**piece 1**). `:86-94`: `contract_write`.
- `execution/contract_execution.py:45-61`: joining asks the contract's `approve_partner`, which defaults to
  `True` when the contract doesn't define it (`common/state.py:132-133`).
- `common/state.py:29-30`: `master()` is the URL agent. `:76-85`: `exec` with reduced builtins, including `type` and
  `__build_class__`, and no attribute filtering. `:117-128`: method calls. **Piece 4 adds `signer()` here.**
- `dispatcher/contract_view.py:14-15`: contract code also runs in the web process, on every read.

gloki-engage (`server-side` @ `0cbbf6e`):

- `src/pages/LoginPage.tsx:16-23`: the "key" is 64 random characters from `Math.random()`.
- `src/services/api.ts:37-45`: `routeCall`. Writes to hosted contracts go to the host agent, with
  `agent: <your key>` added as an argument. `:102` `registerAgent`, `:163` `deployContractOnChain`, `:202`
  `contractWriteOnChain`, `:280-295` join, `:315` routed write. **Piece 3 signs here.**
- `src/store/slices/userSlice.ts:89-93`: sign-up (`isExistAgent`, then `registerAgent`).
- Contracts for **piece 4**, all in `src/assets/contracts/`:
  - Actor passed as an argument: `gloki_verification_contract.py` (`initialize`, `request_vouch`, `vouch`, …),
    `gloki_engage_application_settings.py` (`register_verification`) and `gloki_engage_initiative_contract.py`
    (`set_details(agent, …)`, `set_stage(agent, …)`, …).
  - Actor from `master()`: `gloki_engage_community_contract.py`.
  - No check at all: `digital_agent_contract.py` (`set_profile`, `set_account_kind`).
