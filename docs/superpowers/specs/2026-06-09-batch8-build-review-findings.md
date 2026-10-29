# Batch 8 — whole-build launch-readiness review (findings)

**Branch:** `ui` · **Date:** 2026-06-09 · **Reviewed at:** `ui` HEAD after the Part-1 a11y commits
(`2e3f022`) · **Method:** a read-only multi-agent `Workflow` (map → 7 dimensions × 7 flows →
adversarial verify → synthesis), modelled on `REVIEW-AND-REFACTOR-WORKFLOW.md` but organised by
**dimension × the 7 flows** (the lane model is retired). The pre-flight before the `ui → main` review
PR (Ouri's lens). **All review agents were read-only; no files were modified by the review.**

> ## §0 — `ui → main` readiness verdict: **YELLOW**
>
> `ui` is close, but **not ready to open the review PR until ~6 true blockers are cleared** — most are
> small. The headline gate is a **returning-user routing bug** (every user who finishes onboarding is
> sent back to `/welcome` forever) and a **seam that isn't as localized as assumed** (Ouri's stub→server
> swap touches more than `api.ts`). Clear the blockers in §2 (mostly S/M effort) → **GREEN**. The larger
> themes (i18n wiring, systemic button contrast, shared-kit a11y) can be staged across follow-up waves and
> documented in the PR rather than blocking it.
>
> **§0b — Post-gate fixes applied this session** (verified live light/dark/360–390px, committed locally,
> NOT pushed). Gate appetite = *quick-win blockers + seam doc*; *keep `$primary`, fix the advance button only*.
> Done: **(1)** isFirstRun routing (`b9a8073`); **(2)** Communities card keyboard access, ConvictionStaking
> focus/44px, advance button `#ea580c`→`#c2410c` (5.2:1 AA), CommunityView StageFooter clearance — incl. the
> mobile `@media` block a live check caught (`ce00299`); **(3)** 1p1v "Vote" copy, stage-feed discussion card
> → `/discussion`, `deleteComment` key (`dea2514`). The `$primary` AA gap is kept by decision; the seam-swap
> surface is documented in §8. `tsc -b` + `npm run build` clean.

---

## §1 — How this was produced (and a transparency note)

The review ran as a background `Workflow`. **It completed the full audit fan-out but the background
runtime was reaped mid-run** (after map + all **7 dimension agents** + **3 of 7 per-flow agents** = **83
findings**), before the verify/synth phases. Recovery:

1. **Salvaged** the 83 findings + the state map from the run journal (`/tmp/batch8-salvage.json`).
2. **Re-ran the 4 missing per-flow agents** (stage5-mandate, initiative-dashboard, community-home,
   identity-about) as foreground agents (~38 more findings) — reliable, in-turn, no background reaping.
3. **Adversarial verification of the verdict-driving blockers was done by the parent session directly
   (code + the live preview)** rather than a separate agent pass — and it mattered (it downgraded a
   false-positive; see §6). The seam/regression claims below are **parent-verified**, not asserted.

**Coverage:** all 7 dimensions (a11y, design-system, seam-integrity, correctness, i18n, tech-debt,
content-ux) × all 7 flows. ~120 raw findings → deduped + triaged below.

---

## §2 — Top issues (verdict-driving, parent-verified)

| # | Severity | Issue | Location | Verified | Fix effort |
|---|----------|-------|----------|----------|-----------|
| 1 | **blocker** | **Returning users are permanently routed to `/welcome`.** `isFirstRun()` reads `localStorage['gloki.onboarding.completed']`, which **nothing ever writes** — onboarding completion writes `gloki.onboarding = {completed:true}` (a different key). So `isFirstRun()` is always true after onboarding. | `App.tsx:55` vs `digitalAgentStore.ts:9` / `OnboardingFlow.tsx:127` | ✅ code + live (had to hand-set the key to reach authed routes) | **S** |
| 2 | **blocker** | **The seam is clean for contract ops but NOT fully localized to `api.ts`.** Contract read/write/deploy/join all go through `api.ts` ✅. BUT: (a) components import `services/demo/fixtures/*` for **identity/presence/author** data (Stage-2 co-authoring resolves authors+presence from `deliberation` fixtures; Profile/Mandate read fixtures); (b) **`ProblemStage.demo.ts` imports `mockApi`+`demoContracts` directly** and `MandatePage.demo.ts` reads the `problems` fixture — proposing a problem / rendering a mandate bypasses `api.ts`; (c) `eventStream.ts` opens a real `EventSource` to `${serverUrl}/stream` on login. Ouri's swap touches these, not just `api.ts`. | `CommunityHome.tsx:9`, `DiscussionStageView.tsx:18`, `useDiscussionData.ts:3`, `ProblemStage.demo.ts:12-15`, `MandatePage.demo.ts:8`, `eventStream.ts` + `AuthContext.tsx:68` | ✅ code | **M–L** (mostly *documenting* the swap surface for the PR; type-only imports are benign) |
| 3 | **blocker (a11y)** | **Keyboard-inaccessible community cards.** `Communities.tsx` cards are `<div onClick>` with no `tabIndex`/`role`/`onKeyDown` — a keyboard/switch user cannot open a community. Same bug class as the Batch-7 discussion-card fix, **missed here**. | `Communities.tsx:196-200` | ✅ code | **S** |
| 4 | **blocker (a11y)** | **ConvictionStaking controls miss focus-visible + ≥44px.** The sole mandate-staking lever (Back-this button, duration radios, retry) has **0 focus-visible rules and no min-height** (~30px). | `ConvictionStaking.module.scss` | ✅ code (grep: 0 focus-visible) | **S** |
| 5 | **blocker (content / north-star)** | **Copy contradicts one-person-one-vote.** Stage-4 description reads **"Weighted voting on the best proposals"** — directly contradicts the 1p1v invariant. | `InitiativeDashboard.tsx:41` | ✅ code | **S** |
| 6 | **blocker (a11y)** | **Community content clipped behind the StageFooter.** `.body` has only `$spacing-lg` (16px) bottom padding; the fixed 64px `StageFooter` overlaps the bottom ~48px of every community sub-route (feed, members, chat, currency). | `CommunityView.module.scss:90-92` | ✅ code (conclusive) | **S** |

**Systemic contrast (blocker-by-the-bar, but a brand decision):**

| # | Issue | Location | Verified | Fix |
|---|-------|----------|----------|-----|
| 7 | **Primary button text fails AA.** white on `$primary` `#3b82f6` = **3.68:1** (< 4.5:1 normal text). Affects **every** primary `<Button>` across all 7 flows. | `variables.scss:5`, `Button.module.scss .primary` | ✅ hex math | **S token-change** (`$primary`→a darker blue ≈ `#2563eb` ≈ 5.1:1) — **but it changes the whole visual identity → Eston's call** |
| 8 | **Advance button fails AA.** white on `$initiative-color` `#ea580c` = **3.56:1**. The single most important action on the dashboard. | `InitiativeDashboard.module.scss:3,331` | ✅ hex math | **S** |

---

## §3 — Recurring themes

1. **i18n is the biggest debt by count.** Many user-facing strings are **raw literals, not `t()`-wired** —
   so the fr/sw locale wave won't even pick them up. Worst offenders: `InitiativeDashboard` (zero `useT`),
   `StageFeedView` `STAGE_CONFIG` + threshold banners, `CreateInitiativePage`, `NotificationsBell`
   dropdown, `ContactPage` (no `useT` at all), `Members`, `formatTimeAgo`. (fr/sw-English-now is a settled
   decision — these are *wiring* gaps, not missing translations.)
2. **Hand-rolled controls skip a11y basics.** focus-visible and/or ≥44px missing on ConvictionStaking,
   the advance bar, chat buttons, `Communities` cards (also keyboard), `Stepper` (32px), `Modal` close
   (32px), the StageFeed community badge, AnchoredThread buttons. The shared `Button`/`SegmentedControl`
   encode these — the fix is "use the kit."
3. **Seam: contract ops clean, presentational/identity/event channels leak.** (See §2.2 — the key Ouri
   nuance.)
4. **Systemic contrast** on the two brand button colours (§2.7-8).
5. **Vocabulary drift** undercuts the north star: "Weighted voting" (§2.5), "issue" used user-visibly in
   `ProblemStage`, "Problem Recognition" naming in CreateInitiative, an empty-state pointing at a
   non-existent "Initiative tab" (`InitiativeFeed.tsx:114`), community-menu "Home" → global stage feed.
6. **Dead code still registered in the store.** `pages/InitiativeView.tsx` + `Roadmap/Gaps/Steps` +
   `initiativeSlice` thunks remain wired even though the route uses `pages/collaboration/InitiativeView`;
   plus `CreateIssueDialog`/`CreateCommunityDialog`/`CollaborationPanel` (0 importers).

---

## §4 — Prioritized fix list (severity × effort)

**Quick wins (S, high value) — recommend for the pre-PR pass:**
- #1 `isFirstRun` → read `getProgress().completed` from the agent store (1-line; unblocks all returning users).
- #5 "Weighted voting" → "Voting on the best proposals" (north-star integrity).
- #3 `Communities` card → `<button>` / add `role`+`tabIndex`+`onKeyDown` (keyboard access).
- #6 `.body { padding-bottom: calc(#{$footer-height} + #{$spacing-lg}) }` (un-clip content).
- #4 ConvictionStaking → add focus-visible + `min-height:44px` (or migrate to shared `Button`).
- #8 advance button → `$initiative-color` is already a fail; darken to meet 4.5:1, or use `$primary-dark`.
- `deleteComment` key: `comment_id` → `id` (silent no-op today).
- StageFeed discussion card → navigate to `/discussion` not `/roadmap` (affordance says "co-author").

**Medium (M):**
- #2 **Document the seam-swap surface** for Ouri in the PR (the demo-fixture imports, the two `.demo.ts`
  files, `eventStream`) — and ideally move pure helpers (`diffWords`, `relativeTimeKey`) + shared types
  out of `services/demo/fixtures/` into a non-demo module so the demo boundary is honest.
- Stage-advance: gate the UI on author/admin (or at minimum surface the swallowed `set_stage` error) +
  fix `getStageReadiness` (only the Problem stage is checked; the `activeMemberCount===0` race opens the gate).
- Modal: add focus-on-open + focus-trap (Esc/role/aria-modal already present — see §6).
- StageFooter: `aria-current="page"` on the active tab + `aria-label` on the `<nav>`.
- Migrate hand-rolled buttons (chat, advance bar, Stepper) to the shared kit (fixes focus + 44px together).

**Large (L) — stage across follow-up waves:**
- #7 `$primary` contrast (whole-identity decision).
- i18n wiring sweep (raw literals → `t()`), incl. `InitiativeDashboard` (zero `useT`).
- Token-debt cleanup wave (already flagged in the a11y findings §1b: dark-palette family + dialogs + the
  484KB `IdentityCardDialog` — jsPDF/svg2pdf statically imported; make them dynamic `import()`).
- Dead-code removal (§3.6) — also drops `initiativeSlice` thunks from the live store.

---

## §5 — Per-flow one-liners (Ouri's "one elegant thing")

- **Onboarding:** fix `isFirstRun` (#1) — it's the flow's correctness keystone.
- **Stage feed:** wire `STAGE_CONFIG`/banners through `t()`; fix the discussion-card destination.
- **Stage-2 co-authoring:** resolve authors/presence from contract/profile data, not `deliberation`
  fixtures (the biggest seam item) — then CoPresenceBar/SharedStatement survive the swap untouched.
- **Stage-5 mandate:** migrate ConvictionStaking to the shared `Button`/radio kit (closes focus+44px+dark
  in one pass) and make the demo contract *replace* a stake, not accumulate it.
- **Initiative dashboard:** add `useT` + gate/feedback the advance action; replace the hand-rolled
  `.absorbedBanner` with `<Banner tone="warning">`.
- **Community home:** add footer clearance (#6); replace `alert()`/`confirm()` with the shared `Modal`;
  fix the stale-closure stage fetch.
- **Identity/about:** `Communities` card keyboard access (#3); surface the user's own `TrustBadge` on Profile.

---

## §6 — Verification: dropped / downgraded (adversarial pass earned its keep)

- **Shared `Modal` — DOWNGRADED blocker → refactor.** An agent claimed "no Esc, no role, no focus-on-open,
  no trap." Verified: `Modal.tsx:35` handles **Escape**, and `role="dialog"` + `aria-modal="true"` are
  present. Only **focus-on-open + focus-trap** are genuinely missing. Real, but a refactor — not a blocker.
- **NotificationsBell "invisible bell"** was already **fixed in Part 1** (`color: inherit`); the agents'
  re-flag is a stale duplicate. The dropdown panel's dark-palette + keyboard gaps remain (token-debt wave).
- **Primary-button contrast** is real but is a **brand decision**, not an unambiguous defect to auto-fix.

---

## §7 — Deferred / out of scope (not blocking the PR)

- The token-debt cleanup wave (a11y findings §1b) — dark-palette family, dialogs, the 484KB bundle.
- Full i18n locale parity (fr/sw) — the separate wave-1.5 task; this review only flags *wiring* gaps.
- `Math.random()` key generation in `LoginPage` (Ouri's crypto concern at handoff).
- Three duplicate `formatTimeAgo` implementations → consolidate to `utils/formatTimeAgo`.

---

## §8 — Seam swap surface (handoff checklist for Ouri)

The contract seam is clean — `contractRead`/`contractWrite`/`deployContract`/`joinContract` in
`src/services/api.ts` (backed by `src/services/demo/`) is the localized swap point. BUT the stub→server swap
also touches the following, so they belong on the checklist (not just `api.ts`):

1. **`src/services/eventStream.ts`** — opens a real `EventSource` to `${serverUrl}/stream` on login
   (`AuthContext.connect`). Wire the real event stream here. (Benign in the mockup; it just isn't behind `api.ts`.)
2. **`.demo.ts` files imported by components** — `src/components/stages/ProblemStage.demo.ts` (imports
   `mockApi` + `demoContracts` directly, so *proposing a problem* bypasses `api.ts`) and
   `src/components/mandate/MandatePage.demo.ts` (reads the `problems` fixture). Replace with `api.ts` calls.
3. **Components reading demo *data* fixtures** (not just types) — Stage-2 co-authoring resolves authors +
   presence from `demo/fixtures/deliberation` (`DiscussionStageView`, `useDiscussionData`, `SharedStatement`,
   `PositionsBoard`, `AnchoredThread`, `CoPresenceBar`); `Profile`/`DigitalAgentCard` from
   `demo/fixtures/identity`; `CommunityHome`/`MissionBanner` from `DEMO_COMMUNITIES`; the mandate components
   from `demo/fixtures/mandate`. These need real contract/profile data, not fixtures.
4. **Pure helpers/types misplaced under `demo/fixtures/`** — `diffWords`, `relativeTimeKey`, and shared types
   (`PublishedMandate`, `JourneyPhase`, `Persona`, channel/sync types) are imported widely. Type-only imports
   are erased at build (runtime-benign) but muddy the boundary; moving the pure helpers + types into a
   non-demo module would make the demo boundary honest and the swap unambiguous.

---

*Raw findings + the state map: `/tmp/batch8-salvage.json` (83) + the 4 foreground per-flow agent outputs
(in the session transcript). This report is the synthesized, parent-verified view.*
