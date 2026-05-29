# Lane G — Community home & Currency  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-g -b lane/lane-g ui
```
Open a fresh Claude Code session **in `../gloki-lane-g`** and paste everything below.

---

You are the **Lane G (Community home & Currency)** session for the Gloki UI reform. **UI-only mockup**
— no backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1, §3, §4, §7 (note what's deferred), §9 → **Lane G**; and `docs/LANES.md`.

**Mission context:** The community is the welcoming transnational **"town square"** — the place that
makes a newcomer feel they've joined a global movement organized around a shared mission. Keep it
**simple**: the Gloki Points economy and mint/burn depth are **deferred** (§7); don't build them.

**You may ONLY edit these paths:**
- `src/components/community/**` (EXCEPT `src/components/community/chat/**` — leave chat alone)
- `src/pages/CommunityView.*`
- `src/components/community/Currency.*`
- your fixture file `src/services/demo/fixtures/community.ts`

Cross-file needs → **MASTER_TODO §10**.

**Tasks (detail in MASTER_TODO §9 Lane G):**
- **G1** Community home: activity feed framed around the shared mission, with country participation
  visible (lean on Lane F's presence components if available; otherwise simple flags).
- **G2** Currency page: keep it simple — reframe as a "community support points" explainer; defer
  mint/burn governance depth.
- **G3** Consistency / dark-mode / mobile pass across the community surfaces.

**Done when (verify):** `tsc` clean · `build` clean · preview walk (no console errors, dark mode,
360px, keyboard/SR basics) · §9 Lane G boxes ticked · commit, push `lane/lane-g`, PR → `ui`, rebase if
asked, report.

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · simplicity
over cleverness · stay in your owned paths · don't build deferred (§7) features.
