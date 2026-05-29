# Lane A — Onboarding & Identity  (Wave 1 · parallel)

**When:** after the Foundation session (`00-foundation.md`) has merged to `ui`. Runs alongside other lanes.

**Setup (terminal, once):**
```bash
cd /path/to/gloki-engage
git worktree add ../gloki-lane-a -b lane/lane-a ui
```
Open a fresh Claude Code session **in `../gloki-lane-a`** and paste everything below.

---

You are the **Lane A (Onboarding & Identity)** session for the Gloki UI reform. This is a **UI-only
mockup** — no backend, all data via `src/services/demo/`, no `?raw` Python imports.

**Read first:** `MASTER_TODO.md` §1 (two north-star principles: usability-first + felt transnational
collaboration), §3 (design philosophy), §4 (parallel-session rules), §9 → **Lane A**; and `docs/LANES.md`.

**Mission context:** Gloki must onboard a young person across Kenya/Nigeria/Malawi/DRC with an invite,
a cheap phone, intermittent data, and a non-English first language — **without anyone helping them**
(the project's success bar is ≥70% unaided). Trust is *lightweight*: an invite + a friend's vouch, not
biometrics (those are deferred — see §7).

**You may ONLY edit these paths:**
- `src/pages/IdentityView.*`
- `src/components/identity/**`
- new `src/components/onboarding/**`
- your fixture file `src/services/demo/fixtures/identity.ts`

If you need anything outside these (a new route, a design token, a shared component), append a request
to **MASTER_TODO §10 (Coordination log)** — do **not** edit shared files or other lanes' files.

**Tasks (detail in MASTER_TODO §9 Lane A):**
- **A1** Guided first-run flow: invite → "a friend vouched for you" (Web-of-Trust *lite*) → create
  Digital Agent (name, photo, country, languages) → consent to deliberation rules. A plain-language
  stepper; skippable-but-nudged; works one-handed on a 360px screen.
- **A2** Profile = "Digital Agent" card: country flag, languages, participation history, "vouched by N".
  No badges/Council (deferred).
- **A3** Empty/return states; full dark mode; 360px mobile; keyboard + screen-reader pass.

**Done when (verify — show evidence, don't assert):**
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- Walk your routes in the preview (`mcp__Claude_Preview__*`): no console errors, dark mode holds,
  360px layout holds, keyboard/screen-reader basics work.
- MASTER_TODO §9 Lane A boxes ticked.
- Commit, push `lane/lane-a`, open a PR into `ui`, rebase on `ui` if asked. Report what changed.

**House rules:** hardcoded UI only · every user-facing string via the i18n scaffold · design tokens &
shared components only (no ad-hoc colors/spacing) · **simplicity beats cleverness** — if a choice adds
user-facing complexity, take the simpler path · stay strictly within your owned paths.
