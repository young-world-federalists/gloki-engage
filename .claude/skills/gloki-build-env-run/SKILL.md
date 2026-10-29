---
name: gloki-build-env-run
description: Use when setting up the Communities2/Gloki repo from scratch, running or previewing the app, building, typechecking, checking a GitHub Pages deploy, understanding WHY assets 404 on Pages (base-path modes), the required .env build settings, the beta build, or why the external USB drive stalls under parallel I/O, wondering about mock-server.cjs or Node versions, or choosing which npm script to run (symptom-first triage of a live failure: gloki-debugging-playbook). Keywords - npm run dev, dev:beta, build:prod, build:beta, tsc -b, deploy.yml, .env, .env.local, VITE_APPLICATION_SERVER_URL, gloki-engage, base path, /demo/, 404.html, slow USB drive, launch.json, ibc node, Docker, OrbStack, localhost:2611, real backend, execution.log.
---

# Gloki: Build, Environment, Run & Deploy

## Overview

One app on the real network (IBC nodes); any page can also show its demo variant at `?demo=true`
(`docs/DEMO_MODE.md`). The build is the only CI: `tsc -b` runs first, so one TypeScript error —
including an unused import — fails the GitHub Pages build, and the site keeps serving the previous
version. There is **no test framework**: verification is the dev server plus the browser
(**gloki-verification-and-qa**).

## When NOT to use this skill

| You actually need | Use instead |
|---|---|
| Push/merge rules, change classes, locked product decisions | **gloki-change-control** |
| The session workflow around a build | **gloki-session-lifecycle** |
| Real vs demo data, DEMO_VERSION, seeding, the seam | **gloki-seam-and-demo-data** |
| Python contract dialect and immutability | **gloki-python-contracts** |
| Directory map, flow registry, Redux, routing | **gloki-frontend-architecture** |
| A bug you're triaging | **gloki-debugging-playbook** |
| Proving a change works | **gloki-verification-and-qa** |
| fr/sw parity | **gloki-i18n-playbook** |

## Setting up

```bash
nvm use          # .nvmrc pins Node 24, the same as CI
npm ci           # CI-parity install
npm run dev      # Vite dev server on port 7173 (vite.config.ts), base '/'
```

Stack (package.json): React 19, TypeScript ~5.9, Vite 8, Redux Toolkit, sass (SCSS Modules),
react-router-dom 7. The package name is literally `"q"`.

## Required build settings

`vite.config.ts` refuses to start or build without two values:

| Variable | Meaning | Default (in `.env`) |
|---|---|---|
| `VITE_APPLICATION_SERVER_URL` | node of the central application account | `https://gdi.gloki.contact` |
| `VITE_APPLICATION_AGENT` | the central application account, which holds the application settings contract (where the verification contract lives) | `gloki-application` |

Overrides, in increasing priority: `.env` (committed) → `.env.local` (gitignored, per developer) →
environment variables at build time (CI passes the `github-pages` environment's variables).
`src/services/applicationServer.ts` is the only reader. The values are **baked into the bundle at
build time** — nothing on the hosting server can change them afterwards.

For a local node, `.env.local`:

```
VITE_APPLICATION_SERVER_URL=http://localhost:2611
```

Without it, local testing writes verification and settings data to the shared application server.

## Command card

| Command | Expands to | Use for |
|---|---|---|
| `npm run dev` | `vite` | Daily dev, full app, port 7173, base `/` |
| `npm run dev:beta` | `VITE_APP_MODE=beta vite` | The beta trim (sign-up, verification, forum) |
| `npm run build` | `tsc -b && vite build` | Typecheck + local build (base `/`) — **not deployable to Pages** |
| `npm run build:prod` | `tsc -b && vite build --mode production` | Pages build of the full app (base `/gloki-engage/`) |
| `npm run build:beta` | `tsc -b && VITE_APP_MODE=beta vite build --mode production` | Pages build of the beta |
| `npm run lint` | `eslint .` | Manual only — **not run in CI** |
| `npm run preview` / `preview:prod` | `vite preview` (`--mode production`) | Preview a local build |
| `npx --no-install tsc -b --noEmit` | — | Fast typecheck before declaring a change done |

The beta trim (`VITE_APP_MODE`, read only in `src/appMode.ts`) is a build setting that hides parts of
the app. It's independent of `?demo=true`, which works in both builds.

### Dev server for AI sessions: the preview tool

`.claude/launch.json` (gitignored, per developer) can define a preview server **`gloki-dev`** =
`npm run dev`. Start it with the `preview_start` tool rather than a raw `npm run dev`. Subagents share
one preview browser: implementers verify with build/typecheck only, the controlling session drives the
preview (**gloki-verification-and-qa**).

## Base paths

`vite.config.ts`: `base: mode === 'production' ? '/gloki-engage/' : '/'`.

| Build | Base | Consequence |
|---|---|---|
| dev / plain `build` | `/` | Works locally; 404s every asset if deployed to Pages |
| `--mode production` | `/gloki-engage/` | The site root on Pages |
| `--mode production --base /gloki-engage/demo/` | `/gloki-engage/demo/` | The `/demo/` site on Pages (deploy.yml passes it) |

Reproduce a "works locally, broken on Pages" report with `npm run build:prod && npm run preview:prod`.
Never hardcode absolute asset URLs or root-anchored router assumptions. The `@` alias maps to `src/`.

## Deploy pipeline

**Until the trunk switch** (`unified` → `main`), `.github/workflows/deploy.yml` runs on a push to
`server-side` **or** `ui`, and every run rebuilds both:

| Branch checked out | Build | Served at |
|---|---|---|
| `server-side` | `build:prod` (+ the `github-pages` environment's `VITE_APPLICATION_*` variables) | https://young-world-federalists.github.io/gloki-engage/ |
| `ui` | `build:beta -- --base /gloki-engage/demo/` | https://young-world-federalists.github.io/gloki-engage/demo/ |

Node 24, `npm ci` per checkout, then the two `dist/` folders are assembled into one Pages artifact and
deployed (`actions/deploy-pages`, environment `github-pages`). GitHub runs the workflow file **from the
pushed branch**, so the file must be identical on both branches. A push to `unified` doesn't deploy;
pointing the workflow at the trunk is part of the switch.

- **A failed deploy** shows in the Actions tab (`gh run list`), not in Pages settings; the site keeps
  serving the previous build.
- **"Everything broken right after a deploy"** for a returning visitor = stale SPA chunk cache; a hard
  refresh fixes it.
- Both sites share one origin, so they share localStorage (`user`, `gloki.*`). Signing in or out in one
  can affect the other in the same browser.

```bash
gh run list --limit 3
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/   # expect 200
```

## SPA deep links: the redirect pair

GitHub Pages has no rewrites; deep links work through two files that must never be deleted or
"simplified":

1. **`public/404.html`** — served for any unknown path. Keeps the base segment (`/gloki-engage`, or two
   segments `/gloki-engage/demo` under `/demo/`) and moves the rest into a query
   (`/gloki-engage/?/community/x/feed`, `&` encoded as `~and~`).
2. **`index.html` inline decoder** — detects `?/`, decodes `~and~`, and `history.replaceState`s the real
   route before React loads.

`public/` holds `404.html`, `icon.svg` and `vite.svg` — all stay.

## TypeScript strictness = the deploy gate

`tsconfig.app.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`,
`erasableSyntaxOnly`, `noUncheckedSideEffectImports`, `noFallthroughCasesInSwitch`, `noEmit`.

- An unused import or variable fails `tsc -b` and the Pages build. Run
  `npx --no-install tsc -b --noEmit` before declaring any change done.
- `verbatimModuleSyntax`: type-only imports use `import type`.
- `src/obsolete` is excluded from typechecking — a green build says nothing about code there.

## mock-server.cjs is dead — never start it

`mock-server.cjs` at the repo root is an old standalone Express mock of the node API (port 3001). Nothing
in `src/` uses it; `express` and `cors` in `dependencies` exist only for it. Removing them is a
**gloki-refactor-and-dead-code** job.

## Real backend: a local ibc node

Ouri publishes the node as `ghcr.io/ouripoupko/ibc:latest` (public, amd64 + arm64,
github.com/ouripoupko/ibc). Compose runs ibc, mongo:7 and redis:8 and serves the API at
`http://localhost:2611`, bound to 127.0.0.1.

### Start it

```bash
docker version && docker compose version
mkdir -p ~/ibc-node && cd ~/ibc-node          # on a Mac, never on the USB drive
curl -O https://raw.githubusercontent.com/ouripoupko/ibc/main/compose.yml
docker compose up -d && docker compose ps     # mongo/redis healthy, ibc "Up"
curl -s 'http://localhost:2611/ibc/app/probe?action=is_exist_agent'   # → false
```

- `open Dockerfile: no such file or directory` means the **pull** failed and compose fell back to
  `build: .`; `docker compose pull` prints the real cause.
- **Cloud sessions**: start the daemon first (`dockerd > /tmp/dockerd.log 2>&1 &`, then `docker info`),
  and the environment's network access must allow `ghcr.io` and `pkg-containers.githubusercontent.com`,
  or the pull gets `403`. Everything is gone when the session ends.
- Don't change `compose.yml` or the port binding: writes carry the identity key in the URL with no
  signature, so the node must stay on localhost.
- `docker compose stop` pauses; `docker compose down -v` **wipes all data**.

### Point the app at it

- `.env.local` with `VITE_APPLICATION_SERVER_URL=http://localhost:2611` (above), then restart Vite.
- `npm run dev -- --strictPort --host 127.0.0.1` and open **http://127.0.0.1:7173** (without `--host`,
  Vite may bind only IPv6 on macOS).
- On the login page change **Server URL** to `http://localhost:2611`, or the session registers on the
  live network.
- Test seeding (`VITE_ENABLE_TEST_SEEDING` or its localStorage flag) auto-deploys initiatives for
  communities with "test" in the name on localhost.
- The Pages site can't use a local node cleanly: browsers block or prompt a public https page calling
  `localhost`.

### Smoke test (one minute)

```bash
B=http://localhost:2611; K="smoke-$(date +%s)"; TMP=$(mktemp -d)
cp src/assets/contracts/gloki_engage_initiative_contract.py "$TMP/c.py"
curl -s -X PUT -H 'Content-Type: application/json' -d "{\"address\":\"$B\"}" "$B/ibc/app/$K?action=register_agent" >/dev/null
python3 -c 'import json,sys;print(json.dumps({"name":"smoke","contract":"gloki_engage_initiative_contract.py","code":open(sys.argv[1]).read(),"constructor":{},"protocol":"BFT","default_app":"","pid":sys.argv[2],"address":sys.argv[3],"profile":""}))' "$TMP/c.py" "$K" "$B" > "$TMP/d.json"
curl -s -X PUT -H 'Content-Type: application/json' --data @"$TMP/d.json" "$B/ibc/app/$K?action=deploy_contract" >/dev/null; sleep 4
C=$(curl -s "$B/ibc/app/$K?action=get_contracts" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
curl -s -X POST -H 'Content-Type: application/json' -d '{"values":{"agent":"m1"}}' "$B/ibc/app/$K/$C/upvote?action=contract_write" >/dev/null; sleep 3
curl -s -X POST -H 'Content-Type: application/json' -d '{"values":{}}' "$B/ibc/app/$K/$C/get_tally?action=contract_read"   # → {"down":0,"total":1,"up":1}
```

(The issue contract's member methods take the member's key as `agent` — **gloki-python-contracts**.)

### Reading what happened

- Every request: `docker compose logs -f ibc`.
- **Every write and its real return value**: `docker compose exec ibc tail -f execution.log` — check this,
  not the HTTP status. Also `dispatcher.log`, `consensus.log`.
- State: `GET /ibc/app/<key>?action=get_contracts`; `POST …/<key>/<contract>/<method>?action=contract_read`
  with `{"values":{}}`. Writes return only an ack id; the return value arrives on
  `GET /stream?agent=<key>&contract=` (SSE). Node docs:
  `docker compose exec ibc cat docs/blockchain-api.md docs/contract-api.md`.
- A second identity on the same contract: register it, then `PUT /ibc/app/<key2>?action=join_contract`
  with `{"contract","address","agent":<a holder>,"profile":""}`.

### What a real node taught us

| Behaviour | Consequence |
|---|---|
| Responses are always HTTP 200; errors are JSON values | Check the body or `execution.log`, never the status code |
| A write's SSE `reply` carries the method's return value | Refusals (`{error}`) reach the UI through `contractWrite` |
| A method the contract doesn't define returns `null` (read) or a normal ack (write) | Silent. The app still calls `record_activity`, `get_stage_permissions` (community) and `get_initiative` (initiative), which the real contracts don't define |
| `_`-prefixed methods are hidden from the method list but callable by anyone | Don't write inside `_` helpers |
| `Storage.append()` mints a different ObjectId in each partner's copy, and `append_id in collection` is always False | Key documents yourself when ids must agree or be looked up — **gloki-python-contracts** §2 |

## Eston's machine: the slow external USB drive

On Eston's Mac the repo lives on an external USB drive (path with spaces and emoji — quote it) that is
**flaky under parallel I/O**: ~15 parallel reads once froze all repo I/O for minutes, with stale git
output. There:

| Rule | Why |
|---|---|
| Small sequential batches — 1–3 file reads at a time | Parallel I/O has frozen the drive |
| Targeted greps with specific paths; never scan `node_modules/` or `dist/` | The classic freeze trigger |
| When git output disagrees with reality, trust `git rev-parse HEAD` and `gh` | The stat cache goes stale; `git update-index -q --refresh` clears phantom changes |
| Ignore `._*` AppleDouble files | macOS litters them; gitignored |
| Subagents sequentially, never parallel worktrees | Too slow for parallel checkouts |
| BSD sed/grep have no `\s` | Use literal-space classes; the i18n parity recipe is in **gloki-i18n-playbook** |

## Worked example: ship-readiness check

```bash
npx --no-install tsc -b --noEmit        # the exact check that fails the deploy
npm run build:prod                       # deploy-parity build of the full app
npm run build:beta                       # and of the beta
npm run lint                             # manual — CI won't catch lint errors
# then verify in the running app (gloki-verification-and-qa),
# then STOP: present results and wait for an explicit go before any push
```

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Volatile facts:

| Fact | Re-verify with |
|---|---|
| npm scripts | `grep -A12 '"scripts"' package.json` |
| Dev port, base switch, required env | `cat vite.config.ts` |
| Node version | `cat .nvmrc`; `grep node-version .github/workflows/deploy.yml` |
| Deploy branches and builds | `cat .github/workflows/deploy.yml` |
| 404.html segment rule | `grep -n pathSegmentsToKeep public/404.html` |
| tsconfig flags | `cat tsconfig.app.json` |
| mock-server.cjs unreferenced | `grep -rn "mock-server\|localhost:3001" src/` (expect none) |
| Live site | `curl -s -o /dev/null -w '%{http_code}' https://young-world-federalists.github.io/gloki-engage/` |
