# Session 31 — Suggestion flow + action-button captions (walkthrough-campaign Waves B+C)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This session
implements **Waves B and C** of the 2026-07-13 walkthrough campaign
([docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) — read §3
(Wave B) and §4 (Wave C) FIRST; they hold the verified findings, file:line evidence, and the
recommended decisions). Wave A shipped in S30 (`b87608e..6abc429`, push held with S30). This is new
work on top of it.

UI-composition only — **no contract methods, no fixtures, no DEMO_VERSION bump, no routes.**

## Tasks (build order)

### Wave B — Suggestion-flow recompose (A1/A2/A3) — decision D1
1. **Move the problem ContextCard down to sit directly above the composer** as a persistent
   "you're responding to" context bar (campaign §3.1). Implementation = U1 option (ii): render it
   as a sibling of `<main>` immediately above `.inputBar` in `SuggestionDmView.tsx`; it MUST
   `@include page-column` (the desktop-column fix the composer already carries). Style via a
   `className` wrapper — **never edit `ContextCard.module.scss`** (shared with DiscussionStageView).
2. **Header stays** eyebrow "Suggestion" + h1 author name (one-h1 law). Only if D1 picks the
   header-merge option does the author name move into the `subtitle` slot (never the h1), accepting
   the async pop-in from `get_details`.
3. **Top air:** `padding-top: $spacing-lg` on `.dmMain` (local fix — `$heading-gap` is app-wide,
   don't touch it). Re-center the empty state in the shorter thread area.
4. Sanity: the `bottomRef` autoscroll anchor (end of `.thread`) still lands correctly on send.

### Wave C — Action-button captions (D1 campaign finding) — decision D5
1. **SolutionsBoard action row** (`SolutionsBoard.tsx` — re-verify the line range; was `546-573`):
   stack each button vertically — icon+count row on top, a short caption beneath. New SHORT caption
   keys (inline en defaults + fr/sw parity + packet append), precedent `community.menuButton`/
   `menuCaption` **and** S30's `card.suggestToAuthorShort`:
   - `mechanisms.approval.upvoteCaption` — en "Back this"
   - `mechanisms.approval.requestReviewCaption` — en "Request expert"
   - `mechanisms.approval.suggestMergeCaption` — en "Suggest merge"
   (fr/sw must stay ≤ ~95px at `$text-xs` — measure in the live preview, S29/S30 width law.)
   Reconcile the visible captions with the existing sentence-length aria-labels (don't
   double-announce — keep the aria for SR clarity OR drop it, pick one and apply to all three).
   Keep `min-height:44px` floor, keep `actionBtnActive` legible, add the dark caption override.
2. **Bonus (D5):** ThreadedDiscussion's icon-only Heart like-button (`ThreadedDiscussion.tsx` —
   re-verify, was `180-188`) gets the same caption/label treatment, matching its labeled
   Reply/Delete neighbors.

## Open decisions to lock BEFORE building (batch to Eston, recommend-then-confirm)

- **D1** — Suggest flow: ContextCard **pinned above composer (persistent)** [recommended] vs
  first-message-in-thread (scrolls away) vs merged into the header subtitle.
- **D5** — extend the caption pattern to ThreadedDiscussion's heart: **Yes** [recommended] (same
  defect class, tiny cost).

If Eston already annotated the campaign doc §6, take those as locked.

## Re-verify these premises vs HEAD (the recurring lesson — 17 straight sessions caught rot, S30's was in DESIGN_SYSTEM.md itself)

- `SuggestionDmView.tsx` still owns the suggest layout; `ContextCard` still accepts `className`;
  its only other consumer is still DiscussionStageView (grep before styling).
- `SolutionsBoard.tsx` action row still icon+count only (ThumbsUp / Microscope / GitMerge) — **grep
  the current line range, S30 shifted nothing here but the doc's numbers are from `c91bd86`.**
- `ThreadedDiscussion.tsx` Heart is still icon-only next to labeled Reply/Delete.
- en.ts is still the partial-dictionary model (English in inline `t()` fallbacks; parity 1138 after
  S30). Copy changes touch tsx + fr + sw, never en.ts. Run the parity scanner
  (`.claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`).
- **S30 shipped:** the `chinExtras` slot, `ProblemChinExtras`, the two-tone stage-feed chin, and the
  `ProgressBar`-based threshold bar all now exist — don't rebuild them.

## Read first

- [docs/ui-walkthrough-campaign-2026-07-13.md](../ui-walkthrough-campaign-2026-07-13.md) §3–§4 + §6
- [docs/superpowers/specs/2026-07-13-card-anatomy-design.md](../superpowers/specs/2026-07-13-card-anatomy-design.md) (S30, for the shipped context)
- `src/components/.../SuggestionDmView.tsx` + `.module.scss` (Wave B owner)
- `src/components/initiative/stages/SolutionsBoard.tsx` (Wave C owner)
- Memory: `project_session30_jul2026` (Wave A), `project_walkthrough_campaign_jul2026` (the plan)

## Workflow + constraints (same discipline as S1–S30)

Brainstorm-lock D1/D5 → spec commit (`docs/superpowers/specs/2026-07-XX-suggest-flow-captions-design.md`)
→ build in small `feat(s31):` commits, `ui` runnable each → per-chunk `npx tsc -b` + `npm run build`
+ grep gates → controller-only preview at 360px light+dark en/fr/sw on the suggest page + all three
SolutionsBoard hosts (stage feed / community card / InitiativeStagePanel — narrowest wins) → i18n
parity + packet append for new keys → Opus whole-branch review → **hold the push for Eston's
explicit green light** (S30's push is likely still held; coordinate — Eston may want S30+S31 pushed
together). Slow-drive I/O: targeted reads, sequential subagents only, controller drives the one
preview. PR #20's ✗ vs main stays expected divergence.

When ready: verify the premises, then batch D1/D5 to Eston with your recommendations.
