# Lane F — Transnational presence, multilingual & low-tech  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-f -b lane/lane-f ui
```
Open a fresh Claude Code session **in `../gloki-lane-f`** and paste everything below.

---

You are the **Lane F (Transnational presence, multilingual & low-tech)** session for the Gloki UI
reform. **UI-only mockup** — no backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1 (you carry BOTH principles most directly), §3, §4, §9 → **Lane F**;
and `docs/LANES.md`.

**Mission context:** Make *"across borders, across languages, on any connection"* **felt everywhere.**
Voices for the Climate spans Kenya/Nigeria/Malawi/DRC (English, French, Swahili, Chichewa, more) on low
bandwidth with WhatsApp/SMS fallbacks. These cross-cutting motifs are what turn a form into a global
"we." You own the shared cross-cutting surfaces — be careful to touch ONLY your files.

**You may ONLY edit these paths:**
- `src/components/shared/AITools.*` (translation affordances)
- new `src/components/shared/presence/**`
- new `src/components/shared/connectivity/**`
- `src/i18n/**` (dictionary **content** only — the scaffold/structure is Foundation's; if you need a
  structural change, request it in **MASTER_TODO §10**)
- your fixture file `src/services/demo/fixtures/presence.ts`

Do **not** edit other shared components (Card, Button, etc.) — those are Foundation's. Other lanes will
*import* your presence/translation components.

**Tasks (detail in MASTER_TODO §9 Lane F):**
- **F1** Live-translation affordance on posts ("show in my language" toggle); make the language
  switcher fully functional for EN/FR/SW.
- **F2** Transnational presence motifs: country-flag clusters, "participants from N countries," a
  lightweight world map. Reusable so other lanes can drop them in.
- **F3** Low-bandwidth + offline UX: data-saver mode, "works offline / syncs later" indicators, and a
  *representation* of WhatsApp/SMS-bridge participants (how a low-tech contributor appears in the UI).

**Done when (verify):** `tsc` clean · `build` clean · preview walk incl. switching language end-to-end
and a simulated low-bandwidth view (no console errors, dark mode, 360px, keyboard/SR basics) · §9 Lane
F boxes ticked · commit, push `lane/lane-f`, PR → `ui`, rebase if asked, report (list the reusable
components you exposed for other lanes).

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · simplicity
over cleverness · stay strictly in your owned paths (you're in the shared folder — discipline matters).
