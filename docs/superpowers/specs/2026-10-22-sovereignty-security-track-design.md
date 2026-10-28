# Sovereignty, security and hardening track

**Status:** proposal, nothing built. Written 2026-10-22. The roadmap entry is MASTER_TODO §7 **P12**.
**Decision owners:** Eston (product and claims), Ouri (server, chain, node image), and both jointly on
G2 in [2026-09-17-production-wot-decisions.md](2026-09-17-production-wot-decisions.md).
**Related:** [FOR_OURI_blind_servers.md](../../FOR_OURI_blind_servers.md) (secret ballot),
[2026-09-17-ui-wot-build-plan.md](../plans/2026-09-17-ui-wot-build-plan.md) (production Web of Trust,
B1–B8).

This document pulls together what has been discussed in pieces: the blind-server and secret-ballot
proposal, the open G2 gate (authority, trust root, key custody), the comparison with Reticulum, and
hardening of the frontend and the contributor node. Its job is to put them in one order so they
stop competing for attention. It does not record any decision.

## 1. The claim we want to be able to make

Gloki presents itself as "decentralized self-governance" (the `app.title` string). For that to be
true and not just a slogan, five properties have to hold for an ordinary member who never runs a
server:

1. **Nobody can act as you.** Writes are signed with a key only you hold, and anyone can check
   the signature without trusting the host.
2. **Nobody can quietly rewrite the record.** Community state is copied across independent nodes,
   so a single operator who changes or drops data gets caught.
3. **Nobody can read your ballot.** Covered by the blind-server plan: anonymity first, then
   encryption.
4. **You can leave and take your identity with you.** Identity is the key, not the server URL;
   your data can be exported and moved.
5. **Losing your phone doesn't mean losing your vote.** You can recover access through people who
   know you, not through a company.

Until each one holds, public copy must not claim it (claims-honesty doctrine, S9).

## 2. Baseline today (verified on `ui` at `195bc6b`, 2026-10-22)

- **Login takes a public key and a server URL** (`src/pages/LoginPage.tsx`). The `ui` branch holds
  no private key and has no client-side signing. A search of `src/` finds no use of
  `crypto.subtle`, no Ed25519 or NaCl, and no `signature` handling. On `ui`, identity is a claim
  the user types in. Whatever `server-side` does to authenticate it **has not been verified from
  this repo**.
- All data goes through the seam (`src/services/api.ts`) into the demo layer. Demo state lives in
  `localStorage`.
- The frontend is a static bundle on GitHub Pages, built from Ouri's `server-side` branch.
  GitHub Pages cannot set HTTP response headers, so a Content-Security-Policy can only be added
  as a `<meta>` tag, which does not support `frame-ancestors`. Neither `index.html` nor
  `public/404.html` has a CSP or SRI today.
- What we know of the beta comes from the October note (15 Oct email): Ouri's own chain,
  contributor-hosted nodes shipped as a Docker image, a personal agent per user, and
  web-of-trust admission. None of the backend code is in this repo.
- G2 is open: no decision yet on key custody, signature model, global identity store or
  protected-operation matrix.
- **The live initiative contract enforces none of the ballot rules the UI enforces** (audit of
  `server-side` @ `d930a9e`, commit `0e94913`). Any identity key can move the stage, rewrite the
  text, change the budget or allocate unlimited credits. The fix is
  `docs/contracts/2026-09-25-initiative-ballot-guards.py`. *(Update 2026-10-28: applied by Ouri on
  `server-side`; initiatives deployed from then on are guarded.)* D12 server-side eligibility for
  impact assessments is still UI-gated only.

## 3. Threat model (one page, to be expanded in H0)

| Adversary | What they want | Main defence |
|---|---|---|
| A node or host operator | Read, forge, censor or lose records | Signed writes (H1), replication (H3), encrypted ballots (H4) |
| Whoever serves the JavaScript | Ship code that steals keys | Delivery integrity (H5). With keys in the browser, the app is only as trustworthy as whoever serves the code |
| A network observer (ISP, state) | Learn who participates and when; block access | TLS today; Tor or Reticulum for nodes later (H7) |
| A Sybil ring | Extra votes | Web of Trust (locked model) plus the B7 abuse controls; admission rule (question 1 in the blind-server note) |
| A coercer or vote buyer | Proof of how someone voted | Receipt-freeness. Out of scope for now, disclosed (blind-server note, "Known limits") |
| Everyday failure | Lost phone, cleared browser, forgotten backup | Recovery (H2). For most users this is the most likely risk |

Run STRIDE for security and LINDDUN for privacy in H0, against this list.

## 4. The track, in order

Each step lists who can do it. **`ui`** means work on this branch inside the seam rule, with demo
behaviour labelled `(demo)`. **Ouri** means server, chain or node work. **Decide** means no code
until a decision is recorded.

### Before H0 — Enforce the rules we already have (Ouri)

Apply the 2026-09-25 ballot-guard patch and the D12 eligibility checks. Cryptography only proves
*who* made a write. It does nothing if the contract accepts any write from anyone. This is the
cheapest and most urgent hardening step on the list.

### H0 — Decide and describe (Decide; no code)

- Write the threat model properly (STRIDE + LINDDUN) and lock it as a spec.
- Close **G2** with three concrete answers: (a) are writes signed client-side and verifiable by
  any reader; (b) are community contracts replicated to members' or contributors' nodes; (c) does
  the private key ever leave the user's device?
- **One root key.** The agent key, the Semaphore identity and any future transport identity are
  all derived from one root secret (for example with HKDF), so a single backup restores
  everything.
- **Recovery model.** Choose between social re-attestation (recommended, see H2), Shamir shards,
  or both.
- **Claims audit.** List every string that says decentralized, trustless, secure, private,
  permanent or anonymous, and pair each one with the property in §1 it depends on.

### H1 — Keys in the user's hands (`ui` for client and UX; Ouri for verification; needs G2)

- Generate the keypair on the device. WebCrypto Ed25519 is now in the major browsers. Check the
  floor against the pilot's real Android devices and WebViews, with libsodium.js as the fallback.
  Store keys non-extractable in IndexedDB.
- Optionally wrap the root key with a **passkey** (WebAuthn PRF extension), so for most people
  "your key" is just their fingerprint or phone unlock. PRF support is uneven, so it stays an
  enhancement on top of an exportable backup.
- Sign every write inside `src/services/`. Components don't change; that is the purpose of the
  seam.
- Backup UX: a recovery code or QR, a nudge to back up after joining, and an honest message
  ("if you lose this and have no backup, recovery needs your vouchers").
- Key rotation and revocation, and migration for existing typed-public-key accounts.

### H2 — Recovery through your vouchers (`ui` + Ouri; after H1)

You already trust the people who vouched for you, so let them restore you. Re-attestation
(recommended): a threshold of your vouchers, for example 3 of your 4, sign a statement binding
your identity to a new key. A waiting period (for example 72 hours) applies, with notice sent to
the old key so a real owner can stop a takeover. No secret material ever leaves anyone's device.
This reuses the verification call flow already built in S37–S38. Shamir shards held by vouchers
are the alternative, but shards have to be stored, rotated and kept away from colluders, which
is a heavier burden for everyday users.

### H3 — Records nobody can quietly rewrite (Ouri; `ui` verifies)

- A signed, append-only write log per contract, copied to several contributor nodes.
- The client checks signatures on what it reads and warns when copies disagree.
- Export and migration of a user's data, the way AT Protocol moves an account between hosts.

### H4 — Secret ballot (Ouri + `ui`; Vote stage only)

Follow the blind-server note without changing it: (1) Semaphore anonymity, (2) ElectionGuard
threshold encryption on guardian nodes, (3) QV budget proofs. Depends on H1, because Semaphore
identities derive from the root key.

### H5 — Delivery and supply chain hardening (`ui`; can start now, no G2 dependency)

- A strict CSP as a `<meta>` tag: no inline script, no third-party origins, `connect-src` limited
  to known servers. Add SRI on any external asset. Check that nothing third-party loads at runtime.
- Dependency hygiene: Dependabot or Renovate, `npm audit` in CI, lockfile review, a pruned
  dependency tree.
- Reproducible builds and signed releases (Sigstore), plus a published SBOM, so a contributor can
  check that what's deployed matches the source.
- A second, independent mirror (a second static host or IPFS) so one takedown doesn't remove the
  app.
- Once keys live in the browser, **revisit the service-worker/PWA decision** that S14 set aside.
  A pinned, verified bundle (the idea behind WEBCAT, below) is what protects keys from a
  compromised host.

### H6 — Contributor node hardening (Ouri)

- Rootless container, minimal or distroless base, read-only filesystem, dropped capabilities.
- Signed images (cosign), an SBOM per release, Trivy scans in CI, updates applied only when the
  signature checks out.
- The `--role` flag from day one (blind-server question 4). Backup and restore, and key storage
  in a TPM or YubiKey for guardians.
- Later, for contributors who aren't technical: one-click packages for YunoHost, Umbrel or
  Start9, or a ready-made Raspberry Pi image.

### H7 — Metadata and connectivity (research; transport still sits in §6 Deferred)

- **Tor onion service per node.** This is the cheapest metadata win, because nodes become
  reachable without exposing their IP addresses. It answers the "Metadata" limit in the
  blind-server note.
- **Reticulum gateway.** LXMF messages over LoRa reach a gateway node run by a contributor. Only
  for pilot sites where connectivity really fails. Sideband is an existing Android client. Adds a
  `--role transport`.
- **SMS/USSD** for feature phones. This reaches the most people in Kenya and Malawi but is not
  sovereign, because the telco sees everything. Use it only for notifications and non-secret
  actions, never ballots.

### H8 — Assurance and operations (Eston + Ouri)

- `security.txt` and a disclosure policy.
- An independent audit before any binding vote. OTF's Red Team Lab and NLnet-funded audits
  (Radically Open Security) exist for civic and open-source projects; check current calls.
- An incident runbook and a pause procedure (already required by B7).

## 5. The easiest path for an everyday user

Ordinary members get sovereignty from what the protocol guarantees (§1), not from running
infrastructure.

| Tier | Who | What they do | What they never see |
|---|---|---|---|
| Member | Nearly everyone | Open a link, install the web app, get vouched in, take part. Unlock with their phone's fingerprint or PIN | Servers, keys, Docker, jargon |
| Contributor | A few per community | Run the node image on a cheap VPS or a Pi; later, one click | Other people's ballots, which are encrypted |
| Low-connectivity site | Specific pilots only | Sideband over LoRa, or SMS for notifications | Nothing new; the same identity |

For tier 1 the hard design problem is **recovery**, not encryption. H2 is therefore on the
critical path, not an extra.

## 6. Technology landscape

These are candidates from general knowledge as of mid-2026. Before adopting any of them, check
maintenance, licence, audit history and fit. "Adopt" means a strong fit for a named step;
"Study" means read it for design ideas; "Compare" means it's a reference point and we don't plan
to use it.

### Identity, keys, recovery

| Technology | What it is | Fit |
|---|---|---|
| WebCrypto Ed25519 / libsodium.js | Signing in the browser | **Adopt** (H1) |
| WebAuthn passkeys + PRF | Derive or wrap a key from the device's biometric unlock | **Adopt** as an enhancement (H1); support is uneven |
| KERI | Key event logs with pre-rotation; identity that survives key changes without a blockchain | **Study** (H1 rotation, H3) |
| W3C DIDs (`did:key`, `did:peer`) + Verifiable Credentials 2.0 | Standard identifiers; a vouch could be a signed credential | **Study**. Vouches as VCs would make approvals portable and checkable |
| SLIP-39 Shamir backups | Split a secret into shares | **Compare** with re-attestation (H2) |

### Data, sync, portability

| Technology | What it is | Fit |
|---|---|---|
| AT Protocol (Bluesky) | Signed per-user data repositories, account migration between hosts | **Study**. The closest existing model to "personal agent + leave with your data" (H3) |
| Nostr | Signed events published to many simple relays | **Study**. The minimal "signed writes on several hosts" pattern (H3) |
| Holochain | Agent-centric: each user has a source chain, peers validate | **Study**. Philosophically closest to Gloki's agent model |
| Automerge, Yjs (CRDTs); Willow, p2panda | Local-first sync that merges without a server | **Study** for offline drafting and the last-view cache (P5 remainder) |

### Messaging and ballots

| Technology | What it is | Fit |
|---|---|---|
| MLS (RFC 9420), e.g. OpenMLS | End-to-end encrypted group messaging | **Study** for community chat if it ever needs to be private |
| Semaphore, ElectionGuard, MACI | Anonymous membership, threshold-encrypted tally, QV budget proofs | **Adopt**, already chosen in the blind-server note (H4) |

### Sybil resistance (comparison only; the vouching model is a locked decision)

BrightID (social graph), Idena (synchronous puzzle ceremonies), Proof of Humanity (video plus
deposit), World ID (iris biometrics, controversial). These are useful for answering "why not X?"
from funders or reviewers. **Not** candidates to replace the Web of Trust.

### Transport and metadata

| Technology | What it is | Fit |
|---|---|---|
| Tor onion services (C tor; Arti maturing) | Hide where a node is and who talks to it | **Adopt** for nodes (H7) |
| Reticulum + LXMF, Sideband | Encrypted mesh networking over radio or anything else; no IP, no DNS | **Study**, pilot gateway (H7) |
| Meshtastic | Popular, cheap LoRa mesh for chat | **Compare**. Bigger community, weaker security design than Reticulum |
| Briar | Peer-to-peer messaging over Tor, Wi-Fi and Bluetooth | **Compare** for offline organising |
| Nym (mixnet) | Stronger metadata protection than Tor, at higher cost | **Compare** |
| Africa's Talking (SMS/USSD) | Feature-phone reach across East Africa | **Study** for notifications only (H7) |

### Delivery integrity and node operations

| Technology | What it is | Fit |
|---|---|---|
| CSP + SRI | Block injected and unexpected scripts | **Adopt** now (H5) |
| Sigstore / cosign, Syft (SBOM), Trivy, Renovate | Signed releases and images, inventory, scanning, updates | **Adopt** (H5, H6) |
| WEBCAT (Freedom of the Press Foundation) | Integrity and transparency for web apps that handle secrets | **Study**, early-stage (H5) |
| IPFS mirror | Content-addressed copy of the static app | **Study** (H5) |
| YunoHost, Umbrel, Start9 | One-click self-hosting platforms | **Study** for the contributor tier (H6) |

### Assurance and funding

OTF Red Team Lab, NLnet (NGI calls change, so check what's current), Radically Open Security.
Funding a security audit through one of these is normal for civic open-source projects and
reassures pilot partners.

## 7. What could start on `ui` without waiting for anyone

1. **H5 CSP/SRI and dependency hygiene.** Purely frontend. It needs care, because a strict CSP can
   break the build's inline bootstrap, so test with `npm run build:prod` and a preview walk.
2. **H0 claims audit** of user-facing copy (a product-copy change, so recommend-then-confirm with
   Eston).
3. **H0 threat model** as a written spec.

Everything in H1–H4 waits for G2, because building key UX against an unknown custody model would
mean building it twice.
