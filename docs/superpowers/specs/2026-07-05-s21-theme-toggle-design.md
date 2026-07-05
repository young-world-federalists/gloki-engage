# S21 — Theme toggle (D2) + menu LanguageSwitcher (M6) — design

**Session 21, 2026-07-05. Campaign Wave 4 (final wave of the S18 UI campaign).**
Base: `ui` @ `0ba50e8` (S20/W3 pushed, tree clean, deploy green).
Source decisions: `2026-07-03-s18-ui-campaign-findings.md` — D2 (Eston-directed) + M6
(S17 Thandiwe major, pulled into W4 because the menu work overlaps).

## Verified premises (re-grounded at HEAD `0ba50e8`, 2026-07-05)

- **300** `@media (prefers-color-scheme: dark)` blocks across **105** SCSS files
  (S20's count holds; S18 counted 297/104 before FeedEngagePanel).
  Byte-uniform header: every one of the 300 is exactly `@media (prefers-color-scheme: dark) {`
  — no `and`-combined queries, no `light` variants.
- Structural audit of all 300 blocks (scripted brace-matcher): 79 top-level, 221 nested
  inside a selector; **zero** `@keyframes`, nested `@media`, or `:global` inside any block;
  the only special selectors inside blocks are `body` (index.scss:104 — safe under a
  descendant-prefix rewrite) and `:root` (index.scss:127 — the ONE special case, since a
  descendant selector can never match the root element).
- Every one of the 105 files already has `@use …/variables' as *;` — a mixin defined in
  `variables.scss` is reachable everywhere with **no import changes**.
- No `data-theme` / `gloki.theme` mechanism exists anywhere (src + index.html grep = 0).
- Nothing sets the CSS `color-scheme` property or a `theme-color` meta; no TS reads
  `matchMedia('(prefers-color-scheme: …)')` (only `prefers-reduced-motion` in CommunityHome).
- `SegmentedControl` (shared, 44px md, tokens, aria-pressed) and `LanguageSwitcher`
  (shared, used on LoginPage) both exist and are reusable as-is.
- `AppHeader` (12 page-level mounts — Home, StageFeed, Community, Identity, mandate,
  onboarding, collaboration views, 404, create-community) self-manages the global
  hamburger → `HomepageMenu` → shared `SlideOutMenu`. The per-community `SlideOutMenu`
  in CommunityView is a separate, community-actions context menu.
- i18n storage-key convention: `gloki.locale` → the theme key `gloki.theme` matches.

## Decisions (session-prompt recommendations, adopted; ratify at the push gate)

Eston is not in-session (autonomous run). All three open decisions ship as the session
prompt's own recommended options and are listed for **explicit ratification at the push
gate** — nothing deploys without Eston's green light either way.

1. **Placement + form**: a labeled 3-segment control (`SegmentedControl`, md/44px,
   fullWidth, text labels only — no segment icons, so fr/sw labels never clip) in a new
   settings section at the bottom of the **global** menu (`HomepageMenu`). The
   per-community menu is unchanged — the global hamburger is present on every screen via
   `AppHeader`, so settings are reachable everywhere without duplicating them.
2. **LanguageSwitcher placement**: same settings section, directly below the theme row;
   the existing shared component reused as-is (its own sr-only label remains the
   select's accessible name; the visible row caption is presentational).
3. **Auto semantics**: `Auto` = **no** `data-theme` attribute; CSS falls through to the
   `prefers-color-scheme` media query inside the mixin. Zero-flash via an inline
   `<head>` snippet that applies the persisted attribute before first paint.

## Mechanism

### State model

| `gloki.theme` localStorage | `<html data-theme>` | Effective scheme |
|---|---|---|
| *(absent — default)* | *(absent)* | Follows the OS (media query) |
| `'light'` | `data-theme="light"` | Forced light |
| `'dark'` | `data-theme="dark"` | Forced dark |

`Auto` **removes** the key (no `'auto'` value is ever stored) — a returning user's
storage stays exactly as pre-S21 unless they opt out of Auto.

### Zero-flash snippet (index.html `<head>`, before the module script)

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('gloki.theme');
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    } catch (e) { /* storage blocked — stay on Auto */ }
  })();
</script>
```

Classic inline script → runs synchronously during head parsing, before any stylesheet
applies and before the deferred module executes. Dev and prod share index.html, so both
modes are covered; `public/404.html` is a pure redirect page (no app render) and needs
nothing.

### The mixins (in `variables.scss`, so all 105 files see them via the existing `@use … as *`)

```scss
@mixin dark {
  @if & {
    @media (prefers-color-scheme: dark) {
      :where(html:not([data-theme='light'])) & { @content; }
    }
    :where(html[data-theme='dark']) & { @content; }
  } @else {
    @media (prefers-color-scheme: dark) {
      :where(html:not([data-theme='light'])) { @content; }
    }
    :where(html[data-theme='dark']) { @content; }
  }
}

// For blocks whose subject IS the root element (custom-property overrides):
// the descendant form above can never match `:root` itself.
@mixin dark-self {
  @media (prefers-color-scheme: dark) {
    &:where(:not([data-theme='light'])) { @content; }
  }
  &:where([data-theme='dark']) { @content; }
}
```

**Why `:where()`**: it contributes **zero specificity**, so in Auto mode the compiled
selector (`:where(html:not([data-theme='light'])) .foo` inside the same media query)
has *identical specificity and source position* to today's `.foo` — the cascade is
byte-for-byte equivalent when no attribute is set. Forced dark emits the same `@content`
a second time outside the media query (same source position → same order semantics);
forced light simply never matches either branch. CSS payload grows by roughly the dark
rules' size (~one extra copy); measured at build time, accepted.

**`@if &`** branches nested includes (221 — parent selector exists, dark rules attach to
it) from top-level includes (79 — content already carries its own selectors, e.g. the
`body` block in index.scss, which compiles to `:where(html[data-theme='dark']) body` ✓).

**The one special case** — index.scss:127's region-color `:root` block becomes:

```scss
:root {
  @include dark-self {
    --region-africa: #e8a33d;
    /* …unchanged declarations… */
  }
}
```

compiling to `:root:where(:not([data-theme='light']))` / `:root:where([data-theme='dark'])`
— both (0,1,0), the same specificity as today's `:root` inside the media query.

**Deliberately NOT introduced**: the `color-scheme` CSS property. Nothing sets it today,
so native widgets/scrollbars render light-scheme even under system dark; forcing themes
must not change that baseline. Filed as a possible post-handoff polish item, not W4 scope.

### Theme service — `src/hooks/useTheme.ts`

Small self-contained module (mirrors the i18n provider's storage pattern; no Redux —
the value must also be readable pre-React by the head snippet, and `preferencesSlice`
is community-prefs, not chrome):

- `type ThemePreference = 'auto' | 'light' | 'dark'`
- `getStoredTheme()` — validated read, `'auto'` fallback (mirrors `getStoredLocale`)
- `setTheme(pref)` — persists (`removeItem` for auto), sets/removes the `data-theme`
  attribute, notifies subscribers
- `useTheme()` — `useSyncExternalStore`-based hook returning `{ theme, setTheme }`

Attribute changes re-evaluate CSS live — no reload needed when tapping segments.

## Codemod (its own mechanical commit)

Deterministic script (python3, scratchpad; not committed — the diff is the artifact):

1. index.scss `:root` block rewritten first (manual/targeted, `dark-self` form above).
2. Global exact-string swap in `src/**/*.scss`:
   `@media (prefers-color-scheme: dark) {` → `@include dark {`
   (works identically for the 286 multi-line and 14 single-line blocks — everything
   after the `{` on the line is preserved untouched).

**Byte-safety proof (run before committing):**
- `grep -rn "prefers-color-scheme" src --include='*.scss'` = **0**
- Scripted diff check over `git diff -U0`: every `-` line is the media header (or one of
  the 4 lines of the `:root` special case), every `+` line is the same line with only the
  wrapper swapped (or the `dark-self` wrapper) — i.e. **no declaration bytes changed**.
- `npx tsc -b` + `npm run build` clean; built CSS compiles (sass validates the mixin).

## Menu UI (Chunk C)

- `SlideOutMenu` gains an optional `footer?: React.ReactNode` slot: rendered below the
  items list, separated by the existing divider treatment, inside the focus trap
  (focusables query already covers selects/buttons). Generic — no app coupling.
- New `src/components/shared/MenuSettings.tsx` (+ module.scss): two labeled rows —
  caption **Theme** + the 3-segment control; caption **Language** + `LanguageSwitcher`.
  Captions use the `$gray-500` caption token; rows meet the 44px floor via the controls
  themselves. Exported from `shared/index.ts`.
- `HomepageMenu` passes `footer={<MenuSettings />}`. CommunityView's menu: unchanged.

### i18n keys (inline `t()` defaults + fr/sw overlays, same commit; packet appended)

| Key | en (inline default) | fr | sw |
|---|---|---|---|
| `menu.theme` | Theme | Thème | Mandhari |
| `menu.themeAuto` | Auto | Auto | Otomatiki |
| `menu.themeLight` | Light | Clair | Mwangaza |
| `menu.themeDark` | Dark | Sombre | Giza |
| `menu.language` | Language | Langue | Lugha |

`menu.themeAuto/Light/Dark` double as the segments' visible labels; the control's
group `aria-label` is `menu.theme`.

## Verification (per the S18 D2 decision: 3-mode, per touched route class)

Matrix at 360px on the S19/S20 surfaces (HomeView, /stage feed, community feed,
expanded vote card, /welcome, menu itself):

| Mode | System light | System dark |
|---|---|---|
| Auto (default) | = today's light | = today's dark |
| Forced Light | light | **light** (the new capability) |
| Forced Dark | **dark** (the new capability) | dark |

Plus: persistence across reload (snippet path), live toggle without reload, language
switch en→fr→sw without logout, focus trap still sound with the footer, grep gates,
parity scanner, `tsc -b`, full build. Preview lore applies: colorScheme emulation
resets on navigation — reload after every flip before reading.

## Risks / rollback

- **Specificity regressions in Auto mode**: neutralized by `:where()` (zero added
  specificity) — Auto compiles to the same cascade as today.
- **Forced-dark double emission** beating later light overrides at equal specificity:
  the duplicate sits at the same source position as the media block it replaces, so
  relative order vs. neighboring rules is unchanged.
- Rollback is a single `git revert` of the mechanical commit (pure wrapper swap) —
  no declaration content moves.

## Explicitly out of scope

`color-scheme` property, theme-aware `theme-color` meta, per-community themes,
Chichewa locale (P5 tail, unchanged), community-menu settings duplication.

## Addendum (same session, at Chunk B) — the color-scheme premise was wrong

The premise "nothing sets the CSS `color-scheme` property" was **false**: the
verification grep covered TS/TSX/HTML but not SCSS, and `src/styles/index.scss:14`
sets `color-scheme: light dark` on `:root`. That flips the design the right way up:
native widgets/scrollbars *already follow the OS scheme* today, so a forced theme
MUST override `color-scheme` or form controls would contradict the forced app
styles. Shipped accordingly (in the codemod commit, since it surfaced there):

```scss
:root {
  color-scheme: light dark;
  &[data-theme='light'] { color-scheme: light; }
  &[data-theme='dark'] { color-scheme: dark; }
}
```

"Explicitly out of scope: color-scheme property" above is superseded by this
addendum. Lesson for the premise table: grep ALL file classes a property can
live in — `color-scheme` is CSS, and the sweep only searched markup and code.
