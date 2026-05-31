# Lane Wave 1.5 — i18n Promotion & Multilingual Parity

**When:** after `shared-affordances-extraction` has merged to `ui` (dialogs are rewritten there first). Runs alongside other Wave 1.5 lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-wave-1.5-i18n-promotion-and-multilingual-parity -b wave-1.5/i18n-promotion-and-multilingual-parity ui
```
Open a fresh Claude Code session **in `../gloki-wave-1.5-i18n-promotion-and-multilingual-parity`** and paste everything below.

---

You are the **Wave 1.5 i18n Promotion & Multilingual Parity** session for the Gloki UI reform. This is a
**UI-only mockup** — no backend, all data via `src/services/demo/`, no `?raw` Python imports.

**Read first:** `MASTER_TODO.md` §1 (usability-first + felt transnational collaboration), §3 (design
philosophy), §4 (parallel-session rules), §9 → **Wave 1.5 i18n promotion**; `docs/LANES.md`; and
`src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts` to feel the current imbalance.

**Mission context:** `fr.ts` and `sw.ts` are ~70 lines each while `en.ts` has dozens of inline defaults
scattered through components. A young person opening Gloki in Nairobi or Lilongwe currently sees English
placeholders in dialogs, login, and onboarding — the most direct violation of our transnational-
collaboration principle. One coordinated lane fixes the imbalance: every inline default gets promoted into
`en.ts` and backfilled in `fr.ts` and `sw.ts` with reviewable copy.

**You may ONLY edit these paths:**
- `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts`, `src/i18n/types.ts`, `src/i18n/index.tsx`
- `src/components/community/dialogs/CreateFlowDialog.tsx`
- `src/components/community/dialogs/CreateIssueDialog.tsx`
- `src/components/community/dialogs/CreateInitiativeDialog.tsx`
- `src/components/community/dialogs/CreateCollabDialog.tsx`
- `src/components/community/dialogs/ApprovalDialog.tsx`
- `src/components/community/ActivityHub.tsx`
- `src/components/community/CollabList.tsx`
- `src/components/community/InitiativeList.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/steps/AgentStep.tsx`
- `src/components/onboarding/steps/VouchStep.tsx`
- `src/components/identity/Profile.tsx`

If you need anything outside these, append a request to **MASTER_TODO §10 (Coordination log)** — do **not**
edit shared files or other lanes' files.

**Tasks (detail in MASTER_TODO §9 Wave 1.5 i18n promotion):**
1. Promote `onboarding.*` keys from inline defaults to `en.ts`; backfill `fr.ts` / `sw.ts`.
2. Promote dialog titles, placeholders, and error messages (CreateFlowDialog, CreateIssueDialog,
   CreateInitiativeDialog, CreateCollabDialog, ApprovalDialog) to `community.*` keys.
3. Promote `LoginPage` labels, hints, and validation messages to `auth.*` keys.
4. Promote `ActivityHub` empty-state and loading text to `community.empty.*` and `common.loading` keys.
5. Promote conditional button text (Creating…, Submitting…, Connecting…) to `common.*` state keys.
6. Promote `aria-label` / `title` attributes for accessibility to `community.action.*` keys.
7. Rename `presence.dataSaverNote` → `connectivity.dataSaverNote` across all three locales.
8. Translate every newly promoted `en` key into `fr.ts` and `sw.ts` with reviewable French and Swahili copy.
9. Add a missing-key dev warning to `src/i18n/index.tsx` so future drift surfaces immediately.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- `fr.ts` and `sw.ts` line counts are within ~5% of `en.ts` (parity, not English fallbacks).
- Walk the app in each locale via the preview (`mcp__Claude_Preview__*`): no console warnings about
  missing keys, dialogs/login/onboarding render translated copy, dark mode + 360px hold.
- MASTER_TODO §9 Wave 1.5 i18n promotion boxes ticked.
- Commit, push `wave-1.5/i18n-promotion-and-multilingual-parity`, open a PR into `ui`, rebase on `ui` if
  asked. Report what changed.

**House rules:** hardcoded UI only · every user-facing string via the i18n scaffold · design tokens &
shared components only (no ad-hoc colors/spacing) · **simplicity beats cleverness** — if a choice adds
user-facing complexity, take the simpler path · stay strictly within your owned paths.
