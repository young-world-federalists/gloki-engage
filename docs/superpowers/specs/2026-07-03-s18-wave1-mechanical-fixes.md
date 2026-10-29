# S18 Wave 1 — mechanical fixes from the campaign findings

**Consumes `2026-07-03-s18-ui-campaign-findings.md`. Decisions locked by Eston 2026-07-03:
D1 problem/solutions/vote inline (W3), D3 title block + rule app-wide (W2), D4 buttons ≥44px +
D5 icon floor 16/20 (W2), D6 four waves — this is W1. The 9 unpushed S17 commits ride with W1's
push.**

## 1. Icon-button padding bug class (root cause of M4's 5.6px send icon)

`src/styles/index.scss:87` sets a global `button { padding: 0.6em 1.2em }` reset. Fixed-box
icon-only buttons that don't override padding get their content box crushed (44px − 38.4px =
5.6px at 16px font) and the flex-shrinking SVG collapses; severity varies with each class's
font-size, which is why some icon buttons look fine. Fix: `padding: 0` on the affected button
classes (component altitude — the global reset stays; a kit IconButton is the Wave-1.5 answer):

QRScannerDialog `.closeButton`, ChatTopic `.sendBtn`, SuggestionDmView `.sendBtn`, QVFlow
`.stepper`, Modal `.close`, SlideOutMenu `.closeButton`, SourcesInput `.remove`,
CreateCommunityPage `.backButton`, CreateInitiativePage `.backButton` + `.removeButton`.
(identity InfoPage backButton — locate the consumer first; skip if not a button.)
Verify with the live probe: every `svg.lucide` rect width must equal its width attribute on the
touched screens.

## 2. SuggestionDmView recompose (M4 rest)

- Composer: `rows={3}` + CSS `min-height` — the box is the page's primary act (was 308×38).
- Input bar: ChatTopic pattern — page becomes a full-height flex column, `.inputBar` gets
  `margin-top: auto; border-top: 1.5px solid $gray-200; padding-top` + footer clearance, so it
  anchors at the bottom instead of floating mid-page.
- Icon fix arrives via §1. Title-zone rule arrives app-wide in W2 (D3).

## 3. M5 — stage-feed communityBadge chips

`$primary` on `rgba($primary,.2)` measured 3.28:1 light / 3.06:1 dark. Light → `$info-on-surface`
(#1e40af, ≈6.9:1 on the tint); dark block → `$primary-on-dark` (#60a5fa) on a `rgba($primary,.25)`
tint over dark ≈ 7:1.

## 4. m1 — thresholdBanner caption + $gray-600-on-tint sweep

`$gray-600` on `rgba($primary,.06)` = 4.26:1 → `$gray-700` (the S17 C4 pattern). Grep-sweep all
`color: $gray-600` in `*.module.scss` whose enclosing surface is tinted; fix the confirmed ones.

## 5. m2 — StageFooter active tab, dark

`.active` in the dark block: `$primary` (3.98:1 on `$dark-bg`) → `$primary-on-dark`.

## 6. M1 — /welcome page model

OnboardingFlow renders no `<header>` banner and no `main#main` (skip link absent) — the entry
route sits outside the page model S16 repaired for /create-community. Wrap the flow: AppHeader
(no title — the step hero owns the visible heading, matching the documented onboarding-hero
exception) + `main#main tabIndex={-1}`. Visual change ≈ the global bar appearing on onboarding;
if it materially fights the immersive design, ship the landmark + skip-link skeleton with the
bar and flag for Eston in review.

## 7. m3 — create-initiative confirmation

After successful submit, the user lands on the feed with no confirmation while the contract
deploys (Amara). Add a `role="status"` success Banner on the community feed ("Your initiative
was created — it appears at the top as soon as it's ready", i18n en+fr+sw + packet append), or
the equivalent inline status line — smallest honest feedback.

## Out of scope (W2–W4, already assigned)

Card recomposition M2+M3, D3 title blocks, D4/D5 floors, stage-feed inline expansion D1, theme
toggle + M6 language switcher.

## Verification

Per chunk `npx tsc -b`; end-to-end: build, grep gates, parity scanner, live probe (icon widths,
chip/banner/tab contrast re-measure, /welcome landmarks, composer box), then Opus whole-branch
review over the full unpushed range (S17 + W1) → Eston push gate.
