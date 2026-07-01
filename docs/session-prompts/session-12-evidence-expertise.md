# Session 12 — Evidence & expertise loop (P3)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The whole redesign arc
(Wave 1 → UX-overhaul → the S1–S6 consistency/pipeline roadmap → S7 consolidation → S8 Minors + i18n packet →
**S9 P0 pilot-readiness** → **S10 P1 Navigation & IA** → **S11 P2 Trust, Privacy & Consent**) is **complete and
deployed** on `origin/ui` (S11 @ `a112893`, Pages green). The build-ordered roadmap lives in `MASTER_TODO.md`
§7; the findings that drive it are the **2026-06-29 nine-persona review** (§8). **This session is P3 — the
Evidence & expertise loop**: make a solution's claims *checkable* — real sources on what people write, a
credentialed expert assessment (not just a request), and author-visible indicator metrics. Stub-layer work —
mostly composer fields, one enriched submit flow, and chip rendering. Builds on the commitments/metrics **spine**
that already flows Solutions→Vote→Mandate (S4→S5→S6).

## ⚠️ Read this first — P3's premises are the STALEST yet (the recurring S10 lesson)
The 2026-06-29 persona review predates the S4/S5 pipeline work, so **two of P3's three headline claims are
already partly built.** Verify each against HEAD before writing a spec — do NOT rebuild what exists:
- **"Today you can only *request* a review" is STALE.** `SolutionsBoard.tsx` already has a full
  **submit-expert-review modal** (S4): `api.addExpertReview(serverUrl, publicKey, contractId, reviewFor,
  metrics, note)`, gated by `isExpert` (`roles.experts.includes(publicKey)`), with repeatable metric inputs +
  a note field, plus a read-only threshold bar counting distinct reviewers. `requestExpertReview` is the
  *non-expert* path. So item 1 is **enrich**, not build: what's genuinely missing is (a) a structured
  **assessment** field (today it's just metrics + a freeform note), (b) an **evidence / source** field on the
  review, and (c) **reviewer name + credentials on the badge** (today the byline resolves a publicKey to a
  name via `displayNameFor`; there is no credential/affiliation anywhere).
- **"Indicator metrics are display-only" is PARTLY STALE.** Experts already *enter* metrics via
  `addExpertReview`, and S6's `useMandate` derives the mandate's indicators from `expertReviews[].metrics`.
  What's missing is letting **solution authors** propose indicator metrics too (today authors enter the 3
  *commitments* at add-solution; metrics come only from experts). Confirm this before scoping item 3.
- **"Citation chips already shown on problems/mandates"**: the problem fixture carries `evidence: string[]`
  (URLs) — grep `problems.ts` `evidence:` and find where it renders as chips (`ProblemEngage` / the problem
  card / `MandateDocument`). Item 2 reuses that chip rendering for the new composer field — locate the exact
  chip component/markup and match it; don't invent a new one.

**Surface any item you find already-done or materially narrower to Eston as its own recommend-then-confirm
before building** (as S10/S11 did — S11 caught the pseudonym + pubkey-URL premises this way).

## Why this is next
P3 answers the review's **evidence/expertise convergence**: solutions carry commitments and (expert) metrics
but no *sources*, the expert loop looks broken because a requested review has no visible submit-and-credit
path from the reader's view, and there's no way to see *who* reviewed or *on what basis*. P0 made the pipeline
reachable, P1 navigable, P2 trustworthy; **P3 makes the content *checkable*** — the last credibility gap before
the mandate-rigor work (P4).

## Read first (carry the context)
- `MASTER_TODO.md` §1–2 (north-stars + the Voices-for-the-Climate mission), §7 **P3** (the exact 3 items +
  severities), §8 (the 2026-06-29 changelog — the evidence/expert-loop findings).
- Project memory: `project_session11_trust_privacy_jul2026` (**the S11 lesson: a read-only component that calls
  `useFlowContract` is NOT read-only — it deploys+registers; and verify each item's premise vs HEAD**),
  `project_consistency_pipeline_redesign_jun2026` (S4 SolutionsBoard + the commitments/metrics **spine** on the
  `approval` contract: `addProposal(+commitments)` / `request_expert_review` / `add_expert_review` /
  `expertReviews[{metrics}]` — and the **KEY rule: ui contract method names MUST match Ouri's real contract
  exactly**, keep `addProposal`/`proposal_id` despite "solution" vocab), `project_session6_mandate` (via the
  consistency memory — `useMandate` derives indicators from `expertReviews[].metrics`),
  `project_persona_review_jun2026` (the P0–P6 roadmap + the evidence findings), and the `MEMORY.md` index.
- `CLAUDE.md` — the **seam rule** (every read/write through `src/services/api.ts`; the demo seam emits no
  `contract_write` events → **re-fetch after writes**, the `ConcernsFlow`/`SolutionsBoard` pattern) + the Python
  contract shape (`Storage()`/`master()`/`timestamp()`/`partners()`; no `.get(key, default)`).
- `DESIGN_SYSTEM.md` — tokens, AA, the shared primitives (`InfoDisclosure`/`AppHeader`/`StageStrip`/
  `CountryMultiSelect`/`Banner`/`UserIdentity` w/ verified-shield). The verified-shield + `displayNameFor`
  byline is where reviewer credentials attach.
- The surfaces P3 touches: `src/components/initiative/stages/SolutionsBoard.tsx` (the expert-review modal +
  add-solution modal + the two threshold bars), the write-together composer (`src/components/community/
  writeTogether/`), the comment composer (`src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx`),
  the approval seam (`approvalApi.ts` + the demo `approval` contract), and the problem/mandate citation-chip
  render sites.

## Open with the product decisions (recommend-then-confirm)
P3 commits the mockup to **product stances only Eston can lock** — surface these as ONE batched
recommend-then-confirm at the start (after the premise re-check, so the questions are grounded), before
touching code:
1. **Expert credentials — where do they come from?** There is no credential/affiliation field today. Capture
   it **at review-submit time** (a `credentials` string on the review, e.g. "Epidemiologist, WHO"), rendered
   next to the reviewer's name + verified-shield on the badge — OR pull from a new profile field? Recommend:
   **on the review submission** (stub-simple, self-describing, no new identity system; multiple reviews can
   carry different affiliations). Seed 1–2 expert reviews with credentials so it shows in the demo.
2. **Sources / citation field shape.** One repeatable **URL + optional label** per source, rendered as the
   existing problem/mandate evidence chips — vs a richer {title, publisher, url}? Recommend: **URL + optional
   label**, matching the current `evidence: string[]` chip pattern (lowest friction; consistent). Applies to
   the solution composer, the write-together composer, and the comment composer.
3. **Who enters indicator metrics?** Keep metrics **expert-only** (today), or also let **solution authors**
   propose indicator metrics at add-solution (alongside their 3 commitments)? Recommend: **let authors propose
   them too** (author intent + expert validation both feed the mandate), clearly labelled so an author-proposed
   metric reads differently from an expert-validated one. Confirm this doesn't muddy S6's `useMandate`
   derivation (which reads `expertReviews[].metrics`) — if it complicates the spine, keep authors' metrics
   visually distinct but still derived expert-first.

Everything else in P3 is unambiguous once these are set.

## Scope — P3 (see MASTER_TODO §7 for the canonical list; verify each premise vs HEAD first)
1. **[MAJOR] Close/enrich the expert-review loop.** Extend the existing `SolutionsBoard` submit-review modal
   with an **assessment** field + an **evidence/source** field, and render **reviewer name + credentials +
   verified-shield** on the review badge (per decision #1). FOR OURI: extend the `approval` contract's
   `add_expert_review` spine (`expertReviews[{ expert, metrics, note, assessment?, sources?, credentials? }]`)
   — keep method names exact. Make the reader-facing loop legible: a requested review that's been submitted
   should visibly *resolve* (request → submitted-by → credentials).
2. **[MAJOR] Repeatable Sources / citation field** on the solution composer, the write-together composer, and
   the comment composer (per decision #2), rendered as the **same citation chips** already used on
   problems/mandates. Thread the field through the relevant contract writes (`addProposal` / write-together
   `set_statement` / comment add) as an optional `sources` array; re-fetch after write (no `contract_write`
   events).
3. **[MAJOR] Author-visible / author-entered indicator metrics** (per decision #3). If authors can propose
   metrics, add them to the add-solution modal alongside commitments and thread through `addProposal`; keep
   the `useMandate` derivation coherent (expert-validated metrics stay the mandate's source of truth unless
   Eston decides otherwise).

> Cross-references: don't re-open the S4 spine's method names (`addProposal`/`proposal_id`/`add_expert_review`)
> — extend them additively. Reuse `UserIdentity` (name + verified-shield + `displayNameFor`) for the credited
> reviewer byline — don't build a second identity chip. The citation chips must match the existing evidence-URL
> render exactly. Keep the "Solutions" UI vocab.

## Workflow + constraints (same discipline as S1–S11)
- **Verify each P3 item's premise against HEAD first** (the S10/S11 lesson — see the ⚠️ block above). Grep/read
  `SolutionsBoard.tsx`, `approvalApi.ts`, the demo `approval` contract, and the citation-chip render sites
  before writing the spec. Surface any already-done/narrower item to Eston as its own recommend-then-confirm.
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a component.
  The demo seam emits **no `contract_write` events** → **re-fetch after writes** (critical for the review
  submit, the sources field, and any metrics write).
- **Tokens only**; reuse the kit + primitives (`InfoDisclosure`/`AppHeader`/`StageStrip`/`UserIdentity`/
  citation chips). 360px flagship; verify **light + dark**; **AA gates** per `DESIGN_SYSTEM.md`; reduced-motion
  token-pure. **Single `<h1>` per route** + landmark/skip-link structure must survive; any live-region /
  disclosure must be screen-reader announced.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys; en inline via
  `t('key','English')`; foundation keys in `en.ts`). Run the parity check (sorted-key diff empty) + a
  code-ref↔i18n cross-check after any i18n change. New/changed fr/sw strings → append to
  `docs/i18n-native-review-candidates.md` (still human-gated).
- **DEMO_VERSION:** bump `global-v14 → global-v15` ONLY if you change demo fixtures (e.g. seed an expert review
  with credentials/sources, or add a `sources` field to seeded solutions/problems). Pure composer/UI additions
  with no seeded-data change don't need a bump.
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` tools (`gloki-dev`, port 5173) at 360px. **Heads-up:** preview automation is finicky for
  gated/expert flows and focus — the `isExpert` gate means you may need to seed the current user into
  `roles.experts` (or verify against a seeded expert persona) to see the submit modal; lean on code-correctness
  reasoning + targeted snapshots, and take over preview verification where automation stalls.
- For multi-file work use spec → `superpowers:writing-plans` → (subagent-driven OR, given the slow-drive /
  single-preview cost and a plan that carries full code, **direct execution with build+preview checkpoints** as
  in S10/S11) with a final **Opus whole-branch review**. Ledger namespaced `.superpowers/sdd/s12-*`; clean only
  your own. Do your own grep cross-check for i18n parity / dead code / single-h1.
- **Gate:** the local multi-model review panel (`/code-review` → `local-review`) — but **note from S11: the
  cloud reviewers are currently unavailable** (`glm-5.2:cloud` → 403 "requires a subscription"; no
  `GEMINI_API_KEY` in `.env`), and the local Ollama models are RAM-gated. Confirm with Eston whether to run it
  (and with which models) — do **not** pass `--free-ram`/`--quit-chrome` (he keeps Chrome open). If it has no
  coverage again, the Opus whole-branch review is the gate (as S5/S6/S8/S11).
- Repo is on a **slow external USB drive** — throttle to small sequential I/O; subagents avoid heavy parallel
  greps. The preview is a single shared browser — drive it one agent at a time.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence
  (origin/main is Ouri's real-server layer — landing `ui→main` stays his call).
- Update project memory after the session.

When ready: re-check each P3 premise against HEAD, ask Eston the three product decisions as ONE batched
recommend-then-confirm (with any stale-item findings), then proceed P3 top-to-bottom. Item 1 (enrich the
expert-review loop) is the anchor.

---

## After P3 — the remaining roadmap (for context, not this session)
- **P4** Mandate rigor: **target + baseline + measurement cadence** per indicator before ratification (today
  `indicators[].target`/`articles[].title` are empty); **turnout denominator** (X of N eligible) + an explicit
  **Sybil-resistance/verification** statement on the mandate + its `spec.json` `provenance`; claimed-vs-verified
  org endorsements.
- **P5** Mission floor: low-bandwidth/offline mode (cache last view, defer images, WhatsApp-shareable summary);
  more UI locales incl. Chichewa + localized country names in `SearchableSelect`; content-translation strategy
  (fixture text is English in every locale — coordinate with Ouri).
- **P6** Wave-1 debt: liquid delegation D3 (the one named-but-missing core mechanism); Wave 1.5 refactor lanes.
- Human-gated, parallel: fr/sw native-speaker review (`docs/i18n-native-review-candidates.md` — now includes
  the S11 trust/consent strings).
