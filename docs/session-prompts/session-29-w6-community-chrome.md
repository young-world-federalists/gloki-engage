# Session 29 — UI Polish Wave 6: community chrome & collab polish (+ the W5 tail)

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`). This is **Wave 6 —
the LAST wave of the UI Polish & DS-Enforcement campaign** (`docs/ui-polish-campaign-2026-07.md` §3
Wave 6). **State at prompt time (2026-07-11):** W1/W1b/W2/W3/W4/W5 all SHIPPED. W5
(`786f5ba..651a1c9`, 17 commits) was BUILT + reviewed (0 blocker/0 major); **its push was pending
Eston's gate at prompt time** — so **run `git status -sb` and `git log --oneline -14` FIRST** and
reconcile with MASTER_TODO §7/§8 before anything else: confirm whether W5 landed on `origin/ui`, and
where HEAD is.

**This IS a build session:** re-ground → lock the open decisions with Eston → spec → build on `ui`
→ `tsc -b && vite build` → preview-verify 360px light+dark → adversarial whole-branch review →
**Eston's explicit push green light**. W6 is small but carries **taste + locked-model calls** (that's
why it was isolated last), so most of it is recommend-then-confirm. Some labels change →
**i18n discipline applies** (route via gloki-i18n-playbook).

## The goal (one sentence)
Fix the community-drawer reachability/sizing and the last collab artifacts so the community shell
reads as finished — then the UI-polish campaign is complete and `ui` is at its handoff-ready bar.

## Scope — campaign §3 Wave 6 (re-verify EACH vs HEAD; line numbers WILL have drifted)
| # | Item | File (verify) | Fix | Decision |
|---|---|---|---|---|
| 6.1 | "Menu" → "Community options", bigger | `CommunityCard.tsx` (+ i18n) | Rename (en/fr/sw + packet), rebalance the hero row so it isn't shrink-to-fit; `aria-haspopup="dialog"`. | copy + §6#3 |
| 6.2 | Shrink "Start an initiative" | `CommunityCard.tsx` | Rebalance vs the options button. | **§6#3 taste — Eston** |
| 6.3 | Remove the blue left-border test artifact | `CollabList.module.scss` (`.item` `border-left:3px solid $primary`, light + **dark** `border-left-color:$primary`) | Delete both; revert to uniform border. | mechanical |
| 6.4 | Drawer reachable on section pages | `CommunityView.tsx` | **Touches the locked single-AppHeader model** → approach is Eston's. | **§6#4 — Eston** |
| 6.5 | Collab `createBtn` contrast + max-width | `CollabList` | W5 already fixed createBtn AA (`$primary-dark` + dark `$primary-on-dark`) + 44px — **re-verify that's enough**; the `800px`→`$content-max-width` belongs to whatever ancestor still sets 800px (NOT CollabList `.container`, which is intentionally empty — S24). Grep for the real 800px owner. | verify + mechanical |
| 6.6 | Confirm collab header inherits the header law | (from W1) | "Climate Resilience Assembly" header padding should already be fixed — just verify at 360px. | verify only |

## The W5 tail (deferred from S28 — fold in if Eston wants, else leave in §7)
- **Currency cluster** — EmptyState for the 3 states + 44px input floors + 8px icon→label gaps.
  Entangled: `.stateMessage` is shared by 2 states; the no-funds empty is an `<li>` inside a `<ul>`
  (EmptyState renders a div — render as a sibling); the 44px `.inputField` rule is deeply nested (not
  reusable) — the send-payment select/input use the GLOBAL `.input-field` (no min-height). Decide
  whether to promote 44px into global `.input-field` (blast radius = every form) or a shared class.
- **Members rows → `Card`** — consistency-only; deeply-nested `.memberCard` surface + mobile + dark
  blocks. Strip bg/radius/shadow/border from `.memberCard`, pass `<Card as="article" padded={false}>`,
  keep layout + nested children; rows are non-clickable (do NOT pass `interactive`).
- **BallotSolutionCard extraction** — the highest-value dedup but a PARTIAL one: QVFlow's unvoted
  (hearts steppers + byline) and voted (yourVote + regbar + rescount, NO byline) states + VotePreview
  (read-only) share only solHead + solText + the commitments/metrics `<details>`. Extract one card
  owning the shared chrome with **optional slots** (`voteControl`, `results`, `showAuthor`); QV state
  stays in QVFlow; the stepper stays bespoke (S18-W1 44px reset). Reconcile the dark-bg token
  (`$dark-bg` QVFlow vs `$dark-surface` VotePreview). **Do it in a focused session with full preview
  verify of all 3 states** — the risk is in the voting core.

## Re-verify these premises vs HEAD (the S10-S28 lesson — 14 straight catches, incl. W5's 5)
- `grep -rn "border-left" src/components/community/CollabList.module.scss` — is the 3px `$primary`
  test artifact still there (light AND dark)?
- `grep -rn "800px\|\$content-max-width" src` — who actually sets 800px now? (NOT CollabList
  `.container` — S24 emptied it.) The §6.5 max-width fix targets the real owner.
- `grep -n "Menu\|community.menu\|Start an initiative\|aria-haspopup" src/components/community/CommunityCard.tsx`
  — current labels, hero-row flex weighting, and whether `aria-haspopup` is already set.
- CommunityView single-AppHeader model (§6#4): read how the drawer/options sheet is opened today
  before proposing reachability on section pages — do NOT add a second header or a left drawer
  (both are deleted + locked; see gloki-change-control locked list).
- W5 createBtn (§6.5): confirm the S28 AA + dark fix is present (`$primary-dark` light /
  `$primary-on-dark` dark, `min-height:44px`) so 6.5 is just the max-width owner.
- i18n: 6.1's rename ("Menu"→"Community options") changes a visible label → parity scan + packet.

## Open decisions to lock with Eston (recommend-then-confirm, batched)
1. **§6#3 hero-row balance** — enlarged "Community options" vs shrunk "Start an initiative": equal
   width, or primary (Start) still dominant? *Rec: keep Start dominant, just enlarge the options
   button to a comfortable tap target — it's a secondary affordance.*
2. **§6#4 drawer reachability on section pages** — inject the mini-app items into the global menu, vs
   a bottom-of-content affordance? *Touches the locked single-AppHeader model — Eston's call.* *Rec:
   global-menu injection (no second header), so the single-banner law holds.*
3. **W5 tail** — pull any of Currency / Members-Card / BallotSolutionCard into this session, or leave
   deferred? *Rec: BallotSolutionCard as its own session; Members-Card is a quick safe win if time;
   Currency needs the global-input-field decision first.*

## Read first
- `docs/ui-polish-campaign-2026-07.md` §3 Wave 6 + §6 taste calls 3/4.
- `DESIGN_SYSTEM.md` — Buttons "when to keep bespoke" (§237-258, W5-extended), the single-AppHeader /
  one-h1 law, the header-gutter law, the page-column primitive.
- Memory: `project_session28_jul2026` (W5 — the D3 keep-bespoke line + the dark-authoring trap +
  deletions leave orphaned dark overrides), `project_ui_polish_campaign_jul2026`,
  `project_session24_jul2026` (page-column), `project_community_page_restructure_jun2026`.
- Skills: gloki-change-control (single-AppHeader + deleted-left-drawer are LOCKED — 6.4 must not
  violate them), gloki-session-lifecycle, gloki-i18n-playbook (6.1 label change),
  gloki-verification-and-qa, gloki-frontend-architecture (CommunityView drawer/options mechanics).

## Workflow + constraints (S1-S28 discipline)
Brainstorm → spec (`docs/superpowers/specs/2026-07-<dd>-w6-community-chrome-design.md`) → plan → build;
docs commits BEFORE feat commits; small commits, `ui` runnable each; slow-drive I/O (read sequentially;
only the controller drives the ONE preview; read-only Workflow review/inventory fleets are fine —
mutating implementer subagents stay sequential). Tokens only. Deleting bespoke CSS is its own `chore`
with a consumer-graph check — **and grep the `@include dark` block too** (W5's review caught 2
orphaned dark overrides that a base-selector sweep missed). Verify: `tsc -b && vite build`; preview
360px light+dark (reload after colorScheme flip; **the dark walk is where contrast regressions
surface** — measure any `$token`-on-tint text); i18n parity if any label changed; one h1 + one
AppHeader per route. Review: adversarial whole-branch (Workflow fleet on Opus — refute-by-default;
"no verdict" ≠ refuted; clean result still gets independent grep gates). **Push = production deploy —
Eston's explicit yes required.** PR #20 ✗ = expected Ouri-divergence. Close per gloki-session-lifecycle
§8 (flip §7 W6 + mark the **campaign COMPLETE**, §8 changelog, i18n packet if strings changed, memory,
and — since W6 is the last wave — a handoff-readiness note rather than a session-30 prompt).
