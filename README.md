# Gloki

Global direct-democracy platform — communities surface problems, deliberate, propose,
vote, and turn decisions into mandates. This branch (`ui`) is a **UI-only mockup**: the
interface runs entirely against a stub/mock data layer (`src/services/demo/`), with no
backend.

## Run

```bash
npm install
npm run dev      # local dev server (Vite + HMR)
npm run build    # production build — runs tsc -b; must pass before deploy
```

## Branches

`main` (live / upstream) → `new-features` (server-call layer) → `ui` (this branch, UI + stubs).
`ui` deploys to GitHub Pages on push.

## Start here

See **[CLAUDE.md](./CLAUDE.md)** for architecture, patterns, and conventions, and
**[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** for UI standards.
