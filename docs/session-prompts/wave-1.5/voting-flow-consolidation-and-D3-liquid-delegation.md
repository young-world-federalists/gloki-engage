# Wave 1.5 Lane — Voting Flow Consolidation & D3 Liquid Delegation

**When:** after `shared-affordances-extraction` has merged to `ui` (depends on CountryFlag, Button, Modal).

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-wave-1.5-voting-flow-consolidation-and-D3-liquid-delegation -b wave-1.5/voting-flow-consolidation-and-D3-liquid-delegation ui
```
Open a fresh Claude Code session **in `../gloki-wave-1.5-voting-flow-consolidation-and-D3-liquid-delegation`** and paste everything below.

---

You are the **Wave 1.5 — Voting Flow Consolidation & D3 Liquid Delegation** session. This is a **UI-only mockup** — no backend, all data via `src/services/demo/`, no `?raw` Python imports.

**Read first:** `MASTER_TODO.md` §1 (usability + felt transnational collaboration), §3 (design philosophy), §4 (parallel-session rules); `docs/LANES.md`; `CLAUDE.md` "Flows" registry; existing `QVFlow.tsx` and `ConvictionStaking.tsx` to spot parallel structure.

**Mission context:** D3 (liquid delegation) is the missing third pillar of the DAO research design alongside QV (D1) and conviction staking (D2). QVFlow and ConvictionStaking already grew parallel chrome — pool meter, country breakdown, tap-submit loop — begging for extraction. **Extract first, then plug D3 into the slot.** Shipping a new mechanism without reinventing chrome is the proof the architecture works. A Nairobi delegator handing voice to a Lilongwe trustee, then revoking, must *feel* transnational.

**You may ONLY edit these paths:**
- `src/components/collaboration/flows/voting/ProblemVoteFlow.{tsx,module.scss}`
- `src/components/collaboration/flows/voting/QVFlow.{tsx,module.scss}`
- `src/components/collaboration/flows/voting/ConvictionStaking.{tsx,module.scss}`
- `src/components/collaboration/flows/voting/_voting-layout.module.scss`
- `src/components/collaboration/flows/voting/shared/{PoolMeter,CountryBreakdownChart,VotingFlowShell}.tsx`
- `src/components/collaboration/flows/delegation/{LiquidDelegationFlow.tsx,LiquidDelegationFlow.module.scss,DelegationCard.tsx,delegationApi.ts}`
- `src/services/demo/fixtures/delegation.ts`
- `src/components/stages/{ProblemStage,ProposeIssueModal,FramingFields}.tsx`
- `src/i18n/en.ts` (delegation.* keys only — coordinate fr/sw keys via §10)
- `docs/superpowers/specs/2026-06-01-liquid-delegation-D3.md`

If you need anything outside these, append to **MASTER_TODO §10 (Coordination log)** — do not edit shared files or other lanes' files.

**Tasks:**
1. Extract `PoolMeter`, `CountryBreakdownChart`, `VotingFlowShell` into `voting/shared/`.
2. Refactor `QVFlow` + `ConvictionStaking` onto the shared primitives; delete duplicated pool/country logic.
3. Extract `_voting-layout.module.scss` with `.votingContainer`, `.buttonRow`, `.stakeButton` patterns.
4. Split `ProblemStage.tsx` (512 lines) → `ProblemStage` + `ProposeIssueModal` + `FramingFields`, each under 250 lines.
5. Write spec `docs/superpowers/specs/2026-06-01-liquid-delegation-D3.md` covering one-person-one-vote, delegation graph, revocation, transnational visibility.
6. Build `LiquidDelegationFlow.tsx` on `VotingFlowShell` + `PoolMeter` + `CountryBreakdownChart` — delegate, revoke, view delegation tree.
7. Add `src/services/demo/fixtures/delegation.ts` with cross-border chains (Nairobi → Lilongwe → back).
8. Add `delegation.*` i18n keys to `en.ts` (request fr/sw mirrors via §10); surface delegation in the stage feed mini-app shell.
9. Update `CLAUDE.md` "Flows" registry to list `LiquidDelegationFlow` as the third transferable mechanism.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- Walk QV, Conviction, and Delegation flows in the preview (`mcp__Claude_Preview__*`): no console errors, dark mode holds, 360px layout holds, keyboard/screen-reader basics work.
- Diff shows duplicated pool/country code deleted, not just moved; `ProblemStage.tsx` < 250 lines.
- Demo fixture shows a cross-border delegation chain visible in the UI.
- Commit, push `wave-1.5/voting-flow-consolidation-and-D3-liquid-delegation`, open a PR into `ui`, rebase if asked. Report what changed.

**House rules:** hardcoded UI only · every user-facing string via i18n · design tokens & shared kit only (no ad-hoc colors/spacing) · **simplicity beats cleverness** — if a choice adds user-facing complexity, take the simpler path · stay strictly within owned paths.
