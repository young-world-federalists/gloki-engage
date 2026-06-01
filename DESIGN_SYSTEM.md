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

The app shell themes itself in `prefers-color-scheme: dark` (see `index.scss`); component
modules layer their own dark treatments using these tokens.

| Token | Usage |
|-------|-------|
| `$dark-surface` | App background (deepest layer) |
| `$dark-bg` | Raised surface (cards, sheets) on dark |
| `$dark-border` | Borders/dividers on dark |
| `$dark-text` | Primary text on dark |
| `$dark-text-secondary` | Muted text on dark |

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

## Typography

| Level | Token | Weight | Use |
|-------|-------|--------|-----|
| Page title | `$text-xl` (20px) | `$font-semibold` | Top-level page headings |
| Section header | `$text-lg` (18px) | `$font-medium` | Section dividers within a page |
| Body | `$text-sm` (14px) | `$font-normal` | Default text, form labels |
| Caption | `$text-xs` (12px) | `$font-normal` | Metadata, timestamps, helper text. Use `$gray-400`. |

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
- Spinner + message text in `$gray-400`
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
- Message in `$gray-400`, `$text-sm`
- CTA button (primary, sm) below

## Mobile Patterns

- **Touch targets:** minimum 44x44px (Apple HIG)
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
| `Button` | The canonical button. Variants: primary / secondary / destructive / ghost; sizes sm / md / lg. Never hand-roll a button. |
| `Card` | Content container (padding, radius, shadow per the Cards spec). |
| `Modal` | Centered overlay dialog (header → body → footer). |
| `Banner` | Inline full-width message; pair with a semantic surface (info / success / warning / error). |
| `Badge` | Small status or count label. |
| `EmptyState` | Centered icon + message + CTA for empty lists/feeds. |
| `ErrorBoundary` | Wraps a subtree to catch render errors. |
| `SearchableSelect` | Searchable dropdown. |
| `Stepper` | Multi-step progress indicator — **onboarding / create-initiative only**, not stage views. |
| `StageFooter` | Global fixed 5-stage bottom nav. |
| `LanguageSwitcher` | i18n language picker. |
| `NotificationsBell` | Notifications indicator. |
| `CountryFlag` / `CountryParticipation` / `CountryPresence` | Country flag glyph / top-countries-with-counts / presence display. |
| `EarthFlag` | International Flag of Planet Earth (logo, used in `PageHeader`). |
| `RoleChip` / `RoleDisplay` | Role label chip / role display. |
| `ExpertEndorseButton` | Expert endorsement action. |
| `AITools` | `TranslateButton`, `SummaryButton`, `AIToolbar` (need OpenAI key). |
| `LanePlaceholder` | Dev placeholder for unbuilt areas. |

Subfolders: `connectivity/`, `presence/`.

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
- **Don't rely on colour alone** — pair status colour with an icon or text label.
- **Focus:** visible focus ring on all interactive elements (see Component states).
- **Touch targets:** ≥ 44×44px (see Mobile Patterns).
- **Labels:** every icon-only control needs an `aria-label`; inputs need associated labels.
