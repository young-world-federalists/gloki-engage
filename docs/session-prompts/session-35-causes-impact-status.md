# Session 35 — Prompt 1: Causes forum · discussion status pill · impact assessment

**Context recap (as of 2026-09-02, `ui` @ `101e4a3`).** S34 reviewed Ouri's `server-side` deploy
and produced a design for two prompts. The design's eleven product decisions (plus D12 and ten
framing rulings) were argued by three Sonnet advocates and ruled by an Opus judge at Eston's
request. This session BUILDS Prompt 1, wave by wave, from the executable plan.

## Read first

1. `docs/superpowers/plans/2026-09-02-prompt1-causes-impact-status.md` — the plan (15 tasks, W0→W4). Execute it with `superpowers:subagent-driven-development` (subagents SEQUENTIAL; controller drives the one preview).
2. `docs/superpowers/specs/2026-09-02-s34-decision-record.md` — the rulings (cite Dn/Fn in commits).
3. `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §1–§2, §4.
4. Skills: `gloki-change-control`, `gloki-session-lifecycle`, `gloki-seam-and-demo-data`, `gloki-python-contracts`, `gloki-i18n-playbook`.

## Re-verify these premises vs HEAD (they WILL rot)

- `git fetch && git log --oneline ui..origin/ui` — has Ouri pushed anything to `ui` since `101e4a3`? Rebase before starting.
- `git log --oneline origin/server-side | head` — has Ouri changed `gloki_engage_initiative_contract.py` again? Re-diff against `docs/contracts/s34-initiative-contract-additions.py` (Task 3) so the patch still applies; `Storage('comment_votes')` and `Storage('impact_assessments')` must still be free names.
- `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` → expected `'global-v17'` (Task 12 bumps to v18).
- `grep -n "parentId" src/services/demo/demoContracts/discussion.ts` → the `add_comment` handler still reads `values.parentId` (Task 2 fixes it) — if Ouri already fixed it, skip that step.
- `grep -rn "get_roles" src/services/demo/demoContracts/initiative.ts` → still absent (Task 2 adds it).
- `ls src/assets/contracts/` on `ui` → still only `community_contract.py`, `funding_flow_contract.py` (the real initiative contract lives on `server-side`; do NOT copy it onto `ui`).
- `grep -n "isDemoContract" src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` → absent on `ui` HEAD (present on `server-side`); Task 6 Step 3 branches on this.
- `.github/workflows/deploy.yml` triggers on `server-side` → Rule 1 wording in CLAUDE.md/skills is stale until Task 1 lands.
- Eston's answer on D2 (sample-content fallback): the plan lists it as optional Task 16; ask before building it.

## Workflow + constraints

- Docs-first: Tasks 1–3 are docs/chore commits before any `feat(s35)`.
- Every wave ends with `npx tsc -b && npm run build` clean, the fr/sw parity script clean, and a controller preview walk at 360px light + dark.
- Opus whole-branch review before proposing the push; **never push without Eston's explicit go**. A push to `ui` does not deploy; Ouri merges `ui` → `server-side`.
- Hand Ouri `docs/contracts/s34-initiative-contract-additions.py` + the FOR_OURI S35 addendum when W1 lands, so the real contract grows the same methods.

## Open decisions still Eston's

- D2 (restore the demo fallback on Home/stage feeds): ruled "restore" by the judge, but it touches Ouri's fresh code — confirm before Task 16.
- Whether to alias `/causes` later (ruled no for S35).

## Kickoff

Start with Task 1 of the plan. Report after each wave with the commit range, what the preview walk showed, and any premise that turned out stale.
