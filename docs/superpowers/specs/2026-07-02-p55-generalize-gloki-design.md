# P5.5 — Generalize Gloki beyond the VftC/Africa pilot — Design Spec (2026-07-02)

Status: **approved** (Eston, 2026-07-02). Session 15 Phase 1. Anchor: **surgical neutralization**.

## 1. Why / finding

The app already reads as a global platform: homepage/welcome copy is generalized, `PILOT_COUNTRIES`
= all 197 countries, `regions.ts` is a global 6-region set, and the seeded communities are already a
diverse set (Global Health Network, Digital Rights Coalition, Climate Resilience Assembly, Fair
Futures Forum, …). **"Voices for the Climate" is not a seeded community** — it survives only in the
onboarding invite copy. So generalization is a handful of surgical edits, not a reskin. Climate stays
as **one balanced community among several**. No fixture change → **`DEMO_VERSION` stays `global-v16`**.

## 2. Changes

### 2.1 Onboarding invite copy — `onboarding.invite.lead`
`src/components/onboarding/steps/InviteStep.tsx` (en inline) + `src/i18n/fr.ts` + `src/i18n/sw.ts`.
- **en:** `{name} invited you to Gloki — where people across the world decide together what to do about the challenges they share.`
- **fr:** `{name} vous a invité·e à Gloki — où des personnes du monde entier décident ensemble quoi faire face aux défis qu’elles partagent.`
- **sw:** `{name} amekualika kwenye Gloki — ambapo watu kote ulimwenguni huamua pamoja la kufanya kuhusu changamoto wanazoshiriki.`

### 2.2 Mandate provenance line — `mandate.provenanceLine`
`src/components/mandate/MandateDocument.tsx` (en inline) + fr + sw. Drop the youth framing:
- **en:** `Deliberated by {participants} people across {countries} countries over {months} months.`
- **fr:** `Délibéré par {participants} personnes dans {countries} pays sur {months} mois.`
- **sw:** `Imejadiliwa na watu {participants} katika nchi {countries} kwa miezi {months}.`

### 2.3 Remove `PILOT_COLORS` — `src/utils/countries.ts`
Delete the KE/NG/MW/CD `PILOT_COLORS` const. `getCountryColor(code)` returns `'#6b7280'` for
`OTHER` and `hashColor(code)` for every real country (the existing deterministic fallback). No country
is privileged. `PILOT_COUNTRIES` (= `COUNTRIES`) is untouched. Verify no other consumer imports
`PILOT_COLORS` (grep first).

### 2.4 Docs reframe (light-touch) — `MASTER_TODO.md`
- §1 KPI: relabel *"the Voices-for-the-Climate KPI"* → *"the platform KPI"*; keep *≥70% of
  participants complete the journey unaided* as the measurable bar.
- §2: lead with the global-platform mission; keep **VftC as a named near-term pilot example** (it is a
  real campaign; §2 line 40 already states the product is a global platform) — do **not** delete it.
- §7 P5.5 entry: rewrite to the actual surgical scope and mark shipped; add a §8 changelog line.
- Project memory (`project_session15_*`) updated at session close.

## 3. Constraints
- Tokens only; behind `src/services/api.ts`; **keep contract method names**.
- fr + sw **parity**: 2 changed keys, **no new keys** (position-agnostic set diff stays empty).
- 360px flagship; light + dark; AA; single `<h1>`/landmarks unaffected (copy-only + one util).
- **`DEMO_VERSION` NOT bumped** — no fixture change.
- Reframed fr/sw strings → append to `docs/i18n-native-review-candidates.md`.

## 4. Verification
- `npm run build` (`tsc -b`) clean.
- fr/sw key-set diff empty; the 2 keys present in both.
- Preview (`gloki-dev`, 360px, light + dark): onboarding invite step reads the neutral copy; a mandate
  document reads "…people across…"; country-participation viz still renders after `PILOT_COLORS` removal.

## 5. Files touched
`src/components/onboarding/steps/InviteStep.tsx`, `src/components/mandate/MandateDocument.tsx`,
`src/i18n/fr.ts`, `src/i18n/sw.ts`, `src/utils/countries.ts`, `MASTER_TODO.md`,
`docs/i18n-native-review-candidates.md`.
