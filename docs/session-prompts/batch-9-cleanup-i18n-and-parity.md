# Session prompt — Batch 9: post-review cleanup waves → i18n wiring → multilingual parity

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> **This is a roadmap of ordered waves, not one session's worth of work.** Batch 8 confirmed `ui` is
> launch-ready and the `ui → main` review PR (#20) is refreshed for Ouri. This batch executes the
> **deferred long-tail** the build-review flagged — in priority order, doing the most *reviewable-for-Ouri*
> cleanup first. Do as many waves as fit cleanly; **gate the two product/brand decisions** before touching
> them; write the next-session prompt for whatever remains. Don't try to cram it all into one session.

---

You are continuing the Gloki UI work on **`ui`**. Batch 8 (launch-readiness finish + a whole-build
multi-agent review) is **complete, pushed, and live** (Pages green, `ui` HEAD `b446e71`). First, read:

- **The build-review report — `docs/superpowers/specs/2026-06-09-batch8-build-review-findings.md`.** This is
  the **worklist source**: §4 is the prioritized fix list, §7 the deferred items, **§8 the seam-swap
  checklist for Ouri**. Every wave below maps to findings there (with exact `file:line` locations).
- `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md` (a11y resolution log + §1b token-debt flags).
- `CLAUDE.md`, `ARCHITECTURE.md` (the 8 flows + the data-layer seam), `DESIGN_SYSTEM.md` (tokens are law).
- The auto-memory `project_ui_redesign_apr2026` (full batch history; the Batch-8 entry).

## How we work (non-negotiable — same as every batch)

- **Branch + seam:** develop on `ui` against the **stub layer** only — everything through
  `src/services/api.ts` / `src/services/demo/`. Never call a real server from a component. (Note: §8 of the
  review documents where the seam *isn't* yet localized — `eventStream`, the two `.demo.ts` files,
  demo-fixture imports. The token-debt + i18n waves below shouldn't widen those leaks.)
- **Design system is law** (`DESIGN_SYSTEM.md`): tokens only (no ad-hoc hex/px/literal-rgba; derived
  `rgba($token,a)` OK), AA contrast, focus-visible on every control, ≥44px targets, light + dark, flagship
  **360px**. Strings via `t('ns.key','English default')`.
- **Verify before "done":** `npx tsc -b` **and** `npm run build` exit 0, then walk the affected routes in
  the preview (`preview_start({name:"gloki-dev"})`, port 5173) in **light + dark + 360px** — judge by exit
  codes + a live DOM check, not from source. No ErrorBoundary/console errors.
- **Commit locally** in small, clearly-described chunks (`Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>` trailer). **Do NOT push** — Eston controls the deploy; hand back when verified.
- **Product/brand calls via the question tool.** Two are gated below — don't pre-empt them.
- **Slow external drive:** throttle heavy parallel file I/O — small sequential batches. The dev preview may
  idle-stop between long gaps — just `preview_start` again.

## Demo facts (save time)

- Authed routes: seed `localStorage.user = {publicKey:'<64 alnum>', serverUrl:'https://gdi.gloki.contact'}`.
  To skip the `/welcome` redirect, ALSO set `gloki.digitalAgent` (a full agent object) **and**
  `gloki.onboarding = {completed:true}` — *Batch 8 fixed `isFirstRun` to read the agent store, so the old
  `gloki.onboarding.completed` string key is no longer needed.* Live demo: community
  `demo-comm-mq4adhe7-daa1ds1b`, initiative `demo-init-mq4adhe8-0rr7tgxb`.
- `preview_click` fires real `<button>` onClicks but synthetic clicks don't blur inputs; `<div role=button>`
  cards may not navigate via synthetic click (inspect the DOM / seed state instead).

---

## The waves (ordered — do the reviewable-cleanup first)

### W1 — Dead-code removal (do first; cleans the diff Ouri reviews)
Confirmed 0-importer / superseded code (review §3.6 + a11y §1b):
- `src/pages/InitiativeView.tsx` (the Roadmap/Gaps/Steps shell — superseded by
  `src/pages/collaboration/InitiativeView.tsx`) **+ its tree**: `src/components/initiative/{Roadmap,Gaps,Steps}.tsx`,
  `src/components/initiative/dialogs/*`, and the `initiativeSlice` thunks (`fetchRoadmap/fetchGaps/fetchSteps`)
  that are still registered in the store. Confirm each is truly unreferenced before deleting (`grep -rn` the
  symbol). Drop the slice/thunks from the store registration too.
- `CreateIssueDialog`, `CreateCommunityDialog` (superseded by the full-page flows), `CollaborationPanel` — 0
  importers. Their ad-hoc-hex goes with them.
- **Verify:** `tsc -b` + build clean; walk `/`, a community, an initiative dashboard, `/welcome` — nothing
  404s or ErrorBoundaries. Small commit per logical group.

### W2 — i18n wiring sweep (the biggest; unblocks fr/sw parity)
Wire **raw English literals → `t('ns.key','English default')`** (NOT translation — just wiring; fr/sw stays
English-now). Worst offenders from the review (§2/§3.1): `InitiativeDashboard` (zero `useT` — all stage
labels/statuses/advance copy), `StageFeedView` `STAGE_CONFIG` + threshold/loading/sample banners,
`CreateInitiativePage`, `NotificationsBell` dropdown, `ContactPage` (no `useT`), `Members`, `formatTimeAgo`,
and stranded `aria-label`/`title`/placeholder literals. Add keys under sensible namespaces; keep English
defaults identical. Verify a couple of surfaces render unchanged. This is large — chunk by area, commit per area.

### W3 — Token-debt cleanup wave (design-system canonicalization)
Per a11y §1b + review §3: convert the **hardcoded dark-palette family** to theme-aware tokens (light + dark):
`NotificationsBell` dropdown panel, `RoleChip`, `RoleDisplay`, `ExpertEndorseButton`, the merge flow
(`MergeProposalCard`/`MergeProposalsList`/`MergeProposalSubmitModal`), `InitiativeDashboard` `.absorbedBanner`
(replace with `<Banner tone="warning">`). Then the dialogs (`ApprovalDialog`, `CreateCollabDialog`,
`IdentityCardDialog`). **Bundle:** make jsPDF/svg2pdf in `IdentityCardPDFGenerator.ts` a **dynamic `import()`**
so the 484KB `IdentityCardDialog` chunk loads on demand. Verify light+dark, no contrast regressions.

### W4 — Smaller a11y (bounded)
- Shared `Modal` (`src/components/shared/Modal.tsx`): add **focus-on-open** + **focus-trap** (Esc + `role` +
  `aria-modal` already present — Batch 8 verified; only focus management is missing).
- `StageFooter`: `aria-current="page"` on the active tab + `aria-label` on the `<nav>` landmark.
- (Optional) migrate remaining hand-rolled buttons (chat send/back, Stepper) to the shared `Button` to close
  focus + 44px in one pass.

### 🚦 GATE A (brand decision) — `$primary` contrast
White on `$primary` `#3b82f6` = **3.68:1** (below AA 4.5:1 for normal text) — every primary button. **Ask
Eston** (question tool) before changing: darken `$primary` → ~`#2563eb` (≈5.1:1, fixes app-wide but shifts
the blue identity) **vs** keep + document. He kept it at the Batch-8 gate; confirm before acting.

### 🚦 GATE B (product decision) — stage-advance gating
The dashboard "Move to {stage}" button shows for every member and swallows `set_stage` errors (review
§2 / initiative-dashboard findings). **Ask Eston:** who may advance — author/admin only, or community
self-governs? At minimum surface the swallowed error. Don't implement a gating model without his call.

### W5 — fr/sw multilingual parity (likely its own session; do AFTER W2)
The standing wave-1.5 task: translate the en keys → fr/sw in `src/i18n/`, and add the pre-auth
**language switcher** (the deferred a11y finding #11). Gated on W2 (can't translate keys that aren't wired).
This is large enough to be its own batch — scope it then.

## The `ui → main` review PR (#20)
Already refreshed for Ouri (current title + body + pointers to the review report & §8). As waves land, keep
it current if the scope shifts materially; **Ouri reviews/merges — don't merge it yourself**, and the 2
upstream `main` commits still need reconciling first.

## Sizing + when done
- Suggested order: **W1 → W2 → W3 → W4**, then **Gate A/B** (questions), with **W5** as a separate follow-up.
- Realistically 2–3 sessions. Do what fits cleanly this session; `tsc -b` + `npm run build` green; verify
  affected routes live (light/dark/360px) with screenshots for changed surfaces; small local commits; **no
  push**. Hand back with what shipped vs deferred, and **write the next-session prompt** for the remainder.
