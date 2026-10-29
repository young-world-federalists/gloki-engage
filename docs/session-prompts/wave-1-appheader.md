# Wave 1 — The single global `AppHeader` (replace `PageHeader` + `GlobalHeader`)

**Part of:** the hierarchy + accessibility redesign — see [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md).
**Branch:** `ui` · **Wave 0 already shipped** (AA contrast + reduced-motion, commit `572d135`).
**This is the keystone wave.** It is the root-cause fix for the double top-bar, every duplicated title, the buried community name, and a cluster of landmark/heading a11y defects across 10 surfaces.

---

## Goal

Build **one** light, sticky global header — `AppHeader` — and use it on every screen, **deleting `PageHeader`** (and its dead `single-row` layout) and folding in `GlobalHeader`. After this wave:

- There is exactly **one** top bar on every screen (no GlobalHeader-stacked-on-PageHeader).
- The Gloki wordmark renders **once**.
- The **community name appears in persistent chrome** on community pages (today it's only in the slide-out menu).
- Every screen has exactly **one `<h1>`** inside **one `<header>` landmark**, plus a **skip link** to a `<main>` landmark.
- The header **never** carries a page-level primary CTA (CTAs stay in content / thumb zone).
- The header is **light** (the dark `$gray-800` "homepage" hero is retired).

> **Scope discipline:** this wave swaps the header and takes the structural wins it directly unlocks (dedupe titles, surface community name, single h1, light chrome, skip-link/main). It does **not** redesign the *content* of each surface (reordering the discussion co-authoring UI, the problem card, etc.) — that is Wave 2+.

---

## Locked decisions (from Eston)

These are **fixed intent**, not open questions:

1. **Light top bar** — clean light header everywhere. Retire the dark `$gray-800` hero as chrome.
2. **No dedicated pipeline cue in the header** — the global `StageFooter` already carries stage context. Do **not** add a stage rail to the header. (The mandate's `JourneyRecap` is the only place the journey is told.)
3. **App-wide vocabulary** is `Solutions` (not `Proposals`) — irrelevant to header strings, noted for consistency.
4. **Keep governance signals visible** — never hide legitimacy signals to look cleaner.

### Header sub-decisions — my recommendations, **overridable by Eston**

- **(A) Initiative/artifact title placement.** **Rec:** the AppHeader's `title` line is the page's single `<h1>`. On *community-scoped* pages it's the **community name**; on a *standalone artifact* page (the published mandate) the AppHeader carries **no title** and the artifact's own card title becomes the `<h1>` (kills the "Published mandate" + duplicate-title smell). So the initiative/artifact name lives in **content**, not as a third header line.
- **(B) Bell on every inner page.** **Rec: yes** — `NotificationsBell` is always in the AppHeader (notifications become truly global, incl. CommunityView + Discussion which lack it today).
- **(C) Dark Gloki hero.** **Rec: drop it** — light header everywhere. Any "Welcome to Gloki" brand presence on Home stays as light *in-content* content, not chrome.
- **(D) Member-count chip in the community header.** **Rec: drop it** — clutter; the count lives on the Members tab. Keep the header clean.

---

## Current state (what you're replacing)

### `PageHeader` — `src/components/PageHeader.tsx` (+ `PageHeader.module.scss`)
Props: `{ showBackButton, backButtonText, backButtonVariant: 'default'|'compact', onBackClick, actionButtons: ActionButton[], title (required), subtitle?, rightLabel?: ReactNode, layout: 'two-row'|'single-row'|'homepage', onMenuClick?, menuOpen? }`.
Three layouts:
- **`homepage`** — dark `$gray-800` hero: big wordmark (→ `/`), `NotificationsBell`, optional menu button. Ignores `title`/`subtitle`.
- **`single-row`** — **DEAD CODE, no callers. Delete it.**
- **`two-row`** (default) — top row (back + `actionButtons` + bell), bottom row (`<h1>{title}` + `rightLabel` + `<p>{subtitle}`). This is the source of the duplicate-title + 4.27:1 subtitle + no-focus-ring + h1-in-a-`<div>` defects.

### `GlobalHeader` — `src/components/GlobalHeader.tsx`
Light `<header>`: brand button (`GlokiMark` 28 + "Gloki" → `/`) + menu button that opens `HomepageMenu` (self-managed `menuOpen`, logout via `useAuth`). **No back, no bell, no page context.** This is the closest thing to the target — evolve it into / replace it with `AppHeader`.

### All 9 call sites to migrate

| File | Line | Current | Target |
|------|------|---------|--------|
| `src/pages/HomeView.tsx` | 210 | `PageHeader layout="homepage" title="Gloki"` + own `HomepageMenu` | `AppHeader` (brand + bell + menu). Drop the sibling `HomepageMenu` (AppHeader owns it). No header title → in-content heading is the h1. |
| `src/pages/StageFeedView.tsx` | 223 | same homepage pattern | same as HomeView |
| `src/pages/IdentityView.tsx` | 29 | same homepage pattern | same as HomeView |
| `src/pages/CommunityView.tsx` | 244 | `<GlobalHeader />` (community name absent!) | `AppHeader title={communityName}` (**the key win** — community name = prominent h1) + bell + menu. |
| `src/components/collaboration/DiscussionStageView.tsx` | 69–77 | `<GlobalHeader/>` **AND** `PageHeader two-row title="{title} — Discussion" subtitle={communityName}` (the literal double-bar) | **one** `AppHeader`: back + `title={communityName}` + `eyebrow="Discussion"` + bell. Kill the `— Discussion` duplicate; the initiative title stays in content. |
| `src/components/mandate/MandatePage.tsx` | 32 | `PageHeader two-row title="Published mandate" subtitle={mandate.title}` | `AppHeader` back + bell, **no title** (and an optional quiet community/context eyebrow). Delete "Published mandate" + the duplicate subtitle; `MandateCard`'s title becomes the page `<h1>`. |
| `src/components/collaboration/CollaborationFullView.tsx` | 75 **and** 101 | two `PageHeader two-row`, `title={title}` / `${title} — Collaboration` | `AppHeader` back + `title={communityName}` + optional eyebrow. Drop the `— Collaboration` suffix; initiative title in content. |
| `src/pages/collaboration/CollaborationPage.tsx` | 154 | `PageHeader two-row` back-to-community + title/subtitle | `AppHeader` back (→ `/community/{id}/collaborations`) + `title`/context. |

---

## The `AppHeader` spec

Create `src/components/AppHeader.tsx` (+ `AppHeader.module.scss`). Reuse `GlobalHeader`'s good parts (the `<header>`, the `HomepageMenu` wiring, `useAuth` logout, the existing `:focus-visible` rings).

```ts
interface AppHeaderProps {
  showBack?: boolean;          // default false
  onBack?: () => void;         // default: navigate(-1)
  title?: string;              // when set → the single <h1> (community name on community pages). Omit on top-level + artifact pages.
  eyebrow?: string;            // optional small quiet line (e.g. "Discussion", or community context) in $gray-500
  // Brand (GlokiMark + "Gloki" → '/') , NotificationsBell, and the menu (HomepageMenu) are ALWAYS rendered and self-managed.
  // NO actionButtons / page CTA prop — by design.
}
```

Structure & rules:
- One semantic `<header>` (the only banner landmark). Sticky top.
- Row: **[ back? ] [ brand (logo + Gloki) ] … [ title block ] … [ bell ] [ hamburger ]** — keep brand a constant anchor; tune exact order for 360px (brand may sit left with title beneath on community pages — your call, but the wordmark renders once and the layout must hold at 360px).
- `title` renders as the **only `<h1>`** on the page, `$gray-900` `$font-semibold`. `eyebrow` is `$text-xs`/`$gray-500` above or beside it. When `title` is omitted, the page's in-content heading is the h1 (see decision A).
- **Text overflow:** the title MUST `min-width: 0` + `text-overflow: ellipsis` (single line) so a long community/initiative name — or the longer fr/sw string — truncates instead of pushing the bell/menu off a 360px screen. (This is a real bug in today's `PageHeader` h1 `flex-shrink:0`.)
- Bell = `NotificationsBell`. Menu = the hamburger that opens `HomepageMenu` (internalize the `menuOpen` state + `onNavigate`/`onLogout` wiring exactly as `GlobalHeader` does today — callers stop rendering their own `HomepageMenu`).
- Back button: icon-only `ArrowLeft`, **≥44×44px**, `aria-label` via `t('common.back','Back')`, visible `:focus-visible` ring.
- All icon-only controls have translated `aria-label`s; menu button keeps `aria-expanded`. No `outline:none` without a replacement ring.
- **Light only.** Add a dark-mode treatment using `$dark-*` tokens (it themes with the app shell), but no dark hero.
- **No ad-hoc values** — tokens only (`DESIGN_SYSTEM.md`). All strings via `t('key', 'fallback')`; add any new keys to `en`/`fr`/`sw`.

### Also in scope (cheap because we're in the global chrome)
- **Skip link + `<main>` landmark.** There is currently **no** skip-link and **no** `<main>` anywhere, despite a persistent header + 64px footer. Add a visually-hidden-until-focused "Skip to content" link as the first focusable element, targeting a single `<main id="main">` landmark that wraps page content (add it once at the app shell / route outlet level). This is a structural a11y win that belongs with the header.

### Out of scope (do NOT do here)
- Per-surface content reflow (discussion ordering, problem card, ActivityCards, vote stage, etc.) — Wave 2+.
- The Proposals→Solutions rename — separate wave.
- Any backend/seam change — this is a UI-only mockup; headers read props, nothing else.

---

## Constraints
- Mobile-first; **flagship 360px Android**, light **and** dark; verify both.
- i18n: en/fr/sw parity for any new/changed strings.
- Keep the UI↔service seam clean (`src/services/api.ts`); no server calls from the header.
- **No test framework** — verify via `npm run dev` + browser DevTools.
- **Production build runs `tsc -b`** — it must pass before push.

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite, no errors).
2. Each of the 9 call sites renders **exactly one** header, no duplicate title, at 360px light + dark.
3. CommunityView + Discussion now show the **community name** in the header.
4. Mandate page: no "Published mandate" generic h1, no duplicated mandate title; `MandateCard` title is the single h1.
5. `grep -rn "PageHeader" src` returns **nothing** (component + module deleted, all imports gone). `single-row` layout gone.
6. Exactly one `<h1>` and one `<header>` per screen; skip-link focuses and jumps to `<main>`; keyboard focus rings visible on back/menu/bell.
7. Long-title check: a 40-char community name / a long fr string truncates with ellipsis, buttons stay on-screen at 360px.
8. No new console errors; en/fr/sw all render.

## Delivery
Structural change touching navigation app-wide — verify carefully, then **clean · commit · push (deploy)** as one Wave 1 batch (Eston reviews on the deployed Pages build). Suggested commit subject: `feat(nav): Wave 1 — single AppHeader, delete PageHeader`.
