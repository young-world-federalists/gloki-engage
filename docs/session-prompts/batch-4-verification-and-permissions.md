# Session prompt — Batch 4: verification UX (web-of-trust) & per-stage community permissions

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> Want a different focus this session? The roadmap also has **stage-UX redesigns**
> (discussion-as-co-authoring, mandate card), the **welcome guide**, and **diverse-persona a11y
> reviews** queued. The "How we work" section below applies to any of them — swap the Tasks if so.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read `CLAUDE.md`,
`ARCHITECTURE.md`, and `DESIGN_SYSTEM.md`** — they define the rules below.

## How we work (non-negotiable)

- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`),
  backed by `src/services/demo/`. **Never** call a real server from a component. New shared/mock data
  goes in `src/services/demo/` (fixtures + the demo contract handlers + `demoRouter`), version-gated by
  `DEMO_VERSION` in `mockApi.ts` so a reload re-seeds.
- **Design system is law.** Tokens from `src/styles/variables.scss` and the shared components in
  `src/components/shared` (`Button`, `Card`, `Modal`, `Badge`, `Banner`, `EmptyState`,
  `SegmentedControl`, `SlideOutMenu`, …). **No ad-hoc hex / px / rgba** in component styles — add a
  token first if one is missing (derived `rgba($token, a)` is fine; literal `rgba(…)` is not). Meet
  WCAG AA contrast. Every interactive control needs all states incl. **focus-visible** and a
  `prefers-color-scheme: dark` treatment; touch targets ≥ 44px.
- **Strings** go through i18n: `t('ns.key', 'English default')` (inline English default is fine).
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview. Dev server: `preview_start({name:"gloki-dev"})` (port 5173). Check light + dark
  + 360px-wide mobile + no console errors. Show screenshots. Note: the preview console buffer keeps
  stale HMR errors across reloads — judge "clean" by `tsc`/`build` exit codes + a live DOM check (no
  ErrorBoundary screen), and drive React state through a real click + a short `await` before asserting
  (clicks can race a reload/HMR).
- **Product-voice / model decisions go to Eston.** Where a task needs a product call (what counts as
  "verified", vouch thresholds, which per-stage permission options to offer), **propose a
  recommendation and confirm with Eston** (use the question tool) before applying — don't guess
  silently. Document the decision in a code comment.
- **Commit locally** in small, clearly-described chunks (one per task). **Do NOT push** — Eston
  controls the deploy (a push to `origin/ui` auto-publishes to GitHub Pages). When everything is
  verified, hand back and let him say "push".

## What's already done (context)

Live at `young-world-federalists.github.io/gloki-engage/` (`ui` HEAD ~`bf55268`).

- **Batch 1** — 4 globally diverse demo communities, 8 initiatives across all 5 stages, 16 personas, a
  global mandate (seed: `src/services/demo/seedDemoCommunity.ts`, version-gated in `mockApi.ts`).
  Shared **`SegmentedControl`**; cross-community **`HomeView`** at `/` + shared **`useAllInitiatives`**
  hook (consumed by Home and `StageFeedView` — don't duplicate the aggregation).
- **Batch 2** — design-system consistency sweep; Home polish (starred-first, relative time via
  `src/utils/formatTimeAgo.ts`); "hide empty sections, never mix real + sample" rule.
- **Batch 3** — **One menu model:** shared **`SlideOutMenu`** (`src/components/shared`) backs both the
  global menu (`HomepageMenu`) and the community menu (`CommunityView`) — reuse it for any slide-out.
  **Promoted "Start an initiative"** (one verb, via i18n) with a prominent CTA on `CommunityHome`.
  **Vocabulary locked (confirmed by Eston):** an *initiative* is the whole effort that travels the 5
  stages; a *problem* is its **Stage-1 founding statement** — documented atop `CreateInitiativePage.tsx`;
  keep all copy consistent with it. **Demo profile flow now works:** the demo serves member profiles
  (`demoContracts/profile.ts` + community `get_partners`), so `state.communities.profiles` populates →
  real author names, member counts, and country participation. Removed dead components (ActivityHub,
  InitiativeList, legacy create dialogs).

Reuse, don't re-roll: `SlideOutMenu`, `SegmentedControl`, `Button`, `Card`, `Modal`, `Banner`,
`EmptyState`, `Badge`, `RoleChip`/`RoleDisplay`, `useAllInitiatives`, `formatTimeAgo`,
`preferencesSlice`. **Existing verification/trust pieces to build on (audit these first):**
`src/components/community/IdentityTrust.tsx` (QR identity, ID cards), the onboarding flow
`src/components/onboarding/OnboardingFlow.tsx` + steps (`VouchStep`, `InviteStep`, `RulesStep`,
`AgentStep`, `ReadyStep`) at `/welcome`, the vouch fixtures in `src/services/demo/fixtures/identity.ts`
(`getVoucher`, `defaultVouchers`, `INVITE_CODES`), and the existing "Requires membership in a web of
trust community" banner in `StageFeedView.tsx`.

## Your tasks (Batch 4)

> Theme: make Gloki's **web-of-trust** real in the UI (mocked through the seam) and let communities
> **govern participation per stage**, so "who may take part, and on what basis" is legible everywhere.
> Voting must stay one-person-one-vote — never plutocratic.

### Step 0 — audit + decide the model (do this first, before building)

1. **Audit** the verification/trust + permission surfaces listed above and write down what already
   exists vs. what's missing. Don't duplicate onboarding's vouch logic — extend it.
2. **Propose the model to Eston and confirm** (this is a product call he owns — mirror how the Batch-3
   vocabulary decision was handled):
   - What makes a member **"verified"** in a web of trust (e.g. vouched by ≥ N existing members)? Pick
     a default N and a clear visual for verified / pending / unverified.
   - What **per-stage permission** options should a community offer (e.g. *anyone · members · verified
     members*), and what are the sensible defaults per stage (Problem → Mandate)?
   Document the agreed model in a code comment near where it's enforced.

### V1 — Web-of-trust verification, made visible

- Mock the web of trust in the **demo/seam layer** (who vouches for whom — extend
  `fixtures/identity.ts` + the community demo contract; version-bump `DEMO_VERSION`). Expose it through
  a service helper, not direct component reads.
- Surface each member's trust state consistently with a shared affordance (a `Badge` / new
  `TrustBadge`): "verified", "vouched by N", or "unverified". Use it on the Members list, author chips
  on cards (Home / stage feed / `CommunityHome`), and identity surfaces. **Don't rely on colour
  alone** — pair with an icon/label; meet AA.

### V2 — Per-stage community permission settings

- A community **settings** surface (admin-facing) where each pipeline stage's participation rule is
  set (per the model confirmed in Step 0). Persist via the community contract through the seam — store
  a `stage_permissions` blob (`contractWrite`) and read it back (`contractRead`); add the demo handler
  in `demoContracts/community.ts`. Reach it from the unified community `SlideOutMenu`.
- Keep it mobile-first and tokenised; reuse `SegmentedControl` for the per-stage rule picker.

### V3 — Enforce the gate with friendly, non-dead-end states

- In the stage flows / `StageFeedView`, when the current user doesn't meet a stage's rule, replace the
  raw banner with a clear **blocked state** (`Banner`/`EmptyState`) explaining *why* and offering the
  path forward — a link into the vouch/verify flow (`/welcome` or `IdentityTrust`). Never a silent dead
  end. Read-only viewing should still work where appropriate.
- Make the existing "Requires membership in a web of trust community" copy reflect the *actual*
  per-stage rule.

For every surface you change, screenshot before/after in light + dark + 360px.

> **Not this batch** (later): stage-UX redesigns (discussion-as-co-authoring, mandate card), the
> welcome-guide content pass, and diverse-persona a11y reviews. Stay scoped to Step 0 + V1–V3.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px).
- Commit Step 0 (if it produces code), V1, V2, V3 as separate local commits (clear messages).
  **Do not push.**
- Briefly report what changed (call out anything broader than expected, like Batch 3's profile-flow
  fix turning out demo-wide) and hand back to Eston for review.
