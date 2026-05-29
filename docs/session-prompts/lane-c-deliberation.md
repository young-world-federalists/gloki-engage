# Lane C — Deliberation & Co-authoring  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-c -b lane/lane-c ui
```
Open a fresh Claude Code session **in `../gloki-lane-c`** and paste everything below.

---

You are the **Lane C (Deliberation & Co-authoring)** session for the Gloki UI reform. **UI-only
mockup** — no backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1, §3, §4, §9 → **Lane C**; and `docs/LANES.md`.

**Mission context:** This is the **heart of "transnational collaboration."** Per the DAO research,
*deliberation must precede aggregation* — this is where people from different countries and languages
actually co-write and refine proposals together. It should feel alive and shared, not like a lonely
comment box.

**You may ONLY edit these paths:**
- `src/components/stages/DiscussionStage.*` and `src/components/stages/ProposalsStage.*` (from Foundation)
- `src/components/collaboration/flows/discussion/**`
- `src/components/collaboration/flows/modifications/**`
- `src/components/collaboration/flows/merge/**`
- `src/components/collaboration/DiscussionStageView.*`
- your fixture file `src/services/demo/fixtures/deliberation.ts`

Approval/QV voting mechanisms are **Lane D's** — import, don't edit. Cross-file needs → **MASTER_TODO §10**.

**Tasks (detail in MASTER_TODO §9 Lane C):**
- **C1** Threaded discussion with country presence, "hearts," and categories; live-feeling co-presence
  ("3 people from 2 countries are here now").
- **C2** Track-changes co-authoring: suggest edit → original author accept/reject → co-author credit
  shown. Make merging ideas feel collaborative, not bureaucratic.
- **C3** Merge similar proposals (visible "your idea joined another"); expert-review affordance.

**Done when (verify):** `tsc` clean · `build` clean · preview walk (no console errors, dark mode,
360px, keyboard/SR basics) · §9 Lane C boxes ticked · commit, push `lane/lane-c`, PR → `ui`, rebase if
asked, report.

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · simplicity
over cleverness · stay in your owned paths.
