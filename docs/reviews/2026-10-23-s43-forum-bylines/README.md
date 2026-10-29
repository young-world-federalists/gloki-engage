# S43 — forum bylines: 360px preview walk (2026-10-23)

Evidence for the "Done when" in `docs/session-prompts/session-43-forum-bylines.md`. Both
`npm run build` and `npm run build:beta` were green at the walked HEAD; the parity scanner
reports `fr = sw = 1510`, `RESULT: PARITY OK`.

## How it was walked

Playwright (Chromium 1194) against `VITE_APP_MODE=beta vite` on port 5173, viewport 360×740 at
2× device pixels, one fresh browser context per theme (`gloki.theme` set to `light` / `dark`
before first paint). The signed-in part seeds `user`, a completed onboarding and a Digital Agent
with `accountKind: 'person'` into localStorage; the signed-out part starts from an empty store.
The script is checked in beside this file as `walk.mjs`; its log is `walk-log.txt`.

Each screen is captured at the top of the viewport; `03-forum-reply` also has a `-bottom` frame
scrolled to the end (the body is the app's scroll container, so a full-page capture clips).

## Sequence (same in both themes)

| # | Screen | File(s) | Checks |
|---|---|---|---|
| 1 | Forum, first open | `*-01-forum-welcome` | one h1; the seeded welcome post carries "🇮🇳 Priya Nair", not a truncated key; no `demo-use…` byline anywhere |
| 2 | Own post | `*-02-forum-own-post` | the signed-in user's post shows as "You" |
| 3 | Reply under the welcome post | `*-03-forum-reply` (+bottom) | the reply sits in the welcome post's `children` block with the nested thread line; its byline is "You" |
| 4 | Profile page | `*-04-profile-kind-person` | one h1; "Person" badge under the flag on the Digital Agent card |
| 5 | Edit modal | `*-05-profile-edit-kind` | "Account kind" select, preselected "Person" |
| 6 | Kind changed | `*-06-profile-kind-organisation` | after Save the badge reads "Organisation"; it survives a reload |
| 7 | About / Contact back | (log only) | both back buttons land on `/`, which sends a signed-in visitor to `/forum` |
| 8 | Keys screen, signed out | `*-07-keys-hint` | the hint reads "A 64-character code that's yours alone. New here? Tap generate." — no "across every community" |
| 9 | Kind step | `*-08-kind-lead` | the lead says "You can change it later from your profile" |

## Console

Zero warnings. The only console errors are `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED`
for `https://gdi.gloki.contact/stream?…` (five per signed-in walk, one per signed-out walk): the SSE
stream the existing `AuthContext` opens on login against the default server URL, which this
environment's proxy refuses. Same as the S42 walk. No application error, no React warning, no
unhandled rejection.

## Not walked

- A real node (none reachable from here); every read/write hit the demo stubs. In particular
  `getForumParticipants` answered from `src/services/demo/betaForum.ts`.
- French and Swahili rendering of the 4 strings (parity is scanner-checked; the register is in the
  native-review packet, Session 43 section).
- Demo mode (`npm run build`) was built, not walked. The only demo-visible change is the
  `DEMO_VERSION` bump to `global-v21`, which reseeds every demo community on next load.
- A second real author posting from another device. In the demo there is only the one persona;
  the real layer resolves each author through the same `fetchMemberProfile` path.

Walked at `e4646a1` (S43 code commits `4a46e66..e4646a1`).
