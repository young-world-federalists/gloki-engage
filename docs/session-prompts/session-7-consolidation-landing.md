# Session 7 kickoff — Consolidation: land the roadmap, pay down deferred debt, hand the seam to Ouri

> Paste this into a fresh Claude Code session in the Communities2 repo (branch `ui`) to start Session 7. **The 6-session design-consistency + pipeline-redesign roadmap is COMPLETE and deployed on `ui`** (S1 design-system → S2 problem card/discussion → S3 Write-together → S4 solutions+commitments spine → S5 vote card carry → S6 mandate consume). This is NOT another roadmap session — it's a consolidation/landing pass over what the six sessions deliberately left behind.

---

You're picking up **Session 7 — consolidation**. Read these first (they carry the full history and every deferred item):

- Project memory: `project_consistency_pipeline_redesign_jun2026` (the per-session detail + the "STILL DEFERRED" lists) and the `MEMORY.md` index line. Also `project_card_redesign_jun2026`, `project_hierarchy_a11y_review_jun2026`.
- `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`.
- The S6 spec/plan as the most recent reference: `docs/superpowers/specs/2026-06-28-session-6-mandate-card-consume-spine-design.md`, `docs/superpowers/plans/2026-06-28-session-6-mandate-card-consume-spine.md`.
- `docs/i18n-native-review-candidates.md` (the accumulated fr/sw strings flagged for a native pass).

**This is mostly judgment + cleanup, not new creative UI.** Start by deciding scope WITH Eston (see "Pick the focus" below) — one question, recommend-then-confirm — then for any code-touching work go spec → `superpowers:writing-plans` → `superpowers:subagent-driven-development`. A pure dead-code/debt sweep may not need a full brainstorm, but confirm the scope and the "is this really dead?" calls with Eston before deleting anything.

## Pick the focus (resolve with Eston at kickoff)
Four candidate workstreams, roughly in value order. Recommend bundling **A + B + C** into one consolidation session (they're related and all touch the same "finish the redesign" goal), and doing **D** separately or async:

- **A — Land the roadmap: merge `ui` → `main` (PR #20).** All six sessions have accumulated on `ui`; PR #20 (ui→main) shows ✗ vs `main` (expected divergence, not a build failure). The natural milestone is to reconcile and land the whole redesign to `main`. ⚠️ Confirm with Eston FIRST — this is the outward-facing merge to the production branch; check what else lives on `main`, whether anyone else is mid-flight, and whether a squash or merge-commit is wanted. Verify a clean `npm run build` on the merge result before landing.

- **B — Dead-code / debt sweep** (carried across S2–S6, all non-blocking, all marked "leave-dead-code" at the time so they wouldn't bloat a feature PR — now is the time):
  - The dormant deliberation pieces no longer rendered after S2/S3: `PositionsBoard`, `AnchoredThread`, `ParticipationMeter`, `CoPresenceBar` + their contract/api methods + the `PRESENCE_*` fixtures (`DELIBERATION_PARTICIPANTS` / `PRESENCE_NOW` / `PRESENCE_TICKER`). Confirm each is truly unreferenced (grep) before removing; some helpers like `deliberationParticipant` were still used by other code in S3 — verify.
  - `DiscussionFlow.module.scss` dead CSS (~375 lines; the wrapper uses ~3 classes).
  - Borderline `.liked` like-count AA contrast ($error ≈ 3.95:1 — light/dark tension, deferred in S2).
  - The small S6 Minors: `useMandate`'s unused `loading`/`derived` (decide: wire a loading state, or drop them); the stale-flash-on-`initiativeId`-change reset (unobservable with one seeded mandate — add the `null` reset only if it's cheap); the label-only-indicator `<dt>`-without-`<dd>` pattern in `MandateDocument` (a11y — only if you want to restructure to a non-`<dl>` element).

- **C — Consolidate the FOR-OURI seam hand-off into one doc.** Across S2–S6 the UI added/relied on contract methods documented inline with `// FOR OURI`. Gather them into a single hand-off (e.g. `docs/FOR_OURI_seam.md`) so the backend dev can implement the real contracts: `like_comment` (S2); `set_statement` + optional `co_authors` on `add_proposal`/`proposeCandidateIssue` + the `wtdraft_<id>` JSON draft-registry-as-property (S3 — flag: production wants a dedicated draft-registry contract, not community props); the `approval.ts` spine — `add_proposal(+commitments)`, `request_expert_review`, `add_expert_review(metrics,note?)`, `suggest_proposal_merge`, and the `Proposal` fields `commitments`/`expertReviewRequests`/`expertReviews[].metrics`/`mergeSuggestions` (S4); the client-side vote lock (non-empty `get_my_allocation`) + 75% turnout derivation (S5); the `useMandate` read path — `qv.getResults` winner + `approval.getProposals` join, no new methods (S6). **Critical seam rule to preserve in the doc:** UI contract method/field names MUST match Ouri's real contract exactly (`addProposal`/`proposal_id`/`get_results` etc.) — "solution"/"mandate" are presentation vocab only.

- **D — Native-speaker i18n review.** `docs/i18n-native-review-candidates.md` has accumulated fr + sw strings across all six sessions, including specific S6 flags (sw `'Tazama chache'` for "View less", sw jurisdiction `'Mamlaka'` = authority-vs-territory nuance, fr apostrophe/phrasing). This needs an actual fr/sw speaker, not a model — so scope it as "prepare the review packet + apply confirmed corrections," not "guess better translations."

## Workflow + constraints (same discipline as S1–S6)
- **Branch `ui`, keep it runnable.** Stay behind `src/services/api.ts`; never call a real server from a component. Demo seam emits no `contract_write` events → re-fetch after writes.
- **Tokens only**; reuse the kit + `UserIdentity` + `CountryPresence`; **360px flagship, verify light + dark.** AA gates per `DESIGN_SYSTEM.md`.
- New/changed user-facing strings ship at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys, en inline via `t('key','English')`); run the parity check (`diff <(grep -oE "'[a-zA-Z0-9_.]+':" fr.ts|sort -u) <(… sw.ts …)` → empty) + a code-ref↔i18n cross-check after any i18n change.
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via build + the `preview_*` tools (dev server `gloki-dev`, port 5173) at 360px. **The preview MCP is project-scoped** — if your session cwd isn't the Communities2 repo, you'll need a `.claude/launch.json` whose command `cd`s into the repo before `npm run dev` (a bridge, removed after).
- For any **dead-code removal**, the safety check is: grep confirms zero references AND `npm run build` stays clean. Removing an unused export won't fail `tsc`, so don't trust the build alone — grep first, and be suspicious of helpers shared across files.
- If any demo data changes, **bump `DEMO_VERSION`** (`src/services/demo/mockApi.ts`; S6 ended at `global-v11`; next is `v12`).
- Execute **subagent-driven** for any multi-file code work (fresh implementer per task — cheapest tier when the plan carries full code, mid-tier for integration/judgment; per-task spec+quality review; an **Opus whole-branch review** at the end). Track a ledger (`.superpowers/sdd/s7-*` — note S1–S6 left stale `.superpowers/sdd/` artifacts; namespace yours `s7-`). For i18n parity + dead-code prune do your own grep cross-check.
- **Gate:** run the local multi-model review panel (`/code-review` → `local-review` skill) on the session diff — **do NOT pass `--free-ram`/`--quit-chrome`** (Eston keeps Chrome open). NOTE from S5/S6: it often comes back zero-coverage or false-positives-only (no `GEMINI_API_KEY` in `.env`; the local Ollama models RAM-skip when Jellyfin is transcoding, and the small models misread deleted diff lines as live bugs) — if so, say so and lean on the per-task + Opus whole-branch reviews (Eston accepted this in S5/S6). **Confirm the merge/deploy with Eston before pushing.** PR #20's ✗ vs `main` is expected divergence, not a build failure.
- Update project memory after the session.

When ready, ask Eston the scope question first (which of A/B/C/D, or the recommended A+B+C bundle), then proceed. The redesign is built and shipped — this session is about landing it cleanly and leaving the codebase and the backend hand-off tidy.
