# Session 19 — Campaign Wave 2: card recomposition + title blocks + sizing floors

**Written 2026-07-03 at the end of the S18 campaign/W1 session. HEAD at write time: local `ui`
@ `aa237c6` (one docs commit ahead of pushed `21ccd4d`; it rides with this wave's push). Goal
owner: Eston. This is wave 2 of 4 from the S18 UI review campaign — NOT related to the older
"Wave 1.5 refactor lanes" in `docs/session-prompts/wave-1.5/`.**

## Mission

Fix the "messy cards" — the campaign's two composition majors — and land the app-wide
standards Eston locked. Four workstreams, one session:

1. **M2 — expanded-card engage panel recomposition.** The vote card's expanded panel measured
   **~12 co-equal blocks ≈ 1,890px tall at 360px, boxed-nesting depth 4** (bars: ≤5 blocks,
   ≤2 depth). Recompose per the S15 method — fold, flatten, demote; **never revert shipped
   features**. Prime targets inside VoteEngage/QVFlow: the hearts explainer box + privacy line
   (fold behind one inline expand), the region key (fold), the 385px-per-solution ballot items
   (flatten internal boxes), turnout footer (keep — it's load-bearing). Check the problem/
   solutions/mandate cards' panels against the same bars after — the pattern likely repeats
   more mildly.
2. **M3 — InitiativeStageStrip recomposition.** Four ~52px saturated stage circles are the
   loudest element on screen, duplicating the StageFooter's 4-stage vocabulary at ~10× weight
   inches above it, with mixed affordances (only Mandate is a button; it renders underlined,
   the rest are static LIs). Target: a compact, low-weight strip (small dots/short pills, one
   affordance rule, stage colour as accent not dominance). Design detail → decision 1 below.
3. **D3 — page-title block + rule, app-wide.** One standard: AppHeader stays global-only;
   below it every page renders an eyebrow + h1 title block separated from the bar by a
   full-width rule. Today there are 4 patterns (title-in-AppHeader e.g. SuggestionDmView,
   in-content h1 e.g. HomeView/Identity/CreateCommunity, visually-hidden h1 on CommunityView,
   MandateCard document h1). Respect the S16/S17 single-h1 model and the documented sanctioned
   exceptions (onboarding step heroes, MandateCard doc title). CommunityView's hidden h1 +
   visible hero card is Eston-approved (S17) — decide with Eston whether it adopts the block
   or stays (decision 2).
4. **D4/D5 — sizing floors.** Kit Button `md` min-height 40 → 44px (check `lg`, and the
   documented "md/lg clear 44 with vertical padding in context" note in Button.module.scss —
   the note becomes obsolete). Icon floor: ≥16px inline, ≥20px in buttons/CTAs — sweep the
   11–15px instances (MandateCard "View full"/"View all" 11px arrows; DiscussionPill, source
   chips 13px; etc.). Also fix ProblemVoteFlow "Second it"/"Not for me" icons squeezing
   18→16.3px under text flex pressure (`svg { flex-shrink: 0 }` and let text wrap).

## ⚠️ Re-verify these premises vs HEAD before building (they WILL rot)

| Premise (true at S18-W1 close) | Check |
|---|---|
| W1 pushed; `21ccd4d` on origin; only `aa237c6` (changelog docs) local | `git status -sb`, `git log origin/ui..ui` |
| Deploy green (the W1 "Deployment failed, try again later" was a Pages transient, fixed by rerun) | `gh run list --branch ui --limit 1` |
| Engage-panel measurements: ~12 blocks / ~1,890px / depth 4 on the expanded vote card | re-measure in preview before designing (block-count eval in the campaign log) |
| Strip structure: 4 LIs, only Mandate contains a `<button>`; circles ~52px | read `src/components/initiative/InitiativeStageStrip.tsx` + inspect live |
| Kit Button md = 40px min-height | `grep -n "min-height" src/components/shared/Button.module.scss` |
| 4 title-zone patterns as listed above | walk the routes; S18 findings log §m5 |
| Parity fr=sw=1121; gates clean; build green | Phase-0 commands |
| QVFlow steppers now have `padding: 0` (W1) — don't re-break | `grep -n "padding: 0" src/components/collaboration/flows/voting/QVFlow.module.scss` |

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle`, then
   `gloki-verification-and-qa` (preview lore: colorScheme emulation RESETS on navigation and
   applies async — re-resize + settle-eval before any computed-style read; use alpha-BLENDING
   background walks for contrast).
2. `docs/superpowers/specs/2026-07-03-s18-ui-campaign-findings.md` — M2/M3/m5/m7 + locked
   decisions D3/D4/D5.
3. `docs/superpowers/specs/2026-07-01-solutionsboard-recomposition-design.md` — the S15
   recomposition method and vocabulary (co-equal blocks; inline expand with `aria-expanded` +
   chevron for content folds; **InfoDisclosure is a focus-trapped MODAL for explainer prose,
   NOT an accordion**).
4. DESIGN_SYSTEM.md — composition exemplars (InitiativeStageCard shell, MandateCard), token
   law, Mobile Patterns (the S17 touch-target exceptions live there and must survive).

## Workflow + constraints

- Docs-first: spec (`docs/superpowers/specs/2026-07-03-…` or dated fresh) + plan committed
  before feat commits. Small runnable commits, `npx tsc -b` per chunk.
- **Recomposition, never reverts** (S15 rule). The S11 vote explainer, S12 evidence, S13
  turnout content all stay — they fold, they don't die. i18n keys that become unused: remove
  from en+fr+sw together and note in the packet; changed strings → packet append.
- Wire names untouched (contract reads in QVFlow/VoteEngage stay exactly as-is; this wave is
  presentation only). No DEMO_VERSION bump (no fixture changes expected).
- D4's 44px Button ripple is app-wide — after the token change, walk HomeView, community
  feed, onboarding, MandatePage at 360px in both schemes for layout breaks (buttons wrapping,
  fixed bars growing).
- Measure before/after: re-run the block-count/height/nesting eval on the vote card and
  capture **before/after screenshots for Eston** — he reviews this wave visually at the gate.
- Sequential subagents only; implementers never touch the preview (controller drives the ONE
  browser). Slow-drive I/O discipline throughout.
- Deferred: W3 stage-feed inline expansion, W4 theme toggle + menu LanguageSwitcher — do NOT
  pull them into this wave.

## Open decisions to lock with Eston (batch, recommend-then-confirm)

1. **Strip target design:** recommend small colour-dotted pills (~24px row height, stage
   colour as a dot, current stage filled + labelled, all four tappable to their stage feeds —
   one affordance rule). Alternatives: numbered mini-steps; text-only breadcrumb. Show a
   mock/screenshot before wiring.
2. **CommunityView title block:** adopt the standard block (visible h1 returns) vs keep the
   S17 hidden-h1 + hero-card pattern as a sanctioned exception. Recommend: keep the exception
   (the hero card IS the title block visually; adding another title line re-duplicates N3).
3. **Explainer fold default:** hearts explainer collapsed-by-default for everyone vs expanded
   on first visit (welcomeHints pattern) then collapsed. Recommend first-visit-expanded — the
   explainer earns its place for newcomers (north star 1) without permanently costing 200px.
4. **Ballot-item flattening depth:** how much of the 385px per-solution block survives
   (reviewer chip, evidence link, regional support bars)? Recommend: keep reviewer chip +
   evidence inline, fold regional bars behind the existing per-solution expand.

## Definition of done

M2 panel ≤5 co-equal blocks and ≤2 boxed depth (re-measured); M3 strip no longer out-shouts
the content (screenshot judgment at the gate); D3 rule + title block on every standard page
with h1 model intact (1 per route, landmarks clean); D4/D5 floors in and swept; build/parity/
gates green; whole-diff review 0 Crit / 0 Imp; before/after screenshots presented; **Eston's
explicit push green light** (push = deploy; `aa237c6` rides along). Closeout: §7/§8, packet,
memory, and the W3 prompt (with its own re-verify table).
