# S31 — Suggest-flow recompose + action-button captions (walkthrough campaign Waves B+C)

**Date:** 2026-07-14 · **Branch:** `ui` · **Base HEAD:** `c75f390` (S30 closeout)
**Campaign:** [docs/ui-walkthrough-campaign-2026-07-13.md](../../ui-walkthrough-campaign-2026-07-13.md) §3 (Wave B) + §4 (Wave C)
**Class:** UI-only — no contract methods, no fixtures, **no `DEMO_VERSION` bump**, no route changes.

---

## 1. Goal

Two independent card-anatomy fixes from Eston's 2026-07-13 walkthrough, both verified against HEAD
this session (line numbers shifted +1 from S30 but all structures intact):

- **Wave B (A1/A2/A3):** on the Suggest-to-author page the problem `ContextCard` is jammed directly
  under the author-name header ("no space between the problem and the name of the author"). Move it
  to sit as a persistent "you're responding to" bar directly above the composer — the chat
  reply-context mental model — and give the thread proper top air.
- **Wave C (D1 finding):** the SolutionsBoard action buttons are icon-only (or icon+count) with no
  visible words; ThreadedDiscussion's Heart is icon-only next to a *labeled* Reply and Delete. Add
  short visible captions so every action button reads without decoding an icon (north-star #1:
  ≥70% complete the journey unaided, on a cheap phone, English as a third language).

## 2. Decisions locked (Eston, 2026-07-14, recommend-then-confirm)

- **D1 = Pinned above composer.** `ContextCard` becomes a persistent context bar immediately above
  `.inputBar` (sibling of `<main>`), not a first-message-in-thread (would scroll away) and not
  merged into the header subtitle. Header keeps eyebrow "Suggestion" + author-name h1 (one-h1 law).
- **D5 = Yes, fix the heart too.** ThreadedDiscussion's Heart gets a visible "Like" label inline,
  matching its Reply/Delete neighbors. Same defect class, tiny cost.

## 3. Verified premises (HEAD `c75f390`)

| Premise | Status |
|---|---|
| `SuggestionDmView.tsx` owns the suggest layout; `ContextCard` is the **first child of `<main>`** (`:125-129`) | ✅ |
| `ContextCard` accepts `className`; only other consumer is `DiscussionStageView` → `ContextCard.module.scss` is **off-limits** | ✅ |
| `.inputBar` already `@include page-column` (`:37`); `.dmMain` has `padding-bottom:0`, **no top padding** | ✅ |
| `page-column` mixin exists (`variables.scss:191`, horizontal-only) | ✅ |
| SolutionsBoard action row at **`:547-573`** — ThumbsUp+count / Microscope+count / GitMerge icon-only; 3 aria-labels are its **only** consumers of `mechanisms.approval.{upvote,requestReview,suggestMerge}` | ✅ |
| ThreadedDiscussion Heart at **`:180-188`** — icon+count, `aria-pressed`, `aria-label` from `deliberation.thread.likeCount`; next to labeled Reply (`:190`)/Delete (`:197`) | ✅ |
| `deliberation.thread.like` (fr "J'aime" / sw "Penda") **already exists and is unused** → revive it | ✅ |
| en.ts partial-dictionary (76 keys); fr=sw=1138, parity OK; S30 chin work all present (don't rebuild) | ✅ |

---

## 4. Wave B — Suggest-flow recompose (`SuggestionDmView.tsx` + `.module.scss`)

### B-1. Move the ContextCard above the composer
Remove `ContextCard` from inside `<main>` (delete `:125-129`). Render it wrapped, as a sibling of
`<main>` immediately above `.inputBar`:

```tsx
</main>
{(problem.title || problem.description) && (
  <div className={styles.contextBar}>
    <ContextCard
      title={problem.title}
      body={problem.description}
      ariaLabel={t('context.suggest.aria', 'The problem you are suggesting on')}
    />
  </div>
)}
<div className={styles.inputBar}>
```

The wrapper (not the card) carries the column so the card's **border stays inset** from the screen
edge (applying `page-column` directly to `ContextCard` would push its bordered box edge-to-edge on
mobile — the `$content-gutter` law forbids that):

```scss
.contextBar {
  @include page-column;          // same centred column the composer carries
  padding-block: $spacing-md;    // breathing room above/below the card; page-column sets inline only
}
```

Guard the wrapper on content (mirrors `ContextCard`'s own null-return) so an unloaded `get_details`
doesn't leave an empty 24px strip above the composer. The card still pops in asynchronously — the
page is fully usable before it loads (unchanged from today, just relocated).

### B-2. Header unchanged
`AppHeader` keeps `title={authorDisplay}` (the page's single h1) + `eyebrow="Suggestion"`. No change.

### B-3. Top air + empty state
`.dmMain` gains `padding-top: $spacing-lg` (local fix — **never** touch app-wide `$heading-gap`).
With the ContextCard gone from the top, the compact `EmptyState`/thread now sits under clean top
air instead of jammed against the header. The `EmptyState` centres its own content horizontally;
verify it reads intentional in preview. **No** extra vertical-centering flex unless it looks jammed
(adds main→thread flex plumbing for marginal gain — deferred).

### B-4. Autoscroll sanity
`bottomRef` stays the last child of `.thread`; `scrollIntoView` on send is unaffected by the
relocation (the ref's position within the thread is unchanged). Verify in preview that a sent
message still lands visible above the context bar + composer.

---

## 5. Wave C — Action-button captions

### C-1. SolutionsBoard action row (`SolutionsBoard.tsx:547-573` + `.module.scss`)
Stack each button vertically: an icon+count row on top, a short caption beneath. The merge button
wraps its lone icon in the same top-row element so all three captions align on one baseline.

```tsx
<div className={styles.actionRow}>
  <button className={`${styles.actionBtn} ${myApprovals[p.id] ? styles.actionBtnActive : ''}`}
    onClick={() => handleToggleApproval(p.id)} disabled={togglingId === p.id}
    aria-pressed={!!myApprovals[p.id]}>
    <span className={styles.actionTop}><ThumbsUp size={16} aria-hidden /><span>{approvalCounts[p.id] || 0}</span></span>
    <span className={styles.actionCaption}>{t('mechanisms.approval.upvoteCaption', 'Back this')}</span>
  </button>
  <button className={`${styles.actionBtn} ${publicKey && p.expertReviewRequests?.includes(publicKey) ? styles.actionBtnActive : ''}`}
    onClick={() => handleRequestReview(p.id)} disabled={requestingId === p.id}
    aria-pressed={!!(publicKey && p.expertReviewRequests?.includes(publicKey))}>
    <span className={styles.actionTop}><Microscope size={16} aria-hidden /><span>{p.expertReviewRequests?.length ?? 0}</span></span>
    <span className={styles.actionCaption}>{t('mechanisms.approval.requestReviewCaption', 'Request expert')}</span>
  </button>
  <button className={styles.actionBtn} onClick={() => setMergeSource(p.id)}>
    <span className={styles.actionTop}><GitMerge size={16} aria-hidden /></span>
    <span className={styles.actionCaption}>{t('mechanisms.approval.suggestMergeCaption', 'Suggest merge')}</span>
  </button>
</div>
```

### C-2. Aria reconciliation (Approach: drop the aria-label, caption IS the name)
The visible caption + count becomes the accessible name — one source of truth, and voice-control
users can say what they see (WCAG 2.5.3 Label-in-Name, satisfied by construction: "Back this" ⊆
"3 Back this"). This is strictly better than today, where the caption "Back this" would mismatch the
old aria "Upvote" and break voice control. Chosen over keeping a hidden descriptive aria (the
CommunityCard house pattern) because 2 of 3 old aria strings ("Upvote", "Suggest a merge") do **not**
contain the new captions, so keeping them would fail 2.5.3 without further edits anyway.

- Remove the three `aria-label` props.
- Add `aria-pressed` to the two **toggle** buttons (upvote, request-review) — they were missing it;
  this matches the Heart and finally announces toggle state. The merge button stays a plain action
  (opens merge mode), no `aria-pressed`.
- The now-orphaned `mechanisms.approval.{upvote,requestReview,suggestMerge}` fr/sw keys are
  **retired** (verified sole consumer; the inline en fallback covers any stray reference).

### C-3. SolutionsBoard SCSS
`.actionBtn` flips to a column; keep `min-height:44px` as a **floor** (buttons grow for the caption):

```scss
.actionBtn {
  flex: 1; min-height: 44px;
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  gap: $spacing-xs; padding-block: $spacing-xs;
  border: 1.5px solid $gray-200; border-radius: $radius-sm;
  background: none; color: $gray-600; cursor: pointer;
  transition: all $transition-base;
  &:hover:not(:disabled) { border-color: $primary; color: $primary; background: rgba($primary, 0.05); }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.actionTop { display: inline-flex; align-items: center; gap: $spacing-xs; font-size: $text-sm; }
.actionCaption { font-size: $text-xs; font-weight: $font-medium; line-height: 1.15; }
```

- Caption `color` inherits from `.actionBtn` (`$gray-600` light → already-AA text color), and the
  existing `@include dark { .actionBtn { color: $dark-text-secondary } }` themes it for dark. Add a
  dedicated dark caption override **only if** preview shows the inherited color failing AA at
  `$text-xs` (avoid a redundant token per DESIGN_SYSTEM). `actionBtnActive` turns the whole button
  `$primary` — that's the locked brand-blue deviation, consistent app-wide.

### C-4. ThreadedDiscussion Heart (`ThreadedDiscussion.tsx:180-188`) — D5
Match the inline label style of its Reply/Delete neighbors (NOT the vertical stack — those siblings
are inline `<icon> text`). Drop the `aria-label`; keep `aria-pressed`:

```tsx
<button type="button" className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
  onClick={() => onLike(node.id)} aria-pressed={liked}>
  <Heart size={16} fill={liked ? 'currentColor' : 'none'} aria-hidden /> {t('deliberation.thread.like', 'Like')}{likeCount > 0 && <span> ({likeCount})</span>}
</button>
```

Accessible name = "Like" / "Like (3)"; `aria-pressed` conveys liked state (2.5.3 ✓). No SCSS change
(the inline `.actionBtn` grows past its 44px min-width naturally). Revive the existing
`deliberation.thread.like`; **retire** `deliberation.thread.likeCount` (sole consumer replaced).

---

## 6. i18n plan (see gloki-i18n-playbook)

Copy lives in inline `t(key, en-default)` fallbacks; keys physically exist only in fr/sw. Net key
delta: **+3 caption, −4 retired, revive 1** → fr/sw each 1138 → **1137** (balanced, parity holds).

| Action | Key | en (inline) | fr (candidate) | sw (candidate) |
|---|---|---|---|---|
| **add** | `mechanisms.approval.upvoteCaption` | Back this | Soutenir | Unga mkono |
| **add** | `mechanisms.approval.requestReviewCaption` | Request expert | Voir un expert | Omba mtaalam |
| **add** | `mechanisms.approval.suggestMergeCaption` | Suggest merge | Fusionner | Unganisha |
| **revive** | `deliberation.thread.like` | Like | J'aime *(exists)* | Penda *(exists)* |
| **retire** | `mechanisms.approval.upvote` | — | — | — |
| **retire** | `mechanisms.approval.requestReview` | — | — | — |
| **retire** | `mechanisms.approval.suggestMerge` | — | — | — |
| **retire** | `deliberation.thread.likeCount` | — | — | — |

**fr/sw candidates are provisional — MEASURE each caption at `$text-xs` in the narrowest host at
360px (S29/S30 width law) and shorten if it exceeds ~95px or wraps ugly.** Run the parity scanner;
append an S31 section to `docs/i18n-native-review-candidates.md` listing the 3 new caption keys +
the revived `like` (flag them as awaiting a native pass).

## 7. Verification plan (controller-drives-the-one-preview)

Per chunk: `npx tsc -b` + `npm run build` clean; `$gray-400`-text grep gate clean; parity scanner OK.
Preview at **360px, light + dark, en/fr/sw**:
- **Wave B:** the Suggest page — context bar sits directly above the composer, inset from the edges,
  with top air under the header; empty state reads intentional; send still autoscrolls to the latest
  message. (Reachability caveat from S30: the suggest page hangs off the Problem stage, which is
  StageGate-gated for the demo visitor — seed an author/member persona per gloki-verification-and-qa,
  or verify the composed markup via build + a seeded session.)
- **Wave C:** all three SolutionsBoard hosts (community card / stage feed / InitiativeStagePanel —
  narrowest wins), captions fit on one line in every locale, 44px floor holds, `actionBtnActive`
  legible, dark captions AA. ThreadedDiscussion Heart shows "Like (n)" beside Reply/Delete.

## 8. Scope, non-goals, and DESIGN_SYSTEM codification

- **Non-goals:** no Wave A rework (S30 shipped), no Wave D (mandate page, S32), no new routes, no
  fixtures/DEMO bump, no contract methods. Locked decisions (one-h1, brand blue, seam) untouched.
- **Codify in DESIGN_SYSTEM.md** (campaign §8 owes it to whichever wave lands it — Wave C):
  the **icon+caption action-button pattern** — board actions stack (icon+count row / caption);
  thread actions label inline; the visible caption is the accessible name (no mismatched aria-label);
  toggle actions carry `aria-pressed`; 44px is a floor, not a fixed height.
