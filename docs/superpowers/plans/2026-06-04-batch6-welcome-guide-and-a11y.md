# Batch 6 — Welcome-guide + diverse-persona a11y Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, this session) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make first-run onboarding actually *teach* Gloki — add the missing 5-stage pipeline + trust→unlock mental model via one reusable explainer (welcome step + About + a gentle stage-feed pointer), warm up the LoginPage and wire it for i18n — then run a five-persona WCAG 2.1 AA capstone across the app (including the new guide) and fix what it finds.

**Architecture:** Pure UI + localStorage on the `ui` stub branch. One presentational `HowGlokiWorks` component (`variant: 'compact' | 'full'`) is the single source of the lesson; it reads the **`trustModel` constants** so the trust copy can never drift. It mounts in a new welcome step (index 2) and on the About page; a dismissible `Banner` (one-time localStorage hint) reinforces it on the stage feed. **No seam / contract / fixture changes → `DEMO_VERSION` stays `global-v4`.** Phase 2 is an audit: produce a findings doc, review the priorities with Eston, then commit targeted fixes.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. Verify with `npx tsc -b`, `npm run build`, and the Claude Preview MCP (light/dark/360px). **No unit-test framework** — this is the UI-only mock branch, so each task's acceptance is a real preview interaction, not a unit test.

**Spec (design source of truth):** [docs/superpowers/specs/2026-06-04-batch6-welcome-guide-and-a11y-design.md](../specs/2026-06-04-batch6-welcome-guide-and-a11y-design.md) — confirmed with Eston via the question tool 2026-06-04.

**Conventions (non-negotiable):**
- **Seam only / no demo changes:** components never call a server; **no** `src/services/**`, fixture, contract, or `DEMO_VERSION` edits this batch. We *read* `trustModel` constants; we never change the model.
- **One person, one vote:** the teaching states it; nothing here introduces vote weight.
- **Content shows immediately:** the guide invites, never blocks. The stage-feed pointer is an inline, dismissible `Banner` — never a modal/overlay/wall.
- **Don't regress Batches 1–5:** especially the Batch 5 Stage-2 co-authoring + Stage-5 `MandateCard`, and the Batch 4 `StageGate` / `StageVariant` contract.
- **Tokens only** (DESIGN_SYSTEM.md): no ad-hoc hex/px/rgba; derived `rgba($token, a)` OK. AA contrast; focus-visible on every control; ≥44px targets; light + `prefers-color-scheme: dark`; flagship **360px**.
- All strings via `t('ns.key', 'English default')`. Stage *names* reuse the already-localized `nav.*` keys.
- Commit locally per task; **never push** (Eston controls the push/deploy).

---

## Verification gate (GATE — referenced by every task)

A task is **done** only when:
1. `npx tsc -b` exits 0 (production build runs `tsc -b` — zero TS errors).
2. `npm run build` exits 0.
3. Preview renders the changed surface correctly in **light + dark + 360px**, no `ErrorBoundary` and no console errors (`preview_console_logs` / `preview_logs`).
4. For interactive changes: drive React with a **real** `preview_click`/`preview_fill`/`preview_eval` + short `await`, then `preview_snapshot` asserts the DOM actually changed (no asserting from source). Note: smooth `scrollIntoView` lands short *only in the headless harness* — verify scroll wiring with an instant scroll if needed.
5. Local commit made with the task's message. **No push.**

---

## File structure

**New (Phase 1):**
| File | Responsibility |
|------|----------------|
| `src/components/onboarding/HowGlokiWorks.tsx` + `.module.scss` | The single-source explainer. `variant: 'compact' \| 'full'`, optional `vouchCount`. Pipeline strip (5 stages, StageFooter icons, `nav.*` names, one-liner each) + trust→unlock block derived from `trustModel` constants + the 1p1v line. |
| `src/components/onboarding/steps/HowItWorksStep.tsx` | The new welcome step: heading (focus target) + `<HowGlokiWorks variant="compact" vouchCount=… />` + Continue/Back. Mirrors the existing step components. |
| `src/components/onboarding/welcomeHints.ts` | Tiny localStorage one-time-hint store: `getHintSeen(id)` / `markHintSeen(id)`. Mirrors `digitalAgentStore`'s try/catch persistence. |

**New (Phase 2):**
| File | Responsibility |
|------|----------------|
| `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md` | The audit artifact: a severity × effort findings table, per flow × persona. Drives the fix tasks. |

**Modified (Phase 1):**
| File | Change |
|------|--------|
| `src/components/onboarding/OnboardingFlow.tsx` | Insert the "How it works" step at index 2; remap the step switch (see the contract block); import `HowItWorksStep` + `ONBOARDING_SEED`. |
| `src/components/identity/agent/digitalAgentStore.ts` | `ONBOARDING_STEP_COUNT` `5` → `6` (one line). |
| `src/components/identity/AboutPage.tsx` | Short warmed intro (→ `t()`) + `<HowGlokiWorks variant="full" />` + closing; strings → `t()`. |
| `src/pages/StageFeedView.tsx` | Render the dismissible first-arrival `Banner` at the top of the feed (inline, above content), gated on `welcomeHints`. |
| `src/pages/LoginPage.tsx` (+ `.module.scss` only if a warmed layout needs it) | Warm the copy + route every string through `t()`; in-passing a11y (`aria-label` on the icon-only generate button; `aria-live` on the error region). No form/auth restructure. |
| `src/components/onboarding/steps/steps.module.scss` | Only if the new step needs a shared class not already present. |

**Leave untouched:** `src/services/**` (incl. `trustModel`/`trust`/`StageGate`/`mockApi` `DEMO_VERSION`), `StageFooter` (reuse its icons, don't edit), the flow `registry`, all Batch 5 component internals (unless a Phase-2 finding requires a targeted a11y fix), `useDigitalAgent`/`digitalAgentStore` beyond the one-line count bump.

---

## Cross-file contract (the type/API + copy anchor — locked here, consumed verbatim by the tasks)

Component **bodies/SCSS** are written at execution against just-in-time reads (no test framework; large UI/SCSS; slow-drive adaptation — same approach the Batch 5 plan used and defended). Everything that must stay **consistent across files** is fully specified below.

### C1 — `HowGlokiWorks` public API + internal stage meta

```ts
// src/components/onboarding/HowGlokiWorks.tsx
export interface HowGlokiWorksProps {
  variant: 'compact' | 'full';
  /** compact only — the user's live vouch count for the "you're vouched by N" line. */
  vouchCount?: number;
}

// internal — mirrors StageFooter's icons (StageFooter stays untouched; names stay single-source via nav.*)
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import {
  PIPELINE_STAGES, DEFAULT_STAGE_PERMISSIONS, VERIFIED_THRESHOLD, ONBOARDING_SEED,
} from '../../services/trustModel';

const STAGE_GUIDE = [
  { stage: 'problem',    icon: AlertCircle,   labelKey: 'nav.problem',    labelDefault: 'Problem',
    descKey: 'howGloki.problem.desc',    descDefault: 'Name a shared problem and rally support behind it.' },
  { stage: 'discussion', icon: MessageCircle, labelKey: 'nav.discussion', labelDefault: 'Discuss',
    descKey: 'howGloki.discussion.desc', descDefault: 'Co-author the community’s shared understanding of it.' },
  { stage: 'proposals',  icon: Lightbulb,     labelKey: 'nav.proposals',  labelDefault: 'Proposals',
    descKey: 'howGloki.proposals.desc',  descDefault: 'Put forward concrete solutions to weigh.' },
  { stage: 'vote',       icon: Vote,          labelKey: 'nav.vote',       labelDefault: 'Vote',
    descKey: 'howGloki.vote.desc',       descDefault: 'Decide together — one person, one vote.' },
  { stage: 'mandate',    icon: ScrollText,    labelKey: 'nav.mandate',    labelDefault: 'Mandate',
    descKey: 'howGloki.mandate.desc',    descDefault: 'Turn the decision into a shared mandate for action.' },
] as const;
// Order asserted === PIPELINE_STAGES (dev guard ok); "which stages need Verified" is DERIVED:
//   const verifiedStages = PIPELINE_STAGES.filter(s => DEFAULT_STAGE_PERMISSIONS[s] === 'verified'); // ['vote','mandate']
```

### C2 — `HowGlokiWorks` copy keys (English inline defaults; new `howGloki.*` namespace)

```ts
// shared by both variants
'howGloki.intro'         : 'Gloki is global direct democracy — communities decide what to do, together.'
'howGloki.pipelineTitle' : 'How an idea travels'
// 5 × stage one-liners → the descDefault strings in C1 (howGloki.<stage>.desc)
'howGloki.trustTitle'    : 'What you can do'
'howGloki.onePersonOneVote' : 'One person, one vote — always. No one can buy more say.'
// compact-only (uses the live count + constants):
'howGloki.trust.compact' : 'You’re vouched by {count}. {open} are open to you now. Reach {threshold} vouches to {gated}.'
//   {open}  = "Problem, Discuss & Proposals"  (joined nav names of the non-verified stages)
//   {gated} = "Vote and shape the Mandate"     (joined nav names of the verified stages, last-joined with "and shape the")
// full-only (the three states spelled out):
'howGloki.state.unverified' : 'Unverified (0 vouches) — you can read everything.'
'howGloki.state.vouched'    : 'Vouched (1–{threshold_minus_1}) — take part in Problem, Discussion & Proposals.'
'howGloki.state.verified'   : 'Verified ({threshold}+) — you can Vote and help set the Mandate.'
```
> Copy is **interpolated from constants** (`{count}=vouchCount`, `{threshold}=VERIFIED_THRESHOLD`, `{threshold_minus_1}=VERIFIED_THRESHOLD-1`), never hardcoded. Keep the exact English defaults above when wiring `t()`.

### C3 — `welcomeHints` API

```ts
// src/components/onboarding/welcomeHints.ts
export type WelcomeHintId = 'stageFeedIntro';
export function getHintSeen(id: WelcomeHintId): boolean;   // localStorage 'gloki.welcomeHints' → string[].includes(id); try/catch → false
export function markHintSeen(id: WelcomeHintId): void;     // append id (dedup), persist; try/catch swallow
```

### C4 — pointer copy keys

```ts
'howGloki.pointer.title' : 'How Gloki works'
'howGloki.pointer.body'  : 'These five steps are how every idea travels — from spotting a Problem to a community Mandate. You’re on {stage}.'
// {stage} = t(`nav.${stageId}`, <fallback>) for the current route param
// dismiss aria-label reuses common.dismiss ('Dismiss')
```

### C5 — `OnboardingFlow` step remap (exact — this is the correctness-critical edit)

Steps array becomes (insert index 2): `Invite(0) · Trust(1) · How(2) · You(3) · Rules(4) · Ready(5)`.
New label: `{ label: t('onboarding.step.how', 'How') }` inserted between `vouch` and `agent`.
The render switch becomes **exactly**:

```tsx
{step === 0 && <InviteStep headingRef={headingRef} voucher={voucher} onContinue={() => go(1)} />}
{step === 1 && (
  <VouchStep headingRef={headingRef} voucher={voucher} vouchCount={vouchCount} onBack={() => go(0)} onContinue={() => go(2)} />
)}
{step === 2 && (
  <HowItWorksStep
    headingRef={headingRef}
    vouchCount={agent?.vouchedBy.length ?? ONBOARDING_SEED}
    onBack={() => go(1)}
    onContinue={() => go(3)}
  />
)}
{step === 3 && (
  <AgentStep headingRef={headingRef} agent={agent} voucher={voucher}
    onBack={() => go(2)} onContinue={(fields) => { saveAgent(fields); go(4); }} onSkip={() => go(4)} />
)}
{step === 4 && (
  <RulesStep headingRef={headingRef} onBack={() => go(3)}
    onAgree={() => { saveAgent({ consentedAt: Date.now() }); go(5); }} onSkip={() => go(5)} />
)}
{step === 5 && (
  <ReadyStep headingRef={headingRef} agent={agent} consented={consented}
    onConsentNudge={() => go(4)}  /* ← was go(3); Rules moved 3→4 */
    onExplore={() => { saveProgress({ completed: true }); navigate('/stage/problem'); }}
    onViewAgent={() => { saveProgress({ completed: true }); navigate('/identity/profile'); }} />
)}
```
Add `import { ONBOARDING_SEED } from '../../services/trustModel';` and `import HowItWorksStep from './steps/HowItWorksStep';`. Bump `ONBOARDING_STEP_COUNT` 5 → 6 in `digitalAgentStore.ts`.

### C6 — `HowItWorksStep` API

```ts
// src/components/onboarding/steps/HowItWorksStep.tsx
interface Props {
  vouchCount: number;
  onContinue: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}
// Renders: <section styles.step> → <h1 styles.heading tabIndex={-1} ref={headingRef}>{t('onboarding.how.title','How Gloki works')}</h1>
//   → optional <p styles.lead>{t('onboarding.how.lead','Here’s how your community turns ideas into action.')}</p>
//   → <HowGlokiWorks variant="compact" vouchCount={vouchCount} />
//   → <div styles.actions>: <Button fullWidth size="lg" onClick={onContinue}>{t('common.continue','Continue')}</Button>
//        + <Button variant="ghost" fullWidth onClick={onBack}>{t('common.back','Back')}</Button>
```

---

## PHASE 1 — Welcome guide

### Task W1.1 — `HowGlokiWorks` explainer (compact + full)
**Files:** Create `src/components/onboarding/HowGlokiWorks.tsx` + `.module.scss`.
**Read first:** `src/services/trustModel.ts` (constants — confirm `VERIFIED_THRESHOLD`/`ONBOARDING_SEED`/`DEFAULT_STAGE_PERMISSIONS`/`PIPELINE_STAGES`); `src/components/onboarding/steps/steps.module.scss` (token-driven layout patterns to match: `.step`, `.heading`, `.lead`); `src/components/shared/index.ts` (if reusing `Card`/`Badge`).
- [ ] Build `HowGlokiWorks` per **C1/C2**: the pipeline strip (a vertical list of stage rows — `<stage.icon size=… aria-hidden/>` + `t(labelKey,labelDefault)` + `t(descKey,descDefault)`), connected visually so order reads as a journey; the trust block (`compact` → `howGloki.trust.compact` interpolated from `vouchCount` + constants + the joined open/gated nav names; `full` → the three `howGloki.state.*` lines); the `howGloki.onePersonOneVote` line; `full` also leads with `howGloki.intro`.
- [ ] SCSS (tokens only): the strip (icon chip + text), spacing scale, AA contrast in light + `prefers-color-scheme: dark`, holds at **360px**. No focus-able elements in `compact`; if `full` adds links, give them focus-visible + ≥44px.
- [ ] **GATE:** `tsc -b` + `build` clean (component compiles; first visual verify lands in W1.2/W1.3 where it mounts). Commit: `feat(welcome): HowGlokiWorks explainer — pipeline + trust→unlock, trustModel-derived (compact+full)`.

### Task W1.2 — New "How it works" welcome step + flow remap
**Files:** Create `src/components/onboarding/steps/HowItWorksStep.tsx`; modify `OnboardingFlow.tsx`, `digitalAgentStore.ts`.
**Read first:** `OnboardingFlow.tsx` (current switch); `steps/InviteStep.tsx` (the step pattern/classes); `digitalAgentStore.ts` (the count const).
- [ ] Create `HowItWorksStep` per **C6** (mirror `InviteStep`'s markup/classes + the `headingRef` focus pattern).
- [ ] `digitalAgentStore.ts`: `ONBOARDING_STEP_COUNT` `5` → `6`.
- [ ] `OnboardingFlow.tsx`: insert the `'How'` step label at index 2; replace the render switch with **C5** verbatim; add the two imports. Double-check `ReadyStep.onConsentNudge` is now `go(4)`.
- [ ] **GATE:** preview `/welcome` (seed identity first); real-click Continue through to **step 3 ("How")**; `preview_snapshot` shows the pipeline strip + the accurate trust line (`vouched by 2 … 4 to Vote & Mandate`); Back→Trust, Continue→You work; focus lands on the step heading; **6-dot Stepper holds at 360px** (if cramped, switch the `Stepper` to its compact/active-label rendering and note it); light + dark. Commit: `feat(welcome): add "How it works" step (index 2) — seeds the pipeline + trust model`.

### Task W1.3 — About page becomes the reference
**Files:** Modify `src/components/identity/AboutPage.tsx`.
**Read first:** `AboutPage.tsx` (current copy + `InfoPage.module.scss` classes: `.container`/`.backButton`/`.content`/`.title`/`.text`); confirm the About route in `IdentityView` (likely `/identity/about`).
- [ ] Route the title + intro + closing through `t()` (keep the meaning; warm the intro). Insert `<HowGlokiWorks variant="full" />` between the intro and the closing line. Keep the back button + container layout.
- [ ] **GATE:** preview the About page (via the slide-out menu's "About", or navigate `/identity/about`); `preview_snapshot` shows the full explainer (pipeline + three trust states + 1p1v); light + dark + 360px; back button still works. Commit: `feat(welcome): About page hosts the full HowGlokiWorks explainer`.

### Task W1.4 — Stage-feed first-arrival pointer
**Files:** Create `src/components/onboarding/welcomeHints.ts`; modify `src/pages/StageFeedView.tsx`.
**Read first:** `StageFeedView.tsx` (top-of-feed structure, the `stageId` route param, existing `t`/`Banner` imports); `src/components/shared/Banner.tsx` (API confirmed: `tone`/`title`/`children`/`onDismiss`/`dismissLabel`, `role="status"`).
- [ ] `welcomeHints.ts` per **C3** (localStorage `'gloki.welcomeHints'` → `string[]`, try/catch).
- [ ] `StageFeedView`: `const [showIntro, setShowIntro] = useState(() => !getHintSeen('stageFeedIntro'));` Render at the **top of the feed scroll region, above content** (not blocking): `showIntro && <Banner tone="info" onDismiss={() => { markHintSeen('stageFeedIntro'); setShowIntro(false); }} dismissLabel={t('common.dismiss','Dismiss')} title={t('howGloki.pointer.title','How Gloki works')}>{t('howGloki.pointer.body', <C4 default>, { stage: t(\`nav.${stageId}\`, <fallback>) })}</Banner>`.
- [ ] **GATE:** preview `/stage/problem` — banner shows with the right stage name, feed content still visible behind/around it (not blocked); real-click dismiss → gone; `preview_eval` reload → **stays gone** (localStorage); repeat at `/stage/vote` shows the right stage name only if not yet dismissed (it's a single one-time hint — confirm it does NOT reappear after dismiss). light + dark + 360px. Commit: `feat(welcome): one-time dismissible stage-feed pointer to the 5 stages`.

### Task W1.5 — LoginPage warm-up + i18n wiring
**Files:** Modify `src/pages/LoginPage.tsx` (+ `.module.scss` only if needed).
**Read first:** `LoginPage.tsx` (all literals; the icon-only generate button; the error block).
- [ ] `import { useT } from '../i18n';` Route **every** literal through `t()` with inline English defaults (header, subhead, help toggle "How does this work?"/"Hide details", the two help-box paragraphs, both field labels + hints, both placeholders, the "Get Started"/"Connecting…" button, error titles/descriptions/"Try Again"). Warm the subhead + hints (provide friendlier copy; keep the technical fields).
- [ ] In-passing a11y: add `aria-label={t('login.generate','Generate a new identity key')}` to the generate button (keep `title`); add `aria-live="polite"` to the login-error container so failures announce.
- [ ] **GATE:** see LoginPage by clearing auth (`preview_eval: localStorage.clear(); location.reload()`); warmed copy renders; switch locale via the switcher → `common.*` strings translate, new `login.*` stay English (expected under English-now); generate-key + Get Started still authenticate; light + dark + 360px. Commit: `feat(login): warm the first-screen copy + wire it through i18n`.

### Task W1.6 — Phase-1 polish sweep
**Files:** touch-ups in the new/edited SCSS as needed.
- [ ] Sweep `HowGlokiWorks`, `HowItWorksStep`, the pointer `Banner` usage, the About explainer, and LoginPage for every control state (hover / active / **focus-visible** / disabled) + dark + ≥44px + AA + **360px** — special attention to the **6-dot Stepper** and the **pipeline strip** at 360px.
- [ ] **GATE:** full light + dark + 360px walk of every Phase-1 surface (LoginPage → `/welcome` all 6 steps → About → `/stage/*` pointer), no console/`ErrorBoundary` errors; screenshots. Commit: `polish(batch6): welcome-guide dark-mode + focus-visible + 360px sweep`.

---

## PHASE 2 — Diverse-persona a11y capstone

> Runs after Phase 1 is committed. **Fix code is deliberately not pre-written** — fixes depend on findings that don't exist until the audit runs. The *method, findings schema, flow list, and review gate* are fully specified here; concrete fix tasks are appended after the review gate (same just-in-time discipline the Batch 5 plan used). This is not a placeholder — W2.0's steps are concrete and executable today.

### Task W2.0 — Run the five-persona audit per flow → findings doc → review gate
**Files:** Create `docs/superpowers/specs/2026-06-04-batch6-a11y-findings.md`.
**Findings schema (one row per issue):**
`| # | Flow | Persona | Severity (high/med/low) | Effort (S/M/L) | Issue (+ WCAG SC) | Proposed fix (file) | Status |`
**Personas each pass applies:** low-vision (200% zoom + AA contrast) · keyboard-only (focus order, visible focus, no traps) · screen-reader (roles/names, icon-only labels, heading order, live-regions) · low-bandwidth/basic-phone (360px integrity, image degradation) · multilingual (simulate ~30–40% longer strings via `preview_eval`; RTL-readiness scan for hardcoded `left/right` vs logical props; confirm new strings are `t()`-wired).
- [ ] Audit **onboarding** — `/welcome` (all 6 steps) + **LoginPage** (use `design:accessibility-review`); record rows.
- [ ] Audit **stage feed** — `/stage/:id` for each stage + the feed cards + the **new pointer**; record rows.
- [ ] Audit **Stage 2 co-authoring** — `DiscussionStageView` (`SharedStatement` 1p1v fold-in, `PositionsBoard`, `ParticipationMeter`); record rows.
- [ ] Audit **Stage 5 `MandateCard`** — `MandatePage` (three signals, Share "Copied" live-region, journey arc); record rows.
- [ ] Audit **initiative dashboard** — `InitiativeDashboard`; record rows.
- [ ] Audit **community home** — `CommunityView` feed + slide-out menu; record rows.
- [ ] Audit **identity / About** — incl. the new `HowGlokiWorks` full variant; record rows.
- [ ] Compile + triage by **severity × effort**; commit: `docs(a11y): Batch 6 five-persona findings (severity × effort)`.
- [ ] **REVIEW GATE:** present the prioritized findings to Eston; he sets the fix appetite (which severities/efforts to fix now vs flag). **Do not start large fixes before this.**

### Task W2.x — Targeted fixes (appended after the review gate)
- [ ] For each agreed finding: a concrete sub-task with exact file + the fix (label/`aria-*`, focus order, live-region, contrast token-pair, logical-property/overflow fix), each ending in a **GATE** (re-walk that surface against the relevant persona — keyboard tab-through, 200% zoom, or simulated long strings — with before/after screenshots) and a small commit grouped by surface/severity. Expect **targeted** fixes, not rewrites; **flag** (don't gold-plate) the long tail.

---

## Self-review (run against the spec before executing)

**1. Spec coverage:** §3.1 `HowGlokiWorks`→W1.1; §3.2 new step + count bump→W1.2; §3.3 About→W1.3; §3.4 pointer + `welcomeHints`→W1.4; §3.5 LoginPage→W1.5; design-system polish→W1.6; §4 audit method/personas/flows/output→W2.0; §4 fixes→W2.x; §2 "no `DEMO_VERSION`/seam change"→honored (no such task exists). **All §1–§4 spec items map to a task.** ✓
**2. Placeholder scan:** No "TBD/handle edge cases/similar to". Phase-1 tasks name exact files, exact reads, the locked contract (C1–C6) incl. real copy defaults, and a real-interaction acceptance check. Phase-2 fix *code* is intentionally generated post-audit (genuinely unknowable now) — stated, with W2.0 fully concrete. ✓
**3. Type consistency:** `HowGlokiWorksProps`/`STAGE_GUIDE`/`WelcomeHintId`/`getHintSeen`/`markHintSeen`/`HowItWorksStep` Props are defined once (C1/C3/C6) and consumed verbatim by W1.1–W1.4. The `OnboardingFlow` switch (C5) keeps every existing prop name (`onConsentNudge`, `onSkip`, `saveAgent`, `consented`, `vouchCount`) and only changes the `go(n)` targets + the `ReadyStep.onConsentNudge` 3→4. Stage names come from `nav.*` (shared); icons mirror `StageFooter`'s 5 lucide imports exactly. Copy interpolates `trustModel` constants — no drift. ✓

## Execution
Inline, this session (superpowers:executing-plans), W1.1 → W1.6 in order (GATE + local commit after each), then W2.0 → review gate → W2.x. **No push.** Component bodies/SCSS written just-in-time at each task head against the read-first list.
