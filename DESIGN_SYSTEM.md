# Gloki Design System

Standards for consistent UI across the app. Reference this when building or modifying components.

> ## The one rule: **no ad-hoc values**
>
> Every colour, space, radius, shadow, font size, and transition comes from a token in
> `src/styles/variables.scss`. **Never** write a raw hex (`#3b82f6`), a raw pixel/rem
> (`padding: 13px`), or a one-off `rgba(...)` in component styles. If you need a value that
> doesn't exist, add a token first, then use it. Tinted/alpha variants derive from a token
> with Sass colour functions (e.g. `rgba($primary, 0.1)`) — that is allowed; a literal
> `rgba(59, 130, 246, 0.1)` is not.
>
> This is what lets seven parallel sessions produce a coherent product. Reviewers reject diffs
> with ad-hoc values.

The shared component kit (`src/components/shared/`) already encodes these tokens — prefer
`<Card>`, `<Button>`, `<Modal>`, `<EmptyState>`, `<Banner>`, `<Badge>`, etc. over re-styling
from scratch. All user-facing strings go through the i18n layer (`src/i18n/`, `t('key')`).

## Colors

Use SCSS tokens from `src/styles/variables.scss`. Never hardcode hex values.

| Token | Usage |
|-------|-------|
| `$primary` / `$primary-dark` | Interactive elements: buttons, links, active states |
| `$success` | Positive outcomes, thresholds met, completion |
| `$warning` | Caution states, unresolved concerns, pending actions |
| `$error` | Destructive actions, failures, blocking errors |
| `$secondary` | Muted accents |
| `$gray-50` … `$gray-900` | Secondary content, borders, disabled states |

**Rule:** If it's not interactive, it's not blue. If it's not an error, it's not red.

### Dark mode palette

**Write dark-mode styles ONLY through the `dark` mixin** (`@include dark { … }`,
defined in `variables.scss` — S21): never a raw `prefers-color-scheme` media query.
The mixin honours the 3-state Auto/Light/Dark theme control in the global menu
(`data-theme` on `<html>`, absent = Auto = follow the OS; localStorage
`gloki.theme`; managed by `src/hooks/useTheme.ts` + the zero-flash `index.html`
head snippet). Its `:where()` wrappers add zero specificity, so in Auto the
cascade behaves exactly like a raw media query. For blocks whose subject IS the
root element (`:root` custom-property overrides) use `dark-self`. Forced themes
also override `color-scheme` on `:root` (`index.scss`) so native widgets follow.

Component modules layer their dark treatments using these tokens:

| Token | Usage |
|-------|-------|
| `$dark-surface` | App background (deepest layer) |
| `$dark-bg` | Raised surface (cards, sheets) on dark |
| `$dark-border` | Borders/dividers on dark |
| `$dark-text` | Primary text on dark |
| `$dark-text-secondary` | Muted text on dark |
| `$primary-on-dark` | Blue TEXT in dark mode (links, eyebrows). `$primary-dark` is a light-mode hover tone — as dark-scheme text it measured 2.8–3.5:1 (S16); this blue-400 clears AA on both dark surfaces. |

### Semantic surfaces

Tinted background + readable text pairs for badges, banners, and inline messages. Use these
instead of hardcoding tinted hex. Dark variants pair with `$dark-text`.

| Surface | Text | Dark surface | Meaning |
|---------|------|--------------|---------|
| `$success-surface` | `$success-on-surface` | `$success-surface-dark` | Success / threshold met |
| `$warning-surface` | `$warning-on-surface` | `$warning-surface-dark` | Caution / pending |
| `$error-surface` | `$error-on-surface` | `$error-surface-dark` | Error / blocked |
| `$info-surface` | `$info-on-surface` | `$info-surface-dark` | Neutral info / active |

Overlays/scrims (modal backdrops): `$overlay-bg`.

### Stage colours

Five canonical tokens for the five governance-stage accents. **Single source of truth** —
used by both `StageStrip` (the read-only pipeline marker) and the `CreateInitiativePage`
stepper circles. Always pair a stage colour with the stage icon + label; never use it
alone to convey meaning.

**Rule:** Colour means only "stage" or "status". Stage colours must not be reused for
unrelated UI elements.

| Token | Value | Stage |
|-------|-------|-------|
| `$stage-problem` | `#ef4444` | Problem |
| `$stage-discussion` | `#f59e0b` | Discussion |
| `$stage-solutions` | `#8b5cf6` | Solutions |
| `$stage-vote` | `#3b82f6` | Vote |
| `$stage-mandate` | `#10b981` | Mandate |

`$warning-dark` (`#d97706`) was added alongside this set to complete the `-dark`
companion pattern (`$primary-dark`, `$success-dark`, `$error-dark`).

### Region colours (vote results)

Six geopolitical regions — **Africa, Asia & Pacific, Europe, Latin America & Caribbean, North America, Middle East & North Africa** — plus an `other` fallback. Used exclusively in the vote-card results breakdown (region-coloured bar chart). The `other` region renders when a solution's voter has no country metadata.

**Rule:** the region key is always rendered so colour is never the only signal. Region names stay English (not i18n).

| Token | Light | Dark | Region |
|-------|-------|------|--------|
| `$region-africa` | `#d98a2b` | `#e8a33d` | Africa |
| `$region-asia-pacific` | `#1f9e94` | `#2bb8ac` | Asia & Pacific |
| `$region-europe` | `#4f63d2` | `#6f81e8` | Europe |
| `$region-latam` | `#d94f6a` | `#e86d84` | Latin America & Caribbean |
| `$region-north-america` | `#9b5de0` | `#a78bfa` | North America |
| `$region-mena` | `#2f9e57` | `#3fb86c` | Middle East & North Africa |
| `$region-other` | `#8a909c` | `#a0a6b2` | Other (fallback) |

These are deployed as SCSS tokens in `src/styles/variables.scss` and as CSS custom properties (`--region-africa`, `--region-asia-pacific`, etc.) in both light and dark modes in `src/styles/index.scss`.

**API:** `src/utils/regions.ts` exports:
- `REGIONS` — array of the 6 visible regions (not `other`); each has `id` and `label`.
- `regionOf(countryCode)` — maps ISO 3166-1 alpha-2 country codes to region IDs; returns `'other'` for unmapped/missing codes.
- `regionColorVar(id)` — returns the CSS custom property string (e.g. `'var(--region-africa)'`) for a region ID.
- `type RegionId` — the 7 region IDs: `'africa' | 'asiaPacific' | 'europe' | 'latam' | 'northAmerica' | 'mena' | 'other'`.

## Typography

| Level | Token | Weight | Use |
|-------|-------|--------|-----|
| Page title | `$page-title-size` (= `$text-xl`, 20px) | `$page-title-weight` (700) | Every in-content page `<h1>`, with `$heading-gap` (8px) below it (S16 normalisation). Sanctioned exceptions: the AppHeader bar title (18px/600), onboarding step heroes (`$text-2xl` centered), the MandateCard document title. |
| Section header | `$text-lg` (18px) | `$font-medium` | Section dividers within a page |
| Body | `$text-sm` (14px) | `$font-normal` | Default text, form labels |
| Caption | `$text-xs` (12px) | `$font-normal` | Metadata, timestamps, helper text. Use **`$gray-500`** (≈4.8:1 on white). **Do not use `$gray-400` for text** — it is `#9ca3af` = **2.54:1 on white**, below the AA floor; reserve it for non-text/decorative use only. |

## Spacing

Use the spacing scale from variables. No ad-hoc pixel values.

| Token | Value | Use |
|-------|-------|-----|
| `$spacing-xs` | 4px | Tight gaps (icon to text) |
| `$spacing-sm` | 8px | Within components (label to input, items in a group) |
| `$spacing-md` | 12px | Comfortable internal padding |
| `$spacing-lg` | 16px | Between sibling components, card padding |
| `$spacing-xl` | 24px | Between sections |
| `$spacing-2xl` | 32px | Major section breaks |

## Components

### Cards
- Padding: `$spacing-lg`
- Border radius: `$radius-lg` (12px)
- Shadow: `$shadow-base`
- Border: 1px solid `$gray-100` (light) / `$dark-border` (dark)
- Hover: `$shadow-md` transition `$transition-base`

### Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `$primary` | white | none |
| Secondary | transparent | `$primary` | 1px `$primary` |
| Destructive | `$error` | white | none |
| Ghost | transparent | `$gray-600` | none |

Sizes: sm (32px height), md (40px), lg (48px). Border radius: `$radius-md`.

**When to reach for `<Button>` vs. keep a bespoke `<button>`.** `<Button>` is the canonical
*action* button — use it for standard CTAs and dialog actions (and prefer Button's `loading`
prop over hand-rolled spinners). A few legitimately-bespoke patterns intentionally stay
hand-rolled because they don't fit the four pill variants, and forcing them in degrades the
design:
- **Section-themed actions** — e.g. CollabList's teal `.createBtn` lives in the collab
  `#0d9488` section theme; as primary-blue it would lose that identity.
- **Icon-only square buttons** — e.g. chat send / top-bar back (40×40). `<Button>` sizes are
  pills (fixed height + horizontal padding), not squares.
- **List-row / indicator buttons** — e.g. CollabList's collab rows, the `Stepper` step dots.
  These are navigation rows and step indicators, not actions.

There is **no a11y cost** to keeping these bespoke: a global `button:focus-visible` rule
(`src/styles/index.scss`) already gives every `<button>` the 2px `$primary` focus ring. So
consolidating them to `<Button>` would be consistency-only — not worth the design regression.
_(Batch 14 finding; the identity-area action buttons + IdentityCardDialog→Modal were the clean
wins and are done.)_

**Legacy classes removed.** Eight global button-style classes (`.save-button`, `.cancel-button`,
`.submit-button`, `.action-button`, `.primary-button`, `.secondary-button`, `.delete-button`,
`.back-button`) were deleted as dead CSS — no component referenced them. The bespoke-`<button>`
exceptions listed above are intentional departures, not remnants of these removed classes.

### Form Inputs
- Height: 40px
- Border: 1px solid `$gray-200`
- Border radius: `$radius-md`
- Focus: 2px ring in `$primary` with 2px offset
- Padding: `$spacing-sm` horizontal

### Modals
- Centered overlay with backdrop blur (4px)
- Background: white / `$dark-surface`
- Border radius: `$radius-xl`
- Padding: `$spacing-xl`
- Max width: 480px
- Structure: header (title + close) → body → footer (actions, right-aligned)

### Loading States
- Centered in container
- Spinner + message text in `$gray-500` (`$gray-400` fails AA on light — see Typography → Caption)
- Padding: `$spacing-xl`
- Font size: `$text-sm`

### Error States
- Same container as loading
- Error icon (AlertCircle) in `$error`
- Message text
- Retry button (secondary variant)
- Padding: `$spacing-xl`

### Empty States
- Centered icon (relevant lucide icon) in `$gray-300`, 48px
- Message in `$gray-500`, `$text-sm` (`$gray-400` fails AA on light; reserve it for the decorative icon above)
- CTA button (primary, sm) below

### App shell, disclosure & pipeline primitives

Shipped with the hierarchy/a11y redesign (Waves 0–5). Reuse these instead of
hand-rolling page chrome — they encode the one-header / one-`<h1>` / disclosure /
inline-numbers rules the redesign is built on.

**`AppHeader`** (`src/components/AppHeader.tsx`) — the single light top bar and the
app's only `banner` landmark; render **exactly one per page**. Self-manages (callers
never pass them) the "Skip to content" link → `#main`, the `GlokiMark` + "Gloki"
wordmark (rendered once), the notifications bell, and the account menu. Props:
`showBack`/`onBack` (icon back button; `onBack` defaults to `navigate(-1)`),
`title` (the page's single `<h1>` — **omit** on top-level pages and standalone
artifact pages like the published mandate, where an in-content heading is the `<h1>`),
`eyebrow` (a quiet line above the title, e.g. the stage name). **No page-CTA prop by
design** — primary actions live in content / the thumb zone, never the header. Each
page wraps its content in `<main id="main" tabIndex={-1}>` (the skip-link target).

**`InfoDisclosure`** (`src/components/shared/InfoDisclosure.tsx`) — the `(i)` →
focus-trapped `Modal` disclosure standard. A ≥44px `(i)` icon-button (tap-only, no
auto-open; `aria-haspopup="dialog"`, `aria-expanded` reflects state) that opens
rules/how-it-works/explainer prose in a `Modal` (focus moves in, Escape closes,
focus restores to the trigger). **The rule:** put *prose* behind the `(i)`, but keep
the *number* — threshold, tally, meter, stake, source count — inline and visible.
Props: `label` (translated trigger aria-label), `title` (modal heading, defaults to
`label`), `children` (the prose), `size`, `className`.

**`StageStrip`** (`src/components/shared/StageStrip.tsx`) — a compact, read-only
`<ol>` of the **four** governance stages (Problem → Solutions → Vote → Mandate;
Discussion left the strips in S16 — it is a function, not a pipeline step). A
glanceable pipeline anchor — **not navigation, not the explainer**. Token-pure
stage fills. Default `aria-label` = `stage.pipelineOverview` ("The governance
stages"), deliberately distinct from the two nav landmarks below so no two share
an accessible name. Used on the task-first create + login screens. Props:
`ariaLabel`, `className`.

**`InitiativeStageStrip`** (`src/components/initiative/InitiativeStageStrip.tsx`) — the
router-aware sibling of `StageStrip`: the **follow-this-initiative** control rendered
atop the expanded `InitiativeStageCard` panel (P1). Same four-stage set, but it
**highlights the initiative's current stage** (`get_stage`, `aria-current="step"` +
ring) and is **tappable only where a real per-initiative surface exists** — Mandate
(`/mandate/cid/iid`). Other stages are progress markers (done/upcoming), never
misleading links — the inline dashboard exposes only the *current* stage, so
there's no past-stage surface to navigate to. An initiative whose data stage is
`discussion` renders in the Problem→Solutions gap (Problem done, nothing current).
Tappable stages are `<button>`s (label `stage.goTo`); the rest are static `<span>`s.
`aria-label` = `stage.initiativeStripLabel` ("Stages of this initiative"). Distinct
from the global **"Browse by stage"** `StageFooter` (cross-community discovery, 4
stages, demoted) — the two must never be conflated as one nav. Props: `current`,
`communityId`, `initiativeId`, `className`.

**`DiscussionPill`** (`src/components/initiative/DiscussionPill.tsx`, S16) — the
persistent per-initiative **Discussion** button rendered under the strip in the
`InitiativeStageCard` panel: discussion is reachable at EVERY stage. ≥44px target,
live comment count (read-only `resolveInitiativeStageContract` + `get_comments` —
NEVER `useFlowContract`, which deploys), warning-toned "In discussion" active
state when the initiative's data stage is `discussion`. Props: `initiativeId`,
`communityId`, `hostServer`, `hostAgent`, `active`, `className`.

**`CountryMultiSelect`** (`src/components/shared/CountryMultiSelect.tsx`) — removable
selected chips + a search over **all 197 countries** (composes `SearchableSelect`,
plus an "Other" catch-all). Replaces hardcoded 4–5 country-chip rows so a
global-democracy app never excludes 190+ countries. `role="group"`; country proper
nouns render canonical-English (only the chrome is `t()`-wired). Props: `value`
(ISO alpha-2 codes), `onChange`, `ariaLabel`, `includeOther` (default `true`),
`disabled`.

## Mobile Patterns

- **Touch targets:** minimum 44x44px (Apple HIG). Compact controls reach it with an
  invisible `::after` hit-area extension (`MandateCard .linkBtn`, HomeView `.seeAll`) or
  a real 44×44 box (AppHeader icon buttons). **Sanctioned exceptions (S17):**
  - `StageFooter` tabs (~57×37): the fixed global bar is density-deliberate at 360px —
    forcing 44px-tall tabs adds ~10px of chrome to every screen. Passes the WCAG 2.5.8 AA
    24px floor with honest whole-tab hit areas; do not "fix" without a new product decision.
  - Inline links in running text and card meta lines (source chips, community/initiative
    name links): the WCAG inline exception applies; meta-line links additionally keep a
    ≥24px min-height floor (`InitiativeStageCard .metaItem`).
- **Primary actions:** bottom-anchored when possible (thumb zone)
- **Content padding:** 16px from screen edges
- **No hover-only interactions:** everything must be tap-accessible
- **Swipe:** only where already implemented (community tabs, pipeline stages). No new swipe gestures.

## Progress Bars

Used in voting flows for threshold visualization:
- Height: 8px
- Border radius: `$radius-full`
- Background: `$gray-100`
- Fill: `$primary` (in progress) or `$success` (threshold met)
- Transition: width `$transition-base`

## Token reference

The remaining scales, for completeness. Use the token, not the value.

### Border radius
| Token | Value |
|-------|-------|
| `$radius-sm` | 6px |
| `$radius-md` | 8px (default for buttons, inputs) |
| `$radius-lg` | 12px (cards) |
| `$radius-xl` | 16px (modals, sheets) |
| `$radius-full` | pill / circle |

### Shadows
| Token | Use |
|-------|-----|
| `$shadow-sm` | Subtle lift (chips, inputs) |
| `$shadow-base` | Default card resting shadow |
| `$shadow-md` | Card hover / raised |
| `$shadow-lg` | Modals, popovers, sheets |

### Transitions
| Token | Value | Use |
|-------|-------|-----|
| `$transition-fast` | 0.1s | Press feedback |
| `$transition-base` | 0.2s | Default (hover, color, width) |
| `$transition-slow` | 0.3s | Enter/exit, expand/collapse |

### Breakpoints
Mobile-first. The flagship target is a **360px-wide** Android; every layout must hold there.
| Token | Min width |
|-------|-----------|
| `$breakpoint-sm` | 640px |
| `$breakpoint-md` | 768px |
| `$breakpoint-lg` | 1024px |
| `$breakpoint-xl` | 1280px |

### Layout
| Token | Value | Use |
|-------|-------|-----|
| `$footer-height` | 64px | Global `StageFooter`; pad the bottom of scroll regions by this so content clears the bar |
| `$content-max-width` | 640px | Single-column content column, centred on wider screens |

## Shared component inventory

Import from `src/components/shared` (barrel `index.ts`). **Prefer these over re-styling from
scratch** — they already encode the tokens above.

| Component | Use |
|-----------|-----|
| `Button` | The canonical *action* button. Variants: primary / secondary / destructive / ghost; sizes sm / md / lg. Use for CTAs and dialog actions; a few themed / icon-only / list-row buttons stay bespoke — see Buttons → "When to reach for `<Button>`". |
| `SegmentedControl` | Single-select toggle between a few views (e.g. Proposals / Results). Active segment reads like a primary button; AA-readable in light + dark. Use instead of hand-rolled tabs. |
| `Card` | Content container (padding, radius, shadow per the Cards spec). |
| `Modal` | Centered overlay dialog (header → body → footer). |
| `Banner` | Inline full-width message; pair with a semantic surface (info / success / warning / error). Bakes in `role` — `alert` for the error tone, `status` otherwise. |
| `InfoDisclosure` | The `(i)` → focus-trapped `Modal` disclosure standard (prose behind the `(i)`, numbers stay inline). See **App shell, disclosure & pipeline primitives**. |
| `StageStrip` | Read-only `<ol>` of the 5 governance stages; token rainbow; default `aria-label` `stage.pipelineOverview`. See the primitives subsection. |
| `InitiativeStageStrip` | Router-aware sibling of `StageStrip`: the follow-this-initiative control atop the expanded `InitiativeStageCard`. Highlights the current stage; tappable only for Discussion/Mandate. See the primitives subsection. |
| `UserIdentity` | Inline person identity — `[flag] Name [verified-shield]`. The verified-only shield renders as an exponent (small, raised, `$success` tint). Use in feed/card bylines and author lines. Replaces the text-based `TrustBadge` in those contexts. `TrustBadge` remains on the dedicated verification page (`IdentityTrust`). Props: `publicKey`, `size` (`sm`/`md`). |
| `CountryMultiSelect` | Chips + search over all 197 countries. Use instead of hardcoded country chips. |
| `Badge` | Small status or count label. |
| `EmptyState` | Centered icon + message + CTA for empty lists/feeds. |
| `ErrorBoundary` | Wraps a subtree to catch render errors. |
| `SearchableSelect` | Searchable dropdown. |
| `Stepper` | Multi-step progress indicator — **onboarding / create-initiative only**, not stage views. |
| `StageFooter` | Global fixed **"Browse by stage"** bottom nav — cross-community discovery (4 browseable stages: Problem/Solutions/Vote/Mandate; Discussion is per-post). Visually demoted (caption eyebrow + light weight) so it never reads as next-step nav for the open initiative — that's `InitiativeStageStrip`. |
| `LanguageSwitcher` | i18n language picker. |
| `NotificationsBell` | Notifications indicator. |
| `CountryFlag` / `CountryParticipation` / `CountryPresence` | Country flag glyph / top-countries-with-counts / presence display. |
| `GlokiMark` | The Gloki logo mark. Rendered in the `AppHeader` wordmark (once per page) and the onboarding invite step. |
| `RoleChip` / `RoleDisplay` | Role label chip / role display. |
| `ExpertEndorseButton` | Expert endorsement action. |
| `AITools` | `TranslateButton`, `SummaryButton`, `AIToolbar` (need OpenAI key). |
| `LanePlaceholder` | Dev placeholder for unbuilt areas. |

Subfolders: `connectivity/`, `presence/`.

### Vote card (QVFlow pattern)

Quadratic voting pattern used in the Vote stage (`src/components/collaboration/flows/voting/QVFlow.tsx`). Reads ballot mechanics from a `quadratic_vote` contract and the commitment/metrics spine from an `approval_voting` (proposals) contract, joined by proposal ID.

**Dual interface:** votable until the user submits, then auto-switches to hard-locked results display (no toggle; gated on `hasVoted`, derived client-side from non-empty `get_my_allocation`).

**Votable state:**
- Hearts on top (quadratic cost: *h* hearts cost *h*² credits from a shared pool)
- Solution text + author (via `UserIdentity`)
- Collapsible commitment detail card (if commitments exist)
- Collapsible metrics detail card (if expert reviews with metrics exist; reviewed-only, with graceful fallback to all proposals if none are marked reviewed)
- Progress bar tracking pool usage (blue fill on gray track)
- "Cast my votes" primary CTA (disabled until ≥1 heart allocated)
- 75% community-turnout progress bar at the bottom (slate colour, `fillTurnout` class) with denominator from `communityMemberCount` prop

**Results state (after vote cast):**
- Solutions sorted by vote count descending
- "Your vote" indicator (hearts or "—" if you didn't back it)
- Region-coloured horizontal bar chart showing vote distribution (`regbar` element; one segment per region with non-zero votes; `backgroundColor` set via `regionColorVar()`)
- Region key below all solutions (grid of region swatches + labels)
- Same collapsible commitments & metrics card
- 75% community-turnout footer (turnout only updates on re-fetch post-cast, since demo seam emits no write events)

**Props:**
- Extends `FlowProps` (standard flow properties: `instanceId`, `parentContractId`, `stageKey`)
- `communityMemberCount?: number` — active member count; used to calculate turnout ÷ denominator (optional, defaults to 0; when omitted, turnout shows as "0%")

**Rules:**
- Region key is always rendered so colour is never the only signal for vote distribution.
- Heart icons stay filled/empty in both votable and results states (no state-dependent icon swap).
- No "voting open/closed" contract-status check in the UI — the contract's `allocate` method either succeeds (vote cast) or fails (already voted or voting closed server-side).
- i18n keys: `mechanisms.qv.*` namespace.

## Component states

Every interactive component must define all of these (don't ship hover-only or focus-less controls):

| State | Treatment |
|-------|-----------|
| Default | Resting token styles (see Components). |
| Hover | Subtle shift via `$transition-base` — darken/raise; **must keep text readable** (no light-on-light). |
| Active / pressed | Brief depress via `$transition-fast` (e.g. slight scale or darker fill). |
| Focus-visible | 2px `$primary` ring, 2px offset — on **every** focusable element. Never remove the outline without replacing it. |
| Disabled | Reduced contrast (`$gray-*`), `cursor: not-allowed`, no hover/active response. |
| Loading | Spinner or skeleton; disable interaction; keep layout stable (no content jump). |
| Selected / active-tab | Distinct from hover — use fill or weight change, not just an underline that can be missed. |

## Accessibility

Target **WCAG 2.1 AA**:

- **Contrast:** body text ≥ **4.5:1** against its background; large text (≥ 24px, or ≥ 18.66px bold) and UI components / focus indicators ≥ **3:1**. This is why low-contrast gray text on tinted tabs (e.g. the Proposals/Results toggles) fails — fix with a token pair that meets the ratio.
- **Known accepted deviation — `$primary` buttons:** white on `$primary` `#3b82f6` is **3.68:1** (below the 4.5:1 normal-text bar). Kept deliberately as the brand blue (Eston's call, confirmed at the Batch-8 *and* Batch-9b gates). Do **not** darken `$primary` to "fix" this without a new product decision; `$primary-dark` `#2563eb` exists for hover/active.
- **Caption colour gate:** `$gray-400` (#9ca3af) is **2.54:1 on white** — below AA for text. Use **`$gray-500`** for any caption/metadata/helper text on a light surface. Regression gate: `grep -rn 'color: $gray-400' src --include='*.module.scss'` should match **only** decorative (`border-`/`background`) and `::placeholder` uses — never standalone `color:` text.
- **Don't rely on colour alone** — pair status colour with an icon or text label.
- **Focus:** visible focus ring on all interactive elements (see Component states).
- **Touch targets:** ≥ 44×44px (see Mobile Patterns).
- **Labels:** every icon-only control needs an `aria-label`; inputs need associated labels.
