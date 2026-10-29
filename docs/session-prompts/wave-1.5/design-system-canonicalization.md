# Wave 1.5 — Design System Canonicalization  (foundation · lands first)

**When:** before any other Wave 1.5 lane. Blocks every reviewer until tokens are canonical.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-wave-1.5-design-system-canonicalization -b wave-1.5/design-system-canonicalization ui
```
Open a fresh Claude Code session **in `../gloki-wave-1.5-design-system-canonicalization`** and paste everything below.

---

You are the **Design System Canonicalization** session for Wave 1.5 of the Gloki UI reform. This is a
**UI-only mockup** — no backend, no `?raw` Python imports. Your job is to make `variables.scss` the
single source of truth for color, spacing, shadow, and touch-target tokens, and to delete every local
hex/rgba override that has caused drift across the codebase.

**Read first:** `DESIGN_SYSTEM.md` (current tokens + component patterns), `MASTER_TODO.md` §1 (north
stars) and the Wave 1.5 entry covering the eight token-violation findings, and `src/styles/variables.scss`
end-to-end before touching anything.

**Mission context:** Eight of the highest-severity audit findings are token violations — duplicated color
constants, hardcoded `rgba(0,0,0,0.5)` backdrops, hardcoded logout-pink hexes, ad-hoc shadows. Until
tokens are canonical and locally-redefined colors are gone, every future PR risks reintroducing the
drift. This lane lands first so every other Wave 1.5 lane can review against an enforceable system.

**You may ONLY edit these paths:**
- `src/styles/variables.scss`, `src/styles/globals.scss`, `src/styles/_animations.scss`
- `DESIGN_SYSTEM.md`
- `src/components/PageHeader.module.scss`
- `src/components/community/ActivityHub.module.scss`
- `src/components/community/CollabList.module.scss`
- `src/components/community/InitiativeList.module.scss`
- `src/components/community/dialogs/*.module.scss`
- `src/components/initiative/PipelineView.module.scss`
- `src/components/initiative/InitiativeDashboard.module.scss`
- `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss`
- `src/components/community/Currency.module.scss`

If you need anything outside these paths (a token rename used elsewhere, a shared component change),
append a request to **MASTER_TODO §10 (Coordination log)** — do **not** edit other lanes' files.

**Tasks:**
1. Add `$initiative`, `$collab`, `$chat`, `$touch-target-min`, `$success-dark`, `$warning-dark` to `variables.scss`.
2. Delete duplicate local color definitions in `ActivityHub` / `CollabList` / `InitiativeList` / `PipelineView` / `InitiativeDashboard` / `ProblemVoteFlow` modules and import the canonical tokens.
3. Replace all hardcoded logout-pink hex values in `PageHeader.module.scss` with `$error` / `$error-dark` and `rgba($error, 0.1)`.
4. Replace every `rgba(0, 0, 0, 0.5)` backdrop in `community/dialogs/*.module.scss` with `$overlay-bg`.
5. Replace hardcoded `box-shadow` rgba in `Currency` / `CreateFlowDialog` / `CreateIssueDialog` / `IdentityCardDialog` with `$shadow-lg` / `$shadow-md`.
6. Either remove `$secondary` or document its intended use in `DESIGN_SYSTEM.md`.
7. Add dark-mode counterparts for `ActivityHub` action-button surfaces.
8. Document the canvas color constants in `Share.tsx` with token equivalents in comments (comment-only — `Share.tsx` is out of scope to edit).
9. Update `DESIGN_SYSTEM.md` with the new tokens, the touch-target rule, and an explicit "no local color overrides" policy.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- `rg -n '#[0-9a-fA-F]{3,6}|rgba?\(' src/components/**/*.module.scss` returns only token-derived `rgba($var, …)` usages in owned paths — no raw hex/rgba left.
- Walk the affected screens in the preview (`mcp__Claude_Preview__*`): light + dark mode both hold, dialog backdrops + logout button + activity-hub surfaces all render correctly, no console errors.
- Commit, push `wave-1.5/design-system-canonicalization`, open a PR into `ui`. Report what changed.

**House rules:** hardcoded UI only · every user-facing string via the i18n scaffold · design tokens &
shared components only (no ad-hoc colors/spacing/shadows) · **simplicity beats cleverness** — if a
choice adds user-facing complexity, take the simpler path · stay strictly within your owned paths.
```

/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2/docs/session-prompts/lane-a-onboarding.md (template referenced)
