---
name: gloki-debugging-playbook
description: "Use when debugging Communities2/Gloki symptoms: UI frozen after a write, stale demo data, 'click anywhere = error page' after a deploy, PR #20 red X, deploy missing, assets 404 on Pages, contract 500 on first read, 'feature isn't available on this community', contracts deploying from nowhere, users stuck at /welcome, phantom git state or I/O stalls on the USB drive, focus lost after deep-link, aria-live silent, navigator.onLine stuck, rg/grep missing keys, [FlowContract] logs."
---

# Gloki Debugging Playbook

## Overview

**Core principle: in this repo, most "bugs" are known artifacts of the environment — the
stub data layer, the GitHub Pages deploy, or the slow USB drive — not defects in the code
you just wrote. Triage by symptom against this table BEFORE writing a fix.** Every entry
below cost a real session real time; several were "fixed" wrongly at least once. Only when
a symptom clears this table should you fall back to first-principles debugging
(`superpowers:systematic-debugging`).

Jargon used throughout (defined once):

- **The seam** — `src/services/api.ts`, the only data boundary components may call
  (`contractRead`/`contractWrite`/`deployContract`/`joinContract`). On this branch (`ui`)
  it is backed entirely by the **demo layer** (`src/services/demo/`), an in-browser mock
  persisted to localStorage. No real server exists here.
- **DEMO_VERSION** — a string constant at `src/services/demo/mockApi.ts:17` (currently
  `'global-v16'`). If a visitor's stored `gloki_demo_version` doesn't match, ALL
  `gloki_demo*` localStorage is wiped and demo data reseeds.
- **Shared mode** — `useFlowContract`'s mode when given `parentContractId` + `stageKey`:
  it reads the parent community/initiative contract for a stored sub-contract, joins it if
  found, **deploys one if not**. Contracts are immutable after deploy.
- **Wire names** — contract method/field names (`add_proposal`, `get_proposals`…). They
  must byte-match Ouri's real Python contracts; UI vocabulary ("Solutions", "Mandate") is
  presentation-only. Ouri is the backend partner who swaps the stubs for real calls.
- **PR #20** — the long-lived `ui`→`main` review PR. It never merges; see entry 4.
- **Eston** — the founder driving your session; he gates every push (a push to `ui` IS a
  production deploy — see `gloki-change-control`).

## Quick triage table

| # | Symptom | It is almost certainly… | NOT… |
|---|---------|--------------------------|------|
| 1 | UI doesn't update after a write (form submits, nothing changes) | demo seam emits no `contract_write` events — re-fetch after write | a Redux/state bug |
| 2 | Demo data stale, weird, or missing your new fixture | DEMO_VERSION not bumped, or your own old localStorage | a seeding code bug |
| 3 | "Everything broken / click anywhere → error page" right after a deploy | stale SPA chunk cache in the browser | a code bug |
| 4 | PR #20 shows a red ✗ | expected merge conflict vs `main` | a build failure — do NOT "fix" |
| 5 | Pushed to `ui` but the live site didn't change | a TS error failed the Actions build silently | Pages misconfiguration |
| 6 | Assets/JS 404 on the live Pages site | bundle built without the `/gloki-engage/` base | a routing bug |
| 7 | Contract 500s on its very first read | writes in `__init__` (Python dialect trap) | a transient server error |
| 8 | "This feature isn't available on this community" card | pre-registry community + contract immutability | a bug you can patch |
| 9 | Contracts appearing from nowhere on page VIEW | a "read-only" component calling `useFlowContract` | a phantom user action |
| 10 | Returning user bounced to `/welcome` every visit | the `isFirstRun` key regression (fixed at HEAD) | auth failure |
| 11 | Git output wrong/truncated, I/O frozen for minutes | slow USB drive under parallel I/O | repo corruption |
| 12 | Keyboard focus lost after following a deep link | card remount when `get_stage` resolves async | a focus-management typo |
| 13 | `aria-live` region announces once, then never again | React batching coalescing reset+set into one commit | a screen-reader quirk |
| 14 | `dispatchEvent(new Event('offline'))` doesn't flip the UI | `navigator.onLine` getter unchanged by synthetic events | a broken `useOnline` hook |
| 15 | `rg a && rg b` says a key doesn't exist (but it does) | shell `&&` short-circuit on the first no-match | a genuinely missing key |
| 16 | Flow stuck "deploying" / silent contract weirdness | read the `[FlowContract]` console logs first | guesswork |

Detailed entries follow. Each: symptom → first check (one command) → root cause → fix →
the incident behind it.

---

## 1. UI not updating after a write

**Symptom:** you `contractWrite` (contribute, allocate, post, vote…) and the screen stays
frozen on the old data. Reload shows the write landed.

**First check** (proves the mechanism, from repo root):

```bash
grep -n "eventStream\|EventSource\|emit" src/services/demo/mockApi.ts
# → zero hits. The demo layer never emits events.
```

**Root cause:** `src/services/eventStream.ts` is a real SSE client
(`EventSource` on `${serverUrl}/stream`) that the real backend feeds with
`contract_write` events. The demo layer never feeds it, so `useEventStream('contract_write')`
is permanently inert on the `ui` branch. Any UI that waits for an event to refresh waits
forever.

**Fix:** after every `contractWrite`, explicitly re-run the read that populates the view
(the ConcernsFlow pattern — `await contractWrite(...); await refresh();`). Never build a
demo-branch feature that depends on `useEventStream` for freshness.

**Incident + full mechanics:** the write-then-refetch rule's home is
**gloki-seam-and-demo-data** §4 (Community Funds incident, 2026-06-25).

## 2. Stale or weird demo data — clear vs bump (discriminate!)

**Symptom:** seeded fixture change not visible; personas/initiatives look like an older
build; or a returning visitor reports wrong/old content.

**First check** (browser DevTools console on the affected browser):

```js
localStorage.getItem('gloki_demo_version')   // compare vs mockApi.ts:17 ('global-v16')
```

**Root cause:** all demo state is localStorage — registry `gloki_demo_contracts`,
per-contract blobs `gloki_demo_state_<id>`, seed flags `gloki_demo_seeded_<communityId>`,
gate `gloki_demo_version`. Seeding only re-runs when the stored version mismatches
`DEMO_VERSION` (`ensureDefaultDemoCommunity`, `mockApi.ts:144`). So old localStorage
silently shadows new fixture code.

**Fix — the discriminating question is who needs the fresh data:** only your own dev
browser → clear the `gloki_demo*` localStorage keys and reload (never bump for this);
fixture/seed content or shape must reach returning visitors → bump `DEMO_VERSION`
(`mockApi.ts:17`); UI-only change → do nothing. The full clear-vs-bump decision table,
the clear snippet, and the incidents behind it live in **gloki-seam-and-demo-data** §6.

Related sub-symptom: a flow that renders but shows null/empty data after a demo reset may
be a **rehydrated orphan** — `flowContracts:<scope>` in localStorage still holds a contract
ID from the previous demo generation; `demoRouter.ts` auto-registers unknown IDs as stub
contracts (reads null, writes no-op) so the UI degrades instead of crashing. Clearing the
`flowContracts:` key (or all `gloki_demo*` + reload) resolves it.

## 3. "Everything broken" right after a deploy

**Symptom:** a visitor (often Eston, minutes after a push) reports the live site errors on
every click / navigation lands on the error page.

**First check:** in the affected browser's DevTools console, look for a failed dynamic
import / 404 on a hashed chunk (`assets/XYZ-<hash>.js`). Or just ask: "does a hard refresh
(Cmd-Shift-R) fix it?"

**Root cause:** `src/App.tsx` lazy-loads 10 route components. Each deploy renames the
hashed chunk files; a browser holding the old `index.html` in cache requests chunk hashes
that no longer exist → every route transition throws into the ErrorBoundary.

**Fix:** hard refresh. Nothing to change in code. If reports persist across hard
refreshes, THEN treat it as real and check the Actions build (entry 5).

**Incident:** card redesign, 2026-06-23 — a full "click anywhere → error page" report was
chased as a code bug before being identified as stale chunk cache. Recorded in project
memory; recurs with returning visitors after every deploy.

## 4. PR #20 shows a red ✗ — do NOT fix anything

**Symptom:** GitHub shows PR #20 (`ui` → `main`) with a red/orange ✗; it looks like the
build is broken.

**First check:**

```bash
gh pr view 20 --json mergeable,state   # → {"mergeable":"CONFLICTING","state":"OPEN"}  (verified 2026-07-02)
gh pr checks 20                        # build + deploy = SUCCESS
```

**Root cause:** the ✗ is the *expected* permanent merge conflict with Ouri's diverged
real-server `main`, not CI failure (checks are green).

**Fix:** none. Reassure, don't debug; never resolve the conflict or merge yourself
(**gloki-change-control**). The full two-era divergence story — this confusion recurred
in at least three sessions — is homed in **gloki-failure-archaeology** entry 1.

## 5. Deploy missing after a push

**Symptom:** pushed to `ui`, waited, live site unchanged — and no error appeared anywhere
in your terminal.

**First check:**

```bash
gh run list --workflow=deploy.yml -L 3
# healthy: "completed  success  <commit subject>  Deploy to GitHub Pages  ui  push ..."
```

**Root cause:** deploy is a GitHub Actions workflow (`.github/workflows/deploy.yml`, fires
on push to `ui`, Node 22, `npm ci` + `npm run build:prod`). `build:prod` starts with
`tsc -b` under strict + `noUnusedLocals`/`noUnusedParameters` — **even one unused import
fails the build and silently blocks the deploy**. Nothing notifies you; the Pages site just
stays old. (CLAUDE.md's "Pages source branch ui via Settings" phrasing is imprecise — the
deploy is Actions-artifact based, so the Actions tab, not Pages settings, is where failures
show.)

**Fix:** open the failed run (`gh run view <id> --log-failed`), fix the TS error, get
Eston's green light, push again. Prevention: `npx --no-install tsc -b --noEmit` clean
before every push. Full pipeline detail: **gloki-build-env-run**.

## 6. Assets 404 on the Pages site

**Symptom:** the deployed site loads a blank page; Network tab shows JS/CSS requested at
`/assets/...` returning 404 (they live at `/gloki-engage/assets/...`).

**First check:**

```bash
grep -n "base:" vite.config.ts
# → base: mode === 'production' ? '/gloki-engage/' : '/'
```

**Root cause:** plain `npm run build` produces a base-`/` bundle; the Pages site is served
under the project path `/gloki-engage/`. Only `npm run build:prod` (`--mode production`)
sets the right base. Same trap in reverse: `vite preview` of a prod build serves at the
wrong base — use `npm run preview:prod`.

**Fix:** the CI workflow already uses `build:prod`, so this bites when someone manually
builds/uploads or previews Pages-parity locally with the wrong script. Use
`build:prod`/`preview:prod` for anything Pages-shaped. Also never "simplify away"
`public/404.html` or the inline `?/` decoder script in `index.html` — that pair is the SPA
deep-link mechanism on Pages. Command card: **gloki-build-env-run**.

## 7. Contract 500s on its very first read

**Symptom:** a freshly deployed contract errors on the first `contractRead` before any
write ever touched it.

**First check:** open the contract's `.py` and look at `__init__` for any conditional
Storage write, e.g.:

```bash
sed -n '1,20p' src/assets/contracts/community_contract.py
# line 14–15: if 'centralAccount' not in self.accounts: self.accounts['centralAccount'] = {...}
```

**Root cause (dialect trap):** the Gloki blockchain re-runs `__init__` on EVERY
invocation, and read calls disallow writes (the storage layer raises a write-permission
error). A counter-initializing or default-seeding write in `__init__` therefore blows up
the first read. (`community_contract.py:14` does write in `__init__` — a known edge owned
by Ouri; do not copy the pattern.)

**Fix:** never initialize state in `__init__`; use `timestamp()`-keyed IDs instead of
counters, and the `x or default` idiom on reads (Storage Documents return `None` for
missing keys — there is no `.get(key, default)`). Full dialect checklist:
**gloki-python-contracts**.

**Incident:** recorded as an ARCHITECTURE.md learning from the original discussion/chat
contract work; the discussion/chat/concerns contracts all use the timestamp-key pattern as
a result.

## 8. "This feature isn't available on this community" card

**Symptom:** an initiative-stage flow renders an error card with exactly that copy
(defined at `useFlowContract.ts:161` and `:248`).

**First check:** the console — you'll see one of:

```
[FlowContract] Parent <id> does not expose get_stage_contract for <stage> — unsupported: ...
[FlowContract] Registration missing contractId for <stage> on <id>. Old community?
```

**Root cause:** the parent community/initiative contract was deployed before
`register_stage_contract`/`get_stage_contract` existed. Contracts are immutable after
deploy, so the method can never be added. The hook deliberately probes the parent FIRST
and fails fast **without deploying** — earlier code deployed a fresh sub-contract before
probing, leaving an orphan immutable contract on every visit (the fix is comment-enforced
in `useFlowContract.ts` shared-mode code; preserve it in any refactor).

**Fix:** there is no patch. The only remedy is a fresh community. In demo data, reseed
(entry 2); in the real world this is expected graceful degradation — do not "fix" the
error card away.

## 9. Contracts appearing from nowhere (a page VIEW deploys)

**Symptom:** merely opening a page/preview creates contracts (registry grows, new
`gloki_demo_state_*` keys, `register_stage_contract` writes) — including for users the
trust gate should block.

**First check:**

```bash
grep -rn "useFlowContract(" src/components/<suspect-component>.tsx
```

**Root cause:** `useFlowContract` is provision-on-mount: in shared mode it deploys and
registers a sub-contract whenever the parent has none. A display-only component calling it
is therefore NOT read-only — it performs writes past the trust gate. The hook has no
read-only flag, so the trap remains open for all new code.

**Fix:** read-only components use `resolveInitiativeStageContract` —
`src/services/contracts/initiative.ts:65`, pure `contractRead`, returns
`InitiativeStageContract | null`, deploys nothing. Find current correct consumers to copy
with `grep -rln resolveInitiativeStageContract src` (the verified list is maintained in
**gloki-frontend-architecture**). Rule of thumb: **useFlowContract = provision + own;
resolve\* = read.**

**Incident:** S11 (2026-07-01) — `VotePreview`, built as a pre-gate read-only preview,
silently deployed contracts on view and was rewritten onto
`resolveInitiativeStageContract`. Architecture detail: **gloki-frontend-architecture**.

## 10. Returning user stuck at /welcome

**Symptom:** a user who completed onboarding is redirected to `/welcome` on every visit to
`/`.

**First check:**

```bash
sed -n '55,66p' src/App.tsx
```

**Root cause (historical, FIXED at HEAD):** the old `isFirstRun` checked localStorage key
`gloki.onboarding.completed` — **which nothing ever wrote** — so every returning user was
"first-run" forever. The fix (comment-documented at `App.tsx:55-65`) reads the onboarding
agent store's canonical `gloki.onboarding` key via `getAgent()`/`getProgress().completed`.

**Fix if it recurs:** someone reintroduced a read of a key the onboarding flow doesn't
write. Verify the write side and the read side name the SAME localStorage key
(`gloki.onboarding`), and keep the private-mode `catch → false` fallback (localStorage
blocked must NOT strand users at /welcome).

**Incident:** found in Batch 8 (2026-06-09) — a read-of-never-written-key bug invisible to
tsc, found only by tracing the key's writer.

## 11. Phantom git states / I/O stalls on the USB drive

**Symptom:** `git status`/`git diff` disagree with reality; `git log` output truncated;
refs look momentarily wrong; all file I/O freezes for minutes.

**First check:**

```bash
git update-index -q --refresh && git status -sb
```

**Root cause:** the repo lives on a slow external USB drive that is flaky under parallel
I/O; git's stat cache goes stale and output can truncate mid-stall. This is the
environment, not repo corruption — never "repair" the repo for these symptoms.

**Fix:** `git update-index -q --refresh`; trust `git rev-parse HEAD` and `gh` (server-side
truth) over long local `git log` output during a stall. The full operating discipline
(sequential I/O batches, no node_modules/dist scans, sequential subagents, `._*` files) and
the May-2026 incident are homed in **gloki-build-env-run**.

## 12. Focus lost after a deep link

**Symptom:** arriving via a deep link (e.g. `?initiative=` into a community feed), the
right card scrolls into view but keyboard focus silently drops to `<body>`.

**First check:** the working pattern to compare against:

```bash
sed -n '80,92p' src/components/community/CommunityHome.tsx
```

**Root cause:** the deep-linked card REMOUNTS when its stage resolves asynchronously —
`contractRead get_stage` swaps the default 'problem' card for the real `*ActivityCard` —
and a remount destroys whatever inner button held focus.

**Fix:** focus the STABLE wrapper element (`tabIndex={-1}` div with `preventScroll: true`
after `scrollIntoView`), never an inner control; the wrapper survives the swap. Secondary
trap from the same incident: the focus `useEffect` must sit AFTER the `initiatives`
`useMemo` in source order or you hit a temporal-dead-zone error.

**Incident:** S10 (2026-06-30), deep-link scroll work; pattern now live (and
comment-documented) in `CommunityHome.tsx:80-91`.

## 13. aria-live region won't re-announce

**Symptom:** a polite live region announces "Comment posted" once; identical repeat
actions announce nothing (screen reader stays silent).

**First check:** the reference implementation:

```bash
sed -n '335,347p' src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx
```

**Root cause:** React (18+) batches state updates — a same-block `setStatus('')` followed
by `setStatus(msg)` coalesces into ONE DOM commit, so assistive tech sees no change when
`msg` equals the previous text and fires nothing.

**Fix:** reset to `''` synchronously (before any `await`), then set the message inside a
`setTimeout` (~60ms) — a separate macrotask forces a separate DOM commit, so AT re-fires
even for identical text. Keep the timer in a ref and clear it on unmount.

**Incident:** S9 (2026-06-30) a11y work; the pattern lives at
`ThreadedDiscussion.tsx:342-346` with the explanatory comment.

## 14. Simulated offline doesn't flip the UI

**Symptom:** in preview/DevTools, `window.dispatchEvent(new Event('offline'))` fires but
`useOnline` still reports online and `OfflineBanner` never shows.

**First check:** `useOnline` (`src/components/shared/connectivity/useOnline.ts`) reads
`navigator.onLine` via `useSyncExternalStore` — the event only tells it to re-read; the
synthetic event does NOT change the getter's value.

**Fix (preview/eval):**

```js
Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
window.dispatchEvent(new Event('offline'));
```

The override RESETS on page reload — re-apply after any navigation that reloads. To
restore: redefine with `get: () => true` and dispatch `'online'`.

**Incident:** S14 (2026-07-01) offline-anchor verification — dispatching the bare event
looked like a broken hook until the getter override was identified. More preview-eval
lore: **gloki-verification-and-qa**.

## 15. `rg a && rg b` masking existing keys

**Symptom:** a chained existence check like
`rg "'key.one'" src/i18n/fr.ts && rg "'key.one'" src/i18n/sw.ts` reports nothing, so the
key "doesn't exist" — but it does, in the second file.

**Root cause:** `&&` short-circuits — if the first `rg` finds no match it exits non-zero
and the second never runs, and a match found only by the second command is also invisible
when the first fails. Either way you conclude "missing" from a command that never looked
everywhere.

**Fix:** one multi-file invocation, or `;` instead of `&&`:

```bash
grep -n "'key.one'" src/i18n/fr.ts src/i18n/sw.ts   # one command, both files, per-file hits
```

**Incident:** Batch 12 (2026-06) — chained rg checks masked existing i18n keys during
parity work. Same session's env quirk, kept for the record: that session's Bash tool
stdout redacted some identifiers (printed `l`/`n`/`no`); the Read tool and `preview_eval`
were clean — when Bash output looks impossibly mangled, cross-check with Read before
concluding anything. i18n parity tooling itself: **gloki-i18n-playbook**.

## 16. `[FlowContract]` — the diagnostic handle for flow provisioning

Every deploy/join/registration step in `useFlowContract`
(`src/components/collaboration/flows/shared/useFlowContract.ts`) logs with the
`[FlowContract]` prefix. When any flow is stuck "Setting up…", errored, or behaving oddly,
**filter the browser console for `FlowContract` first** — the log line usually names the
failure directly:

| Log line (abbrev.) | Meaning |
|---|---|
| `Clearing stale deploying flag for <id>` | recovery from an interrupted previous mount — benign |
| `Deploying <name> for <id>...` | per-user mode deploy started |
| `Setting up shared <name> ... (parent: <id>, stage: <key>)` | shared-mode provisioning started |
| `TIMEOUT: ... did not complete within 30s` | deploy/setup hit `DEPLOY_TIMEOUT_MS` — retry available via the hook's `retry()` |
| `Parent <id> does not expose get_stage_contract` | entry 8 — pre-registry community |
| `Registration rejected` / `Registration missing contractId ... Old community?` | entry 8 |
| `ERROR deploying ...` / `ERROR setting up shared contract` | real failure — read the attached error object |

Verify the prefix still exists after any refactor:

```bash
grep -c "\[FlowContract\]" src/components/collaboration/flows/shared/useFlowContract.ts   # 10 at HEAD
```

---

## When NOT to use this skill

| You actually need to… | Use instead |
|---|---|
| Understand seam mechanics, DEMO_VERSION policy, fixtures/seeding in depth | **gloki-seam-and-demo-data** |
| Run/build/deploy, recreate the environment, base paths, drive discipline detail | **gloki-build-env-run** |
| Write or modify a Python contract / demo stub handler | **gloki-python-contracts** |
| Navigate the app structure, flows, Redux, routing | **gloki-frontend-architecture** |
| Verify a fix (preview automation, evidence standards, review tiers) | **gloki-verification-and-qa** |
| Read the full history of an incident, revert, or settled battle | **gloki-failure-archaeology** |
| Fix i18n parity / translation tooling failures | **gloki-i18n-playbook** |
| Decide whether a change is even allowed (push gates, locked decisions) | **gloki-change-control** |
| Debug a genuinely novel bug not in the table above | `superpowers:systematic-debugging` |

## Provenance and maintenance

All file paths, line numbers, log strings, and commands verified 2026-07-02 @ commit
`c26cdc4` (branch `ui`). Incident narratives are from project memory (sessions/batches
Apr–Jul 2026) as dated in each entry; they are historical record, not re-runnable.

Volatile facts — re-verify before relying on them:

| Fact (as of 2026-07-02) | Re-verify with |
|---|---|
| `DEMO_VERSION = 'global-v16'` @ `mockApi.ts:17` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| PR #20 open + CONFLICTING, checks green | `gh pr view 20 --json mergeable,state && gh pr checks 20` |
| Deploy workflow: push to `ui`, Node 22, `build:prod` | `grep -n "branches\|node-version\|build:prod" .github/workflows/deploy.yml` |
| Live site responds 200 | `curl -s -o /dev/null -w '%{http_code}' https://young-world-federalists.github.io/gloki-engage/` |
| `resolveInitiativeStageContract` @ `initiative.ts:65` | `grep -n "export async function resolveInitiativeStageContract" src/services/contracts/initiative.ts` |
| Error copy + `[FlowContract]` logs in `useFlowContract.ts` | `grep -n "available on this community\|\[FlowContract\]" src/components/collaboration/flows/shared/useFlowContract.ts` |
| `isFirstRun` fix @ `App.tsx:55` | `grep -n "isFirstRun" src/App.tsx` |
| aria-live pattern @ `ThreadedDiscussion.tsx:342-346` | `grep -n "separate commit" src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` |
| Deep-link focus pattern @ `CommunityHome.tsx:80-91` | `grep -n "Focus the stable wrapper" src/components/community/CommunityHome.tsx` |
| Demo localStorage keys (`gloki_demo_contracts` / `_state_` / `_seeded_`) | `grep -rn "gloki_demo" src/services/demo/demoRegistry.ts src/services/demo/demoState.ts src/services/demo/seedDemoCommunity.ts` |

Line numbers drift; the grep commands above are the durable pointers. If a table entry's
premise stops reproducing (e.g. the demo layer starts emitting events, or PR #20 finally
closes), update the entry rather than deleting it — note the date it stopped being true.
