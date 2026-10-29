# S17 — Fix tail from the S16 findings log, then freeze for handoff

**Session 17, 2026-07-03. Base: `ui` @ `5979ea7` (S16 fully pushed — `ui == origin/ui`).**
Consumes `docs/superpowers/specs/2026-07-03-s16-ui-review-findings.md`. No new features;
anything beyond this list goes to MASTER_TODO §7 "Post-handoff".

## Re-grounding results (premises vs HEAD)

| Prompt premise | Reality at HEAD | Effect |
|---|---|---|
| S16 commits unpushed, push pending | `ui == origin/ui` — Eston green-lit; deployed | §7 blocker already cleared |
| N3 duplicate titles open | Fixed in S16 `a7aa652`: CommunityView `titleVisuallyHidden`; MandatePage AppHeader title-less, MandateCard h1 sole owner; MandateDocument h2 doc-title = documented sanctioned exception | N3 → visual confirm in preview walk, then no-op |
| C4/C5, N4, T5–T7, turnout open | All confirmed open, root causes measured (below) | Build |

## Decisions locked (Eston, 2026-07-03)

1. **N4:** the vote-stage card gains the initiative **title line** above the description
   headline ("Add title line" over "keep description-first"). The "Cast your vote" teaser
   is styled as a tappable affordance either way.
2. **Persona sample runs:** 4 personas (Thandiwe, Pascal, Tomás, James), sequential,
   controller-driven, 360px, after the fix wave. Findings filed; only blockers fixed.

Decisions delegated by the prompt ("measure, then decide, then document"):

3. **T6 StageFooter** stays compact — **documented sanctioned exception**. Tabs measure
   ~57×37: passes WCAG 2.5.8 AA (24px floor) and the whole-tab hit area is honest; forcing
   44px tab height adds ~10px of fixed bar to every screen at 360px, hurting the density
   the bar was designed for. Documented in DESIGN_SYSTEM.md touch-target law.
4. **T7 source chips** get a ≥24px hit-area floor (AA target-size) and are otherwise the
   documented **inline-link exception**; no 44px inflation inside meta lines.

## Changes

### C4 — SegmentedControl unselected label (shared component)

`src/components/shared/SegmentedControl.module.scss:32`: unselected option label is
`$gray-600` (#64748b) on the `$gray-100` track = **4.34:1**. Fix: `$gray-700` (#374151)
≈ 8.6:1. Dark mode already passes ($dark-text-secondary on $dark-surface). Consumers
lifted app-wide: MandateDocument (the flagged instance), CommunitySettings,
CollaborationFullView, ApprovalFlow.

### C5 — AdoptionFramework summary breakdown, dark mode

`AdoptionFramework.module.scss` `.summaryBreakdown` dark: `$dark-text-secondary`
(#94a3b8) on `$info-surface-dark` (#1e3a8a) = **4.04:1**. Fix: `$dark-text` (#f1f5f9)
≈ 12:1, matching how sibling text on that surface resolves. Token-only change.

### N4 — vote card title line + teaser affordance

- `StagePost` (InitiativeStageCard.tsx) gains optional `title?: string`, rendered as a
  compact title line above the headline. Rendered only when present AND ≠ headline
  (guards the fallback case where headline already collapsed to the title).
- `VoteActivityCard` passes `title: item.title` (vote stage only — other stage cards
  unchanged; content-as-headline stays the model elsewhere).
- Teaser: `collapsedTeaser` rendering gains an action variant (new `teaserAction` prop or
  tone) — `$primary-dark` + semibold so "Cast your vote" reads as an affordance; dark
  mode uses `$primary-on-dark`. Vote card opts in; informational teasers ("12 agree")
  stay muted.

### T5 — HomeView "See all" hit area

`.seeAll` (HomeView.module.scss) gets the S16 house pattern: `position: relative` +
invisible `::after` extending the hit area to ≥44px (same recipe as MandateCard
`.linkBtn`). No visual change.

### T7 — source-chip hit floor

`.metaItem` links in `InitiativeStageCard.module.scss`: `min-height: 24px` (AA 2.5.8
floor) with centered alignment; no layout inflation. DESIGN_SYSTEM.md documents the
inline-link exception explicitly.

### T6 — documentation only

DESIGN_SYSTEM.md touch-target section records StageFooter tabs as a sanctioned
exception (fixed global bar; AA-passing; density-deliberate).

### Turnout phrasing

`QVFlow.tsx:176` `mechanisms.qv.turnoutValue`: `'{pct}% of {target}% needed'` →
`'{pct}% have voted'`. The existing `turnoutNote` line directly below already says
"The vote completes when {target}% of members have taken part." — together they read as
the prompt's target phrasing without duplicating the threshold twice in one block.
fr: `'{pct} % ont voté'` · sw: `'Asilimia {pct} wamepiga kura'`. Packet appended.

## Out of scope

Everything in MASTER_TODO §7 "Post-handoff" and §6. No DEMO_VERSION bump (no fixture
changes). No contract-method changes (no FOR_OURI edits needed).

## Verification

Per chunk: `npx tsc -b` + `npm run build` green. After the wave: preview walk at 360px
light+dark (contrast re-measure C4/C5, tap-target boxes T5/T7, N3 visual confirm,
turnout copy in QV flow), i18n parity scanner, grep gates. Then the 4-persona sample,
Opus whole-branch review, Eston push gate.
