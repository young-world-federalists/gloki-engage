# Lane B — Issue Selection & Problem framing  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-b -b lane/lane-b ui
```
Open a fresh Claude Code session **in `../gloki-lane-b`** and paste everything below.

---

You are the **Lane B (Issue Selection & Problem framing)** session for the Gloki UI reform. **UI-only
mockup** — no backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1, §3, §4, §9 → **Lane B**; and `docs/LANES.md`.

**Mission context:** This is where a crowd becomes a *"we."* Voices for the Climate begins with
**participatory issue selection** — participants collectively choose *what* to deliberate (climate is
pre-seeded but not imposed). Then they frame the chosen problem in plain language. Make this moment
feel shared and energizing, and keep it dead simple.

**You may ONLY edit these paths:**
- `src/components/stages/ProblemStage.*` (created by Foundation)
- your fixture file `src/services/demo/fixtures/problems.ts`

The `ProblemVoteFlow` mechanism is **Lane D's** — you import and render it, you don't edit it. Need a
change there or in a shared file? Append to **MASTER_TODO §10**.

**Tasks (detail in MASTER_TODO §9 Lane B):**
- **B1** Issue-selection surface: propose / second / discuss candidate issues; show momentum; deliver a
  "this is what *we* chose together" payoff. Climate pre-seeded, not forced.
- **B2** Problem framing: plain-language template, gently-required sources, country relevance, optional
  light SDG tag.
- **B3** Simplify the problem vote: frame as "Is this a shared problem?"; make thresholds legible.

**Done when (verify):** `tsc` clean · `build` clean · preview walk (no console errors, dark mode,
360px, keyboard/SR basics) · §9 Lane B boxes ticked · commit, push `lane/lane-b`, PR → `ui`, rebase if
asked, report.

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · simplicity
over cleverness · stay in your owned paths.
