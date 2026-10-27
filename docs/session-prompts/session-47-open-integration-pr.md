# Session 47 — open the S42–S45 PR, then H0 claims audit

Written 2026-10-27 at the end of S46. `origin/ui` is at `5469cc4` plus this closeout commit. The
second integration merge is built and verified on `integration/ui-2026-10b` (pushed as
`claude/quirky-keller-ionyfw`, head `f2463a9`); it waits for PR #24 to merge.

## What S46 did

- Merged `ui` (S42–S45, 35 commits) onto PR #24's head as `a4bf7fa`; Ouri's wiring kept in all six
  conflicts. Evidence, conflicts table and the PR body: `docs/reviews/2026-10-integration-b/`.
- Two `server-side` onboarding bugs found in review and fixed on that branch: "Start over" dead,
  and "Skip for now" looping a skipper back to `/welcome` (Skip removed, Eston's call).
- `accountKind` cannot ride `set_profile`; it stays in Ouri's local cache. S46 note in
  `docs/FOR_OURI_seam.md` with the two options.
- Order Eston agreed in S45, now: (3) S42–S45 PR — built, not opened; (4) H0 claims audit;
  (5) CSP + SRI; (6) human screen-reader / Android pass.

## Re-verify these premises vs HEAD before doing anything

- PR #24 (`integration/ui-2026-10` → `server-side`, head `7811117`) was open on 27 October with
  no review from Ouri; Eston planned to merge it on **30 October**. Check whether it merged, and
  whether `server-side` moved past `d930a9e` by anything other than that merge.
- `origin/claude/quirky-keller-ionyfw` is at `f2463a9` and contains `a4bf7fa`; nothing was
  pushed to it since. If `server-side` gained commits that #24 doesn't carry, merge
  `origin/server-side` into that branch first (merge commit, Ouri's side wins) and rerun the
  gates before opening the PR.
- `origin/ui` is this closeout on top of `5469cc4`; nothing after it.
- `npx eslint src` on the integration branch: 52 errors / 6 warnings; on `ui`: 44 / 7.
- The `set_profile` signature in `src/assets/contracts/digital_agent_contract.py` on `server-side`
  is still `(display_name, photo, country, languages)`; if Ouri added `account_kind`, the local
  cache in `digitalAgentStore.ts` can hand it over.

## The work

1. **Open the PR** (only with Eston's go, only after #24 merged): push the branch as
   `integration/ui-2026-10b`, base `server-side`, title "Bring ui (S42–S45) onto server-side",
   body from `docs/reviews/2026-10-integration-b/PR-draft.md` with the `[date]` filled in and
   item 3 kept as decided. Request Ouri's review. Note the real-node walk is still undone.
2. **H0 claims audit** (MASTER_TODO §7, P12): every user-facing "decentralized / secure / private /
   anonymous" string, with what the code at HEAD actually guarantees. Output is a table, then copy
   changes confirmed with Eston one by one. No cryptography, no new UI.
3. If time: the onboarding `set_profile` failure path. On `server-side` a failed profile write
   reaches the user only as `console.error` and leaves them in the `/welcome` loop. A visible
   error with a retry on the Ready step; design it against the integration branch, not `ui`.

## Read first

`CLAUDE.md`; MASTER_TODO §7 (Next build → P12, Blocked) and the S46 + S45 entries in §8;
`docs/reviews/2026-10-integration-b/README.md`; the S42 and S46 notes in `docs/FOR_OURI_seam.md`;
skills `gloki-session-lifecycle`, `gloki-change-control`, `gloki-verification-and-qa`.

## Process notes from S46

- The stub node (`docs/reviews/2026-10-integration-b/scripts/node-stub.cjs`) keeps state for the
  life of the process; a rerun of an onboarding walk with the same key sees "You're all set up"
  and the form never appears. Use a fresh key per run, or restart the stub.
- The beta's "Your key" screen is the only beta screen without `<main>`; Playwright selectors
  scoped to `main` miss its buttons.
- Python heredocs that write Markdown: quote the delimiter (`<<'EOF'`), or bash runs the
  backticks.
- When `package.json` merges clean and equals one parent, take that parent's lockfile; `npm
  install` then confirms it with no diff.

## Open for Eston

- Merge PR #24 on 30 October if Ouri hasn't; then the go for the second PR.
- The CSP `connect-src` question from S45 is still open.

## Don't

- Don't push to `origin/ui`, or touch `main` / `server-side`, without Eston's go.
- Don't rebase or rewrite `integration/ui-2026-10b`; it is a merge line.
- Don't start the next `ui` → `server-side` merge from `ui`; start from `integration/ui-2026-10b`.
- Don't reopen the locked calls (brand blue, system sans, 4-stage IA, demo HomeView).
- Don't add fr/sw strings for beta work; languages are dropped for the beta.
