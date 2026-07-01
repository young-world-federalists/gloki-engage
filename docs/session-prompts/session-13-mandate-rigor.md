# Session 13 — Mandate rigor (P4)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The build-ordered roadmap
(**P0 pilot-readiness → P1 navigation/IA → P2 trust/privacy/consent → P3 evidence & expertise**) is
**complete and deployed** on `origin/ui` (P3/S12 @ `796a620`; MASTER_TODO tidy @ `7939162`, Pages green).
`MASTER_TODO.md` §7 is now at **P4 — Mandate rigor (institutional credibility)**: make the published
mandate defensible as an institution — every indicator has a **target + baseline + measurement cadence**
before it can be ratified, the artifact states its **turnout denominator** (X of N eligible) and an explicit
**Sybil-resistance / verification** statement, and org endorsements are marked **claimed vs verified**.
Stub-layer work — one new ratification surface + data-model + spec.json/provenance additions.

A full spec already exists from the S12 scoping pass: **`.superpowers/sdd/s13-mandate-rigor/spec.md`**
(gitignored ledger — read it first; it carries the premise findings, the locked decisions, the storage seam,
and the engineering choices).

## ⚠️ Read this first — re-verify premises vs HEAD (the recurring S10/S11/S12 lesson)
As of `796a620` P4's premises were checked and found **accurate** (unlike P3's). But re-confirm against the
CURRENT HEAD before writing the plan — more may have shipped:
- `src/hooks/useMandate.ts` derives `indicators` as `{label, target:''}` from `winner.expertReviews[].metrics`
  (bare label strings) and `articles` as `{title:'', body}` from commitments. Confirm `target` is still empty
  and `MandateIndicator` still has **no** `baseline`/`cadence` field.
- `MandateProvenance` (`src/services/demo/fixtures/mandate.ts`) carries `participants` but **no eligible
  denominator / turnout%**. The vote stage already computes turnout as
  `allocators / communityMemberCount` (`QVFlow.tsx:155`) — reuse that denominator, don't invent a second.
- `buildSpec` in `MandateDocument.tsx` emits version/indicators/provenance/endorsement-count but **no
  Sybil/verification block**.
- `MandateAdopter` has `level: 'endorsed'|'subscribed'` but **no claimed-vs-verified** flag.
- **There is no ratification GATE today** — the flagship mandate ships as `status:'ratified'` from the
  fixture. Decision 1 introduces one; confirm nothing added it since.

**Surface any item you find already-done or materially narrower to Eston as a recommend-then-confirm** before
building (as S10/S11/S12 did).

## Decisions ALREADY LOCKED (Eston, 2026-07-01) — do NOT re-ask unless a premise has shifted
1. **Indicator target/baseline/cadence** are entered at a **pre-ratification step** on the mandate (a new,
   host/expert-gated "Prepare for ratification" panel) — NOT by reopening the S12 review composer.
2. **Turnout denominator** N = `communityMemberCount` (same as the vote-stage footer), X = voters who
   allocated; surface "X of N eligible (Y%)" on mandate provenance + spec.json.
3. **Sybil/verification statement** = one **static, platform-level** honest statement (web-of-trust gate,
   1p1v, no biometrics/ID — reconciled with the P0/P2 claims-honesty + consent copy), i18n'd, on every
   mandate + in spec.json. Not per-mandate.
4. **Claimed-vs-verified endorsements** = add a `verified` flag to `MandateAdopter` + a distinct badge on the
   adoption framework + reflect in spec.json; seed a mix (verified + claimed). Stub "verified" = seeded data.

## Why this is next
P0 made the pipeline reachable, P1 navigable, P2 trustworthy, P3 checkable; **P4 makes the OUTPUT — the
mandate — institutionally credible.** The 2026-06-29 nine-persona review flagged empty KPI targets (James),
no turnout denominator, no Sybil statement, and claimed-vs-verified endorsement ambiguity. This is the last
credibility layer before the mission-floor work (P5).

## Read first (carry the context)
- **`.superpowers/sdd/s13-mandate-rigor/spec.md`** — the scoping output (decisions, data-model, ratification
  seam, engineering choices). Start here.
- `MASTER_TODO.md` §1–2 (north-stars + mission), §7 **P4** (the canonical item list + severities), §8
  changelog (the 2026-06-29 findings + the P0–P3 shipped entries).
- Project memory: `project_session12_evidence_expertise_jul2026` (the S12 spine + the seam-edit learning),
  `project_consistency_pipeline_redesign_jun2026` (the commitments/metrics **spine**: `useMandate` derives
  indicators from `expertReviews[].metrics`; keep exact contract method names), `project_session6_mandate`
  (the mandate card/document redesign), `project_persona_review_jun2026` (the P0–P6 roadmap + the mandate
  findings), and the `MEMORY.md` index.
- `CLAUDE.md` — the **seam rule** (all reads/writes via `src/services/api.ts`; the demo seam emits no
  `contract_write` events → **re-fetch after writes**, the `wtdraft_`/`ConcernsFlow`/`SolutionsBoard`
  pattern) + the Python contract shape (`Storage()`/`master()`/`timestamp()`/`partners()`; no
  `.get(key, default)`).
- `DESIGN_SYSTEM.md` — tokens, AA, shared primitives (`AppHeader`/`InfoDisclosure`/`UserIdentity`/`Banner`/
  `SourceLinks`/`SourcesInput` from S12). The ratification panel + badges must be token-pure.
- The surfaces P4 touches: `src/services/demo/fixtures/mandate.ts` (types + fixture), `src/hooks/useMandate.ts`,
  `src/components/mandate/{MandateDocument,MandatePage,MandateCard}.tsx` + `AdoptionFramework.tsx`,
  `src/components/stages/MandateStage.tsx`, and the initiative contract (`demoContracts/initiative.ts`) for the
  ratification-property seam.

## Scope — P4 (see MASTER_TODO §7 + the spec for the canonical list; re-verify each premise vs HEAD first)
1. **[MAJOR] Indicator rigor + ratification gate.** Extend `MandateIndicator` with `baseline` + `cadence`
   (and populate `target`). Build a host/expert-gated **"Prepare for ratification"** panel (Mandate stage,
   reuse `getInitiativeRoles`) that lists each derived indicator with target/baseline/cadence inputs. Store
   the ratification data as a JSON property on the **initiative contract** (`set_property`/`get_properties`,
   mirroring `wtdraft_`) e.g. `mandate_ratification = { status, indicators: {[label]:{target,baseline,cadence}} }`;
   `useMandate` reads it back and MERGES per-indicator (matched by label). Re-fetch after write. A mandate
   reads `ratified` only when every indicator is complete; otherwise show a "pending ratification"
   affordance on `MandateDocument`/`MandateCard`. FOR OURI: a real mandate/ratification contract.
2. **[MAJOR] Turnout denominator.** Add `eligible: number` (N) to `MandateProvenance`; thread X (voters) + N
   (`communityMemberCount`) to the mandate; render "X of N eligible (Y%)" in the provenance strip + add
   `provenance.turnout {voters, eligible}` to `buildSpec`/spec.json.
3. **[MAJOR] Sybil / verification statement.** Static i18n block (`mandate.verification.*`) on
   `MandateDocument` (provenance area) + `provenance.verification` string in spec.json. Copy: web-of-trust
   gate, 1p1v, no biometric/ID — must match the P0/P2 honesty copy. fr+sw parity.
4. **[MAJOR] Claimed-vs-verified endorsements.** Add `MandateAdopter.verified: boolean` + a distinct badge in
   `AdoptionFramework`; reflect in `buildSpec` (e.g. endorsements `{claimed, verified}`); seed 1–2 verified +
   1 claimed in the mandate fixture. i18n badge label.

> Cross-references: do NOT reopen the S12 spine method names (`add_proposal`/`add_expert_review`/`proposal_id`)
> — the ratification data is a NEW additive initiative property. Reuse `getInitiativeRoles` for the gate (as
> `SolutionsBoard`). Reuse the vote-stage turnout denominator; don't invent a second. The verification
> statement is static/honest — reconcile with P0/P2 copy, don't overclaim.

## Workflow + constraints (same discipline as S1–S12)
- **Re-verify each P4 premise vs HEAD first.** Grep/read `useMandate.ts`, `mandate.ts`, `MandateDocument.tsx`,
  `AdoptionFramework.tsx`, and the initiative contract before writing the plan.
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a component.
  The demo seam emits **no `contract_write` events** → **re-fetch after writes** (critical for the
  ratification panel).
- **Tokens only**; reuse the kit + primitives. 360px flagship; verify **light + dark**; **AA gates**;
  reduced-motion token-pure. **Single `<h1>` per route** + landmark/skip-link must survive; any live-region /
  disclosure screen-reader announced.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys; en inline via
  `t('key','English')`). Run the parity check (sorted-key diff empty) + code-ref↔i18n cross-check. New fr/sw
  strings → append to `docs/i18n-native-review-candidates.md`.
- **DEMO_VERSION:** bump `global-v15 → global-v16` (fixtures change — seeded indicators gain target/baseline/
  cadence, adopters gain `verified`, provenance gains `eligible`).
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` (`gloki-dev`, port 5173) at 360px. The ratification panel is host/expert-gated — you may
  need to seed the current user into `roles.experts`/host or verify against a seeded persona; lean on
  code-correctness reasoning where preview automation stalls (S12's reseed note: welcome flow needs the
  identity key set via the React-native value setter + "Get Started", sometimes twice).
- For multi-file work: spec (done — `.superpowers/sdd/s13-mandate-rigor/spec.md`) → `superpowers:writing-plans`
  → direct execution with build+preview checkpoints (as S10/S11/S12) → **Opus whole-branch review**. Ledger
  namespaced `.superpowers/sdd/s13-*`; clean only your own. Do your own grep cross-check for i18n parity /
  dead code / single-h1.
- **Gate:** the local multi-model review panel — but note (S11/S12) the cloud reviewers are down (glm-5.2
  403; no `GEMINI_API_KEY`) and local Ollama is RAM-gated. Confirm with Eston whether to run it; do **not**
  pass `--free-ram`/`--quit-chrome` (he keeps Chrome open). If no coverage, the Opus whole-branch review is
  the gate (as S5/S6/S8/S11/S12).
- Repo is on a **slow external USB drive** — small sequential I/O; the preview is a single shared browser.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence (Ouri's
  real-server layer).
- Update project memory after the session.

When ready: read the spec, re-verify each P4 premise vs HEAD, surface any stale/narrower item to Eston, then
proceed P4 top-to-bottom. Item 1 (indicator rigor + the ratification gate) is the anchor and the only new
surface.

## After P4 — the remaining roadmap (for context, not this session)
- **P5** Mission floor: low-bandwidth/offline mode (cache last view, defer images, WhatsApp-shareable
  summary); more UI locales incl. Chichewa + localized country names in `SearchableSelect`; content-
  translation strategy (fixture text is English in every locale — coordinate with Ouri).
- **P6** Wave-1 debt: liquid delegation D3 (the one named-but-missing core mechanism); Wave 1.5 refactor lanes.
- Human-gated, parallel: fr/sw native-speaker review (`docs/i18n-native-review-candidates.md`).
- Deferred S12 reuse cleanup: migrate `ProblemVoteFlow` + `CreateInitiativePage` to the shared
  `SourceLinks`/`SourcesInput` primitives (they were built against those exact patterns).
