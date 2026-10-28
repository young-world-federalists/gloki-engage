# Integration walk — `ui` → `server-side`, 2026-10-23

Evidence for the `integration/ui-2026-10` branch (merge commit `de05851`), per
[the plan](../../superpowers/plans/2026-10-23-forward-without-a-gate.md) §4 B3.

## What was checked

| Gate | Result |
|---|---|
| `npx tsc -b` | clean |
| `npm run build:prod` | clean (5.1 s) |
| `npm run lint` | 56 errors / 7 warnings, **none new**: every (file, rule) pair is present on `ui` (48) or `server-side` (47); one pair disappeared (`StageFeedView.tsx` `react-refresh/only-export-components`) |
| i18n parity scanner | `RESULT: PARITY OK`; fr/sw each gained the 9 keys Ouri added and lost the 7 sample-feed keys he removed, no remaining callers for the removed keys |
| `$gray-400` text / raw hex / literal rgba in `*.module.scss` | 7 / 11 / 0 — identical to `ui` |
| Leftover conflict markers | none |

## Demo walk (360×800, light and dark, Chromium via Playwright)

Served from `npm run preview:prod` at `/gloki-engage/`. Login seeded in
localStorage (`'a'×64`, `http://localhost:3011`). The server was a scratch stub
that speaks the subset of Ouri's API the real login path needs (bare-boolean
`is_exist_agent`, one `unique-gloki-engage-digital-agent-contract` in
`get_contracts`, `get_profile`, ack ids plus an SSE `/stream` echo for
writes/deploys). Everything prefixed `demo-` stayed in the in-browser mock layer,
as on `ui`.

**36 pages, 0 console errors, 0 page errors, 0 failed requests, 1 `h1` per page,
no horizontal overflow.** Routes: `/`, the four stage feeds, `/identity/{communities,
profile, verification, notifications}`, `/organization`, a demo community home +
`/members`, `/currency`, `/identity`, `/collab`, `/create-initiative`, its first
initiative's dashboard and `/discussion`.

**One demo write per theme:** a Causes comment posted on the discussion page
rendered immediately (`seen: true`, both themes) — the demo-only refetch rule
from the resolved `ThreadedDiscussion.tsx` works.

Screenshots: `shots/light/*.png`, `shots/dark/*.png`. Machine record:
`walk-summary.json`. (The dashboard and discussion screenshots share a truncated
file name; the discussion one is the survivor. Both page records are in the JSON.)

## Findings

1. **Not a regression, but Eston should know:** on `server-side` since 2 September
   (`27ec4b6`), `Communities.tsx`, `useAllInitiatives.ts` (Home, stage feeds) and
   `HomeView` list only `gloki_engage_community_contract.py` contracts. The seeded
   demo communities (`community_contract.py`) are excluded on purpose (code comment:
   "Ouri's call"). A fresh visitor whose node has no real community therefore sees
   "No activity yet" / "No Communities Yet" on the deployed site. Confirmed by
   building untouched `origin/server-side` and walking it with the same stub: same
   result. Demo community pages still work when reached directly.
2. **Real-node walk not done.** `https://gdi.gloki.contact` is unreachable from the
   session container (proxy refuses the tunnel). Create community → create
   initiative → `set_details`/`add_initiative` round-trip on the SSE stream is
   untested on this branch. Needs a run from a machine that can reach a node.
3. **Seam leak to tidy later (pre-existing on `server-side`):** `isDemoContract` is
   imported into components (`ThreadedDiscussion.tsx`, `ConvictionStaking.tsx`,
   `useFlowContract.ts`). CLAUDE.md's seam rule says components don't import from
   `src/services/demo/`. The resolved vote handler follows the same pattern for
   consistency; exposing the predicate through `api.ts` would fix all four at once.
4. **Wire names the UI calls that the three real contracts don't define (72 of 123).**
   All are demo-only today, so nothing breaks on `demo-` ids, and on a real
   initiative contract the S34 additions (`vote_comment`, `get_comment_votes`,
   `add_impact_assessment`, `get_impact_assessments`) would fail — those are the
   `docs/contracts/` patches still on Ouri's side. Not changed by this merge.

## Repro

```bash
# stub + preview were run from the session scratchpad; the walk script seeds
# localStorage, visits the routes above in both themes, and writes
# walk-summary.json + shots/. Playwright 1.56, Chromium 1194.
npm run build:prod && npx vite preview --mode production --port 4173
```
