# Gloki

Global direct-democracy platform — communities surface problems, deliberate, propose,
vote, and turn decisions into mandates. One app on a real decentralized network (IBC nodes);
any page can also be opened as a **demo variant** on sample data by adding `?demo=true` to its
URL — see [docs/DEMO_MODE.md](./docs/DEMO_MODE.md).

## Run

```bash
npm install
npm run dev        # local dev server (Vite + HMR), full app
npm run dev:beta   # the beta trim (sign-up, verification, forum)
npm run build      # production build — runs tsc -b; must pass before deploy
```

The real network is [ibc-go](https://github.com/ouripoupko/ibc-go): every user signs in on their own
node with a passkey. Builds need `VITE_APPLICATION_SERVER_URL`, `VITE_APPLICATION_AGENT` and
`VITE_APPLICATION_SETTINGS_CONTRACT`: the central application account's node, its agent id and its
settings contract (`.env` says how to make them; override in `.env.local`, e.g.
`VITE_APPLICATION_SERVER_URL=http://localhost:2611` for a local node — use `localhost`, not `127.0.0.1`:
passkeys need it).

## Branches

`main` is the trunk: branch off it for a feature and merge back often. GitHub Pages is deployed by
hand (Actions → Run workflow): the beta at the site root.

## Start here

See **[CLAUDE.md](./CLAUDE.md)** for architecture, patterns, and conventions,
**[docs/DEMO_MODE.md](./docs/DEMO_MODE.md)** for the real/demo page structure, and
**[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** for UI standards.
