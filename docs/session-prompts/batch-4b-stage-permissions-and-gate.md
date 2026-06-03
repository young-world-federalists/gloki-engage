# Session prompt — Batch 4b: per-stage permission settings (V2) & friendly gate + vouch loop (V3)

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> This is the **second half of Batch 4**. The first half (Step 0 + **V1: web-of-trust verification
> made visible**) is **shipped and live**. This session implements **V2** and **V3** from the same,
> already-approved spec and plan. Don't re-litigate the model — it's locked (see below).

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read these — they define
everything below:**

- `CLAUDE.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md` (the rules).
- **The approved spec:** `docs/superpowers/specs/2026-06-03-web-of-trust-permissions-design.md`
- **The step-by-step plan (with full code):**
  `docs/superpowers/plans/2026-06-03-web-of-trust-permissions.md` — your tasks this session are
  **Task 9–10 (V2)** and **Task 11–14 (V3)**. The plan contains the actual code for `StageGate`,
  `CommunitySettings`, and the wiring; follow it.

## How we work (non-negotiable)

- **Branch + seam:** Develop on `ui` against the **stub layer** only. Every component reads/writes
  through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`),
  backed by `src/services/demo/`. **Never** call a real server from a component. New mock data goes in
  `src/services/demo/`, version-gated by `DEMO_VERSION` in `mockApi.ts` (currently **`global-v3`** —
  only bump again if you add new seeded demo data).
- **Design system is law.** Tokens from `src/styles/variables.scss` + the shared kit
  (`src/components/shared`: `Button`, `Card`, `Modal`, `Badge`, **`TrustBadge`** (new in V1), `Banner`,
  `EmptyState`, `SegmentedControl`, `SlideOutMenu`, …). **No ad-hoc hex/px/rgba** (derived
  `rgba($token, a)` is fine; literal `rgba(…)` is not). AA contrast; every interactive control needs
  all states incl. **focus-visible** and a `prefers-color-scheme: dark` treatment; touch targets ≥44px.
- **Strings** go through i18n: `t('ns.key', 'English default')`.
- **Verify before "done":** `npx tsc -b` clean **and** `npm run build` clean, then walk the routes in
  the browser preview. Dev server: `preview_start({name:"gloki-dev"})` (port 5173). Check light + dark
  + 360px + no ErrorBoundary. Show screenshots. (Preview console keeps stale HMR errors across reloads —
  judge "clean" by `tsc`/`build` exit codes + a live DOM check, and drive React state with a real
  click + a short `await` before asserting.)
- **Commit locally** in small, clearly-described chunks (V2 = one commit, V3 = one commit). **Do NOT
  push** — Eston controls the deploy (a push to `origin/ui` auto-publishes to GitHub Pages). Hand back
  when verified.
- **Product-voice / model calls already made** — don't re-ask. If something new comes up, propose +
  confirm with Eston via the question tool.

## The locked model (confirmed by Eston — do not change)

- **Trust (per community):** **Verified** = vouched by **≥ 4** community members · **Vouched (pending)**
  = 1–3 · **Unverified** = 0. Onboarding seeds **2** (a fresh user is *pending*). Lives in
  `src/services/trustModel.ts` (`VERIFIED_THRESHOLD = 4`).
- **Permission levels:** **Anyone · Members · Verified members**.
- **Default per-stage rules:** Problem · Discussion · Proposals → **Members**; Vote · Mandate →
  **Verified members** (`DEFAULT_STAGE_PERMISSIONS` in `trustModel.ts`).
- **One person, one vote — always.** Permissions gate *eligibility to act*, never vote *weight*.
  Documented next to `canParticipate` in `trustModel.ts`.

## What V1 already shipped (build on it — don't rebuild)

Live now. Reuse these; they're done and committed:

- **`src/services/trustModel.ts`** — pure model (types, thresholds, `resolveTrustState`,
  `canParticipate`, `DEFAULT_STAGE_PERMISSIONS`, `PIPELINE_STAGES`, `STAGE_RULES`). Zero imports.
- **`src/services/trust.ts`** — seam wrappers `getCommunityVouches`, **`getStagePermissions`**,
  **`setStagePermissions`**, `addUserVouch`; re-exports the model.
- **`src/hooks/useCommunityTrust.ts`** — `{ trustOf, vouchCountOf, isMember, ruleFor,
  canCurrentUserParticipate, currentUserTrust, currentUserVouchCount, isReady }` for a community.
  **V2 and V3 both consume this** (V2 needs `ruleFor` / persistence; V3 needs `canCurrentUserParticipate`).
- **`src/components/shared/TrustBadge.tsx`** (in the shared barrel) — `state` + `vouchCount` + `size`.
- **Seam handlers** in `src/services/demo/demoContracts/community.ts`: `get_vouches`,
  **`get_stage_permissions`** (default-merged), **`set_stage_permissions`** — already implemented, so
  V2's persistence target exists.
- **Surfaces with badges:** Members, author chips (`StageFeedView` — note it now renders a
  **`StageFeedCard`** subcomponent that already calls `useCommunityTrust`; wrap *its* inline flow in
  `StageGate` for V3 — `HomeView` / `CommunityHome`), and an IdentityTrust **"Your verification"**
  panel.

## Your tasks this session

### V2 — Per-stage community permission settings (plan Tasks 9–10)

- New **`src/components/community/CommunitySettings.tsx`** (+ `.module.scss`): a `SegmentedControl`
  per stage (Anyone · Members · Verified), reads via `getStagePermissions`, persists via
  `setStagePermissions` (optimistic + rollback), reinforces 1-person-1-vote in copy, notes it's an
  admin surface (in the demo, current user = admin). Mobile-first, tokens only.
- Wire it into **`src/pages/CommunityView.tsx`**: a `Settings` item in the community `SlideOutMenu`
  `menuItems` + a `<Route path="settings" …>` (lazy, like the other community routes).
- **Verify:** open the community menu → Settings → change Vote `members`→`verified`, reload the route,
  it persists. Light + dark + 360px (3 segments fit). Screenshot. **Commit V2.**

### V3 — Enforce the gate (friendly, no dead ends) + close the 2→4 loop (plan Tasks 11–14)

- New **`src/components/community/StageGate.tsx`**: wraps a stage's inline flow. When
  `canCurrentUserParticipate(stage)` is false, render a `Banner` explaining the *actual* rule + a
  `Button` to the fix path (Verified-gated → IdentityTrust "Get verified"; Members-gated & non-member
  → `/welcome`). **Read-only content stays visible — never a blank/dead card.** Full code is in the plan.
- **Enforce at both call sites:** wrap the inline flow in `StageFeedCard` (inside `StageFeedView.tsx`)
  and the ACTIVE-stage participation block in **`InitiativeDashboard.tsx`** (`communityId` is already a
  prop). Fix the stale `vote` `thresholdBanner` copy in `StageFeedView` to reflect the real rule.
- **Close the loop (Eston said yes):** wire **`QRScannerDialog.tsx`** so a successful scan of a real
  member calls `addUserVouch(agent)`, **and** add a testable **"Meet a member (demo)"** button to the
  IdentityTrust "Your verification" panel that calls `addUserVouch` for a not-yet-voucher member — so a
  pending user can cross **2 → 4**, flip to **Verified**, and watch the Vote/Mandate `StageGate`s
  unlock live (the QR camera isn't exercisable in the preview, so the button is what you screenshot).
- **Verify:** as a pending user, a Verified-gated stage (Vote/Mandate) shows the blocked `Banner` +
  read-only tally; "Meet a member" twice → Verified → the same stage now renders the flow. Light + dark
  + 360px. Screenshots: blocked → verified → unlocked. **Commit V3.**

## Demo facts you'll want

- Login is a UI-only mock: on the welcome screen click the **"Generate a new identity key"** button
  (title attr) then **Get Started** — no real credentials. Visiting `/welcome` seeds the agent at
  **2 vouches** (pending).
- Seeded community IDs look like `demo-comm-…`; you can read them from `localStorage` keys
  `gloki_demo_state_demo-comm-*`, or just navigate via the UI (Identity → Communities).
- The current (demo) user is **pending at 2** in every community by design — that's what makes the V3
  gate demonstrable.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px) for
  every changed surface.
- **V2** and **V3** committed as **separate local commits** (clear messages, `Co-Authored-By` trailer).
  **Do not push** — hand back to Eston and let him say "push".
- Briefly report what changed. With V2 + V3, **all of Batch 4 (Step 0 + V1–V3) is complete** — note
  that, and flag anything broader than expected.

> **Roadmap after this (later sessions, not now):** stage-UX redesigns (discussion-as-co-authoring,
> mandate card), the welcome-guide content pass, and diverse-persona a11y reviews.
