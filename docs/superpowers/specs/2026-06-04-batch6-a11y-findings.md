# Batch 6 Phase 2 — Diverse-persona accessibility findings

**Branch:** `ui` · **Audited:** 2026-06-07 · **Standard:** WCAG 2.1 AA + the project's own a11y bar
(DESIGN_SYSTEM.md: ≥44px touch targets, focus-visible, AA contrast, 360px, dark mode) · **Method:**
`design:accessibility-review` skill driven against the running preview (light + dark + 360px) across the
seven Batch-priority flows through five personas.

> **Status: A+B fixes shipped (local commits) · long tail flagged.** At the review gate Eston set the
> appetite to **A+B** (high + reasonable-effort medium) and **deferred the language switcher (#11)**.
> 14 findings fixed across 6 small local commits — see **§1a Resolution**. The C-tranche + #11 stay
> flagged. **Not pushed** (Eston controls the deploy).

---

## 1. Summary

The Batch 1–6 foundation shows: the **shared kit and the Batch-5/6 surfaces are in strong a11y shape** —
semantic `<del>`/`<ins>` diffs, `progressbar` roles with bounds, named landmark `region`s, a
`DescriptionList` for metrics, text-labelled statuses (never colour-alone), a labelled `aria-modal` dialog
with Esc, and the new welcome guide (focus-on-heading, correct heading order, constant-derived trust copy,
**6-dot Stepper holds at 360px with zero overflow**). RTL-readiness is good (**zero physical directional
properties** in any audited SCSS) and **long strings (+35%) don't overflow** at 360px.

So the findings are **targeted, not a rewrite** — as the spec predicted. **18 findings**: **1 high**, **10
medium**, **7 low**, plus one **systemic** contrast issue and a token-debt long-tail to flag.

| Persona | Headline result |
|---------|-----------------|
| **Low-vision** | Mostly AA. One **systemic** fail: `$gray-400` caption/metadata text = **2.54:1 on white** (timestamps, login hints). LoginPage error/warning surfaces use ad-hoc hex that bypasses the AA-checked token pairs (~3.77:1). Dark mode passes. h1/body/headings all ≥13:1. |
| **Keyboard-only** | One **high**: the **discussion feed card is mouse-only** (`<div onClick>`, no keyboard). LoginPage server-history dropdown is also mouse-only. SlideOutMenu doesn't move focus in on open (but is `aria-modal` + Esc-closable). |
| **Screen-reader** | Strong semantics overall. Gaps: **stage feeds have no `<h1>`** (homepage header = wordmark button); **MandatePage emits 3 `<h1>`s**; minor H1→H3 level skips; `<ins>` lacks a non-colour cue. |
| **Low-bandwidth / 360px** | Layout integrity is excellent (no overflow anywhere, stepper holds). Touch targets miss the project ≥44px bar in shared chrome: **Banner dismiss 24×24**, NotificationsBell 30×33, back buttons 35–38px. |
| **Multilingual** | RTL-ready (no hardcoded `left/right`); long strings wrap cleanly; new strings `t()`-wired. One stranded literal: PageHeader menu `aria-label="Open menu"`. **No language switcher pre-auth** (product call). |

---

## 1a. Resolution (post review-gate — A+B shipped locally)

All fixes verified live in the preview (light + 360px; dark where relevant) with real interactions and
computed-contrast / bounding-box / focus checks — not asserted from source. `npx tsc -b` clean throughout.
**6 local commits, not pushed:**

| Commit | Findings fixed | What changed |
|--------|----------------|--------------|
| `86d3f54` | #6, #7, #8, #13 | Shared chrome: Banner dismiss + NotificationsBell get a ≥44px `::after` hit area (no visual change); PageHeader + InfoPage back buttons → ≥44px; homepage menu `aria-label` → `t()`. Verified: all ≥44px, dismiss still works. |
| `a575845` | #2 (login hint), #3, #9, #14, #17 | LoginPage: hint `$gray-400`→`$gray-500` (4.83:1); error/warning surfaces → AA token pairs (`$error-dark`/`$warning-on-surface`, 5.30–7.09:1 incl. retry button); history dropdown `<div>`→`<button>` + focus-within guard; error emoji `aria-hidden`; gradient → tokens. |
| `0a88920` | #1 (high), #2 (timestamp), #4 | Stage feed: discussion card now keyboard-accessible via a stretched-link title `<button>` (whole card stays a tap-through; community badge raised + clickable); visually-hidden `<h1>` (stage name); author/timestamp → `$gray-500`. |
| `529fab6` | #2 (captions), #12 | Stage-2: `<ins>` gets `underline` (non-colour cue; `<del>` keeps line-through); edit/position/support captions → `$gray-500`. |
| `df7466e` | #5 | Mandate: MandateCard + MandateDocument titles `<h1>`→`<h2>` (PageHeader's stays the single page h1). |
| `d42b128` | #10 | SlideOutMenu: restore focus to the trigger on close + trap Tab within the panel (open-focus & Esc already worked). |
| _(this doc)_ | #2 (DS guidance) | DESIGN_SYSTEM.md caption guidance: use `$gray-500`, not `$gray-400`, for text. |

**Flagged / deferred (not fixed):**
- **#11 language switcher** — deferred by Eston (English-now; revisit with the fr/sw parity wave).
- **#2 full app-wide caption sweep** — only the audited-flow `$gray-400` text instances were fixed; a
  repo-wide sweep (every `.module.scss` caption + a grep gate) is the C-tranche long tail.
- **Newly found during fixes — `$error-on-surface` token is borderline:** `$error-on-surface` = `$error`
  (#dc2626) is only **3.95:1 on `$error-surface`**, so the shared `Banner` error tone is sub-AA. I fixed
  LoginPage directly (using `$error-dark`) rather than change the global token without sign-off. **A
  one-line fix — `$error-on-surface: $error-dark` — would bring every error surface to ≥5.3:1 with no
  downside (darker red on a light tint). Recommend doing it; left for Eston's nod since it touches the
  Batch-5 Banner.**
- **#15** heading-level skips (H1→H3), **#16** wordmark 40px, **#18** CommunityView duplicate heading, and
  the **§4 token-debt long tail** — C-tranche, flagged.

The Status column below reflects the **original audit**; this section is the authoritative post-fix state.

---

## 2. Findings (severity × effort)

Severity: **high** = blocks a task for a persona · **med** = real barrier with a partial workaround ·
**low** = polish / best-practice. Effort: **S** ≤ ~30 min · **M** ~1–3 h · **L** broad/systemic.
Touch-target rows are flagged against the **project ≥44px standard** (DESIGN_SYSTEM + Apple HIG); note WCAG
2.1 AA has *no* target-size SC (2.5.5 is AAA; WCAG 2.2's 2.5.8 AA = 24×24), so these are project-bar, not
strict-AA, failures — called out for honest prioritization.

| # | Flow | Persona | Severity | Effort | Issue (+ WCAG SC) | Proposed fix (file) | Status |
|---|------|---------|----------|--------|-------------------|---------------------|--------|
| 1 | Stage feed | keyboard, SR | **high** | M | Discussion feed card is a `<div onClick>` with no `role`/`tabIndex`/`onKeyDown` — opening a discussion (the tap-through to co-authoring) is **mouse-only**. (2.1.1, 4.1.2) | `src/pages/StageFeedView.tsx:97` — add `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space→`onCardClick`), `aria-label` "Open discussion: {title}". | Open |
| 2 | All (systemic) | low-vision | med | L | Caption/metadata in `$gray-400` (#9ca3af) = **2.54:1 on white** (need 4.5:1). Hits timestamps & login hints. DESIGN_SYSTEM.md prescribes `$gray-400` for captions — the documented colour fails AA. Dark mode passes (~5.76:1). (1.4.3) | Bump *meaningful* caption text to `$gray-500` (4.76:1); update DESIGN_SYSTEM.md guidance. Audited instances: `LoginPage.module.scss` `.fieldHint`, StageFeed/Discussion `.time`. (Full sweep = long-tail.) | Open |
| 3 | Onboarding (LoginPage) | low-vision | med | S | Error/warning blocks use ad-hoc hex (`#e53e3e` text on `#fef2f2` ≈ **3.77:1**, `#fffbeb`/`#fcd34d`/`#d97706`) that bypasses the AA-verified semantic-surface token pairs. (1.4.3) | `src/pages/LoginPage.module.scss:156,171,172,177,178,213` → `$error`/`$error-surface`/`$error-on-surface` + `$warning-surface`/`$warning-on-surface`. | Open |
| 4 | Stage feed | SR | med | M | Stage feed has **no `<h1>`**; headings start at `<h3>` (card titles). Root: `PageHeader layout="homepage"` renders a wordmark `<button>`, not an h1. Also affects HomeView & IdentityView. (1.3.1, 2.4.6) | Give the stage feed a programmatic h1 (the stage name). `src/pages/StageFeedView.tsx` (visually-styled or visually-hidden h1); consider an h1 affordance for the homepage `PageHeader` variant. | Open |
| 5 | Stage 5 (Mandate) | SR | med | M | `MandatePage` emits **3 `<h1>`s** (PageHeader "Published mandate" + `MandateCard` title + full-article title). Multiple h1s break heading nav. (1.3.1) | Keep one h1 (PageHeader). Demote `MandateCard` hero title and the article title to `<h2>`. `src/components/mandate/MandateCard.tsx`, `MandatePage.tsx` (Batch-5 — targeted). | Open |
| 6 | Stage feed (+ shared) | low-bandwidth/touch | med | S | **Banner dismiss button = 24×24px** — below the project ≥44px target. Shared `Banner`, so it affects the new stage-feed pointer *and* every banner. (project ≥44px; 2.5.5 AAA) | `src/components/shared/Banner.module.scss` — pad the dismiss control's tap area to ≥44×44 (icon can stay small). | Open |
| 7 | All (shared chrome) | low-bandwidth/touch | med | S | **NotificationsBell = 30×33px** (icon-only, in `PageHeader`) — below ≥44px. Affects every flow. (project ≥44px; 2.5.5 AAA) | `src/components/shared/NotificationsBell.*` / `PageHeader.module.scss` — enlarge tap area to ≥44×44. | Open |
| 8 | Initiative/Mandate/Discussion + About | low-bandwidth/touch | med | S | Back buttons below ≥44px: PageHeader single-row `.backButton` **91×35**; InfoPage/About `.backButton` **38×36**. (project ≥44px; 2.5.5 AAA) | `src/components/PageHeader.module.scss .backButton`; `src/components/identity/InfoPage.module.scss .backButton` (currently `width/height: 36px`). | Open |
| 9 | Onboarding (LoginPage) | keyboard, SR | med | M | Server-URL history dropdown items are `<div onMouseDown>` — no `role`/`tabIndex`/keyboard path; a keyboard user can't pick a remembered server (the field itself still works). (2.1.1, 4.1.2) | `src/pages/LoginPage.tsx:189–200` — render items as `<button>`s (or a `role="listbox"`/`option` combobox) with `onKeyDown`. | Open |
| 10 | Community home (+ shared) | keyboard, SR | med | M | `SlideOutMenu` (role=`dialog`, `aria-modal`, Esc ✓, labelled "Close menu" ✓) **does not move focus into the dialog on open**, and likely doesn't restore focus to the trigger on close. (2.4.3) | `src/components/.../SlideOutMenu.tsx` — focus the dialog/close button on open; restore focus to the menu button on close. | Open |
| 11 | Onboarding (LoginPage) | multilingual | med | M | **No language switcher pre-auth** — a newcomer can't choose their language before logging in. (Usability/i18n; no single WCAG SC.) **PRODUCT CALL** — spec §8 excludes "form/auth restructure"; adding a switcher is small but Eston's call. | `src/pages/LoginPage.tsx` — add `<LanguageSwitcher>` to the card header. | Open |
| 12 | Stage 2 (Discussion) | low-vision/colour-blind | low | S | Diff insertions rely on **colour alone** visually: `<del>` has `line-through` but `<ins>` has `text-decoration: none`. (`<ins>` tag covers SR.) (1.4.1) | Restore an underline (or other non-colour cue) on `<ins>` in the SharedStatement diff. `src/components/collaboration/DiscussionStageView.module.scss`. | Open |
| 13 | All (shared chrome) | multilingual | low | S | `PageHeader` homepage menu `aria-label="Open menu"` is hardcoded English (not `t()`-wired). | `src/components/PageHeader.tsx:69` → `t('nav.openMenu', 'Open menu')`. (Confirm the community variant "Open community menu" too.) | Open |
| 14 | Onboarding (LoginPage) | SR | low | S | Login error `⚠️` emoji sits in a bare `<div>` — SR reads "warning" before the error title. (1.1.1) | `src/pages/LoginPage.tsx:208` — `aria-hidden="true"` on the emoji wrapper. | Open |
| 15 | Initiative dash / Discussion | SR | low | M | Heading-level skip: `<h1>` → `<h3>` for stage/section cards (no `<h2>`). (1.3.1) | Demote stage/section card headings `h3`→`h2` where they sit directly under the page h1 (verify shared-component reuse first). | Open |
| 16 | Stage feed / Home | low-bandwidth/touch | low | S | Gloki wordmark button (homepage header) is **40px** tall — borderline <44px. (project ≥44px) | `src/components/PageHeader.module.scss .wordmark` — min-height 44. | Open |
| 17 | Onboarding (LoginPage) | — (token debt) | low | S | Background gradient uses ad-hoc hex `#667eea`/`#764ba2` (decorative; card covers it, so not a contrast fail). | `src/pages/LoginPage.module.scss:10` — tokenize. | Open |
| 18 | Community home | SR | low | S | `CommunityView` renders the community name as both `<h1>` and `<h2>` (duplicate). | Drop or repurpose the duplicate heading. `src/pages/CommunityView.tsx`. | Open |

---

## 3. Systemic note — the `$gray-400` caption colour (finding #2)

This is the one finding bigger than a single surface. `$gray-400` (#9ca3af) on white is **2.54:1** —
below the 4.5:1 AA floor for normal text — yet DESIGN_SYSTEM.md (Typography → Caption) explicitly says
"Use `$gray-400`." So **timestamps and helper text across the app likely fail AA in light mode** (they
pass in dark, ~5.76:1, because the surface is dark). Measured-good neighbours: `$gray-500` (#64748b) =
**4.76:1** (used by HowGlokiWorks descriptions and "4 countries"), and SDG-blue = 7.15:1.

**Recommendation:** treat the audited-flow instances as quick fixes now (S each — login hints, feed &
discussion timestamps → `$gray-500`), and update the DESIGN_SYSTEM caption guidance so the debt stops
growing. A full app-wide caption sweep is **long-tail** (L) — flag, don't gold-plate.

---

## 4. Token-debt long-tail (flag, mostly out of a11y scope)

25 component SCSS files carry ad-hoc hex (design-system debt). Only the contrast-relevant ones are a11y
findings (covered above: LoginPage #3, the gray-400 systemic #2). The rest — `PageHeader` notification
badge pinks, `InitiativeDashboard.module.scss` (5), `CommunityView.module.scss` (2), and the dialogs/
`CollabList`/`IdentityCardDialog` (out of the 7 audited flows) — are **token-compliance**, not a11y, and
belong to a separate cleanup wave unless a specific value fails contrast. Flagging, not fixing, this batch.

---

## 5. What's already strong (verified — do not "fix")

- **Welcome guide (new):** focus moves to the step `<h1>` on change; heading order H1→H2→H2; trust copy
  constant-derived & accurate ("vouched by 2 … reach 4 … Vote & Mandate"); stage desc 4.76:1, trust line
  14:1; icons `aria-hidden`; semantic `<ol>`/`<ul>`; **6-dot Stepper holds at 360px (scrollW=clientW)**.
- **Stage-feed pointer (new):** `role="status"`, correct stage interpolation, labelled "Dismiss" button.
  (Only gap: the shared dismiss tap area — finding #6.)
- **Discussion (Stage 2):** semantic `<del>`/`<ins>` diffs, per-edit `progressbar` ("3 of 4 supporters
  needed to fold in") + participation `progressbar`, text category labels (Impact/Concerns), a `polite`
  live region.
- **Mandate (Stage 5):** named `region`s, `DescriptionList` for metrics, labelled toggle `group`, journey
  `list`, three **text-labelled** signals (REACH/MANDATE/CONVICTION — never colour-alone), Share `status`
  region present (couldn't trigger copy in-sandbox — clipboard blocked).
- **Initiative dashboard:** single h1, `progressbar` with full `valuemin/now/max` + name, text stage
  statuses (Completed/Active/Locked), real `<button>`s for all clicks.
- **Cross-cutting:** no clickable non-`<button>` elements in the flows (except #1 & #9); zero physical
  directional CSS (RTL-ready); +35% long strings wrap without overflow; dark-mode contrast strong.

---

## 6. Review gate — recommended appetite (for Eston)

The fixes cluster into three tranches. My recommendation, smallest-risk-first:

**A. Quick, high-leverage, low-risk — recommend doing now (all S):**
- #1 discussion-card keyboard (high — the one task-blocker; S–M)
- #6 Banner dismiss + #7 NotificationsBell + #8 back buttons (shared chrome touch targets — three small
  edits fix every flow)
- #3 LoginPage error/warning → tokens (also fixes contrast)
- #14 error-emoji `aria-hidden`, #13 menu `aria-label` → `t()`, #12 `<ins>` underline, #17 gradient token

**B. Targeted but a touch more care — recommend, your call (M):**
- #4 stage-feed h1, #5 Mandate single-h1 (touches `MandateCard`), #9 LoginPage history dropdown keyboard,
  #10 SlideOutMenu focus management, #2 (audited-flow caption instances + DS doc note)

**C. Flag, don't gold-plate (defer):**
- #2 full app-wide caption sweep (L), #15 heading-level skips, #16 wordmark height, #18 CommunityView
  duplicate heading, and the §4 token-debt long-tail.

**One open product question for the gate:**
- **#11 — add a language switcher to the LoginPage?** Spec §8 excludes a form/auth *restructure*; a
  switcher is additive and small, but it's a product call (and under "English-now" it only affects the
  already-localized `common.*`/`nav.*` keys today).

---

## 7. Method appendix

- Static anti-pattern sweep (grep): ad-hoc hex, literal `rgba`, physical directional props, `aria-*`/
  `title`/heading/role coverage, clickable non-buttons — to build the candidate backbone.
- Live verification (Claude Preview MCP, 360px, light **and** dark): accessibility-tree snapshots
  (roles/names/headings), computed-contrast math on real `getComputedStyle` colours, touch-target
  bounding boxes, focus-on-change checks, `+35%` long-string injection, dialog focus/Esc behaviour. No
  finding asserted from source alone — each confirmed in the rendered DOM (except #9, where the source
  `<div onMouseDown>` is unambiguous and the dropdown wouldn't open under synthetic focus).
- Personas applied per flow: low-vision (200%/360px reflow + AA contrast), keyboard-only (focus order/
  visible focus/no traps), screen-reader (roles/names/heading order/live-regions), low-bandwidth/basic-
  phone (360px integrity + touch ≥44px), multilingual (long-string overflow + RTL-readiness + `t()`).
