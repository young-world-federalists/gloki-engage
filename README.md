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

Builds need `VITE_APPLICATION_SERVER_URL` and `VITE_APPLICATION_AGENT` (defaults in `.env`;
override in `.env.local`, e.g. `VITE_APPLICATION_SERVER_URL=http://localhost:2611` for a local node).

## Branches

`unified` is the trunk (to become `main`): branch off it for a feature and merge back often.
`server-side` and `ui` are the retiring two-branch model and still feed GitHub Pages until the
switch (site root: full app; `/demo/`: beta).

## Start here

See **[CLAUDE.md](./CLAUDE.md)** for architecture, patterns, and conventions,
**[docs/DEMO_MODE.md](./docs/DEMO_MODE.md)** for the real/demo page structure, and
**[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** for UI standards.
