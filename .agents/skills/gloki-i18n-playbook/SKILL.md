---
name: gloki-i18n-playbook
description: Use when adding, changing, or removing any user-facing string in Communities2/Gloki; when touching src/i18n/ (en.ts, fr.ts, sw.ts, index.tsx), t() calls, {var} interpolation tokens, or LanguageSwitcher; when fr/sw parity might be broken or a translation looks missing/English in fr/sw; when running or recreating the i18n parity scanner; when updating the native-review packet docs/i18n-native-review-candidates.md; when localizing country/region names; or when asked about Chichewa/ny.ts or new locales.
---

# Gloki i18n Playbook


## Overview

**Core principle: nothing in this i18n system ever fails loudly.** The lookup chain
falls back `active locale → English → inline default → the key itself`, so a key
added to `fr.ts` but not `sw.ts` (or to neither) renders perfectly in English and
silently shows English (or the raw key) in the other locales. No TypeScript error,
no build failure, no console warning. Parity between the French and Swahili
overlays is therefore a *discipline* enforced by a checklist and a checked-in
scanner script — not by the compiler. This skill is that discipline.

Definitions used throughout:

| Term | Meaning |
|---|---|
| **overlay** | A full translation dictionary (`fr.ts`, `sw.ts`) that shadows the inline English defaults |
| **inline default** | The second argument to `t('key', 'English default')` — where English feature copy actually lives |
| **parity** | `fr.ts` and `sw.ts` hold *identical key sets* and matching `{var}` token sets per key |
| **the packet** | `docs/i18n-native-review-candidates.md` — the human-gated worklist for native fr/sw reviewers |
| **wire names** | Contract/stage key vocabulary that must match the real contracts (e.g. `proposals`), regardless of UI copy |

## When NOT to use this skill

| Situation | Use instead |
|---|---|
| Changing seeded demo/fixture text (problem titles, comments, mandate bodies — English in every locale by design) | **gloki-seam-and-demo-data** (fixtures are data, not i18n; DEMO_VERSION rules live there) |
| Renaming a contract method or stage key to match UI vocabulary | **gloki-python-contracts** + **gloki-change-control** (wire names are locked) |
| Layout/spacing/typography rules for the 360px flagship target | **gloki-frontend-architecture** / DESIGN_SYSTEM.md |
| Deciding whether the fr/sw native review can be done by a model | **gloki-change-control** — it cannot; permanently human-gated (see Open tail) |
| Updating MASTER_TODO/changelog/session docs after i18n work | **gloki-docs-and-writing** |
| Removing orphaned i18n keys as part of a dead-code sweep | **gloki-refactor-and-dead-code** (consumer-graph tracing) |

## Architecture

Hand-rolled provider — **no i18next, no JSON catalogs, no typed key union.** All in
`src/i18n/`:

| File | Role | Size (2026-10-29) |
|---|---|---|
| `src/i18n/index.ts` + `I18nProvider.tsx` | `useT()`, `useI18n()`, framework-agnostic `translate()`, `getStoredLocale()`; the provider | ~100 lines |
| `src/i18n/types.ts` | `Locale = 'en' \| 'fr' \| 'sw'`; `Dictionary = Record<string,string>` (flat dotted keys); `Vars` | 7 lines |
| `src/i18n/en.ts` | **Partial seed only** — shell/kit strings (common.\*, app.\*, nav). ~116 lines, 76 keys | intentionally small |
| `src/i18n/fr.ts` | **Full overlay** — ~1,530 keys | ~1,690 lines |
| `src/i18n/sw.ts` | **Full overlay** — ~1,530 keys | ~1,690 lines |

Facts you will otherwise guess wrong:

- **English feature copy lives INLINE in components**, as
  `t('flat.dotted.key', 'English default')`. `en.ts` is deliberately missing
  most of the overlay keys. Do NOT "fix" this by backfilling en.ts — only promote a
  string into en.ts if it is genuinely shared shell/kit copy.
- **Lookup order** (`translate()` in `index.tsx`):
  `DICTS[locale]?.[key] ?? DICTS.en[key] ?? defaultValue ?? key`. A missing key is
  visible (English or raw key), never a crash — and never a build error.
- **Interpolation**: `{name}` tokens replaced from the `vars` arg; **unknown tokens
  are left visible as `{name}`** (that's your visual smoke test for token typos).
- Locale persists under localStorage key **`gloki.locale`**; `getStoredLocale()`
  exists for pre-provider code (ErrorBoundary). `document.documentElement.lang` is
  synced by the provider.
- Switcher: `src/components/shared/LanguageSwitcher.tsx`, driven by the `LOCALES`
  array in `index.tsx`. Language names stay as **endonyms** — `lang.en/fr/sw` are
  intentionally NOT overridden in fr.ts/sw.ts (fr.ts header comment).

Real call shape (SolutionsBoard.tsx:57):

```tsx
t('mechanisms.approval.evidenceReviewToggle', 'Evidence & expert review ({n})', { n: reviews.length })
```

## THE RITUAL — every new or changed user-facing string

Run this checklist for **every** string, every time. Steps 2–3 in the **same
commit** as step 1 — split commits are how parity breaks.

1. **Inline t() in the component**: `t('flat.dotted.key', 'English default')`.
   Namespace by feature family (`mechanisms.approval.*`, `mandate.*`,
   `onboarding.*` — grep neighbors for the convention). Do NOT add the key to
   `en.ts` unless it is shared shell/kit copy.
2. **Add the key to BOTH `fr.ts` AND `sw.ts`**, in the matching section, preserving
   every `{var}` token exactly (token text identical; surrounding words may move).
   Translations are model-produced at this stage — that's accepted; the native pass
   is a separate human-gated step.
3. **Run the parity scanner** (below) — require `RESULT: PARITY OK`.
4. **Layout-check touched screens at 360px in fr AND sw** — French runs ~20–30%
   longer than English and clips buttons/chips first. In DevTools:
   `localStorage.setItem('gloki.locale','fr')` then reload (then `'sw'`).
   *Subagent note:* implementer subagents verify via `npm run build` only; the
   preview browser is shared and sequential — the controlling session drives the
   360px check (see gloki-verification-and-qa).
5. **Append the new/changed strings to `docs/i18n-native-review-candidates.md`**
   under a new dated session section at the bottom (follow the "Session 15
   (2026-07-02)" section as the template: key, English gloss, fr text, sw text, one
   line of context/concern for the reviewer).
6. When **removing/renaming** a key: delete from BOTH overlays, re-run the scanner,
   and strike/annotate any packet reference to it (`**[removed]**` /
   `**[relocated]**` inline — see the packet's "Keys retired" table for the style).

**The classic silent break** (has happened; nothing catches it at build time):
adding a key to only one overlay. English users see nothing wrong, fr or sw users
silently get English. Only the scanner catches it.

### Builds and page states

- **The beta build hides the language switcher** (`SHOW_LANGUAGES` in `src/appMode.ts`) — beta screens
  are English-only for now; `beta.*` keys may exist without overlays. The full build shows all three
  locales.
- **Demo variants are pages like any other**: their strings go through `t()` with fr/sw overlays at
  parity (e.g. `demoMode.notice` / `demoMode.showReal` for `<DemoNotice />`). Seeded demo *data*
  (fixtures) stays English — that's data, not i18n.

## Parity tooling

### Primary: the checked-in scanner (ships with this skill)

```bash
node .agents/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs [repo-root]
```

(Arg optional when cwd is the repo root.) Output on the trunk, 2026-10-29:

```
Parsed keys: en=76 fr=1533 sw=1533
Token check: all shared keys have matching {var} sets.
RESULT: PARITY OK
```

Exit 0 on OK, exit 1 with per-key diffs on FAIL. It checks: fr↔sw key-set
equality (position-agnostic), per-key `{var}` token-set equality, duplicate keys
within each file, and warns on entry-like lines that failed to parse (format-drift
guard). It knows `lang.en/fr/sw` are intentionally en-only.

This script **supersedes the historical throwaway** `/tmp/i18ncheck_b12.mjs` that
the packet's Ground rule 4 still cites (the packet predates this skill). If the
packet tells you to recreate a /tmp script — don't; run this one.

### Fallback: BSD-safe grep/comm one-liner

If node is somehow unavailable, the macOS-safe set-diff (this exact recipe is
baked into session prompts since S13):

```bash
comm -3 <(grep -oE "^ *'[^']+':" src/i18n/fr.ts | sed 's/^ *//' | sort -u) \
        <(grep -oE "^ *'[^']+':" src/i18n/sw.ts | sed 's/^ *//' | sort -u)
```

Empty output = key sets match. **Known blind spots of the one-liner**: (a) it checks keys only, not
`{var}` tokens; (b) the line-anchored pattern misses a second entry sharing a line (one line in each
overlay carries two entries). Don't trust the one-liner for a final gate — use the script.

### Hard-won trap rules (each cost a real session)

| Trap | Rule | Incident |
|---|---|---|
| `sed`/`grep` with `\s` on macOS | BSD tools have **no `\s`** — a naive extraction produced a huge FALSE parity diff. Use literal `^ *'[^']+':` | S13, 2026-07-01 |
| Line-positional `diff fr.ts sw.ts` | Files have different comment/ordering drift — always compare as **sorted-unique sets** (`sort -u` + `comm`) | S13 |
| `grep -c "': '"` to count keys | Undercounts (double-quoted values, shared lines) — count via the extraction pattern or the script | recorded in project memory, 2026-06 |

## The packet: docs/i18n-native-review-candidates.md

The 795-line append-log worklist for the (unassigned) native fr + sw human
reviewers. The overlays are model-translated and live; the packet scopes the human
polish pass (register, idiom, Swahili noun-class concord, the *Suluhisho* swap).

Discipline when touching it:

- **Append, don't rewrite**: new session sections go at the bottom, dated, above
  "How to deliver fixes".
- **Cross-check every cited key against HEAD before hand-off.** Keys get renamed or
  removed across sessions and the packet goes stale *silently* — `PARITY OK` does
  not validate doc references. In S8 (2026-06-29), 6 stale key references had to be
  struck before the packet could be handed to a human. Quick check for a key:
  `grep -n "'the.key':" src/i18n/fr.ts` plus `grep -rn "t('the.key'" src`.
- Its 5 Ground rules (lines 62–80) bind the human reviewer: identical fr/sw key
  sets; never alter `{var}` tokens; edit ONLY fr/sw (en.ts intentionally partial);
  re-run the scanner after edits; 360px layout check in both locales.
- The native review itself is **permanently human-gated** — never mark it done, and
  never present model output as the native pass (see gloki-change-control).

## Country and region names — the precise rule

Two different rules coexist; don't collapse them into one:

- **Region labels stay English.** The 6 world regions in `src/utils/regions.ts`
  are data, not i18n; DESIGN_SYSTEM.md:88: "Region names stay English (not i18n)."
  The only live region-label i18n key is `mechanisms.qv.regionOther`.
- **Country names are localized** via `getCountryName(code, locale)`
  (`src/utils/countries.ts:238`, added S14): `Intl.DisplayNames` with a per-locale
  cache, falling back to the canonical-English `COUNTRIES` name when the code is
  `'OTHER'` or the API can't resolve. Pass `useI18n().locale` at every call site.
- **Doc-drift warning**: DESIGN_SYSTEM.md's CountryMultiSelect note ("country
  proper nouns render canonical-English", ~line 258) **predates S14** and describes
  the fallback, not current behavior — CountryMultiSelect itself calls
  `getCountryName(code, locale)`. Don't "restore" English names to comply with it.

**When sweeping country-name rendering, grep BOTH patterns** — S14 initially
missed 3 call sites by grepping only one:

```bash
grep -rn "getCountryName(" src        # locale-aware sites (should pass locale)
grep -rn "getCountryByCode" src        # raw .name access hides here
```

Known benign exception: `src/components/shared/presence/WorldMapLite.tsx`
calls `getCountryName(code)` without locale — but its only consumer is
`PresenceShowcase.tsx`, which has no consumers outside `presence/` (orphaned
showcase). If it ever gets wired in, thread the locale first.

## Vocabulary rules the key names encode

- **Key families keep wire vocabulary.** The UI says "Solutions" but keys stay in
  the `*.proposals.*` families (`nav.proposals`, `stage.proposals`,
  `initiative.stages.proposals.desc`, …) because the contract stage key is
  `proposals` — contract/wire names must match the real contracts exactly.
  Renaming a key family to match UI copy is a change-control violation, not a
  cleanup (see gloki-python-contracts).
- The discussion-board category "Ideas" lives at `deliberation.category.solutions`
  (internal key `solutions`, display fr *Idées* / sw *Mawazo*) — a deliberate
  collision-avoidance rename, decided by Eston 2026-06-20. Leave it.
- Per-locale stage terms are locked product decisions: fr **Solutions**, sw
  **Suluhisho** (Eston chose over *Suluhu*). Don't relitigate.

## Adding a whole new locale (open item: Chichewa `ny.ts`)

Still open (MASTER_TODO.md §7, P5 tail). Scope if picked up: new `src/i18n/ny.ts` at full parity
(~1,530 keys), plus edits to
`src/i18n/types.ts` (`Locale` union), `index.tsx` (`DICTS`, `LOCALES`, the
`isLocale()` guard — all three hardcode the locale list), an endonym `lang.ny`
key, and the scanner's `FILES` list + packet scope. It **widens the human-gated
review backlog** — recommend-then-confirm with Eston before starting; this is a
product decision, not a mechanical task.

Also open (labeled open, do not build unilaterally): **content-translation
strategy** — fixture/content text is English in every locale by design;
backend-adjacent, needs Ouri coordination (MASTER_TODO.md P5 tail).

## Provenance and maintenance

Updated 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Fact | Re-verify with |
|---|---|
| Key counts and parity status | `node .agents/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` |
| Locales registered | `grep -n "LOCALES\|DICTS" src/i18n/index.ts` |
| Beta hides the switcher | `grep -n SHOW_LANGUAGES src/appMode.ts` |
| Country-name localisation | `grep -n "export function getCountryName" src/utils/countries.ts` |
| Packet format | `tail -40 docs/i18n-native-review-candidates.md` |
