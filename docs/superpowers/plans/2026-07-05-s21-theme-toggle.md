# S21 plan — theme toggle codemod + menu LanguageSwitcher

Spec: `docs/superpowers/specs/2026-07-05-s21-theme-toggle-design.md`. Base `0ba50e8`.
Direct execution (cross-cutting SCSS sweep + ONE preview — not subagent-safe; S10/S11/S13
precedent). Each chunk leaves `ui` runnable and builds clean.

| # | Commit | Files | Verification |
|---|---|---|---|
| 0 | `docs(s21): spec + plan` | this file + the spec | — |
| A | `feat(s21): theme mechanism — dark/dark-self mixins, gloki.theme service, zero-flash head snippet` | `src/styles/variables.scss` (mixins), `src/hooks/useTheme.ts` (new), `index.html` (snippet) | sass unit-compile of both mixins (nested + top-level + `:root` shapes, assert emitted selectors); `tsc -b`; build |
| B | `chore(s21): codemod — 300 prefers-color-scheme blocks → @include dark (mechanical)` | 105 `*.scss` files; `src/styles/index.scss` `:root` block → `dark-self` | grep `prefers-color-scheme` in src = 0; scripted byte-safety diff check (only wrapper lines changed); `tsc -b`; full build; CSS size delta noted |
| C | `feat(s21): menu settings — Auto/Light/Dark toggle + LanguageSwitcher (D2+M6) + fr/sw keys` | `SlideOutMenu.tsx/.module.scss` (footer slot), `MenuSettings.tsx/.module.scss` (new), `shared/index.ts`, `HomepageMenu.tsx`, `src/i18n/fr.ts`, `src/i18n/sw.ts` | parity scanner `PARITY OK`; `tsc -b`; build |
| D | controller preview walk | — | 3-mode × system-scheme matrix at 360px (spec table); persistence; live toggle; fr/sw menu; grep gates |
| E | whole-diff review → fixes | — | 0 Critical / 0 Important |
| F | `docs(s21): closeout` — MASTER_TODO §8 + §7 campaign line, i18n packet Session-21 section, next-session note | docs | packet keys cross-checked vs HEAD |

**No DEMO_VERSION bump** (no fixtures touched). **Push held for Eston's explicit green
light**, with the three adopted recommendations listed for ratification.
