# Remove serif typography across the deployed app

## Decision and scope

Eston, 2026-09-23: remove serif fonts from every screen on the deployment. Terra maps; parent writes this plan; Sol oversees and executes. UI-only change. Use the existing system sans stack, retaining all sizes, weights, layout, and intentional monospace text. No webfont dependencies.

## Verified premises

- Terra found a single serif source: `$font-display` in `src/styles/variables.scss`.
- `src/styles/globals.scss` applies it to h1–h6; `src/components/AppHeader.module.scss` applies it to the wordmark. Body text is already sans.
- Parent confirmed the deployed welcome heading computes to `ui-serif, Georgia, Cambria, "Times New Roman", serif`.
- Local UI base: `60aa937892104e0d34e1b8caac2bc60eb9cb68be`. Production base: `3b563fa0b04a2b06b11a61315b56c4eff6f5b0ef` on `server-side`; latest deployment succeeded.
- Existing untracked files are unrelated and must be preserved.

## Sol implementation tasks (sequential; no additional agents)

1. In `src/styles/variables.scss`, define `$font-body` before `$font-display`, then alias `$font-display: $font-body`. Replace obsolete serif rationale with a short comment documenting system sans throughout the app.
2. Update the obsolete pairing comment in `src/styles/globals.scss`. Retain the shared heading rule. Add a brief font-family rule in `DESIGN_SYSTEM.md` under Typography.
3. Audit `src`, `public`, and `index.html` for remaining actual serif declarations (do not mistake `sans-serif` for `serif`). Verify font shorthand/inline styles do not override the fix. Do not change monospace output.
4. Run `npm run build:prod`; inspect the diff and report exact scope and results. Commit only the three intended implementation files. Parent reviews and browser-verifies the result.
5. Prepare the same focused change on a temporary isolated checkout based on current `origin/server-side`; do not merge the full UI branch or alter backend files. Check whether the identical source files make the patch apply cleanly. Build production from that checkout using existing dependencies if compatible. Report the deployment commit and diff before pushing.

## Release and verification

The user's explicit request targets the live deployment; ship this narrowly scoped typography fix after parent review. Keep the UI branch fixed as well to prevent a future merge reverting the typography. Normal Ouri integration remains unchanged for unrelated UI work. Push only the reviewed typography commit(s), never force-push, and stop/rebase safely if a remote moves.

Parent: verify welcome and representative headings/wordmark on a local production preview, including mobile layout and theme coverage when available. After pushing `server-side`, wait for successful Pages build/deploy and confirm the live computed heading/wordmark font is sans. Source-wide token/audit coverage establishes all-screen scope; do not claim every authenticated route was manually visited.

## Status

- Terra map complete: the shared `$font-display` token was the only serif source for headings and the wordmark.
- Sol committed the three-file fix as `be19026` on `ui` and `d930a9e` on `server-side`. Both `npm run build:prod` builds passed. Source and built-CSS audits found no remaining serif declarations; intentional monospace remains.
- Parent reviewed the exact diff with no findings. The local production preview showed sans headings on the 360px welcome screen in English, French, and Swahili, plus a sans modal heading, with no horizontal overflow.
- GitHub Pages run `35840046810` succeeded for `d930a9e`. A fresh live welcome load with `?release=d930a9e` computed to sans. An older open tab still showed cached serif styling until cache bust.
- Authenticated routes and dark mode were not manually exercised. The shared-token source and built-CSS audits support the all-screen scope.
