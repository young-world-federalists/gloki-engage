# Lane F — Presence, Multilingual & Low-tech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement
> this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **No unit tests in this repo** (CLAUDE.md: "No test framework — verify via `npm run dev` and browser
> DevTools"). The per-task verification is `npx tsc -b --noEmit`; final gates add `npm run build` and a
> preview walk. This overrides the skill's TDD default.

**Goal:** Ship Lane F's cross-cutting drop-in primitives — fixture-driven live translation, transnational
presence motifs, and low-bandwidth/offline UX — for other lanes to import.

**Architecture:** Plain reference fixture (`presence.ts`) → token-only, dark-mode-aware, i18n-driven
shared components under `shared/presence/**`, `shared/connectivity/**`, and `shared/AITools.*`. Data-saver
state is a provider-free `useSyncExternalStore` hook backed by `localStorage`. A `PresenceShowcase`
gallery (temp-mounted for verification) exercises everything; FR/SW dictionaries are enriched last.

**Tech Stack:** React 19 + TypeScript, SCSS modules, `clsx`, `lucide-react`, the existing `useI18n`/`t()`
layer, the Foundation shared kit (`Card`, `Badge`, `Button`, `CountryFlag`, `CountryPresence`,
`LanguageSwitcher`).

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/services/demo/fixtures/presence.ts` (modify) | Types + reference data: languages, participation, sample translated posts incl. bridge/sync states |
| `src/components/shared/connectivity/useDataSaver.ts` (create) | Provider-free localStorage data-saver state via `useSyncExternalStore` |
| `src/components/shared/connectivity/DataSaverToggle.tsx` (+`.module.scss`) | The data-saver switch |
| `src/components/shared/connectivity/SmartImage.tsx` (+`.module.scss`) | Data-saver-aware image with light placeholder |
| `src/components/shared/connectivity/SyncBadge.tsx` (+`.module.scss`) | synced / pending / offline indicator |
| `src/components/shared/connectivity/ChannelBadge.tsx` (+`.module.scss`) | "via WhatsApp/SMS/app" representation |
| `src/components/shared/connectivity/index.ts` (create) | Barrel |
| `src/components/shared/presence/LanguageBar.tsx` (+`.module.scss`) | "Spoken here" + embedded LanguageSwitcher |
| `src/components/shared/presence/ParticipationSummary.tsx` (+`.module.scss`) | CountryPresence + "N from M countries" caption |
| `src/components/shared/presence/WorldMapLite.tsx` (+`.module.scss`) | Flag-constellation map |
| `src/components/shared/presence/PresenceShowcase.tsx` (+`.module.scss`) | Verification gallery of all Lane F components |
| `src/components/shared/presence/index.ts` (create) | Barrel |
| `src/components/shared/AITools.tsx` (modify) + `.module.scss` | i18n existing strings; add `ShowInMyLanguage` |
| `src/i18n/en.ts` (modify) | Promote curated common keys (additive) |
| `src/i18n/fr.ts` (modify) | Full French overlay |
| `src/i18n/sw.ts` (modify) | Full Swahili overlay |
| `MASTER_TODO.md` (modify) | §10 coordination request + tick §9 Lane F boxes (sanctioned coordination edits) |

Import convention for other lanes: `import { WorldMapLite } from '../shared/presence'`,
`import { SyncBadge, useDataSaver } from '../shared/connectivity'`,
`import { ShowInMyLanguage } from '../shared/AITools'`.

---

## Task 1: Fixture foundation (`presence.ts`)

**Files:** Modify `src/services/demo/fixtures/presence.ts`

- [ ] **Step 1:** Replace the file with types + data (keep `VFTC_COUNTRIES`/`VFTC_LANGUAGES`):

```ts
// Lane F — transnational presence & multilingual fixtures (reference data).
export const VFTC_COUNTRIES = ['KE', 'NG', 'MW', 'CD'];
export const VFTC_LANGUAGES = ['en', 'fr', 'sw', 'ny', 'ln'] as const;

export type LangCode = 'en' | 'fr' | 'sw' | 'ny' | 'ln';
export type ChannelKind = 'app' | 'whatsapp' | 'sms' | 'ussd';
export type SyncStatus = 'synced' | 'pending' | 'offline';

export interface LanguageInfo { code: LangCode; native: string; english: string; }
export const LANGUAGES: Record<LangCode, LanguageInfo> = {
  en: { code: 'en', native: 'English', english: 'English' },
  fr: { code: 'fr', native: 'Français', english: 'French' },
  sw: { code: 'sw', native: 'Kiswahili', english: 'Swahili' },
  ny: { code: 'ny', native: 'Chichewa', english: 'Chichewa' },
  ln: { code: 'ln', native: 'Lingála', english: 'Lingala' },
};

/** A string with optional translations; `en` is the source of truth. */
export interface TranslatedText { en: string; fr?: string; sw?: string; }
/** Languages a translated post body can be authored in (subset with dictionary keys). */
export type PostLang = 'en' | 'fr' | 'sw';

export interface PresenceParticipant {
  id: string; name: string; country: string; language: LangCode; channel: ChannelKind;
}
export interface PresencePost {
  id: string; author: string; country: string; language: PostLang;
  channel: ChannelKind; body: TranslatedText; sync?: SyncStatus; minutesAgo: number;
}

/** Per-country participant counts for the flagship — drives presence motifs. */
export const VFTC_PARTICIPATION: { code: string; participants: number }[] = [
  { code: 'KE', participants: 184 },
  { code: 'NG', participants: 156 },
  { code: 'MW', participants: 92 },
  { code: 'CD', participants: 71 },
];

/** Sample translated posts incl. WhatsApp/SMS bridges and a pending-sync post. */
export const PRESENCE_POSTS: PresencePost[] = [
  {
    id: 'pp1', author: 'Amara', country: 'KE', language: 'en', channel: 'app', minutesAgo: 12,
    body: {
      en: 'Drought is hitting our farms hardest. We need a shared fund that reaches rural chapters fast.',
      fr: 'La sécheresse frappe le plus durement nos fermes. Il nous faut un fonds commun qui atteigne vite les sections rurales.',
      sw: 'Ukame unaathiri mashamba yetu zaidi. Tunahitaji mfuko wa pamoja unaofika vijijini haraka.',
    },
  },
  {
    id: 'pp2', author: 'Pascal', country: 'CD', language: 'fr', channel: 'app', minutesAgo: 34,
    body: {
      fr: 'Nous devrions exiger un suivi public des engagements climatiques de chaque institution.',
      en: 'We should demand public tracking of every institution’s climate commitments.',
      sw: 'Tunapaswa kudai ufuatiliaji wa wazi wa ahadi za hali ya hewa za kila taasisi.',
    },
  },
  {
    id: 'pp3', author: 'Thandiwe', country: 'MW', language: 'en', channel: 'whatsapp', minutesAgo: 58,
    body: {
      en: 'Sent from my phone: our village wells dried up in March. Please count Malawi voices in.',
      fr: 'Envoyé depuis mon téléphone : les puits de notre village se sont taris en mars. Comptez les voix du Malawi.',
      sw: 'Imetumwa kwa simu yangu: visima vya kijiji chetu vilikauka Machi. Tafadhali hesabu sauti za Malawi.',
    },
  },
  {
    id: 'pp4', author: 'Chidi', country: 'NG', language: 'en', channel: 'sms', sync: 'pending', minutesAgo: 73,
    body: {
      en: 'Flooding in Lagos again. Backing the rapid-response proposal.',
      fr: 'Encore des inondations à Lagos. Je soutiens la proposition d’intervention rapide.',
      sw: 'Mafuriko Lagos tena. Naunga mkono pendekezo la hatua za haraka.',
    },
  },
];
```

- [ ] **Step 2:** Verify types compile. Run: `npx tsc -b --noEmit` — Expected: clean (no consumers yet).
- [ ] **Step 3:** Commit. `git add src/services/demo/fixtures/presence.ts && git commit -m "Lane F: expand presence fixture with languages, participation, translated posts"`

---

## Task 2: Connectivity — `useDataSaver` hook

**Files:** Create `src/components/shared/connectivity/useDataSaver.ts`

- [ ] **Step 1:** Provider-free store + hook:

```ts
import { useSyncExternalStore, useCallback } from 'react';

const KEY = 'gloki.dataSaver';
const listeners = new Set<() => void>();
let value = read();

function read(): boolean {
  try { return localStorage.getItem(KEY) === 'true'; } catch { return false; }
}
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { value = read(); cb(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}
export function setDataSaver(next: boolean) {
  value = next;
  try { localStorage.setItem(KEY, String(next)); } catch { /* ignore */ }
  emit();
}
export function useDataSaver() {
  const dataSaver = useSyncExternalStore(subscribe, () => value, () => false);
  const toggle = useCallback(() => setDataSaver(!value), []);
  return { dataSaver, setDataSaver, toggle };
}
```

(`getServerSnapshot` returns `false` for SSR-safety; harmless in CSR.)

- [ ] **Step 2:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean. Commit with Task 3 (small interdependent unit).

---

## Task 3: Connectivity — `DataSaverToggle`, `SmartImage`, `SyncBadge`, `ChannelBadge`, barrel

**Files:** Create the four `.tsx` + `.module.scss` pairs and `connectivity/index.ts`.

Key behaviors / signatures (full code written at execution; tokens only, dark-mode block in every module):

- **`DataSaverToggle.tsx`** — `{ className? }`. `role="switch"`, `aria-checked={dataSaver}`, label
  `t('connectivity.dataSaver','Data saver')`, sublabel `t('connectivity.dataSaverHint','Use less data')`.
  Reads `useDataSaver()`, calls `toggle` on click/Enter/Space. Track + knob styled with `$primary` on,
  `$gray-300` off.
- **`SmartImage.tsx`** — `{ src; alt; fallbackLabel?; size?: number; rounded?: boolean; className? }`.
  If `useDataSaver().dataSaver` → render a `<span>` placeholder (initials from `fallbackLabel`/`alt`,
  `$gray-100`/`$dark-border` bg, `ImageOff` icon affordance) sized `size` (default 40) instead of `<img>`.
  Else render `<img loading="lazy" decoding="async">`. Square; `rounded` → `$radius-full`.
- **`SyncBadge.tsx`** — `{ status: SyncStatus; className? }`. Maps:
  `synced`→Badge tone `success`, icon `Cloud`, `t('connectivity.synced','Synced')`;
  `pending`→tone `warning`, icon `RefreshCw`, `t('connectivity.pending','Saved · syncs later')`;
  `offline`→tone `neutral`, icon `CloudOff`, `t('connectivity.offline','Offline')`.
  Uses the kit `Badge` with a leading icon.
- **`ChannelBadge.tsx`** — `{ channel: ChannelKind; className? }`. Maps:
  `app`→`Smartphone`,`t('connectivity.viaApp','In app')`; `whatsapp`→`MessageCircle`,
  `t('connectivity.viaWhatsapp','via WhatsApp')`; `sms`→`MessageSquare`,
  `t('connectivity.viaSms','via SMS')`; `ussd`→`Hash`,`t('connectivity.viaUssd','via USSD')`.
  Small pill (own module, token-only) — visually distinct from status `Badge`.
- **`index.ts`** — export all four + `useDataSaver`, `setDataSaver`, and each component's prop type.

- [ ] **Step 1:** Create the five files.
- [ ] **Step 2:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean.
- [ ] **Step 3:** Commit. `git add src/components/shared/connectivity && git commit -m "Lane F: connectivity kit — data-saver hook/toggle, SmartImage, SyncBadge, ChannelBadge"`

---

## Task 4: Presence — `ParticipationSummary`, `WorldMapLite`, `LanguageBar`, barrel

**Files:** Create the three `.tsx` + `.module.scss` pairs and `presence/index.ts`.

- **`ParticipationSummary.tsx`** — `{ participation: {code;participants}[]; max?; size?: 'sm'|'md'; className? }`.
  Computes `people = sum(participants)`, `countries = participation.length`. Renders the kit
  `CountryPresence` (expand `participation` to a code list for the cluster) with a `label` of
  `t('presence.peopleFromCountries','{people} from {countries} countries', { people, countries })`.
- **`WorldMapLite.tsx`** — `{ participation; title?; className? }`. Flag constellation:
  - A bounded box (token padding, `$gray-50`/`$dark-surface` bg, `$radius-lg`). Flags placed by a fixed
    deterministic layout (no randomness): center the largest by count, others around it; each flag is a
    `CountryFlag` chip with a count pill. Faint connecting lines drawn with an SVG `<line>` layer using
    `stroke: $gray-200` (`$dark-border` dark), behind the flags.
  - Title `t('presence.whereWeAreFrom','Where we’re from')` (overridable via `title`).
  - A11y: `role="img"` + `aria-label` summarizing total; a visually-hidden `<ul>` listing each country +
    count for screen readers.
- **`LanguageBar.tsx`** — `{ languages: LangCode[]; className? }`. Renders `t('presence.spokenHere','Spoken here')`
  + the language native names (from `LANGUAGES`) as small chips, then the Foundation `LanguageSwitcher`
  (`hideIcon` in dense contexts). Only EN/FR/SW are switchable; ny/ln show as informational chips.
- **`index.ts`** — export the three + prop types.

- [ ] **Step 1:** Create the four files.
- [ ] **Step 2:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean.
- [ ] **Step 3:** Commit. `git add src/components/shared/presence && git commit -m "Lane F: presence motifs — ParticipationSummary, WorldMapLite, LanguageBar"`

---

## Task 5: AITools — i18n existing strings + add `ShowInMyLanguage`

**Files:** Modify `src/components/shared/AITools.tsx` (+ `.module.scss` for the toggle).

- [ ] **Step 1:** Route existing hardcoded strings through `t()` (`translate.translate`, `translate.translatingTo`,
  `translate.aiSummary`, `translate.hideSummary`, `translate.generating`, `translate.failed`,
  `translate.keyHint`). Keep `TranslateButton`/`SummaryButton`/`AIToolbar` prop shapes **unchanged**
  (PipelineView depends on them). Add `import { useT } from '../../i18n'` and call `const t = useT()` in each.
- [ ] **Step 2:** Add `ShowInMyLanguage`:

```tsx
import { useI18n } from '../../i18n';
import type { TranslatedText, PostLang } from '../../services/demo/fixtures/presence';
import { LANGUAGES } from '../../services/demo/fixtures/presence';

export interface ShowInMyLanguageProps {
  body: TranslatedText;
  sourceLang: PostLang;
  className?: string;
}

export const ShowInMyLanguage: React.FC<ShowInMyLanguageProps> = ({ body, sourceLang, className }) => {
  const { locale, t } = useI18n();
  const [showTranslated, setShowTranslated] = useState(false);
  const myLang = (locale === 'en' || locale === 'fr' || locale === 'sw') ? locale : 'en';
  const translation = myLang !== sourceLang ? body[myLang] : undefined;
  const source = body[sourceLang] ?? body.en;
  const langName = LANGUAGES[myLang].native;

  if (!translation) return <p className={styles.postBody}>{source}</p>;

  return (
    <div className={className}>
      <p className={styles.postBody}>{showTranslated ? translation : source}</p>
      <button type="button" className={styles.translateToggle}
        onClick={() => setShowTranslated((v) => !v)}
        aria-pressed={showTranslated}>
        <Globe size={12} />
        {showTranslated
          ? t('translate.showOriginal', 'Show original')
          : t('translate.showInMyLanguage', 'Show in {language}', { language: langName })}
      </button>
      {showTranslated && (
        <span className={styles.translatedNote}>{t('translate.translatedAuto', 'Translated')}</span>
      )}
    </div>
  );
};
```

  Add `Globe` to the lucide import. Add `.postBody`, `.translateToggle`, `.translatedNote` to the SCSS
  module (token-only; toggle styled like a small ghost link in `$primary`).

- [ ] **Step 3:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean (incl. PipelineView still compiles).
- [ ] **Step 4:** Commit. `git add src/components/shared/AITools.* && git commit -m "Lane F: AITools i18n + ShowInMyLanguage fixture toggle"`

---

## Task 6: PresenceShowcase (verification gallery)

**Files:** Create `src/components/shared/presence/PresenceShowcase.tsx` (+ `.module.scss`); export from `presence/index.ts`.

- [ ] **Step 1:** Build a single-column gallery (max-width `$content-max-width`, bottom-padded by
  `$footer-height`) with labeled sections, each in a kit `Card`:
  1. **Language** — `LanguageBar` with `VFTC_LANGUAGES`.
  2. **Presence** — `ParticipationSummary` + `WorldMapLite` with `VFTC_PARTICIPATION`.
  3. **Live translation** — each `PRESENCE_POSTS` entry rendered as a mini post: author + `CountryFlag`
     + `ChannelBadge` + (if `sync`) `SyncBadge`, body via `ShowInMyLanguage`, author avatar via `SmartImage`.
  4. **Connectivity** — `DataSaverToggle` + a row of `SyncBadge` (all three states) + `ChannelBadge` (all kinds).
  A heading `t('presence.showcaseTitle','Lane F · presence & connectivity')`.
- [ ] **Step 2:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean.
- [ ] **Step 3:** Commit. `git add src/components/shared/presence/PresenceShowcase.* src/components/shared/presence/index.ts && git commit -m "Lane F: PresenceShowcase verification gallery"`

---

## Task 7: i18n content — promote keys + FR/SW overlays

**Files:** Modify `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts`.

- [ ] **Step 1:** In `en.ts`, add (additively, after existing keys) the promoted common set with English
  values matching the inline defaults used above: all `translate.*`, `connectivity.*`, `presence.*` keys,
  plus `lang.native.*`? (not needed — names come from `LANGUAGES`). Keys and English values must match the
  inline `t()` defaults exactly.
- [ ] **Step 2:** In `fr.ts`, add French for every key now in `en.ts` (existing + promoted). Use the post
  translations' register (plain, plain-language French). Include `{placeholder}` tokens verbatim, e.g.
  `'presence.peopleFromCountries': '{people} de {countries} pays'`.
- [ ] **Step 3:** In `sw.ts`, add Swahili for every key in `en.ts`, tokens preserved, e.g.
  `'presence.peopleFromCountries': '{people} kutoka nchi {countries}'`.
- [ ] **Step 4:** Verify. Run: `npx tsc -b --noEmit` — Expected: clean (`Dictionary` is `Record<string,string>`).
- [ ] **Step 5:** Commit. `git add src/i18n && git commit -m "Lane F: promote common keys to en.ts; full FR/SW overlays"`

---

## Task 8: Full build + preview verification

- [ ] **Step 1:** `npx tsc -b --noEmit` — Expected: clean.
- [ ] **Step 2:** `npm run build` — Expected: clean (production build runs `tsc -b`).
- [ ] **Step 3:** Temporarily mount the showcase for preview ONLY (uncommitted): add a `/lab/presence`
  route in `src/App.tsx` rendering `PresenceShowcase` (note the exact edit so it can be reverted).
- [ ] **Step 4:** `npm run dev`; in the preview navigate to `/lab/presence`. Confirm:
  - Language switch EN→FR→SW updates shell strings AND post `ShowInMyLanguage` toggles + offered language name.
  - `ShowInMyLanguage` toggle swaps source ⇄ translation; posts already in my language show no toggle.
  - `DataSaverToggle` on → `SmartImage` avatars become placeholders; off → images return.
  - `SyncBadge`/`ChannelBadge` render all states; `WorldMapLite`/`ParticipationSummary` read correctly.
  - Dark mode (emulate `prefers-color-scheme: dark`), 360px width, keyboard tab/Enter on toggles. No console errors.
- [ ] **Step 5:** Revert the temp mount: `git checkout src/App.tsx` (verify `git status` shows App.tsx clean).

---

## Task 9: Coordination + close-out

**Files:** Modify `MASTER_TODO.md` (§10 append + §9 Lane F ticks — sanctioned coordination edits).

- [ ] **Step 1:** Append to §10 a request to mount `PresenceShowcase` at a durable `/lab/presence` dev route,
  and a note listing the reusable components other lanes can adopt.
- [ ] **Step 2:** Tick the §9 Lane F boxes (F1, F2, F3).
- [ ] **Step 3:** Commit. `git add MASTER_TODO.md && git commit -m "Lane F: §10 coordination request + tick §9 Lane F"`
- [ ] **Step 4:** `git push -u origin lane/lane-f`.
- [ ] **Step 5:** Open PR `lane/lane-f` → `ui` via `gh`, body summarizing F1/F2/F3 + reusable components exposed.

---

## Self-review

**Spec coverage:** F1 = Task 5 (`ShowInMyLanguage`, AITools i18n) + Task 4 (`LanguageBar`); F2 = Task 4
(`ParticipationSummary`, `WorldMapLite`); F3 = Tasks 2–3 (`useDataSaver`, `DataSaverToggle`, `SmartImage`,
`SyncBadge`, `ChannelBadge`); fixture = Task 1; i18n = Task 7; verify = Task 8; coordination/close-out = Task 9.
All spec sections mapped.

**Placeholder scan:** No TBD/TODO; behaviors and signatures concrete. SCSS is specified by class +
token mapping (mechanical, written at execution) — not a logic placeholder.

**Type consistency:** `TranslatedText`/`PostLang` (Task 1) consumed by `ShowInMyLanguage` (Task 5);
`{code;participants}[]` (Task 1) consumed by `ParticipationSummary`/`WorldMapLite` (Task 4); `SyncStatus`
/`ChannelKind` (Task 1) consumed by `SyncBadge`/`ChannelBadge` (Task 3); `useDataSaver` (Task 2) consumed
by `DataSaverToggle`/`SmartImage` (Task 3) and showcase (Task 6). Consistent. i18n keys introduced inline
in Tasks 3–6 are promoted into `en.ts` and translated in Task 7 — key strings must match exactly.
