# W6 — Community chrome & collab polish (design)

**Session:** S29 · **Branch:** `ui` · **Base:** `bfc9124` (W5 shipped + pushed, deploy green)
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 **Wave 6 — the LAST wave**. Shipping this
closes the UI-Polish & DS-Enforcement campaign.
**Class:** UI-only (no `src/services/demo/` change → **no `DEMO_VERSION` bump**). One visible-label
rename (6.1) → i18n discipline + packet.

---

## 1. Re-grounding vs HEAD `bfc9124` (the S10–S28 lesson — every session finds stale premises)

| # | Prompt premise | Reality at HEAD | Verdict |
|---|---|---|---|
| 6.1 | "Menu"→"Community options", bigger, add `aria-haspopup="dialog"` | Label `t('community.menuButton','Menu')`; hero row `.startBtn{flex:1}` (grows) + options shrink-to-fit; **aria already present but WRONG** (`"menu"` — target is `role="dialog"` SlideOutMenu) | **Real edit**: rename (en/fr/sw) + aria `menu`→`dialog` + enlarge |
| 6.2 | Shrink "Start an initiative" | Start `flex:1`; options natural width | **CSS taste** (§6 #3) |
| 6.3 | Remove blue left-border artifact | `border-left:3px solid $primary` at **:52 (light) + :113 (dark)** over uniform `1px $gray-200` | **Mechanical** — delete both |
| 6.4 | Drawer reachable on section pages | `onOpenMenu`(→`setShowMenu`) wired **only** to CommunityHome (`CommunityView:387`); section pages get the back-button header, no community-menu trigger. Global `HomepageMenu` (AppHeader hamburger, `aria-haspopup="dialog"`) **is** on every page | **Eston's call** (§6 #4) |
| 6.5 | createBtn AA + `800px`→`$content-max-width` | createBtn AA+44px **already fixed W5** (`$primary-dark` light / `$primary-on-dark` dark); **no `800px` anywhere in `src`** — `.container` intentionally empty (S24) | **Verify-only**; max-width half is a **dead premise** |
| 6.6 | Collab header inherits header law | Section header = W1 `sectionHead` AppHeader | **Verify-only** at 360px |

**Two stale-premise catches (15th consecutive session):** 6.5's "grep for the 800px owner" → *there is
no 800px owner*; 6.1's aria is a *fix* (`menu`→`dialog`), not an *add*.

---

## 2. Locked decisions (Eston, 2026-07-12, recommend-then-confirm)

1. **Hero-row balance (6.1/6.2):** *Keep Start dominant.* "Start an initiative" stays the primary/
   larger action; "Community options" enlarges to a comfortable secondary tap target (not
   shrink-to-fit). **Not** equal 50/50; **not** stacked.
2. **Drawer reachability (6.4):** *Inject the community mini-app items into the global menu.* Honors
   the locked single-AppHeader model — no second header, no reintroduced left drawer. (Rejected:
   bottom-of-content affordance; hamburger-swaps-to-community-menu.)
3. **W5 tail scope:** *W6 core only (6.1–6.6).* Currency EmptyState/floors, Members-rows→Card, and
   BallotSolutionCard extraction all stay deferred in §7. BallotSolutionCard is explicitly its own
   future focused session (risk lives in the voting core).

---

## 3. The changes

### T1 — 6.3 · delete blue left-border test artifact  *(chore)*
`src/components/community/CollabList.module.scss`:
- Delete line 52 `border-left: 3px solid $primary;` (light `.item`).
- Delete line 113 `border-left-color: $primary;` (dark `@include dark .item`).
Reverts `.item` to the uniform `border: 1px solid $gray-200` (light) / `$dark-border` (dark). Grep the
`@include dark` block too (W5 lesson: deletions leave orphaned dark overrides). Its own `chore(s29)`.

### T2 — 6.1 · rename + aria fix  *(feat + i18n)*
`src/components/community/CommunityCard.tsx`:
- Inline: `t('community.menuButton', 'Menu')` → `t('community.menuButton', 'Community options')`.
- `aria-haspopup="menu"` → `aria-haspopup="dialog"` (the trigger opens the `role="dialog"`
  `aria-modal` SlideOutMenu; matches AppHeader's correct hamburger).
`src/i18n/fr.ts:468` `'community.menuButton': 'Menu'` → `'Options de la communauté'`.
`src/i18n/sw.ts:467` `'community.menuButton': 'Menyu'` → `'Chaguo za jamii'`.
Key exists in both overlays → parity preserved; append to i18n packet (native pass).
*(Only string change in W6. All 6.4 nav labels reuse existing keys — zero new i18n.)*

### T3 — 6.2 · hero-row rebalance  *(feat, same file/commit as T2)*
`src/components/community/CommunityCard.module.scss` `.actions` / `.startBtn` (+ new `.optionsBtn`):
- **Intent:** Start dominant, options a comfortable secondary target, both ≥44px (Button enforces
  min-height). Start no longer greedily consumes all free space; options is no longer shrink-to-fit.
- **360px reality:** usable action-row width ≈ 288px; "Start an initiative" and "Community options"
  each need ~150px (worse in fr, ~+25%) — they cannot both sit full-width side-by-side without
  truncation. So the row **wraps gracefully**: side-by-side (Start dominant, ~2:1) when there's room;
  stacks (Start on top) when cramped — never truncates. Concretely:
  ```scss
  .actions   { display: flex; flex-wrap: wrap; gap: $spacing-sm; }
  .startBtn  { flex: 2 1 auto; }         // dominant; grows 2× the free space
  .optionsBtn{ flex: 1 1 auto; min-width: max-content; }  // comfortable; never clips its label
  ```
- **Exact flex ratios + wrap threshold are tuned against the live 360px preview (light+dark, en+fr).**
  If forced-side-by-side-at-360px is wanted instead of wrap, that's a follow-up taste tweak (flagged).

### T4 — 6.4 · inject community nav into the global menu  *(feat)*
`src/components/identity/HomepageMenu.tsx` becomes community-context-aware:
- Detect `/community/:communityId/*` via `useLocation()` + `matchPath` (same technique CommunityView
  already uses for its header). No Redux read needed beyond the existing `hiddenCount`.
- When inside a community, **prepend** a community-nav group mirroring CommunityView's `menuItems`
  navigation subset — **reusing the existing keys** (zero new i18n):
  `community.menu.home`→`/stage/problem`, `initiative.start`→`…/create-initiative`,
  `community.menu.writeTogether`→`…/write-together`, `community.menu.collab`→`…/collab`,
  `community.menu.chat`→`…/chat`, `community.menu.funds`→`…/currency`,
  `community.menu.members`→`…/members`, `community.menu.identity`→`…/identity`,
  `community.menu.settings`→`…/settings`. Each is a plain `navigate()` + `onClose()`.
- Put `dividerBefore: true` on the first **global** item (`welcome`) so the two groups read as
  distinct. Panel title stays `menu.title` ("Menu").
- **Excluded** (stay exclusive to the community SlideOutMenu on home): Share/Invite/Leave/Share-Demo/
  Reset-Demo — those need CommunityView's stateful handlers (`showConfirm`, `resetDemoCommunity`,
  `buildDemoShareLink`, `isDemo`). Duplicating that logic is out of W6 scope; the reachability gap is
  specifically *jumping between sibling sections*, which the nav subset fully solves.
- **Lock compliance:** no new header (edits the AppHeader's already-self-managed account menu), no
  left drawer (SlideOutMenu is a right-side `role="dialog"` overlay), route map unchanged (all
  destinations are existing routes).
- Non-community pages (`matchPath` → null) and initiative pages are unaffected.

### T5 — 6.5 · verify createBtn + confirm no max-width owner  *(verify-only)*
Confirm in preview: `.createBtn` `$primary-dark` on `rgba($primary,.1)` (light) and `$primary-on-dark`
(dark) both ≥4.5:1; `min-height:44px`. Confirm no 800px / runaway width (grep clean; `.container`
empty; createBtn full-width inside the 640px page-column).

### T6 — 6.6 · verify collab header  *(verify-only)*
Confirm the collab section header (e.g. "Climate Resilience Assembly" collab title) inherits the W1
header-gutter law at 360px — no cramped padding.

### DS codification (campaign through-line: codify so drift can't recur)
`DESIGN_SYSTEM.md` — add a one-line note to the App-shell / SlideOutMenu documentation that **the
global account menu is context-aware: inside a community it prepends the community's section-nav
(reusing `community.menu.*`), so every mini-app is reachable from every section page via the one
always-present hamburger** — the reachability guarantee that replaces a second header/drawer.

---

## 4. Verification plan

- `npx tsc -b` clean; `npm run build` (`tsc -b && vite build`) clean.
- **Preview walk at 360px, light + dark** (reload after `colorScheme` flip — the dark walk is where
  contrast regressions surface): CommunityCard hero (en + fr) — Start dominant, options comfortable,
  no truncation, ≥44px; open the global menu on a **section page** (e.g. members) — community nav
  present, every mini-app reachable, groups divided; CollabList — uniform borders, createBtn AA;
  collab header padding.
- i18n parity scanner `RESULT: PARITY OK` (6.1 keeps key parity; 6.4 adds none).
- One `<h1>` + one AppHeader per route (6.4 adds neither).
- `$gray-400`-as-text grep gate clean.

## 5. Review + gates

Adversarial whole-branch Workflow review (Opus, refute-by-default; "no verdict" ≠ refuted) + independent
grep gates on a clean result. Then **Eston's explicit push green light** (push = production deploy).
PR #20 ✗ = expected Ouri-divergence.

## 6. Out of scope (stays deferred in §7)

Currency EmptyState + input floors (needs the global-`.input-field` blast-radius decision);
Members rows → `Card`; **BallotSolutionCard** extraction (own focused session — QVFlow unvoted/voted
+ VotePreview shared chrome with optional slots; the risk is the voting core).

---

## 7. Commit order (docs before feat; `ui` runnable each)

1. `docs(s29)` — this spec.
2. `chore(s29)` — T1 (6.3 border delete).
3. `feat(s29)` — T2+T3 (6.1 rename+aria, 6.2 hero rebalance) + i18n.
4. `feat(s29)` — T4 (6.4 global-menu injection).
5. `docs(s29)` — DS codification + i18n packet.
6. Closeout `docs(s29)` — §7/§8, memory, handoff-readiness note (campaign COMPLETE).
