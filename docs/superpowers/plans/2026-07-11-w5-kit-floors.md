# Wave 5 — implementation plan (kit-first + floors)

Spec: `docs/superpowers/specs/2026-07-11-w5-kit-floors-design.md`. Session S28, branch `ui`.

**Execution mode: DIRECT (controller), not subagent fleet.** Rationale: cross-cutting CSS/token +
kit work with shared DS/preview; the slow-drive rule forbids parallel implementer subagents and the
controller must drive the one preview. Commits grouped **by file-cluster** so each file is touched
once. `ui` runnable + `tsc -b` clean after every commit. Reserve the Workflow fleet for the
end-of-session adversarial review (read-only).

## Commit sequence

| # | Commit | Files | Verify |
|---|---|---|---|
| 0 | `docs(s28): W5 spec + plan` | spec + this plan | — |
| 1 | `feat(s28): StartDraft mode toggle → SegmentedControl` | StartDraftForm.tsx/.scss | tsc; preview WriteTogether start; tag-reset side-effect still fires |
| 2 | `feat(s28): discussion sort → SegmentedControl + 8px gaps` | ThreadedDiscussion.tsx/.scss | tsc; preview a thread; sort works, actions unchanged |
| 3 | `feat(s28): stage-card open → Button; feed openLink gap` | InitiativeStageCard.tsx/.scss, FeedEngagePanel.tsx/.scss | tsc; preview a dashboard card (chin 2-control layout holds at 360px) + stage feed |
| 4 | `feat(s28): IdentityTrust verify bar → ProgressBar` (+1 i18n key) | IdentityTrust.tsx/.scss, en/fr/sw | tsc; preview IdentityTrust; bar identical, has accessible name |
| 5 | `feat(s28): SolutionsBoard — bars→ProgressBar, 4-block fold, 8px gaps, noData→EmptyState` | SolutionsBoard.tsx/.scss (+ i18n if Details key) | tsc; preview solutions board; **2 bars still combined**; card = 4 blocks; Details holds commitments+evidence |
| 6 | `feat(s28): chat cluster — EmptyState + Card + 44px send/textarea + gaps` | ChatTopic.tsx/.scss, ChatTopicList.tsx/.scss | tsc; preview chat topic + list (empty/error states, send 44px, topic rows) |
| 7 | `feat(s28): members — EmptyState + Card rows` then `chore(s28): drop dead .memberName/.section` | Members.tsx/.scss | tsc; preview members; grep dead classes = 0 refs before delete |
| 8 | `feat(s28): currency — EmptyState + 44px inputs + 8px gaps` | Currency.tsx/.scss | tsc; preview currency (3 empty states, send-payment inputs) |
| 9 | `feat(s28): collab createBtn — $primary-dark + 44px floor; empty→EmptyState` | CollabList.tsx/.scss | tsc; preview collab list; contrast AA in light+dark |
| 10 | `feat(s28): mandate copyBtn → Button (44px, 8px gap, label-swap preserved)` | MandateDocument.tsx/.scss | tsc; preview mandate; Copy→Copied label + live region intact |
| 11 | `feat(s28): ProblemEngage — Send icon via leftIcon (rule-8)` | ProblemEngage.tsx | tsc; icon-as-child gate = 0 |
| 12 | `feat(s28): QVFlow guideToggle 8px gap` (+ header top-air normalize if any deviant) | QVFlow.scss, AppHeader/others | tsc; preview vote flow header |
| 13 | `feat(s28): extract BallotSolutionCard (QVFlow ×2 + VotePreview)` | new shared cmp, QVFlow.tsx/.scss, VotePreview.tsx/.scss (+ barrel, DS inventory) | tsc; preview vote unvoted+voted+preview; stepper still 44px bespoke; dark bg reconciled |
| 14 | `docs(s28): DESIGN_SYSTEM (Button md=44, bespoke carve-outs, ProgressBar converged, 4-block) + i18n packet` | DESIGN_SYSTEM.md, i18n-native-review-candidates.md | parity scan clean |
| 15 | `docs(s28): closeout — §7 W5, §8 changelog, session-29 W6 prompt` | MASTER_TODO.md, next prompt | — |

## Per-commit gates
- `npx tsc -b` clean (the only CI). Deleting bespoke CSS: grep the class app-wide = 0 refs first.
- Preview 360px light+dark for any commit with a visible change (reload after colorScheme flip).
- Tokens only — no raw hex/px/rem/rgba; `$gray-400` text grep clean.
- i18n: `t('ns.key','English')` + en/fr/sw parity for the ~1-2 new keys.

## Risk register
- **#5 SolutionsBoard fold (D1):** commitments hidden by default — accepted; verify Details opens/closes,
  aria-expanded, and the 2 progress bars did NOT split.
- **#6 chat send swap:** must NOT re-inherit the global button reset; keep `padding:0`, bump box to 44.
- **#13 ballot card:** author-byline + dark-bg divergence. If review flags cost > benefit, ship 1-12
  and defer 13 to a follow-up (log in §7).
- **Card ≠ button:** clickable rows keep role/tabIndex/onKeyDown (Card renders div/li).
- **EmptyState needs a title:** loading states stay bespoke.

## Review + push
- After the build: adversarial whole-branch review (Workflow fleet, Opus — the Fable-5 rate limit
  killed S26's first run; verify findings, "no verdict" ≠ refuted). Clean 0-findings still gets the
  independent grep gates re-run.
- **Push = production deploy → Eston's explicit yes.** PR #20 ✗ = expected Ouri divergence.
