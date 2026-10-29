# S30 — Card anatomy unification (walkthrough-campaign Wave A) — design spec

**Session:** S30 · **Branch:** `ui` · **Base HEAD:** `6ea9599` (clean tree, verified 2026-07-13)
**Class:** UI-only (no `src/services/**` touched) → no `DEMO_VERSION` bump, no contract methods,
no routes. **Source spec:** [docs/ui-walkthrough-campaign-2026-07-13.md](../../ui-walkthrough-campaign-2026-07-13.md) §2 (Wave A).

This wave unifies card anatomy across the three problem-card surfaces (community activity card,
stage feed, legacy panel) and the two chin owners. Everything here renders on multiple surfaces,
so it is the first wave to ship.

---

## 1. Re-grounded premises (Step 2, vs HEAD `6ea9599`)

**Held true:**
- No `chinExtras` slot anywhere. Chin contents hard-coded in both owners: `InitiativeStageCard.tsx:178-200`
  (tinted `$footer-surface` chin) and `FeedEngagePanel.tsx:200-216` (rule-only chin, comment `.module.scss:23-26`).
- `.stageNavRow` (InitiativeStageCard.module.scss:86-90) genuinely has **no horizontal padding**
  while `.metaLine` (:97) insets `$spacing-lg` — C2 real.
- Bespoke threshold bar with `thresholdMarker` hardcoded `left:'100%'` (the gray end-line), **zero
  ARIA**; kit `ProgressBar` is marker-less and maps cleanly.
- `ProblemVoteFlow` has **exactly one consumer** (`ProblemEngage`) — safe to relocate the hint into it.
- All copy keys exist at fr/sw parity; `en.ts` is the partial-dictionary model (English in inline
  `t(key, default)` defaults). Only the D3 short label is a **new** key.
- `ProgressBar` `size="md"` = 8px == current `.progressTrack` height (visual weight preserved).

**Rotted / nuances found (4 catches):**
1. **Stale path** — `ProblemVoteFlow.tsx` lives at `src/components/collaboration/flows/voting/`,
   NOT the `initiative/stages/` path §7 cites. Content matches (bar 186-205, marker 193, zero ARIA).
2. **`$spacing-md` = 12px, `$spacing-lg` = 16px = `$content-gutter`.** So the A-1 fix needs a **360px
   mobile override** (`padding: 0 $spacing-md`) as well; the doc's `padding: 0 $spacing-lg` alone
   would leave the strip 4px off the siblings at the 360px flagship. Mirror `.metaLine`'s two-breakpoint
   pattern.
3. **A third `ProblemEngage` host** — `InitiativeStagePanel.tsx:255-262` renders `<ProblemEngage>`
   (no chin, no author passed). Reached only via `ActivityCard`'s fallthrough, which is unreachable
   for all 5 canonical stages (each routes to a dedicated `*ActivityCard`). Effectively legacy for
   Problem. We render `ProblemChinExtras` there anyway (zero-regression), see A-5.
4. **`Button variant="secondary"` = `$radius-md`** (rounded-rect), not a pill. For "one interaction
   grammar per chin" the suggest + open-in-community controls are bespoke `$radius-full` pills
   matching `DiscussionPill` — not `<Button variant="secondary">`.

---

## 2. Locked decisions (Eston, 2026-07-13 — recommend-then-confirm)

| # | Decision | Locked |
|---|---|---|
| D2 | Stage-strip redundancy/false-affordance | **De-buttonize current pill only** — drop border+tint; keep BOTH badge (sole collapsed identity) and strip (sole pipeline position). |
| D3 | Chin suggest-pill label | **Short "Suggest"** (visible), full `card.suggestToAuthor` kept as aria-label. Screenshot at 360px before finalizing. |
| D4 | Stage-feed "Open in community" | **Pill** matching DiscussionPill (one grammar per chin). |

Other choices folded into the spec (implementation-level, not product): no underline on the current
pill (would re-introduce link/interactive grammar — dot + `$gray-900` semibold carries "you are here",
verify legibility in preview); code chip stays a `$radius-md` chip on its own full-width row (it is a
copyable code display, not a nav pill).

---

## 3. Task-by-task design

### A-1 · Stage-strip gutter (C2) — `InitiativeStageCard.module.scss` only
- `.stageNavRow`: add `padding: 0 $content-gutter;` (base, 16px — honors the W1 gutter law; `.metaLine`
  uses the equal `$spacing-lg`).
- Mobile block (`@media (max-width: $breakpoint-sm)`): add `.stageNavRow { padding: 0 $spacing-md; }`
  (12px, mirrors `.metaLine`'s mobile override — **catch #2**).
- Do NOT touch `FeedEngagePanel` here (its own gutter is handled by the A-5.2 restructure).
- Verify: strip insets 16/12px matching `.metaLine`/`.summary`; fr/sw 4-pill wrap unchanged at 360px.

### A-2 · De-buttonize current pill (C1, D2) — `InitiativeStageStrip.module.scss` only
- Delete the four `.stage_*.current .pill { background…; border-color… }` rules (60-63, light) and
  the four dark tints (72-75). The `.current .pill { color:$gray-900; font-weight:$font-semibold }`
  (55-58) and dark `.current .pill { color:$dark-text }` (70) STAY.
- `.pill` keeps `border: 1px solid transparent` (layout-stable; no visible border now) — reads as a
  labelled dot, not a chip.
- TSX unchanged → `discussion → 0.5` special case preserved (`InitiativeStageStrip.tsx:39`); never navigates.
- Verify: "current" still distinguishable from "done" (dot full-color + darker/bolder label). If
  illegible at 360px, revisit — but no underline (link grammar). Contrast: `$gray-900` on card AA-safe.

### A-3 · Threshold bar → kit (C3) + A-4 · hint relocation (B3)
Files: `ProblemVoteFlow.tsx` + `.module.scss`; `ProblemEngage.tsx` + `.module.scss`; 3 call sites (for `up` prop removal).

**ProblemVoteFlow.tsx** — replace the bespoke bar (`.thresholdSection` innards, 187-204):
```tsx
const hintCopy = thresholdMet
  ? t('problems.thresholdMetHint', 'Agreed by at least half of your community.')
  : t('problems.thresholdHintShort', 'It becomes a shared problem once at least half of your community agrees.');
// …inside .thresholdSection:
<ProgressBar
  value={tally.up}
  max={Math.max(Math.ceil(communityMemberCount * 0.5), 1)}
  label={hintCopy}                                   // aria-label (qualitative)
  variant={thresholdMet ? 'success' : 'primary'}
  size="md"
/>
<div className={styles.thresholdLabels}> …seconded / more-to-go… </div>   // KEEP, announced
<p className={styles.thresholdCaption} aria-hidden>{hintCopy}</p>          // A-4: the relocated hint, visible caption
```
- Import `ProgressBar` from `../../../shared` (verify barrel export at build).
- ARIA: the ProgressBar gives `role=progressbar` + `aria-valuenow/max` + `aria-label=hintCopy` it never
  had. The visible caption is `aria-hidden` (the aria-label already carries it → no double-announce).
  The numeric legend stays announced (the hint carries no numbers, so no dup of the legend — per §2 A-3 of the campaign doc).

**ProblemVoteFlow.module.scss:**
- Delete `.progressTrack` (193-203), `.progressFill` (205-214), `.thresholdMarker` (216-227) — each
  carries its own inline `@include dark`, so nothing orphans. Trailing `@include dark` (252-299) only
  references kept classes (audited — **no orphans**, S28 lesson).
- Add `.thresholdCaption` (port `ProblemEngage .thresholdHint`): `margin: $spacing-xs 0 0; font-size:$text-xs;
  line-height:1.5; color:$gray-500;` + dark `color:$dark-text-secondary`.

**ProblemEngage.tsx:** delete the floating `<p className={styles.thresholdHint}>` (72-76) and the now-unused
`needed`/`thresholdMet` locals (50-51) and the `up` prop (unused after → `noUnusedLocals` would fail).
**ProblemEngage.module.scss:** delete `.thresholdHint` (9-19).
**Call sites drop `up={…}`:** `ProblemActivityCard.tsx:120`, `FeedEngagePanel.tsx:79`, `InitiativeStagePanel.tsx:259`.
(Each keeps computing `up` for its own readiness/teaser — only the ProblemEngage prop is removed.)

Between this commit and A-5, ProblemEngage still renders code chip + suggest — fine, `ui` runnable.
Verify on all 3 host surfaces (community card, stage feed, InitiativeStagePanel), light+dark: no gray
end-line, bar turns green at threshold, caption reads under the bar. *Claims-honesty:* seed a member/author
persona to render the bar live (unverified demo user is trust-gated out — gloki-verification-and-qa).

### A-5 · Universal two-tone chin + chinExtras slot (E1/E2/E3 + B1/B2, D3/D4)

**New shared component `src/components/initiative/ProblemChinExtras.tsx`** (+ `.module.scss`):
- Props: `initiativeId, communityId, hostServer, hostAgent, authorKey?, authorName?`.
- Renders a Fragment: **suggest pill** + **code chip** (both moved from ProblemEngage body).
  - Suggest pill: bespoke `$radius-full` outlined pill matching DiscussionPill (`.suggestPill`: 44px,
    `1px $gray-300`, transparent, `$gray-700`, semibold; hover border `$primary`). `<Send size={16}/>` +
    `<span>{t('card.suggestToAuthorShort','Suggest')}</span>`; `aria-label={t('card.suggestToAuthor','Send suggestion to author')}`.
    onClick → `navigate(\`${base}/suggest\`, { state:{ authorKey, authorName } })`.
  - Code chip: port `ProblemEngage .codeChip/.codeLabel/.codeValue` verbatim; add `flex-basis:100%` so it
    wraps to its own full-width row (row 2). Copies `codeForId(initiativeId)`.
- **New i18n key** `card.suggestToAuthorShort` — inline en default `'Suggest'`; add fr/sw at parity;
  append to packet. `card.suggestToAuthor` unchanged (now aria-only). (gloki-i18n-playbook.)

**InitiativeStageCard.tsx:** add `chinExtras?: React.ReactNode` to props; render it inside `.chin`
between the DiscussionPill and the openBtn. Chin renders when `(stageNav || (onOpen && openLabel) || chinExtras)`.
Change `.chin` `justify-content: space-between` → `flex-start` (the openBtn keeps `flex:1` so it still
right-fills where present; problem cards have no openBtn). Code chip's `flex-basis:100%` gives the
row-1 (Discussion + Suggest) / row-2 (code) split.

**ProblemActivityCard.tsx:** pass `chinExtras={<ProblemChinExtras initiativeId={item.id} communityId={communityId}
hostServer={hostServer} hostAgent={hostAgent} authorKey={authorKey} authorName={authorName} />}` to InitiativeStageCard.

**FeedEngagePanel.tsx:** render `<ProblemChinExtras … />` in the chin when `stage==='problem'`
(it has authorKey/authorName props). Order in chin: Discussion, Suggest, Open-in-community(pill), code(full-width).

**InitiativeStagePanel.tsx:** render `<ProblemChinExtras initiativeId communityId hostServer hostAgent />`
right after `<ProblemEngage>` in the problem branch (no author available there — same as today's degraded
suggest). Zero-regression for the legacy path (catch #3).

**ProblemEngage.tsx (slim):** after moving code+suggest out, ProblemEngage = `.engage` › StageGate › ErrorBoundary
› ProblemVoteFlow only. Remove now-unused props `hostServer, hostAgent, authorKey, authorName` and the
`navigate`/`openSuggest`/`base`/`codeForId`/`Send`/`Copy` imports. Props left: `initiativeId, communityId,
communityMemberCount`. Update the 3 call sites to drop those props.
**ProblemEngage.module.scss:** delete `.codeChip/.codeLabel/.codeValue/.actions` (moved to ProblemChinExtras).

**A-5.2 · Let the stage-feed chin tint** (`StageFeedView` + `FeedEngagePanel`):
- **StageFeedView.tsx:** wrap `.cardMeta` + `.cardTitle` + `.cardDescription` in `<div className={styles.summary}>`
  (real cards AND the sample cards). `.panelWrap` stays a sibling of `.summary`.
- **StageFeedView.module.scss:** `.card` → `padding: 0; overflow: hidden;` (drop `padding:$spacing-lg`
  and the mobile `padding:$spacing-md`; drop the card-level `gap`). Add `.summary { display:flex;
  flex-direction:column; gap:$spacing-sm; padding:$spacing-lg; }` + mobile `.summary { padding:$spacing-md; }`.
  `.summary` stays **static** (unpositioned) so `.cardTitleButton::after {inset:0}` still resolves to
  `.card` — **the S20 z-index/::after hit-area must survive** (verify in preview; catch: `.cardMeta`/
  `.communityBadge`/`.panelWrap` keep `z-index:1`). `overflow:hidden` does not clip the outer box-shadow
  (own shadow) or the inset focus outline.
- **FeedEngagePanel.tsx:** wrap the strip + engage blocks in `<div className={styles.body}>`; keep `.chin`
  as a sibling of `.body` inside `.panel`.
- **FeedEngagePanel.module.scss:** `.panel` → no horizontal padding (`display:flex; flex-direction:column`);
  `.body { border-top:0.5px solid $gray-200; margin-top:$spacing-md; padding:$spacing-md $content-gutter 0;
  display:flex; flex-direction:column; gap:$spacing-md; }` + mobile `padding-inline:$spacing-md`. `.chin`
  adopts the full-tint model (mirror InitiativeStageCard): `padding:$spacing-md $content-gutter;
  background:$footer-surface; border-top:1px solid $footer-border;` (drop the old rule-only `padding-top`),
  full-width, clipped by the card's `overflow:hidden`. Dark: `.chin { background:$footer-surface-dark;
  border-top-color:$footer-border-dark; }`. Mobile `.chin { padding:$spacing-md; }`.
  **Update the 23-26 comment** (it codifies the retired §1.3 rule-only call) — note the reversal vs
  `docs/ui-polish-campaign-2026-07.md` §1.3.
- **D4 open-in-community → pill:** restyle `.openLink` to match DiscussionPill (outlined `$radius-full`
  pill, `$primary-dark` text/border-hover, 44px, drop `align-self:flex-end`). Keep the route + ExternalLink icon.

**Scope guards (A-5.6):** MandateCard hero keeps its `.actions` row (hero, not a feed card). DiscussionPill
stays read-only (`resolveInitiativeStageContract`, never `useFlowContract` — S11). MandateActivityCard's
tinted chin/view button unchanged.

**Chin composition is empirical (S29 width law):** at 360px the chin usable width ≈ 296px. Discussion
(~120px) + short "Suggest" pill (~100px) should share row 1; code chip full-width row 2; stage-feed adds
the Open-in-community pill (likely wraps). **Build the composition, screenshot at 360px light+dark en/fr/sw,
show Eston before finalizing D3** (build both "Suggest" vs an alternative if row 1 overflows).

---

## 4. i18n (gloki-i18n-playbook)

| Key | en (inline default) | fr | sw | Action |
|---|---|---|---|---|
| `card.suggestToAuthorShort` | `Suggest` | (native pass — packet) | (native pass — packet) | **NEW** (+1 key; parity 1137→1138) |

Relocated keys (no change): `problems.thresholdMetHint`, `problems.thresholdHintShort` (now the bar
caption/label), `card.suggestToAuthor` (now suggest aria-label), `writeTogether.problemCodeLabel`,
`stagefeed.openInCommunity`. No en.ts edits (partial-dictionary model). Append a "Session 30" packet section.

## 5. Verification (per-chunk + wave)

Per chunk: `npx tsc -b` clean, `npm run build` clean, grep gates (`$gray-400` text; no raw hex/px/rgba).
Controller-only preview at **360px, light+dark, en/fr/sw** on: community feed (all 5 card stages, problem
expanded), `/stage/problem·proposals·vote` expanded, collapsed teasers. Confirm: strip gutter matches
siblings; current pill de-buttonized yet legible; no gray end-line + green-at-threshold + ARIA on the bar;
chin tint **parity community↔stage-feed**; suggest pill + code chip in the chin; Open-in-community is a pill;
h1 counts unchanged; **S20 ::after hit-area still toggles the stage-feed card**. Seed a member/author to
render the bar live.

## 6. DESIGN_SYSTEM.md codification (final commit)
- Universal two-tone chin law (both feed-card owners: `$footer-surface`/`$footer-border`, full-width,
  card `overflow:hidden`; hero cards exempt).
- Stage-strip gutter rule (`.stageNavRow` insets `$content-gutter`/`$spacing-md` like all content rows).
- Note the §1.3 reversal (stage-feed chin now tints, was rule-only).

## 7. Commit plan (each leaves `ui` runnable; `feat(s30)` / `docs(s30)`)
1. A-1 gutter · 2. A-2 de-buttonize · 3. A-3+A-4 bar→kit + hint caption · 4. A-5 chinExtras + move
suggest/code (+new key) · 5. A-5.2 stage-feed chin tint + D4 open-pill · 6. DESIGN_SYSTEM + comment.
Opus whole-branch review before proposing the push. **Push held for Eston's explicit green light.**
