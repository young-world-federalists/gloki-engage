# Lane A — Onboarding & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the guided first-run journey (`/welcome/*`: invite → vouch → Digital Agent → consent → ready) and the "Digital Agent" identity card, so a newcomer with an invite reaches "ready to participate" unaided, in their language.

**Architecture:** A single resumable `OnboardingFlow` screen drives a 5-step state machine with the shared `<Stepper>`; progress + the created agent persist in a small localStorage store inside the Lane A owned tree (the demo plumbing isn't ours to edit). The Profile route is reworked into a read-first Digital Agent card backed by that store. All data is hardcoded/demo (UI-only mockup); all strings go through `t()`.

**Tech Stack:** React 19 + TypeScript + Vite + SCSS Modules; shared kit (`Stepper/Card/Button/Modal/EmptyState/Banner/Badge/CountryFlag/CountryPresence/EarthFlag/SearchableSelect`); i18n `useT()`; design tokens in `src/styles/variables.scss`.

**Spec:** `docs/superpowers/specs/2026-05-29-lane-a-onboarding-identity-design.md`

**Worktree:** Already set up at `.worktrees/lane-a` on branch `lane/lane-a` (off `ui`), `node_modules` symlinked. Run all commands from that worktree root:
`cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2/.worktrees/lane-a"`

> **No test framework in this repo** (CLAUDE.md: "verify via `npm run dev` and browser DevTools"). Lane A does not own test infra and must not add a runner. So each task's **verification gate is `npx tsc -b --noEmit`** (the production build runs `tsc -b`), plus `npm run build` and a manual preview walk at the integration tasks (8, 10, 13). "Write the failing test" steps are replaced by "typecheck must be clean."

---

## File structure

```
src/services/demo/fixtures/identity.ts          MODIFY  — add invite/voucher/language/participation exports (keep PERSONAS + pick intact)
src/components/identity/agent/digitalAgentStore.ts  CREATE — localStorage store + types + getInitials
src/components/identity/agent/useDigitalAgent.ts     CREATE — React hook (useSyncExternalStore)
src/components/identity/PhotoPicker.tsx + .scss   CREATE — photo upload → resize → initials fallback
src/components/onboarding/steps/steps.module.scss CREATE — shared step layout
src/components/onboarding/steps/InviteStep.tsx    CREATE
src/components/onboarding/steps/VouchStep.tsx     CREATE
src/components/onboarding/steps/AgentStep.tsx     CREATE
src/components/onboarding/steps/RulesStep.tsx     CREATE
src/components/onboarding/steps/ReadyStep.tsx     CREATE
src/components/onboarding/OnboardingFlow.tsx + .scss  REPLACE stub — orchestrator
src/components/identity/DigitalAgentCard.tsx + .scss  CREATE — A2 card
src/components/identity/Profile.tsx               REPLACE — Digital Agent card view + edit
src/components/identity/Profile.module.scss       REPLACE — lean module for the rework
src/components/identity/HomepageMenu.tsx          MODIFY  — add "Welcome guide" entry → /welcome
MASTER_TODO.md §10                                MODIFY  — append coordination request
```

Each file has one responsibility. Steps are split out of the orchestrator so each stays small and focused.

---

## Task 1: Identity fixture — invite/voucher/language/participation data

**Files:**
- Modify: `src/services/demo/fixtures/identity.ts` (append only; do NOT touch `PERSONAS` or `pick` — `seedDemoCommunity.ts` imports them)

- [ ] **Step 1: Append the new exports to `identity.ts`** (after the existing `pick` function)

```ts
// ── Onboarding / lightweight trust (Lane A) ──────────────────────────────────
// A friend's invite resolves to the voucher who brought the newcomer in.
// UI-only — no backend, no contract writes.

const personaByKey: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.publicKey, p]),
);

/** Look up a seeded persona by public key (used to render vouchers). */
export function getPersona(publicKey: string): Persona | undefined {
  return personaByKey[publicKey];
}

/** Invite code → voucher publicKey. Unknown/missing codes fall back to the default. */
export const INVITE_CODES: Record<string, string> = {
  CLIMATE24: 'demo-user-ke-amani',
  NAIROBI: 'demo-user-ke-wanjiru',
  LAGOS: 'demo-user-ng-chiamaka',
  GOMA: 'demo-user-cd-esperance',
};

export const DEFAULT_INVITE_VOUCHER = 'demo-user-ke-amani';

/** Resolve an invite code to the voucher persona (defaults to a friendly persona). */
export function getVoucher(code?: string | null): Persona {
  const key = (code && INVITE_CODES[code.toUpperCase()]) || DEFAULT_INVITE_VOUCHER;
  return personaByKey[key] ?? PERSONAS[0];
}

/** Seed "vouched by N": the inviter plus a couple of other community members. */
export function defaultVouchers(inviterKey: string): string[] {
  const others = PERSONAS.filter((p) => p.publicKey !== inviterKey).slice(0, 2);
  return [inviterKey, ...others.map((p) => p.publicKey)];
}

/** A short, curated language set for the onboarding picker (NOT the full 197). */
export interface OnboardingLanguage {
  code: string;
  defaultLabel: string;
}
export const ONBOARDING_LANGUAGES: OnboardingLanguage[] = [
  { code: 'en', defaultLabel: 'English' },
  { code: 'fr', defaultLabel: 'Français' },
  { code: 'sw', defaultLabel: 'Kiswahili' },
  { code: 'ny', defaultLabel: 'Chichewa' },
  { code: 'ln', defaultLabel: 'Lingala' },
  { code: 'ha', defaultLabel: 'Hausa' },
];

/** Demo participation rows for the Digital Agent card (real activity isn't tracked). */
export interface ParticipationEntry {
  titleKey: string;
  defaultTitle: string;
  stageKey: string;
  defaultStage: string;
  when: string;
}
export const DEMO_PARTICIPATION: ParticipationEntry[] = [
  { titleKey: 'agent.activity.plasticFree', defaultTitle: 'Plastic-free lakes', stageKey: 'nav.problem', defaultStage: 'Problem', when: '2d ago' },
  { titleKey: 'agent.activity.flooding', defaultTitle: 'Flood early-warning network', stageKey: 'nav.discussion', defaultStage: 'Discuss', when: '5d ago' },
  { titleKey: 'agent.activity.solar', defaultTitle: 'Solar for rural schools', stageKey: 'nav.vote', defaultStage: 'Vote', when: '1w ago' },
];
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean (0 errors).

- [ ] **Step 3: Sanity-check the seeder still imports cleanly**

Run: `grep -n "PERSONAS\|pick" src/services/demo/seedDemoCommunity.ts | head`
Expected: imports unchanged; `PERSONAS` and `pick` still exported from `identity.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/services/demo/fixtures/identity.ts
git commit -m "Lane A: identity fixtures — invite codes, vouchers, languages, demo participation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Digital Agent store

**Files:**
- Create: `src/components/identity/agent/digitalAgentStore.ts`

- [ ] **Step 1: Create the store**

```ts
// Lane A — local Digital Agent store (UI-only mockup).
//
// The agent a newcomer builds during onboarding + their onboarding progress.
// localStorage-backed and refresh-surviving, mirroring services/demo/demoState.ts.
// Lives inside the Lane A owned tree because the demo plumbing isn't ours to edit.
// No backend, no contract writes.

const AGENT_KEY = 'gloki.digitalAgent';
const ONBOARDING_KEY = 'gloki.onboarding';

export interface DigitalAgent {
  displayName: string;
  photo: string; // data URL, or '' → render initials
  country: string; // ISO 3166-1 alpha-2, or ''
  languages: string[]; // ISO 639-1 (+ local) codes
  createdAt: number;
  invitedBy?: string; // voucher publicKey
  vouchedBy: string[]; // publicKeys; length = "vouched by N"
  consentedAt?: number; // set when the user accepts the deliberation rules
}

export interface OnboardingProgress {
  step: number;
  completed: boolean;
}

export const ONBOARDING_STEP_COUNT = 5;

const DEFAULT_PROGRESS: OnboardingProgress = { step: 0, completed: false };

// In-memory caches so getSnapshot returns a STABLE reference for useSyncExternalStore.
let agentCache: DigitalAgent | null | undefined; // undefined = not yet loaded
let progressCache: OnboardingProgress | undefined;

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[DigitalAgent] Failed to persist ${key}:`, err);
  }
}

export function getAgent(): DigitalAgent | null {
  if (agentCache === undefined) agentCache = readJson<DigitalAgent | null>(AGENT_KEY, null);
  return agentCache;
}

export function getProgress(): OnboardingProgress {
  if (progressCache === undefined) progressCache = readJson<OnboardingProgress>(ONBOARDING_KEY, DEFAULT_PROGRESS);
  return progressCache;
}

function baseAgent(): DigitalAgent {
  return { displayName: '', photo: '', country: '', languages: [], createdAt: Date.now(), vouchedBy: [] };
}

/** Merge a partial agent into the stored one (creating it if absent). */
export function saveAgent(partial: Partial<DigitalAgent>): DigitalAgent {
  const next: DigitalAgent = { ...(getAgent() ?? baseAgent()), ...partial };
  agentCache = next;
  writeJson(AGENT_KEY, next);
  notify();
  return next;
}

export function saveProgress(partial: Partial<OnboardingProgress>): OnboardingProgress {
  const next: OnboardingProgress = { ...getProgress(), ...partial };
  progressCache = next;
  writeJson(ONBOARDING_KEY, next);
  notify();
  return next;
}

export function clearAgent(): void {
  agentCache = null;
  try {
    localStorage.removeItem(AGENT_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function resetOnboarding(): void {
  progressCache = { ...DEFAULT_PROGRESS };
  writeJson(ONBOARDING_KEY, progressCache);
  notify();
}

/** Genuine fresh start: clears the created agent AND onboarding progress. */
export function startOver(): void {
  agentCache = null;
  progressCache = { ...DEFAULT_PROGRESS };
  try {
    localStorage.removeItem(AGENT_KEY);
  } catch {
    /* ignore */
  }
  writeJson(ONBOARDING_KEY, progressCache);
  notify();
}

/** Derive initials from a name, e.g. "Amani Otieno" → "AO". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Cross-tab sync: invalidate caches when another tab writes, then notify.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === AGENT_KEY) {
      agentCache = undefined;
      notify();
    } else if (e.key === ONBOARDING_KEY) {
      progressCache = undefined;
      notify();
    }
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/identity/agent/digitalAgentStore.ts
git commit -m "Lane A: localStorage-backed Digital Agent store

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: useDigitalAgent hook

**Files:**
- Create: `src/components/identity/agent/useDigitalAgent.ts`

- [ ] **Step 1: Create the hook**

```ts
import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getAgent,
  getProgress,
  saveAgent,
  saveProgress,
  clearAgent,
  resetOnboarding,
  startOver,
  ONBOARDING_STEP_COUNT,
  type DigitalAgent,
  type OnboardingProgress,
} from './digitalAgentStore';

export interface UseDigitalAgent {
  agent: DigitalAgent | null;
  progress: OnboardingProgress;
  isOnboarded: boolean;
  hasAgent: boolean;
  stepCount: number;
  saveAgent: (partial: Partial<DigitalAgent>) => void;
  saveProgress: (partial: Partial<OnboardingProgress>) => void;
  clearAgent: () => void;
  resetOnboarding: () => void;
  startOver: () => void;
}

/** Subscribe to the Digital Agent store; re-renders on any change (incl. other tabs). */
export function useDigitalAgent(): UseDigitalAgent {
  const agent = useSyncExternalStore(subscribe, getAgent, getAgent);
  const progress = useSyncExternalStore(subscribe, getProgress, getProgress);
  const hasAgent =
    !!agent && (!!agent.displayName || !!agent.country || agent.languages.length > 0);
  return {
    agent,
    progress,
    isOnboarded: progress.completed,
    hasAgent,
    stepCount: ONBOARDING_STEP_COUNT,
    saveAgent,
    saveProgress,
    clearAgent,
    resetOnboarding,
    startOver,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/identity/agent/useDigitalAgent.ts
git commit -m "Lane A: useDigitalAgent hook over the agent store

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: PhotoPicker

**Files:**
- Create: `src/components/identity/PhotoPicker.tsx`
- Create: `src/components/identity/PhotoPicker.module.scss`

- [ ] **Step 1: Create `PhotoPicker.tsx`**

```tsx
import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';
import styles from './PhotoPicker.module.scss';

export interface PhotoPickerProps {
  /** Current photo data URL, or '' for none. */
  value: string;
  onChange: (dataUrl: string) => void;
  /** Initials shown when there's no photo. */
  initials?: string;
  /** Accessible label for the upload control (translated). */
  label: string;
  size?: 'md' | 'lg';
}

const MAX_DIMENSION = 200;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width;
          width = MAX_DIMENSION;
        }
      } else if (height > MAX_DIMENSION) {
        width = (width * MAX_DIMENSION) / height;
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no-2d-context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = URL.createObjectURL(file);
  });
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ value, onChange, initials, label, size = 'lg' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      onChange(await resizeImage(file));
    } catch {
      /* ignore — keep the prior value */
    }
  };

  return (
    <div className={`${styles.picker} ${styles[size]}`}>
      <button type="button" className={styles.avatar} onClick={() => inputRef.current?.click()} aria-label={label}>
        {value ? (
          <img src={value} alt="" />
        ) : initials ? (
          <span className={styles.initials} aria-hidden>
            {initials}
          </span>
        ) : (
          <User size={28} aria-hidden />
        )}
        <span className={styles.camera} aria-hidden>
          <Camera size={14} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className={styles.input} tabIndex={-1} />
    </div>
  );
};

export default PhotoPicker;
```

- [ ] **Step 2: Create `PhotoPicker.module.scss`**

```scss
@use '../../styles/variables' as *;

.picker {
  display: inline-block;
}

.avatar {
  position: relative;
  border-radius: $radius-full;
  border: 2px dashed $gray-300;
  background: $gray-50;
  color: $gray-400;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }
}

.md .avatar {
  width: 64px;
  height: 64px;
}

.lg .avatar {
  width: 96px;
  height: 96px;
}

.initials {
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: $gray-500;
}

.camera {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28px;
  height: 28px;
  border-radius: $radius-full;
  background: $primary;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .avatar {
    background: $dark-bg;
    border-color: $dark-border;
  }
  .camera {
    border-color: $dark-bg;
  }
  .initials {
    color: $dark-text-secondary;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/identity/PhotoPicker.tsx src/components/identity/PhotoPicker.module.scss
git commit -m "Lane A: PhotoPicker (resize + initials fallback)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Shared step styles + Invite & Vouch steps

**Files:**
- Create: `src/components/onboarding/steps/steps.module.scss`
- Create: `src/components/onboarding/steps/InviteStep.tsx`
- Create: `src/components/onboarding/steps/VouchStep.tsx`

- [ ] **Step 1: Create `steps.module.scss`** (shared by all five steps)

```scss
@use '../../../styles/variables' as *;

.step {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  flex: 1;
}

.hero {
  display: flex;
  justify-content: center;
  color: $primary;
  margin-top: $spacing-lg;
}

.heading {
  margin: 0;
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: $gray-900;
  text-align: center;
  outline: none;
}

.lead {
  margin: 0;
  font-size: $text-base;
  line-height: 1.5;
  color: $gray-600;
  text-align: center;
}

/* Actions — bottom-anchored (thumb zone) on tall screens */
.actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding-top: $spacing-lg;
}

.secondaryActions {
  display: flex;
  justify-content: space-between;
  gap: $spacing-sm;
}

.inviterRow {
  display: flex;
  justify-content: center;
}

/* Voucher card */
.voucherCard {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}
.voucherAvatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: $radius-full;
  background: $primary;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-semibold;
}
.voucherInfo {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
}
.voucherName {
  font-weight: $font-medium;
  color: $gray-900;
  font-size: $text-base;
}
.voucherBadge {
  color: $success;
  flex-shrink: 0;
}
.vouchedBy {
  margin: 0;
  text-align: center;
  font-size: $text-sm;
  color: $gray-500;
}

/* Form fields */
.photoRow {
  display: flex;
  justify-content: center;
}
.field {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.fieldLabel {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-700;
}
.input {
  height: 44px;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  padding: 0 $spacing-md;
  font-size: $text-base;
  background: white;
  color: $gray-900;
  width: 100%;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
    border-color: $primary;
  }
}

/* Language chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
.chip {
  min-height: 44px;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  border: 1px solid $gray-200;
  background: white;
  color: $gray-700;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }
}
.chipActive {
  background: $primary;
  border-color: $primary;
  color: white;
}

/* Rules */
.ruleList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.rule {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-radius: $radius-lg;
  background: white;
  border: 1px solid $gray-100;
  font-size: $text-base;
  color: $gray-800;
}
.ruleIcon {
  display: flex;
  color: $primary;
  flex-shrink: 0;
}

/* Ready */
.readyIcon {
  display: flex;
  justify-content: center;
  color: $success;
}
.recapCard {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}
.recapAvatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: $radius-full;
  overflow: hidden;
  background: $primary;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-semibold;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.recapInfo {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}
.recapName {
  font-weight: $font-semibold;
  color: $gray-900;
  font-size: $text-lg;
}
.recapMeta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-xs;
}

@media (prefers-color-scheme: dark) {
  .heading,
  .voucherName,
  .recapName,
  .fieldLabel {
    color: $dark-text;
  }
  .lead,
  .vouchedBy {
    color: $dark-text-secondary;
  }
  .input,
  .chip,
  .rule {
    background: $dark-bg;
    border-color: $dark-border;
    color: $dark-text;
  }
  .chipActive {
    background: $primary;
    border-color: $primary;
    color: white;
  }
}
```

- [ ] **Step 2: Create `InviteStep.tsx`**

```tsx
import React from 'react';
import { Button, EarthFlag, CountryFlag } from '../../shared';
import { useT } from '../../../i18n';
import type { Persona } from '../../../services/demo/fixtures/identity';
import styles from './steps.module.scss';

interface Props {
  voucher: Persona;
  onContinue: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

const InviteStep: React.FC<Props> = ({ voucher, onContinue, headingRef }) => {
  const t = useT();
  return (
    <section className={styles.step}>
      <div className={styles.hero}>
        <EarthFlag size={64} />
      </div>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.invite.title', "You've been invited")}
      </h1>
      <p className={styles.lead}>
        {t(
          'onboarding.invite.lead',
          '{name} invited you to Voices for the Climate — where young people across Africa decide what to do about the climate, together.',
          { name: voucher.firstName },
        )}
      </p>
      <div className={styles.inviterRow}>
        <CountryFlag code={voucher.country} showName />
      </div>
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onContinue}>
          {t('common.continue', 'Continue')}
        </Button>
      </div>
    </section>
  );
};

export default InviteStep;
```

- [ ] **Step 3: Create `VouchStep.tsx`**

```tsx
import React from 'react';
import { Button, Card, CountryFlag } from '../../shared';
import { ShieldCheck } from 'lucide-react';
import { useT } from '../../../i18n';
import { getInitials } from '../../identity/agent/digitalAgentStore';
import type { Persona } from '../../../services/demo/fixtures/identity';
import styles from './steps.module.scss';

interface Props {
  voucher: Persona;
  vouchCount: number;
  onContinue: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

const VouchStep: React.FC<Props> = ({ voucher, vouchCount, onContinue, onBack, headingRef }) => {
  const t = useT();
  const others = Math.max(0, vouchCount - 1);
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.vouch.title', 'A friend vouched for you')}
      </h1>
      <Card className={styles.voucherCard}>
        <div className={styles.voucherAvatar} aria-hidden>
          {getInitials(`${voucher.firstName} ${voucher.lastName}`)}
        </div>
        <div className={styles.voucherInfo}>
          <span className={styles.voucherName}>
            {voucher.firstName} {voucher.lastName}
          </span>
          <CountryFlag code={voucher.country} showName size="sm" />
        </div>
        <ShieldCheck className={styles.voucherBadge} aria-hidden />
      </Card>
      {others > 0 && (
        <p className={styles.vouchedBy}>
          {t('onboarding.vouch.alsoVouched', 'Vouched by {count} people in the community', { count: vouchCount })}
        </p>
      )}
      <p className={styles.lead}>
        {t(
          'onboarding.vouch.explain',
          "A vouch is how Gloki stays real people, not bots. It's lightweight trust — no ID papers, no face scan. Someone already here said: this person belongs.",
        )}
      </p>
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onContinue}>
          {t('common.continue', 'Continue')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onBack}>
          {t('common.back', 'Back')}
        </Button>
      </div>
    </section>
  );
};

export default VouchStep;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/steps/steps.module.scss src/components/onboarding/steps/InviteStep.tsx src/components/onboarding/steps/VouchStep.tsx
git commit -m "Lane A: onboarding step styles + Invite & Vouch steps

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Agent step (create the Digital Agent)

**Files:**
- Create: `src/components/onboarding/steps/AgentStep.tsx`

- [ ] **Step 1: Create `AgentStep.tsx`**

```tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, SearchableSelect } from '../../shared';
import { useT } from '../../../i18n';
import PhotoPicker from '../../identity/PhotoPicker';
import { getInitials, type DigitalAgent } from '../../identity/agent/digitalAgentStore';
import { ONBOARDING_LANGUAGES, type Persona } from '../../../services/demo/fixtures/identity';
import { COUNTRIES, OTHER_COUNTRY } from '../../../utils/countries';
import styles from './steps.module.scss';

export interface AgentFields {
  displayName: string;
  photo: string;
  country: string;
  languages: string[];
}

interface Props {
  agent: DigitalAgent | null;
  voucher: Persona;
  onContinue: (fields: AgentFields) => void;
  onSkip: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

const AgentStep: React.FC<Props> = ({ agent, voucher, onContinue, onSkip, onBack, headingRef }) => {
  const t = useT();
  const [displayName, setDisplayName] = useState(agent?.displayName ?? '');
  const [photo, setPhoto] = useState(agent?.photo ?? '');
  const [country, setCountry] = useState(agent?.country || voucher.country);
  const [languages, setLanguages] = useState<string[]>(
    agent?.languages?.length ? agent.languages : voucher.languages,
  );

  const toggleLang = (code: string) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const submit = () => onContinue({ displayName: displayName.trim(), photo, country, languages });

  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.agent.title', 'Create your Digital Agent')}
      </h1>
      <p className={styles.lead}>
        {t('onboarding.agent.lead', 'Your Digital Agent represents you in deliberations. You can change any of this later.')}
      </p>

      <div className={styles.photoRow}>
        <PhotoPicker
          value={photo}
          onChange={setPhoto}
          initials={getInitials(displayName)}
          label={t('onboarding.agent.photo', 'Add a photo (optional)')}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="agent-name">
          {t('onboarding.agent.name', 'Your name')}
        </label>
        <input
          id="agent-name"
          className={styles.input}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('onboarding.agent.namePlaceholder', 'How should we call you?')}
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="agent-country">
          {t('onboarding.agent.country', 'Your country')}
        </label>
        <SearchableSelect
          options={[
            ...COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag })),
            { value: OTHER_COUNTRY.code, label: OTHER_COUNTRY.name, icon: OTHER_COUNTRY.flag },
          ]}
          value={country}
          onChange={setCountry}
          placeholder={t('onboarding.agent.countryPlaceholder', 'Select your country')}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('onboarding.agent.languages', 'Languages you speak')}</span>
        <div className={styles.chips} role="group" aria-label={t('onboarding.agent.languages', 'Languages you speak')}>
          {ONBOARDING_LANGUAGES.map((lang) => {
            const active = languages.includes(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                className={clsx(styles.chip, active && styles.chipActive)}
                aria-pressed={active}
                onClick={() => toggleLang(lang.code)}
              >
                {t(`lang.${lang.code}`, lang.defaultLabel)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={submit}>
          {t('common.continue', 'Continue')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            {t('onboarding.skip', 'Skip for now')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AgentStep;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/steps/AgentStep.tsx
git commit -m "Lane A: Agent creation step (name, photo, country, languages)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Rules & Ready steps

**Files:**
- Create: `src/components/onboarding/steps/RulesStep.tsx`
- Create: `src/components/onboarding/steps/ReadyStep.tsx`

- [ ] **Step 1: Create `RulesStep.tsx`**

```tsx
import React from 'react';
import { Button } from '../../shared';
import { MessagesSquare, Scale, HeartHandshake, Lock } from 'lucide-react';
import { useT } from '../../../i18n';
import styles from './steps.module.scss';

interface Props {
  onAgree: () => void;
  onSkip: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

const RulesStep: React.FC<Props> = ({ onAgree, onSkip, onBack, headingRef }) => {
  const t = useT();
  const rules = [
    { icon: <MessagesSquare aria-hidden />, text: t('onboarding.rules.discuss', 'We discuss before we vote.') },
    { icon: <Scale aria-hidden />, text: t('onboarding.rules.equal', "One person, one voice — you can't buy influence.") },
    { icon: <HeartHandshake aria-hidden />, text: t('onboarding.rules.kind', 'Disagree kindly — challenge ideas, not people.') },
    { icon: <Lock aria-hidden />, text: t('onboarding.rules.data', 'Your data stays yours.') },
  ];
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.rules.title', 'How we work together')}
      </h1>
      <p className={styles.lead}>{t('onboarding.rules.lead', 'Four simple promises everyone here makes.')}</p>
      <ul className={styles.ruleList}>
        {rules.map((rule, i) => (
          <li key={i} className={styles.rule}>
            <span className={styles.ruleIcon}>{rule.icon}</span>
            <span>{rule.text}</span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onAgree}>
          {t('onboarding.rules.agree', 'I agree')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            {t('onboarding.skip', 'Skip for now')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RulesStep;
```

- [ ] **Step 2: Create `ReadyStep.tsx`**

```tsx
import React from 'react';
import { Button, Card, CountryFlag, Badge, Banner } from '../../shared';
import { CheckCircle2 } from 'lucide-react';
import { useT } from '../../../i18n';
import { getInitials, type DigitalAgent } from '../../identity/agent/digitalAgentStore';
import styles from './steps.module.scss';

interface Props {
  agent: DigitalAgent | null;
  consented: boolean;
  onExplore: () => void;
  onViewAgent: () => void;
  onConsentNudge: () => void;
  headingRef: React.RefObject<HTMLHeadingElement>;
}

const ReadyStep: React.FC<Props> = ({ agent, consented, onExplore, onViewAgent, onConsentNudge, headingRef }) => {
  const t = useT();
  const name = agent?.displayName?.trim();
  return (
    <section className={styles.step}>
      <div className={styles.readyIcon} aria-hidden>
        <CheckCircle2 size={56} />
      </div>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.ready.title', "You're ready to participate")}
      </h1>
      <Card className={styles.recapCard}>
        <div className={styles.recapAvatar} aria-hidden>
          {agent?.photo ? <img src={agent.photo} alt="" /> : <span>{getInitials(name || '')}</span>}
        </div>
        <div className={styles.recapInfo}>
          <span className={styles.recapName}>{name || t('onboarding.ready.anon', 'Your Digital Agent')}</span>
          <div className={styles.recapMeta}>
            {agent?.country && <CountryFlag code={agent.country} showName size="sm" />}
            {agent?.languages?.map((code) => (
              <Badge key={code} tone="neutral" size="sm">
                {t(`lang.${code}`, code)}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
      {!consented && (
        <Banner
          tone="info"
          action={
            <Button size="sm" variant="secondary" onClick={onConsentNudge}>
              {t('onboarding.ready.review', 'Review')}
            </Button>
          }
        >
          {t('onboarding.ready.consentNudge', 'You skipped the community promises — take a quick look when you can.')}
        </Banner>
      )}
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onExplore}>
          {t('onboarding.cta.explore', 'Explore the climate deliberation')}
        </Button>
        <Button variant="secondary" fullWidth onClick={onViewAgent}>
          {t('onboarding.cta.viewAgent', 'View my Digital Agent')}
        </Button>
      </div>
    </section>
  );
};

export default ReadyStep;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/steps/RulesStep.tsx src/components/onboarding/steps/ReadyStep.tsx
git commit -m "Lane A: Rules (consent) + Ready steps

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: OnboardingFlow orchestrator (replace stub)

**Files:**
- Replace: `src/components/onboarding/OnboardingFlow.tsx`
- Create: `src/components/onboarding/OnboardingFlow.module.scss`

- [ ] **Step 1: Replace `OnboardingFlow.tsx`** (overwrite the stub entirely)

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper, Button, Card } from '../shared';
import { useT } from '../../i18n';
import { useDigitalAgent } from '../identity/agent/useDigitalAgent';
import { getVoucher, defaultVouchers } from '../../services/demo/fixtures/identity';
import InviteStep from './steps/InviteStep';
import VouchStep from './steps/VouchStep';
import AgentStep from './steps/AgentStep';
import RulesStep from './steps/RulesStep';
import ReadyStep from './steps/ReadyStep';
import styles from './OnboardingFlow.module.scss';

/**
 * Lane A — guided first-run journey, routed at `/welcome/*`.
 * Single screen, resumable: invite → vouch → Digital Agent → consent → ready.
 */
const OnboardingFlow: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { agent, progress, isOnboarded, saveAgent, saveProgress, startOver } = useDigitalAgent();

  const voucher = getVoucher(params.get('invite'));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(progress.completed ? 0 : progress.step);

  // Seed the vouch as soon as the newcomer arrives, so it survives a later skip.
  useEffect(() => {
    if (!agent?.invitedBy) {
      saveAgent({ invitedBy: voucher.publicKey, vouchedBy: defaultVouchers(voucher.publicKey) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the step heading on each step change (announced via the live region).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const go = (next: number) => {
    setStep(next);
    saveProgress({ step: next });
  };

  // Return state: already onboarded → compact "all set" with Start over.
  if (isOnboarded) {
    return (
      <div className={styles.flow}>
        <Card className={styles.doneCard}>
          <h1 className={styles.doneTitle}>{t('onboarding.alreadyDone.title', "You're all set up")}</h1>
          <p className={styles.doneLead}>
            {t('onboarding.alreadyDone.lead', 'Your Digital Agent is ready. Jump back into the deliberation, or start the welcome guide over.')}
          </p>
          <div className={styles.doneActions}>
            <Button fullWidth onClick={() => navigate('/stage/problem')}>
              {t('onboarding.cta.explore', 'Explore the climate deliberation')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => { startOver(); setStep(0); }}>
              {t('onboarding.cta.startOver', 'Start over')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { label: t('onboarding.step.invite', 'Invite') },
    { label: t('onboarding.step.vouch', 'Trust') },
    { label: t('onboarding.step.agent', 'You') },
    { label: t('onboarding.step.rules', 'Rules') },
    { label: t('onboarding.step.ready', 'Ready') },
  ];
  const vouchCount = agent?.vouchedBy.length ?? 1;
  const consented = !!agent?.consentedAt;

  return (
    <div className={styles.flow}>
      <div className={styles.stepperWrap}>
        <Stepper steps={steps} current={step} onStepClick={(i) => go(i)} />
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite">
        {t('onboarding.announce', 'Step {n} of {total}: {label}', { n: step + 1, total: steps.length, label: steps[step].label })}
      </p>

      <div className={styles.stepBody}>
        {step === 0 && <InviteStep headingRef={headingRef} voucher={voucher} onContinue={() => go(1)} />}
        {step === 1 && (
          <VouchStep headingRef={headingRef} voucher={voucher} vouchCount={vouchCount} onBack={() => go(0)} onContinue={() => go(2)} />
        )}
        {step === 2 && (
          <AgentStep
            headingRef={headingRef}
            agent={agent}
            voucher={voucher}
            onBack={() => go(1)}
            onContinue={(fields) => { saveAgent(fields); go(3); }}
            onSkip={() => go(3)}
          />
        )}
        {step === 3 && (
          <RulesStep
            headingRef={headingRef}
            onBack={() => go(2)}
            onAgree={() => { saveAgent({ consentedAt: Date.now() }); go(4); }}
            onSkip={() => go(4)}
          />
        )}
        {step === 4 && (
          <ReadyStep
            headingRef={headingRef}
            agent={agent}
            consented={consented}
            onConsentNudge={() => go(3)}
            onExplore={() => { saveProgress({ completed: true }); navigate('/stage/problem'); }}
            onViewAgent={() => { saveProgress({ completed: true }); navigate('/identity/profile'); }}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
```

- [ ] **Step 2: Create `OnboardingFlow.module.scss`**

```scss
@use '../../styles/variables' as *;

.flow {
  max-width: $content-max-width;
  margin: 0 auto;
  min-height: 100vh;
  padding: $spacing-xl $spacing-lg calc(#{$footer-height} + #{$spacing-xl});
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  background-color: $gray-50;
}

.stepperWrap {
  padding: 0 $spacing-xs;
}

.stepBody {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.doneCard {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.doneTitle {
  margin: 0;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gray-900;
}
.doneLead {
  margin: 0;
  font-size: $text-sm;
  color: $gray-500;
}
.doneActions {
  margin-top: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

@media (prefers-color-scheme: dark) {
  .flow {
    background-color: $dark-surface;
  }
  .doneTitle {
    color: $dark-text;
  }
  .doneLead {
    color: $dark-text-secondary;
  }
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 4: Preview walk** (start dev in the worktree, then drive the preview)

Run: `npm run dev` (note the localhost URL), then with `mcp__Claude_Preview__*`: open `/welcome?invite=CLIMATE24`. Verify:
- All 5 steps advance; Stepper marks progress; Back + Stepper markers go back.
- Skip on Agent and Rules jumps forward; Ready shows the consent nudge if Rules was skipped.
- Refresh mid-flow resumes at the same step; completing then revisiting `/welcome` shows the "all set up" state; Start over resets.
- No console errors. (Dark mode + 360px are checked in Task 13.)

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingFlow.tsx src/components/onboarding/OnboardingFlow.module.scss
git commit -m "Lane A: OnboardingFlow orchestrator — resumable 5-step first-run journey

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: DigitalAgentCard (A2)

**Files:**
- Create: `src/components/identity/DigitalAgentCard.tsx`
- Create: `src/components/identity/DigitalAgentCard.module.scss`

- [ ] **Step 1: Create `DigitalAgentCard.tsx`**

```tsx
import React from 'react';
import { Card, Button, Badge, CountryFlag, CountryPresence } from '../shared';
import { Pencil, History } from 'lucide-react';
import { useT } from '../../i18n';
import { getInitials, type DigitalAgent } from './agent/digitalAgentStore';
import { getPersona, DEMO_PARTICIPATION } from '../../services/demo/fixtures/identity';
import styles from './DigitalAgentCard.module.scss';

interface Props {
  agent: DigitalAgent;
  onEdit?: () => void;
}

const DigitalAgentCard: React.FC<Props> = ({ agent, onEdit }) => {
  const t = useT();
  const name = agent.displayName?.trim() || t('agent.unnamed', 'Your Digital Agent');
  const voucherCountries = agent.vouchedBy
    .map((k) => getPersona(k)?.country)
    .filter((c): c is string => !!c);

  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <div className={styles.avatar} aria-hidden>
          {agent.photo ? <img src={agent.photo} alt="" /> : <span>{getInitials(agent.displayName)}</span>}
        </div>
        <div className={styles.identity}>
          <h2 className={styles.name}>{name}</h2>
          {agent.country && <CountryFlag code={agent.country} showName />}
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" leftIcon={<Pencil size={16} />} onClick={onEdit}>
            {t('common.edit', 'Edit')}
          </Button>
        )}
      </div>

      {agent.languages.length > 0 && (
        <div className={styles.langs}>
          {agent.languages.map((code) => (
            <Badge key={code} tone="neutral">
              {t(`lang.${code}`, code)}
            </Badge>
          ))}
        </div>
      )}

      {agent.vouchedBy.length > 0 && (
        <div className={styles.vouch}>
          <CountryPresence
            countries={voucherCountries}
            size="sm"
            label={t('agent.vouchedBy', 'Vouched by {count}', { count: agent.vouchedBy.length })}
          />
        </div>
      )}

      <div className={styles.history}>
        <span className={styles.historyTitle}>
          <History size={16} aria-hidden /> {t('agent.activity.title', 'Participation')}
        </span>
        {DEMO_PARTICIPATION.length === 0 ? (
          <p className={styles.historyEmpty}>{t('agent.activity.none', 'No activity yet')}</p>
        ) : (
          <ul className={styles.historyList}>
            {DEMO_PARTICIPATION.map((e, i) => (
              <li key={i} className={styles.historyItem}>
                <span className={styles.historyName}>{t(e.titleKey, e.defaultTitle)}</span>
                <Badge tone="info" size="sm">
                  {t(e.stageKey, e.defaultStage)}
                </Badge>
                <span className={styles.historyWhen}>{e.when}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default DigitalAgentCard;
```

- [ ] **Step 2: Create `DigitalAgentCard.module.scss`**

```scss
@use '../../styles/variables' as *;

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.top {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}
.avatar {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: $radius-full;
  overflow: hidden;
  background: $primary;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-semibold;
  font-size: $text-xl;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.identity {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  min-width: 0;
}
.name {
  margin: 0;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $gray-900;
}

.langs {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.vouch {
  padding-top: $spacing-xs;
}

.history {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  border-top: 1px solid $gray-100;
  padding-top: $spacing-lg;
}
.historyTitle {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-700;
}
.historyEmpty {
  margin: 0;
  font-size: $text-sm;
  color: $gray-400;
}
.historyList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.historyItem {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $text-sm;
  color: $gray-700;
}
.historyName {
  flex: 1;
  min-width: 0;
}
.historyWhen {
  color: $gray-400;
  font-size: $text-xs;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .name,
  .historyTitle,
  .historyItem {
    color: $dark-text;
  }
  .historyEmpty,
  .historyWhen {
    color: $dark-text-secondary;
  }
  .history {
    border-color: $dark-border;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/identity/DigitalAgentCard.tsx src/components/identity/DigitalAgentCard.module.scss
git commit -m "Lane A: DigitalAgentCard — country, languages, vouched-by, participation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Rework Profile into the Digital Agent view

**Files:**
- Replace: `src/components/identity/Profile.tsx`
- Replace: `src/components/identity/Profile.module.scss`

- [ ] **Step 1: Replace `Profile.tsx`** (overwrite entirely — drops the contract `setValues`/userSlice wiring)

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAppSelector } from '../../store/hooks';
import { Key, Server, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { Button, Card, Modal, EmptyState, Banner, SearchableSelect } from '../shared';
import { useT } from '../../i18n';
import DigitalAgentCard from './DigitalAgentCard';
import PhotoPicker from './PhotoPicker';
import { useDigitalAgent } from './agent/useDigitalAgent';
import { getInitials } from './agent/digitalAgentStore';
import { ONBOARDING_LANGUAGES } from '../../services/demo/fixtures/identity';
import { COUNTRIES, OTHER_COUNTRY } from '../../utils/countries';
import { getLocalOpenAIApiKey, setLocalOpenAIApiKey } from '../../utils/localSecrets';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.user);
  const { agent, hasAgent, isOnboarded, saveAgent } = useDigitalAgent();

  const [editing, setEditing] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);

  // Edit-form local state (seeded from the stored agent on open).
  const [displayName, setDisplayName] = useState('');
  const [photo, setPhoto] = useState('');
  const [country, setCountry] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  const openEdit = () => {
    setDisplayName(agent?.displayName ?? '');
    setPhoto(agent?.photo ?? '');
    setCountry(agent?.country ?? '');
    setLanguages(agent?.languages ?? []);
    setApiKey(getLocalOpenAIApiKey(user.serverUrl, user.publicKey));
    setEditing(true);
  };

  const saveEdit = () => {
    saveAgent({ displayName: displayName.trim(), photo, country, languages });
    if (user.serverUrl && user.publicKey) setLocalOpenAIApiKey(user.serverUrl, user.publicKey, apiKey);
    setEditing(false);
  };

  const toggleLang = (code: string) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  return (
    <div className={styles.container}>
      {!isOnboarded && hasAgent && (
        <Banner
          tone="info"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/welcome')}>
              {t('common.continue', 'Continue')}
            </Button>
          }
        >
          {t('agent.finishNudge', 'Finish setting up your Digital Agent')}
        </Banner>
      )}

      {hasAgent && agent ? (
        <DigitalAgentCard agent={agent} onEdit={openEdit} />
      ) : (
        <EmptyState
          icon={<UserPlus size={48} />}
          title={t('agent.empty.title', 'Set up your Digital Agent')}
          message={t('agent.empty.message', 'Create the identity that represents you in deliberations — it only takes a minute.')}
          action={<Button onClick={() => navigate('/welcome')}>{t('agent.empty.cta', 'Get started')}</Button>}
        />
      )}

      {/* Network identity (read-only, informative) */}
      <button
        className={styles.identityToggle}
        onClick={() => setShowIdentity((v) => !v)}
        aria-expanded={showIdentity}
      >
        <span>{t('agent.networkIdentity', 'Network identity')}</span>
        {showIdentity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {showIdentity && (
        <Card className={styles.identityCard}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <Key size={14} /> {t('agent.publicKey', 'Public key')}
            </span>
            <code className={styles.infoValue}>{user.publicKey || '—'}</code>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <Server size={14} /> {t('agent.serverUrl', 'Server')}
            </span>
            <code className={styles.infoValue}>{user.serverUrl || '—'}</code>
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title={t('agent.edit.title', 'Edit your Digital Agent')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={saveEdit}>{t('common.save', 'Save')}</Button>
          </>
        }
      >
        <div className={styles.editForm}>
          <div className={styles.photoRow}>
            <PhotoPicker value={photo} onChange={setPhoto} initials={getInitials(displayName)} label={t('onboarding.agent.photo', 'Add a photo (optional)')} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-name">
              {t('onboarding.agent.name', 'Your name')}
            </label>
            <input id="edit-name" className={styles.input} type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-country">
              {t('onboarding.agent.country', 'Your country')}
            </label>
            <SearchableSelect
              options={[
                ...COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag })),
                { value: OTHER_COUNTRY.code, label: OTHER_COUNTRY.name, icon: OTHER_COUNTRY.flag },
              ]}
              value={country}
              onChange={setCountry}
              placeholder={t('onboarding.agent.countryPlaceholder', 'Select your country')}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>{t('onboarding.agent.languages', 'Languages you speak')}</span>
            <div className={styles.chips} role="group" aria-label={t('onboarding.agent.languages', 'Languages you speak')}>
              {ONBOARDING_LANGUAGES.map((lang) => {
                const active = languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={clsx(styles.chip, active && styles.chipActive)}
                    aria-pressed={active}
                    onClick={() => toggleLang(lang.code)}
                  >
                    {t(`lang.${lang.code}`, lang.defaultLabel)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-key">
              {t('agent.aiKey', 'AI API key (stored on this device)')}
            </label>
            <input
              id="edit-key"
              className={styles.input}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('common.optional', 'Optional')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
```

- [ ] **Step 2: Replace `Profile.module.scss`** (overwrite entirely)

```scss
@use '../../styles/variables' as *;

.container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.identityToggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $spacing-md $spacing-lg;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: $gray-600;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;

  &:hover {
    background: $gray-100;
  }
  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }
}

.identityCard {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.infoItem {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}
.infoLabel {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $text-xs;
  color: $gray-500;
}
.infoValue {
  font-family: monospace;
  font-size: $text-xs;
  color: $gray-700;
  word-break: break-all;
  background: $gray-50;
  padding: $spacing-sm;
  border-radius: $radius-sm;
}

.editForm {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}
.photoRow {
  display: flex;
  justify-content: center;
}
.field {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.fieldLabel {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $gray-700;
}
.input {
  height: 44px;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  padding: 0 $spacing-md;
  font-size: $text-base;
  background: white;
  color: $gray-900;
  width: 100%;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
    border-color: $primary;
  }
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}
.chip {
  min-height: 44px;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  border: 1px solid $gray-200;
  background: white;
  color: $gray-700;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }
}
.chipActive {
  background: $primary;
  border-color: $primary;
  color: white;
}

@media (prefers-color-scheme: dark) {
  .identityToggle {
    color: $dark-text-secondary;
    &:hover {
      background: $dark-bg;
    }
  }
  .infoLabel {
    color: $dark-text-secondary;
  }
  .infoValue {
    background: $dark-surface;
    color: $dark-text;
  }
  .input,
  .chip {
    background: $dark-bg;
    border-color: $dark-border;
    color: $dark-text;
  }
  .chipActive {
    background: $primary;
    border-color: $primary;
    color: white;
  }
  .fieldLabel {
    color: $dark-text;
  }
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: both clean. (Confirms no dangling imports of the removed `setValues`/`readProfile` wiring.)

- [ ] **Step 4: Preview check** `/identity/profile` — empty state when no agent (CTA → /welcome); after completing /welcome, the Digital Agent card renders with country/languages/vouched-by/participation; Edit modal saves and the card updates live. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/Profile.tsx src/components/identity/Profile.module.scss
git commit -m "Lane A: rework Profile into the Digital Agent card view + edit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: HomepageMenu entry → /welcome

**Files:**
- Modify: `src/components/identity/HomepageMenu.tsx`

- [ ] **Step 1: Add the `useT` import and a `Sparkles` icon import**

Change the lucide import line to add `Sparkles`:

```tsx
import { User, QrCode, Plus, LogOut, EyeOff, Info, Mail, X, LayoutGrid, Sparkles } from 'lucide-react';
```

Add below the existing `styles` import:

```tsx
import { useT } from '../../i18n';
```

- [ ] **Step 2: Call `useT` inside the component** (add as the first line of the component body, before `const navigate = useNavigate();`)

```tsx
  const t = useT();
```

- [ ] **Step 3: Add the menu item** as the FIRST child inside `<div className={styles.menuItems}>` (above the Profile button)

```tsx
          <button className={styles.menuItem} onClick={() => { navigate('/welcome'); onClose(); }}>
            <Sparkles size={20} />
            <span>{t('onboarding.menuEntry', 'Welcome guide')}</span>
          </button>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/HomepageMenu.tsx
git commit -m "Lane A: add 'Welcome guide' entry to the homepage menu

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Coordination request (MASTER_TODO §10)

**Files:**
- Modify: `MASTER_TODO.md` (replace the `- _(empty)_` line under "## 10. Coordination log")

- [ ] **Step 1: Replace the placeholder** under §10

Find:

```markdown
## 10. Coordination log *(cross-lane requests for the Foundation owner)*
> Lanes append here instead of editing shared files. Foundation owner applies between waves.
- _(empty)_
```

Replace the `- _(empty)_` line with:

```markdown
- **[Lane A] Post-login first-run routing.** `/welcome/*` is built and reachable via the invite
  deep-link (`/welcome?invite=CODE`) and a HomepageMenu entry, but nothing auto-routes a brand-new
  authenticated user there (`App.tsx` redirects `/` → `/stage/problem`). Request: in `src/App.tsx`,
  send first-run users (no `gloki.digitalAgent` in localStorage, or `gloki.onboarding.completed`
  false) to `/welcome` instead of `/stage/problem`. Lane A cannot edit `App.tsx`.
- **[Lane A, minor] Hide StageFooter on `/welcome/*`.** The global 5-stage footer frames the
  first-run flow oddly for a newcomer. Optional: skip rendering `StageFooter` on `/welcome` routes.
- **[Lane A, i18n] Promote onboarding/agent strings.** Inline English defaults under the
  `onboarding.*` and `agent.*` namespaces are ready to promote into `src/i18n/en.ts` + fr/sw
  overlays (Lane F owns `src/i18n/`).
```

- [ ] **Step 2: Commit**

```bash
git add MASTER_TODO.md
git commit -m "Lane A: log §10 coordination requests (welcome redirect, footer, i18n)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Polish pass — a11y, dark mode, 360px, i18n sweep + tick §9

**Files:**
- Touch only Lane A files as needed for fixes.
- Modify: `MASTER_TODO.md` (tick the §9 Lane A boxes)

- [ ] **Step 1: Full typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: both clean.

- [ ] **Step 2: Dark-mode walk** (preview, emulate `prefers-color-scheme: dark`): `/welcome` (all steps + done state) and `/identity/profile` (card, empty state, edit modal, network-identity). Every surface uses dark tokens — no white-on-white, no hardcoded colors. Fix any gaps in the relevant `.module.scss` dark blocks.

- [ ] **Step 3: 360px walk** (preview, resize to 360px wide): no horizontal scroll; primary actions reachable in the thumb zone; language chips wrap; the Stepper fits; modal fits. Fix in SCSS if needed.

- [ ] **Step 4: Keyboard + screen-reader basics:**
  - Tab through `/welcome`: Stepper markers (back), inputs, chips (`aria-pressed` toggles), buttons all reachable with visible focus rings.
  - On step change, focus lands on the step heading and the live region announces "Step N of 5: …".
  - Profile: Edit opens the modal (Esc closes), the toggle exposes `aria-expanded`, the empty-state CTA is reachable.
  - Fix any gaps (missing labels / focus targets) in Lane A files only.

- [ ] **Step 5: i18n sweep** — `grep` for hardcoded user-facing strings in the new files; confirm every one goes through `t('…', 'English default')`.

Run: `grep -rnE ">[A-Z][a-z]+ " src/components/onboarding src/components/identity/DigitalAgentCard.tsx src/components/identity/PhotoPicker.tsx | grep -v "t(" | grep -v "aria-" || echo "no obvious hardcoded strings"`
Expected: no user-facing literal (icon-only / `t(...)` lines are fine).

- [ ] **Step 6: Tick the §9 Lane A boxes** in `MASTER_TODO.md`

Change the three Lane A checkboxes from `- [ ]` to `- [x]`:

```markdown
- [x] A1 Guided first-run: invite → vouch (Web-of-Trust *lite*: "a friend vouched for you") → create Digital Agent (name, photo, country, languages) → consent to deliberation rules. Stepper, plain language, skippable-but-nudged.
- [x] A2 Profile = "Digital Agent" card: country flag, languages, participation history, trust ("vouched by N"). Defer badges/Council.
- [x] A3 Empty/again states + dark mode + 360px + screen-reader pass.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Lane A: a11y/dark/360px polish + i18n sweep; tick MASTER_TODO §9 Lane A

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Push + open PR

**Files:** none (git only)

- [ ] **Step 1: Final verification gate**

Run: `npx tsc -b --noEmit && npm run build`
Expected: both clean. Capture the output as the PR evidence.

- [ ] **Step 2: Confirm only owned paths changed**

Run: `git diff --name-only ui...lane/lane-a`
Expected: only `src/pages/IdentityView.*` (if touched), `src/components/identity/**`, `src/components/onboarding/**`, `src/services/demo/fixtures/identity.ts`, `MASTER_TODO.md`, and `docs/superpowers/**`. Nothing else.

- [ ] **Step 3: Push**

```bash
git push -u origin lane/lane-a
```

- [ ] **Step 4: Open the PR into `ui`**

```bash
gh pr create --base ui --head lane/lane-a \
  --title "Lane A — Onboarding & Identity: first-run journey + Digital Agent" \
  --body "$(cat <<'EOF'
## Lane A — Onboarding & Identity

Implements A1–A3 (spec: docs/superpowers/specs/2026-05-29-lane-a-onboarding-identity-design.md).

- **A1** Guided first-run at /welcome/*: invite → vouch (Web-of-Trust lite) → create Digital Agent → consent → ready. Resumable single screen + shared Stepper; skippable-but-nudged.
- **A2** /identity/profile reworked into the read-first Digital Agent card (country, languages, "vouched by N", participation) with inline edit. Drops the old contract-wired form (UI-only mockup).
- **A3** Empty/return states, full dark mode, 360px, keyboard + screen-reader pass.

UI-only: data via the identity fixture + a local agent store inside the owned tree. No backend, no shared-file edits.

### Coordination (MASTER_TODO §10)
- Post-login first-run redirect to /welcome (App.tsx — not editable from this lane).
- Optional: hide StageFooter on /welcome.
- i18n: promote onboarding/agent strings to en.ts + fr/sw (Lane F).

### Boundary
The created agent stays on Lane A surfaces — not injected into community member lists (needs community-contract writes owned elsewhere).

### Verification
- `npx tsc -b --noEmit` clean · `npm run build` clean.
- Walked /welcome (all steps, skip, resume, done) + /identity/profile (card, edit, empty) in the preview: no console errors, dark mode holds, 360px holds, keyboard/SR basics work.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report** the PR URL and a short summary of what changed with the verification evidence.

---

## Self-review

**1. Spec coverage**

| Spec requirement | Task |
|---|---|
| A1 invite deep-link entry | 8 (reads `?invite`), 1 (codes/vouchers) |
| A1 vouch (Web-of-Trust lite) | 5 (VouchStep), 1 (getVoucher/defaultVouchers) |
| A1 create Digital Agent (name/photo/country/languages) | 6 (AgentStep), 4 (PhotoPicker) |
| A1 consent to deliberation rules | 7 (RulesStep) |
| A1 Stepper, plain language, skippable-but-nudged, resumable | 8 (orchestrator) |
| A2 Digital Agent card (country/languages/vouched-by/participation) | 9 |
| A2 Profile = card (replace) | 10 |
| A2 keep local AI key (Lane F) + Network Identity | 10 |
| A3 empty state (no agent) | 10 |
| A3 return state (already onboarded / resume) | 8 |
| A3 incomplete-onboarding nudge | 10 (Banner) |
| A3 dark mode / 360px / keyboard+SR | every `.scss` dark block + 13 |
| Local persistence inside owned tree | 2, 3 |
| i18n everywhere | all tasks (`t()`) + 13 sweep |
| §10 coordination ask | 12 |
| HomepageMenu entry | 11 |
| Keep PERSONAS/pick intact | 1 (append-only) |
| Out-of-scope boundary (no member-list injection) | PR body (14) |
| Verify + push + PR | 13, 14 |

No gaps.

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Every code step contains complete code. (The preview-walk steps describe manual checks, which is the project's only verification path — acceptable, not a code placeholder.)

**3. Type consistency:**
- `DigitalAgent` / `OnboardingProgress` defined in Task 2, imported (type-only) in 3, 6, 7, 9.
- Store API names consistent across files: `getAgent`/`getProgress`/`saveAgent`/`saveProgress`/`clearAgent`/`resetOnboarding`/`startOver`/`getInitials`/`subscribe` (Task 2) ↔ hook (Task 3) ↔ consumers (6–10).
- `AgentFields` exported from Task 6, consumed by the orchestrator's `onContinue` in Task 8 (assignable to `Partial<DigitalAgent>` via `saveAgent`).
- Fixture exports (`getVoucher`, `defaultVouchers`, `getPersona`, `ONBOARDING_LANGUAGES`, `DEMO_PARTICIPATION`, `Persona`) defined in Task 1, consumed in 5, 6, 8, 9, 10.
- Shared-kit props match their definitions (`Stepper.onStepClick`, `Button.leftIcon/size/variant/fullWidth`, `Banner.action/tone`, `CountryPresence.countries/label/size`, `Modal.footer/closeLabel`).
- i18n `t(key, default, vars)` interpolation used correctly for `{n}/{total}/{label}` and `{count}` / `{name}`.

No inconsistencies found.
