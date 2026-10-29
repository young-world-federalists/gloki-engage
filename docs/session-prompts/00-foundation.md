# Session 00 — Foundation (run this FIRST, alone)

> Paste everything below into a fresh Claude Code session opened in the `gloki-engage` repo on
> branch `ui`. This session runs **alone** and must **merge to `ui` before any parallel lane
> starts.** Its whole job is to make the codebase safe for many simultaneous sessions.

---

You are the **Foundation session** for a major UI reform of Gloki — a civic deliberation platform.
This is a **UI-only mockup**: there is no backend. All data is hardcoded and flows through the mock
layer in `src/services/demo/`. Do **not** add real network calls or reintroduce `?raw` Python imports.

**Read these first, in order:**
1. `MASTER_TODO.md` (repo root) — the whole plan. Your work is **§8 Phase 0**. Internalize §1 (the two
   north-star principles: *usability first* and *a felt sense of transnational collaboration*), §3
   (design philosophy), and §4 (the parallel-session operating model).
2. `DESIGN_SYSTEM.md` — current design tokens/patterns.
3. Skim `src/App.tsx` (routing), `src/services/demo/` (mock layer + fixtures), `src/components/shared/`.

**Context you need:**
- The app must eventually run **"Voices for the Climate"**: a transnational youth deliberation across
  Kenya, Nigeria, Malawi, and DRC, where ≥70% of participants succeed *without in-person help*. So
  every primitive you build is in service of low-literacy, low-bandwidth, multilingual usability and
  a felt sense of cross-border collaboration.
- After you merge, ~7 other sessions will work **in parallel** on disjoint "lanes." Your job is to
  pre-build shared primitives and **pre-partition the files that would otherwise cause merge
  conflicts** — chiefly `src/App.tsx` and `src/services/demo/fixtures/`.

**Your tasks (MASTER_TODO §8 — F1–F7). Work through them in order, committing per task:**
1. **F1 Design-system hardening** — finalize tokens in `src/styles/` (full dark-mode palette,
   spacing, type, radius, shadow); reconcile `DESIGN_SYSTEM.md` with reality; state the "no ad-hoc
   values" rule.
2. **F2 Shared component kit** — ensure `src/components/shared/` has the reusable primitives lanes
   need: `Card`, `Button`, `Stepper`, `Modal`, `EmptyState`, `Banner`, `CountryFlag`/`Badge`,
   `CountryPresence`, `PageHeader`, `StageFooter`. Refactor duplicates into these.
3. **F3 i18n scaffold** — add a lightweight `t('key')` layer under `src/i18n/` with an English
   dictionary and a real `LanguageSwitcher` stub (EN/FR/SW). Lanes will write all user-facing strings
   through this.
4. **F4 IA + route pre-registration** — define the Voices-for-the-Climate journey route map and in
   `src/App.tsx` register **every** lane's routes pointing at **lazy placeholder components**, one
   stub file living in each lane's owned folder (see §9 owned-paths). Goal: after you merge, **no lane
   ever edits `App.tsx`.**
   - **F4b (critical):** `StageFeedView` and `InitiativeDashboard` currently render all five stages
     inline in one file each — a guaranteed merge hotspot. **Decompose them:** extract each stage into
     `src/components/stages/{ProblemStage,DiscussionStage,ProposalsStage,VoteStage,MandateStage}.tsx`
     and leave `StageFeedView`/`InitiativeDashboard` as thin shells that compose those. Wire each new
     stage component to render the existing flow it already used (import the voting flows; don't move
     them). This is what lets Lanes B/C/D/E work without colliding.
5. **F5 Sample-data partition + VftC seed** — split `src/services/demo/fixtures/` into **one file per
   lane** (identity, problems, deliberation, mechanisms, mandate, community, presence). Seed the
   flagship: a "Voices for the Climate" community, the 4 countries, ~12 youth personas
   (name/photo/country/languages), and one climate initiative mid-deliberation, so every lane opens
   onto populated, collaborative-feeling content.
6. **F6 Legacy cleanup** — remove pre-pipeline dead code so lanes aren't misled: `IssueView`,
   `WishView`, `AgreementView`, `src/components/issue/**`, and unused old flows (budget, qa, document,
   fundraising, scheduling, taskboard, ranking, scoring) — but **verify each is truly unreferenced**
   before deleting (grep imports; keep anything the live pipeline still uses).
7. **F7** — write `docs/LANES.md`: the owned-paths table from MASTER_TODO §9 plus the §4 rules, so
   every future session has the boundaries in-repo.

**Definition of done (verify — do not claim done without evidence):**
- `npx tsc -b --noEmit` exits clean.
- `npm run build` exits clean.
- Preview boots (the dev server / `mcp__Claude_Preview__*` tools) into a **populated** Voices-for-the-
  Climate community; spot-check a couple of routes and confirm no console errors, dark mode works, and
  the layout holds at 360px wide.
- Every placeholder route renders a clear "coming soon — Lane X" stub (so parallel sessions know where
  their work plugs in).
- `MASTER_TODO.md` §8 checkboxes ticked; `docs/LANES.md` exists.

**Then:** commit, push `ui`, and report back with: what changed, the final route map, the
fixture-file split, and confirmation that `App.tsx` and each fixture file are now safe for parallel
editing. At that point the human will spin up the Wave 1 lane sessions.

**House rules:** hardcoded UI only · every string via i18n · design tokens only (no ad-hoc
colors/spacing) · keep it simple — if a Phase-0 choice adds user-facing complexity, prefer the simpler
option · don't build any Lane A–G feature work yourself (just the placeholders + primitives they'll
use).
