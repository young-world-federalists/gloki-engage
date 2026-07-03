# S16 UI Review Campaign — Findings Log

**Run 2026-07-03 against `ui` @ `02a7b36` (S16 housekeeping commits on top of `c26cdc4`).**
Instruments: grep gates, live-preview computed-style sweeps (360×740, light + dark),
touch-target bounding boxes, per-route h1/landmark checks, heading-style inventory.
Severities rank against the two north stars (MASTER_TODO §1), per the campaign taxonomy.

## Phase 0–1 — Baseline & mechanical gates: ALL CLEAN

- `npm run build` green; tree clean at start.
- Gate 1a gray-400: 0 hits ✓ · 1b raw hex: 0 non-comment ✓ · 1c literal rgba: 10 (= baseline) ✓
- i18n parity: `PARITY OK` (fr=sw=1113, tokens intact) ✓
- 1f kit-adoption leads (minor, Wave-1.5 candidates, NOT for this session's fix wave):
  FundingFlow (hand-rolled empty state + `role="tab"`), RulesStep (empty-state phrasing),
  bespoke fixed-position dialogs: ApprovalDialog, CreateCollabDialog, QRScannerDialog,
  MessageDialog, SlideOutMenu (known baseline scrim owners).

## Phase 2 — Accessibility (measured)

### Confirmed contrast defects (excludes locked 3.68 white↔$primary family)

| # | Sev | Where | Evidence | Fix direction |
|---|---|---|---|---|
| C1 | **major** | Vote card (community feed, expanded): "expert reviewed" chip, "How we'll know it's working" link, "+" | `rgb(16,185,129)` ($success emerald-500) on white = **2.54:1** | darken text-green token for text-on-white (e.g. emerald-600/700) — token-level |
| C2 | **major** | Dark mode, HomeView "See all" (×6) | `$primary-dark rgb(37,99,235)` on `rgb(15,23,42)` = **3.45:1** | dark palette needs a light link-blue (e.g. blue-400); `$primary-dark` is a light-mode hover token |
| C3 | **major** | Dark mode, MandatePage eyebrow "A GLOBAL COMMUNITY…" | `$primary-dark` on slate-800 = **2.83:1** | same root cause as C2 |
| C4 | minor | MandatePage "Machine-readable spec" caption | slate-500 on slate-100 = **4.34:1** | use gray-600+ on tinted bg, or untint |
| C5 | minor | Dark MandatePage hero caption "2 endorsing · 4 supporting" | slate-400 on blue-900 = **4.04:1** | lighten caption in dark hero |
| — | note (locked) | Brand-blue family: white-on-$primary 3.68, $primary-text-on-white/near-white 3.52–3.98 | locked decision, no action | — |
| — | note | Alpha-tint artifacts: sweep readings of 1.0–2.9 on `rgba($primary,.06–.16)` backgrounds are measurement artifacts (ancestor walk treats alpha as opaque); representatives mentally blended → pass. | — | — |

### Touch targets < 44px (Eston's reported defect #3 — CONFIRMED)

| # | Sev | Control | Measured | Notes |
|---|---|---|---|---|
| T1 | **major** | AppHeader Notifications bell (every page) | **30×30**, icon 18px | the single most-repeated violation |
| T2 | **major** | MandatePage "View full" / "View all" | 84×14 / 59×14, icon 11px | smallest controls in the app |
| T3 | **major** | Discussion thread: Like (34×44), Collapse replies (22×44) | width < 44, icons 14px | heights OK, widths fail |
| T4 | major | Banner "Dismiss" (stage feeds) | 24×24, icon 16px | |
| T5 | minor | "See all" (HomeView ×6) | 78×25, icon 14px | |
| T6 | minor | StageFooter items | ~57×37, icons 20px | global nav; height 37 |
| T7 | minor | Source-link chips (un.org etc.) | ~54–72×19, icon 13px | inline-link exception arguable |
| T8 | note | Kit Button md = 40px height ("Start an initiative", "Menu", "Explore Gloki", Share) | 40px | Button.module.scss documents "md/lg clear 44 with vertical padding in context" — treat as settled unless Eston says otherwise; sm (32px, "Endorse / adopt") in primary flows is a lead |
| T9 | minor | Community-name / initiative-title inline links in feed cards | 18–21px tall | inline-text exception arguable; icons fine |

### Landmarks / structure

| # | Sev | Finding |
|---|---|---|
| L1 | **major** | `/create-community` has **no AppHeader** (0 `<header>`, h1 is page-local at 20px/700) — breaks the single-AppHeader/banner page model |
| L2 | major | CommunityView not-found branch (bad ID): renders with **h1:0, header:0, main:0** — error page outside the page model |
| L3 | note | MandatePage has 3 `<header>` elements (1 banner + card `<header>`s — semantic, not banners; verify roles in fix wave) |
| L4 | note | Keyboard: skip link present + first on all sampled routes ✓. Focus-visible ring NOT verified (programmatic focus can't trigger :focus-visible; static SCSS check scheduled in fix wave). Modal traps not re-verified this session. |

## Phase 3 — Normalisation (Eston's reported defect #2 — CONFIRMED)

### N1 (**major**): h1 is a different element on nearly every page

| Route | h1 | size/weight/margin-bottom |
|---|---|---|
| HomeView | "Across your communities" | 20px/600/0 |
| StageFeedView | "Problem" etc. | **32px/700/−1px** |
| CommunityView | AppHeader title | **18px/600/0** |
| Discussion | AppHeader title | 18px/600/0 |
| MandatePage | doc title | **24px/700/0** |
| IdentityView | "Your Communities" | 20px/600/**4px** |
| /welcome | "You're all set up" | 20px/600/0 |
| /create-community | "Create a Community" | 20px/**700**/0 |

Five distinct renderings. Fix: one h1 scale token pair (size+weight+margin) applied
app-wide; per-page hero text may stay larger *as a styled h2* or the token gets two
sanctioned steps — recommend-then-confirm framing already covered by Eston's decision 2.

### N2 (major): heading margins ~all 0px

h2/h3 margin-bottom is 0 on HomeView/stage feeds/community (spacing done by flex gap on
some parents, absent on others) → the "cramped" feel. Fix as one pass with spacing tokens.

### N3 (minor): duplicate page titles

CommunityView renders AppHeader h1 "Digital Rights Coalition" AND hero H2 with identical
text; MandatePage similarly h1+h2 duplicate. Decide one owner per page (likely: AppHeader
h1 stays; hero becomes the styled display element without duplicating semantics).

### N4 (minor): vote-stage activity card has no initiative title

Card heading is the problem *description* in bold; the initiative title never appears.
Also "Cast your vote" affordance renders as plain text inside the card-button. (Feeds
Track B coherence review.)

### Composition: HEALTHY

Community hero ~5 co-equal blocks; activity cards ~3; S15 recomposition held. No new
accretion found. No action.

## Phase 4 — Persona walks: NOT RUN (per session prompt: prioritize 0–3 if constrained). Cross-persona signal approximated by Track B coherence walk.

## Phase 5 — Attractiveness proxies

- Type-scale discipline: mostly 4 sizes per screen ✓ (violations are the h1 chaos above).
- Density @360: within bounds on all sampled routes.
- Taste items for Eston (recommend-then-confirm, NOT defects): none blocking; revisit
  after N1/N2 land.

## Fix-wave scope proposed for Track C (this session)

1. Discussion-IA change (Eston decision 1 — already locked).
2. T1 bell → 44×44; T2 View full/all ≥44 tap area; T3 Like/Collapse widths; T4 Dismiss.
3. C1 green-on-white token; C2/C3 dark-mode link/eyebrow blue.
4. N1+N2 heading normalisation pass (Eston decision 2 — already locked).
5. L1 AppHeader on /create-community; L2 not-found branch into page model.
6. C4/C5, N3, N4, T5–T7 as time permits (else → session 17).
Deferred to Wave-1.5: kit-adoption leads, 10 rgba scrims.
