# Session 20 — Campaign Wave 3: stage-feed inline expansion (D1)

**Written 2026-07-04 at the end of S19 (campaign W2). HEAD at write time: local `ui` @
`ddf3f4c` + S19 closeout docs (W2 push pending Eston's gate at S19 close — re-check). Goal
owner: Eston. Wave 3 of 4 from the S18 campaign; W4 (theme toggle + menu LanguageSwitcher)
stays deferred.**

## Mission

**D1 (Eston-directed, S18):** in the four global stage feeds (`/stage/problem|proposals|vote|
mandate`), replace the StageFeedCard tap-through-to-community with the community feed's
ActivityCards expanding IN PLACE for problem/proposals/vote. Mandate keeps navigating to the
published artifact; discussion stays per-post via the DiscussionPill. Scope: StageFeedView
only — ActivityCard + useAllInitiatives already carry the needed context (S18 D1 note).

Design intent: a visitor browsing "Vote" sees the same expandable card (now the S19-recomposed
4-block panel) without teleporting into a community they've never seen — the feed keeps its
compare-across-communities framing (north star 2).

## ⚠️ Re-verify these premises vs HEAD before building (they WILL rot)

| Premise (true at S19 close) | Check |
|---|---|
| S19 W2 pushed (or still local — affects your diff base) | `git status -sb`, `git log origin/ui..ui` |
| Stage feeds use compact tap-through cards ("Explore Gloki" CTA model, S-2026-06-22) | read `src/pages/StageFeedView.tsx` + walk `/stage/vote` |
| ActivityCard's expanded panel carries the full engage stack usable OUTSIDE CommunityView (contract context via `useAllInitiatives`) | trace ActivityCard props from `CommunityHome.tsx` vs what StageFeedView can supply |
| The engage panels deploy nothing on render for non-participants (S11 read-only rule: `resolveInitiativeStageContract`, never `useFlowContract`, in preview components) | grep `useFlowContract` consumers reachable from a feed card expand |
| StageFeedView title block: AppHeader title=stage, eyebrow="Browse by stage" (S19 D3) | view source / walk |
| Vote panel = 4 blocks / ≤2 surface depth (S19 M2) — regression bar for the feed-embedded variant | block-count eval on an expanded feed card |
| welcomeHints `qvGuide` governs the hearts explainer default | `grep -n qvGuide src -r` |

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle` + `gloki-verification-and-qa`
   (preview lore — note S19 addition: after flipping colorScheme, RELOAD before screenshots;
   `document.body` is the scroller, not window).
2. `docs/superpowers/specs/2026-07-03-s18-ui-campaign-findings.md` — D1 decision text.
3. `docs/superpowers/specs/2026-07-03-s19-w2-card-recomposition-design.md` — the recomposed
   card/panel this wave re-hosts.
4. Memory: `project_stage_feed_simplification_jun2026` (why tap-through exists today; the
   "gate that makes the demo SAFE makes it EMPTY" persona learning) and
   `project_session19_jul2026`.

## Workflow + constraints

- Docs-first spec+plan commits, then small runnable feat commits; `npx tsc -b` per chunk.
- The stage feed is CROSS-community: every expanded card must resolve its own community's
  contracts (per-card `communityId`/`initiativeId` context — no ambient CommunityView state).
  Watch the S13 wrong-layer trap: stage contracts register on the INITIATIVE contract.
- Read-only on expand for non-participants (S11): expanding a card must not deploy or join
  anything by itself.
- Trust-gate reality (S17/S9): unverified visitors will see StageGate previews, not ballots —
  that is correct behaviour, not a bug; don't "fix" it by weakening `canParticipate`.
- Mandate cards: keep navigation (decision D1) — a mandate is a published artifact page.
- No DEMO_VERSION bump unless fixtures change; wire names untouched; fr/sw parity for any new
  strings + packet append.
- Sequential subagents; controller owns the ONE preview browser; slow-drive I/O discipline.

## Open decisions to lock with Eston (batch, recommend-then-confirm)

1. **Collapsed-card density in feeds:** keep the current compact StageFeedCard summary as the
   collapsed state (recommend — it was designed for cross-community scanning) vs swap to the
   community ActivityCard summary for full visual unity.
2. **Discussion stage feed** (`/stage/…` has no discussion feed by IA law — but discussion-stage
   initiatives appear in Problem/Solutions gaps): confirm they render with DiscussionPill as
   their only engage (recommend) vs also inlining the co-authoring view (heavy).
3. **"Open in community" affordance** on expanded feed cards: keep a quiet link to the hosting
   community feed (recommend — preserves the old path for users who want context) vs drop it.

## Definition of done

problem/proposals/vote feed cards expand in place with the S19 4-block panel (measured ≤5
blocks/≤2 surface depth in-feed); mandate cards still navigate; no contract deploys on expand
for a fresh unverified visitor (network/log check); 360px light+dark en/fr/sw walk of all four
feeds; build/parity/gates green; whole-diff review 0 Crit / 0 Imp; **Eston's explicit push
green light**. Closeout: §8 changelog, packet, memory, W4 prompt (theme-toggle codemod scope:
297 `prefers-color-scheme` blocks / 104 SCSS files at S18 count — re-count, S19 changed
several).
