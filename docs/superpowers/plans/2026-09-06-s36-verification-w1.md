# S36 — Prompt 2 Wave 1: Community verification (hub · request · approve · invite) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the verification hub, request, approve and invite screens under `/identity/verification/*`, backed by a seam (`src/services/verification.ts`) over a localStorage demo layer, with the kit additions (`Toast`, `ProgressBar segments`, `MemberCard`) Wave 1 needs.

**Architecture:** Components import only `src/services/verification.ts`; the seam delegates to `src/services/demo/verificationDemo.ts` (fixtures + `gloki_demo_verification` localStorage + timers). Vouches the user holds persist on the Digital Agent store (`vouchedBy` + new `vouchMeta`); everything else is demo state. Routes nest inside `IdentityView`'s wildcard (D9); no `App.tsx` route change — only the `ToastProvider` mount.

**Tech Stack:** React 19 + TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax`), Vite 7, SCSS Modules with `src/styles/variables.scss` tokens, react-router-dom 7, lucide-react, the hand-rolled i18n (`useT`, fr/sw overlays).

**Spec:** `docs/superpowers/specs/2026-09-06-s36-verification-w1-design.md` (this wave) over `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3 and the decision record (D8, D9, F9, F10). Read both before any task.

## Global Constraints

- **No test framework.** Every task's verification is: `npx --no-install tsc -b --noEmit` silent · `npm run build` clean · `sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh` → `ALL GATES CLEAN` · (tasks that touch strings) `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` → `RESULT: PARITY OK`. Implementers verify by build only; **never touch the preview browser** — the controller drives the one shared preview after each task.
- **Slow external USB drive.** Small sequential reads, targeted `sed -n`/`grep -n` with explicit paths; never scan `node_modules/` or `dist/`. Quote the repo path: `cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"`. Ignore `._*` files.
- **Seam rule.** Components read/write verification data only via `src/services/verification.ts`. No component imports `src/services/demo/verificationDemo.ts` or the fixture (one sanctioned `*.demo.tsx` sidecar in Task 9). No `fetch`/`EventSource` anywhere new.
- **Token law.** No raw hex, raw `rgba(`, ad-hoc px/rem in `*.module.scss` — tokens from `src/styles/variables.scss` only (44px touch floors and 1–2px hairlines are the sanctioned raw values). Dark mode ONLY via `@include dark { … }`; any dark block that re-themes a background re-declares its text colour. `$gray-400` never as text colour; captions use `$gray-500`. "If it's not interactive, it's not blue."
- **i18n ritual.** Every user-facing string is `t('flat.key', 'English default')` inline; the key is added to BOTH `src/i18n/fr.ts` AND `src/i18n/sw.ts` in the same commit (append inside the object, before the closing `};`), `{var}` tokens preserved verbatim. Do NOT add keys to `en.ts`.
- **One `<h1>` per page** — it's the `AppHeader` `title`; in-content headings are `<h2>`/`<h3>`. Touch targets ≥ 44×44px. 360px layout must hold.
- **Commits:** conventional style with the session tag — `feat(s36): …`, `docs(s36): …`, `chore(s36): …`. Commit locally per task. **Never `git push`** (Eston's explicit gate). Never touch `main`.
- **`DEMO_VERSION`** bumps exactly once (Task 4, with the fixture). No other task touches it.
- **Wire names / FOR_OURI:** the seam's contract-method names (`get_vouches`, `request_vouch`, `vouch`, `decline_vouch`) are documented in `docs/FOR_OURI_seam.md` in the same commit as the seam (Task 4).

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/services/trustModel.ts` | + `VouchMethod`, `VouchMeta` (pure types) | 1 |
| `src/components/identity/agent/digitalAgentStore.ts` | + `vouchMeta?` on `DigitalAgent` | 1 |
| `src/services/trust.ts` | `addUserVouch(pk, meta?)` | 1 |
| `src/hooks/useCommunityTrust.ts` | E1 — current user's count = all held vouches | 1 |
| `src/components/shared/ProgressBar.tsx` + `.module.scss` | `segments` prop | 2 |
| `src/components/shared/MemberCard.tsx` + `.module.scss` | new kit row | 2 |
| `src/components/shared/Toast.tsx` + `.module.scss` | `ToastProvider`, `useToast` | 3 |
| `src/components/shared/index.ts` | barrel exports | 2, 3 |
| `src/App.tsx` | mount `ToastProvider` | 3 |
| `src/services/verificationModel.ts` | seam types | 4 |
| `src/services/demo/fixtures/verification.ts` | 30 members, seeded requests, scenarios' data | 4 |
| `src/services/demo/verificationDemo.ts` | demo implementation + scenarios | 4 |
| `src/services/verification.ts` | the seam | 4 |
| `src/services/demo/mockApi.ts` | `DEMO_VERSION` → v19 | 4 |
| `docs/FOR_OURI_seam.md` | S36 addendum | 4 |
| `src/hooks/useVerification.ts` | `useVerification`, `useVerifiedMembers` | 5 |
| `src/pages/IdentityView.tsx` | routes + titles + back | 5 |
| `src/components/identity/verification/VerificationHub.tsx` + `VerificationHub.module.scss` | hub + confetti | 5 |
| `src/components/identity/verification/PathwayCards.tsx` | two pathway cards | 5 |
| `src/components/identity/verification/ApprovalHistory.tsx` | approvals list | 5 |
| `src/components/identity/verification/VerificationPages.module.scss` | shared page/list/form styles | 5 |
| `src/components/identity/verification/RequestPage.tsx` | request a vouch | 6 |
| `src/components/identity/verification/ApprovePage.tsx` | approve/decline | 7 |
| `src/components/identity/verification/InvitePage.tsx` | invite / request invitation | 8 |
| `src/components/community/StageGate.tsx`, `IdentityTrust.tsx` | repoint to the hub | 9 |
| `src/components/identity/verification/VerificationDemoState.demo.tsx` | dev-only scenario dialog | 9 |
| `src/components/identity/HomepageMenu.tsx` | dev-only menu entry | 9 |
| `src/i18n/fr.ts`, `src/i18n/sw.ts` | keys per task | 5–9 |
| `docs/i18n-native-review-candidates.md`, `MASTER_TODO.md`, memory, next prompt | closeout | 10 (controller) |

---

### Task 1: Vouch metadata on the Digital Agent + platform-wide count (E1)

**Files:**
- Modify: `src/services/trustModel.ts` (append after `PipelineStage`, line ~11)
- Modify: `src/components/identity/agent/digitalAgentStore.ts:11-20` (the `DigitalAgent` interface)
- Modify: `src/services/trust.ts:52-61` (`addUserVouch`)
- Modify: `src/hooks/useCommunityTrust.ts:59-62` (`currentUserVouchCount`)

**Interfaces:**
- Produces: `VouchMethod`, `VouchMeta` (from `src/services/trustModel.ts`, re-exported by `src/services/trust.ts` via its `export *`); `DigitalAgent.vouchMeta?: Record<string, VouchMeta>`; `addUserVouch(voucherPk: string, meta?: VouchMeta): void`.

- [ ] **Step 1: Add the pure types to `trustModel.ts`**

Insert directly after the `PipelineStage` type line:

```ts
/** How a vouch was given (S36 — Prompt 2). `direct` = in person / QR / a text request. */
export type VouchMethod = 'direct' | 'call' | 'invitation' | 'daily';
export interface VouchMeta {
  method: VouchMethod;
  /** ms epoch */
  at: number;
}
```

- [ ] **Step 2: Extend the `DigitalAgent` interface**

In `digitalAgentStore.ts` add the import at the top (after the header comment) and the field after `vouchedBy`:

```ts
import type { VouchMeta } from '../../../services/trustModel';
```

```ts
  vouchedBy: string[]; // publicKeys; length = "vouched by N"
  /**
   * S36 — how/when each key in `vouchedBy` vouched. Optional and sparse: agents
   * created before S36 and the onboarding's two seeded vouchers have no entry —
   * readers default those to direct/createdAt (invitation for `invitedBy`).
   */
  vouchMeta?: Record<string, VouchMeta>;
```

- [ ] **Step 3: Extend `addUserVouch`**

Replace the whole function in `trust.ts`:

```ts
/**
 * The current user's own vouches live in the Digital Agent store (localStorage,
 * reactive), extending the onboarding pattern. Dedup append. Used by the QR scan
 * and the verification request flow (S36). `meta` records how the vouch was
 * given; callers that don't know (QR scan) get `direct` now.
 */
export function addUserVouch(voucherPk: string, meta?: VouchMeta): void {
  const agent = getAgent();
  const current = agent?.vouchedBy ?? [];
  if (!voucherPk || current.includes(voucherPk)) return;
  const entry: VouchMeta = meta ?? { method: 'direct', at: Date.now() };
  saveAgent({
    vouchedBy: [...current, voucherPk],
    vouchMeta: { ...(agent?.vouchMeta ?? {}), [voucherPk]: entry },
  });
}
```

and extend the existing import from `./trustModel` to include the type:

```ts
import {
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
  type VouchMeta,
} from './trustModel';
```

- [ ] **Step 4: Lift the membership filter on the current user's count (E1)**

In `useCommunityTrust.ts` replace

```ts
  const currentUserVouchCount = useMemo(
    () => (agent?.vouchedBy ?? []).filter((v) => memberSet.has(v)).length,
    [agent, memberSet],
  );
```

with

```ts
  // S36 / D8 (Eston, 2026-09-06): verification is platform-wide on the Digital
  // Agent, so the current user's count is every vouch the agent holds — from
  // anyone, not only this community's members. Persona counts stay
  // per-community (the community contract's `get_vouches`).
  const currentUserVouchCount = agent?.vouchedBy?.length ?? 0;
```

`memberSet` is still used by `isMember`; `useMemo` stays imported for it.

- [ ] **Step 5: Verify**

```bash
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
npx --no-install tsc -b --noEmit && npm run build 2>&1 | tail -3 && sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh
```
Expected: tsc silent; build "✓ built"; `ALL GATES CLEAN`.

- [ ] **Step 6: Commit**

```bash
git add src/services/trustModel.ts src/components/identity/agent/digitalAgentStore.ts src/services/trust.ts src/hooks/useCommunityTrust.ts
git commit -m "feat(s36): vouch metadata on the Digital Agent; platform-wide own-vouch count (D8, E1)"
```

---

### Task 2: Kit — `ProgressBar segments` + `MemberCard`

**Files:**
- Modify: `src/components/shared/ProgressBar.tsx`, `src/components/shared/ProgressBar.module.scss`
- Create: `src/components/shared/MemberCard.tsx`, `src/components/shared/MemberCard.module.scss`
- Modify: `src/components/shared/index.ts` (after the `ProgressBar` export block)

**Interfaces:**
- Produces: `ProgressBar` prop `segments?: number`; `MemberCard` props `{ name: string; countryCode?: string; online?: boolean; onlineLabel: string; offlineLabel: string; trustState?: TrustState; meta?: string; action?: React.ReactNode; as?: 'li' | 'div'; className?: string }`.

- [ ] **Step 1: `ProgressBar` — add the prop and the segmented branch**

Add to `ProgressBarProps` after `fillPct`:

```ts
  /**
   * Render N discrete cells instead of a continuous fill (S36 — the "{X} of 4
   * approvals" bar). The first round(value / max × segments) cells fill in the
   * variant colour; ARIA is identical to the continuous bar.
   */
  segments?: number;
```

Destructure `segments` in the component signature and replace the body after `const pct = …` with:

```tsx
  if (segments && segments > 0) {
    const filled = Math.max(0, Math.min(segments, Math.round((pct / 100) * segments)));
    return (
      <div
        className={clsx(styles.segmented, styles[size], className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={label}
      >
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className={clsx(styles.segment, i < filled && styles.segmentOn, i < filled && styles[variant])} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={clsx(styles.track, styles[size], className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <span className={clsx(styles.fill, styles[variant])} style={{ width: `${pct}%` }} />
    </div>
  );
```

Append to `ProgressBar.module.scss` (before the `@media (prefers-reduced-motion…)` block):

```scss
// Segmented variant (S36): N cells on the same track tokens.
.segmented {
  display: flex;
  gap: $spacing-xs;
}

.segment {
  flex: 1;
  height: 100%;
  border-radius: $radius-full;
  background: $gray-100;
  transition: background $transition-base ease;

  @include dark {
    background: $dark-border;
  }
}

// Compound selectors so the filled colour outranks the dark track rule.
.segmentOn.primary {
  background: $primary;
}

.segmentOn.success {
  background: $success;
}

.segmentOn.neutral {
  background: $gray-500;
}
```

and add `.segment` to the reduced-motion block: `.fill, .segment { transition: none; }`.

- [ ] **Step 2: Create `MemberCard.tsx`**

```tsx
import React from 'react';
import clsx from 'clsx';
import UserIdentity from './UserIdentity';
import type { TrustState } from '../../services/trustModel';
import styles from './MemberCard.module.scss';

export interface MemberCardProps {
  /** Display name, already composed. */
  name: string;
  /** ISO 3166-1 alpha-2. */
  countryCode?: string;
  online?: boolean;
  /** Translated accessible labels for the presence dot — never colour alone. */
  onlineLabel: string;
  offlineLabel: string;
  trustState?: TrustState;
  /** Small caption under the identity (e.g. "asked you to vouch · 2h ago"). */
  meta?: string;
  /** Trailing action slot — a <Button size="sm"> or a <Badge>. */
  action?: React.ReactNode;
  as?: 'li' | 'div';
  className?: string;
}

/**
 * Canonical member row for verification lists (S36): presence dot ·
 * UserIdentity (flag + name + verified shield) · optional caption · action slot.
 * 44px minimum height; the row itself is not interactive — the action is.
 */
const MemberCard: React.FC<MemberCardProps> = ({
  name,
  countryCode,
  online = false,
  onlineLabel,
  offlineLabel,
  trustState,
  meta,
  action,
  as = 'div',
  className,
}) => {
  const Tag = as as React.ElementType;
  return (
    <Tag className={clsx(styles.row, className)}>
      <span
        className={clsx(styles.dot, online ? styles.online : styles.offline)}
        role="img"
        aria-label={online ? onlineLabel : offlineLabel}
      />
      <div className={styles.body}>
        <UserIdentity name={name} countryCode={countryCode} trustState={trustState} size="md" />
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </Tag>
  );
};

export default MemberCard;
```

- [ ] **Step 3: Create `MemberCard.module.scss`**

```scss
@use '../../styles/variables' as *;

.row {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  min-height: 44px;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $gray-100;
  list-style: none;

  &:last-child {
    border-bottom: none;
  }

  @include dark {
    border-bottom-color: $dark-border;
  }
}

.dot {
  flex-shrink: 0;
  width: $spacing-sm;
  height: $spacing-sm;
  border-radius: $radius-full;
}

.online {
  background: $success;
}

.offline {
  background: $gray-300;

  @include dark {
    background: $dark-border;
  }
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.meta {
  font-size: $text-xs;
  color: $gray-500;

  @include dark {
    color: $dark-text-secondary;
  }
}

.action {
  flex-shrink: 0;
}
```

- [ ] **Step 4: Barrel export**

In `src/components/shared/index.ts`, after the `ProgressBar` export lines add:

```ts
export { default as MemberCard } from './MemberCard';
export type { MemberCardProps } from './MemberCard';
```

- [ ] **Step 5: Verify** — same three commands as Task 1 Step 5. Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/ProgressBar.tsx src/components/shared/ProgressBar.module.scss src/components/shared/MemberCard.tsx src/components/shared/MemberCard.module.scss src/components/shared/index.ts
git commit -m "feat(s36): kit — ProgressBar segments prop, MemberCard row (spec §3.2)"
```

---

### Task 3: Kit — `Toast` (provider + hook) mounted once in `App.tsx`

**Files:**
- Create: `src/components/shared/Toast.tsx`, `src/components/shared/Toast.module.scss`
- Modify: `src/components/shared/index.ts`
- Modify: `src/App.tsx` (the JSX inside `<Router basename={getBasename()}>`, lines ~114–133)

**Interfaces:**
- Produces: `ToastProvider` (wraps the app), `useToast(): { show: (o: ToastOptions) => void }`, `ToastOptions = { message: string; tone?: 'info' | 'success' | 'error'; durationMs?: number }`.

- [ ] **Step 1: Create `Toast.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './Toast.module.scss';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss after this many ms. Default 4000. */
  durationMs?: number;
}

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (options: ToastOptions) => void;
}

const MAX_STACK = 3;
const DEFAULT_DURATION = 4000;

const ToastContext = createContext<ToastApi | null>(null);

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  error: <AlertCircle size={18} aria-hidden />,
};

/**
 * The app's ONE transient-message live region (S36, spec §3.2). Mount once in
 * App.tsx. Polite `role="status"` region that is always in the DOM (so a new
 * toast is announced), a stack of at most three, 4 s auto-dismiss, a ≥44px
 * dismiss control per toast, Escape inside the region dismisses all. Sits
 * above the StageFooter and below the modal layer.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback(
    ({ message, tone = 'info', durationMs = DEFAULT_DURATION }: ToastOptions) => {
      const id = nextId.current++;
      setItems((prev) => {
        const next = [...prev, { id, message, tone }];
        // Oldest falls off the stack; its timer is cleared to avoid a stray removal.
        while (next.length > MAX_STACK) {
          const dropped = next.shift();
          if (dropped) {
            const timer = timers.current.get(dropped.id);
            if (timer) clearTimeout(timer);
            timers.current.delete(dropped.id);
          }
        }
        return next;
      });
      timers.current.set(id, setTimeout(() => dismiss(id), durationMs));
    },
    [dismiss],
  );

  // Clear every pending timer on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') items.forEach((i) => dismiss(i.id));
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" onKeyDown={handleKeyDown}>
        {items.map((item) => (
          <div key={item.id} className={clsx(styles.toast, styles[item.tone])}>
            <span className={styles.icon}>{TONE_ICON[item.tone]}</span>
            <span className={styles.message}>{item.message}</span>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => dismiss(item.id)}
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const NOOP_API: ToastApi = { show: () => {} };

/** Show a transient message. Safe to call without a provider (no-op). */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP_API;
}

export default ToastProvider;
```

- [ ] **Step 2: Create `Toast.module.scss`**

```scss
@use '../../styles/variables' as *;

.region {
  position: fixed;
  left: 0;
  right: 0;
  bottom: $footer-clearance;
  z-index: 200; // above the sticky header (100), below the modal layer (1000)
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: $spacing-sm;
  pointer-events: none;
  @include page-column;
}

.toast {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  font-size: $text-sm;
  pointer-events: auto;
  animation: toastIn $transition-slow ease;
}

.icon {
  display: flex;
  flex-shrink: 0;
}

.message {
  flex: 1;
  min-width: 0;
}

.dismiss {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;

  // ≥44px hit area without enlarging the icon (WCAG 2.5.5).
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

.info {
  background: $info-surface;
  color: $info-on-surface;
}

.success {
  background: $success-surface;
  color: $success-on-surface;
}

.error {
  background: $error-surface;
  color: $error-on-surface;
}

@include dark {
  .info {
    background: $info-surface-dark;
    color: $dark-text;
  }

  .success {
    background: $success-surface-dark;
    color: $dark-text;
  }

  .error {
    background: $error-surface-dark;
    color: $dark-text;
  }
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY($spacing-sm);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}
```

- [ ] **Step 3: Barrel export** — in `index.ts` after the `MemberCard` lines:

```ts
export { default as ToastProvider, useToast } from './Toast';
export type { ToastOptions, ToastTone } from './Toast';
```

- [ ] **Step 4: Mount the provider in `App.tsx`**

Read `src/App.tsx` lines 100–140 first. Add the import next to the `OfflineBanner` import:

```ts
import { ToastProvider } from './components/shared/Toast';
```

Then wrap everything that is currently inside `<Router basename={getBasename()}>` — the `<OfflineBanner />` and the element that holds `<Routes>` — in `<ToastProvider> … </ToastProvider>` so the region renders once, under the router. Do not touch the route list.

- [ ] **Step 5: Verify** — the three commands. Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/Toast.tsx src/components/shared/Toast.module.scss src/components/shared/index.ts src/App.tsx
git commit -m "feat(s36): kit — Toast provider + useToast, one polite live region mounted in App (spec §3.2)"
```

---

### Task 4: Seam + demo layer + fixtures + `DEMO_VERSION` + FOR_OURI (one commit)

**Files:**
- Create: `src/services/verificationModel.ts`
- Create: `src/services/demo/fixtures/verification.ts`
- Create: `src/services/demo/verificationDemo.ts`
- Create: `src/services/verification.ts`
- Modify: `src/services/demo/mockApi.ts:18` (`DEMO_VERSION`)
- Modify: `docs/FOR_OURI_seam.md` (append a section after the S35 addendum)

**Interfaces:**
- Consumes: `addUserVouch(pk, meta)`, `VouchMeta`/`VouchMethod` (Task 1); `getAgent`/`saveAgent`; `PERSONAS` (`fixtures/identity.ts`).
- Produces (from `src/services/verification.ts`): types `VerificationCtx`, `Approval`, `VouchRequest`, `VouchRequestStatus`, `VerificationState`, `MemberSummary`, `InvitationDraft`, `VouchMethod`; functions `getVerificationState`, `listVerifiedMembers`, `requestVouch`, `respondToRequest`, `sendInvitation`, `requestInvitation`. From `verificationDemo.ts` (demo-only): `DemoScenario`, `DEMO_SCENARIOS`, `applyDemoScenario(scenario, publicKey)`.

- [ ] **Step 1: Create `src/services/verificationModel.ts`**

```ts
// Pure types for the verification seam (S36). Dependency-free so the demo
// layer, its fixtures and the seam can all import them without a cycle.
import type { VouchMethod, VouchMeta } from './trustModel';

export type { VouchMethod, VouchMeta };

/** Verification is platform-wide on the Digital Agent (D8): no communityId. */
export interface VerificationCtx {
  serverUrl: string;
  publicKey: string;
}

/** A vouch the current user HOLDS. */
export interface Approval {
  id: string;
  approver: string;
  method: VouchMethod;
  at: number;
}

export type VouchRequestStatus = 'pending' | 'approved' | 'declined';

export interface VouchRequest {
  id: string;
  requester: string;
  approver: string;
  at: number;
  status: VouchRequestStatus;
}

export interface VerificationState {
  approvals: Approval[];
  /** Incoming requests waiting on the user. Empty until the user is verified. */
  pending: VouchRequest[];
  /** Requests the user has made, any status. */
  sent: VouchRequest[];
  /** Member keys the user has asked for an invitation. */
  invitationRequests: string[];
}

export interface MemberSummary {
  publicKey: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  online: boolean;
}

export interface InvitationDraft {
  name: string;
  email: string;
  vouch: boolean;
}
```

- [ ] **Step 2: Create `src/services/demo/fixtures/verification.ts`**

```ts
// Verification fixtures (S36 — Prompt 2 Wave 1).
//
// The 30 "verified members" a newcomer can ask to vouch = the 16 PERSONAS (who
// are members of every demo community, so their vouches unlock community-gated
// stages) + the 14 verification-only members below, who are NOT community
// members (E1: no member-count / turnout / 50%-threshold inflation).
//
// E2 (Eston, 2026-09-06): request outcomes are deterministic — `declines: true`
// members never respond; everyone else approves after the 2–5 s demo delay.
// The four decliners are all among the 14, so every persona approves and the
// community-gate journey (2 → 4 → Vote unlocks) is always completable.
import { PERSONAS } from './identity';
import type { MemberSummary } from '../../verificationModel';

export interface VerificationMember {
  publicKey: string;
  firstName: string;
  lastName: string;
  country: string; // ISO 3166-1 alpha-2
  online: boolean;
  declines?: boolean;
}

export const VERIFICATION_MEMBERS: VerificationMember[] = [
  { publicKey: 'demo-verif-ke-wanjiru', firstName: 'Wanjiru', lastName: 'Kamau', country: 'KE', online: true },
  { publicKey: 'demo-verif-mw-chikondi', firstName: 'Chikondi', lastName: 'Banda', country: 'MW', online: false },
  { publicKey: 'demo-verif-sn-aminata', firstName: 'Aminata', lastName: 'Diop', country: 'SN', online: true },
  { publicKey: 'demo-verif-vn-linh', firstName: 'Linh', lastName: 'Nguyen', country: 'VN', online: true },
  { publicKey: 'demo-verif-bd-rahim', firstName: 'Rahim', lastName: 'Chowdhury', country: 'BD', online: false },
  { publicKey: 'demo-verif-np-sita', firstName: 'Sita', lastName: 'Gurung', country: 'NP', online: false, declines: true },
  { publicKey: 'demo-verif-es-carmen', firstName: 'Carmen', lastName: 'García', country: 'ES', online: true },
  { publicKey: 'demo-verif-ua-oksana', firstName: 'Oksana', lastName: 'Melnyk', country: 'UA', online: false, declines: true },
  { publicKey: 'demo-verif-co-camila', firstName: 'Camila', lastName: 'Rojas', country: 'CO', online: true },
  { publicKey: 'demo-verif-pe-mateo', firstName: 'Mateo', lastName: 'Quispe', country: 'PE', online: false, declines: true },
  { publicKey: 'demo-verif-ar-valentina', firstName: 'Valentina', lastName: 'López', country: 'AR', online: true },
  { publicKey: 'demo-verif-ca-noah', firstName: 'Noah', lastName: 'Tremblay', country: 'CA', online: false },
  { publicKey: 'demo-verif-us-jordan', firstName: 'Jordan', lastName: 'Reyes', country: 'US', online: true, declines: true },
  { publicKey: 'demo-verif-fj-sereana', firstName: 'Sereana', lastName: 'Naidu', country: 'FJ', online: true },
];

/** Deterministic presence for the personas (the identity fixture has no presence field). */
const PERSONA_ONLINE = new Set([
  'demo-user-in-priya', 'demo-user-ng-amina', 'demo-user-gh-kwame', 'demo-user-de-anika',
  'demo-user-kr-jiwoo', 'demo-user-za-thabo', 'demo-user-ph-maria',
]);

/** The 30 members, personas first. */
export function allVerificationMembers(): MemberSummary[] {
  const personas: MemberSummary[] = PERSONAS.map((p) => ({
    publicKey: p.publicKey,
    name: p.displayName ?? `${p.firstName} ${p.lastName}`,
    country: p.country,
    online: PERSONA_ONLINE.has(p.publicKey),
  }));
  const extra: MemberSummary[] = VERIFICATION_MEMBERS.map((m) => ({
    publicKey: m.publicKey,
    name: `${m.firstName} ${m.lastName}`,
    country: m.country,
    online: m.online,
  }));
  return [...personas, ...extra];
}

export function findVerificationMember(publicKey: string): MemberSummary | undefined {
  return allVerificationMembers().find((m) => m.publicKey === publicKey);
}

export function memberDeclines(publicKey: string): boolean {
  return VERIFICATION_MEMBERS.some((m) => m.publicKey === publicKey && m.declines === true);
}

/** Members who asked the demo user to vouch (two personas, two new members). */
export const SEEDED_INCOMING_REQUESTERS = [
  'demo-verif-ke-wanjiru',
  'demo-user-pl-marta',
  'demo-verif-vn-linh',
  'demo-user-ph-maria',
];
```

- [ ] **Step 3: Create `src/services/demo/verificationDemo.ts`**

```ts
// Demo implementation behind src/services/verification.ts (S36).
//
// State lives under ONE localStorage key with the `gloki_demo` prefix, so a
// DEMO_VERSION bump (mockApi.ts clearAllDemoState) wipes it with the rest.
// Vouches the user HOLDS are not here — they persist on the Digital Agent
// store (`vouchedBy` + `vouchMeta`), exactly as the QR scan writes them.
//
// FOR OURI: this whole module is replaced by Digital Agent contract calls
// (`get_vouches`, `request_vouch`, `vouch`, `decline_vouch`) — see
// docs/FOR_OURI_seam.md, S36 addendum. Nothing outside src/services imports it
// except the dev-only scenario dialog (VerificationDemoState.demo.tsx).
import { getAgent, saveAgent } from '../../components/identity/agent/digitalAgentStore';
import { addUserVouch } from '../trust';
import { VERIFIED_THRESHOLD } from '../trustModel';
import { PERSONAS } from './fixtures/identity';
import {
  allVerificationMembers,
  memberDeclines,
  SEEDED_INCOMING_REQUESTERS,
} from './fixtures/verification';
import type {
  Approval,
  InvitationDraft,
  MemberSummary,
  VerificationState,
  VouchMeta,
  VouchRequest,
  VouchRequestStatus,
} from '../verificationModel';

const KEY = 'gloki_demo_verification';
const HOUR = 3_600_000;

interface DemoState {
  seeded: boolean;
  sent: VouchRequest[];
  incoming: VouchRequest[];
  /** Vouches the user has GIVEN (requester key → meta). Display-only in W1. */
  given: Record<string, VouchMeta>;
  invitations: (InvitationDraft & { at: number })[];
  invitationRequests: string[];
}

const EMPTY: DemoState = {
  seeded: false,
  sent: [],
  incoming: [],
  given: {},
  invitations: [],
  invitationRequests: [],
};

function read(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<DemoState>) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: DemoState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[VerificationDemo] Failed to persist state:', err);
  }
}

const newId = (): string => `vr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
/** The spec's simulated response window: 2–5 s. Random delay, deterministic outcome (E2). */
const responseDelay = (): number => 2000 + Math.floor(Math.random() * 3000);

function seededIncoming(approver: string, now: number): VouchRequest[] {
  return SEEDED_INCOMING_REQUESTERS.map((requester, i) => ({
    id: `vr-seed-in-${i}`,
    requester,
    approver,
    at: now - (i + 1) * 5 * HOUR,
    status: 'pending' as const,
  }));
}

function ensureSeeded(publicKey: string): DemoState {
  const state = read();
  if (state.seeded) return state;
  const next: DemoState = { ...state, seeded: true, incoming: seededIncoming(publicKey, Date.now()) };
  write(next);
  return next;
}

export async function demoGetState(publicKey: string): Promise<VerificationState> {
  const state = ensureSeeded(publicKey);
  const agent = getAgent();
  const vouchedBy = agent?.vouchedBy ?? [];
  const meta = agent?.vouchMeta ?? {};
  const approvals: Approval[] = vouchedBy.map((approver) => {
    const m: VouchMeta = meta[approver] ?? {
      method: approver === agent?.invitedBy ? 'invitation' : 'direct',
      at: agent?.createdAt ?? 0,
    };
    return { id: `ap-${approver}`, approver, method: m.method, at: m.at };
  });
  // Requests only reach verified members: hidden until the user crosses the threshold.
  const verified = vouchedBy.length >= VERIFIED_THRESHOLD;
  return {
    approvals,
    pending: verified ? state.incoming.filter((r) => r.status === 'pending') : [],
    sent: state.sent,
    invitationRequests: state.invitationRequests,
  };
}

export async function demoListMembers(query?: string): Promise<MemberSummary[]> {
  await wait(50);
  const all = allVerificationMembers();
  const q = query?.trim().toLowerCase();
  return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
}

/**
 * Writes the pending request synchronously (before the first await) so a
 * re-fetch right after the call shows "Requested", then settles after 2–5 s.
 */
export async function demoRequestVouch(publicKey: string, approverKey: string): Promise<VouchRequest> {
  const state = ensureSeeded(publicKey);
  const request: VouchRequest = { id: newId(), requester: publicKey, approver: approverKey, at: Date.now(), status: 'pending' };
  write({ ...state, sent: [...state.sent.filter((r) => r.approver !== approverKey), request] });
  await wait(responseDelay());
  const status: VouchRequestStatus = memberDeclines(approverKey) ? 'declined' : 'approved';
  const settled: VouchRequest = { ...request, status, at: Date.now() };
  const current = read();
  write({ ...current, sent: current.sent.map((r) => (r.id === request.id ? settled : r)) });
  if (status === 'approved') addUserVouch(approverKey, { method: 'direct', at: settled.at });
  return settled;
}

export async function demoRespondToRequest(requestId: string, approve: boolean): Promise<void> {
  await wait(300);
  const state = read();
  const target = state.incoming.find((r) => r.id === requestId);
  if (!target) return;
  const status: VouchRequestStatus = approve ? 'approved' : 'declined';
  write({
    ...state,
    incoming: state.incoming.map((r) => (r.id === requestId ? { ...r, status } : r)),
    given: approve ? { ...state.given, [target.requester]: { method: 'direct', at: Date.now() } } : state.given,
  });
}

export async function demoSendInvitation(publicKey: string, draft: InvitationDraft): Promise<void> {
  await wait(300);
  const state = ensureSeeded(publicKey);
  write({ ...state, invitations: [...state.invitations, { ...draft, at: Date.now() }] });
}

export async function demoRequestInvitation(publicKey: string, memberKey: string): Promise<void> {
  await wait(300);
  const state = ensureSeeded(publicKey);
  if (state.invitationRequests.includes(memberKey)) return;
  write({ ...state, invitationRequests: [...state.invitationRequests, memberKey] });
}

// ── Demo scenarios (dev-only state switcher, spec §3.1) ─────────────────────

export type DemoScenario = 'unverified-0' | 'partial-2' | 'verified-4' | 'member-view';
export const DEMO_SCENARIOS: DemoScenario[] = ['unverified-0', 'partial-2', 'verified-4', 'member-view'];

const SCENARIO_VOUCHES: Record<DemoScenario, number> = {
  'unverified-0': 0,
  'partial-2': 2,
  'verified-4': 4,
  'member-view': 4,
};

/** Rewrites the agent's vouches + this module's state. The caller reloads. */
export function applyDemoScenario(scenario: DemoScenario, publicKey: string): void {
  const n = SCENARIO_VOUCHES[scenario];
  const now = Date.now();
  const vouchers = PERSONAS.slice(0, n).map((p) => p.publicKey);
  const vouchMeta: Record<string, VouchMeta> = Object.fromEntries(
    vouchers.map((pk, i): [string, VouchMeta] => [pk, { method: i === 0 ? 'invitation' : 'direct', at: now - (n - i) * 24 * HOUR }]),
  );
  saveAgent({ vouchedBy: vouchers, vouchMeta, invitedBy: vouchers[0] });

  const base: DemoState = { ...EMPTY, seeded: true, incoming: seededIncoming(publicKey, now) };
  if (scenario === 'verified-4') base.incoming = [];
  if (scenario === 'member-view') {
    base.sent = [{ id: 'vr-seed-declined', requester: publicKey, approver: 'demo-verif-np-sita', at: now - 2 * HOUR, status: 'declined' }];
    base.given = { 'demo-user-pl-marta': { method: 'direct', at: now - 30 * HOUR } };
  }
  write(base);
}
```

- [ ] **Step 4: Create the seam `src/services/verification.ts`**

```ts
// Verification seam (S36 — Prompt 2). THE ONLY import components use for
// verification data. Every function delegates to the demo layer today;
// FOR OURI swaps these bodies for contractRead/contractWrite against the
// Digital Agent contract (get_vouches / request_vouch / vouch / decline_vouch —
// docs/FOR_OURI_seam.md, S36 addendum) without touching a component.
import {
  demoGetState,
  demoListMembers,
  demoRequestVouch,
  demoRespondToRequest,
  demoSendInvitation,
  demoRequestInvitation,
} from './demo/verificationDemo';
import type {
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  VouchRequest,
} from './verificationModel';

export type {
  Approval,
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  VouchMeta,
  VouchMethod,
  VouchRequest,
  VouchRequestStatus,
} from './verificationModel';

/** Vouches held, requests waiting on the user (verified users only), requests sent. */
export function getVerificationState(ctx: VerificationCtx): Promise<VerificationState> {
  return demoGetState(ctx.publicKey);
}

/** The verified members a user can ask; `query` filters by name. */
export function listVerifiedMembers(_ctx: VerificationCtx, query?: string): Promise<MemberSummary[]> {
  return demoListMembers(query);
}

/** Records a pending request at once; resolves 2–5 s later with the settled request. */
export function requestVouch(ctx: VerificationCtx, approverKey: string): Promise<VouchRequest> {
  return demoRequestVouch(ctx.publicKey, approverKey);
}

export function respondToRequest(_ctx: VerificationCtx, requestId: string, approve: boolean): Promise<void> {
  return demoRespondToRequest(requestId, approve);
}

/** Off-platform (email) — the demo records it locally and sends nothing. */
export function sendInvitation(ctx: VerificationCtx, draft: InvitationDraft): Promise<void> {
  return demoSendInvitation(ctx.publicKey, draft);
}

export function requestInvitation(ctx: VerificationCtx, memberKey: string): Promise<void> {
  return demoRequestInvitation(ctx.publicKey, memberKey);
}
```

- [ ] **Step 5: Bump `DEMO_VERSION`** — in `src/services/demo/mockApi.ts` change `'global-v18'` → `'global-v19'`.

- [ ] **Step 6: Append the FOR_OURI section** at the end of `docs/FOR_OURI_seam.md` (after the S35 addendum's last bullet):

```markdown

### S36 addendum — Community verification, Wave 1 (`src/services/verification.ts`)

Verification is **platform-wide on the Digital Agent** (S34 D8), not per community. The UI's seam is
`src/services/verification.ts`; today it delegates to a localStorage demo module
(`src/services/demo/verificationDemo.ts`). Neither `digital_agent_contract.py` nor
`gloki_engage_community_contract.py` has these methods yet — they are what the real layer needs:

- **`request_vouch(public_key)`** — the caller asks `public_key` to vouch for them. Creates a pending
  request addressed to `public_key`. UI: `requestVouch(ctx, approverKey)`.
- **`vouch(public_key, method)`** — the caller vouches for `public_key`. `method` is one of
  `direct | call | invitation | daily` (Wave 1 only ever sends `direct`; `call`/`daily` arrive with
  Waves 2–3). Settles any pending request from `public_key` to the caller as approved. UI:
  `respondToRequest(ctx, requestId, true)`. **The real contract must record the vouch as BY THE CALLER
  only — no key may vouch on another's behalf.** One vouch per (voucher, vouchee) pair; re-vouching is
  a no-op.
- **`decline_vouch(public_key)`** — settles the pending request from `public_key` as declined. UI:
  `respondToRequest(ctx, requestId, false)`.
- **`get_vouches()`** (read) → `{ approvals: [{ approver, method, at }], pending: [{ id, requester, at }],
  sent: [{ id, approver, at, status }] }` — vouches the caller holds, requests waiting on the caller, and
  the caller's own requests. UI: `getVerificationState(ctx)`. The UI derives Verified as
  `approvals.length >= 4` (`VERIFIED_THRESHOLD`, locked at Batch 4). Only verified members should
  receive requests; the demo hides `pending` below the threshold — the contract may enforce it.
- **Invitations** (`sendInvitation`, `requestInvitation`) are off-platform (email) and need no contract
  method; the demo records them locally and sends nothing.
- **Demo-only, not for production:** the four simulated outcomes (`declines` flags in
  `src/services/demo/fixtures/verification.ts`) and the dev scenario switcher.
```

- [ ] **Step 7: Verify** — the three commands. Expected: clean (`verification.ts` is unused by components yet; unused *exports* are fine under `noUnusedLocals`).

- [ ] **Step 8: Commit**

```bash
git add src/services/verificationModel.ts src/services/demo/fixtures/verification.ts src/services/demo/verificationDemo.ts src/services/verification.ts src/services/demo/mockApi.ts docs/FOR_OURI_seam.md
git commit -m "feat(s36): verification seam + demo layer; 30-member fixture, seeded requests, scenarios; DEMO_VERSION v19; FOR_OURI vouch methods (D8, E1, E2)"
```

---

### Task 5: Routes, `useVerification`, the hub (status card, pathways, approval history)

**Files:**
- Create: `src/hooks/useVerification.ts`
- Modify: `src/pages/IdentityView.tsx`
- Create: `src/components/identity/verification/VerificationHub.tsx`, `VerificationHub.module.scss`, `PathwayCards.tsx`, `ApprovalHistory.tsx`, `VerificationPages.module.scss`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: the seam (Task 4), `ProgressBar segments`, `MemberCard` (Task 2), `useToast` (Task 3), `VERIFIED_THRESHOLD`, `resolveTrustState`, `useDigitalAgent`, `formatTimeAgo(t, ms)`, `TrustBadge`, `Card`, `Button`, `Badge`, `EmptyState`, `UserIdentity`.
- Produces: `useVerification(): { ctx: VerificationCtx | null; state: VerificationState | null; refetch: () => Promise<void>; vouchCount: number; trust: TrustState }`; `useVerifiedMembers(): { members: MemberSummary[]; byKey: Map<string, MemberSummary>; query: string; setQuery: (q: string) => void; loading: boolean }`; routes `/identity/verification{,/request,/approve,/invite}`; the shared classes in `VerificationPages.module.scss` (`.page`, `.intro`, `.sectionTitle`, `.list`, `.field`, `.fieldLabel`, `.input`, `.checkboxRow`, `.actions`).

- [ ] **Step 1: Create `src/hooks/useVerification.ts`**

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useDigitalAgent } from '../components/identity/agent/useDigitalAgent';
import { resolveTrustState, type TrustState } from '../services/trustModel';
import {
  getVerificationState,
  listVerifiedMembers,
  type MemberSummary,
  type VerificationCtx,
  type VerificationState,
} from '../services/verification';

export interface UseVerification {
  ctx: VerificationCtx | null;
  state: VerificationState | null;
  refetch: () => Promise<void>;
  /** Vouches the agent holds — platform-wide (D8). */
  vouchCount: number;
  trust: TrustState;
}

/**
 * The user's platform-wide verification state through the seam (S36). The
 * count reads synchronously from the Digital Agent store so the hub never
 * flashes "0 of 4"; the lists arrive from the seam. Re-fetches whenever the
 * agent's vouch list changes (the demo seam emits no write events — every
 * writer also calls `refetch`).
 */
export function useVerification(): UseVerification {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { agent } = useDigitalAgent();
  const [state, setState] = useState<VerificationState | null>(null);

  const ctx = useMemo<VerificationCtx | null>(
    () => (serverUrl && publicKey ? { serverUrl, publicKey } : null),
    [serverUrl, publicKey],
  );

  const refetch = useCallback(async () => {
    if (!ctx) return;
    setState(await getVerificationState(ctx));
  }, [ctx]);

  const vouchCount = agent?.vouchedBy?.length ?? 0;

  useEffect(() => {
    void refetch();
  }, [refetch, vouchCount]);

  return { ctx, state, refetch, vouchCount, trust: resolveTrustState(vouchCount) };
}

export interface UseVerifiedMembers {
  members: MemberSummary[];
  byKey: Map<string, MemberSummary>;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
}

/** The 30 verified members, filtered by a name query; `byKey` always holds all of them. */
export function useVerifiedMembers(): UseVerifiedMembers {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [all, setAll] = useState<MemberSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    listVerifiedMembers({ serverUrl, publicKey }).then((list) => {
      if (cancelled) return;
      setAll(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey]);

  const byKey = useMemo(() => new Map(all.map((m) => [m.publicKey, m])), [all]);
  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
  }, [all, query]);

  return { members, byKey, query, setQuery, loading };
}

export default useVerification;
```

- [ ] **Step 2: Create `VerificationPages.module.scss`** (shared by the four pages)

```scss
@use '../../../styles/variables' as *;

.page {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  padding-top: $spacing-lg;
}

.intro {
  margin: 0;
  font-size: $text-sm;
  line-height: 1.5;
  color: $gray-600;

  @include dark {
    color: $dark-text-secondary;
  }
}

.sectionTitle {
  margin: 0 0 $spacing-sm;
  font-size: $text-lg;
  font-weight: $font-medium;
  color: $gray-900;

  @include dark {
    color: $dark-text;
  }
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
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

  @include dark {
    color: $dark-text;
  }
}

.input {
  height: 44px;
  width: 100%;
  padding: 0 $spacing-md;
  border: 1px solid $gray-200;
  border-radius: $radius-md;
  background: white;
  color: $gray-900;
  font-size: $text-base;
  box-sizing: border-box;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }

  @include dark {
    background: $dark-bg;
    border-color: $dark-border;
    color: $dark-text;
  }
}

.checkboxRow {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-height: 44px;
  font-size: $text-sm;
  color: $gray-700;

  input {
    width: 20px;
    height: 20px;
    accent-color: $primary;
  }

  @include dark {
    color: $dark-text;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
```

- [ ] **Step 3: Create `VerificationHub.module.scss`** (status card + confetti)

```scss
@use '../../../styles/variables' as *;

.statusCard {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.statusHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.statusTitle {
  margin: 0;
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-900;
  @include tabular-nums;

  @include dark {
    color: $dark-text;
  }
}

.statusBody {
  margin: 0;
  font-size: $text-sm;
  line-height: 1.5;
  color: $gray-600;

  @include dark {
    color: $dark-text-secondary;
  }
}

// Row to the approve page — a navigation row, not an action button (DS: list-row buttons stay bespoke).
.requestsRow {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  width: 100%;
  min-height: 44px;
  padding: $spacing-md $spacing-lg;
  border: 1px solid $gray-100;
  border-radius: $radius-lg;
  background: white;
  color: $gray-900;
  font: inherit;
  font-size: $text-sm;
  font-weight: $font-medium;
  text-align: left;
  cursor: pointer;
  box-shadow: $shadow-base;
  transition: box-shadow $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }

  @include dark {
    background: $dark-bg;
    border-color: $dark-border;
    color: $dark-text;
  }
}

.requestsLabel {
  flex: 1;
}

// CSS-only confetti (spec §3.2): 12 token-coloured pieces, plays once, off under reduced motion.
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.piece {
  position: absolute;
  top: -$spacing-md;
  width: $spacing-sm;
  height: $spacing-md;
  border-radius: $radius-sm;
  opacity: 0;
  animation: confettiFall 1.8s ease-out forwards;

  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      left: percentage(math.div($i - 0.5, 12));
      animation-delay: #{($i % 4) * 0.12}s;
    }
  }

  &:nth-child(4n + 1) { background: $primary; }
  &:nth-child(4n + 2) { background: $success; }
  &:nth-child(4n + 3) { background: $warning; }
  &:nth-child(4n + 4) { background: $stage-solutions; }
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }

  100% {
    opacity: 0;
    transform: translateY(160px) rotate(540deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }
}
```

Add `@use 'sass:math';` as the first line of this file (before the variables `@use`) — `math.div` needs it.

- [ ] **Step 4: Create `PathwayCards.tsx`** (E3: two cards; F10 ordering — request first)

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Mail } from 'lucide-react';
import { Card, Button } from '../../shared';
import { useT } from '../../../i18n';
import styles from './PathwayCards.module.scss';

/**
 * The ways to collect approvals (spec §3.3, E3). Wave 1 ships the two built
 * pathways; the call and daily-session cards arrive with Waves 2–3 together
 * with F10's camera+data line. Non-video pathways first (F10 ordering).
 */
const PathwayCards: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const pathways = [
    {
      key: 'request',
      icon: <UserCheck size={24} aria-hidden />,
      title: t('verification.pathway.request.title', 'Ask a member'),
      body: t('verification.pathway.request.body', 'Choose verified members who know you and ask them to vouch.'),
      cta: t('verification.pathway.request.cta', 'Ask a member'),
      to: '/identity/verification/request',
    },
    {
      key: 'invite',
      icon: <Mail size={24} aria-hidden />,
      title: t('verification.pathway.invite.title', 'Invitations'),
      body: t('verification.pathway.invite.body', 'Get invited by a verified member — or, once verified, invite people you know.'),
      cta: t('verification.pathway.invite.cta', 'Invitations'),
      to: '/identity/verification/invite',
    },
  ];
  return (
    <ul className={styles.grid}>
      {pathways.map((p) => (
        <Card as="li" key={p.key} className={styles.card}>
          <span className={styles.icon}>{p.icon}</span>
          <h3 className={styles.title}>{p.title}</h3>
          <p className={styles.body}>{p.body}</p>
          <Button size="sm" variant="secondary" fullWidth onClick={() => navigate(p.to)}>
            {p.cta}
          </Button>
        </Card>
      ))}
    </ul>
  );
};

export default PathwayCards;
```

Create `PathwayCards.module.scss`:

```scss
@use '../../../styles/variables' as *;

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-lg;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: $breakpoint-sm) {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.icon {
  display: flex;
  color: $gray-600;

  @include dark {
    color: $dark-text-secondary;
  }
}

.title {
  margin: 0;
  font-size: $text-base;
  font-weight: $font-semibold;
  color: $gray-900;

  @include dark {
    color: $dark-text;
  }
}

.body {
  flex: 1;
  margin: 0;
  font-size: $text-sm;
  line-height: 1.5;
  color: $gray-600;

  @include dark {
    color: $dark-text-secondary;
  }
}
```

- [ ] **Step 5: Create `ApprovalHistory.tsx`**

```tsx
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { EmptyState, MemberCard } from '../../shared';
import { useT } from '../../../i18n';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import type { Approval, MemberSummary } from '../../../services/verification';
import pages from './VerificationPages.module.scss';

interface Props {
  approvals: Approval[];
  /** All 30 members, for names + flags; unknown keys (a real QR scan) fall back to the key prefix. */
  byKey: Map<string, MemberSummary>;
  loading: boolean;
}

/** Who vouched for the user, how, and when (spec §3.3 "ApprovalHistory"). */
const ApprovalHistory: React.FC<Props> = ({ approvals, byKey, loading }) => {
  const t = useT();
  const methodLabel = (method: Approval['method']): string =>
    method === 'invitation'
      ? t('verification.method.invitation', 'Invited you')
      : t('verification.method.direct', 'Vouched for you');

  return (
    <section aria-labelledby="verification-history-title">
      <h2 id="verification-history-title" className={pages.sectionTitle}>
        {t('verification.history.title', 'Your approvals')}
      </h2>
      {loading ? (
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      ) : approvals.length === 0 ? (
        <EmptyState
          compact
          icon={<ShieldCheck size={48} />}
          title={t('verification.history.empty', 'No approvals yet. Ask a member to vouch for you.')}
        />
      ) : (
        <ul className={pages.list}>
          {approvals.map((a) => {
            const member = byKey.get(a.approver);
            const when = formatTimeAgo(t, a.at);
            return (
              <MemberCard
                as="li"
                key={a.id}
                name={member?.name ?? a.approver.slice(0, 8)}
                countryCode={member?.country}
                online={member?.online}
                onlineLabel={t('verification.member.online', 'Online')}
                offlineLabel={t('verification.member.offline', 'Offline')}
                trustState="verified"
                meta={when ? `${methodLabel(a.method)} · ${when}` : methodLabel(a.method)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ApprovalHistory;
```

- [ ] **Step 6: Create `VerificationHub.tsx`**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Inbox, ChevronRight } from 'lucide-react';
import { Card, Button, Badge, TrustBadge, ProgressBar } from '../../shared';
import { useT } from '../../../i18n';
import { VERIFIED_THRESHOLD } from '../../../services/trustModel';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import PathwayCards from './PathwayCards';
import ApprovalHistory from './ApprovalHistory';
import pages from './VerificationPages.module.scss';
import styles from './VerificationHub.module.scss';

/**
 * /identity/verification — the platform-wide verification hub (D8, D9).
 * Status card ("{X} of 4 approvals received" / "You're verified"), the ways to
 * collect approvals, the requests-to-vouch row, and the approval history.
 * The AppHeader owns the page h1 (IdentityView titles); headings here are h2.
 */
const VerificationHub: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { state, vouchCount, trust } = useVerification();
  const { byKey, loading } = useVerifiedMembers();
  const verified = trust === 'verified';
  const shown = Math.min(vouchCount, VERIFIED_THRESHOLD);
  const pendingCount = state?.pending.length ?? 0;

  return (
    <div className={pages.page}>
      <Card className={clsx(styles.statusCard)}>
        {verified && (
          <div className={styles.confetti} aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={styles.piece} />
            ))}
          </div>
        )}
        <div className={styles.statusHead}>
          <h2 className={styles.statusTitle}>
            {verified
              ? t('verification.hub.verifiedTitle', "You're verified")
              : t('verification.hub.progress', '{count} of {threshold} approvals received', {
                  count: shown,
                  threshold: VERIFIED_THRESHOLD,
                })}
          </h2>
          <TrustBadge state={trust} vouchCount={vouchCount} size="md" />
        </div>
        <ProgressBar
          segments={VERIFIED_THRESHOLD}
          value={shown}
          max={VERIFIED_THRESHOLD}
          size="md"
          variant={verified ? 'success' : 'primary'}
          label={t('trust.your.barLabel', 'Verification progress')}
        />
        <p className={styles.statusBody}>
          {verified
            ? t('verification.hub.verifiedBody', 'Verified members can vote and back mandates in every community they join.')
            : t(
                'verification.hub.explain',
                'Four members vouching that they know you as a real person makes you Verified everywhere on Gloki — no ID papers, no face scans.',
              )}
        </p>
        {verified && (
          <Button onClick={() => navigate('/')}>{t('verification.hub.goHome', 'Go to Home')}</Button>
        )}
      </Card>

      {!verified && (
        <section aria-labelledby="verification-pathways-title">
          <h2 id="verification-pathways-title" className={pages.sectionTitle}>
            {t('verification.hub.pathways', 'Ways to get approvals')}
          </h2>
          <PathwayCards />
        </section>
      )}

      <button type="button" className={styles.requestsRow} onClick={() => navigate('/identity/verification/approve')}>
        <Inbox size={20} aria-hidden />
        <span className={styles.requestsLabel}>{t('verification.hub.requestsLink', 'Requests to vouch')}</span>
        {pendingCount > 0 && (
          <Badge tone="info" size="sm">
            {t('verification.hub.requestsPending', '{n} waiting', { n: pendingCount })}
          </Badge>
        )}
        <ChevronRight size={18} aria-hidden />
      </button>

      <ApprovalHistory approvals={state?.approvals ?? []} byKey={byKey} loading={loading || state === null} />
    </div>
  );
};

export default VerificationHub;
```

- [ ] **Step 7: Routes + titles in `IdentityView.tsx`**

Add imports:

```ts
import VerificationHub from '../components/identity/verification/VerificationHub';
```

(Tasks 6–8 add `RequestPage`, `ApprovePage`, `InvitePage` imports and routes; add only the hub now.)

Replace the `titles` block and the `sub`/`head` lines with:

```tsx
  const accountEyebrow = t('identity.eyebrow', 'Account');
  const verificationEyebrow = t('verification.eyebrow', 'Verification');
  const titles: Record<string, { title: string; eyebrow?: string }> = {
    communities: { title: t('communities.title', 'Your Communities'), eyebrow: accountEyebrow },
    hidden: { title: t('communities.hiddenTitle', 'Hidden Communities'), eyebrow: accountEyebrow },
    profile: { title: t('profile.title', 'Profile'), eyebrow: accountEyebrow },
    join: { title: t('join.title', 'Join a community'), eyebrow: accountEyebrow },
    about: { title: t('about.title', 'About Gloki') },
    contact: { title: t('contact.title', 'Contact Gloki') },
    verification: { title: t('verification.title', 'Get verified'), eyebrow: verificationEyebrow },
  };
  // S36 — verification sub-pages (D9: nested here, no new top-level route).
  const verificationTitles: Record<string, { title: string; eyebrow?: string }> = {
    request: { title: t('verification.request.title', 'Ask a member to vouch'), eyebrow: verificationEyebrow },
    approve: { title: t('verification.approve.title', 'Requests to vouch'), eyebrow: verificationEyebrow },
    invite: { title: t('verification.invite.title', 'Invitations'), eyebrow: verificationEyebrow },
  };
  const [, , sub = 'communities', leaf] = pathname.split('/');
  const isVerification = sub === 'verification';
  const head = (isVerification && leaf && verificationTitles[leaf]) || titles[sub] || titles.communities;
```

Change the header line to:

```tsx
      <AppHeader
        title={head.title}
        eyebrow={head.eyebrow}
        showBack={isVerification}
        onBack={isVerification && leaf ? () => navigate('/identity/verification') : undefined}
      />
```

Add the route before the `hidden` route:

```tsx
            <Route path="verification" element={<VerificationHub />} />
```

- [ ] **Step 8: i18n — add to BOTH `fr.ts` and `sw.ts`** (before the closing `};`, as a new commented block `// ── S36 — Verification (Prompt 2 Wave 1) ──`)

fr.ts:

```ts
  'verification.title': 'Se faire vérifier',
  'verification.eyebrow': 'Vérification',
  'verification.hub.progress': '{count} approbations sur {threshold} reçues',
  'verification.hub.explain': 'Quatre membres attestant qu’ils vous connaissent comme une vraie personne vous rendent Vérifié·e partout sur Gloki — sans papiers d’identité ni reconnaissance faciale.',
  'verification.hub.verifiedTitle': 'Vous êtes vérifié·e',
  'verification.hub.verifiedBody': 'Les membres vérifiés peuvent voter et soutenir des mandats dans chaque communauté qu’ils rejoignent.',
  'verification.hub.goHome': 'Aller à l’accueil',
  'verification.hub.pathways': 'Comment obtenir des approbations',
  'verification.hub.requestsLink': 'Demandes de caution',
  'verification.hub.requestsPending': '{n} en attente',
  'verification.history.title': 'Vos approbations',
  'verification.history.empty': 'Aucune approbation pour l’instant. Demandez à un membre de se porter garant.',
  'verification.method.direct': 'S’est porté·e garant·e de vous',
  'verification.method.invitation': 'Vous a invité·e',
  'verification.member.online': 'En ligne',
  'verification.member.offline': 'Hors ligne',
  'verification.pathway.request.title': 'Demander à un membre',
  'verification.pathway.request.body': 'Choisissez des membres vérifiés qui vous connaissent et demandez-leur de se porter garants.',
  'verification.pathway.request.cta': 'Demander à un membre',
  'verification.pathway.invite.title': 'Invitations',
  'verification.pathway.invite.body': 'Faites-vous inviter par un membre vérifié — ou, une fois vérifié·e, invitez des personnes que vous connaissez.',
  'verification.pathway.invite.cta': 'Invitations',
  'verification.request.title': 'Demander une caution',
  'verification.approve.title': 'Demandes de caution',
  'verification.invite.title': 'Invitations',
```

sw.ts:

```ts
  'verification.title': 'Thibitishwa',
  'verification.eyebrow': 'Uthibitisho',
  'verification.hub.progress': 'Umepokea idhini {count} kati ya {threshold}',
  'verification.hub.explain': 'Wanachama wanne wanaothibitisha kuwa wanakujua kama mtu halisi hukufanya Uthibitishwe kila mahali kwenye Gloki — bila vitambulisho wala uchanganuzi wa uso.',
  'verification.hub.verifiedTitle': 'Umethibitishwa',
  'verification.hub.verifiedBody': 'Wanachama waliothibitishwa wanaweza kupiga kura na kuunga mkono maagizo katika kila jumuiya wanayojiunga nayo.',
  'verification.hub.goHome': 'Nenda Mwanzo',
  'verification.hub.pathways': 'Njia za kupata idhini',
  'verification.hub.requestsLink': 'Maombi ya udhamini',
  'verification.hub.requestsPending': '{n} yanasubiri',
  'verification.history.title': 'Idhini zako',
  'verification.history.empty': 'Bado hakuna idhini. Muombe mwanachama akudhamini.',
  'verification.method.direct': 'Alikudhamini',
  'verification.method.invitation': 'Alikualika',
  'verification.member.online': 'Mtandaoni',
  'verification.member.offline': 'Nje ya mtandao',
  'verification.pathway.request.title': 'Muombe mwanachama',
  'verification.pathway.request.body': 'Chagua wanachama waliothibitishwa wanaokujua na uwaombe wakudhamini.',
  'verification.pathway.request.cta': 'Muombe mwanachama',
  'verification.pathway.invite.title': 'Mialiko',
  'verification.pathway.invite.body': 'Alikwa na mwanachama aliyethibitishwa — au, ukishathibitishwa, waalike watu unaowajua.',
  'verification.pathway.invite.cta': 'Mialiko',
  'verification.request.title': 'Omba udhamini',
  'verification.approve.title': 'Maombi ya udhamini',
  'verification.invite.title': 'Mialiko',
```

- [ ] **Step 9: Verify** — the three commands PLUS the parity script:

```bash
node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs
```
Expected: `Parsed keys: en=76 fr=1276 sw=1276` … `RESULT: PARITY OK`.

- [ ] **Step 10: Commit**

```bash
git add src/hooks/useVerification.ts src/pages/IdentityView.tsx src/components/identity/verification/ src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s36): verification hub — status card, segmented bar, pathway cards, approval history; /identity/verification (D8, D9, E3)"
```

---

### Task 6: `RequestPage` — ask a member to vouch

**Files:**
- Create: `src/components/identity/verification/RequestPage.tsx`
- Modify: `src/pages/IdentityView.tsx` (import + route)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `useVerification`, `useVerifiedMembers`, `requestVouch`, `useToast`, `MemberCard`, `Button`, `Badge`, `EmptyState`, the shared `VerificationPages.module.scss` classes.

- [ ] **Step 1: Create `RequestPage.tsx`**

```tsx
import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Button, Badge, EmptyState, MemberCard, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { requestVouch, type MemberSummary } from '../../../services/verification';
import pages from './VerificationPages.module.scss';

/**
 * /identity/verification/request — pick verified members and ask them to
 * vouch. "Requested ✓" appears at once (the seam writes the pending request
 * before its delay); the outcome arrives 2–5 s later as a toast, and the list
 * re-fetches (the demo seam emits no write events).
 */
const RequestPage: React.FC = () => {
  const t = useT();
  const toast = useToast();
  const { ctx, state, refetch } = useVerification();
  const { members, query, setQuery, loading } = useVerifiedMembers();
  const [inFlight, setInFlight] = useState<Set<string>>(() => new Set());

  const vouchedBy = new Set((state?.approvals ?? []).map((a) => a.approver));
  const sentTo = new Map((state?.sent ?? []).map((r) => [r.approver, r.status]));

  const handleRequest = async (member: MemberSummary) => {
    if (!ctx) return;
    setInFlight((prev) => new Set(prev).add(member.publicKey));
    const outcome = requestVouch(ctx, member.publicKey);
    void refetch(); // shows "Requested ✓" from the seam's own state
    const settled = await outcome;
    setInFlight((prev) => {
      const next = new Set(prev);
      next.delete(member.publicKey);
      return next;
    });
    await refetch();
    toast.show(
      settled.status === 'approved'
        ? { tone: 'success', message: t('verification.request.approvedToast', '{name} vouched for you', { name: member.name }) }
        : { tone: 'info', message: t('verification.request.declinedToast', '{name} didn’t respond this time', { name: member.name }) },
    );
  };

  const actionFor = (member: MemberSummary): React.ReactNode => {
    if (vouchedBy.has(member.publicKey)) {
      return <Badge tone="success" size="sm">{t('verification.request.vouched', 'Vouched')}</Badge>;
    }
    const status = sentTo.get(member.publicKey);
    if (inFlight.has(member.publicKey) || status === 'pending') {
      return <Button size="sm" variant="secondary" disabled>{t('verification.request.sent', 'Requested ✓')}</Button>;
    }
    if (status === 'declined') {
      return <Button size="sm" variant="ghost" disabled>{t('verification.request.noResponse', 'No response')}</Button>;
    }
    return <Button size="sm" onClick={() => void handleRequest(member)}>{t('verification.request.cta', 'Request')}</Button>;
  };

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.request.intro', 'Members you know can confirm you’re a real person. Each approval counts toward your four.')}
      </p>
      <div className={pages.field}>
        <label htmlFor="verification-search" className={pages.fieldLabel}>
          {t('verification.request.search', 'Search by name')}
        </label>
        <input
          id="verification-search"
          type="search"
          className={pages.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('verification.request.searchPlaceholder', 'Name')}
          autoComplete="off"
        />
      </div>
      {loading ? (
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      ) : members.length === 0 ? (
        <EmptyState compact icon={query ? <Search size={48} /> : <Users size={48} />} title={t('verification.request.empty', 'No members match.')} />
      ) : (
        <ul className={pages.list}>
          {members.map((m) => (
            <MemberCard
              as="li"
              key={m.publicKey}
              name={m.name}
              countryCode={m.country}
              online={m.online}
              onlineLabel={t('verification.member.online', 'Online')}
              offlineLabel={t('verification.member.offline', 'Offline')}
              trustState="verified"
              action={actionFor(m)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RequestPage;
```

- [ ] **Step 2: Route** — in `IdentityView.tsx` add the import and, after the hub route:

```tsx
import RequestPage from '../components/identity/verification/RequestPage';
```
```tsx
            <Route path="verification/request" element={<RequestPage />} />
```

- [ ] **Step 3: i18n — both overlays**

fr.ts:

```ts
  'verification.request.intro': 'Les membres qui vous connaissent peuvent confirmer que vous êtes une vraie personne. Chaque approbation compte parmi vos quatre.',
  'verification.request.search': 'Rechercher par nom',
  'verification.request.searchPlaceholder': 'Nom',
  'verification.request.cta': 'Demander',
  'verification.request.sent': 'Demandé ✓',
  'verification.request.vouched': 'Garant·e',
  'verification.request.noResponse': 'Sans réponse',
  'verification.request.approvedToast': '{name} s’est porté·e garant·e de vous',
  'verification.request.declinedToast': '{name} n’a pas répondu cette fois',
  'verification.request.empty': 'Aucun membre ne correspond.',
```

sw.ts:

```ts
  'verification.request.intro': 'Wanachama wanaokujua wanaweza kuthibitisha kuwa wewe ni mtu halisi. Kila idhini inahesabiwa kati ya nne zako.',
  'verification.request.search': 'Tafuta kwa jina',
  'verification.request.searchPlaceholder': 'Jina',
  'verification.request.cta': 'Omba',
  'verification.request.sent': 'Imeombwa ✓',
  'verification.request.vouched': 'Amekudhamini',
  'verification.request.noResponse': 'Hakuna jibu',
  'verification.request.approvedToast': '{name} amekudhamini',
  'verification.request.declinedToast': '{name} hakujibu wakati huu',
  'verification.request.empty': 'Hakuna mwanachama anayelingana.',
```

- [ ] **Step 4: Verify** — three commands + parity (`fr=1286 sw=1286`, PARITY OK).

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/verification/RequestPage.tsx src/pages/IdentityView.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s36): request page — member search, optimistic Requested state, simulated outcome toast (E2)"
```

---

### Task 7: `ApprovePage` — approve or decline requests to vouch

**Files:**
- Create: `src/components/identity/verification/ApprovePage.tsx`, `ApprovePage.module.scss`
- Modify: `src/pages/IdentityView.tsx` (import + route)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: Create `ApprovePage.module.scss`**

```scss
@use '../../../styles/variables' as *;

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  transition:
    transform $transition-slow ease,
    opacity $transition-slow ease;
}

.leaving {
  transform: translateX($spacing-2xl);
  opacity: 0;
}

.actions {
  display: flex;
  gap: $spacing-sm;
  align-items: center;
}

.done {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  min-height: 44px;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: $success-on-surface;

  @include dark {
    color: $success-on-dark;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }

  .leaving {
    transform: none;
  }
}
```

- [ ] **Step 2: Create `ApprovePage.tsx`**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Inbox, CheckCircle2 } from 'lucide-react';
import { Card, Button, EmptyState, MemberCard, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { respondToRequest, type VouchRequest } from '../../../services/verification';
import pages from './VerificationPages.module.scss';
import styles from './ApprovePage.module.scss';

const LEAVE_MS = 300; // matches $transition-slow

/**
 * /identity/verification/approve — requests waiting on the user. Approve
 * slides the card out with a check; Decline removes it quietly. Requests only
 * reach verified members, so an unverified user sees the explanatory empty state.
 */
const ApprovePage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { ctx, state, refetch, trust } = useVerification();
  const { byKey } = useVerifiedMembers();
  const [leaving, setLeaving] = useState<string | null>(null);
  const verified = trust === 'verified';
  const pending = state?.pending ?? [];

  const respond = async (request: VouchRequest, approve: boolean) => {
    if (!ctx) return;
    const name = byKey.get(request.requester)?.name ?? request.requester.slice(0, 8);
    if (approve) {
      setLeaving(request.id);
      await new Promise((resolve) => setTimeout(resolve, LEAVE_MS));
    }
    await respondToRequest(ctx, request.id, approve);
    await refetch();
    setLeaving(null);
    if (approve) {
      toast.show({ tone: 'success', message: t('verification.approve.approvedToast', 'You vouched for {name}', { name }) });
    }
  };

  if (state === null) {
    return <div className={pages.page}><p className={pages.intro}>{t('common.loading', 'Loading…')}</p></div>;
  }

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.approve.intro', 'Approve only people you know are real. Your vouch counts toward their four.')}
      </p>
      {pending.length === 0 ? (
        <EmptyState
          icon={<Inbox size={48} />}
          title={
            verified
              ? t('verification.approve.emptyVerified', 'No requests right now.')
              : t('verification.approve.emptyUnverified', 'Members can ask you to vouch once you’re verified.')
          }
          action={
            verified ? undefined : (
              <Button size="sm" onClick={() => navigate('/identity/verification')}>
                {t('gate.getVerified', 'Get verified')}
              </Button>
            )
          }
        />
      ) : (
        <ul className={pages.list}>
          {pending.map((request) => {
            const member = byKey.get(request.requester);
            const when = formatTimeAgo(t, request.at);
            const isLeaving = leaving === request.id;
            return (
              <Card as="li" key={request.id} className={clsx(styles.card, isLeaving && styles.leaving)}>
                <MemberCard
                  name={member?.name ?? request.requester.slice(0, 8)}
                  countryCode={member?.country}
                  online={member?.online}
                  onlineLabel={t('verification.member.online', 'Online')}
                  offlineLabel={t('verification.member.offline', 'Offline')}
                  meta={when ? `${t('verification.approve.asked', 'asked you to vouch')} · ${when}` : t('verification.approve.asked', 'asked you to vouch')}
                />
                <div className={styles.actions}>
                  {isLeaving ? (
                    <span className={styles.done}>
                      <CheckCircle2 size={18} aria-hidden />
                      {t('verification.approve.approve', 'Approve')}
                    </span>
                  ) : (
                    <>
                      <Button size="md" onClick={() => void respond(request, true)} disabled={leaving !== null}>
                        {t('verification.approve.approve', 'Approve')}
                      </Button>
                      <Button size="md" variant="ghost" onClick={() => void respond(request, false)} disabled={leaving !== null}>
                        {t('verification.approve.decline', 'Decline')}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ApprovePage;
```

- [ ] **Step 3: Route** — import + route after the request route:

```tsx
import ApprovePage from '../components/identity/verification/ApprovePage';
```
```tsx
            <Route path="verification/approve" element={<ApprovePage />} />
```

- [ ] **Step 4: i18n — both overlays**

fr.ts:

```ts
  'verification.approve.intro': 'N’approuvez que des personnes dont vous savez qu’elles sont réelles. Votre caution compte parmi leurs quatre.',
  'verification.approve.asked': 'vous demande de vous porter garant·e',
  'verification.approve.approve': 'Approuver',
  'verification.approve.decline': 'Refuser',
  'verification.approve.emptyVerified': 'Aucune demande pour l’instant.',
  'verification.approve.emptyUnverified': 'Les membres pourront vous demander une caution une fois que vous serez vérifié·e.',
  'verification.approve.approvedToast': 'Vous vous êtes porté·e garant·e de {name}',
```

sw.ts:

```ts
  'verification.approve.intro': 'Idhinisha tu watu unaojua ni halisi. Udhamini wako unahesabiwa kati ya nne zao.',
  'verification.approve.asked': 'anakuomba umdhamini',
  'verification.approve.approve': 'Idhinisha',
  'verification.approve.decline': 'Kataa',
  'verification.approve.emptyVerified': 'Hakuna maombi kwa sasa.',
  'verification.approve.emptyUnverified': 'Wanachama wataweza kukuomba udhamini ukishathibitishwa.',
  'verification.approve.approvedToast': 'Umemdhamini {name}',
```

- [ ] **Step 5: Verify** — three commands + parity (`fr=1293 sw=1293`, PARITY OK).

- [ ] **Step 6: Commit**

```bash
git add src/components/identity/verification/ApprovePage.tsx src/components/identity/verification/ApprovePage.module.scss src/pages/IdentityView.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s36): approve page — pending request cards, approve slide-out, decline, verified-gated empty states"
```

---

### Task 8: `InvitePage` — invite (verified) / request an invitation (unverified)

**Files:**
- Create: `src/components/identity/verification/InvitePage.tsx`
- Modify: `src/pages/IdentityView.tsx` (import + route)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: Create `InvitePage.tsx`**

```tsx
import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { Button, EmptyState, MemberCard, useToast } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification, useVerifiedMembers } from '../../../hooks/useVerification';
import { requestInvitation, sendInvitation, type MemberSummary } from '../../../services/verification';
import pages from './VerificationPages.module.scss';

/**
 * /identity/verification/invite — branches on trust (spec §3.3):
 * verified → invite someone by name + email, with a vouch checkbox;
 * unverified → ask a verified member for an invitation.
 * The demo records both locally and sends no email — the copy says so.
 */
const InvitePage: React.FC = () => {
  const t = useT();
  const toast = useToast();
  const { ctx, state, refetch, trust } = useVerification();
  const { members, loading } = useVerifiedMembers();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vouch, setVouch] = useState(true);
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const requested = new Set(state?.invitationRequests ?? []);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ctx || !e.currentTarget.checkValidity()) return;
    setSending(true);
    await sendInvitation(ctx, { name: name.trim(), email: email.trim(), vouch });
    setSending(false);
    toast.show({
      tone: 'success',
      message: t('verification.invite.sentToast', 'Invitation recorded for {name} — this demo sends no email.', { name: name.trim() }),
    });
    setName('');
    setEmail('');
  };

  const handleRequest = async (member: MemberSummary) => {
    if (!ctx) return;
    setRequesting(member.publicKey);
    await requestInvitation(ctx, member.publicKey);
    await refetch();
    setRequesting(null);
    toast.show({ tone: 'success', message: t('verification.invite.requestedToast', 'Invitation request sent to {name}', { name: member.name }) });
  };

  if (trust === 'verified') {
    return (
      <form className={pages.page} onSubmit={(e) => void handleSend(e)} noValidate={false}>
        <p className={pages.intro}>
          {t('verification.invite.formIntro', 'Invite someone you know. Ticking the box counts as your vouch for them.')}
        </p>
        <div className={pages.field}>
          <label htmlFor="invite-name" className={pages.fieldLabel}>{t('verification.invite.name', 'Their name')}</label>
          <input id="invite-name" className={pages.input} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
        </div>
        <div className={pages.field}>
          <label htmlFor="invite-email" className={pages.fieldLabel}>{t('verification.invite.email', 'Their email')}</label>
          <input id="invite-email" type="email" className={pages.input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
        </div>
        <label className={pages.checkboxRow}>
          <input type="checkbox" checked={vouch} onChange={(e) => setVouch(e.target.checked)} />
          {t('verification.invite.vouch', 'I know this person and vouch for them')}
        </label>
        <div className={pages.actions}>
          <Button type="submit" fullWidth loading={sending} disabled={!name.trim() || !email.trim()}>
            {t('verification.invite.send', 'Send invitation')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className={pages.page}>
      <p className={pages.intro}>
        {t('verification.invite.requestIntro', 'Verified members can invite you. Ask someone who knows you.')}
      </p>
      {loading ? (
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      ) : members.length === 0 ? (
        <EmptyState compact icon={<Users size={48} />} title={t('verification.request.empty', 'No members match.')} />
      ) : (
        <ul className={pages.list}>
          {members.map((m) => (
            <MemberCard
              as="li"
              key={m.publicKey}
              name={m.name}
              countryCode={m.country}
              online={m.online}
              onlineLabel={t('verification.member.online', 'Online')}
              offlineLabel={t('verification.member.offline', 'Offline')}
              trustState="verified"
              action={
                requested.has(m.publicKey) || requesting === m.publicKey ? (
                  <Button size="sm" variant="secondary" disabled>{t('verification.invite.requested', 'Requested ✓')}</Button>
                ) : (
                  <Button size="sm" onClick={() => void handleRequest(m)}>{t('verification.invite.requestCta', 'Request invitation')}</Button>
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default InvitePage;
```

- [ ] **Step 2: Route** — import + route after the approve route:

```tsx
import InvitePage from '../components/identity/verification/InvitePage';
```
```tsx
            <Route path="verification/invite" element={<InvitePage />} />
```

- [ ] **Step 3: i18n — both overlays**

fr.ts:

```ts
  'verification.invite.formIntro': 'Invitez quelqu’un que vous connaissez. Cocher la case vaut caution de votre part.',
  'verification.invite.name': 'Son nom',
  'verification.invite.email': 'Son e-mail',
  'verification.invite.vouch': 'Je connais cette personne et je me porte garant·e',
  'verification.invite.send': 'Envoyer l’invitation',
  'verification.invite.sentToast': 'Invitation enregistrée pour {name} — cette démo n’envoie aucun e-mail.',
  'verification.invite.requestIntro': 'Les membres vérifiés peuvent vous inviter. Demandez à quelqu’un qui vous connaît.',
  'verification.invite.requestCta': 'Demander une invitation',
  'verification.invite.requested': 'Demandé ✓',
  'verification.invite.requestedToast': 'Demande d’invitation envoyée à {name}',
```

sw.ts:

```ts
  'verification.invite.formIntro': 'Alika mtu unayemjua. Kutia alama kwenye kisanduku ni udhamini wako kwake.',
  'verification.invite.name': 'Jina lake',
  'verification.invite.email': 'Barua pepe yake',
  'verification.invite.vouch': 'Namjua mtu huyu na ninamdhamini',
  'verification.invite.send': 'Tuma mwaliko',
  'verification.invite.sentToast': 'Mwaliko umerekodiwa kwa {name} — demo hii haitumi barua pepe.',
  'verification.invite.requestIntro': 'Wanachama waliothibitishwa wanaweza kukualika. Muombe mtu anayekujua.',
  'verification.invite.requestCta': 'Omba mwaliko',
  'verification.invite.requested': 'Imeombwa ✓',
  'verification.invite.requestedToast': 'Ombi la mwaliko limetumwa kwa {name}',
```

- [ ] **Step 4: Verify** — three commands + parity (`fr=1303 sw=1303`, PARITY OK).

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/verification/InvitePage.tsx src/pages/IdentityView.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s36): invite page — invite form with vouch checkbox (verified), request-an-invitation list (unverified)"
```

---

### Task 9: Wiring — StageGate + IdentityTrust point at the hub; dev-only demo-state switcher

**Files:**
- Modify: `src/components/community/StageGate.tsx:61`
- Modify: `src/components/community/IdentityTrust.tsx` (imports, `handleMeetMember`, the demo button block)
- Create: `src/components/identity/verification/VerificationDemoState.demo.tsx`
- Modify: `src/components/identity/HomepageMenu.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts` (add `demo.verification.*`; REMOVE `trust.meetMember` from both)

- [ ] **Step 1: `StageGate`** — change the "Get verified" handler to `navigate('/identity/verification')` (the `communityId` prop stays; the hook still needs it).

- [ ] **Step 2: `IdentityTrust`** — the hub's request flow replaces the "Meet a member (demo)" shortcut (spec §5):

Change the imports:

```ts
import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, QrCode, Share2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { Card, TrustBadge, Button, ProgressBar } from '../shared';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import { VERIFIED_THRESHOLD } from '../../services/trust';
import { useT } from '../../i18n';
import styles from './IdentityTrust.module.scss';
```

(drop `useDigitalAgent` and `addUserVouch`). Add `const navigate = useNavigate();` after `const t = useT();`, delete the `const { agent } = useDigitalAgent();` line and the whole `handleMeetMember` block with its comment, and replace the demo button block with:

```tsx
        {trust.currentUserTrust !== 'verified' && (
          <div className={styles.verifyActions}>
            {/* S36 — the platform-wide hub (D8) owns the request/invite flows. */}
            <Button size="sm" variant="secondary" onClick={() => navigate('/identity/verification')}>
              {t('gate.getVerified', 'Get verified')}
            </Button>
          </div>
        )}
```

- [ ] **Step 3: Create `VerificationDemoState.demo.tsx`** (sanctioned demo sidecar — reaches into the mock layer)

```tsx
// DEMO-ONLY sidecar (dev builds): applies a verification scenario from the
// mock layer and reloads. Reaches past the seam on purpose — the
// `.demo.tsx` suffix marks it, like ProblemStage.demo.ts. Never imported by
// production paths (HomepageMenu gates the entry on import.meta.env.DEV).
import React from 'react';
import { Modal, Button } from '../../shared';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { applyDemoScenario, DEMO_SCENARIOS, type DemoScenario } from '../../../services/demo/verificationDemo';
import pages from './VerificationPages.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationDemoStateDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const labels: Record<DemoScenario, string> = {
    'unverified-0': t('demo.verification.unverified', 'Unverified (0 approvals)'),
    'partial-2': t('demo.verification.partial', 'Partly vouched (2 of 4)'),
    'verified-4': t('demo.verification.verified', 'Verified (4 of 4)'),
    'member-view': t('demo.verification.memberView', 'Verified member with requests waiting'),
  };
  const apply = (scenario: DemoScenario) => {
    if (!publicKey) return;
    applyDemoScenario(scenario, publicKey);
    window.location.reload();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('demo.verification.title', 'Verification demo state')} closeLabel={t('common.close', 'Close')} size="sm">
      <p className={pages.intro}>{t('demo.verification.body', 'Applies a scenario and reloads.')}</p>
      <div className={pages.actions}>
        {DEMO_SCENARIOS.map((scenario) => (
          <Button key={scenario} variant="secondary" fullWidth onClick={() => apply(scenario)}>
            {labels[scenario]}
          </Button>
        ))}
      </div>
    </Modal>
  );
};

export default VerificationDemoStateDialog;
```

Read `src/components/shared/Modal.tsx`'s props first (`grep -n "interface ModalProps" -A 20`); if `closeLabel` or `size` differ in name, match the real prop names.

- [ ] **Step 4: `HomepageMenu`** — add a dev-only entry + render the dialog

Imports: add `useState` to the React import, `FlaskConical` to the lucide import, and

```ts
import VerificationDemoStateDialog from './verification/VerificationDemoState.demo';
```

Inside the component add `const [demoOpen, setDemoOpen] = useState(false);`. Append to `globalItems` (after `contact`):

```ts
    ...(import.meta.env.DEV
      ? [{ key: 'demo-verification', icon: FlaskConical, label: t('demo.verification.menu', 'Demo: verification state'), onClick: close(() => setDemoOpen(true)), dividerBefore: true } as SlideOutMenuItem]
      : []),
```

Wrap the return in a fragment and render the dialog as a sibling of `SlideOutMenu`:

```tsx
      <VerificationDemoStateDialog isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
```

(The menu closes in the same render the dialog opens — the two overlays never coexist, per the CommunityView reset-demo note.)

- [ ] **Step 5: i18n** — add to both overlays; **delete** the `'trust.meetMember'` line from BOTH `fr.ts` and `sw.ts` (grep `-n "'trust.meetMember'"` to find them).

fr.ts:

```ts
  'demo.verification.menu': 'Démo : état de vérification',
  'demo.verification.title': 'État de vérification (démo)',
  'demo.verification.body': 'Applique un scénario et recharge la page.',
  'demo.verification.unverified': 'Non vérifié (0 approbation)',
  'demo.verification.partial': 'Partiellement cautionné (2 sur 4)',
  'demo.verification.verified': 'Vérifié (4 sur 4)',
  'demo.verification.memberView': 'Membre vérifié avec des demandes en attente',
```

sw.ts:

```ts
  'demo.verification.menu': 'Demo: hali ya uthibitisho',
  'demo.verification.title': 'Hali ya uthibitisho (demo)',
  'demo.verification.body': 'Inaweka hali na kupakia upya ukurasa.',
  'demo.verification.unverified': 'Hajathibitishwa (idhini 0)',
  'demo.verification.partial': 'Amedhaminiwa kwa sehemu (2 kati ya 4)',
  'demo.verification.verified': 'Amethibitishwa (4 kati ya 4)',
  'demo.verification.memberView': 'Mwanachama aliyethibitishwa mwenye maombi yanayosubiri',
```

- [ ] **Step 6: Verify** — three commands + parity (`fr=1309 sw=1309`, PARITY OK) + `grep -rn "trust.meetMember" src` → no hits.

- [ ] **Step 7: Commit**

```bash
git add src/components/community/StageGate.tsx src/components/community/IdentityTrust.tsx src/components/identity/verification/VerificationDemoState.demo.tsx src/components/identity/HomepageMenu.tsx src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s36): Get-verified links point at the hub; dev-only verification demo-state switcher; retire trust.meetMember"
```

---

### Task 10 (controller only): preview walk, whole-branch review, closeout docs

Not delegated. After Task 9:

- [ ] Preview walk (`preview_start gloki-dev`, seed `localStorage.user` with `'a'.repeat(64)`, 360px light + dark, en/fr/sw): hub in all four scenarios; request → Requested → toast → count rises → Vote gate unlocks on a community; approve slide-out; invite both branches; keyboard pass (Tab order, Escape on toast region); one `<h1>` per route; the `Meet a member` affordance gone, `Get verified` reaches the hub from `StageGate` and `IdentityTrust`.
- [ ] `docs/i18n-native-review-candidates.md`: append `## Session 36 (2026-09-06) — Community verification, Wave 1` — per-key table (key · English · fr · sw · note) for every `verification.*` and `demo.verification.*` key, plus a "Keys retired" line for `trust.meetMember`. Flag for the reviewers: the fr inclusive `·e` forms (house style check), sw "udhamini" for vouch, "Requested ✓" glyph.
- [ ] `MASTER_TODO.md` §7: a P11 entry "Prompt 2 — Community verification" with Wave 1 ✅ built (commit range), Waves 2–4 open; §8 changelog entry.
- [ ] Opus whole-branch review of `bb855a3..HEAD`; fix Critical/Important; re-verify.
- [ ] Memory file + `MEMORY.md` line; `docs/session-prompts/session-37-verification-w2.md` with its own "Re-verify these premises vs HEAD" list.
- [ ] Present the review verdict + what would ship; **wait for Eston's explicit go before any push.**

---

## Self-review (done while writing)

- **Spec coverage:** §3.1 seam surface — Task 4 (all six functions; `getVerificationState` also carries `invitationRequests`, needed by the invite page's "Requested ✓" state after reload). §3.1 `addUserVouch {method, at}` — Task 1. §3.1 fixtures (30 members, 3–5 pending → 4 seeded, approval history, 4 scenarios, DEMO_VERSION) — Task 4; notification fixtures deferred to W4 per the addendum. §3.2 kit: ProgressBar segments + Toast + MemberCard — Tasks 2–3; confetti — Task 5 (hub module). §3.3 Wave 1 screens + routes — Tasks 5–8; `StageGate`/`IdentityTrust` wiring — Task 9; demo-state menu entry — Task 9. E1/E2/E3 — Tasks 1, 4, 5.
- **Placeholders:** none — every step carries its code; the two "read the real file first" notes (App.tsx wrap, Modal props) are reads, not TBDs.
- **Type consistency:** `VerificationState.invitationRequests` is declared in Task 4's model and consumed in Task 8; `MemberCard` props (`onlineLabel`/`offlineLabel`/`meta`/`action`/`as`) match across Tasks 2, 5, 6, 7, 8; `useVerifiedMembers().byKey` is used by Tasks 5 and 7; `requestVouch` returns the settled `VouchRequest` (Task 4) which Task 6 reads as `settled.status`.
