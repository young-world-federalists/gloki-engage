# Session 40 — Re-ground the next roadmap slice

## Context recap (as of 2026-09-16, local `ui` at S39, not pushed)

S36–S39 built all four planned community-verification waves. S39 added the owner-scoped notification
centre and bell at `/identity/notifications`, with seven event families and tab-lifetime W1–W3 runtime
producers. The last local reviewed S39 commit is `289863c`; S38 and S39 are still ahead of cached
`origin/ui` and must not be pushed without Eston's explicit gate.

P11 still lists one deliberately deferred W2 follow-up: “Schedule for later.” S39 did **not** make
that promise honest. The centre can display an invite, but the demo still has no real availability
matching and no delivery after reload, tab close or account change. The approved S39 design therefore
kept the old 7×12 availability grid out of scope.

This session starts by choosing the next coherent roadmap slice from verified reality. Do not assume
the deferred schedule grid is automatically next merely because W4 now exists.

## Re-verify these premises vs HEAD

Every claim below can go stale. Check it before recommending work:

- Compare local `ui`, cached `origin/ui` and `git status`; enumerate every commit after `ac8523b`.
  Confirm whether Eston has since authorized a push or Ouri has moved the integration baseline.
- Confirm S39's latest reviewed commit and rerun the notification gates. Expect the nested centre,
  seven types, exact owner-scope selectors, stable producer ids, fr/sw parity 1449/1449 and
  `DEMO_VERSION = 'global-v19'`.
- Search for `AvailabilityGrid`, “Schedule for later,” availability persistence and any server-side
  scheduler before describing the W2 follow-up as absent or feasible.
- Re-read P11 plus every open/deferred item in `MASTER_TODO.md` §7. In particular, verify the status
  of the unreachable `/…/collaboration` route, conviction time accrual, P7's deferred kit tail,
  post-handoff D3/locales/offline work, and P9's “looks AI-generated” marker against the actual files.
- Confirm whether the `/…/collaboration` route remains unreachable and whether accepted merges have
  any product door besides direct URL entry; S39 only made their resulting notification useful.
- Treat native French/Swahili review and Ouri's `ui` → `server-side` integration as coordination work,
  not implementation work to claim locally.

## Read first

1. `CLAUDE.md`, `MASTER_TODO.md` §7 and the project change-control/session-lifecycle/QA skills.
2. `docs/superpowers/specs/2026-09-10-s39-notification-centre-design.md`, especially “Fixtures,
   versioning and deferred scheduling.”
3. `docs/superpowers/specs/2026-09-07-s37-verification-w2-design.md` E4 and its deferred-work section.
4. `docs/FOR_OURI_seam.md` S36–S39 addenda.
5. `docs/ai-look-audit-2026-08-05.md` before trusting P9 W4's in-progress marker.

## Session goal

Produce a corrected, evidence-backed shortlist for the next build and lock Eston's choice before
writing a feature spec or implementation plan. Prefer one coherent product gap over a mixed cleanup
bundle. For each viable candidate, report reachability, user value against the two north stars,
backend/seam dependencies, truthful demo limits, i18n/fixture impact and verification cost.

The initial candidates to re-ground are:

1. **P11 W2 scheduling follow-up.** Recommend only if a truthful lifetime and delivery model now
   exists. Do not resurrect 84 time toggles merely because the centre can render a row.
2. **Cross-initiative collaboration reachability.** Decide whether to expose or retire the existing
   collaboration route; inspect the full flow before assuming it is production-ready.
3. **Conviction time accrual.** This is a mechanism/results change, not UI polish; identify the exact
   product ruling and server coordination it would require.
4. **A verified deferred tail from P7/post-handoff.** Consider only after confirming the higher-value
   product gaps above are blocked or intentionally parked.

## Workflow and constraints

- Re-ground first, then recommend-and-confirm. Eston chooses the slice.
- If the chosen work is product behavior, write and commit a design spec and implementation plan
  before feature code. If the outcome is “keep deferred,” update the roadmap with the reason instead
  of manufacturing work.
- Preserve D8 platform-wide verification, D9 nested identity routing, 1p1v and the `ui` →
  `server-side` ownership boundary.
- Do not invent notification, daily-session, availability or scheduling contract methods. Route any
  real transport/auth requirement into the FOR_OURI seam with explicit coordination notes.
- Do not change fixtures or bump `DEMO_VERSION` unless the selected design genuinely changes seed
  data. Keep English inline fallbacks and fr/sw parity for every changed user-facing string.
- Run the local multi-model review panel or push only after separate explicit authorization.

## Kickoff

Re-verify the premises and present the corrected shortlist with one recommendation. Stop for Eston's
choice before turning any candidate into Session 40 build scope.
