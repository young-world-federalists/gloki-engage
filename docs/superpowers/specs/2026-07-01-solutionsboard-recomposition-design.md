# SolutionsBoard Recomposition — Design Spec (2026-07-01, Session 15 Phase 0)

Status: **approved** (Eston, 2026-07-01). Phase 0 card-cohesion fix. Companion to the
approved [card redesign spec](./2026-06-22-card-redesign-design.md) and the S4 commitments-spine
spec (`2026-06-27-session-4-solutions-card-commitments-spine-design.md`).

## 1. Why

The card-cohesion audit found accretion-dilution **concentrated in `SolutionsBoard`**. Nothing was
deleted — but P0–P5 layered shipped features (commitments spine S4, author/expert indicators S13,
sources + expert review S12) onto each solution as **co-equal flat blocks**, and each solution
renders as a bordered box containing a filled green `EXPERT REVIEW` sub-panel. Result: **up to 9
stacked blocks per solution, ~1 screen tall, card-in-a-card-in-a-card**, contradicting the approved
card spec's "Flush (no card-in-a-card)" and "scan fast, dive on tap" north star.

This is a **composition-only** fix. **No feature is reverted, no contract method renamed, no
data-shape change.** All reads/writes stay through the existing `approvalApi` calls.

## 2. What changes

### 2.1 Pre-list chrome (top of the engage panel)
1. **Help disclosure** — unchanged (collapsed `InfoDisclosure`).
2. **One combined "Progress to vote" line** replaces the two stacked threshold progress bars: a
   single compact row with two inline stats — `{n}/{T1} solutions backed · {m}/{T2} experts
   reviewed` — each with a slim inline track. Same numbers/thresholds (`T1_TARGET=5`, `T2_TARGET=3`,
   `half = ceil(memberCount*0.5)`); condensed from two ~60px blocks to one ~40px row.
3. **"Add a solution" button** — unchanged.

### 2.2 Each solution — flush list item (the core fix)
A solution is a **flush list item** (no border/box), separated from the next by a hairline
`$gray-100` / `$dark-border` divider + vertical spacing. Top-to-bottom hierarchy:

- **Solution text** — primary (medium weight, largest in the item).
- **Commitments** — bulleted, muted/secondary, directly under the text. **Always visible** (S4 spine).
- **Byline row** — `UserIdentity` (author) + a small **"expert reviewed"** tag when reviews exist
  (stays visible as the fold *teaser* — trust signal preserved).
- **"Evidence & expert review" disclosure** (`InfoDisclosure`) — rendered **only when** there is
  something to fold: author-proposed indicators OR sources OR expert reviews. Adaptive label with a
  count when reviews exist (e.g. *"Evidence & expert review (2)"*, else *"Evidence"*). When open, its
  contents render **flush — no filled green box**:
  - Author-proposed indicators (labeled, per S13).
  - Sources (`SourceLinks`).
  - Each expert review as a flush attributed block — `UserIdentity` (verified) + credentials,
    assessment, "How we'll know it's working" metrics, evidence sources — separated by hairline
    dividers, not a filled panel.
  - The review-status line ("Review requested by N — awaiting an expert") as a muted caption here.
- **Action row** — upvote / request-review / merge (3 icon buttons) — **unchanged**.
- **"Add expert review"** button (experts only) — unchanged.

Net: always-visible layer drops ~9 blocks → ~4; the green card-in-a-card is gone.

### 2.3 Unchanged (scope guard / YAGNI)
Merge mode (transient banner + tap-to-merge highlighting), the add-solution modal, the expert-review
modal, all `approvalApi` calls, and the optimistic-upvote reconcile logic stay exactly as-is.

## 3. Constraints
- Tokens only; reuse kit primitives (`InfoDisclosure`, `UserIdentity`, `SourceLinks`, `Badge`).
- 360px flagship; verify **light + dark**; AA; reduced-motion token-pure.
- Single `<h1>` per route + landmark/skip-link survive (this component adds neither).
- New/changed i18n strings at **fr + sw key parity** (flat dotted keys; en inline via `t('key','English')`):
  the "Evidence & expert review" disclosure label(s) + the combined "Progress to vote" line. Reframed
  strings → append to `docs/i18n-native-review-candidates.md` if any existing copy is reworded.
- Keep contract method names; stay behind `src/services/api.ts` / `approvalApi`.
- **`DEMO_VERSION` NOT bumped** — no fixture change.

## 4. Verification
- `npm run build` (`tsc -b`) clean.
- Preview (`gloki-dev`, 360px) at the Solutions stage of a seeded initiative, light + dark:
  a solution reads text → commitments → byline → collapsed disclosure; no green box; one progress
  line; flush dividers between solutions.

## 5. Files touched
- `src/components/initiative/stages/SolutionsBoard.tsx` (layout/JSX composition).
- `src/components/initiative/stages/SolutionsBoard.module.scss` (flush list, divider, combined
  progress line, remove green panel fill).
- `src/i18n/*` (new keys, fr + sw parity).
