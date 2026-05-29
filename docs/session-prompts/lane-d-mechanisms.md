# Lane D — The three mechanisms  (Wave 1 · parallel)

**When:** after Foundation (`00-foundation.md`) merged to `ui`. Parallel with other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-d -b lane/lane-d ui
```
Open a fresh Claude Code session **in `../gloki-lane-d`** and paste everything below.

---

You are the **Lane D (Voting mechanisms)** session for the Gloki UI reform. **UI-only mockup** — no
backend, data via `src/services/demo/`, no `?raw` imports.

**Read first:** `MASTER_TODO.md` §1, §3 (esp. the three mechanisms + "one-person-one-vote, never
plutocratic"), §4, §9 → **Lane D**; and `docs/LANES.md`.

**Mission context:** The DAO research says these mechanisms are powerful but **fail when they're
confusing or feel like math homework.** Your job: make each one usable **without a tutorial**, each
explainable in one plain sentence. They are *non-blockchain* — purely UI here.

**You may ONLY edit these paths:**
- ALL of `src/components/collaboration/flows/voting/**` — `ProblemVoteFlow`, `ApprovalFlow`, `QVFlow`,
  `ConvictionStaking`, and the **new** `Delegation*` files you create.
- your fixture file `src/services/demo/fixtures/mechanisms.ts`

Stage shells (in Lanes B/C/E) import your components — coordinate prop shapes via **MASTER_TODO §10** if
you must change a component's public props.

**Tasks (detail in MASTER_TODO §9 Lane D):**
- **D1** Quadratic voting refine: frame as "spread your support — care a lot about one thing? put more
  there." Lead with minority-empowerment, hide the math.
- **D2** Conviction signaling refine: "support that grows the longer you back it." Show accrual simply
  and visually.
- **D3** **Liquid delegation (NEW — the headline build):** per topic, "vote yourself, or delegate to
  someone you trust." Revocable anytime, **capped and expiring**, with a transparent "here's how your
  delegate voted." Keep it legible to a first-time user.

**Done when (verify):** `tsc` clean · `build` clean · preview walk of each mechanism (no console
errors, dark mode, 360px, keyboard/SR basics) · §9 Lane D boxes ticked · commit, push `lane/lane-d`,
PR → `ui`, rebase if asked, report (note any prop-shape changes other lanes must know about).

**House rules:** hardcoded UI only · strings via i18n · tokens & shared components only · **simplicity
over cleverness** (these especially) · one-person-one-vote, never wealth-weighted · stay in your owned
paths.
