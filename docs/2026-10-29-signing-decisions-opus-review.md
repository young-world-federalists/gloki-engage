# Adversarial review of the signing decisions (29 Oct 2026)

Independent review of `2026-10-29-signing-decisions-fable.md` against `ouripoupko/ibc` @ `2622314`
(verified: `git rev-parse HEAD` = `262231456a018d6f113dbbd5476140d18c4b6529`) and `gloki-engage`
`server-side` @ `0cbbf6e` (verified = `0cbbf6ef3ae5803bd1cfc5bf62af4c6f3fab4239`). Read-only. Browser/library
premises checked by web search.

## Verdict

The document is accurate and, on the whole, the right plan for this team. Every file:line claim I checked holds,
and the five headline code claims are all CONFIRMED. The identity=key, fresh-start, PyNaCl and allow-list calls are
correct and well-argued; I agree with them outright. Two things need correcting before anyone acts on it. First,
the document under-reads its own most important finding: `a2a_reply_join` is not only a code-deploy RCE — the same
unauthenticated `direct=True` replay path lets anyone inject forged *contract writes* (vouches, registrations,
membership) into any contract on a node, bypassing both consensus and any future signature check. The allow-list
(piece 1) closes the deploy half but not this half, so "ship the allow-list first and node1 is safe" is false: the
verified list on a live node1 can still be forged until the `a2a_*` ingress is authenticated (piece 6) or
disabled. Second, decision 5 calls `signer() in partners()` "on-chain multi-sig" — it is 1-of-N write
authorization replicated by PBFT, not multi-signature; any single steward can change the setting. Everything else
is sound, including the honest limits section, which is unusually complete.

## Recommendation-by-recommendation

| # | Fable's recommendation | Verdict | Change / reason |
|---|---|---|---|
| 1 | Agent id = Ed25519 pubkey, 64 lowercase hex; no key registry | AGREE | Correct. No directory exists to look a key up (`contract_execution.py:63-64`, `execution_navigator.py:46-55`); id=key makes the check local. Hex-vs-legacy discriminator is sound: app validates `^[A-Za-z0-9]{64}$` today (`LoginPage.tsx:71`), legacy ids are base62 from `Math.random()`, so `^[0-9a-f]{64}$` separates them. |
| 2 | Node keys; agent's signed registration/join is the delegation; fix PBFT to use the authenticated sender | AGREE WITH CHANGES | Delegation shape is right and the PBFT fixes are the real content. But (a) PBFT value is bounded: at two operators f=0, so authenticating senders stops *outside* vote injection (valuable — today anyone can POST `a2a_consent`), not a dishonest operator; say so plainly. (b) `a2a_*` messages get no nonce/sequence in the design, only origin auth — a captured PREPARE/COMMIT is replayable; harmless at n=2, matters if n grows. (c) No view-change is implemented, so a stuck/offline leader halts the contract (liveness) — out of scope for safety but should be named for a two-node deployment. |
| 3 | Verify any signer, expose `signer()`, default `signer()==master()`, opt-in `approve_signer` | AGREE | Correct and closed-by-default is the right bias. Note the consequence explicitly: because hosted contracts run as the host, `signer()!=master()` for every member write, so all four hosted Gloki contracts *must* ship `approve_signer→True` in the same release or every member write breaks. Fable implies this; make it a hard release-gate, not a footnote. |
| 4 | Fresh start; freeze legacy (non-hex) ids; no claim mechanism | AGREE | Correct. A claim proves nothing: `a2a_get_ledger` hands any ledger to anyone unauthenticated (`navigator.py:125-133`), so ids are public; first-to-claim wins and is scriptable. Little to save pre-founder. |
| 5 | Retire `gloki-application`; hosts in build-time config; later steward multi-sig via `signer() in partners()` | AGREE WITH CHANGES | Retiring the ownerless account and moving the host list into the build is the right call and a real reduction in attack surface (removes an unauthenticated writable entry, `application_settings.py:23-31`). But "`signer() in partners()` = multi-sig" is wrong: that is **1-of-N** authorization (any one partner's signed write is accepted), replicated by PBFT for agreement, not an M-of-N signature threshold. Real multi-sig needs a propose/approve quorum in the contract. Also state who the build root-of-trust actually is: whoever can merge `server-side` and set the `github-pages` environment vars (`deploy.yml`), inside the `young-world-federalists` org — **one** Pages site serves the app to both operators, so node1's operator does not get an independent build. Moving trust to the build is better than an ownerless account (auditable, already the de-facto root since the SPA ships contract code + default node URL), but it is not split across operators the way node keys are. |
| 6 | PyNaCl (node) + `@noble/ed25519` (browser); sign raw UTF-8 payload bytes, no JSON canonicalisation | AGREE | Library calls correct (see fact-check). "Audited" for `@noble/ed25519` is PARTLY true — cure53 audited v1 (2022); v3 has only the maintainer's 2026 self-audit. Immaterial to the choice. Sign-the-bytes design is the right way to kill cross-language serialisation bugs and pairs correctly with deriving `hash_code` from the signed bytes. |
| 7 | SHA-256 contract-code allow-list, hot-read file, `active`/`legacy`, enforce at the execution choke point | AGREE WITH CHANGES | Right mechanism, right enforcement point (`execution_navigator.deploy_contract`, `:57-72`, which both the client deploy and the join-replay path reach). But it is oversold as "the one piece that closes today's RCE on its own": it closes *code execution*, not the forged-state-write half of the same `a2a_reply_join` path (see urgent item). Keep piece 1 first, but do not describe it as making node1 safe by itself. |

## Fact-check of the five headline claims

1. **`a2a_reply_join` replays a message-supplied ledger with `direct=True`, skipping consensus → unauthenticated code execution.** **CONFIRMED.** `consensus_navigator.py:55-66`: fetches the ledger from `message['msg']['address']` (attacker-controlled) via `Partner.get_ledger`, then for each record calls `action(records[key], True)`. `deploy_contract(record, direct=True)` → `ContractDialog.process(..., direct=True)` → `PBFT.handle_direct` → `execute_direct` (`pbft.py:224-229`, `215-222`) → `lpush('execution')` → `execution_navigator.deploy_contract` (`:57-72`) → `State.run` → `exec` (`state.py:76-85`). Reachable by `PUT /ibc/app/<victim>/<contract>?action=a2a_reply_join` with no keys. **Exploit (reasoned, not run):** attacker stands up an HTTP endpoint serving a fake ledger containing a `deploy_contract` record whose `message.code` is arbitrary Python, then sends that one PUT naming its own address; the victim node fetches and `exec`s it under the victim's identity. **Beyond deploy — the part Fable misses:** the same loop also replays `contract_write` records `direct=True`, so the attacker can inject writes to *existing* contracts as *any* `record['agent']`, with no consensus and no signature. On a live node1 that means forging `initialize`/`request_vouch`/`vouch`/`register` on the verification contract (multi-step, but each step is just another injected record). The allow-list does not touch this path.
2. **PBFT has zero Byzantine tolerance.** **CONFIRMED.** `receive_pre_prepare` (`pbft.py:134-147`) checks only view and index — not that the sender is `names[order[view]]`, not `d == sha256(block)` ("I should check signatures and digest, but I am lazy", `:142`). `receive_prepare`/`receive_commit` (`:177-187`) check only `n`. `check_phase` (`:199-213`) counts distinct `item['i']` (`:206-208`), a sender-supplied field set in `send_phase` (`:172`). With n=2 the quorum `names*3>len(order)*2` needs 2 distinct `i` values, which one node can fabricate → one party can drive any block to COMMIT alone. Separately, the build-order #5 dedupe claim checks out: a duplicate `d` is appended twice in `store_request` (`:116`) and the second `execute` pop (`:269`) would `KeyError`.
3. **`hash_code` is computed by the receiving node over `str(record)` including its own timestamp.** **CONFIRMED.** `ibc.py:38-45`: `record['timestamp'] = datetime.now()...` then `record['hash_code'] = sha256(str(record)...)`. So the id is not reproducible by the signer; under signing it must be derived from the signed payload bytes, exactly as the document says.
4. **Contract code runs in the web process on reads.** **CONFIRMED.** `contract_read` → `get_contract_object` → `ContractView(...).run()` → `State.run` → `exec` (`navigator.py:115-123`, `51-56`; `contract_view.py:12-18`; `state.py:76`). A sandbox escape therefore has two homes (web + execution service), as noted.
5. **The reduced-builtins `exec` is escapable.** **CONFIRMED.** `state.py:76-85` leaves `type` and `__build_class__` in `__builtins__` and filters no attribute access; `().__class__.__base__.__subclasses__()` and similar reach the interpreter. Not a sandbox.

Other spot-checks that held: `master()` = URL agent (`state.py:29-30`, `117-118`); `approve_partner` defaults True (`state.py:132-133`); hosted-contract routing adds `agent` for member methods (`api.ts:37-45`, `contractHosts.ts`); verification/initiative take the actor as an argument, community uses `master()`, digital agent checks nobody (contracts as cited in appendix B); `register_verification` lets any caller repoint a host (`application_settings.py:23-31`); ownerless central account in `.env` (`VITE_APPLICATION_AGENT=gloki-application`); build bakes it in and env vars override (`deploy.yml`, `applicationServer.ts`, `vite.config.ts:24`).

## Technical premises (web search, late 2026)

- **WebCrypto Ed25519:** now in all three engines — Chrome 137 (May 2025, last to ship), Firefox 129/130 (2024), Safari 17. Fable's "current Chrome, Safari, Firefox but not every embedded webview" is CORRECT. Choosing `@noble/ed25519` anyway (exportable seed for the paste-your-key model, webview portability) is reasonable, not a hedge against missing support.
- **PyNaCl:** actively maintained; latest 1.6.2 (1 Jan 2026), 1.6.0 (Sep 2025) bundled libsodium 1.0.20 and added free-threaded 3.14 support; manylinux wheels cover the `python:3.12-slim` image. "Pin a release at least a month old" → 1.6.1 (10 Nov 2025) or 1.6.2 qualify by build time. CORRECT.
- **`@noble/ed25519`:** small, zero-dep, v3 since Aug 2025 (3.2.0 current). Audit status is weaker than stated: cure53 audited **v1** (2022); v3 has the maintainer's LLM-assisted **self-audit** (Apr 2026), not an independent one. Still a sound pick; soften "audited" to "self-audited v3; independently audited v1 (cure53, 2022)".

## Fit and build order

The seven answers cohere and the dependency graph (1‖2; 3 after 2; 4,5 after 3; 6 after 2; 7 last) is right. One
correction to the safety story: pieces 1–5 are described as testable on one node and the urgent protection as
piece 1. That ordering is safe for *local development* but not for *node1 going public*, because the a2a ingress
is a network attack surface that piece 1 only half-closes.

## URGENT — before node1 is public and before anyone is verified on live

The unauthenticated `a2a_reply_join` / `a2a_consent` ingress lets anyone on the internet (a) deploy and `exec`
arbitrary code on a node (closed by piece 1), and (b) inject forged `contract_write` records into any contract,
bypassing consensus and signatures (NOT closed by piece 1) — including forging the verified list on node1's
founder contract. Shipping only the allow-list and then standing node1 up, or verifying the founder, would leave
(b) open.

Cheapest safe sequence before node1 is reachable from the internet:
1. **Ship the allow-list (piece 1)** — closes code-exec.
2. **Gate the `a2a_*` replay path in the same window** — do not wait for the full piece 6. Minimum viable: refuse
   `a2a_reply_join` unless it answers a join this node itself initiated (match an outstanding request), and refuse
   `a2a_consent`/`a2a_reply_join` from any source not already a pinned partner. This is far smaller than full node
   signatures and removes the forged-write surface until piece 6 lands.
3. Only then make node1 public and run the founder flow.

Until both (1) and (2) are in place, treat any node exposed beyond localhost as writable by anyone, and do not
create the node1 founder on a publicly reachable node. (Reasoned from code; no live node was contacted.)
