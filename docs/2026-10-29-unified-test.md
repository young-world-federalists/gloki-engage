# `unified` @ a06c7eb on a local node (29 Oct 2026)

**Verdict: safe to merge as code. Merging to `main` deploys nothing, and no demo action wrote to the node. Before
Pages builds from `main`, fix three things: the Back button carrying demo mode into real pages, the beta's
forum, and the deploy workflow plus Pages environment. The merge itself is not a fast-forward:
`unified` isn't based on `main`, and a plain merge conflicts in 34 files.**

Test setup:
- A fresh ibc node on `127.0.0.1:2631`, and the dev server from a throwaway worktree.
- Three test people (Una, Bo, Cy), all on localhost.
- Every request to the node was logged in the page.
- Nothing was sent to `gdi.gloki.contact`. Nothing was pushed or commented on.

## Ranked

### 1. Browser Back carries demo mode into real pages. Fix before pointing Pages at `main`
- **Steps:** open the real home (`/`), go to `/identity/communities?demo=true`, then press Back.
- **What happens:** the home comes back as `/?demo=true`, showing demo problems ("Fair Futures Forum, Diego
  Hernández…").
  - Same with a real-only page: Back to `/identity/profile` gives `/identity/profile?demo=true` with the "flag is
    ignored" banner.
  - The rewritten URL also goes into history.
- **Cause:** `useDemoMode.ts` keeps the flag in a module variable (`stickyDemo`). A Back navigation to a URL with
  no `demo` parameter keeps the old value, and `DemoFlagUrlSync` then writes `?demo=true` into it.
- **Fix idea:** on Back/Forward navigations (`useNavigationType() === 'POP'`), follow the URL only, or keep the
  flag in history state instead of a module variable.
- **What works:**
  - "Show real data" returns to real.
  - `?demo=false` returns to real.
  - A fresh page load follows the URL.
  - In-app links get `?demo=true` written in, so shared links keep the mode.

### 2. The beta trim lands every visitor on "Not yet implemented". Blocks building the beta from `main`
- `npm run build:beta` builds cleanly, and `tsc -b` passes.
- Against the local node, the beta works:
  - The front door, key, account type, profile and sign-up all work. The node reads back `is_exist_agent → true`
    for Cy.
  - Verification reads the real registry: "Someone else is being verified right now", which is correct.
- But the beta's home redirects to `/forum`, and the forum is demo-only. So without `?demo=true`, every beta
  visitor sees "Not yet implemented". With the flag they get the demo forum, where nothing is saved. `DEMO_MODE.md`
  says so.
- If `/demo/` is built from `main`, it stops being mock-only. Visitors would create real accounts on the
  application node, unlike today's `/demo/`.

### 3. Merging into `main` is a decision, not a click
- `main` (`d28594a`, 5 May) isn't an ancestor of `unified`. A trial merge (`git merge-tree`) gives conflicts in 34
  files: the May collaboration flows, their contracts, `App.tsx`, `api.ts` and `services/contracts/`.
- The clean route is the one in the git plan:
  1. Keep today's `main` as `archive/main-2026-05`.
  2. Point `main` at `unified`.
  3. Ouri checks whether anything in `459e084`/`d28594a` is still wanted.
- `ui`'s 7 commits aren't in `unified`'s history. Only one file is missing: `docs/handoffs/2026-10-28-node1-and-trust.md`.
- The repo's default branch is still `ui`, and nothing is branch-protected.

### 4. Deploy: what a merge to `main` publishes today. Nothing
- `deploy.yml` on `unified` is byte-identical to `server-side` and `ui`. It runs on pushes to `server-side` and
  `ui` only, and checks out both by name. So a merge to `main` doesn't deploy, and the live site keeps building
  from those two branches.
- The `github-pages` environment only allows deploys from `server-side` and `ui` (custom branch policy). A
  workflow pointed at `main` would be refused until that changes.
- To change:
  1. Set `on.push.branches: [main]`.
  2. Use one checkout of the pushed commit (drop `ref: server-side` / `ref: ui`).
  3. Root: `npm run build:prod` from `main`. That is the full app on real nodes, with per-page `?demo=true`.
  4. `/demo/`: decide. Either drop it, since `?demo=true` replaces it (old `/demo/` links then 404, so add a
     redirect), or build `build:beta` from `main`. The second needs item 2 fixed first, and it then talks to real
     nodes.
  5. Add `main` to the `github-pages` environment's deployment branches. That is a settings change, so it needs
     Eston or Ouri.
  6. If `/demo/` stays, pass the `VITE_APPLICATION_*` vars to its build too. Today only the root build gets them.
  7. Make `main` the default branch. Update the 7 skill files under `.claude/skills/` that still name
     `server-side`, and any current docs that do. In all, 51 files in `.claude`, `docs`, `CLAUDE.md` and
     `README.md` mention it, but many are dated history and can stay.

### 5. Leaving demo mode from a demo community sends a write to the node
- **Steps:** on a demo community page, press "Show real data". It links to `/community/demo-comm-…` with no flag.
- **What happens:**
  - The real page shows "Community not found".
  - First, it sends `record_activity` as a `contract_write` (twice) on the demo id to the node, plus three reads.
  - The node answered 200. It's harmless here, but it is a write caused by a demo action.
- **Fix idea:** "Show real data" on a page whose id is from the demo layer should go to the list page. Or real
  community pages should not write until the community is found.

### 6. Real-only pages inside demo mode do real things
With the flag on, these pages show a yellow "the demo flag is ignored" banner, then act for real:
- **Verification:** "Get verified" is the real button. On a node in the founder phase, which is the live site
  today, someone exploring a `?demo=true` link can become founder. That is already possible without the flag;
  demo links just make it easier to stumble into.
- **"Create a community"** from the demo list creates a real community.
- **"Start an initiative"** from a demo community is a dead end ("Community not found") and sends a node read
  with the demo id.
- **Suggestion:** in demo mode, hide or disable these actions, or route them to a demo version.

### 7. The race: a real write survives the switch, and no demo write reaches the node
- **Real → demo:**
  - Steps: with the node paused, press "Second it" on a real problem, then navigate to a demo page 0.4 s later,
    and resume the node.
  - Result: the write had already been sent to the node and landed. The real page then read "Second it 1".
  - The follow-up `if (isDemoDataMode()) await fetchData()` reads from the layer of whatever page is shown by then.
    That's the "known limit" in `DEMO_MODE.md`. No lasting wrong data was seen.
- **Demo → real:** I found no window, in code or in testing.
  - `contractWrite`, `contractRead` and `joinContract` decide the layer when called, and the demo layer resolves
    at once.
  - The demo flow setup (`useFlowContract`) chains mock read, then mock deploy, then write, with no wait between.
  - The simulated call and daily session use timers, but they write only browser storage, not the node.
  - The one demo-caused node write I saw is item 5.

### 8. Demo pages still make one real read, and the banner says nothing reaches the network
- Every demo page sends `GET gloki-application?action=is_exist_agent`. That is the menu checking real
  verification status (`HomepageMenu`).
- It's by design (rule 4: the frame stays real), but the banner "Nothing you do here reaches the network" claims
  more than that.
- Real pages showed no demo data in any test except item 1. I checked `/`, the four stage feeds,
  `/organization`, `/identity/communities` and `/identity/hidden`.
- A demo id on a real page shows "not found", and so does a real id in demo mode.

## My 29 Oct items, re-checked

| # | Item | Now |
|---|---|---|
| 4 | Demo and real share sign-in storage | **Changed.** Inside `unified` there is one session, and demo is a per-page view of it, so there's no separate demo sign-up. The live `/demo/` (built from `ui`) still shares `localStorage['user']` with the root until the deploy changes (item 4 above). |
| 5 | "Requested ✓" forever when the node is down | **Partly fixed.** In the first phase ("Ask"), a node outage shows "Could not connect to the application server." and the button goes back to "Ask". The promise still ends up unhandled in the console. The open-phase Request page is unchanged: `refetch()` still sits in `finally` (`RequestPage.tsx:33-40`). I couldn't reach the open phase (it needs four verified people). |
| 6 | "Share Community Link" fails silently | **Still there** (`CommunityView.tsx:282`, `:321`). |
| 7 | "nothing here leaves your browser yet" | **Still there** (`RulesStep.tsx:53`), on the real sign-up. |
| 8 | Steward sees a raw key | **Still there:** "s3Yol292 is being verified now…" (`VerificationHub.tsx:97`). |
| 10 | Fake call writes vouches and notifications | **Changed.** The call, daily session, invite and notifications pages are now demo-only. On real pages they show "Not yet implemented", including the bell in the header and "Join the daily session" on the real Verification page. The demo call writes its vouches into the signed-in person's own browser record (`addUserVouch` → `localStorage`), and real components read that record (`SequentialVerification`, `RequestPage`, `DigitalAgentCard`). Not reproduced: the demo call said "No one is available right now" in the first phase. |

## State left behind
- Torn down: the test node `unif` (containers and volumes), the worktree, the beta build, and both preview servers.
- Nothing was written to `gdi.gloki.contact`, `unified`, `main`, `ui` or `server-side`.
