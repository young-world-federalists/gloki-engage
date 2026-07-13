# S30 Wave A — card anatomy: execution plan

Design: [specs/2026-07-13-card-anatomy-design.md](../specs/2026-07-13-card-anatomy-design.md).
Mode: **direct execution + checkpoints** (tight coupling, single shared preview — not subagent fan-out).
Each task ends `ui` runnable + `npx tsc -b` + `npm run build` green + grep gates.

| # | Task | Files | Verify |
|---|---|---|---|
| 1 | A-1 stage-strip gutter | `InitiativeStageCard.module.scss` (`.stageNavRow` base `$content-gutter` + mobile `$spacing-md`) | build; strip insets match `.metaLine` at 360px en/fr/sw |
| 2 | A-2 de-buttonize current pill | `InitiativeStageStrip.module.scss` (drop `.current` bg+border, light 60-63 + dark 72-75) | build; "current" legible vs "done", light+dark |
| 3 | A-3 bar→kit + A-4 hint caption | `ProblemVoteFlow.tsx/.scss` (ProgressBar + `.thresholdCaption`, delete 3 bespoke classes), `ProblemEngage.tsx/.scss` (drop floating hint + `up` prop + `.thresholdHint`), call sites drop `up=`: `ProblemActivityCard.tsx`, `FeedEngagePanel.tsx`, `InitiativeStagePanel.tsx` | build; no gray line, green-at-threshold, ARIA; seed member to render live |
| 4 | A-5 chinExtras + move suggest/code | NEW `ProblemChinExtras.tsx/.scss`; `InitiativeStageCard.tsx` (slot + chin `flex-start`); `ProblemActivityCard.tsx`/`FeedEngagePanel.tsx`/`InitiativeStagePanel.tsx` (render extras); slim `ProblemEngage.tsx/.scss` (drop code/suggest + `hostServer/hostAgent/authorKey/authorName` + call sites); +1 key `card.suggestToAuthorShort` (fr/sw+packet) | build; **screenshot chin @360px light+dark en/fr/sw → Eston (D3)** before finalizing |
| 5 | A-5.2 stage-feed chin tint + D4 | `StageFeedView.tsx/.scss` (`.summary` wrapper, card `padding:0;overflow:hidden`), `FeedEngagePanel.tsx/.scss` (`.body` wrapper, chin full-tint, comment update, `.openLink`→pill) | build; **S20 ::after still toggles**; chin tint parity community↔stage-feed; screenshot |
| 6 | DESIGN_SYSTEM codification | `DESIGN_SYSTEM.md` (chin law, strip gutter, §1.3 reversal note) | docs-only |

Wave close: full preview walk (spec §5) → Opus whole-branch review → hold push for Eston →
closeout (MASTER_TODO §7/§8, i18n packet S30 section, memory, S31 prompt for Waves B+C).

Risk watch: task 5 is the fragile one (::after hit-area, chin bleed). Task 4's chin composition is
empirical — verify the 360px wrap and show Eston, don't assume the row split.
