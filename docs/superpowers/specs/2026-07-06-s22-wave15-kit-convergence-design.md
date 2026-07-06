# S22 — Wave 1.5 remainder: kit convergence + token-debt zero (design)

**Session:** S22, 2026-07-06. **Arc chosen by Eston at S22 open:** Wave 1.5 refactor lanes.
**Base:** `ui` @ `e69ef18` (S21 pushed & deployed; S18 campaign complete).

## Why this spec exists

The five wave-1.5 lane prompts (`docs/session-prompts/wave-1.5/`, generated 2026-05-31) predate
S1–S21 and are ~70% obsolete. This spec replaces them with the **verified living remainder**.
The lane files stay as historical record; this is the doc of record for S22.

### Re-grounding results (every lane claim checked vs HEAD `e69ef18`)

| Lane claim (2026-05-31) | Reality at HEAD | Disposition |
|---|---|---|
| Edit `PageHeader.module.scss` (logout pink) | PageHeader deleted 2026-06-18 (locked: single AppHeader) | Dead |
| Edit `PipelineView.module.scss` | PipelineView deleted (S7-era) | Dead |
| "Token violations everywhere", raw hex sweeps | grep-gates ALL CLEAN; raw-rgba debt = exactly 10 lines | Shrunk → T4 |
| Remove/document `$secondary` | Already deleted from variables.scss; DESIGN_SYSTEM.md:31 still documents it | Stale-doc fix → T6 |
| "Modal lacks aria-labelledby + focus trap — WCAG blocker" | Modal HAS focus trap/Escape/aria-modal/focus-restore (`60c51d2`, `da95911`). Only the aria-labelledby wiring is missing | Shrunk → T1a |
| "9 dialogs hand-roll modals" | Shared Modal is well-adopted via the barrel (8+ consumers). Exactly **5** dialogs still hand-roll with NO dialog semantics: ApprovalDialog, CreateCollabDialog, MessageDialog, QRScannerDialog, MergeProposalSubmitModal (+ CommunityView `.optionsOverlay`, a bottom-sheet) | Live → T1 |
| "5+ copies of formatTime" | `src/utils/formatTimeAgo.ts` exists; 2 identical local clock-format copies remain (ChatTopic, ThreadedDiscussion) | Shrunk → T5 |
| "2 copies of buildTree" | 1 copy (deliberation subsystem deleted S7) | Dead |
| "3 copies of initials" | 3 local defs: RoleDisplay, SmartImage, digitalAgentStore (+fixtures `initialsOf`) | Live → T5 |
| "Flags rendered 3 ways" | `<CountryFlag>` exists; raw `getCountryFlag` in ConvictionStaking + AdoptionFramework (WorldMapLite is lab) | Shrunk → T5b |
| Mega-components ProblemStage/DeliberationThread | Recomposed (S19) / deleted (S7) | Dead |
| Lane 5: en/fr/sw parity imbalance | Parity 1126=1126, scanner OK | Dead |
| Lane 4: VotingFlowShell + build D3 | D3 still fixture-stub only — **out: Eston chose Wave-1.5 over D3 at S22 open** (needs product decisions first) | Deferred |
| Worktree + PR-per-lane operating model | Retired; single sequential sessions on `ui` | N/A |

Named by the S22 prompt for this arc (verified live):
- **m6 progress-bar triplication** (S18 findings log): QVFlow `track`, AdoptionFramework
  `progressFill`, SharedStatement `barFill` → T2.
- **SegmentedControl radiogroup-semantics question** (S21 review note): currently buttons +
  `aria-pressed` → T3.

## Scope (all UI-only; no fixtures, no contract methods, no DEMO_VERSION bump)

### T1 — Dialog convergence onto shared `Modal`
Port the 5 hand-rolled dialogs onto `shared/Modal` (title → Modal `title`, actions → `footer`,
local overlay/panel scss deleted). Each inherits focus trap, Escape, focus-restore, `aria-modal`,
body-scroll lock, and the `$overlay-bg` backdrop for free. QRScannerDialog keeps its camera
viewport as plain body content. CommunityView `.optionsOverlay` is a bottom sheet — NOT ported;
its backdrop moves to a token (T4).
**T1a:** wire `aria-labelledby` in Modal (`useId` on the title h2; accept `aria-label` fallback
when `title` is absent) — closes the one true remnant of the lane's WCAG claim.

### T2 — `<ProgressBar>` kit extraction (m6)
New `src/components/shared/ProgressBar.tsx` + module.scss: value/max → width %, token colors
(default `$primary`, callers may pass a semantic variant), `role="progressbar"` +
`aria-valuenow/min/max` + required accessible label. Port the 3 implementations (QVFlow track,
AdoptionFramework progressFill, SharedStatement barFill) preserving each one's exact visual
(height/radius/color read from their current scss). Export via the shared barrel.
DESIGN_SYSTEM.md gains the primitive.

### T3 — SegmentedControl → radiogroup semantics
`role="radiogroup"` (labelled), segments `role="radio"` + `aria-checked`, roving tabindex
(one tab stop), Left/Right(+Up/Down) arrow selection per the WAI-ARIA APG radio-group pattern.
`aria-pressed` dropped. Visuals unchanged. 5 consumers (MenuSettings, CommunitySettings,
CollaborationFullView, ApprovalFlow, MandateDocument) get it centrally — verify each still
labels its group.

### T4 — Raw-rgba debt → zero
The 10 grep-audited lines:
- 2 dialog backdrops (MessageDialog, QRScannerDialog) — die with T1.
- 2 LoginPage box-shadows → `$shadow-lg` / nearest token (visual-match check in preview).
- CommunityView `.optionsOverlay` backdrop → `$overlay-bg` (alpha .3 → .55; verify the sheet
  still reads correctly in preview).
- 5 white-alpha dark tints (Button .06, Modal .08, Badge .08, SegmentedControl .06,
  IdentityTrust .1) → new token trio in the existing "Dark-mode tinted surfaces" section of
  `variables.scss` (e.g. `$dark-tint-subtle/-raised/-strong`), byte-identical rgba values.
After: `grep -rnE 'rgba\( *[0-9]' src --include='*.module.scss'` returns **0 lines** and the
grep-gates stay green — the design-system law becomes fully machine-checkable.

### T5 — Helper + flag convergence
- `formatDateTime(ts, locale)` (dateStyle medium/timeStyle short) → new `src/utils/` export;
  ChatTopic + ThreadedDiscussion drop their identical local copies.
- `initials()` → one `src/utils/initials.ts`; RoleDisplay/SmartImage/digitalAgentStore converge
  (behavior-preserving; digitalAgentStore re-exports if its consumers need the old path).
  Fixtures' `initialsOf` may import it too (utils→fixtures direction is fine).
- **T5b:** ConvictionStaking + AdoptionFramework render flags via `<CountryFlag>` instead of raw
  `getCountryFlag()` (WorldMapLite lab stays).

### T6 — Doc truth
DESIGN_SYSTEM.md: delete the stale `$secondary` row; add ProgressBar to the primitives; add the
"dialogs use shared Modal — no hand-rolled overlays" law + the new dark-tint tokens; note the
SegmentedControl radio semantics. MASTER_TODO §7: mark the wave-1.5 lane set superseded by this
spec (lanes 1–3 remainder done here; lane 4 = D3 stays the named Post-handoff item; lane 5 dead).

## Out of scope
D3 liquid delegation (product decisions needed — Eston's explicit choice at S22 open), i18n lane
(parity complete), any fixture/contract change, bottom-sheet→Modal redesign of `.optionsOverlay`
(product-visible pattern change; log if wanted later).

## Decisions taken in-session (technical, not product)
- Radiogroup over aria-pressed: exactly-one-of-N selection is the APG radio-group pattern;
  screen readers announce "x of y, selected" instead of N independent toggle buttons.
  Flagged for the whole-diff review + Eston's gate note since keyboard behavior changes
  (arrows move selection inside the group; the group is one tab stop).
- New strings: only Modal close labels / progress aria-labels if a dialog lacks one — full
  i18n ritual (en default + fr + sw + packet append) for any new key.

## Verification (per gloki-verification-and-qa)
Per task: `npx tsc -b` + `npm run build` clean; grep-gates clean. Whole-session: preview walk of
every touched surface (5 dialogs, QV vote panel, AdoptionFramework, SharedStatement, theme
toggle in menu, chat timestamps, ConvictionStaking) at 360px, light+dark, en/fr/sw spot;
keyboard: Tab-trap + Escape on each ported dialog, arrow keys on SegmentedControl; rgba grep = 0;
parity scanner OK. Then the standing Opus whole-diff review → Eston's push gate.
