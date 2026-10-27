<!-- Draft body for the second integration PR: integration/ui-2026-10b → server-side.
     Open only after PR #24 has merged, and only with Eston's go. Title:
     "Bring ui (S42–S45) onto server-side" -->

## What this is

A merge of `ui` into `server-side`: the 35 commits after PR #24. That covers the beta trim behind `VITE_APP_MODE=beta` (doors page, save-your-key and account-kind steps, one shared forum; S42), forum bylines and the critique fixes (S43), the S44 docs, and S45's `CommunityView` hooks fix and dependency audit (`react-router-dom` 7.18.4, DOMPurify 3.4.17, `express`/`cors` moved to `devDependencies`, `npm audit --omit=dev` 0). It adds `dev:beta` / `build:beta` scripts. Nothing changes for the demo build.

Branched from #24's head (`7811117`), so with #24 merged the diff here is S42–S45 alone. Merge commit `a4bf7fa`, no rebase, no history rewritten on `server-side`. **Your server wiring is kept in every conflict**, and ui's additions are re-applied on top.

## The six conflicts and how each was resolved

| File | Your side | ui's side | Resolution |
|---|---|---|---|
| `src/App.tsx` | `RootRoute` waits for `digitalAgentProfileChecked`, routes on `digitalAgentProfile` | beta: local `isFirstRun()` → `/welcome` or `/forum` | Your check for both modes; in the beta an onboarded visitor goes to `/forum`. All hooks before the first return |
| `src/components/onboarding/OnboardingFlow.tsx` | in-memory step index, invite/direct step lists, `saveDigitalAgentProfile`, mount-time `alreadyOnboarded` | beta step list + `BackupStep` / `KindStep`, built on local progress and `consentedAt` | Your state model; the beta list sits beside your two. No local progress or `consentedAt` |
| `src/components/identity/Profile.tsx` | edits through `saveDigitalAgentProfile` | account-kind picker | Your contract write, plus `accountKind` to the local cache |
| `src/components/identity/agent/digitalAgentStore.ts` | identity-scoped trust-graph cache | `accountKind` field | Your store plus `accountKind`, persisted beside `vouchedBy` / `invitedBy` / `vouchMeta` |
| `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` | demo-only refetch after delete | confirm before deleting a forum post | Both |
| `package-lock.json` | — | S45 dependency moves | `package.json` is identical to ui's, so ui's lockfile (`npm install` leaves it unchanged) |

## Verification

Full record with screenshots and the scripts: `docs/reviews/2026-10-integration-b/README.md`.

- `npm run build`, `build:beta`, `build:prod`: clean. `npm audit --omit=dev`: 0.
- `npx eslint src`: 52 errors, **none new**. Every (file, rule) pair exists on `ui` or on #24's head, and no count is above both.
- i18n parity `PARITY OK` (fr = sw = 1511); design-system grep gates clean.
- Walks at 360×800, light + dark, against a stub node that speaks your login and profile wire (bare-boolean `is_exist_agent`, `get_contracts`, ack ids echoed on SSE, `set_profile` / `get_profile`):
  - **demo**: 17 routes per theme;
  - **demo onboarding**: direct and `?invite=`;
  - **beta**: doors → create key → save key → account kind → profile → forum post → returning visit → profile reload.

  0 console errors, 0 page errors, 0 failed requests, one `h1` per page, no horizontal overflow. The beta sign-up wrote `register_agent` → `deploy_contract` → `set_profile` → `get_profile` on the stub.
- **Not done: the real-node walk.** `gdi.gloki.contact` isn't reachable from the environment this was built in. Beta sign-up against a live node, and the forum against a real discussion contract, still need a run. If anyone can do that, please say so here.

## Things noticed, not changed

1. **`accountKind` has no slot in `digital_agent_contract.py`.** `set_profile(display_name, photo, country, languages)` can't carry it, so it lives in your scoped local cache for now and is lost on another device. Options are in the S46 note in `docs/FOR_OURI_seam.md`. A separate `set_account_kind(kind)` is safer than a new `set_profile` argument, because existing profile contracts would reject the extra argument.
2. **The forum seam is still the demo stub.** `getForumContractId()` and `getForumParticipants()` in `src/services/forum.ts` return the seeded `demo-forum-beta`. The S42/S43 seam addenda describe what the real layer returns; no new contract methods.
3. Pre-existing: the beta's "Your key" screen (LoginPage inside the doors page) has no `<main>` landmark.
4. Carried from #24: the community-list filter, `isDemoContract` in components, and the `docs/contracts/` patches.

## Merge plan

Merging this triggers the GitHub Pages deploy of the **demo** build; the workflow doesn't build the beta. If there's no objection by **[date]**, Eston merges it.
