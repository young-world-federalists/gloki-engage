# Session 28 — UI Polish Wave 5: kit-first normalization + spacing/touch floors

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 5 of
the UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md` §3 Wave 5; produced
2026-07-08). **State at prompt time (2026-07-11):** W1/W1b/W2/W3/W4 all SHIPPED + PUSHED; `ui` ==
`origin/ui` at `940b03a` (deploy run 29153336157). **Run `git status -sb` and `git log --oneline -12`
FIRST** and reconcile with MASTER_TODO §7 (campaign wave list) / §8 (changelog) before anything else —
W4 is the most recent wave; its `ContextCard`, mandate one-row actions, raised hero, and the two
inline mandate disclosures are live.

**This IS a build session:** re-ground → lock the open decisions with Eston → spec → build on `ui`
→ `tsc -b` → preview-verify 360px light+dark → adversarial whole-branch review → **Eston's explicit
push green light**. W5 is broad but low-conceptual-risk (mechanical kit swaps + floors) — the
campaign calls it "a natural single build session **with grep gates**." Some control labels may
change → **i18n discipline applies** (en/fr/sw parity + native packet; route via gloki-i18n-playbook)
— but many W5 changes are structural/CSS-only with no new strings.

## The goal (one sentence)
Replace hand-rolled controls with the shared kit and enforce the spacing/touch-target floors
app-wide in one mechanical sweep — so the app reads as one system and nothing silently re-invents a
wrong value.

## Scope — campaign §3 Wave 5 (re-verify EACH vs HEAD; line numbers WILL have drifted)
Three clusters. Treat each as a grep-gated sub-sweep.

- **Kit adoption** (replace bespoke markup with `src/components/shared` primitives):
  - `SegmentedControl` for the StartDraft Problem/Solution toggle (`StartDraftForm.tsx` ~60–75 —
    fixes the clashing box; mirrors `CollaborationFullView`) + the `ThreadedDiscussion` sort control.
  - `<Button>` for `openBtn`/`openLink`/`createBtn`/`copyBtn` + the chat composer send. (NOTE:
    W4 already made the mandate copy button… no — verify: the mandate `copyBtn` in `MandateDocument`
    is still bespoke; the chat send in `SuggestionDmView`/`ChatTopic` is bespoke `.sendBtn`.)
  - `EmptyState` for the chat / members / currency empty+loading+error states.
  - `Card` for topic/member rows.
  - `ProgressBar` for `IdentityTrust`'s verify bar.
  - Share the ballot solution-card between `QVFlow` and `VotePreview` (one component, two consumers).
- **Spacing rhythm** (tokens + floors):
  - icon→label **8px (`$spacing-sm`) floor** across pills/chips/buttons/eyebrows (the pervasive 4px
    gap Eston flagged); icons via Button `leftIcon`/`rightIcon` (never as children — that collapses
    the gap into the label span, confirmed W4 in the Button API). Add a grep gate for `<Button>` with
    an SVG child (§5 rule 8).
  - card interior padding → **16px (`$spacing-lg`)** (§5 rule 5; W1b/W4 already did the page column +
    mandate cards — sweep the rest); unify engage-slot gaps (12 vs 16); single container `gap` over
    per-child margins (§5 rule 12); off-scale literals (`1.25rem`/`0.7rem`/`3rem`/`2px`/`72px`/`800px`)
    → tokens.
- **Touch / a11y floors:**
  - **44px min hit area on ALL interactive elements** (§5 rule 14, not just `<Button>`): collab ×
    (16px — enlarge AND un-nest it from its button, no nested interactives), chat send/textarea
    (→ the kit), mandate copy/chip/input (36–40px → 44). 
  - pair color with an always-visible label/icon for threshold-met, region bars, and the "Saved"
    confirmation (§5 rule 16).
- **Solution-card composition** (`SolutionsBoard.tsx`): fold commitments + evidence under one
  disclosure; cluster the icon actions; **verify the two progress bars stayed combined** (S15
  regression risk). Target **≤5 co-equal stacked blocks** (§5 rule 17 — the S15 principle; W4 applied
  it to the mandate via inline disclosures — reuse that inline-expand pattern, NOT `InfoDisclosure`
  which is a modal).

**Out of scope:** W6 (community chrome & collab polish). No new routes. No new shared primitive is
required (W5 is adoption of existing ones) — if a genuinely new shared control is needed, inventory
it in DESIGN_SYSTEM.md.

## Re-verify these premises vs HEAD (the S10–S27 lesson — 13 straight stale-premise catches, incl. W4's 3)
- `grep -rn "SegmentedControl" src/components/community/writeTogether/StartDraftForm.tsx` — is the
  Problem/Solution toggle still a bespoke box, or already migrated?
- `grep -rn "className={styles.openBtn\|openLink\|createBtn\|copyBtn\|sendBtn" src` — which bespoke
  buttons actually remain (W2 recolored `.openLink`; W4 left the mandate `copyBtn` + chat `.sendBtn`
  bespoke — confirm before assuming).
- `grep -rn "EmptyState" src/components/community/chat src/components/community/members` — are the
  chat/members empty states already on the kit?
- `grep -rn "leftIcon\|rightIcon" src/components/**/Button` usages vs `<Button>...<svg`/lucide as a
  child — find the actual icon-as-child offenders (don't assume the campaign's list is current).
- Composition budget: read `SolutionsBoard.tsx` whole — S15 recomposed it once; count the current
  co-equal blocks before planning a fold, and confirm the two progress bars are still combined.
- Spacing literals: `grep -rnE "[0-9]+px|[0-9.]+rem" src/components/**/*.module.scss` then subtract
  the sanctioned conventions (1px/2px/3px borders, 44px/40px/36px touch floors, focus `2px`,
  hairlines) — the real targets are off-scale color/spacing/font literals only.
- i18n: any changed control label (e.g. a toggle that becomes a SegmentedControl with new option
  labels) → parity scanner BEFORE and AFTER; most kit swaps reuse existing strings.

## Open decisions to lock with Eston (recommend-then-confirm, batched)
1. **Solution-card block reduction** (§6 #5): how aggressively to fold commitments/evidence under one
   inline disclosure — rec: one "Details" inline-expand holding evidence + commitments, keep the
   proposal title + vote affordance + author always open. **Eston's call on aggressiveness.**
2. **Header title-block top air** (§6 #6): `$spacing-xl` (24, generous) vs `$spacing-lg` (16, tighter)
   as the app-wide value — this is a global rhythm decision that W5's spacing sweep should apply once.
3. **Kit-swap visual regressions** — some bespoke controls were bespoke for a reason (e.g. the chat
   `.sendBtn` fixed-44px icon box undid a global button reset, S18 W1). Confirm the swap-or-keep line
   where a kit component would regress a documented fix.

## Read first
- `docs/ui-polish-campaign-2026-07.md` §3 Wave 5 + §5 rules 5/7/8/9/12/14/16/17 + §6 taste calls 5/6.
- `DESIGN_SYSTEM.md` — the Button API (leftIcon/rightIcon), the kit inventory (incl. the new
  ContextCard), the page-column + card-chin + disclosure primitives; §5 rules go here if extended.
- Memory: `project_session27_jul2026` (W4 — ContextCard + mandate disclosures + the inline-expand
  pattern to reuse), `project_session25_jul2026` (chin), `project_session24_jul2026` (page-column +
  dark-authoring rule), `project_ui_polish_campaign_jul2026`.
- Skills: gloki-change-control, gloki-session-lifecycle, gloki-refactor-and-dead-code (kit swaps
  delete bespoke CSS — trace consumers), gloki-i18n-playbook (only if labels change),
  gloki-verification-and-qa, gloki-frontend-architecture.

## Workflow + constraints (S1–S27 discipline)
Brainstorm → spec (`docs/superpowers/specs/2026-07-<dd>-w5-kit-floors-design.md`) → plan → build;
docs commits BEFORE feat commits; small commits, `ui` runnable each; slow-drive I/O rules (read
sequentially; subagents sequential; only the controller drives the ONE preview); tokens only (no
ad-hoc values); deleting bespoke CSS is its own `chore` commit with a consumer-graph check. Verify:
`npx tsc -b`; preview 360px light+dark (reload after colorScheme flip); the **grep gates** are the
W5 acceptance evidence (icon-as-child = 0, off-scale literals = 0 in swept files, sub-44px
interactives = 0); i18n parity scan if any label changed; one h1 + one AppHeader per route. Review:
adversarial whole-branch (Workflow fleet on Opus — the Fable-5 rate limit killed the S26 first run;
verify findings, "no verdict" ≠ refuted; a clean 0-findings result still gets independent grep
gates). **Push = production deploy — Eston's explicit yes required.** PR #20 ✗ = expected
Ouri-divergence, not a failure. Close per gloki-session-lifecycle §8 (flip §7 W5, §8 changelog, i18n
packet section if strings changed, memory, session-29 W6 prompt).
