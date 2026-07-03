# Session 17 — S16 fix tail, then freeze for the handoff

**Written 2026-07-03 at the close of S16 (local `ui`, S16 commits `0cb1e03..` unpushed —
if Eston green-lit the push since, they're on `origin/ui`). Goal owner: Eston.**

## Mission

Close the small remaining findings from the S16 review campaign, run the optional persona
sample, and freeze: after this session the `ui` branch should be the thing Ouri derives
`new-features` from. **No new features. No scope growth.** Anything not on the list below
goes to MASTER_TODO §7 "Post-handoff".

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle` (gates), then
   `gloki-verification-and-qa` (instruments).
2. `docs/superpowers/specs/2026-07-03-s16-ui-review-findings.md` — the findings log this
   session consumes (note the corrected false positives: bell pseudo-target, sr-only h1,
   flex-gap margins — measure before fixing, again).
3. MASTER_TODO §7 "Handoff-blocking".

## ⚠️ Re-verify these premises vs HEAD before building

| Premise (true at S16 close, `ui` local) | Check |
|---|---|
| S16 shipped: 4-stage strips + DiscussionPill; strips no longer contain `discussion` | read `src/components/initiative/InitiativeStageStrip.tsx`, `src/components/shared/StageStrip.tsx` |
| DiscussionPill exists at `src/components/initiative/DiscussionPill.tsx`, rendered from `InitiativeStageCard` panel | grep `DiscussionPill` consumers |
| Findings C4/C5, N3, N4, T5–T7, turnout phrasing still open | the findings log + a fresh measurement of each |
| `$primary-on-dark`, `$page-title-*`, `$heading-gap` tokens exist in `variables.scss` | `grep -n 'primary-on-dark\|page-title' src/styles/variables.scss` |
| Parity fr=sw=1120, gates clean, build green | Phase-0 commands |
| PR #20 ✗ = expected conflict, NOT a build failure | do not debug it |

## Work items (all small; measure first)

1. **C4/C5 contrast minors:** MandatePage "Machine-readable spec" caption (slate-500 on
   slate-100, 4.34:1) and the dark hero caption "N endorsing · M supporting" (slate-400 on
   blue-900, 4.04:1). Token-respecting fixes only.
2. **N3 duplicate titles:** CommunityView renders the AppHeader h1 AND a hero H2 with the
   same community name (MandatePage similar h1+h2 pair). Pick one visible owner per page
   (AppHeader already supports `titleVisuallyHidden` — likely the tool). Confirm the
   direction with Eston only if it changes what a user sees materially.
3. **N4 vote-card title:** the vote-stage activity card headlines the problem description;
   the initiative *title* never appears, and "Cast your vote" renders as plain text inside
   the card button. Recommend-then-confirm with Eston: add the title line to `StagePost`
   rendering vs accept the description-first design. (Data is available — HomeView's "Open
   votes" section shows the title.)
4. **T5–T7 touch minors:** "See all" (78×25), StageFooter items (~57×37), source-link
   chips (~19px). The bell's 44px `::after` pseudo-target is the house pattern; StageFooter
   may be a deliberate exception (fixed bar) — measure, then decide, then document.
5. **Turnout phrasing:** "84% of 75% needed" → plain language (e.g. "63% have voted · vote
   completes at 75%"). Keys live in the QV flow; en+fr+sw + packet append.
6. **Optional (budget-permitting): persona sample** — 3–4 personas from MASTER_TODO §5
   (suggest Thandiwe, Pascal, Tomás, James), sequential, controller-driven, 360px, as a
   final unaided-journey sample. File findings; fix only blockers.
7. **Closeout = the freeze:** §7 mark Handoff-blocking done; §8 entry; packet; memory;
   Opus whole-branch review; **Eston's explicit push green light** (push = deploy);
   then tell Ouri `ui` is ready to derive.

## Deferred — do not build in S17

Everything under MASTER_TODO §7 "Post-handoff" (D3 liquid delegation, Chichewa, content
translation, offline cache, WhatsApp, points, Wave-1.5 lanes) and §6.
