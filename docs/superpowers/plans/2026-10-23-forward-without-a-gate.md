# Moving forward without waiting on Ouri — landing page, integration, hardening

**Date:** 2026-10-23 · **Author:** Eston + Claude (session `claude/youthful-cerf-ltibol`) · **Status:** proposed, nothing built

> This plan authorises no push, merge, deploy, domain purchase or product decision. Decisions in §2
> are recommend-then-confirm (gloki-change-control Rule 3). Pushes wait for Eston's explicit go
> (Rule 1). Every premise in §1 was re-verified against HEAD on 2026-10-23; re-verify again before
> acting on any of them.

**Goal:** Ship a public landing page, put the last seven weeks of `ui` work on the deployed
`server-side` line, and start the hardening work that depends on nobody, so the project moves
whether or not Ouri replies this month, without taking the backend out of his hands.

---

## 1. Premises verified against HEAD (2026-10-23)

| Premise | Evidence |
|---|---|
| `ui` (`2ad0f1d`) is 50 commits ahead of `server-side` (`d930a9e`). Fork point `cf0ba5e`, 2026-09-02 | `git log --oneline origin/server-side..origin/ui \| wc -l` → 50; `git merge-base` → `cf0ba5e` |
| Ouri's own work since the fork is **three commits** of server wiring (`b0efc79` login/onboarding/profile, `27ec4b6` communities, `cef1fe5` initiative flow), ~2,300 lines across 57 files | `git log cf0ba5e..origin/server-side`; `git diff --stat` |
| His `api.ts` is **dispatch-aware**: `isExistAgent`/`registerAgent`/`getContracts` always hit the real node; `contractRead`/`contractWrite` go real unless the id starts with `demo-`; `deployContract`/`joinContract` stay mocked. Signatures unchanged, so `ui` callers compile against it | `git show origin/server-side:src/services/api.ts` |
| Real contract modules exist only for **community details** and **initiative creation** (`src/services/contracts/glokiEngage{Community,Initiative}.ts`). Everything S34–S41 added (Causes, verification hub, notifications, conviction accrual) is demo-only on both branches | file listing of `origin/server-side:src/services` |
| A dry-run merge `ui → server-side` **conflicts in exactly 5 files**, all small: `ThreadedDiscussion.tsx` (Ouri +51/−18 vs ui +157/−25), `CommunityHome.tsx` (Ouri +120/−77 vs ui +1), `digitalAgentStore.ts` (Ouri +41/−62 vs ui +8), `AuthContext.tsx` (12 vs 10 lines), `services/contracts/initiative.ts` (16 vs 26 lines). Everything else auto-merges | `git merge-tree --write-tree origin/server-side origin/ui` → exit 1, 5 CONFLICT lines |
| Eston has already pushed straight to `server-side` twice (`3b563fa` 09-22, `d930a9e` 09-23) and Pages deployed. The "only Ouri deploys" rule is a working agreement, not an access restriction | `git log origin/server-side -3 --format='%an %s'` |
| Pages workflow builds `server-side` with `npm run build:prod` (`tsc -b` + Vite, Node 22) | `.github/workflows/deploy.yml` |
| **Liquid delegation (D3) was paused by Eston on 2026-07-06** ("will happen later"). Only the fixture comment at `src/services/demo/fixtures/mechanisms.ts:6` exists | MASTER_TODO.md §8, 2026-07-06 entry |
| The bundle loads **no third-party script or stylesheet**. The only runtime external origins are the user's typed server URL and `https://api.openai.com` (`src/services/ai.ts`, called from `AITools.tsx` with a key stored via `src/utils/localSecrets.ts`) | `grep -rn "https\?://" src index.html` |
| `index.html` has two inline scripts (theme pre-paint, SPA redirect) and one inline `style=` attribute on `#root`. Both matter for a CSP | `cat index.html` |
| `express` and `cors` sit in `dependencies` though only `mock-server.cjs` uses them | `package.json` |
| `/impeccable` is **not installed** in this environment (no match in skills, `.claude/skills`, or on disk) | `SearchSkills`, `find / -iname "*impeccable*"` |
| The live initiative contract enforces none of the ballot rules; the guard patch `docs/contracts/2026-09-25-initiative-ballot-guards.py` is unapplied | MASTER_TODO.md §7 P12 baseline, `0e94913` |

---

## 2. Decisions for Eston (batched; recommendation first)

| # | Question | Recommendation | Alternatives |
|---|---|---|---|
| D1 | Where does the landing page live? | **Separate repo** (`young-world-federalists/gloki-site` or similar), static HTML/CSS, its own Pages deploy. Keeps it off Ouri's merge path and off the locked "HomeView is `/`" decision | A `/about` route inside the app (couples marketing copy to Ouri's merge cadence and the app bundle size) |
| D2 | Domain | Buy/point a domain if one is intended (`gloki.*`); until then ship on `young-world-federalists.github.io/<repo>/`. Needs: who owns DNS, which registrar | Stay on github.io indefinitely |
| D3 | Who is the landing page for, in priority order? | 1. Pilot partners and youth orgs in KE/NG/MW/CD who need to say yes to VftC; 2. funders/institutions who want to see seriousness; 3. a curious citizen who wants to try it. One page, three scroll depths | Funders first (changes tone toward credentials) |
| D4 | What may the page claim? | Run the P12 **H0 claims audit** on the landing copy first: say "built to run on community-operated nodes", not "decentralized" or "secure", until H1–H4 ship. Say "demo" where it is a demo | Reuse `app.title` wording ("Decentralized Self-Governance") as is |
| D5 | Integration branch: PR to `server-side`, or push to it directly like the Sept fixes? | **PR** (`integration/ui-2026-10` → `server-side`) with a short note to Ouri. He gets visibility; his silence doesn't block. If no reply in 7 days, Eston merges it himself (Rule 1 still applies: Eston says go) | Direct push (fine for two cosmetic commits in Sept; not fine for a 50-commit merge that touches his wiring) |
| D6 | CSP `connect-src` shape | `connect-src 'self' https:` — the server URL is typed by the user at login, so it cannot be enumerated. This still blocks `http:`, `ws:`, `data:` exfiltration and any non-TLS node. Tighten to a list when the node directory exists | Hard-code known nodes (breaks login to any other node) |
| D7 | Remove the OpenAI call path or keep it? | Keep, but **declare it**: it is the one third-party origin and the key sits in browser storage. Add it to the privacy copy and the claims audit. Removing is a product change (AITools translate/summary) | Remove AI tools from the public demo |
| D8 | Un-pause D3 liquid delegation? | **Not in this cycle.** It is a product mechanism Eston paused; the three streams above fill 3–4 weeks. Revisit when the integration PR has landed | Un-pause now and build it on `ui` behind the seam as a fourth stream |
| D9 | Send Ouri the note before or after the PR exists? | **With the PR link in it.** A concrete artefact gets a faster reply than a question | Email first, PR later |

---

## 3. Workstream A — Landing page (separate static site)

**Owner:** Eston (copy decisions) + Claude (build). **Depends on:** D1–D4. **Duration:** 4–6 working
sessions. **Deploys independently** of the app.

### A0. Set up the design tooling

`/impeccable` is a public Claude Code design skill (Paul Bakaus, Apache-2.0) that bundles a brand
intake step, generation commands and anti-slop audits. It is **not installed here**. Install it in
the landing-page repo (not in `gloki-engage`, which has its own design law in `DESIGN_SYSTEM.md`),
following the current instructions at `github.com/pbakaus/impeccable` — write-ups disagree on the
command (`npx skills add pbakaus/impeccable` vs `npx impeccable install` + `/impeccable init`), so
read the repo README before running anything. Then:

1. Run the intake command (`/teach-impeccable` in current builds) with: the two north stars
   (MASTER_TODO §1), the four pilot countries, the "cheap Android, intermittent data, English as
   a third language" reader, the locked brand blue `#3b82f6` and system-sans typography (S41), the
   Gloki icon in `public/gloki-icon.png`. Save its output file into the landing repo so every later
   session reads the same brief.
2. Use `/critique` and `/audit` as the review gate on each iteration, the same role the Opus
   whole-branch review plays in `gloki-engage`. Keep `/polish` for the last pass only.
3. Hand-verify what the skill cannot: real-device check at 360px, Lighthouse ≥ 90 on
   performance and accessibility, text contrast against the brand blue (the white-on-`$primary`
   3.68:1 exception is **not** inherited by the landing page; the page has no locked exception, so
   use blue on white, not white on blue, for body-size text).

### A1. Content architecture (one page, three depths)

| Depth | Reader | Content | Source of truth |
|---|---|---|---|
| Above the fold | Everyone | One sentence on what Gloki is; one on who it's for; **Open the demo** (→ live Pages app) and **Partner with us** (→ mailto or form) | MASTER_TODO §2 "The platform (primary)" |
| Middle | Pilot partners | The four stages as the reader will experience them (Problem → Solutions → Vote → Mandate, matching the locked 4-stage IA, Discussion shown as per-post); the VftC pilot in one paragraph with the four countries and the 12-month shape; "what a partner organisation does" in three bullets | MASTER_TODO §2 table; DESIGN_SYSTEM.md "4-browseable-stage IA" |
| Bottom | Funders, sceptics | The three mechanisms in plain words (QV, conviction, delegation **marked "planned"**); the trust model in one paragraph (vouching, 1p1v, no token weighting); an honest "where we are" box: demo live, node software in development, security track planned (link to the P12 design once public); team/contact | MASTER_TODO §3; P12 design §4 |

Copy rules: plain language at a reading level a 16-year-old second-language reader clears; no
word the H0 claims audit would strike (see D4); every statistic traceable to a doc in this repo
or removed. No stock photography of "diverse youth"; use product screenshots at 360px width
and the country-flag/presence motif the app already owns (`CountryParticipation`).

### A2. Build

- Plain HTML + one CSS file + no JS beyond a theme toggle, or Astro if Eston wants Markdown
  content files. No framework runtime; the page should be under 200 KB total with images.
- Screenshots: capture from the **integration branch preview** (Workstream B) so the page shows
  the current UI, not the September deploy. Dark and light variants; `<picture>` with
  `prefers-color-scheme`.
- i18n: English first. The app ships `fr` and `sw`; add `/fr/` and `/sw/` pages only once the
  English copy is frozen, and route them through the native-review packet
  (`docs/i18n-native-review-candidates.md`) like app strings.
- Metadata: Open Graph image, `<meta name="description">`, `security.txt` (shared with Workstream C,
  §5.4), `robots.txt`, sitemap.
- Deploy: GitHub Pages from `main` of the landing repo; custom domain per D2 with HTTPS enforced.

### A3. Acceptance

- [ ] Eston has approved the copy against D3/D4 (recommend-then-confirm on every claim)
- [ ] `/critique` and `/audit` report nothing above "minor"; the results file is committed
- [ ] Lighthouse mobile: performance ≥ 90, accessibility 100, no horizontal scroll at 360px
- [ ] Both CTAs tested from a phone on mobile data: demo opens, contact path works
- [ ] Page weight < 200 KB; no third-party request in the network tab
- [ ] Live URL added to `README.md` and to the Ouri note (§6)

---

## 4. Workstream B — Integration branch `ui → server-side`

> **Status 2026-10-23:** B1–B4 done the same day. Decisions D1–D9 taken as recommended. Branch
> `integration/ui-2026-10` (merge `de05851`, evidence `7811117`), PR
> [#24](https://github.com/young-world-federalists/gloki-engage/pull/24) open against
> `server-side`, reviewer Ouri, merge window to 30 October. Real-node walk recorded as open
> (node unreachable from the build environment). Findings in
> `docs/reviews/2026-10-integration/README.md`, including the pre-existing `server-side`
> behaviour that hides demo communities from Home/Communities (Ouri's call, 2 Sept).

**Owner:** Claude (merge + verification), Eston (go/no-go, sends note). **Depends on:** D5, D9.
**Duration:** 2–3 sessions. **This is the stream that puts seven weeks of work in front of users.**

### B1. Branch and merge

```bash
git fetch origin ui server-side
git checkout -b integration/ui-2026-10 origin/server-side
git merge --no-ff origin/ui          # expect 5 conflicts (see §1)
```

Never rebase or force-push: `server-side` is Ouri's branch and a merge commit keeps his history
intact (CLAUDE.md branch model; babysit rules on other people's branches).

### B2. Resolve the five conflicts, with the rule "Ouri's wiring wins, ui's UI wins"

| File | Ouri's side | ui's side | Resolution |
|---|---|---|---|
| `src/contexts/AuthContext.tsx` | real `isExistAgent`/`registerAgent` on login | S41 login repair state | Take both: his calls, ui's state/copy. 20 lines total |
| `src/components/identity/agent/digitalAgentStore.ts` | reads profile from the real digital-agent contract | 8 added lines (verification fields) | His read path; append ui's fields to the type and the mapper |
| `src/services/contracts/initiative.ts` | 16 lines: real `createInitiativeOnChain` hook-up | 26 lines: S34 `cause_id`/impact additions on the demo path | Both; they touch different functions. Check the `IMethod` names still byte-match `gloki_engage_initiative_contract.py` (wire-name invariant) |
| `src/components/community/CommunityHome.tsx` | 120/77 rewrite to read real community details | +1 line | Take his; re-apply ui's one line |
| `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` | 51/18: real-contract read/write through `useContractSync` | 157/25: S34 Causes UI | The hard one. Keep ui's render tree and his data hooks; expect to hand-resolve and re-read the result end to end |

After resolution: `npm run build:prod` must be green (the Pages workflow runs `tsc -b`). Then
`npm run lint` and the grep gates from gloki-verification-and-qa (ad-hoc values, single h1,
i18n parity: `fr`/`sw` auto-merged but must be re-scanned).

### B3. Verify both halves of the dispatch

The merged `api.ts` routes by contract-id prefix, so two walks are needed:

1. **Demo walk** (no server): login with any key against an unreachable server URL is Ouri's
   real `isExistAgent` and will fail — so this walk uses `mock-server.cjs` (`node mock-server.cjs`,
   port 3001) as the server URL. Walk the eight flows + Causes + verification hub + notifications
   at 360px, dark and light. Everything S34–S41 must behave exactly as on `ui`.
2. **Real walk** (needs a running node): Eston or Ouri points the preview at a live IBC node.
   Create community → create initiative → confirm `get_details`/`add_initiative` round-trip on the
   SSE stream (`watchForChainAck`). This is the only place Ouri's code is exercised; if no node is
   reachable, record that as an open item in the PR rather than claiming it passed.

Record evidence (screens, console) in `docs/reviews/2026-10-integration/` the way the WoT review
did.

### B4. Open the PR

- `integration/ui-2026-10` → `server-side`. Title: "Bring ui (S34–S41) onto server-side".
- Body: the five conflict resolutions in a table, the two walks and their evidence, the three
  things Ouri still owns (guard patch, D12 eligibility, conviction-accrual hand-off, all in
  `docs/contracts/`), and a line that Eston will merge after 7 days of silence (per D5).
- Don't merge without Eston's go. When it merges, Pages deploys; check the run and the live URL
  (gloki-build-env-run has the recipe) and take the landing-page screenshots (A2) from the live
  site.

### B5. Acceptance

- [ ] `npm run build:prod`, `npm run lint`, grep gates: green on the merged tree
- [ ] Demo walk complete at 360px, both themes, with evidence
- [ ] Real walk done, or recorded as not done with the reason
- [ ] PR open; Ouri notified (§6); MASTER_TODO §7 "Blocked / coordination" updated to point at it
- [ ] After merge: Pages run green, live site loads, S34–S41 features visible in production

---

## 5. Workstream C — P12 H5 on `ui` (delivery and supply-chain hardening)

**Owner:** Claude. **Depends on:** D6, D7. **Duration:** 2 sessions. Pure frontend, no Ouri
dependency; the P12 design marks it startable now. Each item is its own commit so a CSP
regression can be bisected.

### C1. Content Security Policy (`index.html` `<meta http-equiv="Content-Security-Policy">`)

GitHub Pages can't set response headers, so this is a `<meta>` policy. `frame-ancestors` and
`report-uri` are ignored in `<meta>`; accept that and note it.

Prerequisites in the same change:
- Move `style="width: 100%"` off `#root` into `index.scss` (a style **attribute** is blocked
  without `'unsafe-inline'`; CSSOM writes from React are fine).
- Hash the two inline scripts (`'sha256-…'`) or move them to `/public/boot.js`. Hashing keeps the
  zero-flash theme behaviour (S21 D2); moving adds one request before first paint. **Hash.**
  The hash must be regenerated whenever either snippet changes; add a comment saying so and a
  one-line check in the build (`scripts/check-csp-hash.mjs`) that fails `build:prod` on mismatch.

Proposed policy, to be tightened as the preview walk allows:

```
default-src 'none';
script-src 'self' 'sha256-<theme>' 'sha256-<spa-redirect>';
style-src 'self';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https:;          /* D6: user-typed node URL + api.openai.com */
worker-src 'self' blob:;            /* @yudiel/react-qr-scanner */
manifest-src 'self';
base-uri 'self';
form-action 'none';
object-src 'none';
upgrade-insecure-requests;
```

Verification: `npm run build:prod && npm run preview:prod`, then the full preview walk watching
the console for CSP violations (QR scanner, PDF export via `jspdf`/`svg2pdf.js`, react-dnd
previews, `LanguageSwitcher` data-URI backgrounds, identity-card SVG are the likely offenders).
SSE (`EventSource`) is governed by `connect-src`; test a real-node login if one is reachable.

### C2. Subresource integrity

There are no third-party scripts or stylesheets (§1), so SRI has nothing to pin today. Record
that finding in the P12 design as the H5 baseline and add a grep gate (`grep -rn "https://" dist/*.html`
must return nothing) so a future CDN font or analytics snippet can't slip in silently.

### C3. Dependency hygiene

- Move `express` and `cors` to `devDependencies` (they belong to `mock-server.cjs`). Check `npm ls`
  afterwards that nothing in `src/` imports them.
- `npm audit --omit=dev` as a CI step in a new `.github/workflows/ci.yml` that runs on every push
  to `ui` (build, lint, audit; **no deploy**). Today `ui` has no CI at all, so a red `tsc -b` is
  first seen by Ouri's merge.
- `.github/dependabot.yml`: weekly, npm, grouped minor/patch, `open-pull-requests-limit: 5`.
  Dependabot PRs land on `ui`; they go through the normal review gate.
- Record the dependency count (20 + 14) and the audit result in the changelog entry.

### C4. Assurance basics that cost nothing (pulled forward from H8)

- `public/.well-known/security.txt` with a contact, expiry, and preferred language; served by
  both the app and the landing page.
- `SECURITY.md` at the repo root: how to report, what's in scope, the honest statement that the
  deployed demo is not yet safe for binding votes (guard patch unapplied).

### C5. Deferred inside H5 (note, don't build)

Reproducible/signed builds + SBOM, and the second mirror, wait until the integration PR has
landed and there is one deploy line to sign. The service-worker decision stays parked until keys
live in the browser (P12 §H5).

### C6. Acceptance

- [ ] Preview walk at 360px, both themes, zero CSP violations in the console; evidence captured
- [ ] `build:prod` fails if an inline-script hash drifts
- [ ] `ci.yml` green on `ui`; Dependabot config present; `npm audit --omit=dev` clean or triaged
- [ ] `security.txt` reachable on the deployed app after the next `server-side` merge
- [ ] MASTER_TODO §7 P12 H5 flipped to "in progress/shipped" with hashes; §8 entry; FOR_OURI_seam
  untouched (no seam change in this stream)

---

## 6. The note to Ouri (send with the PR link; D9)

Short, declarative, no question that his silence can stall. Draft:

> Hi Ouri,
>
> Two things I've started, so you're not surprised by them:
>
> 1. I've opened a PR that brings `ui` (everything since your 2 September merge: Causes, the
>    verification hub, notifications, conviction accrual, the login fix) onto `server-side`. Five
>    files conflicted and I kept your server wiring in all of them. Build is green. I've walked the
>    demo paths; I haven't been able to exercise the real node from here, so that's listed as open
>    in the PR. If I don't hear from you by <date + 7 days> I'll merge it so the demo site is
>    current.
> 2. I'm building a separate landing page for Gloki at <URL>. It links to the demo and doesn't
>    touch the app repo.
>
> Still yours, and still the most important thing for a real vote: the ballot-guard patch in
> `docs/contracts/2026-09-25-initiative-ballot-guards.py`. Everything else can wait for it.
>
> Eston

---

## 7. Sequence

| Week | A — Landing | B — Integration | C — H5 |
|---|---|---|---|
| 1 | Decisions D1–D4; install impeccable; intake file; copy draft v1 | Branch, merge, resolve 5 conflicts, green build; demo walk | Decisions D6–D7; CSP prerequisites (root style, hashes) |
| 2 | Build v1; `/critique`; screenshots from the integration preview | Real walk if a node is reachable; PR open; note to Ouri | CSP live in preview, walk, fix violations; `ci.yml` + Dependabot + deps move |
| 3 | Copy frozen; `/audit`; Lighthouse; deploy to Pages/domain | Silence window; merge on Eston's go; Pages deploy check; retake screenshots from live | `security.txt`, `SECURITY.md`; changelog; P12 design baseline note |
| 4 | fr/sw pages into the native-review packet (optional) | Post-merge: `ui` rebased onto nothing (it stays `ui`); `server-side` ahead by one merge commit | Revisit D8 (delegation) and signed builds |

Streams A and C are independent. B gates A's screenshots and C's `security.txt` reaching
production. Nothing in any stream waits on Ouri; §6 and the guard patch are the only items that do.

## 8. What this plan deliberately doesn't do

- Build a second backend against `FOR_OURI_seam.md`. That forks the project; the fix for a slow
  partner is visibility and a date, not a parallel server.
- Touch `main` (Rule 2) or rewrite history on `server-side`.
- Reopen the locked decisions: HomeView stays `/`; the landing page lives outside the app.
- Un-pause D3 or start H1–H4 (both wait: D3 on Eston, H1–H4 on gate G2).
- Claim the deployed demo is safe for a binding vote. It isn't until the guard patch is applied.
