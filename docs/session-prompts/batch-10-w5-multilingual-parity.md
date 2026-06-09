# Session prompt — Batch 10: W5 fr/sw multilingual parity (+ the small W2/W3 long tail)

Paste this whole file into a fresh Claude Code session on the `ui` branch. This is the **final wave of the
Batch-9 cleanup roadmap** (`docs/session-prompts/batch-9-cleanup-i18n-and-parity.md` has the wave model;
`batch-9b-continue-cleanup-waves.md` has the 9b state). Batches 9a+9b completed **W1–W4 and both gates** —
the i18n *wiring* is done on every major surface, so the locale work is finally unblocked.

> Still a roadmap, not one session. W5 (translation + switcher) is the headline; the §3 long tail is
> opportunistic. Write the next-session prompt for whatever remains.

---

## What Batch 9b shipped (local commits `e330929..5da5168` on `ui`, NOT pushed — Eston controls deploy)

> Note: when 9b started, `origin/ui` was already at `30424b8` (the 9a commits got deployed). The 13 commits
> after it are local-only.

- **W2 i18n wiring — COMPLETE.** StageFeedView (threshold/loading/sample banners; dead
  `STAGE_CONFIG.description/emptyHint` fields deleted — they were never rendered), CreateInitiativePage
  (stage explainer reuses `dashboard.stage.{id}.label`; **"Problem Recognition" → "Problem"** vocab fix;
  tips split lead/body around `<strong>`), Members (`members.*`, suffix-var plural), CreateCommunityPage
  (was zero-`useT`; `createCommunity.*`), chat pair (`chat.*`), RolesFlow (`roles.*`),
  CreateCollabDialog (`collab.create.*`), SearchableSelect (`select.*` incl. the `'Select...'` default
  prop), MergeProposalSubmitModal (`deliberation.merge.submit.*`), + an app-wide
  aria-label/title/placeholder sweep (remaining unwired hits are only the `Gloki` brand title and
  non-English `https://` placeholders). `'Not logged in'` is unified on **`common.notLoggedIn`**.
- **formatTimeAgo consolidated** (review §7): `src/utils/formatTimeAgo.ts` is the single relative-time
  module — `relativeTimeKey(minutes)` → `{key,def,vars}` descriptors on the canonical **`time.*`** family
  (`time.now/minutes/hours/days`), `formatTimeAgo(t, ts, {maxDays})` as the translated form. The
  CommunityHome + ChatTopicList duplicates are gone; `relativeTimeKey` moved OUT of
  `demo/fixtures/deliberation` (review §8.4) — AnchoredThread/PositionsBoard now have zero fixtures imports.
  The old `deliberation.time.*` keys are gone (no fr/sw overlay had them).
- **W2f:** the dead Roadmap/Gaps/Steps wrapper family was removed from `services/contracts/initiative.ts`
  (~300 lines; zero importers verified per symbol). Live surface: `getInitiative`, `normalizeStageContract`,
  `resolveInitiativeStageContract`, `resolveAndJoinInitiativeStageContract`.
- **W3 token-debt — COMPLETE** (a11y §1b family): NotificationsBell dropdown is a standard light popover
  with a dark variant (the old panel was hardcoded-dark in BOTH themes), RoleChip/RoleDisplay/
  ExpertEndorseButton use the semantic surface pairs, the merge flow (Card/List/SubmitModal) is light-first
  + dark, `.absorbedBanner` → `<Banner tone="warning">` with a `<Button>` action, the three dialogs are
  hex-free (new **`$success-dark`** token added). **Bundle:** jsPDF/svg2pdf are dynamic `import()`s —
  IdentityCardDialog chunk **484KB → 9.6KB**, PDF deps load on the Download click (verified via
  performance entries).
- **W4 — COMPLETE:** shared Modal has focus-on-open + Tab trap + restore (SlideOutMenu pattern), **plus a
  live-check catch:** disabled controls are excluded from the trap edge in BOTH Modal and SlideOutMenu
  (a disabled footer button let Tab escape). StageFooter has `aria-label` + `aria-current="page"`.
- **🚦 Gates resolved by Eston (question tool, Batch 9b):**
  - **Gate A:** `$primary` `#3b82f6` **stays** (3.68:1 accepted brand deviation) — now recorded in
    DESIGN_SYSTEM.md → Accessibility. **Do not darken it.**
  - **Gate B:** stage advance is **author/co-authors only** — the dashboard advance bar renders behind
    `isAuthorOrCoAuthor(roles, publicKey)`; `getInitiativeRoles` falls back to `get_details.author` when
    `get_roles` is absent (older/demo contracts). `set_stage` failures surface as a `role=alert` message.
    Verified live both ways (hidden on a persona-authored seeded initiative; visible on an own-authored one).

## How we work (non-negotiable — unchanged)

- **Branch + seam:** develop on `ui` against the stub layer (`src/services/api.ts` / `src/services/demo/`)
  only. Don't widen the §8 seam leaks.
- **Design system is law** (`DESIGN_SYSTEM.md`): tokens only, AA contrast, focus-visible, ≥44px, light +
  dark, 360px. **`$primary` stays #3b82f6 by decision — see the Accessibility note.**
- **Verify before "done":** `npx tsc -b` && `npm run build` exit 0 (zsh: use `cmd && echo OK || echo FAIL`),
  then walk affected routes live (`preview_start({name:"gloki-dev"})`, port 5173). For locale work: switch
  to fr and sw and walk the 5-stage feed, onboarding, a community, the dashboard, and the mandate page —
  no overflow at 360px (French runs ~20–30% longer), no missing-var `{n}`-style artifacts.
- **Commit locally**, small chunks, `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  trailer. **Do NOT push.**
- **Slow external drive:** small sequential I/O batches; `rg` via Bash.

## Demo facts (9b-verified, save time)

- Seed for authed routes: `localStorage.user = {publicKey:'<64 alnum>', serverUrl:'https://gdi.gloki.contact'}`
  **+** `gloki.digitalAgent` (full agent incl. `languages:['en']`) **+** `gloki.onboarding={step:6,completed:true}`.
- A fresh profile has NO demo communities — **create one via `/create-community`** (it auto-seeds a demo
  community incl. personas and initiatives and navigates into it). Initiative ids land in
  `localStorage['gloki_demo_state_demo-init-…']`.
- React controlled inputs ignore `preview_fill` — use the **native setter + `input` event** trick, then
  click. The NotificationsBell toggles per click (an even number of synthetic clicks = closed); query the
  DOM in a `setTimeout` after a single click.
- The preview emulates dark by default on this machine — use `preview_resize({colorScheme:'light'|'dark'})`
  to pin each theme.

---

## W5 — fr/sw parity (the headline)

1. **Harvest the key inventory by grepping the code, not en.ts.** The wiring uses inline defaults, so the
   dictionary is the union of `src/i18n/en.ts` AND every `t('ns.key', 'English default'[, vars])` call:
   `rg -o "t\(\s*'[^']+'\s*,\s*'[^']*'" src --glob '*.tsx' --glob '*.ts'` (mind `"`-quoted defaults and
   multi-line calls too). Expect several hundred keys.
2. **Translate into `src/i18n/fr.ts` + `src/i18n/sw.ts`.** Keep `{vars}` placeholders verbatim. Keys not
   overlaid fall through to English — translate breadth-first by surface priority: nav/footer + onboarding
   + stage feed + dashboard + mandate first, deep collab flows last.
3. **The plural pattern needs restructuring as you go:** `t('k','{n} item{s}',{n,s})` is English-only
   morphology. For fr/sw, restructure those call sites to full-string alternatives
   (`n === 1 ? t('k.one','…') : t('k.many','…',{n})`) or n-in-string forms — don't try to translate a bare
   `{s}` suffix. Same for the `<strong>` lead/body split keys (`initiative.tips.*`,
   `createCommunity.why.*`): translate as two strings; restructure only if a language can't split that way.
4. **Stage-label key families (unify or translate all three consistently):** `nav.*` (footer short forms),
   `dashboard.stage.{id}.label` (dashboard + create page), `stage.*` (CommunityHome badges). Same English
   today except `nav.discussion`='Discuss'. Consider collapsing to two families (short + full) in en.ts.
5. **Pre-auth language switcher** (deferred a11y finding #11, explicitly tied to this wave): add
   `<LanguageSwitcher>` to the LoginPage card header (the component exists in the shared kit and the
   `lang.*` keys are in en.ts). Verify focus/44px/dark.
6. **Data-table scope decisions (ask Eston only if you want to expand scope):** country names
   (`utils/countries.ts`, 197 names + the CreateInitiativePage `COUNTRY_OPTIONS` four), `COLLAB_TEMPLATES`
   labels/descriptions, and the demo/sample initiative content (SAMPLE_INITIATIVES, fixtures) are **data,
   currently English by design** — the settled default is to leave them; fr/sw chrome around English demo
   content is acceptable for the mockup.

## §3 — Small long tail (opportunistic, after W5 or while waiting)

- **Deep-flow literal wiring (W2 leftovers, flagged in 9b):** ConcernsFlow + DiscussionFlow +
  ApprovalFlow/QVFlow bodies got placeholders only — their remaining literals (severity chips, filter
  chips, vote/error strings) still need `t()`. Also spotted unwired: CommunityView's header "`{n} members`"
  count line, `PipelineView.tsx:261` ("<strong>{n} members</strong> (33% …)" sentence), ChatTopic's
  `formatTime` (absolute date — fine, but its output is locale-static `undefined` locale — OK as is).
- **Remaining TSX color literals (not SCSS, so the W3 sweep left them):** CreateInitiativePage `STAGES[].color`
  hexes (step circles — needs stage-color tokens or per-stage SCSS classes) and ConcernsFlow's
  `severityColor` literal rgba ladder (~line 100). Plus a11y §4's CommunityView.module.scss (2 hex) and
  CollabList if still present.
- **alert()/confirm() → shared Modal** (review §5 community-home item; Members.joinFailed still uses alert).
- The **(optional)** W4 leftover: migrate hand-rolled buttons (chat send/back, Stepper, merge-flow buttons)
  to the shared `Button`.

## The `ui → main` review PR (#20)

Scope has shifted materially since it was refreshed (W1–W4 + gates done): once Eston pushes, update the PR
body — cleared items from review §2/§4 (advance gating now author-only, Modal trap done, bell/merge/dialog
token-debt done, i18n wiring done, 484KB chunk fixed), and keep pointing at §8 for the seam swap surface.
**Ouri reviews/merges — don't merge; the 2 upstream `main` commits still need reconciling.**

## Sizing + when done

fr/sw translation alone is a full session (several hundred keys × 2 locales + live walks in both). Switcher
+ plural restructuring is a second chunk. `tsc -b` + build green; live fr/sw walks (light/dark/360px);
small local commits; **no push**. Hand back with shipped-vs-deferred + the next-session prompt.
