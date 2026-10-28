# Session 36 — Prompt 2 Wave 1: Community verification

**Context recap (as of 2026-09-06, `ui` @ `03d6f5d`, pushed).** S35 built Prompt 1 in full (W0→W4 —
Causes forum, the five-band discussion status pill, required cause alignment on new solutions,
and impact assessment) from the S34 decision record, plus a same-day 8-commit final-review fix
wave (A–H) applying the whole-branch review findings, and a further nine-commit adversarial-panel
(R3 judge) MUST fix wave — `101e4a3..03d6f5d`, 49 commits total. Per-task
subagent review ran clean throughout (one Important caught and fixed at task 14); the
whole-branch Opus review, an adversarial three-reviewer Opus panel, and Eston's push gate all ran
before it shipped. **Push state: PUSHED to `origin/ui` 2026-09-06 (`03d6f5d`); nothing is
outstanding locally.** Per **D11**, a push to `ui` does not deploy on its own — confirmed after
this push, when no workflow run fired; deploy
happens only when Ouri merges `ui` → `server-side`, so pushing S35 and getting it live are two
separate asks of two different people.

This session builds **Prompt 2 Wave 1 only** — the verification hub, request, approve and invite
screens. Waves 2–4 (call, daily session, notification centre) are separate future sessions per
**F9**'s sequencing ruling; do not start them here.

## Read first

1. `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3
   (Community verification system) — read the whole section; it reconciles the original
   greenfield-app prompt with this codebase's laws (SCSS kit, `AppHeader`/`StageFooter`, seam
   rule, `IdentityView` route nesting) and defines the Wave 1 data model, kit additions and the
   `src/services/verification.ts` seam surface. §3.3 lists all four waves — Wave 1's screens
   (Hub, PathwayCards, ApprovalHistory, InvitePage, RequestPage, ApprovePage) are your scope.
2. `docs/superpowers/specs/2026-09-02-s34-decision-record.md` — **D8** (verification is
   platform-wide on the Digital Agent, not per-community), **D9** (routes live inside
   `IdentityView`'s wildcard, no new top-level route), **F9** (Prompt 2 waits for Prompt 1 to be
   reviewed and pushed; only the shared-kit additions were allowed early, and S35 did not take
   that option — `Toast`/`ProgressBar segments` are still unbuilt), **F10** (low-bandwidth framing:
   every call/session entry point states the camera+data cost before commitment; non-video
   pathways ordered first on `PathwayCards`).
3. `docs/FOR_OURI_seam.md` — read the whole file once (it is short) and specifically the **S35
   addendum** (Causes/status/impact assessment methods) so you don't duplicate its format; Wave 1
   adds its own new section for the vouch methods (`request_vouch`, `vouch`, `decline_vouch`,
   `get_vouches`) that Ouri's `digital_agent_contract.py` / `gloki_engage_community_contract.py`
   do not yet have.
4. Skills: `gloki-change-control`, `gloki-session-lifecycle`, `gloki-seam-and-demo-data`,
   `gloki-i18n-playbook`, `gloki-governance-domain` (trust/verification model), `gloki-ui-review-campaign`
   (kit additions — `Toast` doesn't exist yet, per §3.2).

## Re-verify these premises vs HEAD (S10–S35 lesson — prompts go stale between sessions)

- `git log --oneline origin/ui..ui | wc -l` → expect **0**: S35 was pushed on 2026-09-06. Anything
  above 0 is work committed after this prompt was written — read it before trusting the premises
  below.
- `git log --oneline origin/server-side | head -3` → has Ouri merged `ui` → `server-side` yet? If he
  has, the S35 features are live and `docs/contracts/s34-initiative-contract-additions.py` should
  have been applied — verify with
  `git show origin/server-side:src/assets/contracts/gloki_engage_initiative_contract.py | grep -c comment_votes`
  (0 = not applied, so `vote_comment` is missing in production and the Causes UI writes into a
  method that does not exist).
- `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` → expect `'global-v18'`. Wave 1 seeds
  30 verification-fixture members and picks the next `DEMO_VERSION` value when it ships.
- `grep -rn "export function eligibleAssessors" src/utils/writerRank.ts` → should still exist
  (S35 W4); confirms S35 landed and `writerRank`'s tie-break contract (F7) is available if Wave 1
  needs a "top writers" style list anywhere.
- `grep -rln "DiscussionStatusPill" src` → should list `InitiativeStageCard.tsx`,
  `DiscussionPill.tsx`, `DiscussionStatusPill.tsx`, `TopCausesPanel.tsx`, `StageFeedView.tsx` (S35
  W2). Unrelated to Wave 1's own work, but confirms the branch state this prompt assumes.
- `ls docs/contracts/s34-initiative-contract-additions.py` → should exist (the S35 patch handed to
  Ouri: `vote_comment`, `get_comment_votes`, `add_proposal.cause_id`, `add_impact_assessment`,
  `get_impact_assessments`).
- `git show origin/server-side:src/assets/contracts/gloki_engage_initiative_contract.py | grep -c
  "comment_votes\|impact_assessments"` → was **0** at S35 close (patch not yet applied by Ouri).
  If nonzero now, Ouri has merged the S35 patch — re-check `Storage('comment_votes')` and
  `Storage('impact_assessments')` are still the composite-keyed names in use (F1) before assuming
  anything about the vouch methods' naming.
- `grep -n "branches:" .github/workflows/deploy.yml` → expect `[server-side]` (D11; confirms the
  deploy-branch doc correction from S35 W0 is still accurate).
- `sed -n '1,73p' src/components/shared/NotificationsBell.tsx` → still renders only the
  `merge_absorbed` type with no verification-related `NotificationType`s; still effectively empty
  in practice (the P9 follow-up, dissented against in **D10**: "the permanently-empty
  `NotificationsBell` defect stays live until Prompt 2 Wave 4"). Wave 1 does **not** fix this —
  that's Wave 4's job (spec §3.3) — but don't be surprised the bell does nothing yet.
- `grep -n "VERIFIED_THRESHOLD" src/services/trustModel.ts` → expect `= 4` (D8's "4 approvals" is
  this exact constant); `grep -n "vouchedBy" src/services/trust.ts` → expect `getAgent()?.vouchedBy`
  / `saveAgent({ vouchedBy: ... })` unchanged. Wave 1 extends `addUserVouch` with `{method, at}` —
  confirm that function's current signature before extending it.
- `grep -n "'nav.discussion'" src/i18n/en.ts` → expect `'Discuss'` still, i.e. the D3 rename never
  touched the bottom-nav label (flagged, not fixed, in the S35 i18n packet section) — unrelated to
  Wave 1 but a live open item, listed below.

## Workflow + constraints (same discipline as S1–S35)

- Docs-first where applicable: any new seam method goes into `FOR_OURI_seam.md` in the **same
  commit** as the code that calls it, not retrofitted later (S35's own learning, recorded in
  MASTER_TODO §8).
- Build via `superpowers:subagent-driven-development`: subagents run **sequentially**, the
  controller drives the one shared preview.
- Every task/wave ends with `npx tsc -b && npm run build` clean, the fr/sw parity script clean
  (`node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`), and a controller
  preview walk at 360px light + dark.
- Seam rule: components never own mock data or timers; `src/services/verification.ts` is the only
  import components use, with delays inside the demo layer (per spec §3.1).
- Route-map freeze: everything lands inside `IdentityView`'s existing wildcard (D9) — no
  `App.tsx` route-map change for Wave 1.
- `Toast` does not exist in the kit yet (§3.2) — build it now since Wave 1's `RequestPage` needs
  the 2–5s simulated-outcome toast; do not ad-hoc a second live region (`OfflineBanner` already
  has one — read it first).
- i18n: every new/changed string appended to `docs/i18n-native-review-candidates.md` in the same
  session, per-key table format (see the S35 section for the current model).
- Bump `DEMO_VERSION` once, when the Wave 1 fixtures (30 members, pending requests, notifications,
  approval history) are seeded — not per-task.
- Opus whole-branch review before proposing a push; **never push without Eston's explicit go** —
  and confirm the S35 push question separately, since it's still open ahead of this session.
- The slow external drive: targeted `sed -n`/`grep -n`, no recursive greps beyond what's already
  quoted above.

## Open decisions still Eston's

1. **Whether/when to push S35** (`ui` is 38 commits ahead of `origin/ui`) — not this session's
   call, but Wave 1 builds on top of that state either way; ask before starting if it's still
   unresolved.
2. **D2 — sample-content fallback** (`useAllInitiatives` conditional demo fallback + persistent
   "Example activity" banner), ruled "restore" in the S34 decision record but never built —
   still filed as optional in the Prompt 1 plan (Task 16). Unrelated to Wave 1; raise only if
   Eston wants it folded in.
3. **`/causes` alias** — ruled no for S35 (D3); still no for now unless Eston reopens it.
4. **`nav.discussion` "Discuss" wording** — flagged in the S35 i18n packet as a possible follow-up
   for consistency with the header/pill "Causes" label, explicitly left unchanged pending a
   decision on whether the bottom nav should also read "Causes".

## Carried from the S35 adversarial panel (deferred, ship-as-is on `ui` today)

Three Opus reviewers (prosecutor · defender · judge) argued the S35 branch at `18b54c6`; the
judge's MUST list shipped in `935bcdb..e536880`. These are the items it ruled LATER — each is
real, each was verified, none blocks anything. Full argument:
`docs/superpowers/specs/2026-09-06-s35-panel-verdict.md`.

- **Status-pill width guard is a one-way latch.** `DiscussionStatusPill` measures overflow on the
  same element `.dotOnly` collapses to `1px`, so once the word hides it can never return. No
  one-line fix: measure an `aria-hidden`, never-collapsed clone instead. Trigger unproven (12-glyph
  Swahili vs `12ch`), failure benign (`clip` sr-only keeps the word for AT).
- **`aria-label` on role-less spans** — `ThreadedDiscussion.tsx` net-score readout and
  `TopCausesPanel.tsx`; ARIA prohibits naming `generic`, so AT reads a bare "+7". Same fix shape as
  the `Badge role="img"` change already shipped.
- **Silent refusals are seam-wide.** Ouri's real contract returns a bare `return` on *every*
  refusal (`like_comment`, `approve`, `request_expert_review`, …); `{error}` is a demo-stub
  convention the contract has never spoken. Decide the convention, give the stub stable codes +
  i18n keys, and state it once in `docs/FOR_OURI_seam.md`. Until then the S35 assessment form's
  error panel is demo-only.
- **Seeded showcase optic** — the viewer assesses `databroker` `p0` while their own `p3` carries a
  merge suggestion into `p0`. Permitted by D7 as ruled (no shared `causeId`), but it reads badly in
  a demo. Needs a fixture pass.
- **`toggleAriaLabel` changes after mount** when the status resolves, dropping the stage badge from
  the card's accessible name.
- **fr/sw register defects → the native-review packet, not a fix wave:** French gender on the three
  band adjectives inside "Discussion des causes : {word}"; `rédacteurs` → `contributeurs`; the
  Swahili `mizani ya kubadilishana` calque for "trade-offs"; French singular-for-zero on
  `causes.panel.solutions.one|many`.
- **The Causes page promises Solutions with no route there**, and `causes.none` has the same gap in
  reverse. Navigation change.
- **"Writers" and "driver" are undefined vocabulary.** Both translators independently un-metaphored
  "driver" (fr *facteur*, sw *sababu halisi*) — when both translations rewrite the source, the
  source is the string to fix. Decide the English first, then re-translate `impact.rung.*`,
  `causes.hint`, `causes.vote.up`/`.down` together.
- **`writeTogether.submittedNote`** (`DraftEditor.tsx`) is missing from both locales — pre-existing,
  off the S35 path.
- **"Add a solution" is disabled with only a `title`** while causes load, and `TopCausesPanel`
  renders nothing until loaded, so there is no on-screen loading state. `title` never fires on
  touch.
- **An expanded stage card shows the status word twice** (badge row + chin pill). Redundancy, not a
  law violation — the DESIGN_SYSTEM rule is scoped to the collapsed summary.

## Kickoff

Confirm the S35 push question with Eston first (premise #1 above). Once clear, start from spec
§3.1 — stand up `src/services/verification.ts` + the demo fixtures/state switcher, then build the
Wave 1 screens in the order spec §3.3 lists them (Hub → PathwayCards → ApprovalHistory →
RequestPage → ApprovePage → InvitePage), wiring `StageGate`'s "Get verified" link and
`IdentityTrust`'s demo button to the hub last. Report after each screen with the commit, what the
preview walk showed, and any premise above that turned out stale.
