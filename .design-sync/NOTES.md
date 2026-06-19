# design-sync notes — Gloki

## What this repo is
An **app** (Vite + React 19 + SCSS modules), **not** a component library: `package.json` is `private:"q"`, no library `exports`/`dist`, no Storybook. The DS sync targets the **curated context-free primitives** in `src/components/shared/`.

## Shape: package, via a Vite **library** build (not the repo's own dist)
- The converter's bundler is **esbuild, which has no `.scss` loader** — and every shared component imports `.module.scss`. So we can't point the converter at `src/` (synth-entry) or the app's `dist/` (that's the app bundle).
- Fix: a dedicated **Vite library build** at `.design-sync/lib-build/` (`entry.ts` re-exports the curated set; `vite.config.ts` externalizes React) → `.design-sync/.cache/lib-dist/{index.js,q.css}`. Vite compiles the SCSS modules (hashes baked into the CSS); esbuild's default CSS loader preserves them. `cfg.buildCmd` runs this; `--entry` points at `lib-dist/index.js`, `cfg.cssEntry` at `lib-dist/q.css`.

## Scope: 10 context-free primitives only
Button, Card, Modal, Badge, Banner, Stepper, SegmentedControl, EmptyState, CountryFlag, GlokiMark. These need **no provider**.
The other `src/components/shared/*` (StageFooter, NotificationsBell, PageHeader, SearchableSelect, RoleChip/RoleDisplay, LanguageSwitcher, `presence/*`, `connectivity/*`) are **app-coupled** (`useAppSelector`/`useNavigate`/`useT`) — excluded. Adding them = a later phase: widen `lib-build/entry.ts` + a seeded **Redux + react-router + I18nProvider** `cfg.provider` (drags in store/services/demo).

## .d.ts props come from `cfg.dtsPropsFor` (hand-transcribed)
The Vite lib emits no `.d.ts`, and the converter sources props from the `.d.ts` tree → without this, all props are `[key:string]:unknown`. `dtsPropsFor` is transcribed from the source interfaces; SegmentedControl's generic was simplified to `string`. **Keep dtsPropsFor in sync when a primitive's props change.**

## ⚠️ exFAT `._*` files (the external drive)
The drive creates AppleDouble `._*` files next to every file. They poison the bundle: `package-validate` parses `._Stepper.d.ts` / `._Badge.html` as real components (hundreds of false `[DTS_PARSE]`/`[RENDER]` errors), and `.design-sync/previews/._X.tsx` shows as "stale preview". **After every build/capture and before every validate/upload, run:**
```
find ds-bundle .design-sync -name '._*' -delete
```

## Overrides
- `Modal`: `{cardMode:"single", viewport:"480x360"}` — overlay renders inside the card.

## Known render warns
None outstanding — final validate is 10/10 clean.

## Re-sync risks
- `dtsPropsFor` is hand-maintained — drifts silently if source props change; re-check against `src/components/shared/*.tsx`.
- `.design-sync/.cache/lib-dist/` is gitignored — re-run `cfg.buildCmd` before the converter (the driver does this).
- `lib-build/entry.ts` is the source of truth for WHICH components sync — update it (and componentSrcMap/dtsPropsFor) to add/remove.
- The exFAT `._*` issue is environment-specific (this drive); a clone on a native FS won't have it.
- Auth: this session could not complete `/design-login`; the upload was done separately / later.
