# Wave 5 — Kit-first normalization + spacing / touch floors (design)

**Session:** S28 · **Branch:** `ui` · **Date:** 2026-07-11 · **HEAD at spec time:** `8005caf`
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 Wave 5 (produced 2026-07-08); §5 rules
5/7/8/9/12/14/16/17; §6 taste calls 5/6/7.
**Class:** UI-only + 1 fixture-free i18n key. **No `DEMO_VERSION` bump** (no fixture/seed change).

## Goal (one sentence)

Replace hand-rolled controls with the shared kit and enforce the spacing/touch-target floors
app-wide in one mechanical sweep — so the app reads as one system and nothing silently
re-invents a wrong value — **while honouring the DESIGN_SYSTEM's documented bespoke carve-outs**.

## Locked decisions (Eston, 2026-07-11, recommend-then-confirm)

- **D1 — Solution-card fold (§6 #5): FOLD COMMITMENTS + EVIDENCE.** One `Details` inline-expand
  holds commitments + indicators + expert reviews. The card shows **4 co-equal blocks**: solution
  text · author byline · `Details` (inline-expand) · vote actions. Proposal text, author, and the
  vote affordance stay always-open. (Trade-off accepted: commitments hidden by default.)
- **D2 — Header title-block top air (§6 #6): `$spacing-lg` (16px), app-wide.** This is **already the
  value** at `AppHeader.module.scss .titleBlock` (`padding-block: $spacing-lg $heading-gap`) and
  DESIGN_SYSTEM §184. Task reduces to: confirm, and normalize any header/title block that deviates.
- **D3 — Kit-swap regression line (§6 #7 + DS §237-258): KEEP BESPOKE, FIX FLOORS ONLY.** The
  controls DESIGN_SYSTEM explicitly carves out stay bespoke; we fix only their contrast, 44px
  floor, and 8px gap. No forced `<Button>` swap where it would regress a documented decision.

## Re-grounding — corrected premises (the S10-S27 discipline; 14th consecutive catch)

Inventory: a 12-agent read-only sweep (2026-07-11) of all 16 target files + the kit primitives.
The campaign's Wave-5 list is **partly stale**; corrections:

| Campaign premise | Reality at HEAD | W5 action |
|---|---|---|
| Swap `createBtn` → `<Button>` | DS §242 keeps it **section-themed bespoke**; code is `$primary` on `rgba($primary,.1)` (fails AA, §6.5), `padding:$spacing-md`, **no min-height** | **Keep bespoke**: `color → $primary-dark` (§5 r15), add `min-height:44px`. Flag the doc/code teal-vs-blue drift. |
| Swap chat/DM `sendBtn` → `<Button>` | DS §244 keeps **icon-only squares** bespoke; ChatTopic send = 40×40 with documented `padding:0` reset (S18 W1) | **Keep bespoke square**, bump 40→44px. SuggestionDmView send is already 44×44 (no change). |
| Touch item "collab × (16px, un-nest it)" | **No such element** — collab rows = title span + decorative chevron; create dialog is a shared `Modal` (owns its ×). No nested interactive anywhere in the collab area. | **Drop — phantom premise.** |
| CollabList has an 800px literal (§6.5) | Not here — `.container` is intentionally empty (S24 page-column). 800px belongs to a **W6** ancestor. | Out of W5 scope. |
| §6 #7 "open the full item" is an open call | **Resolved in S27** (DS §342: per-context — solid CTA on dashboards, quiet link in feed). | `openBtn`→solid `Button`; `openLink` **stays** a quiet link (gap 4→8 only). |
| Button `md` = 40px (DS §235) | Actual `md` = **44px** (`Button.module.scss:42`) | Fix the stale DS line. |
| D2 header top-air needs picking | Already `$spacing-lg` (16px) in code + DS §184 | Confirm; normalize deviants only. |
| SolutionsBoard two progress bars may have split (S15 regression) | **Intact** — both inside the single `.progress` flex container (tsx 322-337). | No regression; migrate both to `ProgressBar` (S22 law). |

## Kit primitive reference (verified 2026-07-11)

- **`Button`** (`shared/Button.tsx`): variants primary/secondary/destructive/ghost; sizes `sm`=32px,
  `md`=**44px**, `lg`=48px; built-in `gap:$spacing-sm` (8px) icon→label; `leftIcon`/`rightIcon`
  (never icons as children — that collapses the gap), `loading`, `fullWidth`. `md` meets the floor.
- **`SegmentedControl<T>`** (`shared/SegmentedControl.tsx`): `options:[{value,label,icon?,ariaLabel?}]`,
  `value`, `onChange`, `ariaLabel`, `fullWidth`, `size` (`md`=44px default, `sm`=36px). WAI-ARIA
  radiogroup (one tab stop, arrows move, `aria-checked`). Selected segment reads like a primary button.
- **`EmptyState`** (`shared/EmptyState.tsx`): `{icon?, title (REQUIRED), message?, action?, compact?}`.
  **`title` is required → pure loading/spinner states do NOT map** (keep those bespoke or give a
  neutral title). `compact` = tighter padding for in-card use.
- **`Card`** (`shared/Card.tsx`): `{interactive?, padded? (default true), as?: 'div'|'section'|'article'|'li'}`
  + spread HTML attrs. **Renders as div/section/article/li — NOT `<button>`.** A clickable row keeps
  its `role="button"`/`tabIndex`/`onClick`/`onKeyDown` on the Card (via spread) or wraps a button.
- **`ProgressBar`** (`shared/ProgressBar.tsx`): `value`/`max` (drive aria), `label` (**required**,
  translated), `fillPct?`, `size` (`sm`=6px default, `md`=8px), `variant` (primary/success/neutral).

## Change clusters (build tasks)

Each cluster = one (or a few) small commits, `ui` runnable after each, `tsc -b` + preview-verify.
Order chosen to land low-risk mechanical wins first and the ballot-card refactor last.

### T1 — SegmentedControl swaps  `feat`
- **StartDraftForm.tsx:58-73** — replace `.modeToggle` radiogroup with
  `<SegmentedControl<DraftMode> options=[{problem},{solution}] value={mode} onChange fullWidth ariaLabel>`.
  **Carry the side-effect**: `onChange={(m)=>{ setMode(m); if(m==='problem') setTag(undefined); }}`.
  Delete `.modeToggle/.modeBtn/.modeBtnActive` (chore, same commit or paired).
  i18n reused: `writeTogether.modeLabel/modeProblem/modeSolution`.
- **ThreadedDiscussion.tsx:405-422** — replace `.sortToggle` group with
  `<SegmentedControl<SortMode> ... value={sort} onChange={setSort}>`, **no `fullWidth`** (compact in
  the toolbar), default `size` (md=44 — do NOT use `sm`=36, breaks the floor). Delete
  `.sortToggle/.sortBtn/.sortActive`. i18n reused: `deliberation.thread.sortLabel/sortTop/sortNewest`.

### T2 — openBtn → Button; openLink gap (§6 #7 per-context)  `feat`
- **InitiativeStageCard.tsx:189** — `openBtn` → `<Button variant="primary" size="md" onClick={onOpen}>{openLabel}</Button>`
  (+ `rightIcon` if it currently shows a chevron). **Preserve the chin two-control flex layout** —
  the pill + stretching CTA that wraps at 360px; Button `fullWidth` gives `width:100%` NOT `flex:1`,
  so keep the wrapper's flex and pass a `className` if needed. Delete `.openBtn` if fully replaced.
- **FeedEngagePanel.tsx:209** — `openLink` **STAYS bespoke** (quiet link, AA-tuned
  `$primary-dark`/`$primary-on-dark`, underline-on-hover). Only bump its icon→label gap `4px→$spacing-sm`.

### T3 — ProgressBar swaps (S22 law)  `feat`
- **IdentityTrust.tsx:59** — bespoke `.verifyBar` → `<ProgressBar value={min(vouches,THRESHOLD)}
  max={THRESHOLD} size="md" variant={verified?'success':'primary'} label={t('trust.your.barLabel','Verification progress')}/>`.
  **One new i18n key** `trust.your.barLabel` (en/fr/sw). Delete `.verifyBar` (removes the 8px literal).
  Keep `variant='success'` as a redundant cue beside the always-visible TrustBadge/status text (§5 r16).
- **SolutionsBoard.tsx:322-337** — the two bespoke `.track/.fill` bars → `<ProgressBar>` ×2, **size="sm"**
  (6px — preserves the S15 "half the height" side-by-side; verify vs kit), success variant on the
  experts bar. Keep the `.progress` flex wrapper (each stat flex:1). `label` per bar (reuse the visible
  count labels or add keys). Delete `.track/.fill`.

### T4 — EmptyState swaps  `feat`
Map error/empty/not-found onto `EmptyState`; **keep loading bespoke** (no `title` fit).
- **ChatTopic.tsx** `.notFound` (error/not-found) + `.emptyStream` (empty) → `EmptyState`
  (compact for the in-stream empty). Preserve the on-chain caveat copy. Loading stays bespoke.
- **ChatTopicList.tsx** `.empty` (error/no-topics) → `EmptyState`; retry action uses `<Button>`.
- **Members.tsx:236** `empty-state` → `<EmptyState title icon={<Users size={48}/>}/>` (reuse `members.empty`).
- **Currency.tsx** three states → `EmptyState` (`compact` for the two in-card lists; the no-funds
  `<li>` case renders as a sibling below the `<ul>`, not inside it — structural care).
- **CollabList.tsx:100** empty/not-member → `EmptyState`; retire `.empty` + hand-rolled spinner if clean.
- **SolutionsBoard.tsx:478** `.noData` → `EmptyState` minimal (verify no CTA duplication with the
  existing "Add a solution"). Low priority; drop if it fights the layout.

### T5 — Card swaps  `feat`
- **ChatTopicList topicCard** → `<Card interactive>` **but keep it keyboard-operable** (role/tabIndex/
  onKeyDown on the Card, or wrap a button). Strip bg/border/radius/shadow from `.topicCard`.
- **Members rows (memberCard)** → `<Card as="article" padded={false}>` (rows are non-clickable — do
  NOT pass `interactive`). Strip surface declarations; reconcile the border token delta.

### T6 — MandateDocument copyBtn → Button  `feat`
- **MandateDocument.tsx:238 / .scss:351-356** — `.copyBtn` → `<Button variant="ghost" size="md"
  leftIcon={copied?<Check/>:<Copy/>}>{copied?copied:copy}</Button>`. Resolves swap + 36→44px + 4→8 gap
  in one. **Preserve the icon+label swap** (Copy→Check, "Copy JSON"→"Copied") so §5 r16 stays satisfied
  and the live-region announcement remains. Delete `.copyBtn`.

### T7 — ProblemEngage rule-8 fix  `feat`
- **ProblemEngage.tsx:90** — the ONE genuine rule-8 offender: move `<Send size={16}/>` from a child to
  `leftIcon={<Send size={16}/>}`. Acceptance: icon-as-child gate = 0.

### T8 — Keep-bespoke floor/contrast fixes (D3)  `feat`
- **CollabList `.createBtn`**: `color:$primary → $primary-dark`; add `min-height:44px`. Keep bespoke tint.
- **ChatTopic `.sendBtn`**: `width/height: 40px → 44px`. Keep `padding:0` reset.
- **ChatTopic `.textarea`** (composer): add `min-height:44px` (keep max 120px, resize:none).
- **ChatTopicList** composer input: add `min-height:44px`.
- **Currency** send-payment select + input: add `min-height:44px` (shared class or per-input; do NOT
  raise the global `.input-field` — touches every form app-wide).

### T9 — icon→label 8px gap sweep (interactive controls only)  `feat`
`$spacing-xs (4/6px) → $spacing-sm (8px)` on **interactive control** icon→label gaps:
- ThreadedDiscussion `.actionBtn` / `.collapseBtn` / `.continueBtn` / `.backBtn` (all hit-areas already ≥44).
- SolutionsBoard `.actionBtn` / `.actionRow` (6→8).
- Currency `.fundName` / `.colAccount` (4→8); `.titleRow` (4→8).
- MandateDocument `.copyBtn` gap (moot once T6 lands).
- QVFlow `.guideToggle` (4→8).
**Leave**: tight flag+name pairings (`.authorName`, ChatTopic/List name badges — documented tight
pairing), non-interactive metadata labels (`.specName`, masthead meta — normalization call, defer),
and badge/eyebrow micro-contexts (`InitiativeStageCard .badgeInner/.metaItem` 12-16px icons — bumping
to 8px risks 360px crowding; tokenize the raw `4px`→`$spacing-xs` but keep the value).

### T10 — SolutionsBoard composition fold (D1)  `feat`
- Fold `.commitments` (tsx 505-509) INTO the `SolutionEvidence` disclosure as its first section;
  relabel the toggle `Evidence & indicators`/`Evidence & expert review (n)` → **`Details`** (or
  `Details (n)` when reviewed). Result: text · byline · `Details` · actionRow = **4 blocks**.
  New/changed i18n: a `Details` toggle label (reuse or add `mechanisms.approval.detailsToggle`).
  `hasEvidence` guard widens to `hasEvidence || commitments.length>0` (always render Details if any
  commitments). Keep the `reviewStatus` line and expert-add button as today (conditional, minor).

### T11 — Header top-air normalization (D2)  `chore/feat`
- Confirm `AppHeader .titleBlock` top-air = `$spacing-lg` (already true). Grep for any other page-title
  / section-header top-air that deviates from `$spacing-lg` and normalize. Likely near-zero code.

### T12 — Dead CSS deletion  `chore`
- **Members.module.scss** `.memberName` + `.section` (light + mobile + dark) — verified unreferenced in
  `Members.tsx`. Own `chore` commit with the consumer-graph note.

### T13 — BallotSolutionCard extraction (HIGHEST RISK — last, isolatable)  `feat`
- Extract one `<BallotSolutionCard>` serving QVFlow's **unvoted** (L279-322) + **voted** (L350-386)
  states + **VotePreview** (L72-77). Card owns invariant chrome: index/total label, reviewed badge,
  solution text, author byline, commitments/metrics fold. QV mechanics pass as **optional slots**
  (`voteControl`=hearts steppers, `results`=yourVote+regbar). All QV state stays in QVFlow.
  - `showAuthor` prop (voted state omits the byline today — design ruling: show it everywhere, or keep
    the divergence via the prop).
  - Reconcile the dark bg token (`$dark-bg` QVFlow vs `$dark-surface` VotePreview) to ONE value; `white`
    → surface token.
  - VotePreview passes commitments/metrics (net UX gain, keys already exist) and NO voteControl (stays
    read-only, per its doc comment).
  - **The stepper stays bespoke** (fixed 44×44, documented S18-W1 `padding:0` reset — do not Button-swap).
  - If review flags the divergences as too costly, this task **slips to a follow-up**; T1-T12 ship without it.

## i18n impact

Most swaps reuse existing keys. New/changed strings (en/fr/sw parity + native packet):
- `trust.your.barLabel` — "Verification progress" (T3, new).
- SolutionsBoard `Details` toggle label (T10) — reuse `mechanisms.approval.evidence*` or add
  `mechanisms.approval.detailsToggle`.
- SolutionsBoard ProgressBar `label`s (T3) — reuse the visible count strings or add keys.
Run the parity scanner (gloki-i18n-playbook) BEFORE and AFTER; append a "Session 28" packet section.

## DESIGN_SYSTEM.md updates (docs commit, same session)

- §235 Buttons: `md` height **40px → 44px** (stale).
- §5 rule 9 kit-first table: note the **documented bespoke exceptions** (createBtn section-theme,
  chat/DM icon-square send, openLink quiet link, QV stepper) so a future sweep doesn't re-flag them.
- Progress Bars: add SolutionsBoard + IdentityTrust to the converged list.
- Composition: SolutionsBoard now 4 blocks (D1) — update the §4/§17 example if it cites the old count.

## Out of scope / dropped

- **W6** (community chrome & collab polish): createBtn max-width/800px, blue left-border (§6.3),
  "Menu"→"Community options", drawer reachability. Not this wave.
- **Phantom "collab ×"** — dropped (no such element).
- Global `.input-field` min-height promotion — deferred (app-wide form blast radius).
- New shared primitives — none required (adoption only). A Button `link` variant for openLink was
  considered and rejected (openLink stays a documented bespoke exception).

## Acceptance (the W5 evidence = grep gates + preview)

- `npx tsc -b` clean; `npm run build` clean.
- Preview walk at 360px, **light + dark** (reload after colorScheme flip), of: WriteTogether start,
  a threaded discussion, a solutions board, the vote flow + preview, IdentityTrust, chat, members,
  currency, a mandate document.
- **Grep gates (the acceptance evidence):**
  - icon-as-child of `<Button>` = **0** (after T7).
  - the swapped bespoke classes (`.modeToggle`, `.sortToggle`, `.verifyBar`, `.copyBtn`, …) = **0**
    references (deleted with their consumers).
  - off-scale spacing literals in the swept `.module.scss` = 0 net new; sanctioned micro-values
    (1/1.5/2/3px borders, 6px thin bar, 44/40/36px floors) documented where kept.
  - sub-44px interactive controls in the swept files = 0 (excluding DS-sanctioned `Button size="sm"`
    and inline/meta links per Mobile Patterns §414-420).
- i18n parity scan clean if any label changed; one `<h1>` + one `AppHeader` per route unchanged.
- Adversarial whole-branch review (Workflow fleet on Opus) → 0 Critical / 0 Important, or fixed.
