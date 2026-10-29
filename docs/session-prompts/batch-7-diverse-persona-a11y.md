# Session prompt — Batch 7: diverse-persona accessibility capstone (Batch 6 Phase 2)

Paste this whole file into a fresh Claude Code session on the `ui` branch.

> **Audit-first, not design-first.** This is **Phase 2** of Batch 6. Phase 1 (the welcome guide) shipped
> and is live. The a11y scope is **already locked** in a committed spec + plan — so do **not** re-run a
> full brainstorm. Read the spec/plan, do a *quick* confirm-or-adjust with Eston if anything looks stale,
> then **execute the audit → write the findings doc → bring the prioritized list to Eston (review gate)
> → commit targeted fixes**. A WCAG 2.1 AA pass across the key flows through 5 diverse personas.

---

You are continuing the Gloki UI overhaul on the **`ui`** branch. **First, read these — they define the
rules, the locked scope, and the current state:**

- `CLAUDE.md`, `ARCHITECTURE.md` (flows + the data-layer seam), `DESIGN_SYSTEM.md`.
- **The Batch 6 spec — §4 is the a11y scope:** `docs/superpowers/specs/2026-06-04-batch6-welcome-guide-and-a11y-design.md`.
- **The Batch 6 plan — Phase 2 is `W2.0` (audit) + `W2.x` (fixes):** `docs/superpowers/plans/2026-06-04-batch6-welcome-guide-and-a11y.md`.
- `src/App.tsx` routing (`isFirstRun()` → `/welcome`; `/identity/*` About/Contact; `/stage/:stageId`).

## What just shipped (Batch 6 Phase 1 — welcome guide, live — don't break it)

Deployed to Pages at `ui` HEAD `e1cfb20`. These are **new surfaces the audit must cover**:
- **`HowGlokiWorks`** (`src/components/onboarding/HowGlokiWorks.tsx`) — one explainer, `variant:'compact'|'full'`,
  trust copy **derived from `trustModel` constants** (`VERIFIED_THRESHOLD=4`, `ONBOARDING_SEED=2`). Renders
  the 5-stage pipeline strip (reuses StageFooter's lucide icons + the localized `nav.*` names) + a
  trust→unlock block + the one-person-one-vote line.
- **New `/welcome` step at index 2** ("How it works") — journey is now `Invite→Vouch→How→You→Rules→Ready`
  (`ONBOARDING_STEP_COUNT=6`; the Stepper shows **6 dots** and holds at 360px). Renders `<HowGlokiWorks compact>`.
- **About page** (`src/components/identity/AboutPage.tsx`) renders `<HowGlokiWorks full>` (3 trust states spelled out).
- **One-time stage-feed pointer** — a dismissible `Banner` at the top of `/stage/:stageId`, gated on
  `welcomeHints.ts` (`localStorage 'gloki.welcomeHints'`). Inline, never blocks.
- **LoginPage** warmed + fully `t()`-wired (was raw English); `aria-label` on the icon-only generate
  button; `role="alert"` on the error region; dark-mode for the help box + generate button.
- **Invariant:** all of the above is presentational + localStorage. **No seam/contract/fixture changes;
  `DEMO_VERSION` stays `global-v4`.** Don't regress the Batch 4 `StageGate` / Batch 5 Stage-2/Stage-5 work.

## How we work (non-negotiable)

- **Process:** the audit scope (personas, flows, method, output) is **already specced** (§4) and planned
  (`W2.0`/`W2.x`). Skip a fresh `superpowers:brainstorming`; instead read the spec/plan and run a *short*
  confirm with Eston (question tool) only if something is stale. Then drive each audit with the
  **`design:accessibility-review`** skill. Findings → one artifact → **review gate with Eston** → fixes.
- **Branch + seam:** Develop on `ui` against the **stub layer** only; everything through
  `src/services/api.ts` / `src/services/demo/`. **Never** call a real server from a component. This batch
  should need **no** seam/fixture/`DEMO_VERSION` changes (a11y fixes are UI-level).
- **Design system is law.** Tokens from `src/styles/variables.scss` + the shared kit
  (`Button`, `Card`, `Modal`, `Badge`, `TrustBadge`, `Banner`, `EmptyState`, `SegmentedControl`,
  `SlideOutMenu`, `CountryPresence`, `SearchableSelect`, …). **No ad-hoc hex/px/rgba** (derived
  `rgba($token, a)` is fine). AA contrast; focus-visible on every control; `prefers-color-scheme: dark`;
  touch targets ≥44px; flagship width **360px**.
- **Strings** through i18n: `t('ns.key', 'English default')`. **fr/sw stays English-now** (Batch 6
  decision) — the multilingual persona checks **long-string layout resilience, RTL-readiness, and
  un-i18n'd surfaces**, not a full translation pass. (Full fr+sw parity remains a separate wave-1.5 task.)
- **Verify before "done":** `npx tsc -b` **and** `npm run build` clean, then walk the routes in the
  browser preview (`preview_start({name:"gloki-dev"})`, port 5173) in **light + dark + 360px**, plus the
  relevant persona check (keyboard tab-through, 200% zoom, simulated long strings). No ErrorBoundary/console
  errors. Screenshots. Judge "clean" by `tsc`/`build` exit codes + a live DOM check (real click + short `await`).
- **Commit locally** in small, clearly-described chunks (`Co-Authored-By` trailer). **Do NOT push** — a
  push to `origin/ui` auto-publishes to Pages; Eston controls the deploy. Hand back when verified; he says "push".
- **Product calls:** confirm via the question tool; don't re-litigate settled decisions (trust model, the
  5-stage pipeline, the seam, 1p1v, the Batch 5 redesigns, the Phase-1 welcome guide).

## The workstream — diverse-persona a11y capstone (spec §4)

**Method.** Per flow, drive `design:accessibility-review`; collect every finding into **one artifact**
(`docs/superpowers/specs/<date>-batch6-a11y-findings.md`) with a **severity × effort** table
(`| # | Flow | Persona | Severity | Effort | Issue (+ WCAG SC) | Proposed fix (file) | Status |`). Triage,
commit the findings doc, then **bring the prioritized list to Eston before any large-ish fix** so he sets
the appetite. Then fix high/med-severity, reasonable-effort items in small commits; **flag** the long tail.
Batches 1–6 already put tokens/dark/focus-visible/≥44px broadly in place → expect **targeted** fixes
(labels, focus order, live-region announcements, contrast edge-cases, string-overflow). **Don't gold-plate.**

**Personas (all 5 — confirmed Batch 6):** low-vision (200% zoom + AA contrast) · keyboard-only (focus
order, visible focus, no traps) · screen-reader (roles/names, icon-only labels, heading order,
live-regions) · low-bandwidth/basic-phone (360px integrity, image degradation) · multilingual
(long-string ~30–40% overflow, RTL-readiness scan for hardcoded `left/right` vs logical props, `t()`-wiring).

**Flows (priority order — freshest first):**
1. **Onboarding** — `/welcome` (all **6** steps, esp. the new "How it works") + **LoginPage**.
2. **Stage feed** — `/stage/:stageId` + each stage's feed card + the **new pointer**.
3. **Stage 2 co-authoring** — `DiscussionStageView`.
4. **Stage 5 `MandateCard`** — `MandatePage`.
5. **Initiative dashboard** — `InitiativeDashboard`.
6. **Community home** — `CommunityView`.
7. **Identity / About** — incl. the new `HowGlokiWorks` full variant.

## Audit seeds (already spotted in Phase 1 — confirm + triage, don't assume complete)

- **About back button** (`InfoPage.module.scss .backButton`) is **36×36px** — below the 44px target.
- **LoginPage** has **no language switcher** pre-auth (a newcomer can't choose their language before
  logging in) + pre-existing **ad-hoc error hex** values (`#e53e3e`, `#fef2f2`, `#fcd34d`, …) that should
  move to tokens + meet AA. The generate button's hit area is small (see Demo facts).
- These are *starting points*, not the whole list — the personas will surface more.

## Demo facts you'll want (read these — they save a lot of time)

- **Previewing authed routes (important):** the real login (`Get Started`) does **not** complete in the
  preview sandbox — `AuthContext.login` awaits `initializeUser()` and opens an SSE to the real server,
  which the sandbox can't reach. **Workaround:** seed the session directly, then navigate —
  `localStorage.setItem('user', JSON.stringify({ publicKey: '<64 alphanumeric chars>', serverUrl: 'https://gdi.gloki.contact' }))`.
  `isAuthenticated` derives from Redux `user.publicKey`+`serverUrl`, hydrated from that `user` key on load.
- **Reaching `/welcome`:** be authed **and** first-run — i.e. seed `user` but leave `gloki.digitalAgent` /
  `gloki.onboarding` unset (clear them to reset onboarding). The new step is **index 2**; step through with
  the in-flow **Continue** buttons.
- **`preview_click` misses the icon-only generate button** — use `preview_fill('#publicKey', '<64 chars>')`
  or an eval `.click()`. The Get Started button is `button.login-button` (disabled until the key is valid).
- **Re-showing the stage-feed pointer:** remove `gloki.welcomeHints` from localStorage (it stores
  `["stageFeedIntro"]` once dismissed).
- **Seeded data:** real initiatives exist at every stage (e.g. `/stage/problem` shows "Affordable Housing
  in Growing Cities" by Mei Chen, Verified). Seeding lives in `src/services/demo/seedDemoCommunity.ts`.
  Reach an initiative dashboard via
  `/initiative/<enc serverUrl>/<enc publicKey>/<communityId>/<initiativeId>/roadmap` (swap `/roadmap`→`/discussion`
  for the co-authoring view); the published mandate is `/mandate/<communityId>/<initiativeId>`.
- **Verify a pending user** (to test gated actions): the "Meet a member (demo)" action / QR scan calls
  `addUserVouch` — cross 2→4 and the Vote/Mandate gates unlock live.
- **Headless quirk:** smooth `scrollIntoView` lands short *only* in the preview harness — use an instant
  scroll to verify wiring; real browsers honor smooth.

## When done

- `npx tsc -b` + `npm run build` clean; preview verified with screenshots (light + dark + 360px + the
  relevant persona checks) for every fixed surface.
- Findings doc committed; fixes in small local commits (clear messages, `Co-Authored-By` trailer).
  **Do not push** — hand back to Eston with a brief report (what was fixed vs flagged) + anything broader
  than expected.

> **Roadmap after this:** with the welcome guide (Phase 1, shipped) + the a11y capstone done, the
> redesign's core arc is complete — remaining work is launch-readiness polish + whatever Eston prioritizes
> next (e.g. the `ui → main` review PR with Ouri, or fr+sw multilingual parity).
