# Session 27 — UI Polish Wave 4: context restoration + mandate composition

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 4 of
the UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md` §3 Wave 4; produced
2026-07-08). **State at prompt time (2026-07-11):** W1/W1b/W2/W3 all SHIPPED + PUSHED; `ui` ==
`origin/ui` at `f0400e8` (deploy run 29143572642 green, live 200). **Run `git status -sb` and
`git log --oneline -8` FIRST** and reconcile with MASTER_TODO §7/§8 before anything else — W3 is the
most recent wave; its DiscussionPill/StageFeedView/HomeView/WriteTogether changes are live.

**This IS a build session:** re-ground → lock the open decisions with Eston → spec → build on `ui`
→ `tsc -b` → preview-verify 360px light+dark → adversarial whole-branch review → **Eston's explicit
push green light**. W4 introduces the reusable **ContextCard** primitive and touches mandate copy,
so **i18n discipline applies** (en/fr/sw parity + native-review packet; route via gloki-i18n-playbook).

## The goal (one sentence)
Give acted-on items their context back (the discussion/suggest pages must SHOW the item being acted
on), and compose the mandate actions/sections onto a coherent left edge with proper dark-surface
elevation — WITHOUT a long-scroll blow-up (progressive disclosure is a taste call, §6 #1).

## Scope — campaign §3 Wave 4 (re-verify each vs HEAD; line numbers WILL have drifted)
- **4.1 Discussion page shows the discussed item** (`DiscussionStageView.tsx` + InitiativeView
  pass-through): add a `summary`/`description` prop; render a shared **ContextCard** (title + body)
  between the AppHeader and the thread so the user sees WHAT they're discussing. NOTE (W3): the
  discussion page headline is already the initiative title (S23) with "Discussion — community" as the
  eyebrow — ContextCard adds the BODY/summary the headline can't carry. Confirm no double-title.
- **4.2 Fix discussion double-padding + title alignment** (`DiscussionStageView.module.scss`): drop
  `.main` horizontal padding so `.content` is the sole gutter (W1b `page-column` owns width+gutter —
  verify this isn't already fixed); align the title block; collapse doubled footer clearance.
- **4.3 Apply ContextCard to Suggest-to-author** (`SuggestionDmView.tsx`): same pattern — show the
  problem being acted on. (Campaign §7 notes SuggestionDmView was only shell-reviewed.)
- **4.4 Mandate: Show-support + Share on one row** (`MandateCard.tsx` + scss): drop `fullWidth`/
  `size="md"`; `.actions{display:flex;gap:$spacing-sm}` + support `flex:1` / share `flex:0 0 auto`.
  Holds at 360px. NOTE (W3): the support CTA is now **"Back this mandate"** (`mandate.card.showSupport`)
  — longer than the old "Show your support"; re-check the one-row fit at 360px in fr ("Soutenir ce
  mandat") too.
- **4.5 Mandate: unify the ragged left edge** (`MandatePage.tsx`): one card inset (`$spacing-lg`) for
  all four sections; drop the `$spacing-xl`/mobile asymmetry.
- **4.6 Mandate: dark-surface elevation** (`MandateDocument`/`RatificationPanel` scss): document +
  ratification cards use the page bg in dark → read flat. Raise to `$dark-bg` (verify token; W1
  added `$success-on-dark`/`$warning-on-dark` but check the surface-elevation token name).
- **4.7 Mandate: progressive disclosure** (taste — §6 #1, **Eston confirms before building**):
  recommended — collapse indicators/verification/full adopter list behind `InfoDisclosure`, keep
  hero + core commitments open. NOTE: `InfoDisclosure` is a MODAL (i)→dialog, NOT an inline
  accordion (S15 lesson) — for inline collapse of CONTENT use an expand pattern, reserve
  InfoDisclosure for prose/explainers. Decide the mechanism with Eston.

**Out of scope:** W5 kit sweep/floors, W6 chrome. No new routes. The **ContextCard** is a NEW shared
primitive → add to `src/components/shared/` + inventory it in DESIGN_SYSTEM.md (§5 rule 11 codifies
this pattern — "any sub-page that acts ON an item renders a ContextCard").

## Re-verify these premises vs HEAD (the S10–S26 lesson — 12 straight stale-premise catches)
- `grep -n "summary\|description\|ContextCard" src/components/collaboration/DiscussionStageView.tsx`
  — what the discussion page already renders between header and thread (W3 left the headline as the
  title; confirm there's no context body yet).
- `grep -rn "ContextCard" src` — confirm it does NOT already exist (campaign §5 rule 11 calls for it
  as new; don't rebuild if a prior wave added it).
- Mandate left-edge/insets: read `MandatePage.tsx` + `MandateCard.module.scss` whole — S23 touched
  the mandate identity page↔community mandate unification; W2 added the card chin; line numbers moved.
- `grep -rn "InfoDisclosure" src/components/mandate` — what's already disclosed vs flat.
- Dark tokens: `grep -n "dark-bg\|dark-surface\|dark-tint" src/styles/variables.scss` — confirm the
  elevation token before 4.6.
- i18n: any NEW ContextCard chrome strings + changed mandate copy → parity scanner BEFORE and AFTER.

## Open decisions to lock with Eston (recommend-then-confirm, batched)
1. **4.7 mandate progressive disclosure** (§6 #1): collapse secondary depth (indicators/verification/
   full adopter list) behind an inline expand, keep hero + core commitments open (rec) vs one long
   scroll. **Undecided at campaign time — Eston's call.** If yes, confirm inline-expand vs InfoDisclosure.
2. **ContextCard scope** (§5 rule 11): title + body only (rec — minimal, reusable) vs richer (stage
   badge, author, meta). Keep it a dumb presentational card.
3. **"Open the full item" affordance** (§6 #7): unify onto one Button variant (dashboard solid CTA vs
   stage-feed quiet link) or document the per-context difference? (Adjacent to W4; Eston's call.)

## Read first
- `docs/ui-polish-campaign-2026-07.md` §3 Wave 4 + §5 items 11/17/18 + §6 taste calls 1/7.
- `DESIGN_SYSTEM.md` — the page-column primitive (W1b), the card-chin section (W2), the
  disclosure/AppHeader primitives; §5-rule-11 ContextCard entry goes here.
- Memory: `project_session26_jul2026` (W3 — DiscussionPill/CTA state), `project_session25_jul2026`
  (chin), `project_session24_jul2026` (page-column + dark-authoring rule), `project_ui_polish_campaign_jul2026`.
- Skills: gloki-change-control, gloki-session-lifecycle, gloki-i18n-playbook (copy!),
  gloki-verification-and-qa, gloki-frontend-architecture (ContextCard placement + InitiativeView pass-through).

## Workflow + constraints (S1–S26 discipline)
Brainstorm → spec (`docs/superpowers/specs/2026-07-<dd>-w4-context-mandate-design.md`) → plan →
build; docs commits BEFORE feat commits; small commits, `ui` runnable each; slow-drive I/O rules;
tokens only (no ad-hoc values); new primitive gets a DESIGN_SYSTEM inventory entry. Verify:
`npx tsc -b`; preview 360px light+dark (reload after colorScheme flip) incl. fr for the mandate row
fit; i18n parity scan; one h1 + one AppHeader per route. Review: adversarial whole-branch (Workflow
fleet on Opus — the Fable-5 rate limit killed the S26 first run; verify findings before trusting,
"no verdict" ≠ refuted). **Push = production deploy — Eston's explicit yes required.** PR #20 ✗ =
expected Ouri-divergence, not a failure. Close per gloki-session-lifecycle §8 (flip §7 W4, §8
changelog, i18n packet section, memory, session-28 W5 prompt).
