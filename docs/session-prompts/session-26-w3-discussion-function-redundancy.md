# Session 26 — UI Polish Wave 3: discussion-as-function + redundancy removal

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 3 of
the UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md` §3 Wave 3; produced
2026-07-08). **State at prompt time (2026-07-10):** S25/W2 card-chin BUILT + reviewed at
`a9a037e` + a closeout docs commit; **W2's push may or may not have happened — run
`git status -sb` and `git log --oneline -8` FIRST** and reconcile with MASTER_TODO §7/§8 before
anything else.

**This IS a build session:** re-ground → lock the open decisions with Eston → spec → build on `ui`
→ `tsc -b` → preview-verify 360px light+dark → adversarial whole-branch review → **Eston's explicit
push green light**. Unlike W1/W2, **this wave changes copy → full i18n discipline applies**
(en/fr/sw key parity + append the native-review packet; route via gloki-i18n-playbook).

## The goal (one sentence)
Kill every UI holdover that makes Discussion read as a 5th pipeline stage, and remove the duplicate
controls/back-arrows/labels the campaign flagged — WITHOUT adding a Discussion stage or feed
(locked: **Discussion is a function, not a stage**).

## Scope — campaign §3 Wave 3 (re-verify each vs HEAD; line numbers WILL have drifted)
- **3.1 Reframe DiscussionPill** (`DiscussionPill.tsx:65-67` at plan time): drop the "In discussion"
  status label/tone keyed on `post.stage==='discussion'`; always read "Discussion" (or "{n}
  discussing" — §6 taste #9, Eston's call). Keep the pill. NOTE: S25 W2 surfaced a related taste
  call — the pill's dark `$dark-border` boundary is ≈1.61:1 on the new chin fill (text 4.74:1 AA
  fine); if Eston wants it crisper, fold the border tweak into this reframe.
- **3.2 Remove the discussion stage badge** (`stageMeta.ts:14`, `InitiativeStageCard.tsx:100-105`).
- **3.3 Re-stage the sample feed + settings row** (`CommunityHome.tsx:30` SAMPLE_FEED s2 →
  `problem`/`proposals`; drop the CommunitySettings "Discussion" permission row).
- **3.4 Remove the duplicate discussion button on the Problem card** (`ProblemEngage.tsx:90-92` —
  keep the DiscussionPill + "Send suggestion to author").
- **3.5 Remove the duplicate on the Discussion card** (`DiscussionActivityCard.tsx` `onOpen`/
  `openLabel` ~99-100 — the active pill becomes the single entry). NOTE: S25 verified these lines
  exist at 04dcd1a-era HEAD; the chin now renders the openBtn, so removing `onOpen` leaves a
  pill-only chin — already the Solution/Vote cards' look.
- **3.6 Remove redundant back arrows** (`StartDraftForm.tsx:55-57`, `DraftEditor.tsx:100-107`) —
  header `onBack` made view-aware, or sub-views URL-addressable.
- **3.7 Dedupe vote explainers** (keep the at-ballot "how hearts work").
- **3.8 Dedupe "Send Support" + disambiguate support CTAs** (`Currency.tsx`, mandate CTAs; §6 taste
  #8 wording is Eston's call).

**Out of scope:** W4 context restoration (ContextCard), W5 kit sweep/floors, W6 chrome. Do NOT add
any Discussion feed/stage/route (locked IA). No DEMO_VERSION bump unless a fixture actually changes
(3.3 touches SAMPLE_FEED — that's a component constant, not the demo seam; verify before bumping).

## Re-verify these premises vs HEAD (the S10–S25 lesson — 11 straight stale-premise catches)
- `grep -n "In discussion" src -r --include='*.ts*'` — where the status label actually lives now
  (DiscussionPill active state + anywhere else).
- `grep -n "stage === 'discussion'\|'discussion'" src/components/initiative/DiscussionPill.tsx
  src/components/community/stageMeta.ts src/components/initiative/InitiativeStageCard.tsx` — the
  active-prop is passed from BOTH InitiativeStageCard and FeedEngagePanel (S25 touched both files;
  the chin now hosts the pill).
- `grep -n "openDiscussion\|onOpen" src/components/community/DiscussionActivityCard.tsx`.
- `grep -n "Discuss this problem" src -r --include='*.tsx'` (3.4 — confirm it still exists).
- Back arrows: read `StartDraftForm.tsx` + `DraftEditor.tsx` whole — S23's universal-back work may
  have already changed this (check memory `project_session23_jul2026` re history-pop back).
- Vote explainers: `grep -rn "VoteExplainer\|VotePreview" src --include='*.tsx'` — S11 built
  VotePreview; confirm which explainer is "the duplicate" at HEAD before deleting anything.
- i18n keys you'll touch: run the parity scanner (gloki-i18n-playbook) BEFORE and AFTER.

## Open decisions to lock with Eston (recommend-then-confirm, batched)
1. **Pill label after the reframe** (§6 #9): neutral "Discussion" + count (rec — quieter, function
   framing) vs "{n} discussing".
2. **Support-CTA wording** (§6 #8): e.g. "Add your support"/"Back this mandate" (individual) vs
   "Add your organization" (org); currency button → "Send".
3. **3.6 mechanism**: view-aware header onBack (rec — no new routes) vs URL-addressable sub-views.
4. **Pill dark border on the chin fill** (S25 leftover): keep as-is (rec — text carries AA; W3.1
   restyles the pill anyway) vs lighten the border app-wide.

## Read first
- `docs/ui-polish-campaign-2026-07.md` §3 Wave 3 + §5 items 10/20 (the rules this codifies) + §6
  taste calls 8–9.
- `DESIGN_SYSTEM.md` — the S25 "Card chin / footer" section (the pill now lives in the chin) +
  whatever §5-item-10 wordlist you add goes here.
- Memory: `project_session25_jul2026` (chin structure + pill contrast numbers),
  `project_ui_polish_campaign_jul2026`, `project_session23_jul2026` (universal back).
- Skills: gloki-change-control, gloki-session-lifecycle, gloki-i18n-playbook (copy changes!),
  gloki-verification-and-qa, gloki-refactor-and-dead-code (for the deletions — trace consumers).

## Workflow + constraints (S1–S25 discipline)
Brainstorm → spec (`docs/superpowers/specs/2026-07-<dd>-w3-discussion-function-design.md`) → plan →
build; docs commits BEFORE feat commits; small commits, `ui` runnable each; slow-drive I/O rules;
tokens only; deletions get `chore(s26)` commits with consumer-graph proof (grep the SYMBOL, not the
path). Verify: `npx tsc -b`; preview 360px light+dark (reload after colorScheme flip); i18n parity
scan; one h1 + one AppHeader per route. Review: adversarial whole-branch (Workflow fleet; verify
findings before trusting — "no verdict" ≠ refuted, the S25 lesson). **Push = production deploy —
Eston's explicit yes required.** PR #20 ✗ = expected Ouri-divergence, not a failure. Close per
gloki-session-lifecycle §8 (flip P7-W3, §8 changelog, i18n packet section, memory, session-27 W4
prompt).
