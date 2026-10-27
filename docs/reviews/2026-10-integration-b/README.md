# Integration walk — `ui` (S42–S45) → `server-side`, 2026-10-27

Evidence for `integration/ui-2026-10b` (merge commit `a4bf7fa`), the second integration PR. Branched
from PR #24's head `7811117`, so its diff against `server-side` shows S42–S45 alone once #24 merges.
`git merge origin/ui` at `5469cc4`: 35 commits, 42 `src` files on the ui side.

## Conflicts and how each was resolved

Ouri's server wiring wins in every conflict, and the ui work is re-applied on top.

| File | `server-side` (via #24) | `ui` (S42–S43) | Resolution |
|---|---|---|---|
| `src/App.tsx` | `RootRoute` waits for `digitalAgentProfileChecked`, then routes on the real `digitalAgentProfile`; local `isFirstRun()` removed | beta: `isFirstRun() ? /welcome : /forum`, ahead of every other check | Ouri's check for both modes. In the beta an onboarded visitor goes to `/forum`, and the organization redirect is demo-only (as on `ui`). All hooks run before the first return |
| `src/components/onboarding/OnboardingFlow.tsx` (+ review fix, finding 4) | in-memory step index, invite vs direct step lists, `submitProfile` → `saveDigitalAgentProfile`, mount-time `alreadyOnboarded`, in-memory consent | beta step list (`backup`, `kind`, `agent`, `ready`), `BackupStep` / `KindStep`, `/forum` exits, `onVerify`; built on local `progress` / `consentedAt` | Ouri's state model. The beta list is a third step list beside his two, `STEP_LABELS` gains `backup` / `kind`, and the beta skips the vouch seed. `consented` is `isBeta \|\| <his in-memory flag>`. No `saveProgress` calls remain |
| `src/components/identity/Profile.tsx` | edits written through `saveDigitalAgentProfile` | account-kind picker, `saveAgent({... accountKind})` | Ouri's contract write for the profile fields; `accountKind` saved to the local cache beside it |
| `src/components/identity/agent/digitalAgentStore.ts` | identity-scoped trust-graph cache; `consentedAt` removed | `accountKind` field (and the old `consentedAt`) | Ouri's store plus `accountKind`, persisted with `vouchedBy` / `invitedBy` / `vouchMeta`. `consentedAt` stays removed. `useDigitalAgent.ts` (no conflict) surfaces `accountKind` |
| `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` | demo-only refetch after `deleteComment` | S43 confirm before deleting a forum post | Both: the confirm, then Ouri's `isDemoContract` refetch rule |
| `package-lock.json` | — | S45 dependency moves | `package.json` merged clean and is byte-identical to `ui`'s, so `ui`'s lockfile, confirmed by `npm install` producing no diff. (Regenerating from the `server-side` lock instead left DOMPurify at 3.4.14, undoing S45's advisory fix.) |

**Why `accountKind` is local.** `digital_agent_contract.py`'s `set_profile(display_name, photo,
country, languages)` has no slot for it, and contracts are Ouri's. The S42 seam addendum assumed the
community-profile `set_values` shape. `docs/FOR_OURI_seam.md` now carries an S46 note with the two
options (a separate `set_account_kind` is the safer one).

## What was checked

| Gate | Result |
|---|---|
| `npm ci && npm run build && npm run build:beta && npm run build:prod` | all clean |
| `npx eslint src` | 52 errors / 6 warnings. **No new (file, rule) pair** vs `ui` (44) or the #24 head (56), and no pair's count above both parents. Gone vs `ui`: `StageFeedView.tsx` `react-refresh/only-export-components` (as in #24) |
| i18n parity scanner | `RESULT: PARITY OK`, fr = sw = 1511 |
| `grep-gates.sh` | all three clean |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Conflict markers | none |

## Walks (360×800, light and dark, Chromium via Playwright)

Both builds served with `vite preview --mode production` at `/gloki-engage/`. The node was
`scripts/node-stub.cjs`, a stateful stub of the wire the `server-side` login and profile path
uses: bare-boolean `is_exist_agent`, `register_agent`, `get_contracts`, `deploy_contract` /
`contract_write` returning ack ids echoed on SSE `/stream`, and `get_profile` / `set_profile`.
Agent `'a'×64` starts with a profile; every other key starts empty.

**Demo** (`scripts/demo-walk.cjs`, the S45 route walk adapted): 17 steps per theme. Home, the
Problem feed, Communities, a demo community and its members / chat / currency / collab, back
navigation, an initiative's Causes, the published mandate, a 404, Profile. **0 console errors,
0 page errors, 0 failed requests, one `h1` per page, no horizontal overflow.** Two adaptations,
neither an app change: the demo community is reached by its id from the mock registry, because
`server-side` lists only `gloki_engage_community_contract.py` communities (#24 finding 1); and the
script strips the `/gloki-engage` base before reusing `location.pathname`. `/stage/discussion` →
`/stage/problem` and initiative dashboard → community feed are the existing redirects (Unit 5,
`26ec615`).

**Demo onboarding** (`scripts/demo-onboard.cjs`, fresh keys): direct entry walks profile → rules
→ ready; `?invite=AMARA` walks all six steps. After agreeing, Ready shows no consent nudge, and `/`
then lands on Home because the stub now holds the profile. 0 errors.

**Beta** (`scripts/beta-walk.cjs`, `VITE_APP_MODE=beta` build), per theme: doors → "Join as a
person" → own server → Create my key → Save your key → account kind (Person preselected from the
door) → profile (name + Kenya) → Ready → Open the forum → post → `/` again → Profile → reload.
**0 console errors, 0 page errors, 0 failed requests, no overflow, one `h1` per page.** On the
stub the sign-up wrote `register_agent` → `deploy_contract` → `set_profile {display_name, photo,
country: "KE", languages: ["en"]}` → `get_profile`. The post appears immediately. The persona's
welcome post carries its flag and name, and the walker's own post reads "You", which is `ui`'s
design (`ThreadedDiscussion.tsx`). A returning visitor at `/` goes straight to `/forum`. Profile
shows the name (from `get_profile`) and "Person" (local cache), before and after a reload.

Screenshots: `shots/{light,dark}/*.png` (`beta-*` for the beta). Machine record: `walk-summary.json`.

## Findings

1. **`accountKind` isn't on the wire yet** (above). It is lost if the same key signs in on another
   device. Ouri's decision; the S46 seam note gives the options.
2. **Pre-existing on `ui`, not changed:** the beta's "Your key" screen (LoginPage inside the
   doors page) renders no `<main>` landmark. The other 10 beta screens have one. `LoginPage.tsx`
   is identical to `ui`.
3. **Not done: the real-node walk.** `gdi.gloki.contact` is refused by this container's egress
   proxy, as for #24. Sign-up → profile deploy → `set_profile` on the live SSE stream, and the
   forum against a real discussion contract (`getForumContractId` / `getForumParticipants` are
   still the demo stub), need a run from a machine that can reach a node.
4. **Fixed after review: "Start over" on the done card did nothing.** It only reset the step index
   while the mount-time `alreadyOnboarded` stayed true (as on `server-side`; `ui`'s version
   worked). It now clears that flag too. Checked in the demo build: an onboarded user at `/welcome`
   taps Start over and lands on "Create your profile", 0 errors.
5. **Fixed after review (Eston, 2026-10-27, "decide"): "Skip for now" removed from the profile
   step, both builds.** On this branch "onboarded" means a profile contract exists, and Skip was
   the one path that wrote none, so a skipper was sent from `/` to `/welcome` (the Key step in the
   beta) on every later sign-in. On `ui`, Ready had marked onboarding complete. The demo had the
   same loop from `server-side`. The form needs a name and a country, which the forum bylines
   need anyway. With Skip gone, the lone "Back" on demo direct entry (no handler on the first
   step) is hidden too. Rerun after the change: beta walk and demo onboarding 0 errors; no Skip on
   either build's profile step. A failed `set_profile` still reaches the user only as a console
   error; that one stays open.
6. **Plausible, not reproduced (from `server-side`):** `alreadyOnboarded` is captured on mount,
   before `fetchContracts` answers, so a hard load of `/welcome` by an onboarded user could show
   the flow instead of the done card. Against the stub it showed the done card; a slow node may
   not. No duplicate contract either way, since the contract id is loaded by the agent step.
7. Carried from #24, unchanged: the community-list filter (finding 1 there), `isDemoContract`
   imported into components, and the `docs/contracts/` patches still on Ouri's side.

## Repro

```bash
node docs/reviews/2026-10-integration-b/scripts/node-stub.cjs 3011 &
npm run build:prod && cp -r dist /tmp/dist-demo
npm run build:beta && cp -r dist /tmp/dist-beta
node node_modules/vite/bin/vite.js preview --mode production --outDir /tmp/dist-demo --port 4173 --strictPort &
node node_modules/vite/bin/vite.js preview --mode production --outDir /tmp/dist-beta --port 4174 --strictPort &
mkdir -p shots/light shots/dark
SHOTS=shots node docs/reviews/2026-10-integration-b/scripts/demo-walk.cjs http://localhost:4173/gloki-engage
SHOTS=shots node docs/reviews/2026-10-integration-b/scripts/beta-walk.cjs
node docs/reviews/2026-10-integration-b/scripts/demo-onboard.cjs
```
