# Session 46 — get S42–S44 to `server-side`

Written 2026-10-26 at the end of S45. `origin/ui` is at `67ac268` (S45: the `CommunityView` hooks
fix and the dependency audit). This closeout adds a docs commit on top. The deploy still waits for
Ouri (`server-side`).

## What S45 did

- `d3e6fe8`: `CommunityView` calls every hook before its early return (the five `rules-of-hooks`
  errors); `props` memoized so the fetch effect stops re-running every render.
- `67ac268`: `react-router-dom` 7.18.4, DOMPurify 3.4.17, `express`/`cors` to `devDependencies`;
  `npm audit --omit=dev` 0.
- Saved the demo route walk as `.claude/skills/gloki-verification-and-qa/scripts/route-walk.cjs`.
- Order Eston agreed: (1) hooks ✔, (2) dependency audit ✔, (3) S42–S44 to `server-side` as a
  **second PR**, (4) H0 claims audit, (5) CSP + SRI, (6) human screen-reader / Android pass.

## Re-verify these premises vs HEAD before doing anything

- `git log -1 origin/ui` is the S45 closeout docs commit, on top of `67ac268`, and nothing
  landed after it.
- PR #24 (`integration/ui-2026-10` → `server-side`, head `7811117`) was open with no comments or
  reviews from Ouri on 26 October. Eston planned to merge it on **30 October**. Check which
  happened. The plan below assumes it merged; if it didn't, ask Eston before building on it.
- `server-side` was at `d930a9e` (23 Sep) with no `build:beta` script and no Docker/compose files.
- `ui` minus the #24 head was 32 commits on 26 October (S42 ×7, S43 ×10, S44 ×2, plus docs and
  the three skill PRs), now 34 with S45 (35 with this closeout). 41 `src` files; the only seam or
  config files touched: `src/services/forum.ts`, `src/services/demo/betaForum.ts`,
  `src/services/demo/mockApi.ts`, `src/services/interfaces.ts`, `package.json`.
- `npm ci && npm run build && npm run build:beta && npm run build:prod` green; parity `fr = sw =
  1510`; `npx eslint src` 44 errors / 7 warnings; `npm audit --omit=dev` 0.

## The work: item 3

1. Branch `integration/ui-2026-10b` from the #24 head (or from `server-side` if #24 merged), then
   `git merge origin/ui` — a merge commit, no rebase, nothing rewritten on `server-side`.
2. Resolve conflicts the way #24 did: **Ouri's server wiring wins**, our UI is re-applied on top.
   The `package.json` conflict is expected (`build:beta`, the S45 dependency moves); regenerate
   the lockfile with `npm install`, never by hand.
3. Verify: all three builds, parity, grep gates, lint (no new (file, rule) pairs vs `ui` or
   `server-side`), `npm audit --omit=dev`. Then the route walk in demo mode and a beta walk
   (`VITE_APP_MODE=beta`): sign-up, key save, account kind, forum post with byline, at 360px
   light + dark. Record the evidence like `docs/reviews/2026-10-integration/README.md`.
4. Draft the PR text (same layout as #24: what, conflicts table, verification, things noticed,
   merge plan). **Open the PR only once #24 has merged**, so its diff shows S42–S45 alone.
   Opening a PR against `server-side` is outward-facing: confirm with Eston first.

Not possible from a cloud container: the real-node walk (`gdi.gloki.contact` is refused by the
egress proxy). Say so in the PR, as #24 did.

## Read first

`CLAUDE.md`; MASTER_TODO §7 (Next build, Code health, Blocked) and the S45 + S44 entries in §8;
PR #24's body; `docs/reviews/2026-10-integration/README.md`; skills `gloki-session-lifecycle`,
`gloki-change-control`, `gloki-verification-and-qa`.

## Process notes from S45

- Start Vite as `node node_modules/vite/bin/vite.js --port 5173 --strictPort &` and kill that
  PID. Killing an `npx vite` wrapper leaves Vite orphaned on the port, and the next "fresh" server
  silently fails to bind.
- Never `pgrep -f`/`pkill -f` with a pattern that also appears in your own command line: it
  matches the shell running it and kills the turn.
- Comparing old vs new dependencies: swap `package.json` + lockfile inside a subshell with a
  `trap` that restores them, `npm ci`, walk, restore, `npm ci`.

## Open for Eston

- Merge PR #24 on 30 October if Ouri hasn't.
- The CSP `connect-src` question (item 5): the server URL is user-supplied, so the policy cannot
  name one host. Options: `connect-src https:` (loose), a fixed allow-list of known nodes (breaks
  self-hosting), or no CSP until H1.

## Don't

- Don't push to `origin/ui`, or touch `main` / `server-side`, without Eston's go.
- Don't open the integration PR before #24 merges, or without Eston's go.
- Don't do landing-site work here; it has its own repo (`young-world-federalists/gloki-site`).
- Don't reopen the locked calls (brand blue, system sans, 4-stage IA, demo HomeView).
- Don't add fr/sw strings for beta work; languages are dropped for the beta.
