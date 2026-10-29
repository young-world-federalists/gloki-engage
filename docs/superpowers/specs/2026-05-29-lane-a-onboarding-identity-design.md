# Lane A — Onboarding & Identity (design)

**Date:** 2026-05-29 · **Branch:** `lane/lane-a` → PR into `ui` · **Status:** approved, ready to plan

A UI-only mockup (no backend; all data via `src/services/demo/`, no `?raw` Python imports). This spec
covers the three Lane A tasks from `MASTER_TODO.md` §9:

- **A1** Guided first-run flow: invite → vouch (Web-of-Trust *lite*) → create Digital Agent → consent.
- **A2** Profile = "Digital Agent" card (country, languages, participation, "vouched by N").
- **A3** Empty/return states + full dark mode + 360px + keyboard/screen-reader pass.

**North-star bar:** a newcomer with an invite, a cheap 360px Android, intermittent data, and a
non-English first language gets from "link" to "ready to participate" **unaided** (≥70% target).
Trust is lightweight (invite + a friend's vouch); biometrics/Council/badges are deferred (§7).

---

## 1. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Entry point** (—`/welcome/*` sits behind the login wall; nothing routes a logged-in newcomer there, and `App.tsx` is not editable from this lane) | Build `/welcome` as the invite deep-link target (`/welcome?invite=CODE`) **and** add a "Start here / replay welcome" item in `HomepageMenu` (both owned). **Also append a MASTER_TODO §10 request** so Foundation can auto-redirect first-run users to `/welcome`. I edit nothing shared except logging the §10 ask. |
| 2 | **Profile page (A2)** | **Replace** `Profile.tsx`'s content with the read-first Digital Agent card + a light inline edit, sourced from demo data. Drop the contract `setValues`/userSlice wiring (real-backend cruft in a UI-only mockup). Retain the local AI-API-key field (it's `localSecrets`, not backend) so Lane F's AITools keeps a place to set the key; keep the read-only "Network Identity" collapsible. |
| 3 | **Wizard nav** | **Single `OnboardingFlow` screen** with an internal state machine + the shared `<Stepper>`; progress persisted so a refresh/return resumes at the saved step. |
| 4 | **Created-agent persistence** | A small **localStorage-backed store inside the owned tree** (`src/components/identity/agent/`), since only the *fixture* in the demo layer is owned (not `demoState.ts`/`mockApi.ts`). Same pattern as `preferencesSlice`/`flowContractsSlice`. No real-backend wiring. |

---

## 2. Owned paths (edit only these)

- `src/pages/IdentityView.*`
- `src/components/identity/**`
- `src/components/onboarding/**` (replace the `OnboardingFlow.tsx` stub)
- `src/services/demo/fixtures/identity.ts`
- `MASTER_TODO.md` §10 (append-only coordination log — the sanctioned exception)

Anything else → a §10 request, never a direct edit.

---

## 3. File plan

```
src/components/onboarding/
  OnboardingFlow.tsx           replace stub: orchestrator (state machine + <Stepper>), reads ?invite=
  OnboardingFlow.module.scss
  steps/InviteStep.tsx         "You've been invited to Voices for the Climate"
  steps/VouchStep.tsx          "A friend vouched for you" (Web-of-Trust lite)
  steps/AgentStep.tsx          create Digital Agent: name · photo · country · languages
  steps/RulesStep.tsx          consent to deliberation rules
  steps/ReadyStep.tsx          "You're ready to participate"
  steps/steps.module.scss      shared step layout (or per-step if a step needs its own)

src/components/identity/
  agent/digitalAgentStore.ts   typed store + load/save/clear + onboarding progress (localStorage)
  agent/useDigitalAgent.ts     React hook over the store, cross-component sync
  DigitalAgentCard.tsx         A2 presentational card
  DigitalAgentCard.module.scss
  PhotoPicker.tsx              photo upload → resize → initials fallback (reused by AgentStep + Profile)
  PhotoPicker.module.scss
  Profile.tsx                  REWORKED: renders DigitalAgentCard + light edit + AI-key + identity collapsible
  Profile.module.scss          (adjust as needed)
  HomepageMenu.tsx             add a "Start here / replay welcome" menu entry

src/pages/IdentityView.tsx     no new route needed (profile route now shows the agent card); wire nudge if any

src/services/demo/fixtures/identity.ts   ADD invite/voucher/participation exports (keep PERSONAS + pick intact)

MASTER_TODO.md §10             append coordination request
```

**Do not break the seeder:** `seedDemoCommunity.ts` imports `PERSONAS` and `pick` from `identity.ts`.
Only **add** exports; never change or remove those two.

---

## 4. Data model

### 4.1 Store (`digitalAgentStore.ts`)

```ts
export interface DigitalAgent {
  displayName: string;
  photo: string;          // data URL, or '' → render initials
  country: string;        // ISO 3166-1 alpha-2, or '' 
  languages: string[];    // ISO 639-1 (+ local) codes
  createdAt: number;
  invitedBy?: string;     // voucher publicKey (from the invite code)
  vouchedBy: string[];    // publicKeys; length = "vouched by N" (>=1 once invited)
  consentedAt?: number;   // set when the user accepts the deliberation rules
}

export interface OnboardingState {
  agent: Partial<DigitalAgent>; // in-progress values
  step: number;                 // resume index (0..4)
  completed: boolean;
}
```

- localStorage key: `gloki.digitalAgent` (agent) + `gloki.onboarding` (progress), or one combined blob.
- API: `loadAgent()`, `saveAgent(partial)`, `clearAgent()`, `loadOnboarding()`, `saveOnboarding(partial)`,
  `resetOnboarding()`. Try/catch around storage (mirror `demoState.ts` resilience).
- `useDigitalAgent()` returns `{ agent, onboarding, isOnboarded, save…, reset… }` and stays in sync across
  the card + the flow (a module-level subscriber set / `storage` event, or a light context — pick the
  simplest that survives a refresh and updates both surfaces in one tab).

### 4.2 Fixture additions (`identity.ts`)

```ts
// code → voucher publicKey. Default voucher when no/unknown code.
export const INVITE_CODES: Record<string, string> = {
  CLIMATE24: 'demo-user-ke-amani',
  // …a couple more so different links show different vouchers
};
export const DEFAULT_INVITE_VOUCHER = 'demo-user-ke-amani';
export function getVoucher(code?: string): Persona; // resolves code → Persona, falls back to default

// Seed "vouched by N": the inviter + 1–2 others (publicKeys) so the count reads naturally.
export function defaultVouchers(inviter: string): string[];

// A few participation-history rows for the agent card (demo only — real participation isn't tracked).
export interface ParticipationEntry { titleKey: string; defaultTitle: string; stage: string; when: string; }
export const DEMO_PARTICIPATION: ParticipationEntry[];

// Curated short language list for the AgentStep toggles — relevant to the 4 VftC countries + app
// locales, NOT the full 197. Codes + a display label key. e.g. en, fr, sw, ny (Chichewa), ln (Lingala).
export interface OnboardingLanguage { code: string; defaultLabel: string; }
export const ONBOARDING_LANGUAGES: OnboardingLanguage[];
```

User-facing **copy is NOT in the fixture** — the fixture holds data (codes, voucher keys, participation
rows). Rule text, labels, and prose live in components via `t('onboarding.*', 'English default')`.

---

## 5. First-run flow (`/welcome/*`)

Single screen. `<Stepper>` at top (5 steps), bottom-anchored primary action (thumb zone), optional
"Skip for now" ghost where allowed. `onStepClick` lets a completed/active marker jump back. State machine
holds the current step; every transition writes `OnboardingState` to the store (resume on return).

| # | Step | Content | Skip |
|---|------|---------|------|
| 0 | **Invite** | `EarthFlag` logo; "You've been invited to Voices for the Climate"; names the inviter (voucher) from `?invite=`. One **Continue**. | entry — no skip |
| 1 | **Vouch** | Voucher card (avatar/initials, name, `CountryFlag`); plain copy: lightweight trust — real people not bots, **no ID/biometrics**. "Vouched by N" if >1. | continue-only |
| 2 | **Agent** | Display name (text) · photo (`PhotoPicker`, optional → initials) · country (`SearchableSelect`, **prefilled to voucher's country**) · languages (chip toggles over the curated `ONBOARDING_LANGUAGES` list — *not* the full 197 — `aria-pressed`, prefilled from voucher). Microcopy: "Your Digital Agent represents you in deliberations." | **skippable** → sensible defaults (name "" allowed, country/langs from voucher) + later nudge |
| 3 | **Rules** | 4 plain rules (from §3): (1) *We discuss before we vote.* (2) *One person, one voice — you can't buy influence.* (3) *Disagree kindly — challenge ideas, not people.* (4) *Your data stays yours.* Single **I agree** affirmation → sets `consentedAt`. | **skippable-but-nudged hardest**; records not-yet-consented; Ready step + card show a nudge until consented |
| 4 | **Ready** | "You're ready to participate." Mini agent recap. CTAs: primary **Explore the climate deliberation** → `/stage/problem`; secondary **View my Digital Agent** → `/identity/profile`. Sets `completed = true`. | completes |

On entering `/welcome` with a code, the Invite step seeds `invitedBy` + `vouchedBy` (= `defaultVouchers`)
into the store immediately, so the vouch survives even if the user later skips the Agent step.

**Entry points:** (a) invite URL `/welcome?invite=CODE`; (b) `HomepageMenu` "Start here / replay welcome".
**Return:** completed user landing on `/welcome` sees a compact "You're already set up · Start over"
state; **Start over** = `resetOnboarding()` **and** `clearAgent()` (genuinely fresh — both progress and
the created agent are cleared). Incomplete user resumes at the saved step.

---

## 6. Digital Agent card (A2) + Profile rework

`DigitalAgentCard.tsx` (presentational, `Card`-based):
- Avatar (photo or initials), display name.
- `CountryFlag showName`; language chips (`Badge`).
- **"Vouched by N"** with voucher flags (`CountryPresence`) — the lightweight-trust signal.
- Participation history: a few `DEMO_PARTICIPATION` rows (title + stage + when). Empty → a small inline
  "No activity yet" line, not a hard error.

`Profile.tsx` becomes the `/identity/profile` view:
- Renders `DigitalAgentCard` (read-first) from `useDigitalAgent()`, falling back to `state.user`
  (publicKey/initials) when no agent exists.
- **Edit** affordance (inline or `Modal`) reuses `PhotoPicker` + writes through the store:
  display name · photo · country · languages · **local AI API key** (`setLocalOpenAIApiKey`, kept so
  Lane F AITools still has an entry point).
- Keeps the read-only **Network Identity** collapsible (public key / server URL) — honest + useful.
- Removes: `readProfile`, `useEventStream`, `setValues`, contract/profile-slice wiring.

No new route — the existing `/identity/profile` route now shows this. No-agent state = `EmptyState`
"Set up your Digital Agent" + CTA → `/welcome`.

---

## 7. Empty / return states + accessibility (A3)

- **No agent:** card → `EmptyState` + CTA to `/welcome`. **Onboarding incomplete:** `Banner` nudge on the
  identity area ("Finish setting up your Digital Agent →"); flow resumes at saved step.
- **Already onboarded:** `/welcome` → compact "already set up · Start over".
- **Dark mode:** tokens only (no ad-hoc colors); verify every surface in `prefers-color-scheme: dark`.
- **360px:** single-column, bottom-anchored actions, 44px targets, content padding 16px.
- **Keyboard/SR:** labeled inputs; language chips `aria-pressed`; photo button `aria-label`; on step
  change move focus to the step heading; an `aria-live="polite"` region announces "Step N of 5: <label>";
  visible focus rings (token); success state announced. Heading hierarchy correct on each step.

---

## 8. i18n

Every user-facing string via `useT()` → `t('onboarding.<key>', 'English default')` /
`t('identity.<key>', '…')`, English default inline. **Do not edit `src/i18n/`** (Lane F owns it; it will
backfill fr/sw). Namespaces: `onboarding.*` (flow), `identity.*`/`agent.*` (card/profile).

---

## 9. Coordination (`MASTER_TODO.md` §10)

Append a request asking the Foundation owner to: (a) redirect first-run authenticated users (no Digital
Agent in the store) to `/welcome` after login; (b) bless the `/welcome?invite=CODE` invite-link
convention. Until applied, entry = invite URL + HomepageMenu item (both shipped here).

---

## 10. Out of scope / boundaries

- The created agent stays on **Lane A surfaces only** — it is **not** injected into community member
  lists / country-participation (that needs community-contract writes owned elsewhere). Deliberate
  boundary; note in the PR.
- No biometrics, Council/DAO, badges, points (deferred — §7).
- No edits to `App.tsx`, `LoginPage`, `AuthContext`, the demo plumbing, or any other lane's files.
- No new swipe gestures (DESIGN_SYSTEM mobile rule).

---

## 11. Verification (definition of done)

- `npx tsc -b --noEmit` clean.
- `npm run build` clean.
- Walk the routes in the preview (`mcp__Claude_Preview__*`): `/welcome` (all 5 steps, skip paths, resume
  after refresh, dark mode, 360px width) and `/identity/profile` (card, edit, no-agent empty state) —
  **no console errors**, dark mode holds, 360px holds, keyboard + screen-reader basics work.
- `MASTER_TODO.md` §9 Lane A boxes (A1/A2/A3) ticked.
- Commit, `git push -u origin lane/lane-a`, open a PR into `ui`; rebase on `ui` if asked. Report what
  changed with evidence (don't assert).
