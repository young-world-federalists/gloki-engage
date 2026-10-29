# Session 15 — Card-design cohesion audit → P5.5 Generalize Gloki beyond the VftC/Africa pilot

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). Two linked pieces, in this order:
**Phase 0 = a card-design cohesion audit** (Eston's concern — see below), then **Phase 1 = P5.5 "generalize Gloki
beyond the Voices-for-the-Climate / Africa pilot"** (the workstream logged in `MASTER_TODO.md` §7 P5.5). The
order is deliberate: generalization edits card **content and copy** heavily, so we re-establish the card *frame*
before repainting what's inside it.

The build-ordered roadmap **P0 → P5** is complete and deployed on `origin/ui` (S14 P5 offline anchor + localized
country names shipped @ `4ad7691`, Pages green). This session is NOT a P-tier feature build — it is
**consolidation + repositioning**.

## ⚠️ Phase 0 — Card-design cohesion audit (do this FIRST, it may reshape the session)
**Eston's concern (2026-07-01):** *"a lot of the card design I worked on in previous sessions has been removed as
you've been adding stuff."* The controller checked at S14 close and found **no card component was removed** — all
ten (`InitiativeStageCard`, `SolutionsBoard`, `MandateCard`, `VoteActivityCard`, `CommunityCard`,
`ThreadedDiscussion`, `ActivityCard`, `ProblemActivityCard`, `ProblemEngage`, `InitiativeStageStrip`) exist and are
wired; the only recent deletions were the **dormant deliberation experiment** (`PositionsBoard`/`AnchoredThread`/
`ParticipationMeter`/`CoPresenceBar`, S7 sweep — never part of the approved card design). **BUT** the feeling is
valid signal: P0–P5 layered a lot *onto* the cards (honesty copy, disclosure lines, verified shields, commitments/
metrics blocks, expert-review attributions, ratification affordances, scope badges), which can **dilute the crisp,
cohesive card design** approved on 2026-06-22 even though nothing was deleted. That accretion-dilution is exactly
what a design audit catches.

**Phase 0 is a REVIEW, not a blind rebuild.** Steps:
1. **Diff the live cards against the approved specs** (read-first list below). For each card, note where the current
   implementation has drifted from / accreted beyond the approved design: visual hierarchy muddied, too many
   competing blocks, inconsistent spacing/typography vs `DESIGN_SYSTEM.md`, north-star framing buried, the
   collapsed→expand "read summary / shaded engage panel" model eroded, etc.
2. **Verify against the live preview** (`gloki-dev`, 360px, light + dark) — screenshots of each card surface.
   Perception claims must be grounded in the actual rendered card, not the diff alone (the S9 lesson: verify
   contrast/hierarchy claims against what's on screen + `DESIGN_SYSTEM`).
3. **Present findings to Eston, recommend-then-confirm**, ranked: genuine regressions/dilution vs intentional
   feature additions he approved. **This is his call** — he designed these cards. Then Eston decides the fix scope:
   (a) restore cohesion **inline this session** before generalization, (b) **split card-restoration into its own
   dedicated session** (Session 15a) and defer P5.5, or (c) accept current state and proceed straight to P5.5.
4. Only after that decision does the session continue.

Do **not** "restore" anything by reverting feature work P0–P5 shipped (honesty copy, spine, ratification, etc. are
locked, reviewed, deployed) — cohesion work means *re-composing* the card layout/hierarchy around those elements,
not deleting them. If a finding conflicts with a shipped decision, surface it to Eston, don't act unilaterally.

## Phase 1 — P5.5 Generalize Gloki beyond the VftC/Africa pilot
**Why:** the app reads as the *Voices for the Climate / youth across Africa* campaign, not Gloki-the-global-platform.
Eston wants Gloki positioned as a **global direct-democracy platform**. There are **NO locked decisions yet** — so
**`superpowers:brainstorming` with Eston FIRST** to lock scope + an anchor, then spec → plan → subagent-driven build.

**Four aspects Eston selected** (all in scope for the workstream; the brainstorm picks the session anchor):
1. **UI copy & mission framing** — neutralize climate/VftC-specific wording in onboarding / homepage / About /
   stage / consent copy so it speaks to *any* cause. Concrete example found in S14: the onboarding invitation reads
   *"Priya vous a invité·e à Voices for the Climate — où des jeunes de toute l'Afrique décident ensemble que faire
   face au climat."* Grep for "climate"/"Voices"/"Africa"/"Afrique" across `src/i18n/*` and fixtures.
2. **Sample / fixture content** — the seeded problems/solutions/mandates are climate-themed; diversify to varied
   civic topics (housing, transit, digital rights, water, education, etc. — some already exist: "Clean drinking
   water", "digital privacy", "Affordable housing") so demos read as a general platform. Touches
   `src/services/demo/fixtures/*` → likely a **DEMO_VERSION bump** (check).
3. **Geographic assumptions** — de-Africa-center the defaults: `PILOT_COLORS` (KE/NG/MW/CD in
   `src/utils/countries.ts`), default/inviter country, `PILOT_COUNTRIES`/pilot-country lists, and the region
   taxonomy defaults (`src/utils/regions.ts` — the 6-region set is already global, but verify the Africa-first
   framing/ordering). Make them globally neutral without breaking the existing country/region rendering.
4. **Docs & positioning** — reframe `MASTER_TODO.md` §1–2 (the mission is currently the VftC pilot + the ≥70%-
   unaided VftC KPI), the persona-review framing, and project memory from "VftC pilot" to Gloki-as-global-platform.

**Recommended anchor (surface to Eston, recommend-then-confirm):** make **UI copy & mission framing + sample/
fixture content** the build focus (the two that most change how the app *reads*), treat **geographic assumptions**
as a bundled quick-win-ish pass, and **docs & positioning** as the closing update. But confirm — Eston may want a
different slice, or to keep VftC as *one seeded community among several* rather than removing it (a likely nuance:
generalize the *platform framing* while keeping VftC as a flagship example community).

## Re-verify these premises vs HEAD (the recurring S10–S14 lesson — prompts go stale; S14's "offline is greenfield" was wrong)
- `PILOT_COLORS` = KE/NG/MW/CD and `PILOT_COUNTRIES = COUNTRIES` in `src/utils/countries.ts` (confirm still there).
- `src/utils/regions.ts` — the 6-region taxonomy + `$region-*` tokens (S5). Confirm whether Africa is defaulted/
  first anywhere.
- Locale union is still `'en'|'fr'|'sw'` (`src/i18n/types.ts`, `index.tsx`); `getCountryName(code, locale)` is now
  locale-aware (S14) — localized country names already ship.
- Fixtures: `src/services/demo/fixtures/*` (problems/solutions/mandates/communities/personas). Grep the actual
  climate/VftC/Africa strings before planning edits; some content is already diverse.
- `DEMO_VERSION` current = **global-v16** (`src/services/demo/…`) — a fixture change needs a bump to v17.
- The card specs still describe the approved design (they're historical specs; the *live code* is the source of
  truth for the audit — diff both directions).

## Read first (carry the context)
- **For Phase 0 (card specs — the approved design to audit against):**
  - `docs/superpowers/specs/2026-06-22-card-redesign-design.md` (the unified Read/Engage `InitiativeStageCard`
    vision) + `docs/session-prompts/2026-06-22-card-redesign-build.md`.
  - `docs/superpowers/specs/2026-06-27-session-4-solutions-card-commitments-spine-design.md` (SolutionsBoard),
    `…/2026-06-27-session-5-vote-card-carry-spine-design.md` (VoteActivityCard/QVFlow),
    `…/2026-06-28-session-6-mandate-card-consume-spine-design.md` (MandateCard),
    `…/2026-06-26-problem-card-discussion-chat-design.md` (Problem card + ThreadedDiscussion).
  - `DESIGN_SYSTEM.md` — the **Cards** section (§ around the `$radius-lg`/`$shadow-*` tokens), the `InitiativeStageCard`/
    `InitiativeStageStrip`/`UserIdentity`/`Vote card` primitive entries, spacing (`$spacing-lg` = card padding), AA.
  - The live card components (source of truth): `src/components/initiative/InitiativeStageCard.tsx` + `stages/`,
    `src/components/community/{CommunityCard,ActivityCard,ProblemActivityCard,VoteActivityCard}.tsx`,
    `src/components/mandate/MandateCard.tsx`.
- **For Phase 1 (generalization):** `MASTER_TODO.md` §1–2 (the VftC mission + KPI to reframe), §7 **P5.5** (the
  canonical 4-aspect list) + §8 changelog; project memory `project_session14_mission_floor_jul2026` (the P5.5
  direction + the offline/country-name work), `project_persona_review_jun2026` (the persona cohort — several are
  African, informing what "general" should still represent), `project_consistency_pipeline_redesign_jun2026` (the
  card-spine history, so generalization doesn't break the commitments/metrics spine), and the `MEMORY.md` index.
- `CLAUDE.md` — the **seam rule** (all reads/writes via `src/services/api.ts`; demo seam emits no `contract_write`
  events → re-fetch after writes) + deploy note (GitHub Pages, `public/404.html`, `tsc -b` must pass) + the
  **ui method names MUST match Ouri's real contract exactly** learning (don't rename contract methods when
  generalizing vocab).

## Workflow + constraints (same discipline as S1–S14)
- **Phase 0 audit first** (a `superpowers:requesting-code-review`-style design audit against the specs + live
  preview) → present to Eston → he sets fix scope. **Then Phase 1: `superpowers:brainstorming`** to lock the
  generalization anchor + decisions → spec (`docs/superpowers/specs/…`) → `superpowers:writing-plans` →
  `superpowers:subagent-driven-development` (per-task spec+quality reviews + **Opus whole-branch review** as the
  gate; local multi-model panel has been unavailable S11–S14 — confirm with Eston, don't pass `--free-ram`/
  `--quit-chrome`). Track progress in the `.superpowers/sdd/` ledger (clean the stale one; it's gitignored scratch).
- **Re-verify each premise vs HEAD first** (grep `PILOT_COLORS`, `regions.ts`, the fixture strings, `DEMO_VERSION`).
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a component.
- **Tokens only**; reuse the kit + primitives (`Card`/`Banner`/`Badge`/`UserIdentity`/`AppHeader`/`InitiativeStage
  Strip`/`SmartImage`/`CountryMultiSelect`). 360px flagship; verify **light + dark**; **AA gates**; reduced-motion
  token-pure. **Single `<h1>` per route** + landmark/skip-link survive.
- **i18n:** any new/changed strings at **fr + sw key parity** (flat dotted keys; en inline via `t('key','English')`).
  Parity check with a **position-agnostic set diff** — `grep -oE "^ *'[^']+':" | sort -u` + `comm`, NOT line `diff`,
  NOT `sed \s` (macOS BSD sed has no `\s` → false diffs; the S13 learning). Reframed fr/sw strings → append to
  `docs/i18n-native-review-candidates.md` (already carries an unshipped fr/sw backlog).
- **DEMO_VERSION:** bump `global-v16 → v17` **only if fixtures change** (generalizing fixture content likely DOES;
  a copy-only or geography-token change likely does NOT — check).
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via build
  + `preview_*` (`gloki-dev`, port 5173) at 360px. Single shared preview browser; drive it from the controller
  (S9/S14: subagents stall on preview) — implementers verify via build only.
- Repo on a **slow external USB drive** — small sequential I/O.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected Ouri divergence, not a
  build failure. Update `MASTER_TODO.md` §7/§8 + project memory after the session.

## Open decisions to lock (Phase 0 first, then the brainstorm)
1. **Phase 0 fix scope** — restore card cohesion inline this session / split into its own Session 15a / accept
   current + proceed. (Eston's call after the audit findings.)
2. **P5.5 anchor** — copy+fixtures (recommended) vs a different slice.
3. **Keep VftC as a flagship example community** (recommended nuance) vs remove climate framing entirely.
4. **Geography defaults** — neutral default country (or none), what replaces `PILOT_COLORS`, keep-or-reorder region
   taxonomy.
5. **Fixture diversification depth** — how many new civic topics, and whether the existing `digital`/`databroker`/
   water/housing seeds already suffice (they partly do).
6. **Docs reframing** — how far to rewrite `MASTER_TODO` §1–2 mission + the VftC KPI (it's the concrete success bar;
   generalize the framing without losing a measurable pilot target).

When ready: run the **Phase 0 card-cohesion audit** and present findings to Eston (recommend-then-confirm), let him
set the fix scope, then **brainstorm the P5.5 generalization** anchor, re-verify premises vs HEAD, and spec → plan →
build the confirmed slice.
