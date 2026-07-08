# Wave 1b — canonical page-container Implementation Plan

> No test framework — verify via `npx tsc -b` (exit 0) + controller-driven preview at **1024px
> (desktop, now first-class) AND 360px**, light + dark. Spec:
> `docs/superpowers/specs/2026-07-08-w1b-canonical-page-container-design.md`.

**Goal:** one `@mixin page-column` + `$footer-clearance` token; the AppHeader + every content column
share one centred 640px column on desktop. Full detail (outer/inner classification, skip list) is in
the spec — this plan phases the build.

## Global constraints
- Tokens/mixin only; consume W1's `$content-gutter`/`$content-max-width`. `$primary` locked.
- `max-width` is a cap → **360px must be unchanged**; only desktop >640px changes.
- No `DEMO_VERSION` bump, no i18n. Each phase leaves `ui` runnable + `tsc -b` green.
- Slow drive: read each file's root wrapper before editing; small sequential edits.

## Phase 1 — mixin + token + AppHeader + primary outers
- `variables.scss`: add `@mixin page-column` + `$footer-clearance`.
- `AppHeader.module.scss`: `.header` → full-width bg, `padding: $spacing-sm 0`; `.bar` + `.titleBlock`
  → `@include page-column`.
- Outers → `@include page-column` + `padding-bottom: $footer-clearance`: Container `.content`,
  CommunityView `.body`, StageFeedView `.feedContainer`, HomeView `.home`.
- `tsc -b`; **commit** `feat(s24): page-column primitive + AppHeader/primary-column desktop alignment`.
- Verify: desktop 1024px — header eyebrow/title == content left edge, column centred; 360px unchanged.

## Phase 2 — strip inner column duties
Read each root, drop `max-width`+`margin:auto` (+ self-padding): identity (Communities/InfoPage/
JoinCommunity); mini-apps (Members/Currency/IdentityTrust/CollabList/Share/CommunitySettings); chat
(ChatTopicList/ChatTopic — keep 380px bubble caps); writeTogether (StartDraftForm/WriteTogetherPage/
DraftEditor); CreateInitiativePage `.page`; FundingFlow (×3); DiscussionStageView `.main`.
- `tsc -b`; **commit** `feat(s24): inner wrappers fill the canonical column (drop bespoke widths)`.
- Verify: each mini-app + identity + chat + writeTogether + funding + create-initiative + discussion at
  1024px (fills the 640 column, single gutter, no double-inset) and 360px (unchanged).

## Phase 3 — remaining outers + footer-clearance unification
- `@include page-column`: NotFound `.main`, CreateCommunityPage `.page`, OnboardingFlow `.container`.
- Replace bespoke bottom pads on the section-B outers with `padding-bottom: $footer-clearance`.
- `tsc -b`; **commit** `feat(s24): finish outers + unify $footer-clearance`.
- Verify: create-community, onboarding, 404 at desktop+mobile.

## Phase 4 — codify + review + push
- `DESIGN_SYSTEM.md`: page-column primitive + `$footer-clearance` + the outer-owns-column model +
  the one-canonical-640-column law. **commit** `docs(s24): codify canonical page-column primitive`.
- Adversarial Workflow review over the W1b diff (dimensions: desktop-alignment, inner/outer-correctness,
  mobile-regression, token-discipline, completeness). Fix confirmed findings.
- Present verdict → **Eston push gate** → closeout (§7 P7-W1b, §8, i18n note, memory).

## Self-review
Spec coverage: §A→P1(AppHeader); §B→P1+P3(outers); §C→P2(inners); §D→P3(footer); codify→P4. Skip list
(DiscussionFlow dead, PresenceShowcase dev, small caps) carries no task by design. ✅
