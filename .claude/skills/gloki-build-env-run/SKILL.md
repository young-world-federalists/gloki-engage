---
name: gloki-build-env-run
description: Use when setting up the Communities2/Gloki repo from scratch, running or previewing the app, building, typechecking, checking a GitHub Pages deploy, understanding WHY assets 404 on Pages (base-path modes) or why the external USB drive stalls under parallel I/O, wondering about mock-server.cjs or Node versions, or choosing which npm script to run (symptom-first triage of a live failure: gloki-debugging-playbook). Keywords - npm run dev, build:prod, tsc -b, deploy.yml, gloki-engage, base path, 404.html, slow USB drive, launch.json.
---

# Gloki: Build, Environment, Run & Deploy

## Overview

Core principle: **a push to `ui` IS a production deploy.** There is no staging. The GitHub
Actions workflow builds on every push to `ui` and publishes to the live GitHub Pages demo,
and the build script starts with `tsc -b` — so a single TypeScript error (including an
unused import) silently blocks the deploy in the Actions tab. Everything in this skill
exists to keep that pipeline green and to keep you productive on this repo's unusual
environment: a slow, flaky-under-parallel-I/O external USB drive.

Two things this app does NOT have, by design:

- **No backend.** This is the `ui` branch — a UI-only mockup. All data flows through the
  "seam" (`src/services/api.ts`) into an in-browser mock layer (`src/services/demo/`)
  backed by localStorage. Details belong to **gloki-seam-and-demo-data**.
- **No test framework.** No test script exists in package.json. Verification = dev server +
  browser DevTools/preview tools. See **gloki-verification-and-qa** for what counts as evidence.

## When NOT to use this skill

| You actually need | Use instead |
|---|---|
| Push/merge rules, who green-lights deploys, locked product decisions | **gloki-change-control** |
| The session workflow around a build (spec → plan → build → review → push gate) | **gloki-session-lifecycle** |
| Demo data, DEMO_VERSION bump rules, localStorage seeding, the api.ts seam | **gloki-seam-and-demo-data** |
| Python contract dialect and immutability patterns | **gloki-python-contracts** |
| Directory map, flow registry, Redux, routing | **gloki-frontend-architecture** |
| A bug you're triaging (symptom → experiment) | **gloki-debugging-playbook** |
| Proving a change works (preview automation, review tiers) | **gloki-verification-and-qa** |
| fr/sw parity checks, translation packets | **gloki-i18n-playbook** |

## Environment recreation from scratch

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
node --version   # need >= 22 to match CI (see below); Vite 7 requires 20.19+/22.12+
npm ci           # CI-parity install; npm install also works but ci matches deploy.yml
npm run dev      # Vite dev server, default port 5173, base '/'
```

**Node version:** there is NO `.nvmrc` and NO `engines` field in package.json (verified).
CI pins **Node 22** via `actions/setup-node` in `.github/workflows/deploy.yml`. Any modern
Node works locally (the dev machine runs v25.x), but if a build behaves differently from
CI, match Node 22 first.

**Stack** (from package.json): React 19, TypeScript ~5.8, Vite 7, Redux Toolkit, sass
(SCSS Modules), react-router-dom 7. Package name is literally `"q"` — don't be confused.

## Canonical command card

Every script verified against `package.json` @ c26cdc4:

| Command | Expands to | Use for |
|---|---|---|
| `npm run dev` | `vite` | Daily dev. Port 5173, serves at base `/`. |
| `npm run build` | `tsc -b && vite build` | Typecheck + local build (base `/`). **NOT deployable to Pages** — see base-path trap. |
| `npm run build:prod` | `tsc -b && vite build --mode production` | Deploy-parity build (base `/gloki-engage/`). What CI runs. |
| `npm run lint` | `eslint .` | Manual only — **lint is NOT run in CI** (deploy.yml has no lint step). |
| `npm run preview` | `vite preview` | Preview a plain `build` at base `/`. |
| `npm run preview:prod` | `vite preview --mode production` | Preview a `build:prod` — the only local Pages-parity check. |
| `npx --no-install tsc -b --noEmit` | — | Fast typecheck without bundling. Already in the project allowlist. Run before every push candidate. |

There is **no `test` script**. Do not go looking for vitest/jest config; it does not exist.

### Dev server for AI sessions: the preview tool

`.claude/launch.json` (gitignored — per-developer, recreate if missing) defines the preview
server **`gloki-dev`** = `npm run dev` on port 5173 with `autoPort: true`. Start it with the
`preview_start` tool (name `gloki-dev`), not with a raw Bash `npm run dev`:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "gloki-dev", "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"], "port": 5173, "autoPort": true }
  ]
}
```

**Subagent rule (confirmed by Eston 2026-07-02):** subagents run SEQUENTIALLY and share ONE
preview browser; implementer subagents verify via build/typecheck only, the controller
session drives the preview. The full rule, the S9 incident behind it, and the
preview-automation lore live in **gloki-verification-and-qa**.

## The two-mode base-path trap

`vite.config.ts` (verified):

```ts
base: mode === 'production' ? '/gloki-engage/' : '/'
```

| Mode | Base | Consequence |
|---|---|---|
| dev / plain `build` | `/` | Works locally; **404s every asset if deployed to Pages** (Pages serves at `/gloki-engage/`). |
| `--mode production` | `/gloki-engage/` | What the live site needs; **404s locally under plain `vite preview`**. |

Rules that follow:

- Deploys must use `build:prod`. CI already does; never hand-upload a plain `build`.
- To reproduce a "works locally, broken on Pages" report: `npm run build:prod && npm run preview:prod`.
- Never hardcode absolute asset URLs or root-anchored router assumptions — they must
  survive both bases. The `@` alias maps to `src/` (also in vite.config.ts).

## Deploy pipeline — precisely

**Mechanism** (verified in `.github/workflows/deploy.yml`): push to branch `ui` →
GitHub Actions workflow "Deploy to GitHub Pages" → `build` job (ubuntu, Node 22, `npm ci`,
`npm run build:prod`, `upload-pages-artifact` from `dist/`) → `deploy` job
(`actions/deploy-pages@v5`, environment `github-pages`) → live at:

```
https://young-world-federalists.github.io/gloki-engage/
```

(Org name has hyphens and plural "federalists" — easy to mistype. The `/gloki-engage/`
base matches the repo name; remote = `https://github.com/young-world-federalists/gloki-engage.git`.)

Note: CLAUDE.md says "GitHub Pages: configured via repo Settings → Pages, source branch
`ui`" — that phrasing is imprecise. The trigger is a push to `ui`, but the deploy is
Actions-artifact based, not branch-served. Practical consequence: **when a deploy fails,
look at the Actions tab / `gh run list`, not Pages settings.** A `tsc -b` error fails the
`build` job and the site silently keeps serving the previous deploy.

**Change control (non-negotiable):** never push to `ui` without Eston's explicit green
light — the push deploys to production. Never merge or touch `main` yourself; ui→main
lands via Ouri (the backend partner). See **gloki-change-control**.

### Checking a deploy

```bash
gh run list --limit 3                 # expect: completed  success  <commit msg>  Deploy to GitHub Pages  ui  push ...
gh run watch                          # follow an in-flight run
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/   # expect 200
```

Both the curl of the live URL and `gh` are in the project's existing allowlists.

### Deploy lore that prevents wasted debugging

- **PR #20's red ✗ is NOT a build failure.** It's the long-lived ui→main review PR; the ✗
  is an expected merge conflict with `main` (`mergeable: CONFLICTING`). `gh pr checks 20`
  shows build+deploy SUCCESS. This confusion recurred at least 3 times across sessions
  (Jun 2026, recorded in project memory). Reassure, don't re-debug.
- **"Everything broken after a deploy" from a returning visitor = stale SPA cache** —
  the browser holds references to old lazy-chunk hashes. Hard refresh fixes it. It is
  cache, not code (incident 2026-06-23, recorded in project memory).
- Deploys are dist-artifact based; the local `dist/` on disk is a stale gitignored
  artifact, never the deploy source. CI builds fresh.

## SPA deep links: the sacred redirect pair

GitHub Pages has no server-side rewrites, so deep links (e.g.
`/gloki-engage/community/x/feed`) work via two files that must NEVER be deleted or
"simplified" — removing either breaks every deep link and every refresh on a non-root
route in production, while dev keeps working (so the breakage is invisible locally):

1. **`public/404.html`** — Pages serves it for any unknown path. Its script keeps 1 path
   segment (`/gloki-engage`) and redirects the rest into a query:
   `/gloki-engage/?/community/x/feed` (with `&` encoded as `~and~`).
   (Its `<title>` still says "Accord" — known cosmetic legacy, not a bug.)
2. **`index.html` inline decoder** (lines ~9–20) — detects the `?/` query, decodes
   `~and~`, and `history.replaceState`s the real route before React loads.

If a linter, dead-code sweep, or "cleanup" pass flags either script as unused: it is not.
`public/` contains only `404.html`, `icon.svg`, `vite.svg` — all three stay.

## TypeScript strictness = the deploy gate

`tsconfig.app.json` (verified): `strict`, **`noUnusedLocals`**, **`noUnusedParameters`**,
`verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`,
`noFallthroughCasesInSwitch`, `noEmit`.

- An **unused import or variable fails `tsc -b`**, which fails `build:prod`, which blocks
  the Pages deploy. This is the most common way an AI session breaks the pipeline —
  leftover imports after an edit. Run `npx --no-install tsc -b --noEmit` before declaring
  any change done.
- `verbatimModuleSyntax` means type-only imports must use `import type`.
- **`src/obsolete` is excluded from typechecking** (`"exclude": ["src/obsolete"]` in
  tsconfig.app.json) — code there can rot silently and will never fail a build. Don't cite
  a green build as evidence that anything in `src/obsolete` still compiles.
- `tsconfig.json` is a solution file (references app + node configs); tsBuildInfo caches
  live under `node_modules/.tmp/` — wiping node_modules forces a from-scratch typecheck.

## mock-server.cjs is DEAD — never start it

`mock-server.cjs` at the repo root is a pre-demo-era standalone Express mock of Ouri's
real gloki server HTTP API (port 3001, `/ibc/app/...` endpoints, test agent
`test-agent-123`). Verified: **zero references in `src/`**; only
`docs/archive/TESTING_GUIDE.md` mentions it. The `express` and `cors` entries in
`dependencies` exist ONLY for this file. The live stub seam is entirely in-browser:
`src/services/api.ts` → `src/services/demo/mockApi.ts` (localStorage-seeded, gated by the
`DEMO_VERSION` constant — currently `'global-v16'` at `src/services/demo/mockApi.ts:17`;
bump rules in **gloki-seam-and-demo-data**). Do not start mock-server for normal dev, do
not "fix" it, and do not remove express/cors without a decision to delete the file too
(that's a **gloki-refactor-and-dead-code** job, gated by Eston).

## HARD CONSTRAINT: the slow external USB drive

The repo lives on a slow external USB drive that is **flaky under parallel I/O**. A May
2026 incident (recorded in project memory): ~15 parallel reads froze ALL repo I/O for
minutes; git showed a stale stat cache, truncated output, and momentarily wrong refs. A
model unaware of this misdiagnoses I/O stalls and phantom git states as real code
problems. These are rules, not advice:

| Rule | Why |
|---|---|
| Small sequential batches — 1–3 file reads at a time, never a parallel fan-out | Parallel I/O has frozen the drive for minutes |
| Targeted Grep with specific paths; **NEVER scan `node_modules/` or `dist/`** | Recursive greps over those trees are the classic freeze trigger |
| When git status/log/diff disagree with reality, trust `git rev-parse HEAD` and `gh` (e.g. `gh pr view`, `gh run list`) over local porcelain output | The drive's stat cache goes stale; GitHub is authoritative |
| Run `git update-index -q --refresh` when `git status`/`git diff` show phantom changes | Refreshes the stale stat cache; usually the "changes" vanish |
| Ignore `._*` AppleDouble files | macOS litters them on this (exFAT-ish) volume; they're gitignored. They once had to be purged from `.git/objects/pack` |
| Subagents run SEQUENTIALLY, never parallel worktrees | Drive too slow for parallel checkouts; also the shared-preview-browser rule above |
| Quote the path — it contains spaces and emoji | `cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"` |

## macOS tooling notes

- **BSD sed/grep have no `\s`.** A naive `\s`-based extraction produced a huge FALSE i18n
  parity diff in a July 2026 session before being caught. Use literal-space character
  classes (`^ *'[^']+':`) and `comm` on sorted lists. The full working parity recipe is in
  **gloki-i18n-playbook** — don't reinvent it.
- `gh` CLI is installed and authenticated; prefer it for anything remote.

## Worked example: ship-readiness check before asking Eston to push

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
npx --no-install tsc -b --noEmit        # gate 1: the exact check that blocks the deploy
npm run build:prod                       # gate 2: full deploy-parity build (tsc again + vite prod bundle)
npm run lint                             # gate 3: manual — CI won't catch lint errors for you
# then verify visually via preview_start('gloki-dev') — see gloki-verification-and-qa
# then STOP: present results and wait for Eston's explicit green light before any push
```

After Eston green-lights and the push lands:

```bash
gh run list --limit 1                    # expect: completed  success  ...  Deploy to GitHub Pages  ui
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/  # expect 200
```

## Provenance and maintenance

Verified 2026-07-02 @ commit `c26cdc4` (branch `ui`) by direct reads of package.json,
vite.config.ts, .github/workflows/deploy.yml, tsconfig.app.json, index.html,
public/404.html, .claude/launch.json, and live greps/curl. Incident details ("recorded in
project memory") date from Apr–Jul 2026 sessions. Volatile facts and how to re-check them:

| Fact | Re-verify with |
|---|---|
| npm scripts (dev/build/build:prod/lint/preview/preview:prod; no test) | `grep -A8 '"scripts"' package.json` |
| Base path switch on `--mode production` → `/gloki-engage/` | `grep base: vite.config.ts` |
| Deploy trigger = push to `ui`, Node 22, build:prod, deploy-pages | `cat .github/workflows/deploy.yml` |
| No .nvmrc / no engines field | `ls .nvmrc; grep engines package.json` |
| Live URL returns 200 | `curl -s -o /dev/null -w '%{http_code}' https://young-world-federalists.github.io/gloki-engage/` |
| noUnusedLocals/Parameters + src/obsolete exclusion | `cat tsconfig.app.json` |
| mock-server.cjs still unreferenced in src/ | `grep -rn "mock-server\|localhost:3001" src/` (expect no hits) |
| DEMO_VERSION current value/line | `grep -n DEMO_VERSION src/services/demo/mockApi.ts` |
| Latest deploy state | `gh run list --limit 3` |
| PR #20 still conflicting-but-green | `gh pr checks 20` |
