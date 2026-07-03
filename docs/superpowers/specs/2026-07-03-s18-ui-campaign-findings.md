# S18 UI Review Campaign — Findings Log

**Run 2026-07-03 against local `ui` @ `a53a6f3` (S17 complete, unpushed — 8 commits ahead of
origin).** Triggered by Eston (2026-07-03): "card designs are quite messy"; stage-view previews
should expand in place; the send-a-suggestion page is emblematic (title/header separation,
tiny suggestion box, tiny button icon); "padding and small icons and headers rampant"; wants a
dark/light toggle in the hamburger menu. Instruments: grep gates, alpha-blending contrast sweeps
(light+dark, scheme-verified per read — the emulation resets on navigation and applies async;
readings taken only after a settled `matchMedia` check), touch-target boxes with `::after`
awareness, landmark counts per route, composition block-counts, one persona walk (Amara, sw,
create-initiative journey). Severities rank against the two north stars.

## Phase 0–1 — Baseline: ALL CLEAN

Build green; grep gates 1a–1c at baseline (gray-400: 0, raw hex: 0, literal rgba: 10);
`role="tab"`: FundingFlow only (known Wave-1.5 lead). Theme-toggle sizing measured:
**297 `prefers-color-scheme` blocks across 104 SCSS files**.

## Findings (deduped, ranked)

### Majors

| # | Where | Measured evidence | Fix direction |
|---|---|---|---|
| M1 | `/welcome` (OnboardingFlow) | **0 `<header>`, 0 `main#main`** in both schemes (h1 ok). The entry journey has no banner, no skip-link, outside the page model — same class as S16's L1 (/create-community, fixed) | Wrap onboarding in AppHeader + `main#main` (S16 precedent) |
| M2 | Expanded vote card (community feed) | Engage panel stacks **~12 co-equal blocks ≈ 1,890px** tall at 360px (flag: >5); ballot items 385px each; **boxed nesting depth 4** (flag: >2). The S15 accretion pattern, now in VoteEngage/QVFlow | Recomposition, NOT reverts (S15 method): fold explainer/region-key/privacy prose behind inline expands; flatten ballot items |
| M3 | InitiativeStageStrip (in every expanded card) | Four ~52px saturated stage circles = the loudest element on screen, duplicating the StageFooter's 4-stage vocabulary at ~10× visual weight, inches above it; mixed affordances (only Mandate is tappable — underlined; others static) | Recompose to a compact low-weight strip (small dots/pills, one affordance rule); stage colours keep meaning but not dominance |
| M4 | SuggestionDmView (Eston's emblematic page) | Send-icon **renders 5.6×18px** despite `width="18"` (real rendering bug; EmptyState icon on same page renders correctly); composer textarea 308×38 (rows=1) for the page's primary act; input bar floats mid-page rather than anchoring; title zone visually undifferentiated from the universal bar (0.5px hairline, 0 gap) | Fix icon bug; grow composer (min ~3 rows); anchor input bar bottom; page-title-zone treatment per D3 |
| M5 | Stage-feed `communityBadge` chips | `$primary` text on `rgba($primary,.2)`: **3.28:1 light / 3.06:1 dark** (12–13px text) | Light: `$info-on-surface`; dark: `$primary-on-dark` |
| M6 | App-wide | No post-login UI-language switch (S17 Thandiwe finding; menu has no entry; logout is the workaround) | LanguageSwitcher entry in the hamburger menu (pairs naturally with the theme toggle work) |

### Minors

| # | Where | Evidence | Fix |
|---|---|---|---|
| m1 | Stage-feed thresholdBanner | `$gray-600` on `rgba($primary,.06)` = **4.26:1** — same root pattern as S17's C4 | `$gray-700`; grep-sweep remaining `$gray-600`-on-tint sites |
| m2 | StageFooter active tab, dark | `$primary` on `$dark-bg` = **3.98:1** at 10px | dark active → `$primary-on-dark` |
| m3 | Create-initiative submit | No visible/announced confirmation; new card just appears after async deploy (Amara walk) | success Banner or `role="status"` line |
| m4 | Kit Button `md` | 40px tall bare (visible on /welcome CTAs) — T8 was "settled" but Eston's padding complaint reopens it | Eston decision D4 |
| m5 | Page-title zone | 4 patterns across routes (title-in-AppHeader, in-content h1, visually-hidden h1, MandateCard h1) — the root of Eston's "separate title from universal header with a rule" | Eston decision D3, then normalise |
| m6 | Progress bars | 3 implementations (QVFlow track, AdoptionFramework progressFill, SharedStatement barFill) | Wave-1.5 kit extraction |
| m7 | Icon sizes | 11–16px icons inside primary/secondary actions across the app ("View full" 11px, suggest/send 16px…) — "small icons rampant" | Icon-floor policy (D5) + sweep |

### Notes / locked
- 3.68 white-on-$primary + 3.52–3.98 $primary-text family: locked brand-blue notes, no action.
- HomeView in-content `<header class="intro">` inside `main`: scoped, not a banner — model holds.
- 404, /identity, /create-community, community feed, HomeView: contrast + landmarks clean.
- Content (fixtures/user text) stays English in fr/sw — known post-handoff content-translation item.

## Persona sampling this campaign

Amara (sw, 360px): create-initiative journey **completed unaided** — form fully localized,
plain-language guidance; one minor filed (m3). Thandiwe/Pascal/Tomás/James were walked at this
HEAD in S17 (one blocker fixed: faafa45). **Not run:** Chidi, Dr. Giorgia, Marie, Viktor —
their artifact-focused lenses were partially covered by instruments (S12 evidence surfaces, S16
coherence walk, S17 James mandate pass), but this is a sampling gap, not coverage.

## Product decisions requested (Eston)

- **D1 — Stage-feed inline expansion** (Eston directed): replace StageFeedCard tap-through with
  the community ActivityCards expanding in place for problem/proposals/vote. Recommend mandate
  keeps navigating to the published artifact and discussion keeps opening the co-authoring view.
  Scope: StageFeedView only (ActivityCards + useAllInitiatives already carry the needed context).
- **D2 — Dark/light toggle** (Eston directed): 3-state Auto/Light/Dark in the hamburger menu.
  Mechanism: `data-theme` on `<html>` + `gloki.theme` localStorage + a `dark` SCSS mixin, with a
  codemod rewriting all **297 media blocks in 104 files** to the mixin. Mechanical but wide —
  recommend it ships as its OWN session with 3-mode route verification, after the fix wave.
- **D3 — Page-title zone standard**: one treatment app-wide (recommend: AppHeader stays global-only;
  below it a standard page-title block — eyebrow + h1 — separated from the bar by a full-width
  rule, per Eston's suggestion-page direction).
- **D4 — Button md → min-height 44px** app-wide?
- **D5 — Icon floor**: 16px minimum inline, 20px in buttons/CTAs?
- **D6 — Sequencing**: wave 1 = mechanical fixes (M4 icon bug, M5, m1, m2, m3, M1) + S17 backlog
  push; wave 2 = card recomposition (M2+M3, S15 method); wave 3 = stage-feed inline expansion (D1);
  wave 4 = theme toggle + M6 language switcher (menu work overlaps).

## Deviations from the campaign skill

- Persona phase sampled (1 new + 4 from S17) instead of the full 9 — recorded above, not silent.
- Phase 5 proxies folded into M2/M3 (visual noise, density, crispness measured on the worst
  surface) rather than run per-route.
