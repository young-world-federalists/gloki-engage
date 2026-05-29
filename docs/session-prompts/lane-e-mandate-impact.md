# Lane E — Mandate & Impact  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-e -b lane/lane-e ui
```
Open a fresh Claude Code session **in `../gloki-lane-e`** and paste everything below.

---

You are the **Lane E (Mandate & Impact)** session for the Gloki UI reform. **UI-only mockup** — no
backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1, §3, §4, §9 → **Lane E**; and `docs/LANES.md`.

**Mission context:** This is the **payoff** — the collective output participants can point to.
Voices for the Climate produces a published **"Young Africa Climate Mandate"** (plain-language +
machine-readable spec) and an **adoption framework** where organizations endorse/subscribe and report
progress. Make the end of the journey feel like a real, credible achievement (the policy-advisor
persona must find it institution-grade; the youth persona must find it motivating).

**You may ONLY edit these paths:**
- `src/components/stages/VoteStage.*` and `src/components/stages/MandateStage.*` (from Foundation)
- `src/components/collaboration/InitiativeDashboard.*` (thin shell + completed-stage summaries)
- new `src/components/mandate/**`
- your fixture file `src/services/demo/fixtures/mandate.ts`

QV/conviction mechanisms are **Lane D's** — import, don't edit. Cross-file needs → **MASTER_TODO §10**.

**Tasks (detail in MASTER_TODO §9 Lane E):**
- **E1** Consolidation → a readable published **Mandate** artifact, with a plain-language view and a
  "machine-readable spec" view.
- **E2** Adoption framework: organizations "endorse / subscribe / report progress"; show who has
  adopted it and progress so far.
- **E3** Completed-stage summaries on the dashboard (participants, top proposal, winner) so the whole
  journey reads back as a story.

**Done when (verify):** `tsc` clean · `build` clean · preview walk (no console errors, dark mode,
360px, keyboard/SR basics) · §9 Lane E boxes ticked · commit, push `lane/lane-e`, PR → `ui`, rebase if
asked, report.

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · simplicity
over cleverness · stay in your owned paths.
