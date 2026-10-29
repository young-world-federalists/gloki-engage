# Session 21 — Campaign Wave 4: theme toggle codemod + menu LanguageSwitcher (D2 + M6)

**Written 2026-07-04 at the end of S20 (campaign W3). HEAD at write time: local `ui` @ S20
closeout (W3 push pending Eston's gate at S20 close — re-check). Goal owner: Eston. Final wave
of the S18 campaign.**

## Mission

**D2 (Eston-directed, S18):** a 3-state **Auto / Light / Dark** theme control in the hamburger
menu. Mechanism per the S18 findings doc: `data-theme` attribute on `<html>` + `gloki.theme`
localStorage + a `dark` SCSS mixin, with a codemod rewriting every `@media
(prefers-color-scheme: dark)` block to the mixin — **300 blocks across 105 SCSS files at S20
count** (S18 counted 297/104; S20 added FeedEngagePanel.module.scss — RE-COUNT, S21 may drift:
`grep -rn "prefers-color-scheme" src --include='*.scss' | wc -l`).

**M6 (S17 Thandiwe major, parked Post-handoff, pulled into W4 because the menu work overlaps):**
a LanguageSwitcher entry in the slide-out menu — after login the only language control is on
LoginPage, so switching currently means logging out. Placement/product call is Eston's.

## ⚠️ Re-verify these premises vs HEAD before building (9 straight sessions caught rot)

| Premise (true at S20 close) | Check |
|---|---|
| S20 W3 pushed (or still local — affects diff base) | `git status -sb`, `git log origin/ui..ui` |
| 300 dark-mode media blocks / 105 files | the grep above + `grep -rln … \| wc -l` |
| Hamburger menu component + its current entries (where the toggle/switcher land) | read the AppHeader menu component at HEAD |
| LanguageSwitcher exists as a reusable component (LoginPage uses it) | `grep -rn "LanguageSwitcher" src -l` |
| No `data-theme` / `gloki.theme` mechanism exists yet | `grep -rn "data-theme\|gloki.theme" src index.html` |
| Preview colorScheme emulation resets on nav; reload after flip before screenshots (S18/S19 lore) | gloki-verification-and-qa |
| `$primary-on-dark` usage sites (the codemod must not break token semantics) | `grep -rln "primary-on-dark" src \| wc -l` |

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle` + `gloki-verification-and-qa`.
2. `docs/superpowers/specs/2026-07-03-s18-ui-campaign-findings.md` — D2 decision text + M6.
3. Memory: `project_session18_jul2026` (codemod scope note), `project_session20_jul2026`.

## Workflow + constraints

- Docs-first spec+plan commits, then the codemod as its own mechanical commit (reviewable diff:
  mixin definition first, then the rewrite, then the toggle UI), `npx tsc -b` + full build per
  chunk; the codemod must be byte-safe (same declarations, only the wrapper changes).
- 3-mode verification per touched route class: Auto (system light + system dark), forced Light,
  forced Dark — the S18 D2 decision explicitly asked for 3-mode route verification.
- Menu strings via `t()` + fr/sw parity + packet append. New product surface (toggle placement,
  labels, LanguageSwitcher position) = recommend-then-confirm with Eston BEFORE building.
- No DEMO_VERSION bump (no fixtures). Sequential subagents; controller owns the ONE preview.

## Open decisions to lock with Eston (batch)

1. **Toggle placement + form** in the menu (recommend: a 3-segment control near the bottom,
   Auto default — matches OS conventions).
2. **LanguageSwitcher placement** (recommend: same menu section as the theme control; reuse the
   LoginPage component as-is).
3. **Auto semantics** (recommend: `Auto` = no `data-theme` attribute, CSS falls through to the
   media query inside the mixin — zero-flash on load via an inline head snippet).

## Definition of done

All routes render correctly in forced-light/forced-dark/auto (spot-walk the S19/S20 surfaces at
360px); zero remaining raw `prefers-color-scheme` blocks in `src` SCSS (grep = 0, all via mixin);
theme persists across reload; menu has working language switching without logout (en/fr/sw);
build/parity/gates green; whole-diff review 0 Crit / 0 Imp; **Eston's explicit push green
light**. Closeout: §8 changelog, packet, memory (campaign DONE — note it), §7 campaign line
closed, next-session prompt (or a "campaign complete, back to §7 tail" note).
