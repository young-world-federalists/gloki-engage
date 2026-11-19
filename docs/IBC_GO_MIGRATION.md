# Migrating gloki-engage from ibc (Python) to ibc-go

**Status (2026-11-19):** phases 0–5 built and checked on a local ibc-go node; phase 6 (cutover) waits on
`ouri.gloki.contact`. Branch `ibc-go-migration`, from `main` @ `44792f2`; nothing committed yet. See
[Where it stands](#where-it-stands) at the end.
**Sources:** [ibc-go](https://github.com/ouripoupko/ibc-go): README, `docs/api.md`, `keys.md`,
`architecture.md`, `consensus.md` (§10–11), `usage.md`, `proposal-shared-world.md`, `js/README.md`.

## What changes underneath

| | ibc (today) | ibc-go |
|---|---|---|
| Contracts | Python classes, `Storage()` collections, sent as source | Solidity 0.8.38 on the EVM. The app sends source; the user's node compiles it |
| Identity | Any string (we use a typed "public key"); no signatures | Agent id = the address of a root **passkey** that belongs to the node's origin. Every write, read, `get_contracts` and stream is signed |
| Who acts | Anyone can send any key, as `agent` in the URL or as an argument | `msg.sender` is the signer. The node signs silently only the functions the user granted to our app (per source hash) |
| App ↔ node | The app calls the node directly as the user | The app has its own browser key (`IbcApp`) and acts through the user's node. Approvals open the node's `/approve.html` in a popup |
| Using a contract without joining | Our own trick: call through the creator's agent, pass `agent` explicitly (`contractHosts.ts`) | Native **guests**: the guest's node forwards to a host; the contract opts in with `approve_guest` |
| Membership | Partners = members; built-in `get_partners` | No `get_partners`. `approve_partner`/`approve_guest`/`approve_removal` in the root contract |
| Several contracts | One per deploy; cross-contract `read()` | One agreement = an EVM world. The root can `new` more contracts; calls take `to`/`at`. No reads across agreements |
| Reading others' data | Anyone reads anything | You read only your own copy, unless the owner made it **public** (`public_read`, unsigned, `msg.sender = 0`) |
| Errors | `{error}` return values; writes keep partial changes | `require`/`revert`: the client throws `IbcError`, and nothing is kept |
| Client | Our `api.ts` + `eventStream.ts` | `@ouripoupko/ibc` (`IbcApp`: read/write/deploy/join/permit/onEvent; it reconnects by itself). On npm since 0.1.0 |
| Liveness | — | A contract progresses only while a supermajority of its partners is online. Each join freezes it until decided |

Most of Eston's security asks in `docs/FOR_OURI_seam.md` dissolve with this:
- **Gone with signatures:** impersonation through public keys, "anyone can vouch, register or reset as anyone", and the settings-signpost overwrite (it becomes a `msg.sender` check).
- **Gone with typed storage:** the D1 `in`-collection no-op. The creation race goes too, because the author becomes `msg.sender` in the constructor.
- **Not fixed by keeping the topology** (§3): client-supplied issue code, and membership checks inside issues.

## 1. Session and identity

- **Sign-in.** The user gives their node's URL (default `http://localhost:2611` while we develop; `https://ouri.gloki.contact` once it runs current ibc-go), clicks Connect, and
  `IbcApp.open(node)` + `app.connect()` opens the node's approval page. There they sign in with their
  passkey, or create an identity. `state.user.publicKey` becomes the agent address.
  - `isExistAgent`/`registerAgent` go: the node registers the identity on its own page.
  - `LoginPage` and the beta's keys screen need Eston's redesign: no key to type, a popup to approve.
- **Addresses** are checksummed hex. Compare case-insensitively wherever keys are compared or stored
  (profiles map, roles, `isAuthorOrCoAuthor`).
- **Popups need a click.** Anything that may need approval (every deploy and join, the first use of a
  source, any function not granted) must start from a click handler. Today some writes run from
  effects; for example, `useVerificationRegistry` calls `register` automatically. They become a
  button, or a granted silent call. Check whether `IbcApp` opens the window before its first `await`.
  If not, any `await` in our click handlers before it will get the popup blocked.
- **Grants.** For each contract source, list which functions the app asks to call silently, and which
  stay passkey-signed on purpose:
  - Silent: comments, likes, problem votes, approvals, enrolling as a member.
  - Passkey: the final ballot (`allocate`), `stake`, `set_stage`, vouches, `register`.
  - Today the user ticks the functions on the approval page, and the box starts off (see Q4).

## 2. The wire layer (`src/services/`)

- **New `services/ibc.ts`.** It holds the one `IbcApp` and exports `ibcRead`, `ibcWrite`, `ibcDeploy`,
  `ibcJoin`, `onContractEvent`.
- **The seam keeps its shape.** `contractRead`/`contractWrite` keep their signatures, so flows and the
  demo layer don't change. On a real page they call `app.read/app.write(contract, method, values, {at})`.
  `app.write` resolves with the function's result, so the `watchForChainAck` plumbing goes.
- **Deleted:** the `*OnChain` functions, `contractHosts.ts`, `routeCall` and the `agent` injection,
  `INITIATIVE_MEMBER_METHODS`, `ReconnectingStream` / `watchForChainAck` / `openScopedAckStream` /
  `watchContract`, and `useInitiativeHostReady`.
- **Live updates.** `useContractSync` / `useEventStream` move to `app.onEvent`, filtered by contract.
  On `onStatus('open')` the page refetches, because events sent while the stream was down are lost.
  Expect duplicate events after a node restart.
- **Errors.** `IbcError` replaces `{error}` replies. `throwIfContractError` and its callers change.
  Keep the revert strings identical to today's refusals: the UI and the demo stubs match on them.
- **Return shapes.** Solidity returns arrays of structs, not id-keyed dicts. Per-contract adapters in
  `services/contracts/` turn them back into what the flows expect, so the flows don't change.
- **Names.** Keep the snake_case function and parameter names (`add_proposal`, `proposal_id`). The
  seam rule ("wire names match") and every demo stub then keep working. Drop only the `agent`
  parameters.

## 3. Topology: kept as today (Ouri, 2026-11-19)

Community members are its **partners**. Each issue is its **own agreement** on its creator's node,
and members use it as **guests**: ibc-go's native form of today's "used without joining".

| Contract | Deployed by | Partners | Others | Notes |
|---|---|---|---|---|
| **Profile** (`DigitalAgent.sol`) | each user | the user | read it with `public_read` (made public at deploy) | Others resolve names with the same `{address, agent, profile}` triple as today |
| **Application settings** | `gloki-application`, once, with `tools/setup-application.mjs` | that agent | `public_read` | Its contract id goes in `.env` (`VITE_APPLICATION_SETTINGS_CONTRACT`), because nobody else can `get_contracts` another agent. Hosts are written by `msg.sender` only |
| **Verification** | the founder | the founder | everyone else as guests (`approve_guest` returns true) | Today users don't join it, and their calls go through the host agent. Guests are the same model, signed. `get_status` can be public |
| **Community** | its founder | the founder, and any member who joins as a partner | members who join as guests (`approve_guest` returns true) | Membership is the contract's own list, separate from its partners: see below |
| **Issue** | its creator, on their node | the creator | community members as **guests** (`approve_guest` returns true) | Replaces `contractHosts.ts`. Each member's first action on an issue is a guest join, one passkey approval. Routes keep `:host/:agent` (the guest join needs the host) |
| **Forum** (beta) | `gloki-application` | that agent | guests | Gives the beta's `/forum` its real side |

**The members list (Ouri, 2026-11-19: option a).** The contract manages the community's members,
detached from its partners. After joining, as a partner or a guest, a member calls `enroll(profile)`.
The contract keeps `{agent, node, profile}`, which names need, and answers `get_members()`. This
replaces `get_partners`, so a guest can be a community member.

**What stays as today, by keeping the topology.** These are no worse than today, but not fixed either:
- An issue can't check community membership (no reads across agreements). "Members only" and
  "verified only" stay UI-gated.
- Anyone can deploy modified issue code and add it to a community.
- A member who joins as a partner replicates the whole community, and that join freezes it until decided. A guest member does neither.

## 4. Porting the contracts

Order: Profile → Settings → Verification → Community → Initiative. They import as multi-file sources
(`{path: source}` through `?raw`) from `src/assets/contracts/sol/`.

- **`DigitalAgent.sol`:** `set_profile`, `set_account_kind`, `get_profile`, plus a struct.
- **`ApplicationSettings.sol`:** `register_verification`, `get_verification`. Owner check, no overwrite.
- **`GlokiVerification.sol`:**
  - The three phases, unchanged.
  - Every `steward`/`requester`/`voucher`/`newcomer` argument that names the caller becomes `msg.sender`; `register` keeps `vouchers`.
  - Mappings plus arrays for listing, since `get_status` returns lists.
- **`GlokiEngageCommunity.sol`:** details, `add_initiative` (a reference `{address, agent, contract}`, as today) and its list, and members (`enroll(profile)`, `get_members()`).
- **`GlokiEngageInitiative.sol`**, the bulk (587 lines of Python):
  - **IDs and checks.** Comment and proposal ids become `uint` counters; the D1 workaround and `_is_whole_number` disappear.
  - **Ballot.** `allocate(uint[] proposal_ids, uint[] credits)` replaces the JSON object.
  - **Results.** `get_results`: no floats. Either return integer square roots in fixed point (for example ×1000), or return the allocations and take √ in the adapter. I recommend the adapter: the arithmetic stays where it is shown.
  - **Conviction strength.** `1 + elapsed/30d`, capped, in fixed point (‰). `block.timestamp` replaces `timestamp()`/`elapsed_time`; a read sees the request time.
  - **Timestamps** become `uint` seconds. Adapters format them as the UI expects.
  - **The property bag** (`mandate_ratification` JSON string) stays a `string` mapping, gated to author/co-authors.
  - **Close the open gates while porting** (cheap now): the stage check on `add_proposal`/`approve`, the author on `decide_merge_suggestion`, `mark_merged_into`, and the expert gate on `add_expert_review`.
  - **Size.** If it exceeds the 24 KB code limit, split it per stage (Problem, Discussion, Proposals, Ballot, Conviction), each created by `Initiative`'s constructor.
- **Python contracts** in `src/assets/contracts/` are deleted at cutover. The demo-only ones
  (`community_contract.py`, `funding_flow_contract.py`) stay with the demo layer.

## 5. Phases

Each phase ends with a page working end to end on a local ibc-go node (`http://localhost:2611`;
passkeys need `localhost`, not `127.0.0.1`).

0. **Decisions and environment.** Answer the questions below. Run a local ibc-go node. Bring in the
   client from the local `../ibc-go/js` until it is on npm. Write a
   scenario harness on `Ibc` + `newP256Key` (as `examples/js/demo.mjs` does, several agents) for the
   checks the Python scratch harnesses did (76 ballot-guard checks, 40 verification checks).
1. **Session, wire, profile.** `services/ibc.ts`, sign-in, `userSlice`/`AuthContext`, events,
   `DigitalAgent.sol`. Milestone: sign up and edit the profile.
2. **Settings and verification.** Milestone: founder → sequential → open phases, with others' names
   resolved through public profiles.
3. **Community.** Create, join (partner or guest) + `enroll`, members list (`communitiesSlice`, `JoinCommunity`,
   `Members`, `CreateCommunityPage`).
4. **Issues.** Deploy on the creator's node, guest join on first action, every stage flow on real data,
   `useMandate`.
5. **Forum.** `forum.ts` real side, so the beta lands on something real.
6. **Cutover.**
   - Ouri brings `ouri.gloki.contact` up to current ibc-go before our first commit. Then point `.env` at it, deploy the settings contract there, and set the `github-pages` variables. (`gdi.gloki.contact` is upgraded to ibc-go afterwards.)
   - Update the docs (ARCHITECTURE, DEMO_MODE, FOR_OURI_seam; CLAUDE.md and skills with Eston).
   - Delete the old services and contracts, merge to `main`, deploy Pages.

The old network's data isn't migrated: everyone signs up again (Q1). The live beta stays on old ibc
until the cutover. The demo layer (`?demo=true`) is untouched throughout.

## Decisions (Ouri, 2026-11-19)

- **Settings contract id in `.env`:** yes (`VITE_APPLICATION_SETTINGS_CONTRACT`).
- **Click-only approvals:** fine. The automatic `register` becomes a button or a silent call.
- **Client package:** `@ouripoupko/ibc` from npm (`^0.1.0`, ibc-go's first release, v0.1.0). Until
  then the repo used the local checkout `../ibc-go/js`.
- **Docker:** none planned. ibc-go is a single binary; node1 follows `docs/deploy.md` of ibc-go.
- **Fresh start:** yes. No user base yet, so no compatibility with the old network.
- **Events:** partners see every transaction's outcome (each runs it locally); guests get every reply
  from their host (`consensus.md` §11). `useContractSync` can rely on both.
- **Silent functions:** the approval page now starts with every write function allowed (ibc-go
  `812b580`). No "propose functions" request is needed for now. Passkey-only functions (§1) need a
  rule if we want them: the user unticks them, or the contract design keeps them separate. (ibc-go's
  `docs/keys.md` still says "none by default".)

- **Topology:** kept as today (§3).
- **Node:** development runs on a local ibc-go node, `http://localhost:2611` (built from `../ibc-go`).
  `ouri.gloki.contact` runs ibc-go v0.1.0 (updated 2026-11-19); it is the login's default and the
  application account's node. `gdi.gloki.contact` moves to
  ibc-go after the migration.
- **One root key per node:** by design. The user trusts only their own node, and every app reaches
  them through it.

## Open questions

1. **Approval popups can be blocked (to discuss; possibly an ibc-go issue).** Browsers let a page
   open a window only within a short time of the user's click: a few seconds in Chrome and Firefox,
   about one second in Safari. After that, `window.open` returns nothing.
   - In ibc-go's `js/src/ibc.ts`, `IbcApp.write` (and `read`) first awaits a round trip to the node
     (`writeSilently`). Only if the node answers "needs approval" does it call `window.open` for the
     approval page. A slow node, or our own awaits between the click and the call, can use up that
     time.
   - The user then gets `the approval window was blocked` instead of the approval page.
     `deploy`/`join`/`connect` open the window at once and are not affected.
   - Options:
     - (i) The app keeps its consent locally, so it knows without a round trip whether a call needs
       approval.
     - (ii) Open the window first, within the click, then close it if the silent call succeeds
       (a flash).
     - (iii) Report "needs approval" to the app, which shows a button whose click opens the page.
   - Until decided, our side keeps the work between a click and a write short, and offers a
     "Continue" button on that error.

2. **Anyone can claim verification in the settings contract (to discuss; left as is).**
   `ApplicationSettings.register_verification` is open to every signed-in agent, who joins as a guest.
   The old Python contract was just as open.
   - **Squatting:** the first call fixes the verification contract's id for the whole network, so a
     stranger who calls it before the real founder decides it. The only remedy is the operator's
     `reset_verification`, after the fact.
   - **Fake hosts:** any agent can add itself as a host of the verification contract without holding
     it. The app tries hosts in turn, so a fake entry costs failed or misleading reads, though it
     can't change the real contract.
   - Options:
     - (i) Only the application account sets the verification id: one step by the operator when
       verification starts.
     - (ii) Only agents holding the contract can add themselves as hosts. This needs a check across
       agreements, which ibc-go doesn't have.

## Where it stands

**Built** (uncommitted on `ibc-go-migration`):
- Contracts, `src/assets/contracts/sol/`: `DigitalAgent`, `ApplicationSettings` (verification location
  and forum), `GlokiVerification`, `GlokiEngageCommunity`, `GlokiEngageInitiative` (a root that
  creates `Solutions` and `Decision`: one contract was 28.7 KB, over the EVM's 24 KB limit), `Forum`.
  The replaced Python contracts are deleted; the demo layer's remain.
- `services/ibc.ts` (the one `IbcApp`), `eventStream.ts` on its stream, `api.ts`, the contract
  modules, `verificationRegistry.ts`, `applicationSettings.ts`, `forum.ts`; sign-in, session restore
  and sign-out; the login page (node + Connect); the forum route two-state.
- Fixes found on the way: invites now carry `0x` contract ids and the sharer's own node; a real
  community's stage rules fall back to the defaults; identical public reads share one request and
  retry on the node's rate limit; verification refreshes on the contract's events.

**Checked:**
- Contract checks on the local node, in [`tools/ibc-check/`](../tools/ibc-check/README.md) (Node,
  `@ouripoupko/ibc` with P-256 keys in place of passkeys): profile 9, settings + verification 27,
  community 12, initiative 58, forum 11 — 117 checks, every guard.
- In headless Chrome with virtual passkeys, the real app, two people: sign-up and profile (6);
  verification founder → sequential vouch → registration (8); community create, invite, join, member
  names, issue create, first vote as a guest (13); every stage through the app's flow modules (24);
  the beta forum (6). `tsc -b`, lint, knip and `npm run build` are clean.
- The browser walks stayed out of the repo: they click by visible text, which Eston's redesign will change.

**Application account:** `node tools/setup-application.mjs <node url> <key file>` makes it, once per
network: the account (its key in the key file), `ApplicationSettings` and `Forum`, both public, the
settings pointing at the forum. It prints the lines for `.env`; running it again with the same key
finishes a half-done setup and changes nothing else. Only Node and this repo are needed.
- Local node: done (key `~/.ibc/gloki-app-local.key`, ids in `.env.local`).
- `ouri.gloki.contact` (ibc-go v0.1.0): **only after the migration is merged to main** (Ouri,
  2026-11-19). Until then `.env` keeps `VITE_APPLICATION_AGENT` and
  `VITE_APPLICATION_SETTINGS_CONTRACT` empty, so a build without `.env.local` refuses.
- Done: `@ouripoupko/ibc` 0.1.0 is on npm and `package.json` uses it; `tsc -b`, lint, knip, the
  build and the 117 contract checks pass with it.

**For Eston (UI):** sign-in copy and design; the approval moments (the node's page opens for deploys,
joins, and a member's first action on an issue or on verification); i18n: the 16 new sign-in strings
have model-made fr/sw translations (native review still to do; not yet in
`docs/i18n-native-review-candidates.md`), and the 116 keys no code used anymore are gone from
`en.ts`/`fr.ts`/`sw.ts` (2026-11-19; fr and sw at parity, 1433 keys each);
`CLAUDE.md` and the skills still describe the Python contracts (Stack, Deployment, Key Patterns:
`Storage()`, `contractHosts.ts`/`agent`, `useFlowContract` single-contract mode notes).

**Open:**
- Approval popups after a slow step (open question 1). Founding verification needs two approvals in a
  row; if the browser blocks the second, clicking again resumes.
- Public reads are rate-limited per client address (a burst of 20, then 10 a second): a feed of many
  issues the user hasn't joined reads them all publicly. Shared requests and retries cover it in the
  tests; a busier page may need a lighter read pattern (for example one summary read per issue).
- Pages reading a contract only through its public copy get no live events (they refresh on load).
- `approve_guest` admits anyone: membership and verification still gate only in the UI, as before.
- Anyone can claim the verification id or add a fake host in the settings contract (open question 2).
- Every session now signs in for real on a node, demo pages included: the old trick of seeding a fake
  `user` in localStorage no longer works, because session restore asks the node. Eston's design work
  needs a node, either local or the live one after the merge.

