# FOR OURI: Blind servers and the secret ballot

**Status:** proposal for discussion, nothing built. October 2026.
**Ask:** answers to the five questions at the end. Everything else follows from them.

## Why now, if the beta has no voting

The beta (email of 15 Oct) is the network: web-of-trust admission, a personal agent,
contributor-hosted nodes, one shared forum. Secret ballots are not in it.

But the node a contributor installs for the beta is the same machine that will later
act as a blind server. If its roles, packaging and trust boundaries are decided now, the
Vote stage can add ballot secrecy later without asking every contributor to reinstall
or re-trust something new. This note proposes those boundaries.

## The principle: integrate audited tools, write only the glue

Ballot secrecy is solved territory. All three building blocks are open source, actively
maintained and externally audited:

| Tool | Role in Gloki | License |
|---|---|---|
| [Semaphore](https://github.com/semaphore-protocol/semaphore) | Anonymous proof of membership plus a nullifier per vote: "I am a verified member and have not voted on this yet", without saying who | MIT |
| [ElectionGuard](https://github.com/microsoft/electionguard-python) | k-of-n threshold key held by guardians. Ballots are tallied while still encrypted and only the total is decrypted | MIT |
| [MACI](https://github.com/privacy-scaling-explorations/maci) | Design reference only (EVM-bound). Its circuits prove a QV ballot stays within budget without revealing the allocation | MIT |

Considered and set aside: Vocdoni (AGPL and its own chain, so it replaces rather than
plugs in) and Helios (a standalone election site with no QV).

We write none of the cryptography. Gloki's own code would be group management, the link
from web of trust to Semaphore group, node packaging, the guardian ceremony flow and the UI.

## Where each piece runs

Contracts can't import libraries, so they can't verify ZK proofs. That's fine:

```
Browser          generates the Semaphore proof, encrypts the ballot (ElectionGuard)
   │
Blind nodes      verify the proof, store the ciphertext, relay to the chain
   │             guardians among them later decrypt the total only
   │
Chain (yours)    group root of verified members, nullifier set, ballot hashes,
                 final tally + decryption proof
```

The UI seam doesn't change: components still call `contractWrite`, and the crypto lives
under `src/services/`.

## Node roles

Every contributor runs the same Docker image. A flag picks the role.

| Role | Who | Sees | Trust needed | Requirements |
|---|---|---|---|---|
| **Relay / storage** | Any contributor | Ciphertext, timing, IP | Low: can drop data but not read or forge it. Copies on several nodes cover failures | 1–2 vCPU, 2–4 GB RAM, tens of GB disk, public HTTPS, Docker |
| **Verifier** | Any contributor (same nodes) | Proofs and nullifiers, which say nothing about the voter | Low: proofs are public, so a lying verifier is caught | Same. A proof check takes milliseconds |
| **Guardian** | Small committee, e.g. 3-of-5 | Nothing until the vote closes, then only the total | **High:** a threshold of guardians colluding could read ballots | Same hardware, plus: online for the key ceremony and the decryption window, key share kept encrypted (TPM or YubiKey where possible) with an offline backup |
| **Core / chain** | You | Public data | As today | See the next section |

Guardians must be independent: different organisations, countries and hosting
providers, publicly named. A 3-of-5 threshold among five friends on one cloud account
protects nothing.

Key lifetime: one standing guardian committee per season (e.g. quarterly), rotated,
rather than a ceremony for every vote.

## What it would need from the core

1. **Semaphore group maintenance.** When the web of trust verifies someone, their
   identity commitment joins the group and a new root is published.
2. **A nullifier registry** in the contract: one authoritative set, because preventing
   double votes needs a single source of truth.
3. **A results write** that stores the decrypted total with ElectionGuard's
   decryption proof.

## Suggested order (after the beta)

1. **Anonymity first (Semaphore only).** Votes stay readable but can't be tied to a
   voter. This is most of the value of a secret ballot at community scale, and roughly
   a few weeks for one developer.
2. **Encryption (ElectionGuard on guardian nodes).** Hides running totals and makes
   sure no single node can read a ballot. Months, mostly ceremony and operations.
3. **QV budget proofs.** ElectionGuard limits votes per option but can't check a
   sum-of-squares budget. Options: port MACI's circuit, use bounded per-option ranges,
   or stop at step 1 for QV.

Scope: only the Vote stage needs secrecy. Hearts, problem votes, approvals and
conviction stay public, because public commitment is their purpose.

## Known limits, stated up front

- **Not receipt-free.** With Semaphore alone a voter can prove how they voted. MACI
  exists to prevent that. Acceptable at community scale, but we should say so.
- **Metadata.** Nodes see timing and IP. Where that matters, the client should route
  through a relay or Tor and add a random delay before sending.
- **The web of trust bound is local.** One person verified in two disjoint communities
  holds two identities. That's fine within a community, but cross-community totals
  would need a uniqueness rule.

## Questions for you

1. **Admission rule.** The UI counts 4 vouches and, in the demo, only verified members
   can receive vouch requests. Does the server enforce your paper's growth rule
   (newcomers admitted through members already in the community), or a plain count? A
   ring of 4 colluders defeats a plain count.
2. **Verifier placement.** Can the agent runtime, or a sidecar to it, host a Node
   process that verifies Semaphore proofs? Or should verification live only on
   contributor nodes?
3. **Nullifiers and group root.** Is a contract the right place for these, given
   storage cost and write rate on your chain?
4. **The beta node image.** Can the Docker image you're preparing take a `--role` flag
   from the start, even if relay is the only role at first?
5. **Anything here that conflicts** with the decentralisation model you already have in
   mind for contributor nodes.
