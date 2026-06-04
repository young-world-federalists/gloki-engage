# Batch 6 — Welcome-guide content pass + diverse-persona accessibility review

**Branch:** `ui` · **Date:** 2026-06-04 · **Status:** approved design, pending spec review

Two design-/audit-first workstreams, sequenced in one batch:

- **Workstream 1 — Welcome-guide content pass:** make first-run onboarding actually *teach* Gloki.
  Today's `/welcome` journey (`Invite → Vouch → Agent → Rules → Ready`) is warm and i18n'd, but it
  teaches **who you are**, **trust**, and **norms** — and never the thing that makes Gloki *Gloki*:
  the **5-stage pipeline** (Problem → Discussion → Proposals → Vote → Mandate) and the **trust →
  what-unlocks** link. We add that teaching, with a single reusable explainer, **seed + reinforce**.
- **Workstream 2 — Diverse-persona accessibility review (the capstone):** a WCAG 2.1 AA pass across the
  key flows through **five personas**, then targeted fixes. Runs *after* Workstream 1 so it audits the
  whole app **including** the new welcome guide.

Everything stays on the **stub layer** (`src/services/`), keeps **one person, one vote**, renders
inside the existing **`StageGate`** (Batch 4), respects the **content-shows-immediately** homepage
decision, and obeys the **design system**. The design below was confirmed with Eston via the question
tool on 2026-06-04 (gap = a blend of "teach the pipeline" + "make it land"; framing = hybrid;
delivery = seed + reinforce; LoginPage = light warm-up; fr/sw = English-now-wired-for-later; personas
= all five; sequencing = welcome → a11y capstone, one batch).

---

## 1. The confirmed design (product calls, owned by Eston)

### 1.1 Workstream 1 — welcome guide

| Decision | Choice | Notes |
|----------|--------|-------|
| The gap to close | **Blend: teach the pipeline + make it land** | Add the missing 5-stage mental model + the trust→unlock link; deliver it visually/scannably, not as a wall of text. |
| Framing | **Hybrid: warm hook + universal lesson** | Keep the specific invite hook ("{name} invited you to {community}"); teach the *universal* Gloki mechanics (pipeline, trust, 1p1v) as the substance. |
| Delivery | **Both — seed + reinforce** | A concise pipeline step **in** `/welcome` (seed) · the fuller explainer on **About** (reference) · one gentle, dismissible **stage-feed pointer** (reinforce in context). |
| Source of truth | **One `HowGlokiWorks` component** | A single presentational component with `variant: 'compact' \| 'full'` drives both the welcome step and About — no copy duplication. |
| LoginPage | **Light warm-up + wire i18n** | Warm the copy and route every string through `t()` (it is currently raw English). **No** form/auth restructure. |
| fr / sw | **English now, wired for later** | All new strings go through `t('ns.key', 'English default')`. Stage *names* reuse the already-localized `nav.*` keys. Full fr/sw feature-copy parity stays a separate wave-1.5 task. |

### 1.2 The teaching spine (authoritative — from `src/services/trustModel.ts`)

The trust copy must be **accurate** and **derived from the constants**, never hardcoded:

- `VERIFIED_THRESHOLD = 4`, `ONBOARDING_SEED = 2` (confirmed with Eston 2026-06-03, per the file header).
- Trust states: **Verified (≥4) · Vouched (1–3) · Unverified (0)**.
- `DEFAULT_STAGE_PERMISSIONS`: **Problem / Discussion / Proposals = `members`**, **Vote / Mandate = `verified`**.
- **One person, one vote** — rules gate *eligibility*, never vote *weight*.

→ The lesson the guide teaches: *"You're vouched by {ONBOARDING_SEED}. Problems, Discussion &
Proposals are open to you now. Reach {VERIFIED_THRESHOLD} vouches — Verified — to Vote and help set the
Mandate. One person, one vote, always."*

### 1.3 Workstream 2 — accessibility review

| Decision | Choice | Notes |
|----------|--------|-------|
| Method | **`design:accessibility-review` skill per flow** | Findings → one artifact → triage by **severity × effort** → fix in small commits. |
| Personas | **All five** | low-vision (200% zoom + contrast) · keyboard-only (focus order, visible focus, no traps) · screen-reader (roles/labels/live-regions/heading order) · low-bandwidth/basic-phone (360px integrity, image degradation) · multilingual (long-string overflow, RTL-readiness). |
| Flows (priority order) | onboarding (`/welcome` + new step + **LoginPage**) → stage feed (`/stage/:stageId` + cards + **new pointer**) → Stage 2 co-authoring (`DiscussionStageView`) → Stage 5 `MandateCard` (`MandatePage`) → initiative dashboard → community home → identity/**About** (+ new explainer) | Freshest/first-run surfaces first. |
| Output | **Findings doc → fixes** | Targeted fixes (labels, focus order, live-region announcements, contrast edge-cases, string-overflow). **No rewrites, no gold-plating.** Bring prioritized findings to Eston before any large-ish fix. |

### 1.4 Shared invariants (do not break)

- **Don't regress Batches 1–5** — especially the Batch 5 surfaces (Stage 2 co-authoring, Stage 5
  `MandateCard`) and the Batch 4 `StageGate` / `StageVariant = 'feed' | 'dashboard'` contract.
- **Seam only** — presentational + localStorage; never call a server from a component.
- **One person, one vote** — the teaching states it; nothing here introduces weight.
- **Content shows immediately** — the guide *invites*, never blocks; the stage-feed pointer is an
  inline dismissible hint, **not** a modal/overlay/wall.
- **Design system is law** — tokens only (no ad-hoc hex/px/rgba; derived `rgba($token, a)` OK), AA
  contrast, focus-visible on every control, ≥44px targets, light + `prefers-color-scheme: dark`,
  flagship **360px**. Strings via `t('ns.key', 'English default')`.

---

## 2. Architecture — seam & data layer

**No contract changes, no new seeded demo state → `DEMO_VERSION` stays `global-v4`** (`mockApi.ts`).
Everything in this batch is **presentational + localStorage**:

- **`HowGlokiWorks`** is pure/presentational. It imports the **`trustModel` constants**
  (`VERIFIED_THRESHOLD`, `ONBOARDING_SEED`, `PIPELINE_STAGES`) so the trust copy can never drift from
  the model. The `compact` variant takes the user's live vouch count via prop (the welcome step reads
  `agent?.vouchedBy.length` from the existing `useDigitalAgent`); the `full` variant is generic (no
  user) and explains the three states abstractly.
- **Stage names** reuse the existing, already-localized `nav.problem … nav.mandate` keys (these are in
  `en/fr/sw.ts` today, so the five stage labels render in French/Swahili even under English-now). The
  per-stage one-liners are **new** inline-default keys (English now).
- **Onboarding progress** uses the existing `digitalAgentStore` (`ONBOARDING_STEP_COUNT` 5 → 6,
  `OnboardingProgress.step` is a plain index). No migration: returning mid-flow users simply resume at
  their stored index; the `isOnboarded` short-circuit + "Start over" affordance cover the edge.
- **Stage-feed pointer dismissal** persists via a tiny localStorage flag
  (`src/components/onboarding/welcomeHints.ts`, mirroring `digitalAgentStore`'s pattern —
  `getHintSeen('stageFeedIntro')` / `markHintSeen(...)`). Not a Redux concern; not `preferencesSlice`
  (which is community starred/hidden).
- **i18n** — new strings via `t()` with inline English defaults; **LoginPage** strings migrate from raw
  literals to `t()` (same defaults, now translatable). No locale-file edits required this batch (full
  fr/sw parity deferred); a future wave can promote the inline defaults.

No `src/services/demo/` changes. No `demoRouter`/contract/fixture edits.

---

## 3. Workstream 1 — components & surfaces

### 3.1 `HowGlokiWorks` (new — `src/components/onboarding/HowGlokiWorks.tsx` + `.module.scss`)

The single source of truth for the pipeline + trust lesson. Props:
`{ variant: 'compact' | 'full'; vouchCount?: number }`. No server calls. Renders:

- **The pipeline strip** — the five `PIPELINE_STAGES`, each as **icon + `nav.*` name + one-line
  "what happens here"**, connected so the *order* reads as a journey (Problem → … → Mandate). Icons
  reuse the **StageFooter's** stage iconography (single source — import the same icon map, or lift a
  shared `STAGE_ICONS` map if one isn't already exported; confirmed at implementation).
- **Trust → what unlocks** — derived from the constants: "Problems, Discussion & Proposals are open to
  members. **Vote** & **Mandate** ask you to be **Verified** (vouched by {VERIFIED_THRESHOLD})." In
  `compact`, prefixed with the live "You're vouched by {vouchCount}" when provided. Always paired with
  the **one person, one vote** line.
- `compact` — tight, single-screen, for the welcome step (no headings beyond the section title; short
  one-liners). `full` — for About: richer per-stage descriptions + the three trust **states**
  (Unverified / Vouched / Verified) spelled out, + the "global direct democracy" framing sentence.

Any interactive element (e.g. an About-only "Join in" / stage links, if added) gets all states incl.
focus-visible and ≥44px. The compact variant is essentially static (no focus traps in the journey).

### 3.2 New welcome step — "How it works" (edit `OnboardingFlow.tsx`; new `steps/HowItWorksStep.tsx`)

- **Placement: step index 2** — `Invite(0) → Vouch(1) → **How it works(2)** → Agent(3) → Rules(4) →
  Ready(5)`. Rationale: *welcomed → trusted → here's what we do together → here's you → how we behave →
  go.* Context before the profile form.
- `HowItWorksStep` mirrors the existing step components (heading with `headingRef` `tabIndex={-1}` for
  the focus-on-change pattern, `styles.step` layout, `Continue`/`Back` `Button`s) and renders
  `<HowGlokiWorks variant="compact" vouchCount={agent?.vouchedBy.length ?? ONBOARDING_SEED} />`.
- `OnboardingFlow` wiring: add the step to the `steps` label array; add the `step === 2` case
  (`onBack → go(1)`, `onContinue → go(3)`); shift the Agent/Rules/Ready cases to indices 3/4/5; bump
  `ONBOARDING_STEP_COUNT` 5 → 6 in `digitalAgentStore`.
- **Stepper density:** six dots + labels at 360px is tight. Use a short label
  (`t('onboarding.step.how', 'How')`) and **verify the 6-dot Stepper at 360px** during Phase-1 verify;
  if cramped, fall back to the Stepper's compact rendering (dots + active-step label only). Flagged
  again under the low-bandwidth/360px persona in Phase 2.

### 3.3 About page (edit `src/components/identity/AboutPage.tsx`)

Keep a short intro line (what Gloki is — global direct democracy), then render
`<HowGlokiWorks variant="full" />`, then the closing "Every voice matters. Every vote counts." Replaces
the three thin paragraphs with the canonical, same-source explainer. Strings move to `t()` inline
defaults (AboutPage is currently raw English). `InfoPage.module.scss` layout reused; the explainer
brings its own module styles. The back button keeps its behaviour.

### 3.4 Stage-feed first-arrival pointer (edit `src/pages/StageFeedView.tsx`; new `welcomeHints.ts`)

One dismissible **`Banner`** (`tone="info"`, shared component — already AA + dismissible) at the top of
the stage feed, shown until dismissed: *"These five steps are how every idea travels — from spotting a
**Problem** to a community **Mandate**. You're on **{stage}**."* It points the eye at the StageFooter's
five-stage bar.

- **Inline, above the feed header — never a modal/overlay.** Content stays fully visible behind/around
  it (honors content-shows-immediately).
- Visibility: shown when `!getHintSeen('stageFeedIntro')`; the dismiss control calls
  `markHintSeen('stageFeedIntro')` (localStorage) → never shown again. Single, gentle — **not** a
  multi-step tour.
- a11y: `Banner`'s dismiss is a real button with an `aria-label` + focus-visible; the banner is keyboard
  reachable and does not steal focus.

### 3.5 LoginPage light warm-up + i18n (edit `src/pages/LoginPage.tsx`)

- **Wire every string through `t()`** with inline English defaults (header, subhead, the "How does this
  work?" toggle + help box, field labels + hints, placeholders, button, error titles/bodies).
- **Warm the copy** so the true first screen matches the inviting tone (friendlier subhead + field
  hints; the technical fields stay). **No** restructure of the form, the generate-key logic, or auth.
- Opportunistic, in-passing a11y wins while here (the formal audit confirms in Phase 2): give the
  icon-only **generate** button an `aria-label` via `t()` (it currently has only `title`); ensure the
  login error region is an `aria-live` status. Anything heavier is a Phase-2 finding.

---

## 4. Workstream 2 — accessibility review (method & scope)

> Runs **after** Workstream 1 is built + committed, so it audits the whole app **including** the new
> welcome guide, About explainer, stage-feed pointer, and warmed LoginPage.

### 4.1 Method

For each flow in priority order, drive an audit with the **`design:accessibility-review`** skill
against the running preview (light + dark + 360px). Collect every finding into **one artifact**
(`docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md`) with **severity × effort** and a
proposed fix. **Bring the prioritized list to Eston before any large-ish fix** so he sets the appetite;
then fix high/medium-severity, reasonable-effort items in **small commits**, and **flag** (don't
gold-plate) the long tail.

### 4.2 Personas (all five — what each checks)

| Persona | Checks |
|---------|--------|
| **Low-vision** | 200% zoom holds (no clipping/overlap); text & UI contrast meet AA (4.5:1 body / 3:1 large + components); not colour-alone. |
| **Keyboard-only** | Logical focus order; **visible** focus on every control; no traps (modals/menus/banners); skip-to-content where useful; Enter/Space/Esc behave. |
| **Screen-reader** | Correct roles/names; `aria-label` on icon-only controls; heading order (one `h1`/view); live-region announcements for async/state changes (votes, fold-ins, "Copied", step changes). |
| **Low-bandwidth / basic-phone** | 360px integrity (incl. the new **6-dot Stepper** and the pipeline strip); images degrade gracefully (data-saver); no layout collapse. |
| **Multilingual** | Long-string resilience (simulate ~30–40% longer); **RTL-readiness** scan (hardcoded `left/right`/`margin-left` vs logical properties — no RTL locale ships, flag blockers); confirm new strings are `t()`-wired (no stranded literals). **Not** a full fr/sw translation pass. |

### 4.3 Flows (priority order)

1. **Onboarding** — `/welcome` (all 6 steps, esp. the new "How it works") + **LoginPage**.
2. **Stage feed** — `/stage/:stageId` + each stage's feed card + the **new first-arrival pointer**.
3. **Stage 2 co-authoring** — `DiscussionStageView` (Batch 5: `SharedStatement` 1p1v fold-in,
   `PositionsBoard`, `ParticipationMeter`).
4. **Stage 5 `MandateCard`** — `MandatePage` (three signals, Share, journey arc).
5. **Initiative dashboard** — `InitiativeDashboard` (5-stage overview, inline flows, advance bar).
6. **Community home** — `CommunityView` activity feed + slide-out menu.
7. **Identity / About** — incl. the **new `HowGlokiWorks` full variant**.

### 4.4 Output

The findings doc (above), then the fixes themselves (finding-dependent — see §5). Expectation set by
Batches 1–5 already shipping tokens/dark/focus-visible/≥44px: **targeted** fixes, not a rewrite.

---

## 5. Files touched

**Workstream 1 — new:**
- `src/components/onboarding/HowGlokiWorks.tsx` + `.module.scss` (the shared explainer).
- `src/components/onboarding/steps/HowItWorksStep.tsx` (the new welcome step).
- `src/components/onboarding/welcomeHints.ts` (localStorage one-time-hint flag).

**Workstream 1 — edited:**
- `src/components/onboarding/OnboardingFlow.tsx` — insert step 2, shift cases, labels.
- `src/components/identity/agent/digitalAgentStore.ts` — `ONBOARDING_STEP_COUNT` 5 → 6.
- `src/components/identity/AboutPage.tsx` — intro + `<HowGlokiWorks variant="full" />`, strings → `t()`.
- `src/pages/StageFeedView.tsx` — the dismissible first-arrival `Banner` (inline, above the feed).
- `src/pages/LoginPage.tsx` (+ `.module.scss` only if a warmed layout needs it) — copy warm-up + `t()`
  wiring + the two in-passing a11y labels.
- `src/components/onboarding/steps/steps.module.scss` — any shared step styling the new step needs.

**Workstream 2 — new:**
- `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md` (the audit artifact).

**Workstream 2 — edited:** *finding-dependent; expect targeted edits* (labels, focus order,
live-regions, contrast tokens, string-overflow) across the audited surfaces. Enumerated in the
findings doc, then in a Phase-2 addendum to the plan once the audit runs.

**Leave untouched (no behaviour change):** the seam (`src/services/**`), `DEMO_VERSION`,
`trust.ts`/`trustModel.ts`/`useCommunityTrust`/`StageGate` (we *read* the trust constants, never change
the model), the Batch 5 component internals (unless an audit finding requires a targeted a11y fix),
the flow `registry`, `StageFooter` (we reuse its icons, not edit it).

---

## 6. Verification plan

**Gate (every task):** `npx tsc -b` exits 0 **and** `npm run build` exits 0 (prod build runs `tsc -b`);
preview renders the surface in **light + dark + 360px** with no `ErrorBoundary`/console errors; for
interactive changes, drive React with a **real** `preview_click`/`preview_fill` + short `await` then
`preview_snapshot` (no asserting from source); local commit made; **no push**.

**Phase 1 walk** (seed an identity via `/welcome`):
- **LoginPage** — warmed copy renders; switch locale → translated strings appear where keys exist;
  generate-key + Get Started still work.
- **`/welcome`** — all **6** steps; the new "How it works" step shows the pipeline strip + the accurate
  trust line ("vouched by 2 … 4 to Vote/Mandate"); Back/Continue and the focus-on-heading pattern work;
  **6-dot Stepper holds at 360px**.
- **`/identity/about`** — the `full` explainer renders (same content, deeper); three trust states legible.
- **`/stage/problem`** — the first-arrival `Banner` appears, content still visible behind it; dismiss →
  gone and **stays gone** on reload (localStorage); never blocks.

**Phase 2:** per-flow audit walk → findings doc → after fixes, re-walk each fixed surface against the
relevant persona (e.g. keyboard tab-through, 200% zoom, simulated long strings) with before/after
screenshots.

---

## 7. Commits (local only — Eston controls the push)

**Phase 1 — welcome guide:**
1. **Step 0** — `docs(spec)` this design doc (+ the plan doc).
2. **W1.1 — explainer** — `HowGlokiWorks` (compact + full) reading `trustModel` constants + `nav.*` names.
3. **W1.2 — welcome step** — `HowItWorksStep` + `OnboardingFlow` insert + `ONBOARDING_STEP_COUNT` 6.
4. **W1.3 — About** — render the `full` explainer; strings → `t()`.
5. **W1.4 — stage-feed pointer** — `welcomeHints` flag + the dismissible `Banner` in `StageFeedView`.
6. **W1.5 — LoginPage** — copy warm-up + i18n wiring + the in-passing labels.
7. **W1.6 — polish** — dark-mode + focus-visible + 360px sweep of the new surfaces.

**Phase 2 — a11y capstone:**
8. **W2.0 — audit** — `docs(a11y)` the findings doc (severity × effort). *Review gate with Eston.*
9. **W2.x — fixes** — small commits, grouped by surface/severity, per the agreed appetite.

**Do not push.**

## 8. Scope, simplifications & risks

- **In scope:** the welcome guide exactly as §1–§3; the five-persona audit + targeted fixes as §4.
- **Out of scope (YAGNI):** full fr/sw feature-copy parity (wave-1.5); a multi-step coachmark *tour*
  (one dismissible pointer only); LoginPage form/auth restructure; any seam/contract/fixture change;
  shipping an RTL locale (we only *check readiness*); rewriting Batch 5 surfaces (only targeted a11y
  fixes if the audit finds them).
- **Documented simplifications:** the stage-feed pointer is a one-time localStorage hint (not
  per-stage, not server-synced); inserting the welcome step doesn't migrate in-flight progress indices
  (acceptable on a UI-mock branch with Start-over); "multilingual" testing simulates long strings
  rather than translating.
- **Risks:** (1) **6-dot Stepper at 360px** may crowd — mitigation: short label + compact fallback,
  verified in Phase 1 and again under the 360px persona. (2) **Trust-copy drift** — mitigation: copy is
  interpolated from `trustModel` constants, never hardcoded. (3) **Phase-2 scope creep** — mitigation:
  triage by severity × effort, Eston sets the appetite before large fixes, flag the long tail. (4)
  **About strings → `t()`** must keep the same English text (no accidental copy change beyond the
  intended warm-up).
