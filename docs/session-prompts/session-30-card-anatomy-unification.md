# Session 30 — Card anatomy unification (walkthrough-campaign Wave A)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This session
implements **Wave A** of the 2026-07-13 walkthrough campaign
([docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) — read it
FIRST, it holds the verified findings, file:line evidence, risks, and decisions). Campaign source:
Eston's live click-through, verified same day against HEAD `c91bd86` (7-unit read-only fleet +
controller preview walk). The prior campaign (S24–S29) is complete; this is new work on top of it.

This session is a BUILD. It changes UI composition only — no contract methods, no fixtures, no
DEMO_VERSION bump, no routes.

## Tasks (build order)

1. **Stage-strip gutter** — `.stageNavRow` in `InitiativeStageCard.module.scss` gets
   `padding: 0 $spacing-lg`. NOT in the strip itself, NOT in FeedEngagePanel (host already pads —
   double-indent). Check fr/sw wrap at 360px after.
2. **De-buttonize the current-stage pill** — drop the pill border/background tint on `.current`;
   carry emphasis with the stage dot + `$gray-900` semibold. Never make it navigate (locked S19
   W2). Preserve the `discussion → 0.5` special case. Keep DiscussionPill visually distinct
   (it IS interactive).
3. **Threshold bar → ProgressBar kit** — replace ProblemVoteFlow's bespoke track/fill/marker
   (`ProblemVoteFlow.tsx:186-205`) with the shared kit (`value=up`,
   `max=ceil(0.5*members)`, conditional variant). The gray end-line dies; ARIA arrives. Delete the
   three bespoke classes + audit the dark block for orphans (S28). Label = the threshold-hint copy
   (task 4); don't double-announce with the visible seconded/needed row.
4. **Re-home "Agreed by at least half…"** — `problems.thresholdMetHint`/`thresholdHintShort`
   move from the floating `<p>` in ProblemEngage into the threshold-bar block as its caption.
   Collapsed `card.teaserAgreed` stays.
5. **Universal two-tone chin + chinExtras slot** — the campaign doc §2 A-5 has the full spec:
   extract one chin implementation; restructure StageFeedView's host card (padding 0 +
   overflow:hidden, padding inward) so the stage-feed chin can tint — the `.panelWrap`
   z-index/::after hit-area model (S20) must survive; add a `chinExtras` slot to both owners;
   move "Send suggestion to author" + Problem-code chip from ProblemEngage's body into the
   problem-card chin; restyle stage-feed "Open in community" per decision D4. **Measure intrinsic
   pill widths before composing the chin row (S29 law)** — expected: Discussion + short suggest
   pill on row 1, full-width code chip on row 2. Build the composition, screenshot at 360px, show
   Eston before finalizing.
6. **DESIGN_SYSTEM.md** — codify: universal chin law, strip gutter, and update the
   `FeedEngagePanel.module.scss:23-26` comment that codifies the old rule-only call (notes the
   reversal of ui-polish-campaign §1.3).

## Open decisions to lock BEFORE building (batch to Eston, recommend-then-confirm)

From the campaign doc §6: **D2** (de-buttonize only — recommended), **D3** (short suggest-pill
label — recommended, screenshot both), **D4** (Open-in-community as pill — recommended). If Eston
already annotated the campaign doc, take those as locked.

## Re-verify these premises vs HEAD (the recurring lesson — 16 straight sessions caught rot)

Run the campaign doc §7 checklist — every file:line premise for Wave A is listed there. Highlights:
no `chinExtras` slot exists yet; the bespoke bar is still at `ProblemVoteFlow.tsx:186-205` with
`left:'100%'` marker; `.stageNavRow` still unpadded; kit ProgressBar still marker-less.

## Read first

- [docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) — the spec
- DESIGN_SYSTEM.md §5 (card rules), § chin/footer tokens (S25), § component states
- `src/components/initiative/InitiativeStageCard.tsx` + `.module.scss` (chin owner 1 — source of truth)
- `src/components/initiative/FeedEngagePanel.tsx` + `.module.scss` (chin owner 2)
- `src/components/initiative/stages/ProblemEngage.tsx` (items moving into the chin)
- Memory: `project_session25_jul2026` (chin S25), `project_session29_jul2026` (width-measure law)

## Workflow + constraints (same discipline as S1–S29)

Brainstorm-lock decisions → spec commit (`docs/superpowers/specs/2026-07-XX-card-anatomy-design.md`)
→ build in small `feat(s30):` commits, `ui` runnable each → per-chunk `npx tsc -b` + `npm run
build` + grep-gates → controller-only preview verification 360px light+dark en/fr/sw on community
feed + all stage feeds → i18n parity + packet append for any new/changed keys → Opus whole-branch
review → **hold the push for Eston's explicit green light**. Slow-drive I/O discipline: targeted
reads, sequential subagents only, implementers never touch the preview. PR #20's ✗ vs main stays
expected divergence, not a failure.

When ready: verify the premises, then batch the D2/D3/D4 decisions to Eston with your
recommendations.
