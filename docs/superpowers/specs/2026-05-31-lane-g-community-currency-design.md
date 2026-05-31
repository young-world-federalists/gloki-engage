# Lane G — Community home & Currency — Design

- **Date:** 2026-05-31
- **Lane:** G (Community home & Currency) · *lighter · collaboration*
- **Branch / worktree:** `lane/lane-g` at `.worktrees/lane-g`
- **Status:** Approved in brainstorming; ready for implementation plan
- **Owned paths (edit only these):** `src/components/community/**` (except `chat/**`), `src/pages/CommunityView.*`, `src/components/community/Currency.*`, fixture `src/services/demo/fixtures/community.ts`
- **Read-only deps:** Foundation shared kit (`src/components/shared/**`), Lane F presence kit (`src/components/shared/presence/**`) — *import, do not edit*

---

## 1. Context & mission

The community surface is the welcoming transnational **"town square"** — the place that makes a
newcomer feel they've joined a global movement organized around a shared mission. North stars
(MASTER_TODO §1): (1) anyone can participate unaided; (2) a *felt sense of transnational
collaboration*. Lane G is deliberately light: the Gloki points economy and mint/burn governance
depth are **deferred** (§7) and must not be built here.

Flagship demo context: **Voices for the Climate (VftC)** — youth climate deliberation across
Kenya, Nigeria, Malawi, DR Congo, producing a "Young Africa Climate Mandate."

## 2. Goals & non-goals

**Goals (§9 Lane G):**
- **G1** Community home: an activity feed framed around the shared mission, with country
  participation visible.
- **G2** Currency page: reframe as a simple "community support points" page; defer mint/burn
  governance depth.
- **G3** Consistency / dark-mode / mobile pass across the community surfaces.

**Non-goals (deferred — §7):**
- Points economy, mint/burn voting/governance, supply policy depth.
- Backend/contract changes. UI-only mockup; data via `src/services/demo/` and the owned fixture.
- Editing other lanes' files or `src/i18n/` dictionaries (inline English defaults only).
- Reviving/expanding orphaned components beyond what G1 needs.

## 3. Decisions log (from brainstorming)

| # | Decision | Rationale |
|---|----------|-----------|
| G1 | **Mission-led home**: three stacked bands — mission banner → presence strip → activity feed. Extract the home out of `CommunityView` into `CommunityHome`. | Best matches the "global movement / town square" north star; thins an overgrown shell (554 lines). |
| G2 | **Two-active-card support-points page**: explainer + balance (with **read-only** daily add/remove rates) + send-support. **Remove only the mint/burn *voting* card.** | Keep transparency into the community currency's dynamics while deferring governance depth (§7). |
| G3 | **Focused polish**: fully polish new surfaces + the `CommunityView` shell; **audit-and-log** the other `community/**` files, fixing only quick wins. | Shippable and focused; avoids a low-payoff rewrite of the whole tree. |
| G2-rates | **Keep the community daily add/remove rates as a read-only info line** on the balance card (no input). | Preserves a little transparency into the currency's dynamics without any governance UI. |
| i18n | **New-strings-only**: new/changed copy goes through `t('key','English default')`; existing hardcoded strings left as logged debt. | "Most impactful changes for a UI mockup" (user). Lane G can use inline defaults; only Lane F edits dictionaries. |
| Nav | **Remove the inline tab bar**; rely on the slide-out hamburger menu only (reached via the header menu button). | Matches CLAUDE.md's documented "hamburger only" intent; removes the redundant dual nav. |

## 4. Architecture & component boundaries

Today `src/pages/CommunityView.tsx` (554 lines) is both the community **shell** (dark header,
slide-out menu, inline tab bar, route table) *and* the home feed (inline `CommunityFeed`, ~lines
100–224). `ActivityHub.tsx` and `InitiativeList.tsx` exist but are **orphaned** (nothing imports
them).

**Change:** extract the home so the shell gets thinner and the home is understandable/testable in
isolation.

```
CommunityView.tsx (shell: header, slide-out menu, routes — tab bar removed)
└── route "*" → CommunityHome.tsx                 (new — composes the 3 bands; owns home data)
                ├── MissionBanner.tsx              (new — presentational; name/desc/mission/journey)
                ├── ParticipationSummary           (Lane F, read-only import)  ← presence strip
                └── (activity feed)                (initiative cards; sample fallback)
```

- **`community/CommunityHome.tsx`** (new) — composes the three bands; owns the collaboration +
  per-initiative `get_stage` fetching currently inline in `CommunityFeed`.
- **`community/MissionBanner.tsx`** (new) — pure presentational; all props optional so it degrades
  for any community (renders name + description when mission/journey data is absent).
- **`CommunityView.tsx`** — `*` route renders `<CommunityHome>` instead of the inline feed. The
  inline `CommunityFeed` function is removed (logic moves into `CommunityHome`). The **inline tab
  bar** (`<nav className={styles.tabBar}>`, ~lines 458–503) and its `.tabBar`/`.tabItem*` styles are
  **removed**; navigation is the slide-out hamburger menu only. The header **menu button stays** (it
  is how the menu opens once the tab bar's "More" trigger is gone).
- `ActivityHub.tsx` / `InitiativeList.tsx` — left orphaned; logged as follow-up (§9).

**Ownership check:** every changed file is in Lane G's owned paths. `ParticipationSummary` and the
shared kit are imported read-only. **No `src/i18n/` edits. No §10 coordination request needed.**

## 5. G1 — Mission-led home (detail)

Three vertically stacked bands inside the existing `body` scroll region (which already clears the
global footer):

### Band 1 — Mission banner (`MissionBanner.tsx`)
- Sits directly below the dark community header.
- Renders the community's **name** and **description** reframed as "what we're building together."
- When `journey` data exists (demo), shows a compact **journey line**: the 4 VftC phases
  (Co-Design → Open Deliberation → Consolidation & Voting → Distribution & Evaluation) with the
  active phase marked. Implemented with shared `<Badge>`/tokens, not a heavy stepper.
- Generic communities (no mission/journey fixture) render just the name/description framing.
- Built on `<Card>` + tokens; dark-mode aware; holds at 360px.
- New strings via `t()` with inline English defaults.

### Band 2 — Presence strip (Lane F `ParticipationSummary`)
- **Real component API** (verified against `shared/presence/ParticipationSummary.tsx`):
  `ParticipationSummaryProps = { participation: { code: string; participants: number }[]; max?: number; size?: 'sm' | 'md'; className?: string }`.
  It renders an overlapping flag cluster captioned "{people} participants from {countries}
  countries" (caption is self-i18n'd inside the component — no new strings needed here). It returns
  `null` when `participation` is empty.
- **Usage:** `<ParticipationSummary participation={participation} size="md" />`.
- **Data derivation:** build `participation` as `{ code, participants }[]` — for each member public
  key in `communityMembers[communityId]`, look up `state.communities.profiles[pk]?.country` and
  tally per country code. **Fallback:** when no member profiles carry countries, synthesize the
  array from the fixture's `countries` list (e.g. `participants: 0`, or spread the member count) so
  the demo always shows KE·NG·MW·CD. Because the component hides itself on an empty array, the
  fallback is what guarantees the strip appears in the demo.
- This is the "someone in Nairobi + someone in Lilongwe building together" motif, using the real,
  already-merged Lane F component.

### Band 3 — Activity feed
- The existing initiative cards: stage badge (Problem/Discussion/Proposals/Vote/Mandate), title,
  description, author name (via `profiles`), and time-ago.
- Real collaborations of `type === 'initiative'`, sorted newest-first; per-initiative stage fetched
  via `get_stage` (preserve current behavior, including `'problem'` fallback on error).
- **Empty state:** keep the current sample-data fallback (clearly labeled "Example initiatives")
  so an empty community still feels alive.
- Tap a card → initiative dashboard route (unchanged):
  `/initiative/{host}/{agent}/{communityId}/{id}/roadmap`.
- Migrate the hand-rolled card markup onto shared `<Card>`/`<Badge>` where it cleanly reduces
  bespoke styling; **behavior preserved**.

### Fixture additions (`community.ts`, owned)
Extend `VFTC_COMMUNITY` to be self-contained (no dependency on Lane F's `presence.ts`):
```ts
export const VFTC_COMMUNITY = {
  name: 'Voices for the Climate',
  description: '…existing…',
  mission: 'A youth-led mandate for climate action across borders.',   // one-line tagline
  countries: ['KE', 'NG', 'MW', 'CD'],                                  // presence fallback
  journey: [                                                            // optional phase line
    { key: 'codesign',      label: 'Co-Design',                 status: 'done' },
    { key: 'deliberation',  label: 'Open Deliberation',         status: 'active' },
    { key: 'voting',        label: 'Consolidation & Voting',    status: 'upcoming' },
    { key: 'distribution',  label: 'Distribution & Evaluation', status: 'upcoming' },
  ],
};
```
All new fields are optional from the consumer's perspective; `MissionBanner` degrades when absent.

## 6. G2 — Currency → "Community Support Points" (detail)

Reframe `Currency.tsx` (338 lines) from a monetary-policy tool into a simple **support-signal**
page. **Keep transparency, remove governance voting.**

**Keep:**
- **Explainer card** — rewritten: points are how members *signal support* for what matters; one
  sentence may note the supply is community-set (read-only context), but no "set your rates" framing.
- **Balance card** — relabeled "Your Support Points." **Retain the read-only daily-rate display**
  (`medianMintRate` / `medianBurnRate` from `parameters.medians`), reframed as observable community
  info (e.g. "Points added across the community: N/day", "Points removed: N/day") — *not* something
  the user sets. (Decided in brainstorming: keep these visible as a read-only info line.)
- **Send-support form** — the `transfer()`-backed send-to-a-member action, relabeled (e.g. "Send
  support"). This is the one real, useful action; keep it.

**Remove:**
- The entire **"Your Currency Preferences" mint/burn voting card** (the input fields, ~lines
  257–331). *(Note: the median rates themselves stay — as the read-only info line on the balance
  card above. What's removed is the per-user mint/burn **input/voting** UI, not the rate display.)*
- Associated state/handlers: `mintPreference`, `burnPreference`, `mintFocused`, `burnFocused`,
  `hasChanges`, the preferences-reset `useEffect`, `handleUpdatePreferences`,
  `handleRevertPreferences`.
- The now-unused `setParameters` import; leftover `console.log`s.

**Keep imports/wiring:** `transfer`, `fetchUserBalance`, the `parameters.medians` read (for the
read-only display), membership/loading guards.

**Result:** explainer + balance(with read-only rates) + send — a clean, legible page. New/changed
strings via `t('currency.…','English default')`.

## 7. G3 — Consistency / dark-mode / mobile + i18n (detail)

- **New + rewritten surfaces** (`CommunityHome`, `MissionBanner`, `Currency`): tokens only (no
  ad-hoc hex/px/rgba), dark-mode aware, hold at **360px**, **44px** min touch targets, shared kit
  (`Card`/`Button`/`Badge`/`EmptyState`) over hand-rolled markup, new strings via `t()`.
- **Shell** (`CommunityView` dark header / slide-out menu): dark-mode + mobile polish. The inline
  tab bar is **removed** (see §4); verify the hamburger menu remains reachable from the header and
  every destination it listed (Home/Collab/Chat/Currency/Members/More) is still in the menu.
- **Audit-and-log only** for the remaining `community/**` (`Members`, `Share`, `CollabList`,
  `IdentityTrust`, `dialogs/**`): record dark-mode/mobile/i18n gaps in §9 (Follow-ups); fix only
  quick wins, no deep rewrites.

## 8. Verification (the "done when" gate)

- `npx tsc -b` clean.
- `npm run build` clean (production gate runs `tsc -b && vite build`).
- Preview walk in the worktree:
  - Home: all three bands render; journey line shows for the demo; presence strip shows
    KE·NG·MW·CD; empty-community sample fallback still works.
  - Currency: explainer + balance with **read-only** daily rates + send-support; no mint/burn
    inputs remain.
  - **Dark mode** correct on every touched surface.
  - **360px** layout holds (flagship Android target).
  - Keyboard + screen-reader basics (focus order, labels/aria on buttons and the menu).
  - No console errors.
- §9 Lane G boxes (G1/G2/G3) satisfied.

## 9. Follow-ups / known debt (log, do not fix now)

- **i18n debt:** existing hardcoded strings in `CommunityView` (~554 lines) and the untouched
  `community/**` files are not yet wrapped in `t()`. Tracked for a later i18n pass.
- **Orphaned components:** `ActivityHub.tsx` and `InitiativeList.tsx` are unused — decide
  repurpose-or-remove later.
- **Nav:** resolved in this lane — inline tab bar removed, hamburger-only (per CLAUDE.md). Update
  CLAUDE.md's CommunityView blurb (already says "no inline tab bar") if it drifts again.
- **Other community surfaces:** any dark-mode/mobile/a11y gaps found while auditing `Members` /
  `Share` / `CollabList` / `IdentityTrust` / `dialogs/**` are recorded here during implementation.

### Implementation audit (Task 7 — 2026-05-31)

Static-only audit (no browser). Touched surfaces reviewed for tokens/dark-mode/a11y/mobile;
remaining `community/**` surfaces skimmed for backlog.

**Touched surfaces (G1/G2 + shell) — polish status: PASS, no code changes made.**
- `MissionBanner.module.scss` + `CommunityHome.module.scss` (NEW): **tokens-only confirmed** — no
  raw hex / raw px / literal `rgba`; only allowed `rgba($primary, 0.25)` alpha. Both carry complete
  `@media (prefers-color-scheme: dark)` blocks covering every text class
  (name/mission/description/feedTitle/feedDescription/cardTitle/cardDesc/author/time). No fixes needed.
- a11y — `CommunityHome` feed cards: `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space,
  with `preventDefault`) — sound. Verified the shared `Card` spreads `...rest` (extends
  `HTMLAttributes`) so these attrs reach the DOM. `MissionBanner` journey strip has `aria-label`.
- `MissionBanner.tsx` / `CommunityHome.tsx`: all user-facing copy goes through `t(key, default)`.
  Exception: the `SAMPLE_FEED` demo titles/descriptions and `formatTimeAgo` strings
  ("just now"/"{n}m ago"/…) are hardcoded English — acceptable for demo fallback; see i18n note below.
- `CommunityView.module.scss` (pre-existing, NOT introduced by Lane G — log only, out of scope to
  fix): raw hex `#f59e0b`/`#1f1f1f` (demo pill), `#dc2626`/`#b91c1c`/`#fef2f2`/`#f87171`
  (danger menu item), literal `rgba(0,0,0,…)` overlays, raw `0.7rem` / `3px 8px` / `4px`. Dark-mode
  and `@media (max-width: $breakpoint-sm)` blocks are present and thorough.
- `Currency.module.scss` (pre-existing — log only): raw `box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1)`
  and `rgba(0,0,0,0.5)` overlay; raw `3rem`/`2.5rem`/`2px`. `max-width: 800px` is centered via
  `margin: 0 auto` and all inner widths are `%`/`max-width`, so it is **not** a 360px hazard.
  Dark-mode + `@media (max-width: $breakpoint-md)` present.
- `Currency.tsx` a11y — the send `<button>` has a discernible label via `t('currency.sendButton',
  'Send Support')`; the member `<select>` and amount `<input>` both have `<label htmlFor>`. No gaps.
  All copy is via `t()` (Lane G reframed it to "Community Support Points").

**Remaining `community/**` surfaces — backlog (NOT fixed this lane):**
- `Members` (`.tsx` + `.scss`) — dark-mode + responsive blocks present and complete; tokens-clean
  SCSS (only `transition: all 0.2s ease` literals). **Gap: all strings hardcoded English** (no
  `useT`): "Members", "Approve/Approved", "Join Community", "Joining...", the too-many-nominates
  message, and `alert('Failed to join community…')`. Native `alert()` used for errors.
- `Share` (`.tsx` + `.scss`) — dark-mode + responsive present; SCSS tokens-clean. **Gaps:** all
  strings hardcoded English ("Share Community", "Copy Credentials", "Download QR Code", etc.); the
  canvas PNG export hardcodes hex colors (`#ffffff`/`#1f2937`/`#e5e7eb`/`#6b7280`) and English
  label text inside `handleDownloadQR` — those are drawn to canvas (not themable via CSS), so they
  won't follow dark mode and aren't `t()`-wrapped.
- `CollabList` (`.tsx` + `.scss`) — dark-mode present; responsive fine (single column). SCSS uses a
  local `$collab-color: #0d9488` var + repeated `rgba(13, 148, 136, 0.x)` **literals** (should be
  `rgba($collab-color, …)` or a token). **Gap: strings hardcoded English** ("Collabs", "Start
  Collab", "Loading...", empty-state copy).
- `IdentityTrust` (`.tsx` + `.scss`) — dark-mode present; SCSS tokens-clean; buttons have text
  labels (good a11y). **Gap: strings hardcoded English** (heading, the web-of-trust paragraph,
  "My ID Card"/"Scan Member"/"Share").
- `ActivityHub` / `InitiativeList` — **orphaned (0 imports**, confirmed via grep across `src`).
  Both still carry full dark-mode SCSS and a few raw hex (ActivityHub 3, InitiativeList 1).
  Decide repurpose-or-remove (already flagged above; reconfirmed).
- `dialogs/**` — **none use `useT`** (all 9 dialog `.tsx` hardcode English). Dark-mode coverage is
  mixed: `CreateFlowDialog.module.scss` and `CreateIssueDialog.module.scss` have **no dark-mode
  block** and the heaviest raw-hex load (~24 literal hex each); the other six dialogs do have
  dark-mode blocks. Also orphaned (0 imports, consistent with the dialog→full-page migration noted
  in CLAUDE.md): `CreateInitiativeDialog`, `CreateIssueDialog`, `CreateFlowDialog` — candidates for
  removal alongside the live ones (`ApprovalDialog`, `CreateCollabDialog`, `MessageDialog`,
  `IdentityCardDialog`, `QRScannerDialog` remain in use).

**i18n coordination note:** the new `community.*`, `stage.*`, `journey.*`, and `currency.*` keys use
inline English defaults — correct for Lane G, which does not own `src/i18n/`. They render in English
via the `t(key, default)` fallback but are not yet in the `en`/`fr`/`sw` dictionaries; backfilling
them (plus the hardcoded strings in the backlog surfaces above) is a Lane F / coordination
follow-up (cf. the existing "[A → Lane F]" item in MASTER_TODO §10).

## 10. Open questions

None outstanding — G1/G2/G3 scope, the currency read-only-rates decision, i18n approach, and nav
handling (remove tab bar, hamburger-only) are all decided above.
