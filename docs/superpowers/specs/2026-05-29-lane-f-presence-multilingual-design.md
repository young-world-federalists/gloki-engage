# Lane F — Transnational presence, multilingual & low-tech (design)

**Date:** 2026-05-29 · **Branch:** `lane/lane-f` → PR into `ui` · **Wave:** 1 (parallel)

## Goal

Make *"across borders, across languages, on any connection"* felt everywhere. Lane F owns the
cross-cutting shared surfaces: translation affordances, transnational presence motifs, and
low-bandwidth/offline UX. Every artifact is a **drop-in primitive** other lanes import — clean props,
translated strings passed in or resolved from the active locale, token-only styling, dark-mode aware,
360px-safe.

## Owned paths (edit only these)

- `src/components/shared/AITools.*`
- new `src/components/shared/presence/**`
- new `src/components/shared/connectivity/**`
- `src/i18n/**` (dictionary **content**; structure is Foundation's)
- `src/services/demo/fixtures/presence.ts`

Everything else is read-only. The base `CountryFlag`, `CountryPresence`, `CountryParticipation`, and
`LanguageSwitcher` already exist in the kit — build **on** them, never edit them.

## Resolved design decisions

1. **Live translation** → mock from fixture. Posts carry pre-written EN/FR/SW variants; the toggle
   swaps instantly, works offline, needs no API key. The existing API-backed `TranslateButton` is
   retained for arbitrary text (and because `PipelineView` type-checks against it).
2. **World-map-lite** → flag constellation (token-only; no shipped vector asset).
3. **i18n depth** → translate `en.ts` + all keys my components introduce, and promote a curated
   common set into `en.ts` (additively), then fill `fr.ts`/`sw.ts`.
4. **Data saver** → off by default; self-contained `localStorage` hook (no provider/`App.tsx` change).

## Data layer — `fixtures/presence.ts`

Plain reference exports (no mock-API round-trip), mirroring how the country list is consumed. Keep
`VFTC_COUNTRIES` and `VFTC_LANGUAGES`. Add:

- **Types:** `LangCode = 'en'|'fr'|'sw'|'ny'|'ln'`, `ChannelKind = 'app'|'whatsapp'|'sms'|'ussd'`,
  `SyncStatus = 'synced'|'pending'|'offline'`, `LanguageInfo { code; native; english }`,
  `TranslatedText { en: string; fr?: string; sw?: string }`,
  `PresenceParticipant { id; name; country; language; channel }`,
  `PresencePost { id; author; country; language; channel; body: TranslatedText; sync?; minutesAgo }`.
- **Data:** `LANGUAGES: Record<LangCode, LanguageInfo>`; `VFTC_PARTICIPATION: { code; participants }[]`
  across KE/NG/MW/CD; `PRESENCE_POSTS: PresencePost[]` — ~4 posts authored across the four countries,
  each with EN/FR/SW variants, one each demoing a WhatsApp bridge, an SMS bridge, and a `pending`
  sync state.

`minutesAgo` is a number formatted through `t()` in the component, so relative time stays
translatable and stable across reloads.

## F1 — Translation affordances

### `AITools.tsx`
- Keep `TranslateButton`, `SummaryButton`, `AIToolbar` with their **exact current prop shapes**
  (`AIToolbar` is consumed by `PipelineView.tsx`; breaking it fails `tsc -b`). Route their hardcoded
  English strings through `t('translate.*', 'English default')`.
- **Add `ShowInMyLanguage`** — props `{ body: TranslatedText; sourceLang: 'en'|'fr'|'sw'; className? }`.
  Reads the active locale from `useI18n()`. If `sourceLang === locale`, render the source plainly. If a
  translation for `locale` exists and differs, render the source with a `🌐 Show in <language>` ⇄
  `Show original` toggle. If no translation exists for the locale, render the source with no toggle
  (mock-only; no silent API call). Tying the toggle to the same locale as the switcher is what makes
  the switcher useful in context.

### `presence/LanguageBar.tsx`
A contextual "Spoken here: 🇬🇧 EN · FR · SW · +N" strip with the Foundation `LanguageSwitcher`
embedded. Props `{ languages: LangCode[]; className? }`. Educates + lets the user switch in place.

## F2 — Transnational presence motifs — `presence/**`

- **`ParticipationSummary.tsx`** — composes `CountryPresence` (flag cluster) + a translated
  `{people} from {countries} countries` caption. Props
  `{ participation: { code; participants }[]; max?; size?; className? }`. The reusable presence header.
- **`WorldMapLite.tsx`** — flag constellation: flags positioned in a soft cluster with per-country
  counts and faint SVG connecting lines; token-only, 360px-safe. Props
  `{ participation; title?; className? }`. Accessible via a visually-hidden country/count list.
- **`presence/index.ts`** — barrel exporting the presence components.

## F3 — Low-bandwidth & offline — `connectivity/**`

- **`useDataSaver.ts`** — `localStorage`-backed via `useSyncExternalStore` (module store + subscribe),
  so every consumer re-renders on toggle with no provider. Returns `{ dataSaver; setDataSaver; toggle }`.
  Off by default. Key `gloki.dataSaver`.
- **`DataSaverToggle.tsx`** — the switch; translated label; accessible `role="switch"`/`aria-checked`.
- **`SmartImage.tsx`** — `<img>` wrapper that, when data-saver is on, renders a light initials/flag
  placeholder instead of fetching. Props `{ src; alt; fallbackLabel?; size?; rounded?; className? }`.
- **`SyncBadge.tsx`** — `synced` / `Saved · syncs later` (pending) / `Offline` using Cloud/CloudOff/
  RefreshCw icons + `Badge`. Props `{ status: SyncStatus; className? }`.
- **`ChannelBadge.tsx`** — the WhatsApp/SMS-bridge representation: "via WhatsApp" / "via SMS" /
  "in app" chip so a low-tech contributor reads as first-class. Props `{ channel: ChannelKind; className? }`.
- **`connectivity/index.ts`** — barrel.

## i18n content

Promote a curated common set of keys into `en.ts` additively (`presence.*`, `connectivity.*`,
`translate.*`, a few generic actions), then provide full `fr.ts` and `sw.ts` values for every key
(existing + promoted + component-introduced). `ny`/`ln` are *spoken* languages shown in presence
motifs but are **not** app locales — only EN/FR/SW switch the UI.

## Cross-cutting quality

- SCSS modules, tokens only — no raw hex/px/rgba (tinted variants via `rgba($token, …)` only).
- Dark-mode block in every module.
- 360px-wide safe; 44px min touch targets.
- Keyboard + screen-reader basics: labels, `role`/`aria-*`, visually-hidden summaries for icon-only UI.
- Every user-facing string through `t('key', 'English default')`.

## Verification (Lane F owns no route)

Build **`presence/PresenceShowcase.tsx`** — a gallery assembling every component with sample data
from the fixture. To exercise it in the dev preview this session, mount it temporarily and
**uncommitted** (reverted before commit so the branch stays strictly in-lane). Append a **MASTER_TODO
§10** request asking the Foundation owner to mount the showcase at a durable dev route
(`/lab/presence`). Walk: language switch end-to-end (EN→FR→SW updating shell + post toggles), a
data-saver/offline view, dark mode, 360px, keyboard nav — confirm no console errors.

`tsc -b --noEmit` clean and `npm run build` clean are hard gates before commit.

## Coordination (MASTER_TODO §10)

- Request a durable dev showcase route `/lab/presence → presence/PresenceShowcase` so the cross-cutting
  components stay viewable after merge.
- (Optional, non-blocking) note that other lanes can adopt `ShowInMyLanguage`, `ParticipationSummary`,
  `WorldMapLite`, `SyncBadge`, `ChannelBadge`, `SmartImage`, and `useDataSaver` in their surfaces.

## Out of scope (YAGNI / deferred)

- Real translation backend or auto-detect of UI language.
- Geographic SVG world map.
- A global data-saver provider in `App.tsx` (the self-contained hook avoids the cross-lane dependency).
- Persisting presence/posts through the mock contract layer (reference data is sufficient for the mockup).
