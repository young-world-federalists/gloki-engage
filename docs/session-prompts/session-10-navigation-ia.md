# Session 10 — Navigation & IA (P1)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). The whole redesign arc
(Wave 1 → UX-overhaul → the S1–S6 consistency/pipeline roadmap → S7 consolidation → S8 Minors + i18n packet →
**S9 P0 pilot-readiness**) is **complete and deployed** on `origin/ui` (S9 @ `8e4f076`, Pages green). The
build-ordered roadmap lives in `MASTER_TODO.md` §7; the findings that drive it are the **2026-06-29
nine-persona review** (§8). **This session is P1 — Navigation & IA**: the coherent nav unit that lets a user
*follow one idea through its stages*. It is implementation work (spec → plan → build) on the stub layer. Not a
redesign of surfaces — a fix to how they connect.

## Why this is next
P1 directly answers the review's **second-most-cited blocker (4 of 9 personas):** the stage-footer reads as
next-step nav and breaks single-issue tracing, the footer omits Discussion (the guide teaches 5 stages, the
footer shows 4), and tapping a Home/feed card drops the user on a generic feed instead of the item they
tapped. P0 made the back half *reachable*; P1 makes it *navigable* — you can follow one initiative from
problem → discussion → solutions → vote → mandate without losing your place.

## Read first (carry the context)
- `MASTER_TODO.md` §1–2 (the two north-stars + the Voices-for-the-Climate mission — esp. north-star #1
  "follow one idea through its stages" and #2 "felt transnational collaboration"), §7 **P1** (the exact 4
  items + severities), §8 (the 2026-06-29 changelog — the stage-footer / Home-tap convergence).
- Project memory: `project_session9_jun2026` (P0 — what's now reachable + the per-community gate mechanism),
  `project_persona_review_jun2026` (the P0–P6 roadmap + the nav findings), `project_hierarchy_a11y_review_jun2026`
  (the 5 redesign primitives incl. **AppHeader** + **StageStrip**), `project_card_redesign_jun2026`
  (the `InitiativeStageCard` Read/Engage card model — relevant to "open in focus"), and the `MEMORY.md` index.
- `CLAUDE.md` — the **Routing** block is the spine of this session: `/` HomeView, `/stage/:stageId`
  StageFeedView (the global StageFooter), `/community/:id/...`, `/initiative/:host/:agent/:cid/:iid/*`
  InitiativeView → InitiativeDashboard, `/initiative/.../discussion` DiscussionStageView. Plus the branch
  model + seam rule.
- `DESIGN_SYSTEM.md` — tokens, AA, the shared primitives (**StageStrip**, AppHeader, Banner-role).

## Open with one IA decision (recommend-then-confirm)
The two footer-related items are coupled and rest on an IA framing only Eston can lock. Today there is a
**global stage footer** (`StageFooter` → `/stage/:stageId`, browse-by-stage) AND a per-initiative sense of
stage. The personas read the global footer as "next step in THIS initiative," which it isn't.
**Confirm the framing with Eston before touching nav:** the recommended split is —
1. the **per-initiative stage strip** (the `StageStrip` primitive inside the initiative dashboard) becomes the
   *follow-this-initiative* control (active stage tracks the open initiative, tapping a stage moves within
   that initiative), and
2. the **global footer** is relabelled/visually demoted to **"Browse by stage"** (a cross-community discovery
   shelf), clearly NOT next-step nav.
Also confirm whether the global footer should remain a persistent bottom bar or become a lighter entry point.
Everything else in P1 is unambiguous; proceed once the framing is set. (Surface this as ONE batched
recommend-then-confirm at the start — don't interrupt mid-build.)

## Scope — P1 (see MASTER_TODO §7 for the canonical list)
1. **[MAJOR] Per-initiative stage strip follows the active initiative.** The `StageStrip` in the initiative
   dashboard should reflect the open initiative's current stage and let the user move *within that
   initiative's* pipeline. Relabel/visually separate the **global** stage footer as "Browse by stage" so it no
   longer reads as next-step nav for the initiative you're in.
2. **[MAJOR] Discussion is a first-class stage in the footer/strip.** The guide + pipeline teach 5 stages
   (problem · discussion · proposals/solutions · vote · mandate) but the footer shows 4 — add Discussion so
   the taught model and the nav match. (Discussion route already exists: `/initiative/.../discussion`,
   `DiscussionStageView`.)
3. **[MAJOR] Tapping a Home/feed card opens that item in focus.** Stop dropping users on a generic feed —
   a tapped card should open *that initiative* at the relevant stage (reuse the `InitiativeStageCard`
   Read/Engage model / the in-focus route, don't invent a new surface). Verify across HomeView, StageFeedView,
   and any problem/solution/vote/discussion card.
4. **[MINOR] Wire the dangling links to their real targets.** The mandate **"View full"** and the provenance
   **"Vote"** link currently point at the global stage instead of the specific initiative's mandate/ballot —
   route them to the real per-initiative targets.

> Two cross-references: **"open in focus" (item 3)** should reuse the card model from
> `project_card_redesign_jun2026` (don't build a parallel detail surface); and the **stage taxonomy** must stay
> consistent with the app-wide **Proposals→Solutions** rename already shipped (Wave hierarchy review) — the
> footer/strip labels say "Solutions", the contract method names stay `addProposal`/`proposal_id` (by design,
> see `project_consistency_pipeline_redesign_jun2026`). Don't "fix" that mismatch.

## Workflow + constraints (same discipline as S1–S9)
- Branch `ui`, keep it runnable. Stay behind `src/services/api.ts`; never call a real server from a
  component. The demo seam emits **no `contract_write` events** → re-fetch after writes.
- **Tokens only**; reuse the kit + the 5 redesign primitives (**AppHeader / InfoDisclosure / StageStrip /
  CountryMultiSelect / Banner-role**) + `UserIdentity` + `CountryPresence`. 360px flagship; verify **light +
  dark**; **AA gates** per `DESIGN_SYSTEM.md`. Respect reduced-motion (token-pure) on any stage-transition
  animation.
- **Single `<h1>` per route** and the landmark/skip-link structure from the hierarchy review must survive any
  nav change — routing changes are the easiest way to regress this; re-check the a11y snapshot on every
  touched route.
- New/changed strings at **fr + sw key parity** (`src/i18n/fr.ts` + `sw.ts`, flat dotted keys, en inline via
  `t('key','English')`; foundation keys live in `en.ts`). Run the parity check (sorted-key diff empty) + a
  code-ref↔i18n cross-check after any i18n change. New/changed fr/sw strings → append to
  `docs/i18n-native-review-candidates.md` (still human-gated).
- **No DEMO_VERSION bump unless you change demo fixtures.** P1 is mostly routing/nav wiring; if you only touch
  components + routes, leave `DEMO_VERSION` at `global-v13`.
- **Production build runs `tsc -b`** — `npm run build` clean before each commit. No test framework: verify via
  build + `preview_*` tools (`gloki-dev`, port 5173) at 360px. **Heads-up from S9:** preview automation is
  finicky for focus/post/transition flows — synthetic clicks don't reliably move focus; budget for the
  controller to take over preview verification on nav-focus checks, and lean on code-correctness reasoning +
  targeted snapshots where automation stalls.
- For multi-file changes use spec → `superpowers:writing-plans` → `superpowers:subagent-driven-development`
  (fresh implementer/task, cheapest tier when the plan carries full code; per-task spec+quality review; Opus
  whole-branch review at the end). Ledger namespaced `.superpowers/sdd/s10-*`; clean only your own at the end.
  Do your own grep cross-check for i18n parity / dead code / single-h1.
- **Gate:** local multi-model review panel (`/code-review` → `local-review`) on the session diff — do **not**
  pass `--free-ram` / `--quit-chrome` (Eston keeps Chrome open). NOTE from S9: the panel can now run with FULL
  coverage (GEMINI_API_KEY is in `.env`), but it can't see the i18n/SCSS files, so its "missing key" /
  "undefined class" / "wrong aria value" findings are often false positives — verify each against the actual
  files before acting; lean on per-task + Opus reviews where it's noise.
- Repo is on a **slow external USB drive** — throttle to small sequential I/O; subagents avoid heavy parallel
  greps. The preview is a single shared browser — drive it one agent at a time.
- **Confirm any push to `origin/ui` with Eston first.** PR #20's ✗ vs `main` is expected divergence
  (origin/main is Ouri's real-server layer — landing `ui→main` stays his call, not a merge we run).
- Update project memory after the session.

When ready, ask Eston the footer/stage-strip IA framing decision first (as one batched recommend-then-confirm),
then proceed P1 top-to-bottom (items 1→4; the two footer items are coupled — do them together).

---

## After P1 — the remaining roadmap (for context, not this session)
- **P2** Trust/privacy/consent depth (pre-gate ballot teaser + "how this vote works" explainer; vote-visibility
  + pseudonym; real consent step; drop full public key from shareable URLs).
- **P3** Evidence/expertise loop (submit-expert-review flow; Sources/citation fields; author-entered metrics).
- **P4** Mandate rigor (target+baseline+cadence per indicator; turnout denominator + Sybil statement).
- **P5** Mission floor (low-bandwidth/offline; more UI locales incl. Chichewa; content-translation strategy).
- **P6** Wave-1 debt (liquid delegation D3; refactor lanes).
- Human-gated, parallel: fr/sw native-speaker review (`docs/i18n-native-review-candidates.md`).
