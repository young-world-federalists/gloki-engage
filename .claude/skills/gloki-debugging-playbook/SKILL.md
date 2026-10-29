---
name: gloki-debugging-playbook
description: "Use when debugging Communities2/Gloki symptoms: UI frozen after a write, a write that never confirms, stale demo data, a second member sees different data ('no such contract'), join spinning forever, a verification list showing keys instead of names, writes failing on older issues, 'click anywhere = error page' after a deploy, deploy missing, assets 404 on Pages, build fails with 'Missing VITE_APPLICATION_…', contract 500 on first read, 'feature isn't available on this community', contracts deploying from nowhere, users stuck at /welcome, ?demo=true showing real data, phantom git state or I/O stalls on the USB drive, focus lost after deep-link, aria-live silent, navigator.onLine stuck, rg/grep missing keys, [FlowContract] logs."
---

# Gloki Debugging Playbook

## Overview

**Core principle: most "bugs" here are known artifacts of the environment — the two data layers (real
network vs demo), immutable contracts, the GitHub Pages deploy, or the slow USB drive on Eston's machine
— not defects in the code you just wrote. Triage by symptom against this table BEFORE writing a fix.**
Only when a symptom clears the table, fall back to first-principles debugging.

Vocabulary:

- **Real / demo variant** — every page: `/page` (real network) and `/page?demo=true` (demo layer,
  `src/services/demo/`, localStorage). **The flag decides the layer for every call, never the id** — an
  id from the other layer is "not found". Spec: `docs/DEMO_MODE.md`.
- **Hosted contract** — an issue (or the verification/settings contract) is used without joining it:
  calls go to its creator's node through the creator's agent, with the caller's key as `agent`
  (`src/services/contractHosts.ts`).
- **DEMO_VERSION** — constant in `src/services/demo/mockApi.ts`; a mismatch with a visitor's stored
  `gloki_demo_version` wipes and re-seeds all `gloki_demo*` localStorage.
- **Wire names** — contract method/field names; they byte-match the real contracts.

## Quick triage table

| # | Symptom | It is almost certainly… | NOT… |
|---|---|---|---|
| 1 | Demo variant doesn't update after a write | demo writes emit no events — re-fetch after the write | a Redux bug |
| 2 | Real write spins, then times out | the write's confirmation went to a stream nobody listens to | a server outage |
| 3 | Demo data stale, weird, or missing your new fixture | DEMO_VERSION not bumped, or your own old localStorage | a seeding bug |
| 4 | Second member sees an issue differently / "no such contract" | the call went to the member's own node instead of the issue's creator | a permissions bug |
| 5 | Every member action fails on an issue | the issue's contract is older than the code calling it | a broken UI |
| 6 | Join Community spins, then errors | the community's node never confirmed (`a2a_connect`) | a join-page bug |
| 7 | Verification list shows a short key instead of a name | the person's profile contract can't be found where recorded | a display bug |
| 8 | `?demo=true` shows real data, "not yet implemented" without it, or "not found" | the page is real-only or demo-only, or the id belongs to the other layer | a broken flag |
| 9 | "Everything broken / click anywhere → error page" right after a deploy | stale SPA chunk cache | a code bug |
| 10 | Pushed, but the live site didn't change | the Actions build failed (TS error), or the branch doesn't deploy | Pages misconfiguration |
| 11 | Assets/JS 404 on the live site | bundle built with the wrong base | a routing bug |
| 12 | Build/dev fails: "Missing VITE_APPLICATION_…" | `.env` missing or a value blank | a Vite bug |
| 13 | Contract 500s on its very first read | writes in `__init__` (dialect trap) | a transient error |
| 14 | "This feature isn't available on this community" | a demo community older than the stage-contract registry | a patchable bug |
| 15 | Contracts appearing from nowhere on page VIEW | a "read-only" component calling `useFlowContract` | a phantom user action |
| 16 | Signed-in user sent to `/welcome` | no readable profile contract for this identity on this node | an auth bug |
| 17 | Git output wrong, I/O frozen for minutes | the slow USB drive (Eston's Mac) | repo corruption |
| 18 | Keyboard focus lost after a deep link | card remount when `get_stage` resolves async | a focus typo |
| 19 | `aria-live` announces once, then never again | React batching reset+set into one commit | a screen-reader quirk |
| 20 | `dispatchEvent(new Event('offline'))` doesn't flip the UI | `navigator.onLine` unchanged by synthetic events | a broken hook |
| 21 | `rg a && rg b` says a key doesn't exist | `&&` short-circuit | a missing key |
| 22 | Flow stuck "deploying" / odd provisioning | read the `[FlowContract]` console logs first | guesswork |

---

## 1. Demo variant doesn't update after a write

**Root cause:** the demo layer never emits `contract_write` events, so anything waiting for one waits
forever. **Fix:** after every demo write, re-run the read (one memoised fetch, on mount and after each
write). Components that serve both layers do `if (isDemoDataMode()) await fetchData();`. Mechanics:
**gloki-seam-and-demo-data** §4.

## 2. Real write spins, then times out

**First check:** the browser console for `Timed out waiting for …` and the node's
`docker compose exec ibc tail -f execution.log` — did the write run, and what did it return?

**Root cause:** a real write returns only an ack id; the result arrives on the SSE stream of the
**agent the write went through**. `contractWrite` waits on the user's own stream — or, for a write
through another agent (a hosted issue, verification, settings), on a scoped stream for that agent
(`openScopedAckStream`). A write sent through another agent without that scoped stream never sees its
confirmation. Also: the user's main stream isn't connected (`eventStreamService.connect` runs at sign-in).

**Fix:** route writes through `contractWrite` (it picks the right stream) or the service module that
owns the contract; never call `contractWriteOnChain` + `watchForChainAck` for another agent's contract.
If `execution.log` shows an error string, that's the real cause — the write ran and refused.

## 3. Stale or weird demo data — clear vs bump

**First check** (DevTools): `localStorage.getItem('gloki_demo_version')` vs `DEMO_VERSION` in
`mockApi.ts`.

**Fix — who needs fresh data?** Only your browser → clear the `gloki_demo*` keys and reload (never bump
for this). Returning visitors must see a fixture/seed change → bump `DEMO_VERSION`. UI-only change →
nothing. Table and snippet: **gloki-seam-and-demo-data** §7.

Sub-symptom: a flow renders empty after a demo reset → a **rehydrated orphan** id in
`flowContracts:<scope>`; `demoRouter.ts` auto-registers unknown ids as no-op stubs. Clear the
`flowContracts:` key (or all `gloki_demo*`) and reload.

## 4. Second member sees an issue differently / "no such contract"

**First check:** the read's URL in the Network tab — is it going to the issue creator's node and agent
(`/ibc/app/<creator>/<issue>/…`) or the viewer's own?

**Root cause:** members don't join issue contracts; only the creator holds one. Every call must go
through the creator's agent, which `contractRead`/`contractWrite` do once the issue is registered in
`contractHosts.ts`. Registration happens when the community's issue list loads (`fetchCollaborations`),
on the issue route (from `:initiativeHostServer/:initiativeHostAgent`), at creation, and on the mandate
route via `useInitiativeHostReady`. A path that reaches an issue before any of these reads the viewer's
own node and gets `{"message":"no such contract"}` (often rendered as stage "problem" or empty).

**Fix:** make the path register the host first (load the issue list, or pass the host in the route),
rather than special-casing the read.

## 5. Every member action fails on an issue

**Root cause:** contracts are immutable. Issues created before a contract change keep the old code:
before 2026-10-28 they lack `cause_id` on `add_proposal`; before the `agent` parameters they reject the
added `agent` argument. The node returns an error (see `execution.log`).

**Fix:** none for that issue — create a new one. For new code: optional trailing arguments and
absence-tolerant readers (**gloki-python-contracts** §5).

## 6. Join Community spins, then errors

**First check:** the joiner's stream for `a2a_connect` (and `a2a_reply_join`); the node logs on both sides.

**Root cause:** `joinContract` sends `join_contract` to the joiner's own node, which connects to the node
named in the invitation (`server` + `agent`). Success arrives as `a2a_connect` with `reply: true`; the
join page waits up to 30 s. No event = the invitation's node is unreachable from the joiner's node, or
the invitation names an agent that doesn't hold the community. `reply: false` = the community refused.

**Fix:** check the invitation JSON (`{server, agent, contract}`, from "Share Community Link" on a
member's community page) and that the two nodes can reach each other.

## 7. Verification list shows a short key instead of a name

**Root cause:** names come from each person's Digital Agent profile contract on their own node.
`personSummary` (`verificationRegistry.ts`) looks up the person's current profile by name on their node,
falling back to the id stored in the verification contract. A short key means neither worked: the node
is unreachable from this browser (e.g. a `localhost` node seen from elsewhere), or the identity has no
profile there.

**Fix:** check that the stored node address is reachable; the lookup retries on the next read.

## 8. `?demo=true` shows real data, or "not yet implemented" without it

**Root cause:** every route is one of three kinds (`docs/DEMO_MODE.md`). A **real-only** page ignores the
flag and says so at the top; a **demo-only** page shows "not yet implemented" without the flag. Neither is
a bug. And an id from the other layer (a demo id without the flag, a real id with it) shows the page's
"not found" — the flag, not the id, picks the layer. Check the page's row in `docs/DEMO_MODE.md`.

## 9. "Everything broken" right after a deploy

**Root cause:** each deploy renames the hashed chunks; a browser holding the old `index.html` requests
chunks that no longer exist, and every route throws into the ErrorBoundary. **Fix:** hard refresh. If it
persists across hard refreshes, check the build (entry 10).

## 10. The live site didn't change

**First check:** `gh run list --workflow=deploy.yml -L 3`.

**Root cause:** a push never deploys; the workflow runs only by hand (Actions → Run workflow) and builds
one app (`build:beta` at the root). A push to the retired `server-side` or `ui` runs their old workflow
and redeploys the old site. Every build starts with `tsc -b`; one unused import fails it and the site
stays old.

**Fix:** `gh run view <id> --log-failed`, fix the TS error, run the workflow again with an explicit go. Prevention:
`npx --no-install tsc -b --noEmit` before every push. Pipeline: **gloki-build-env-run**.

## 11. Assets 404 on the Pages site

**Root cause:** the site needs base `/gloki-engage/` (`--mode production`). A plain `npm run build` is
base `/`.

**Fix:** use `build:prod` / `build:beta` (+ `preview:prod`) for anything Pages-shaped. Never simplify away
`public/404.html` or the inline `?/` decoder in `index.html`.

## 12. Build/dev fails: "Missing VITE_APPLICATION_…"

**Root cause:** `vite.config.ts` refuses to run without `VITE_APPLICATION_SERVER_URL` and
`VITE_APPLICATION_AGENT`. Defaults live only in `.env`; `.env.local` and environment variables override
them. **Fix:** restore `.env`, or set the values (**gloki-build-env-run**, "Required build settings").

## 13. Contract 500s on its very first read

**Root cause (dialect trap):** `__init__` re-runs on every invocation and reads forbid writes, so a write
in `__init__` blows up the first read. **Fix:** `__init__` only binds `Storage()` handles; initialise in a
write method that refuses to run twice; no counters. **gloki-python-contracts** §4.

## 14. "This feature isn't available on this community"

**First check** (console): `[FlowContract] Parent <id> does not expose get_stage_contract …` or
`Registration missing contractId … Old community?`.

**Root cause:** shared mode (demo parents) needs the parent's `register_stage_contract` /
`get_stage_contract`; a demo community seeded before those existed can never gain them. The hook probes
first and fails fast **without deploying** — preserve that order. Real issues don't use sub-contracts
(single-contract mode) and never show this.

**Fix:** none — reseed the demo (entry 3).

## 15. Contracts appearing from nowhere (a page VIEW deploys)

**Root cause:** `useFlowContract` provisions on mount — a display-only component calling it deploys.
**Fix:** read-only components use `resolveInitiativeStageContract` (`src/services/contracts/initiative.ts`).
Rule of thumb: **useFlowContract = provision + own; resolve\* = read.**

## 16. Signed-in user sent to `/welcome`

**First check:** `state.user.digitalAgentProfile` / `digitalAgentContractId` in Redux DevTools, and the
identity's contracts on its node (`GET /ibc/app/<key>?action=get_contracts`).

**Root cause:** `RootRoute` (`App.tsx`) waits for `digitalAgentProfileChecked`, then sends anyone without
a readable Digital Agent profile contract (`unique-gloki-engage-digital-agent-contract`) to `/welcome`.
Typical cause: the node was reset or the user signed in on a different node, so the profile isn't there.

**Fix:** that's correct behaviour — onboarding creates a new profile. If the profile exists but isn't
read, check `fetchContracts` / `readDigitalAgentProfile` in `userSlice.ts`.

## 17. Phantom git states / I/O stalls (Eston's USB drive)

`git update-index -q --refresh && git status -sb`; trust `git rev-parse HEAD` and `gh` over long local
output during a stall. Never "repair" the repo for these symptoms. Discipline: **gloki-build-env-run**.

## 18. Focus lost after a deep link

**Root cause:** the deep-linked card remounts when its stage resolves asynchronously, destroying the
focused inner button. **Fix:** focus the stable wrapper (`tabIndex={-1}`, `preventScroll: true` after
`scrollIntoView`), never an inner control; the focus effect must sit after the `initiatives` `useMemo`.
Pattern: `grep -n "Focus the stable wrapper" src/components/community/CommunityHome.tsx`.

## 19. aria-live region won't re-announce

**Root cause:** React batches `setStatus('')` + `setStatus(msg)` into one commit; identical text → no
change → silence. **Fix:** reset to `''` synchronously, then set the message in a ~60 ms `setTimeout`
(kept in a ref, cleared on unmount). Pattern:
`grep -n "separate commit" src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx`.

## 20. Simulated offline doesn't flip the UI

`useOnline` reads `navigator.onLine`; a synthetic event doesn't change it.

```js
Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
window.dispatchEvent(new Event('offline'));
```

The override resets on reload. Restore with `get: () => true` and an `'online'` event.

## 21. `rg a && rg b` masking existing keys

`&&` short-circuits — the second search never runs. Use one multi-file command:
`grep -n "'key.one'" src/i18n/fr.ts src/i18n/sw.ts`. When Bash output looks impossibly mangled,
cross-check with the Read tool before concluding anything.

## 22. `[FlowContract]` — the provisioning log

Every deploy/join/registration step in `useFlowContract` logs with the `[FlowContract]` prefix — filter
the console for it first:

| Log line (abbrev.) | Meaning |
|---|---|
| `Clearing stale deploying flag for <id>` | recovery from an interrupted mount — benign |
| `Deploying <name> for <id>...` | per-user deploy started |
| `Setting up shared <name> ... (parent, stage)` | shared-mode provisioning started |
| `TIMEOUT: ... did not complete within 30s` | hit `DEPLOY_TIMEOUT_MS` — `retry()` available |
| `Parent <id> does not expose get_stage_contract` / `Registration missing contractId` | entry 14 |
| `ERROR deploying ...` / `ERROR setting up shared contract` | real failure — read the error object |

---

## When NOT to use this skill

| You actually need to… | Use instead |
|---|---|
| The real/demo split, DEMO_VERSION, fixtures in depth | **gloki-seam-and-demo-data** |
| Run/build/deploy, the local node, environment | **gloki-build-env-run** |
| Write or modify a contract / demo handler | **gloki-python-contracts** |
| App structure, flows, Redux, routing | **gloki-frontend-architecture** |
| Verify a fix | **gloki-verification-and-qa** |
| The history of an incident or settled battle | **gloki-failure-archaeology** |
| i18n parity tooling | **gloki-i18n-playbook** |
| Whether a change is allowed | **gloki-change-control** |

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Fact | Re-verify with |
|---|---|
| `DEMO_VERSION` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| Deploy branches, Node, builds | `grep -n "branches\|node-version\|build:" .github/workflows/deploy.yml` |
| Host registration points | `grep -rn "registerInitiativeHost(" src` |
| Join timeout | `grep -n JOIN_TIMEOUT_MS src/components/identity/JoinCommunity.tsx` |
| First-run rule | `grep -n "digitalAgentProfile" src/App.tsx` |
| Required env | `grep -n REQUIRED_ENV vite.config.ts` |
| Error copy + `[FlowContract]` logs | `grep -n "available on this community\|\[FlowContract\]" src/components/collaboration/flows/shared/useFlowContract.ts` |
