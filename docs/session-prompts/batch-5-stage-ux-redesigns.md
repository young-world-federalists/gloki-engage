# Session prompt — Batch 5: stage-UX redesigns (discussion-as-co-authoring + mandate card)

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> This is a **design-first** batch. Unlike Batch 4 (which arrived with an approved spec + plan), the
> design here is **not yet decided**. Start with **brainstorming**, write a **spec + plan**, get
> Eston's sign-off, *then* implement. Two redesigns are in scope:
> **(A) Discussion-as-co-authoring** and **(B) the Mandate card.** They can ship as one batch or split
> across sessions — let the plan decide.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read these — they define the
rules and the current state:**

- `CLAUDE.md`, `ARCHITECTURE.md` (the 8 flows + the data-layer seam), `DESIGN_SYSTEM.md`.
- The two stages you're redesigning (current state below) and their flows.
- **What just shipped (Batch 4, live):** the web-of-trust model + per-stage permissions. The pure model
  is `src/services/trustModel.ts`; the seam is `src/services/trust.ts`; the hook is
  `src/hooks/useCommunityTrust.ts`; **`src/components/community/StageGate.tsx` now wraps the stage flows
  in both `StageFeedView` and `InitiativeDashboard`.** Do **not** break the gate or the variant pattern
  when you redesign these stages — your new UI renders *inside* the StageGate, which already handles the
  blocked/allowed states. One person, one vote — always; permissions gate eligibility, never weight.

## How we work (non-negotiable)

- **Process first.** Use **`superpowers:brainstorming`** with Eston to lock the design for each redesign
  *before* any code. Then **`superpowers:writing-plans`** → a concise spec in
  `docs/superpowers/specs/` and a step-by-step plan in `docs/superpowers/plans/` (mirror Batch 4's
  format). **Get Eston's approval on the plan, then implement.** Don't pre-decide the design in this
  prompt — that's the brainstorm's job.
- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), backed
  by `src/services/demo/`. **Never** call a real server from a component. New mock data + any new
  contract methods go in `src/services/demo/`, version-gated by `DEMO_VERSION` in `mockApi.ts`
  (currently **`global-v3`** — bump only if you add/alter seeded demo data).
- **Design system is law.** Tokens from `src/styles/variables.scss` + the shared kit
  (`src/components/shared`: `Button`, `Card`, `Modal`, `Badge`, `TrustBadge`, `Banner`, `EmptyState`,
  `SegmentedControl`, `SlideOutMenu`, …). **No ad-hoc hex/px/rgba** (derived `rgba($token, a)` is fine).
  AA contrast; every interactive control needs all states incl. **focus-visible** + a
  `prefers-color-scheme: dark` treatment; touch targets ≥44px; flagship width **360px**.
- **Strings** go through i18n: `t('ns.key', 'English default')` (inline defaults; only Lane F edits
  `src/i18n/`).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview (`preview_start({name:"gloki-dev"})`, port 5173). Light + dark + 360px, no
  ErrorBoundary. Show screenshots. (Preview console keeps stale HMR errors across reloads — judge
  "clean" by `tsc`/`build` exit codes + a live DOM check, and drive React state with a real click + a
  short `await` before asserting.)
- **Commit locally** in small, clearly-described chunks. **Do NOT push** — a push to `origin/ui`
  auto-publishes to GitHub Pages, and Eston controls the deploy. Hand back when verified; he says "push".
- **Product calls:** confirm with Eston via the question tool when something new comes up; don't
  re-litigate decisions already made (the trust model, the 5-stage pipeline, the seam, 1p1v).

## The two redesigns

### A) Discussion-as-co-authoring (Stage 2)

**Current state.** Stage 2 is presence + threaded comments, not authoring:
- `src/components/stages/DiscussionStage.tsx` — feed variant = a `CoPresenceBar` teaser + "tap to join";
  dashboard variant = co-presence bar + a 33%-contribution hint + a "Join the discussion" button that
  routes to the full view.
- `src/components/collaboration/DiscussionStageView.tsx` — the full discussion route
  (`/initiative/:host/:agent/:communityId/:initiativeId/discussion`).
- `src/components/collaboration/flows/discussion/` — `DiscussionFlow`, `DeliberationThread` (threaded
  comments), `CoPresenceBar`, and the seam `discussionApi.ts`.

**Goal (to refine in brainstorming).** Make Stage 2 about a community **co-authoring a shared
understanding of the problem / its positions** — a living, collaboratively-edited statement (with
attribution, suggestions, maybe country-tagged perspectives) — rather than (or alongside) a flat comment
thread. Think Google-Docs-suggestions / collaborative-brief energy, mobile-first, low-bandwidth-friendly,
and legible across languages. The 33%-participation threshold and the co-presence motif should survive in
some form. Decide in the brainstorm: full replacement vs. a co-authoring surface layered on the thread.

**Seam.** New collaborative-doc behaviour is mocked through `discussionApi.ts` + a demo contract in
`src/services/demo/` (new methods, version-gated). No real server.

### B) The Mandate card (Stage 5)

**Current state.** Stage 5 is conviction staking + a link out to a document:
- `src/components/stages/MandateStage.tsx` — `ConvictionStaking` (compact in feed, full in dashboard);
  the feed links to the published mandate at `/mandate/:communityId/:initiativeId`.
- `src/components/mandate/` — `MandatePage`, `MandateDocument` (the published artifact),
  `JourneyRecap` (the pipeline arc, shown on the dashboard), `AdoptionFramework`.

**Goal (to refine in brainstorming).** Turn the published mandate into a **shareable "mandate card"** —
a scannable, social-shareable artifact that captures *what the community decided*, the *winning
proposal*, the *conviction behind it*, and the *journey* (problem → vote → mandate), with the
transnational/web-of-trust signal legible. Consider: a card people can screenshot/share, the relationship
between the card and the fuller `MandateDocument`, and how it reuses `JourneyRecap`. Mobile-first;
light + dark.

**Constraint for both.** The stage components are **lane-owned** and rendered in two variants
(`StageVariant = 'feed' | 'dashboard'`, `src/types/initiative.ts`) by `StageFeedView` (compact card) and
`InitiativeDashboard` (expanded). Keep the variant contract; your flow renders inside `StageGate`.

## Demo facts you'll want

- Login is a UI-only mock: on `/welcome` click **"Generate a new identity key"** then **Get Started**.
  Visiting `/welcome` seeds the agent at **2 vouches** (pending, by design).
- Seeded initiatives exist at **every** stage. Examples: a **discussion**-stage initiative
  `demo-init-mpy474wh-5q545sfe`; a **mandate**-stage initiative `demo-init-mpy474wl-bgwwwil3` (in
  "Climate Resilience Assembly", `demo-comm-mpy474wj-lka04q9y`). Seeded community IDs are
  `demo-comm-…`; read them from `localStorage` keys `gloki_demo_state_demo-comm-*` or navigate via the
  UI (Identity → Communities). Seeding lives in `src/services/demo/seedDemoCommunity.ts`.
- To reach an initiative dashboard directly:
  `/initiative/<encoded serverUrl>/<encoded publicKey>/<communityId>/<initiativeId>/roadmap`.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px) for
  every changed surface; check both the **feed** card and the **dashboard** rendering of each redesigned
  stage, and that the **StageGate** still gates them correctly (pending vs. verified).
- Spec + plan committed; implementation committed in small local commits (clear messages,
  `Co-Authored-By` trailer). **Do not push** — hand back to Eston.
- Briefly report what changed and flag anything broader than expected.

> **Roadmap after this (later batches):** the welcome-guide content pass, and diverse-persona a11y
> reviews (WCAG 2.1 AA across the key flows, through low-vision / keyboard-only / screen-reader /
> low-bandwidth / fr+sw personas).
