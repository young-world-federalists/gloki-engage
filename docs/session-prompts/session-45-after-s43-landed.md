# Session 45 — after S43 landed on `ui`

Written 2026-10-26 at the end of S44. `origin/ui` is at the S44 closeout commit, which follows the
merge of S43 (`c3e9010`). The deploy still waits for Ouri (`server-side`).

**The landing site is no longer in this repo.** It lives at `young-world-federalists/gloki-site`
and has its own brief (`docs/brief-gdi-positioning.md` there): the Global Democracy Initiative
repositioned around the backend, on globaldemocracyinitiative.org. Do that work in a session with
that repo, not here.

## What S44 did

- Merged S43 (forum bylines, critique fixes) into `ui` on Eston's go; builds and parity green.
- Moved the landing page out of the `docs/site/` bundle into its own repo; deleted the bundle.
- Recorded the lint debt in MASTER_TODO §7 "Code health". No app code changed.

## Re-verify these premises vs HEAD before doing anything

- `git log -1 origin/ui` is the S44 closeout commit and nothing landed after it.
- PR #24 (`integration/ui-2026-10` → `server-side`) carries S34–S41 only. `ui` now also has S42 and
  S43. Check whether Ouri merged or commented, and whether Eston merged it on 30 October as
  planned; if so, the S42–S43 delta needs its own integration step.
- Whether Ouri has shipped `build:beta` on `server-side` or a runnable node image.
- `npm ci && npm run build && npm run build:beta` green; parity script `fr = sw = 1510`.
- `npx eslint src` is 48 errors / 8 warnings. If it changed, find out why before touching it.
- A cloud container cannot reach github.io, webflow or buttondown.com; check live pages from a phone.

## Read first

`CLAUDE.md`; MASTER_TODO §7 (Next build = P12, Code health, Blocked) and the S44 + S43 entries in
§8; skills `gloki-session-lifecycle`, `gloki-change-control`, `gloki-verification-and-qa`.

## Likely next work (Eston decides the order)

1. **Get S42–S43 to `server-side`**, depending on what happened to PR #24: refresh the integration
   branch or write the Ouri note. Eston coordinates; we prepare.
2. **Lint debt, `rules-of-hooks` first.** Five errors that can be real bugs (hooks called
   conditionally). Fix those as a small reviewed chunk; leave the style-only rules for later.
3. **P12 H5 (startable now):** CSP `<meta>`, SRI, dependency audit for the Pages bundle.
4. **P12 H0 claims audit:** every "decentralized / secure / private / anonymous" string in the app.
   It now matters twice: the GDI site rewrite will lean on the same claims.
5. A human pass on the beta screens with a real screen reader and an Android keyboard (not done
   in S43 or S44).

## Open for Eston

- Merge PR #24 on 30 October if Ouri hasn't (plan:
  `docs/superpowers/plans/2026-10-23-forward-without-a-gate.md`).
- The order of the work above.

## Don't

- Don't push to `origin/ui` or touch `main` / `server-side` without Eston's go.
- Don't do landing-site work here; it has its own repo and brief.
- Don't reopen the locked calls (brand blue, system sans, 4-stage IA, demo HomeView).
- Don't add fr/sw strings for beta work; languages are dropped for the beta.
