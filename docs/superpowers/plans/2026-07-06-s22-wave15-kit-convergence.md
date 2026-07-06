# S22 plan — Wave 1.5 remainder: kit convergence + token-debt zero

Spec: `docs/superpowers/specs/2026-07-06-s22-wave15-kit-convergence-design.md`.
Build order chosen smallest-risk-first; every step leaves `ui` runnable and `tsc -b` green.
Direct execution (no subagents — cross-cutting shared-kit work; slow-drive rule).
**This doc is the live status tracker — update the checkboxes as steps land.**

## Status

- [ ] **Step 1 — T3 SegmentedControl radiogroup** (files: `shared/SegmentedControl.tsx`;
  verify: tsc, preview arrow-key walk on MenuSettings theme control, 5 consumers labelled)
- [ ] **Step 2 — T1a Modal aria-labelledby** (files: `shared/Modal.tsx`; verify: tsc, a11y
  snapshot shows dialog name from title)
- [ ] **Step 3 — T2 ProgressBar extraction** (files: new `shared/ProgressBar.*`, barrel,
  `flows/voting/QVFlow.tsx+scss`, `mandate/AdoptionFramework.tsx+scss`,
  `flows/discussion/SharedStatement.tsx+scss`; verify: tsc + 3 surfaces visually unchanged
  at 360px light/dark)
- [ ] **Step 4 — T1 dialog ports, one commit each:** MessageDialog → ApprovalDialog →
  CreateCollabDialog → QRScannerDialog → MergeProposalSubmitModal (each: port to Modal,
  delete local overlay scss, keyboard-check in preview before the next)
- [ ] **Step 5 — T4 token debt:** `variables.scss` dark-tint trio + Button/Modal/Badge/
  SegmentedControl/IdentityTrust swaps; LoginPage shadows → tokens; CommunityView
  `.optionsOverlay` → `$overlay-bg`; verify raw-rgba grep = **0**
- [ ] **Step 6 — T5 helpers:** `utils/formatDateTime` (ChatTopic, ThreadedDiscussion);
  `utils/initials.ts` (RoleDisplay, SmartImage, digitalAgentStore); T5b CountryFlag in
  ConvictionStaking + AdoptionFramework
- [ ] **Step 7 — T6 docs:** DESIGN_SYSTEM.md ($secondary row out, ProgressBar + Modal law +
  tint tokens + radio semantics in); MASTER_TODO §7 wave-1.5 supersession note
- [ ] **Step 8 — whole-session verification sweep** (recipe in spec) then whole-diff review
  (0 Crit / 0 Imp) → present to Eston for the push gate

## Standing constraints

UI-only session: no fixture edits → **no DEMO_VERSION bump**. Any new i18n key: en default +
fr + sw + packet append. No new top-level routes. Wire names untouched (no seam changes at
all). Commits: `feat(s22)/fix(s22)/chore(s22)/docs(s22)`.
