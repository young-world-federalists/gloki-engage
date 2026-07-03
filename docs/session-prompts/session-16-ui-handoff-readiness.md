# Session 16 — UI Handoff Readiness (review → fix → freeze)

**Written 2026-07-03 against `ui` @ `c26cdc4`. Goal owner: Eston.**

## Mission

Get the UI to a **final-ish stopping point ready to hand to Ouri**: run the full UI review,
fix what it finds plus Eston's three reported defects, verify problem→mandate coherence,
and clean the docs/roadmap so the handoff surface is obvious. **No new features** — liquid
delegation, points, Chichewa, content translation, WhatsApp are all post-handoff (see
Deferred below).

## Read first (in this order)

1. `.claude/skills/gloki-change-control` + `.claude/skills/gloki-session-lifecycle` — the gates.
2. `.claude/skills/gloki-ui-review-campaign` — Track A's executable recipe.
3. This file's decisions + premises.

Housekeeping first task: the skill library at `.claude/skills/` (15 skills + README, authored
2026-07-02) is **uncommitted**. Commit it as its own `docs(s16)`-style chore commit before
starting (local commit only — pushes remain gated by Eston).

## Decisions Eston has ALREADY made (2026-07-03) — do not re-ask

1. **Discussion is a function, not a pipeline step.** Remove `discussion` from the two
   per-initiative strips so they show 4 stages (Problem → Solutions → Vote → Mandate,
   matching the global StageFooter). Replace with a **persistent "Discussion" button with an
   activity count near each initiative card/dashboard title** — discussion reachable at
   EVERY stage. Presentation-only: the `discussion` stage key, `PipelineStage` type, routes,
   discussion contract, and all wire names stay untouched (seam rule).
   - Open sub-decision (recommend-then-confirm at session time): how to render initiatives
     whose *data* says `stage === 'discussion'` (seeded ones exist). Recommend: display them
     in the Problem→Solutions gap as "in discussion" via the new button's active state, and
     check `StageFeedView`/`DiscussionActivityCard`/`InitiativeStageCard` for stage-switch
     fallout before coding.
2. **Headings/titles normalisation + padding** — Eston reports many are inconsistent and
   cramped. Measure in Phase 3 (normalisation audit), then fix as one pass using tokens only.
3. **Button icons too small / nearly invisible** — measure against the 44×44px touch-target
   law and icon-size tokens in Phase 2b; fix all failures.

## ⚠️ Re-verify these premises vs HEAD before building

| Premise (verified 2026-07-03 @ c26cdc4) | Check |
|---|---|
| 5-stage strips: `src/components/initiative/InitiativeStageStrip.tsx:11-19` (STAGES + ORDER incl. `discussion`), `src/components/shared/StageStrip.tsx:14` | read both files |
| StageFooter already has 4 browseable stages (no Discussion) | `grep -n discussion src/components/shared/StageFooter.tsx` (expect no stage entry) |
| `DiscussionActivityCard.tsx` exists in `src/components/community/`; seeded initiatives at `stage: 'discussion'` exist | `ls`, `grep -rn "stage: 'discussion'" src/services/demo/fixtures/` |
| Skill library present + committed by now | `ls .claude/skills` |
| Baseline green: `npm run build` clean; parity script PARITY OK (fr=sw=1113); grep-gates ALL CLEAN | commands in the campaign skill Phase 0 |

## Tracks

**Track A — Run the UI review campaign** (`gloki-ui-review-campaign`, Phases 0–5).
Findings log as a docs file; severity vs the two north stars. Eston's items 2+3 above will
surface in Phases 2–3 — fold them into the same findings log rather than fixing ad hoc.
Phase 4 persona walks: sequential, controller-driven, budget-permitting; prioritize Phases
0–3 if constrained. Phase 5 aesthetic calls → recommend-then-confirm list for Eston.

**Track B — Problem→mandate coherence walk.** One initiative followed end-to-end as a real
user at 360px (en, then fr): surface a problem → discuss (via the NEW button) → author
solution with commitments → vote (QV hearts) → ratified mandate with indicators. Log every
discontinuity: vocabulary shifts, data that doesn't carry forward, navigation dead ends,
unexplained numbers. This is Eston's coherence review — treat breaks here as **major** even
if each screen passes in isolation.

**Track C — Fix wave.** Decision 1 (Discussion IA) + all blockers/majors from Tracks A+B.
UI-only expected (no DEMO_VERSION bump unless fixtures change). Per-chunk verification per
`gloki-verification-and-qa`; Opus whole-branch review before the push gate.

**Track D — Handoff hygiene (make it easy for Ouri).**
1. Refresh `docs/FOR_OURI_seam.md` against the actual stub surface — known gaps: S13's
   `set_property`/`get_properties` on initiative + the `mandate_ratification` property
   (flagged in `gloki-docs-and-writing` §2). Add anything Track C introduces.
2. `MASTER_TODO.md` cleanup: mark shipped work, restructure §7 into **"Handoff-blocking"**
   vs **"Post-handoff"** (move liquid delegation D3, points, Chichewa, content translation,
   WhatsApp, offline cache to post-handoff), changelog entry per §8 format.
3. Fix the two known-stale ARCHITECTURE.md sections (StageFooter description, `/` landing
   route) so Ouri reads accurate docs.

## Deferred — do not build in S16

Liquid delegation (D3), points/currency features, `ny.ts` Chichewa, content translation of
user-generated text, WhatsApp summary, offline last-view cache, fr/sw native review
(human-gated). All remain documented in `gloki-research-frontier` / MASTER_TODO post-handoff.

## Close-out

MASTER_TODO §7 status + §8 changelog; append new/changed fr/sw strings to
`docs/i18n-native-review-candidates.md`; update project memory; draft session-17 prompt
(likely: remaining campaign fixes or the handoff itself); **push only on Eston's explicit
green light** (a push deploys the live demo).
