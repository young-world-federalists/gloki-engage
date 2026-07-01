# Session 11 — Trust, Privacy & Consent depth (P2)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The whole redesign arc
(Wave 1 → UX-overhaul → the S1–S6 consistency/pipeline roadmap → S7 consolidation → S8 Minors + i18n packet →
**S9 P0 pilot-readiness** → **S10 P1 Navigation & IA**) is **complete and deployed** on `origin/ui`
(S10 @ `cbea829`, Pages green). The build-ordered roadmap lives in `MASTER_TODO.md` §7; the findings that
drive it are the **2026-06-29 nine-persona review** (§8). **This session is P2 — Trust, Privacy & Consent
depth**: make the mechanism *auditable before you participate*, tell people honestly what's visible and what's
collected, and stop leaking identity. Implementation work on the stub layer — mostly copy, disclosure UI, one
gated-teaser, and a consent step. Builds directly on P0's honesty copy.

## Why this is next
P2 answers the review's **most-cited convergence (claims-honesty + weak-consent + identity-exposure):** the
verification gate hides the whole back half of the pipeline, so a newcomer can't audit *how the vote works*
without first handing over identity; the "one person, one vote" ↔ quadratic-ballot and "no ID papers" ↔
"confirming real-world identity" tensions still read as contradictions at the ballot; vote visibility (secret
vs attributable) is never disclosed and sits awkwardly next to "open to the whole community"; core consent can
be skipped ("Skip for now"); and the full public key rides along in shareable URLs. P0 made the back half
*reachable* and reconciled top-level copy; P1 made it *navigable*; **P2 makes it *trustworthy* — legible and
consent-first before anyone participates.**

## Read first (carry the context)
- `MASTER_TODO.md` §1–2 (north-stars + the Voices-for-the-Climate mission), §7 **P2** (the exact 3 items +
  severities), §8 (the 2026-06-29 changelog — the claims-honesty / gate-hides-back-half / consent convergences).
- Project memory: `project_session10_navigation_ia_jul2026` (**the S10 lesson: the session prompt can be STALE
  — verify each item's premise against HEAD before building; S10 found two P1 items already done/moot**),
  `project_session9_jun2026` (P0 — the claims-honesty copy already shipped, the "what's public · private ·
  permanent" lines at ballot + comment composer, and the per-community `'anyone'` gate + `databroker`
  initiative that makes the ballot reachable), `project_persona_review_jun2026` (the P0–P6 roadmap + the trust
  findings), `project_consistency_pipeline_redesign_jun2026` (the QV / conviction mechanics + the
  `addProposal`/`proposal_id` naming that stays despite "Solutions" UI vocab), and the `MEMORY.md` index.
- `CLAUDE.md` — the **seam rule** (every read/write through `src/services/api.ts`; the demo seam emits no
  `contract_write` events → re-fetch after writes) + the **Routing** block. The Python contract shape
  (`Storage()`/`master()`/`timestamp()`/`partners()`; no `.get(key, default)`).
- `DESIGN_SYSTEM.md` — tokens, AA, the shared primitives (**InfoDisclosure** the `(i)`→Modal standard is the
  natural home for the "how this vote works" explainer; AppHeader / StageStrip / InitiativeStageStrip /
  CountryMultiSelect / Banner-role).
- The vote surfaces: the QV ballot / conviction flow (`QVFlow`, `VoteEngage`, the S5 vote card) and the
  per-stage **verification gate** (the permission check that hides Solutions/Vote behind identity). Find where
  the gate wraps the ballot, and where shareable links are built (ID card / onboarding-guide share).

## Open with the product decisions (recommend-then-confirm)
P2 commits the mockup to **product stances only Eston can lock** — surface these as ONE batched
recommend-then-confirm at the start, before touching code (don't interrupt mid-build):
1. **Vote visibility model.** Is a cast vote **secret** (ballot-box, not attributable) or **attributable**
   (visible to the community, like a public roll-call)? The mockup must pick one and disclose it honestly at
   the ballot — and it must NOT over-claim a cryptographic secrecy guarantee the stub can't provide. Recommend:
   **attributable-by-default with an honest "this is visible to your community" line**, reconciled with "open
   to the whole community"; note that true secret-ballot is a backend/coordination question for Ouri.
2. **Pseudonym / display-name.** Offer members a **display name / pseudonym** for posts & votes (instead of
   real first/last name), or keep real-name only? Recommend: **opt-in display-name** on the profile, rendered
   by `UserIdentity` everywhere a byline shows, with the trust/verified state unchanged.
3. **Consent step depth.** Since there's no backend, what does the consent step actually *commit to*? Recommend:
   a **real (non-skippable) consent screen** that links placeholder privacy/data terms and lists what's
   collected (public key, profile, participation/votes, server) — honest that it's a pilot stub, but core
   consent is not "Skip for now".
Everything else in P2 is unambiguous; proceed once these are set.

## Scope — P2 (see MASTER_TODO §7 for the canonical list)
1. **[BLOCKER] Pre-gate ballot teaser + "how this vote works" explainer.** A **read-only** ballot preview +
   an explainer (the QV cost curve — why extra votes cost more; conviction's time dimension) visible *before*
   the verification gate, so the mechanism is auditable without participating. It must be genuinely read-only
   (no write path leaks past the gate — the demo seam emits no `contract_write`, so re-fetch/guard carefully).
   Reuse **InfoDisclosure** for the explainer prose; keep the numbers inline.
2. **[MAJOR] Disclose vote visibility + offer a pseudonym.** State secret-vs-attributable at the ballot
   (per decision #1) and reconcile it with "open to the whole community". Add the **display-name / pseudonym**
   option (decision #2) on the profile, threaded through `UserIdentity` bylines on posts & votes.
3. **[MAJOR] Real consent step + drop the public key from shareable URLs.** A non-skippable consent screen
   (decision #3) that links terms and lists what's collected. Separately, **remove the full public key from
   shareable URLs** (ID card / onboarding-guide share links) — use a truncated/opaque handle or route by
   community+initiative ids only; never put the raw key in a query string.

> Cross-references: the explainer must stay consistent with the **claims-honesty copy P0 already shipped**
> (don't re-open "1p1v ↔ QV" — extend the same framing Eston locked in S9: keep both, explain the link). The
> stage vocab stays **"Solutions"** in the UI while contract methods stay `addProposal`/`proposal_id` — don't
> "fix" that. The "what's public · private · permanent" line P0 added at the ballot/composer is the seed the
> consent + visibility copy should build on, not duplicate.

## Workflow + constraints (same discipline as S1–S10)
- **Verify each P2 item's premise against HEAD first** (the S10 lesson) — the consent "Skip for now", the
  public-key-in-URL, and the gate placement may have moved since the 2026-06-29 review. Grep/read the actual
  code before writing the spec; surface any stale item to Eston as its own recommend-then-confirm.
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a component.
  The demo seam emits **no `contract_write` events** → re-fetch after writes (critical for the read-only teaser
  and the profile display-name write).
- **Tokens only**; reuse the kit + primitives (**InfoDisclosure / AppHeader / StageStrip /
  InitiativeStageStrip / CountryMultiSelect / Banner-role**) + `UserIdentity` + `CountryPresence`. 360px
  flagship; verify **light + dark**; **AA gates** per `DESIGN_SYSTEM.md`; reduced-motion token-pure.
- **Single `<h1>` per route** + the landmark/skip-link structure must survive (a new consent route / teaser is
  the easy way to regress this — re-check the a11y snapshot on every touched route). Any live-region /
  disclosure must be screen-reader announced.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys, en inline via
  `t('key','English')`; foundation keys in `en.ts`). Run the parity check (sorted-key diff empty) + a
  code-ref↔i18n cross-check after any i18n change. New/changed fr/sw strings → append to
  `docs/i18n-native-review-candidates.md` (still human-gated).
- **DEMO_VERSION:** bump `global-v13 → global-v14` ONLY if you change demo fixtures (e.g. add a profile
  `displayName`/pseudonym field, or seed a pre-gate teaser initiative). Pure copy/disclosure/route changes
  don't need a bump.
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` tools (`gloki-dev`, port 5173) at 360px. **Heads-up:** preview automation is finicky for
  focus/gate/consent flows — synthetic clicks don't reliably move focus; lean on code-correctness reasoning +
  targeted snapshots, and take over preview verification where automation stalls.
- For multi-file changes use spec → `superpowers:writing-plans` → `superpowers:subagent-driven-development`
  (fresh implementer/task, cheapest tier when the plan carries full code; per-task spec+quality review; Opus
  whole-branch review at the end). Ledger namespaced `.superpowers/sdd/s11-*`; clean only your own at the end.
  Do your own grep cross-check for i18n parity / dead code / single-h1. (For a contained change, doing it
  directly with build+preview checkpoints — as in S10 — is acceptable given the slow-drive/single-preview cost.)
- **Gate:** local multi-model review panel (`/code-review` → `local-review`) on the session diff — do **not**
  pass `--free-ram` / `--quit-chrome` (Eston keeps Chrome open). The panel can't see i18n/SCSS files, so its
  "missing key" / "undefined class" / "wrong aria value" findings are often false positives — verify each
  against the actual files; lean on per-task + Opus reviews where it's noise.
- Repo is on a **slow external USB drive** — throttle to small sequential I/O; subagents avoid heavy parallel
  greps. The preview is a single shared browser — drive it one agent at a time.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence
  (origin/main is Ouri's real-server layer — landing `ui→main` stays his call, not a merge we run).
- Update project memory after the session.

When ready, ask Eston the three product decisions first (as one batched recommend-then-confirm), then verify
each item's premise against HEAD, then proceed P2 top-to-bottom (item 1 the pre-gate teaser/explainer is the
BLOCKER — do it first).

---

## After P2 — the remaining roadmap (for context, not this session)
- **P3** Evidence/expertise loop (submit-expert-review flow; Sources/citation fields on solution/write-together/
  comment composers; author-entered indicator metrics — today display-only).
- **P4** Mandate rigor (target + baseline + measurement cadence per indicator; turnout denominator "X of N
  eligible" + an explicit Sybil-resistance/verification statement; claimed-vs-verified org endorsements).
- **P5** Mission floor (low-bandwidth/offline mode; more UI locales incl. Chichewa; content-translation
  strategy — fixture text is English in every locale — coordinate with Ouri).
- **P6** Wave-1 debt (liquid delegation D3, the one named-but-missing core mechanism; Wave 1.5 refactor lanes).
- Human-gated, parallel: fr/sw native-speaker review (`docs/i18n-native-review-candidates.md` — now includes
  the S10 nav strings).
