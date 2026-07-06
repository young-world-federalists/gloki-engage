# S22 plan — Wave 1.5 remainder: kit convergence + token-debt zero

Spec: `docs/superpowers/specs/2026-07-06-s22-wave15-kit-convergence-design.md`.
Build order chosen smallest-risk-first; every step leaves `ui` runnable and `tsc -b` green.
Direct execution (no subagents — cross-cutting shared-kit work; slow-drive rule).
**This doc is the live status tracker — update the checkboxes as steps land.**

## Status

- [x] **Step 1 — T3 SegmentedControl radiogroup** `07b3362` (preview-verified: arrow-key
  selection + roving tabindex on the Theme control; theme actually applied)
- [x] **Step 2 — T1a Modal aria-labelledby** `bfe3b56` (verified end-to-end via the
  CreateCollabDialog port: dialog accName resolves from title)
- [x] **Step 3 — T2 ProgressBar extraction** `3c086af` (QVFlow + AdoptionFramework
  preview-verified light+dark 360px; SharedStatement covered by tsc + Step-8 sweep;
  dark track deliberately canonicalized $dark-surface → $dark-border)
- [x] **Step 4 — T1 dialog ports** `b3e0586` MessageDialog→useAlert (deleted), `ddf53d2`
  ApprovalDialog (NOT preview-verified — no nominate in seed), `cccaf10` CreateCollabDialog
  (verified: accName/focus/Escape/backdrop token), `5c8c8e3` QRScannerDialog (chrome verified;
  camera untestable in sandbox), `a64a6ac` MergeProposalSubmitModal (tsc; deep flow)
- [x] **Step 5 — T4 token debt → 0** `3a31621` (raw-rgba grep = 0; $scrim-light replaces the
  black 0.3 scrim with slate 0.3 — deliberate hue alignment)
- [x] **Step 6 — T5 helpers + T5b flags** `0ad8224` (initials 4→1, formatDateTime 2→1,
  CountryFlag double-announcement fix; behavior delta: single-word names now give 2-letter
  initials everywhere)
- [x] **Step 7 — T6 docs** (DESIGN_SYSTEM $secondary out / ProgressBar + Modal laws + tokens
  + radio semantics in; MASTER_TODO §7 supersession entry; i18n packet Session-22 section)
- [ ] **Step 8 — whole-session verification sweep** (recipe in spec) then whole-diff review
  (0 Crit / 0 Imp) → present to Eston for the push gate

**Mid-session note:** Eston's parallel session pushed `origin/ui` at 09:11 (favicon rebrand
`ce0251a`), carrying the first four S22 commits to production mid-build. Everything pushed was
tsc-clean; protocol held to ship-grade commits thereafter.

## Standing constraints

UI-only session: no fixture edits → **no DEMO_VERSION bump**. Any new i18n key: en default +
fr + sw + packet append. No new top-level routes. Wire names untouched (no seam changes at
all). Commits: `feat(s22)/fix(s22)/chore(s22)/docs(s22)`.
