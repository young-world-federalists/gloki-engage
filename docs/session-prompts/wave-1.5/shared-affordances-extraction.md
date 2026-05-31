# Wave 1.5 — Shared Affordances Extraction

**When:** after `design-system-canonicalization` has merged to `ui`. Runs alongside other Wave 1.5 lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-wave-1.5-shared-affordances-extraction -b wave-1.5/shared-affordances-extraction ui
```
Open a fresh Claude Code session **in `../gloki-wave-1.5-shared-affordances-extraction`** and paste everything below.

---

You are the **Wave 1.5 Shared Affordances Extraction** session for the Gloki UI reform. This is a
**UI-only mockup** — no backend, all data via `src/services/demo/`, no `?raw` Python imports.

**Read first:** `MASTER_TODO.md` §1 (north stars), §3 (design philosophy), §4 (parallel-session rules),
§9 → **Wave 1.5 / Shared Affordances**; `docs/LANES.md`; `DESIGN_SYSTEM.md` (tokens + canonical
patterns from the design-system-canonicalization lane).

**Mission context:** Nine dialogs and four lanes each reinvent the same chrome — overlays, headers,
buttons, error banners, empty states, country flags, author cards. Extracting these primitives once
shrinks the codebase, fixes Modal a11y blockers in a single place, and gives a small canonical kit a
new contributor (Ouri) can learn once and reuse everywhere.

**You may ONLY edit these paths:**
- `src/components/shared/Modal.tsx`, `src/components/shared/Modal.module.scss`
- `src/components/shared/Button.tsx`
- `src/components/shared/EmptyState.tsx`
- `src/components/shared/Banner.tsx`
- `src/components/shared/CountryFlag.tsx`
- `src/components/shared/AuthorCard.tsx`, `src/components/shared/AuthorCard.module.scss`
- `src/components/shared/index.ts`
- `src/components/community/dialogs/{Approval,CreateCollab,CreateFlow,CreateInitiative,CreateIssue,IdentityCard,Message,QRScanner}Dialog.tsx` + matching `.module.scss`

If you need anything outside these (a new token, a route, another shared primitive), append a request
to **MASTER_TODO §10 (Coordination log)** — do **not** edit other lanes' files.

**Tasks (detail in MASTER_TODO §9 Wave 1.5 / Shared Affordances):**
- **S1** Modal a11y: add focus trap (react-focus-lock or hand-rolled), `aria-labelledby='modal-title'`,
  ESC + overlay-click close, restore focus on unmount.
- **S2** Add `aria-label` to every icon-only button: Modal close, ChatTopic send/back, PageHeader menu,
  NotificationsBell. Strings via i18n.
- **S3** Build `<AuthorCard>` (avatar + name + country + timestamp + optional role) for
  DeliberationThread / CoAuthoringPanel / ProposalMergePanel.
- **S4** Refactor all 9 dialogs to wrap content in `<Modal>`; delete local overlay/dialog/header/footer
  SCSS rules.
- **S5** Replace every custom button class in dialog modules with
  `<Button variant='primary|secondary|destructive'>`.
- **S6** Replace inline error `<div className='errorMessage'>` with `<Banner tone='error'>`.
- **S7** Replace ad-hoc empty states (`cardEmpty`, `empty-state`, `emptyStream`) with `<EmptyState>`.
- **S8** Replace `getCountryFlag()` string calls in ConvictionStaking, ProblemStage, AdoptionFramework,
  ProblemVoteFlow with `<CountryFlag>`.
- **S9** Export Modal + Button + EmptyState + Banner + CountryFlag + AuthorCard from
  `src/components/shared/index.ts` with JSDoc usage examples.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- Walk every dialog + every refactored flow in the preview (`mcp__Claude_Preview__*`): no console
  errors, focus traps work, ESC closes, dark mode holds, 360px holds, keyboard + screen-reader basics
  pass.
- Grep confirms zero remaining `getCountryFlag(` calls and zero local `.overlay`/`.dialog` rules in the
  9 dialog modules.
- MASTER_TODO §9 Wave 1.5 / Shared Affordances boxes ticked.
- Commit, push `wave-1.5/shared-affordances-extraction`, open a PR into `ui`, rebase on `ui` if asked.
  Report what changed.

**House rules:** hardcoded UI only · every user-facing string via the i18n scaffold · design tokens &
shared kit only (no ad-hoc colors/spacing) · **simplicity beats cleverness** — if a choice adds
user-facing complexity, take the simpler path · stay strictly within your owned paths.
