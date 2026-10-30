# Signing: the seven decisions (29 Oct 2026)

These are the combined answers to the seven questions Ouri needs to settle before signing work starts. Fable drafted them, and Opus checked them independently against the code: `ouripoupko/ibc` @ `2622314` and `gloki-engage` `server-side` @ `0cbbf6e`. The detail is in:
- `2026-10-29-signing-decisions-fable.md`, the full reasoning with file:line references.
- `2026-10-29-signing-decisions-opus-review.md`, the fact-check and corrections.

I checked the most serious finding myself (`consensus/consensus_navigator.py:55-66`).

## In one paragraph

Every account gets a real keypair, and the public half becomes its ID. Every node gets a key of its own. Nodes accept a write only if it's signed by the right person, or by someone the contract has explicitly allowed. We start fresh rather than migrate today's accounts, because today's IDs were always public, so nobody can prove they own one. The central account `gloki-application` is retired instead of handed to someone. Each node keeps a list of approved contract code and refuses everything else. All of this can be built in short pieces, each tested on a local node. Ouri's role is to agree to the design and review each piece.

## The answers

| # | Question | Answer | Both models agree? |
|---|---|---|---|
| 1 | How do accounts get keys? | **The account ID is an Ed25519 public key**, written as 64 lowercase hex characters. It fits the app's current 64-character check. Old IDs use letters as well, so the two kinds can be told apart. | Yes |
| 2 | How do nodes vouch for messages from people who are offline? | **Each node gets its own key.** When you sign up, you sign a record naming your node and its key. Nodes sign every node-to-node message, and partner nodes remember each other's keys from the first connection. Ouri's consensus code also has to start checking who sent each vote. | Yes, with additions. Node-to-node messages need a counter, or they can be replayed. With only two nodes, this stops outsiders but not a dishonest node operator. There's also no recovery if the leading node stops. |
| 3 | Can someone act through another person's account? | **Only if the contract says so.** The node checks every signature and tells the contract who signed. By default, only the account owner may write. A contract can allow others, for example "any member may vouch". The profile contract becomes owner-only. | Yes. Opus adds: all four shared contracts (communities, initiatives, verification, settings) must get that "allow others" rule in the same release, or they stop working. |
| 4 | What happens to today's accounts and data? | **Fresh start. No claims on old IDs.** Old IDs appear in URLs and in public ledgers, so a claim could never prove ownership. Old accounts stay readable but can't write. | Yes |
| 5 | Who holds the central account's key? | **Nobody. Retire `gloki-application`.** The app learns where the verified list lives from its own build settings. Later, the stewards share a contract that any of them can update. | Yes, with a correction. That later setup lets any single steward update it. That's not multi-signature, and it shouldn't be called that. Trust also moves to whoever controls the app's build: the GitHub org, the merges to the deployed branch and the Pages settings. YWF and Ouri should agree who that is. |
| 6 | Which crypto libraries? | **PyNaCl on the node** (maintained, 1.6.2, Jan 2026). **The browser's built-in Ed25519** (in Chrome, Firefox and Safari since 2024–25), with `@noble/ed25519` as a fallback. Sign the exact bytes sent, so no reformatting step is needed before signing. | Yes. Only an old version of `@noble/ed25519` had an outside audit, so don't call it "audited". |
| 7 | How do contract updates work with an approved-code list? | **Each node keeps a list of approved contract code**, checked where code actually runs. An update means adding the new version and deploying it as a new contract beside the old one. Old data isn't migrated. | Yes, with a correction (see below): the list stops code from running, but it doesn't stop forged writes. |

## What the review found that neither earlier note had

1. **Anyone can feed a node a fake history.** When a node joins a contract, it fetches the history from an address named in the request. It then replays every entry, skipping the consensus check. Nothing checks who sent the request. So anyone can:
   - **run code on the node.** The approved-code list (piece 1) closes this.
   - **insert fake actions into any contract, including the verified list.** The approved-code list does NOT close this. The fix is for the node to accept a join reply only when it asked to join, and only from a partner it already knows.
2. **One fake partner can push through any change on its own.** The consensus code doesn't check who sent a vote, which leader proposed a block, or whether the block matches the request. With two nodes, the votes needed to agree can be forged from outside.
3. **Partner nodes can't check that they're agreeing on the same request**, because each node stamps the request with its own timestamp before fingerprinting it. The fix is to fingerprint the signed bytes instead.

## How urgent is this for node1 and the founder step?

Opus says not to create the founder on a public node1 until the approved-code list and the join-reply check are in. **My view differs on timing.** Today, anyone can already forge vouches and deploy code through the node's normal entry point. The session reproduced this, and node1's README lists it as a known limit. So the fake-history hole adds no new danger *for the beta* while nothing is signed. It becomes the main hole once signing exists.

So:
- **Go ahead with node1 and the founder step,** with the flaws accepted for the beta. node1 runs on its own server, with nothing else on it.
- **Pieces 1 and 2 of the build** are the approved-code list and the join-reply check. They come first because they're small and need no keys.
- **Signing is not done** until the join-reply check and the consensus fixes are in. Otherwise signatures can simply be bypassed.

## Build order

| # | Piece | Size | Needs |
|---|---|---|---|
| 1 | Approved-code list, checked where code runs | S | none |
| 2 | Accept join replies only for joins this node started, and only from known partners | S | none |
| 3 | Keypairs in the app: create, save, export, import; ID = public key | S–M | none |
| 4 | App signs writes, node checks the signature, with replay protection; fingerprint the signed bytes | M | 3 |
| 5 | Contracts see who signed; owner-only by default; the four shared contracts allow others; retire the central account | M | 4 |
| 6 | Partner nodes re-check signatures when copying and replaying; no duplicates | M | 4 |
| 7 | Node keys, signed node-to-node messages with counters, consensus checks sender, leader and fingerprint | L | 4 |
| 8 | Switch-over: fresh start on signed nodes | S | all |

Pieces 1, 2 and 3 can run in parallel.

## What Ouri needs to agree to

- **Decisions 1–4, 6 and 7:** these are engineering calls. He can accept them or say why not.
- **Decision 5:** this undoes the signpost he built today. It needs his agreement, and an agreement between YWF and Ouri on who controls the app's build and deploy.
- **Pieces 1, 2 and 7:** these change his node code, so they need his review.

## Limits that stay

- Signing doesn't stop a dishonest node operator while there are only two nodes.
- There's no key recovery. Lose your key and you lose the account.
- If someone gets malicious code into the web app, they can use your key.
- Everything stays readable to anyone, including full contract histories.
- Contract code still isn't truly contained. The approved-code list only limits *which* code can run.
