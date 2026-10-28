# S42 — beta trim: 360px preview walk (2026-10-23)

Evidence for the "Done when" in `docs/session-prompts/session-42-beta-trim.md`. Both
`npm run build` and `npm run build:beta` were green at the walked HEAD; the parity scanner
reports `fr = sw = 1507`, `RESULT: PARITY OK`.

## How it was walked

Playwright (Chromium 1194) against `VITE_APP_MODE=beta vite` on port 5173, viewport 360×740 at
2× device pixels, one fresh browser context per theme (`gloki.theme` set to `light` / `dark`
before first paint). The script is not checked in; its log is `walk-log.txt` beside this file.

Each screen is captured at the top of the viewport; where the page body overflows, a second
`-bottom` frame is scrolled to the end. (The body is the app's scroll container — `index.scss`
sets `overflow-x: hidden` on it — so a full-page capture measures `<html>` and clips. That is a
capture limitation, not a layout bug: the buttons scroll into view for a user.)

## Sequence (same in both themes)

| # | Screen | File(s) | Checks |
|---|---|---|---|
| 1 | Doors (signed out `/`) | `*-01-doors` | one h1; three doors + "I already have a key" |
| 2 | Keys (existing login, trimmed) | `*-02-keys`, `*-02a-keys-returning` | 64-char key generated; stage strip and organisation row hidden; Back returns to the doors |
| 3 | Save your key | `*-03-backup` | shows the signed-in key; Copy writes the clipboard and announces it; Continue disabled until the checkbox |
| 4 | Account kind | `*-04-kind`, `*-04b-kind-contributor` | preselected from the door; contributor note explains hosting and records interest only |
| 5 | Profile (existing AgentStep) | `*-05-profile` | name + country via the searchable select |
| 6 | Ready | `*-06-ready` | kind badge in the recap; "Get verified" primary, "Open the forum" secondary |
| 7 | Verification hub | `*-07-verification` | "0 of 4 approvals" — no demo vouches seeded in beta; beta wording "people who know you" |
| 8 | Forum (via menu) | `*-08-forum-empty`, `*-08-forum-post` | one post, Like/Reply/Delete, no cause-vote buttons, no rank chip |
| 9 | Hidden surfaces | `*-09-profile-page`, `*-10-welcome-done` | StageFooter absent; `/identity` → profile; returning `/` → `/forum`; `/welcome` → "You're all set up" with "Open the forum" |

Redirects confirmed to `/forum` (signed-in, onboarded) in both themes: `/stage/problem`,
`/community/…`, `/create-community`, `/identity/communities`, `/identity/join`, `/organization`,
`/mandate/…`, `/initiative/…`.

## Console

Zero warnings. The only console errors (5 per theme) are
`Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` for
`https://gdi.gloki.contact/stream?…` — the SSE stream the existing `AuthContext` opens on login
against the default server URL. The build environment's proxy refuses that host; the demo build
does the same here. No application error, no React warning, no unhandled rejection.

## Not walked

- A real node (none reachable from this environment); every read/write hit the demo stubs.
- French and Swahili rendering of the 52 new strings (parity is scanner-checked; the register is
  in the native-review packet, Session 42 section).
- Demo mode (`npm run build`) was built, not walked; the beta flag is off there and no demo route,
  step or string changed.

Walked at `6c0f340` (S42 code commits `d004458..6c0f340`).
