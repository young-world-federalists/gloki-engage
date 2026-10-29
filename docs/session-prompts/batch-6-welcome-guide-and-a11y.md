# Session prompt — Batch 6: welcome-guide content pass + diverse-persona a11y reviews

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> Two workstreams, both **design-/audit-first** (the design is **not pre-decided** here):
> **(1) Welcome-guide content pass** — make first-run onboarding actually *teach* Gloki.
> **(2) Diverse-persona accessibility reviews** — WCAG 2.1 AA across the key flows.
> They can ship as one batch or split across sessions — let the plan decide. Part 2 is naturally the
> capstone (review the whole app *including* the new welcome guide), so consider doing 1 then 2.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read these — they define the
rules and the current state:**

- `CLAUDE.md`, `ARCHITECTURE.md` (the flows + the data-layer seam), `DESIGN_SYSTEM.md`.
- `src/App.tsx` routing (note `isFirstRun()` → `/welcome`, and the `/identity/*` About/Contact routes).

## What just shipped (Batch 5, live — don't break it)

Stage-UX redesigns A + B are deployed (`ui` HEAD `cf2029d`, Pages green). Touch with care:
- **Stage 2 is now a co-authoring space**, seam-backed: `discussionApi.ts` co-authoring method group +
  a **self-seeding** `demoContracts/discussion.ts` (`DEMO_VERSION` is now **`global-v4`**). Components:
  `flows/discussion/SharedStatement` (co-owned statement + **1p1v edit fold-in**), `PositionsBoard`
  (ranked country-tagged positions + `AnchoredThread`), `ParticipationMeter` (33% gate),
  `useDiscussionData` (the single seam read source). `CoAuthoringPanel` + `DeliberationThread` were
  **retired**. The full view is `DiscussionStageView` (it now `fetchCommunityMembers` on the deep-link
  route — don't remove that; the trust gate + meter denominator depend on it).
- **Stage 5 has a `MandateCard` hero** atop `MandatePage` — three never-conflated signals
  (Reach / Mandate / Conviction), a compact `JourneyRecap` variant, share + "read the full mandate".
  `StageFeedView` surfaces the read-only mandate link **outside** `StageGate`.
- **Invariants:** one person, one vote always; `StageGate` (Batch 4) wraps the stage flows in
  `StageFeedView` + `InitiativeDashboard` — viewing is always visible, actions gate on the per-stage
  trust rule. Keep the `StageVariant = 'feed' | 'dashboard'` contract.

## How we work (non-negotiable)

- **Process first.** Use **`superpowers:brainstorming`** with Eston to lock the design (welcome guide)
  / the audit scope + persona set (a11y) *before* code. Then **`superpowers:writing-plans`** → a concise
  spec in `docs/superpowers/specs/` + a step-by-step plan in `docs/superpowers/plans/` (mirror Batch 4/5
  format). **Get Eston's approval on the plan, then implement.** Don't pre-decide the design in this
  prompt — that's the brainstorm's job.
- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts`, backed by `src/services/demo/`. **Never** call a real server from a
  component. New mock data + contract methods go in `src/services/demo/`, version-gated by `DEMO_VERSION`
  in `mockApi.ts` (currently **`global-v4`** — bump only if you add/alter seeded demo data).
- **Design system is law.** Tokens from `src/styles/variables.scss` + the shared kit
  (`src/components/shared`: `Button`, `Card`, `Modal`, `Badge`, `TrustBadge`, `Banner`, `EmptyState`,
  `SegmentedControl`, `SlideOutMenu`, `CountryPresence`, `SearchableSelect`, …). **No ad-hoc
  hex/px/rgba** (derived `rgba($token, a)` is fine). AA contrast; every interactive control needs all
  states incl. **focus-visible** + a `prefers-color-scheme: dark` treatment; touch targets ≥44px;
  flagship width **360px**.
- **Strings** through i18n: `t('ns.key', 'English default')` (inline defaults — the codebase convention;
  locale-file promotion to `src/i18n/{en,fr,sw}.ts` is its own wave-1.5 task, *unless this batch is the
  one that does the fr+sw parity pass — decide in the plan*).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview (`preview_start({name:"gloki-dev"})`, port 5173). Light + dark + 360px, no
  ErrorBoundary/console errors. Show screenshots. (Judge "clean" by `tsc`/`build` exit codes + a live
  DOM check; drive React with a real click + a short `await` before asserting. Note: smooth
  `scrollIntoView` lands short *only in the headless preview harness* — verify scroll wiring with an
  instant scroll if needed; real browsers honor smooth.)
- **Commit locally** in small, clearly-described chunks (`Co-Authored-By` trailer). **Do NOT push** — a
  push to `origin/ui` auto-publishes to GitHub Pages; Eston controls the deploy. Hand back when verified;
  he says "push".
- **Product calls:** confirm with Eston via the question tool; don't re-litigate settled decisions
  (the trust model, the 5-stage pipeline, the seam, 1p1v, the Batch 5 redesigns).

## The two workstreams

### 1) Welcome-guide content pass

**Current state.** First-run onboarding is functional but thin:
- `src/App.tsx` — `isFirstRun()` routes new users to **`/welcome`**; the StageFooter is hidden on
  `/welcome/*`.
- `src/components/onboarding/OnboardingFlow.tsx` (+ `.module.scss`) — the `/welcome/*` journey: the
  identity-key step ("Generate a new identity key" → "Get Started"), the **"How does this work?"**
  toggle, the curated language picker (`ONBOARDING_LANGUAGES` in `src/services/demo/fixtures/identity.ts`),
  and the Digital Agent card. Visiting `/welcome` seeds the agent at **2 vouches** (pending, by design).
- `src/components/identity/AboutPage.tsx` — the About page (the longer "what is Gloki / the pipeline"
  explainer; per Eston, the 8-step/explainer language lives here, **not** behind an auth wall).

**Goal (refine in brainstorming).** Make the welcome journey *teach* a newcomer what Gloki is and how to
take part — global direct democracy, the 5-stage pipeline (Problem → Discussion → Proposals → Vote →
Mandate), web-of-trust verification (you start *pending* at 2 vouches; verified = ≥4), and one person,
one vote — without a wall of text. Mobile-first, low-bandwidth-friendly, legible across languages, warm
and inviting (not bureaucratic). Decide in the brainstorm: a guided multi-step intro, contextual
first-run coachmarks, a "how it works" explainer reused between `/welcome` and `AboutPage`, or a mix.
Respect the homepage-design decision (content shows immediately; the guide *invites*, never blocks).

### 2) Diverse-persona accessibility reviews

**Goal.** A WCAG 2.1 AA pass across the **key flows** through a set of **diverse personas**, then fix
what it finds. Use the **`design:accessibility-review`** skill to drive each audit.
- **Personas to walk** (confirm/adjust with Eston in the brainstorm): low-vision (zoom/contrast),
  keyboard-only (focus order + visible focus + no traps), screen-reader (roles/labels/live-regions/
  headings), low-bandwidth / basic-phone (works at 360px, no layout collapse, images degrade), and
  **multilingual** (English default + `fr` + `sw`, long-string overflow, RTL-readiness check).
- **Flows to cover** (priority order — confirm): onboarding (`/welcome`), the stage feed
  (`/stage/:stageId`) + each stage's feed card, an initiative dashboard, the **Stage 2 co-authoring
  space** + **Stage 5 MandateCard** (the new Batch 5 surfaces), the community home, and identity/About.
- **Output:** prioritized findings (severity × effort) → a plan → fixes committed in small chunks.
  Tokens/dark/focus-visible/≥44px are already broadly in place from Batches 1–5, so expect *targeted*
  fixes (labels, focus order, live-region announcements, contrast edge-cases, string-overflow), not a
  rewrite. Don't gold-plate.

## Demo facts you'll want

- Login is a UI-only mock: on `/welcome` click **"Generate a new identity key"** then **Get Started**
  (the generate button has `title="Generate a new identity key"`; Get Started is `button.login-button`).
  Visiting `/welcome` seeds the agent at **2 vouches** (pending).
- Seeded initiatives exist at **every** stage; community IDs are `demo-comm-…`, initiatives
  `demo-init-…`. The discussion hero is "Algorithmic Misinformation & Election Integrity" (Digital
  Rights Coalition); the mandate hero is "A Universal Climate Adaptation Fund" (Climate Resilience
  Assembly). Read IDs from `localStorage` keys `gloki_demo_state_demo-comm-*` or navigate via the UI.
  Seeding lives in `src/services/demo/seedDemoCommunity.ts`.
- Reach an initiative dashboard directly:
  `/initiative/<encoded serverUrl>/<encoded publicKey>/<communityId>/<initiativeId>/roadmap`; its
  discussion view swaps `/roadmap` → `/discussion`; the published mandate is
  `/mandate/<communityId>/<initiativeId>`.
- To make a pending user **verified** for gate testing: there's a "Meet a member (demo)" action (and QR
  scan) that `addUserVouch` — cross 2→4 and the Vote/Mandate gates unlock live.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px, and
  the a11y personas as applicable) for every changed surface.
- Spec + plan committed; implementation in small local commits (clear messages, `Co-Authored-By`
  trailer). **Do not push** — hand back to Eston with a brief report + anything broader than expected.

> **Roadmap after this:** with the welcome guide + a11y done, the redesign's core arc is complete —
> remaining work is launch-readiness polish + whatever Eston prioritizes next (e.g. the `ui → main`
> review PR with Ouri, or fr+sw multilingual parity if not folded in here).
