# S39 Notification Centre and Bell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an owner-scoped notification centre whose bell and deterministic W1–W3 simulation producers provide truthful, persistent notification walkthroughs.

**Architecture:** Hydrate one notification Redux scope per `serverUrl + publicKey`, publish stable domain-event ids through a service helper, and keep reminder/call-offer runtime state in a tab-lifetime demo service. Render the records through one shared `NotificationItem`; the bell only links to the nested centre, while the centre resolves valid actions from persisted status.

**Tech Stack:** React 19, strict TypeScript, Redux Toolkit, React Router, SCSS Modules and existing design tokens, lucide-react, inline-English/fr/sw i18n. No new dependency or test framework.

**Spec:** [S39 notification-centre design](../specs/2026-09-10-s39-notification-centre-design.md)

## Global Constraints

- D8: verification is platform-wide on the Digital Agent; `VERIFIED_THRESHOLD = 4` and trust never weights a vote.
- D9: register `/identity/notifications` inside `IdentityView`; do not edit `App.tsx`.
- No browser notification permission, email, service worker, WebRTC, or delivery claim beyond the open tab.
- Components do not import `verificationDemo`, `verificationSim`, `dailyVerificationSim`, or the demo notification runtime.
- Domain producers live in their owning W1–W3 service modules. Components may dispatch only read/unread UI actions.
- Stable event ids and reducer upserts suppress StrictMode, timer-reconciliation, repeated-read and repeated-callback duplicates.
- All persisted state is owner-scoped by encoded server URL plus public key. Logout/account switch renders zero previous-owner items.
- The ambiguous legacy `communityNotifications` key is deleted, never assigned to a signed-in owner.
- Every persisted mutation saves inside the slice reducer; hydrate/sanitize at most 100 unique newest-first records.
- No fixture or seed-shape edit: `DEMO_VERSION` remains exactly `global-v19`.
- The daily reminder survives route changes but dies on account change, reload, or tab close; its UI says exactly that.
- Expired/consumed call and selection records expose no broken action.
- Shared kit, tokens only, `@include dark`, one AppHeader h1, 44px controls, visible focus, quiet live updates, reduced motion.
- Every string uses inline English and matching fr/sw keys in the same feature commit; append the Session 39 native-review packet.
- Build sequentially in small local commits. Do not stage `.agents/`. Do not run the local multi-model panel or push without Eston's separate explicit authorization.

---

## File structure

### Create

- `src/services/notificationEvents.ts` — Redux publication/status bridge with owner-scope guards.
- `src/services/notifications.ts` — public notification lifecycle seam used by AuthContext and domain actions.
- `src/services/demo/notificationRuntime.ts` — tab-lifetime owner runtime, W1 priming, W2 offer startup and daily reminder timers.
- `src/components/shared/NotificationItem.tsx` — type-agnostic notification row primitive.
- `src/components/shared/NotificationItem.module.scss` — token-only row states and 360px layout.
- `src/components/identity/notifications/NotificationCenter.tsx` — copy/action resolution and list controls.
- `src/components/identity/notifications/NotificationCenter.module.scss` — page layout and empty/actions treatment.

### Modify

- `src/store/slices/notificationsSlice.ts` — seven types, scoped hydration, sanitization, deterministic upsert and read/unread reducers.
- `src/contexts/AuthContext.tsx` — hydrate notifications and start/stop one authenticated notification runtime.
- `src/services/verificationModel.ts` — `CallInviteOffer` type used by the W2 runtime.
- `src/services/verification.ts` — pass full owner context into W1/W2/W3 simulations and accept an optional call-offer event id.
- `src/services/demo/verificationDemo.ts` — request and approval producers plus explicit pending-request priming.
- `src/services/demo/verificationSim.ts` — deterministic offer registry, call-invite producer, consume/expire lifecycle.
- `src/services/demo/dailyVerificationSim.ts` — owner context, reminder scheduling, selection/thanks producers and expiry.
- `src/components/identity/verification/CallFlow.tsx` — consume the optional `invite` query parameter.
- `src/components/identity/verification/DailySession.tsx` — updated honest reminder helper only; existing actions stay on the seam.
- `src/components/shared/NotificationsBell.tsx` and `.module.scss` — direct centre link and count badge.
- `src/components/shared/index.ts` — export `NotificationItem` and its props.
- `src/components/collaboration/flows/merge/MergeProposalsList.tsx` — replace component Redux event construction with stable service publication.
- `src/pages/IdentityView.tsx` — notifications title and nested route.
- `src/i18n/fr.ts`, `src/i18n/sw.ts`, `docs/i18n-native-review-candidates.md` — complete localized copy and Session 39 packet.
- `docs/FOR_OURI_seam.md` — simulation-only lifecycle rows plus real transport/auth requirements.
- `MASTER_TODO.md`, `docs/session-prompts/session-40-next-roadmap.md` — achieved closeout and next-session handoff after review.

---

### Task 1: Make notification persistence owner-scoped and deterministic

**Files:**
- Modify: `src/store/slices/notificationsSlice.ts`
- Modify: `src/contexts/AuthContext.tsx` (hydration only in this task)

**Interfaces:**
- Produces:

```ts
export type NotificationType =
  | 'merge_absorbed'
  | 'verification_request'
  | 'call_invite'
  | 'approval_received'
  | 'daily_reminder'
  | 'verifier_selected'
  | 'session_thanks';

export type NotificationStatus = 'active' | 'consumed' | 'expired';
export type NotificationPayload = Record<string, string | number | boolean | null>;

export interface AppNotification {
  id: string;
  type: NotificationType;
  createdAt: number;
  read: boolean;
  status: NotificationStatus;
  payload: NotificationPayload;
}

export function buildNotificationsScope(serverUrl: string, publicKey: string): string;
export const hydrateNotifications: PayloadActionCreator<{ scopeKey: string | null }>;
export const upsertNotification: PayloadActionCreator<{
  scopeKey: string;
  notification: Omit<AppNotification, 'read'>;
}>;
export const setNotificationStatus: PayloadActionCreator<{
  scopeKey: string;
  id: string;
  status: NotificationStatus;
  payload?: NotificationPayload;
}>;
export const markRead: PayloadActionCreator<string>;
export const markUnread: PayloadActionCreator<string>;
export const markAllRead: PayloadActionCreator<void>;
```

- [ ] **Step 1: Replace module-load persistence with an empty scoped initial state**

Use `{ items: [], storageScope: null }`. Build keys as
`communityNotifications:${scopeKey}` and keep `communityNotifications` only as a
`LEGACY_STORAGE_KEY` for deletion during hydration.

- [ ] **Step 2: Add strict hydration sanitization**

Accept plain objects only; require recognized type, non-empty string id, finite positive
`createdAt`, boolean `read`, recognized status (default old recognized records to `active`),
and a plain-object payload containing only string/number/boolean/null values. Sort descending,
dedupe by id, and slice to 100. Corrupt JSON returns an empty list.

- [ ] **Step 3: Add scoped reducers and persistence**

`hydrateNotifications` sets scope, loads only that key, and clears the legacy key. Upsert ignores
a mismatched scope; an existing id preserves its `createdAt` and `read` while payload/status update.
Every read/status/clear mutation saves through `current(state)` and does nothing when scope is null.

- [ ] **Step 4: Hydrate alongside flow contracts**

In the existing `AuthContext` identity effect, build both scopes and synchronously dispatch
`hydrateNotifications({ scopeKey })`. Do not start producer runtime until Task 2.

- [ ] **Step 5: Verify the slice gate**

Run `npx --no-install tsc -b --noEmit`. In the running app console, preseed two scoped keys and
the legacy key, switch identities, and inspect Redux/localStorage: each identity sees only its
own sanitized records; logout sees none; the legacy key is gone; duplicate ids collapse; 101
records become 100.

- [ ] **Step 6: Commit**

```bash
git add src/store/slices/notificationsSlice.ts src/contexts/AuthContext.tsx
git commit -m "feat(s39): scope notifications to the signed-in owner"
```

### Task 2: Add the event bridge and authenticated W1/W2 runtime

**Files:**
- Create: `src/services/notificationEvents.ts`
- Create: `src/services/notifications.ts`
- Create: `src/services/demo/notificationRuntime.ts`
- Modify: `src/services/verificationModel.ts`
- Modify: `src/services/verification.ts`
- Modify: `src/services/demo/verificationDemo.ts`
- Modify: `src/services/demo/verificationSim.ts`
- Modify: `src/contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: Task 1's scope, upsert and status actions.
- Produces:

```ts
export interface NotificationOwner { serverUrl: string; publicKey: string }
export interface NotificationEventInput {
  id: string;
  type: NotificationType;
  createdAt: number;
  status?: NotificationStatus;
  payload?: NotificationPayload;
}
export function publishNotification(owner: NotificationOwner, event: NotificationEventInput): void;
export function updateNotificationEvent(
  owner: NotificationOwner,
  id: string,
  status: NotificationStatus,
  payload?: NotificationPayload,
): void;

export function startNotificationRuntime(owner: NotificationOwner): () => void;
export function recordMergeAbsorbed(
  owner: NotificationOwner,
  input: {
    mergeProposalId: string;
    sourceInitiativeId: string;
    sourceTitle?: string;
    targetInitiativeId: string;
    targetTitle?: string;
    communityId: string;
  },
): void;

export interface CallInviteOffer {
  eventId: string;
  ownerPublicKey: string;
  candidate: CallParticipant;
  createdAt: number;
  dayKey: string;
  status: 'pending' | 'consumed' | 'expired';
}

export function startDemoNotificationRuntime(owner: NotificationOwner): () => void;
export function simOfferCallInvite(owner: NotificationOwner): CallInviteOffer | null;
export function simJoinAsVerifier(
  owner: NotificationOwner,
  offerEventId?: string,
): CallSession;
export function joinAsVerifier(ctx: VerificationCtx, offerEventId?: string): Promise<CallSession>;
```

- [ ] **Step 1: Implement the owner-guarded event bridge**

Read `store.getState().notifications.storageScope`; publish/update only when it equals
`buildNotificationsScope(owner.serverUrl, owner.publicKey)`. Dispatch Task 1 actions and never
write localStorage directly from this service.

Create `src/services/notifications.ts` as the public seam: it delegates authenticated runtime
startup to `startDemoNotificationRuntime` on `ui` and exposes the typed stable merge helper.
React contexts/components never import from `src/services/demo/` or dispatch producer actions.

- [ ] **Step 2: Prime W1 incoming requests explicitly at runtime start**

Add `demoPrimeRequestNotifications(owner)` to ensure the existing seeded request state and publish
one `verification-request:<requestId>` event for each pending request only when the owner is
verified. `demoRespondToRequest` marks that id consumed. This function is called by the auth
runtime, not `getVerificationState`, so a component fetch cannot manufacture the event.

- [ ] **Step 3: Publish W1 approvals after the vouch succeeds**

Pass `NotificationOwner` into `demoRequestVouch`. When the deterministic outcome is approved,
bank the distinct direct vouch first, then publish `approval-received:<requestId>` with approver
key/name. Declines publish nothing. Repeated settlement upserts the same id.

- [ ] **Step 4: Add a deterministic W2 call-offer registry**

In `verificationSim`, choose `simPendingCandidate()` and key one pending offer per UTC day and
owner. Publish `call-invite:<candidateKey>:<dayKey>:<ownerKey>` only for a currently verified owner.
`simJoinAsVerifier(owner, eventId)` validates pending ownership, uses its candidate, marks it
consumed and creates the existing manual verifier-role call. Direct calls without an id preserve
the S37 path. Map a consumed event to the session so `simLeaveCall` marks it expired.

- [ ] **Step 5: Start and clean one auth runtime**

`startDemoNotificationRuntime` primes W1 requests and offers W2 call work, then returns cleanup
that expires outstanding tab offers and cancels Task 3 reminder timers. In `AuthContext`, call it
through `startNotificationRuntime` after notification hydration for an authenticated owner and invoke cleanup on identity change or
logout. Guard development simulation behavior inside services; components see only the public seam.

- [ ] **Step 6: Consume `?invite=` in CallFlow**

Read `useSearchParams().get('invite')`, pass it to `joinAsVerifier(ctx, inviteId || undefined)`,
and keep the frozen role and existing cleanup rules. An invalid/expired offer uses the existing
retryable/no-one-available state without creating a different person's call.

- [ ] **Step 7: Move merge publication behind the event service**

After the accepted merge's cross-contract work completes, call a named service helper with
`merge-absorbed:<proposal.id>:<sourceId>:<targetId>`. Remove `useAppDispatch` and direct
`addNotification` construction from `MergeProposalsList`; existing merge navigation payload stays.

- [ ] **Step 8: Verify W1/W2 transitions**

Run typecheck and build. Using verified and partial demo states, confirm pending W1 requests create
one event each, approval creates one event only after the vouch, decline creates none, one W2 offer
appears per UTC day, `?invite=` consumes the matching offer, and leave expires it. Re-run runtime
start and callbacks; ids and counts do not change.

- [ ] **Step 9: Commit**

```bash
git add src/services/notificationEvents.ts src/services/notifications.ts \
  src/services/demo/notificationRuntime.ts \
  src/services/verificationModel.ts src/services/verification.ts \
  src/services/demo/verificationDemo.ts src/services/demo/verificationSim.ts \
  src/contexts/AuthContext.tsx src/components/identity/verification/CallFlow.tsx \
  src/components/collaboration/flows/merge/MergeProposalsList.tsx
git commit -m "feat(s39): publish stable verification notifications"
```

### Task 3: Move daily reminders and W3 events into the tab runtime

**Files:**
- Modify: `src/services/demo/notificationRuntime.ts`
- Modify: `src/services/demo/dailyVerificationSim.ts`
- Modify: `src/services/verification.ts`
- Modify: `src/components/identity/verification/DailySession.tsx`
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/sw.ts`

**Interfaces:**
- Produces:

```ts
export interface DailyReminderRegistration {
  dayKey: string;
  joinOpensAt: number;
}
export function scheduleDemoDailyReminder(
  owner: NotificationOwner,
  reminder: DailyReminderRegistration,
): void;
export function cancelDemoDailyReminder(owner: NotificationOwner, dayKey: string): void;
export function isDemoDailyReminderEnabled(owner: NotificationOwner, dayKey: string): boolean;
```

- [ ] **Step 1: Store full owner context on each daily run**

Change only `simDailySessionState` construction to receive `serverUrl` with owner public key; keep
the public eight-function seam unchanged. Later daily actions recover the server URL from `DailyRun`
after ownership validation.

- [ ] **Step 2: Implement route-independent reminder scheduling**

Key registrations and timers by owner scope plus day. Re-register replaces the timer; disable
cancels it. When `joinOpensAt <= serviceNow(owner)` publish immediately; otherwise schedule the
absolute delay. Emit `daily-reminder:<dayKey>:<ownerKey>` once and re-check active owner scope in
the callback. Route unmount does not cancel; auth-runtime cleanup does.

- [ ] **Step 3: Connect the existing reminder seam**

`simSetDailyReminder` calls schedule/cancel and updates the snapshot. `createRun` reads the runtime
preference for its day. Preserve S38's owner guard and reminder choice semantics; no persisted or
browser-level reminder is added.

- [ ] **Step 4: Publish selection and thanks at their owned transitions**

In `selectRun`, publish `verifier-selected:<runId>:<ownerKey>` only for the frozen
`selectedVerifier` assignment. On daily finish, publish one `session-thanks:<runId>:<ownerKey>`
with frozen role, candidate name and achieved result. Finishing/leaving marks any selection event
expired; candidate and observer never receive a selected-verifier claim.

- [ ] **Step 5: Update reminder honesty in all three languages**

Keep `verification.daily.reminder` labelled demo. Change `verification.daily.reminderHelp` to the
meaning: "This demo can remind you elsewhere in Gloki while this tab stays open. Reloading or
closing the tab clears it." Preserve French/Swahili key and token parity.

- [ ] **Step 6: Verify the W3 producer matrix**

Use join-window, selected-verifier, observer and partial presets. Confirm reminder fires once after
route-away, reload clears the pending runtime, account change prevents delivery, only selected role
gets selection, and every completed role gets one role-accurate thanks. Reconcile/select/finish
twice and confirm no duplicate ids.

- [ ] **Step 7: Commit**

```bash
git add src/services/demo/notificationRuntime.ts src/services/demo/dailyVerificationSim.ts \
  src/services/verification.ts src/components/identity/verification/DailySession.tsx \
  src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s39): deliver tab-lifetime daily notifications"
```

### Task 4: Build the shared NotificationItem

**Files:**
- Create: `src/components/shared/NotificationItem.tsx`
- Create: `src/components/shared/NotificationItem.module.scss`
- Modify: `src/components/shared/index.ts`

**Interfaces:**
- Consumes: Task 1 `AppNotification` only as the caller's key/status; the primitive remains
  type-agnostic.
- Produces:

```ts
export interface NotificationItemProps {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  timestamp: string;
  unread: boolean;
  unreadText: string;
  action?: React.ReactNode;
  readControl: React.ReactNode;
}
```

- [ ] **Step 1: Implement semantic row markup**

Render an `<article>` with icon hidden when decorative, title, optional body, `<time>`, visible
unread text/marker, action slot and read-control slot. Do not make the whole row a button and do not
nested-button-wrap the slots.

- [ ] **Step 2: Implement token-only responsive styles**

Use card/border/surface/text tokens, a marker plus font weight for unread, `min-width: 0` wrapping,
44px control floors, `@include dark`, and reduced-motion-safe transitions. At 360px actions wrap
below content without horizontal overflow.

- [ ] **Step 3: Export through the shared barrel and verify**

Run typecheck, grep the module for raw hex/raw px/raw `rgba`, and render a temporary centre-owned
sample only during Task 5. Confirm focus order follows content then actions.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/NotificationItem.tsx \
  src/components/shared/NotificationItem.module.scss src/components/shared/index.ts
git commit -m "feat(s39): add shared notification item"
```

### Task 5: Build the localized centre and safe action resolver

**Files:**
- Create: `src/components/identity/notifications/NotificationCenter.tsx`
- Create: `src/components/identity/notifications/NotificationCenter.module.scss`
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/sw.ts`

**Interfaces:**
- Consumes: Task 1 selectors/actions and Task 4 `NotificationItem`.
- Produces: default `NotificationCenter` route component.

- [ ] **Step 1: Resolve every type to localized presentation**

Create a pure local `presentNotification(notification, t)` switch returning icon, title, body and
optional `{ label, to }`. Validate required payload primitives in each branch. Use neutral fallback
copy for missing names and omit actions for incomplete payloads. Unknown records should already be
sanitized out, but keep a default exhaustive guard returning null.

- [ ] **Step 2: Apply the exact action rules**

Merge opens the target initiative only with both ids. Pending request opens approve only when
`status === 'active'`. Approval and reminder open their existing hub/daily routes. Call invite uses
the encoded `?invite=` route only while active. Selected verifier opens daily only while active.
Thanks has no action. Consumed/expired call and selection body copy states that the demo event ended.

- [ ] **Step 3: Render list/read controls and live status**

Use newest-first slice items, `formatTimeAgo(t, createdAt)`, a pre-mounted `aria-live="polite"`
status node, mark-all only when unread exists, and an EmptyState when no items survive presentation.
Action click dispatches `markRead` before navigation; entering the page alone changes nothing.
Read/unread controls update the one live status string.

- [ ] **Step 4: Add complete fr/sw copy**

Add centre subtitle/empty/read/unread/mark-all/status strings; seven title/body families; expired,
missing-name and action labels. Task 6 exclusively owns bell count strings. Preserve every
`{name}`, `{count}` and `{title}` token exactly in both overlays. Prefer agreement-free count forms.

- [ ] **Step 5: Verify malformed and full states**

Inject one valid record of every type plus missing payloads, invalid timestamps, and old merge
records through scoped localStorage, then hydrate. Confirm seven useful rows, safe fallbacks, omitted
invalid records, no raw type strings, read/unread persistence, correct routes and no console error.

- [ ] **Step 6: Commit**

```bash
git add src/components/identity/notifications/NotificationCenter.tsx \
  src/components/identity/notifications/NotificationCenter.module.scss \
  src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s39): add the notification centre"
```

### Task 6: Replace the bell dropdown and register the nested route

**Files:**
- Modify: `src/components/shared/NotificationsBell.tsx`
- Modify: `src/components/shared/NotificationsBell.module.scss`
- Modify: `src/pages/IdentityView.tsx`
- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/sw.ts`

**Interfaces:**
- Consumes: Task 5 centre route.
- Produces: global bell navigation and `/identity/notifications`.

- [ ] **Step 1: Reduce the bell to one navigation control**

Replace dropdown state/items/rendering with a `Link` to `/identity/notifications`. Select unread
count only; show `Math.min(count, 99)` plus `+` over 99 and keep actual count in the accessible label.
Zero count label remains the localized Notifications label. Do not mark anything read from the bell.

- [ ] **Step 2: Remove obsolete dropdown styles**

Keep the inherited icon color, position, focus ring and proven 44px pseudo-target. Keep badge tokens,
replace raw dimensions with existing size/text tokens where available, and delete dropdown/header/item
rules. Recheck homepage and light/dark inner headers.

- [ ] **Step 3: Register title and nested route**

Import `NotificationCenter`, add `titles.notifications` with Account eyebrow, and add
`<Route path="notifications" element={<NotificationCenter />} />`. `showBack` should include this
identity subpage and return to the verification hub or previous account surface without touching
`App.tsx`.

- [ ] **Step 4: Finish bell translations and verify**

Add singular/plural-safe accessible count copy in fr/sw. At counts 0, 1, 9 and 100, inspect visible
badge and accessible name. Confirm direct navigation, browser Back, keyboard focus, one h1, and no
dropdown DOM.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/NotificationsBell.tsx \
  src/components/shared/NotificationsBell.module.scss src/pages/IdentityView.tsx \
  src/i18n/fr.ts src/i18n/sw.ts
git commit -m "feat(s39): link the notification bell to its centre"
```

### Task 7: Complete backend handoff, i18n packet and automated gates

**Files:**
- Modify: `docs/FOR_OURI_seam.md`
- Modify: `docs/i18n-native-review-candidates.md`
- Modify: `docs/superpowers/plans/2026-09-10-s39-notification-centre.md` (execution ledger)

**Interfaces:**
- Consumes: Tasks 1–6 as-built function names and achieved copy.
- Produces: Ouri handoff and reviewable evidence ledger.

- [ ] **Step 1: Add the S39 FOR_OURI addendum**

List the as-built publication, status update, authenticated runtime, call-offer, daily schedule and
cancel functions with wire method `none — simulation/UI lifecycle only`. State separately that a real
system needs authenticated recipient routing, stable server event ids, replay/cursor semantics,
account isolation and off-route delivery. Explicitly forbid invented notification/daily contract methods.

- [ ] **Step 2: Append the Session 39 native-review packet**

For every new/changed fr/sw key, include English gloss, exact French, exact Swahili and context. Flag
bell-count grammar, "read" state, demo expiry, call-invite register and the tab-lifetime reminder
disclosure for native review. Cross-check every cited key against both overlays and a live `t()` call.

- [ ] **Step 3: Run final static gates sequentially**

```bash
npx --no-install tsc -b --noEmit
npm run build
npm run build:prod
sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh
node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs
git diff --check
```

Expected: zero TypeScript/build errors; only pre-existing Sass deprecation warnings; all grep gates
clean; fr/sw identical key and token sets; no whitespace errors.

- [ ] **Step 4: Run targeted architecture gates**

```bash
rg -n "communityNotifications'|communityNotifications\"" src
rg -n "Math\.random|Date\.now.*slice" src/store/slices/notificationsSlice.ts src/services/notificationEvents.ts
rg -n "addNotification|upsertNotification" src/components --glob '*.tsx'
rg -n "Notification\.requestPermission|getUserMedia|RTCPeerConnection" src/components/identity src/services
rg -n "join_daily|select_verifiers|create_notification|schedule_reminder" src docs/FOR_OURI_seam.md
git diff 5a8ea4f -- src/services/demo/fixtures src/services/demo/mockApi.ts
```

Expected: only the named legacy-key constant; no random notification ids; no component domain
producer dispatch; no new media/browser notification API; forbidden wire names only in explicit
"do not invent" prose; empty fixture/version diff.

- [ ] **Step 5: Commit docs and evidence so far**

```bash
git add docs/FOR_OURI_seam.md docs/i18n-native-review-candidates.md \
  docs/superpowers/plans/2026-09-10-s39-notification-centre.md
git commit -m "docs(s39): record notification seam and translation handoff"
```

### Task 8: Controller browser matrix, adversarial review and closeout

**Files:**
- Modify only files required by confirmed review findings.
- Modify: `MASTER_TODO.md`
- Create: `docs/session-prompts/session-40-next-roadmap.md`
- Modify: `docs/superpowers/plans/2026-09-10-s39-notification-centre.md`

**Interfaces:**
- Consumes: complete S39 diff from base `5a8ea4f`.
- Produces: reviewed local branch and push-gate summary.

- [ ] **Step 1: Walk account privacy and persistence**

At 360×780, create/read notifications as owner A, reload, switch to owner B, logout, then return to A.
Observe only A's records and read states on A; B/logout must expose none. Confirm legacy deletion and
100-item cap in localStorage/Redux.

- [ ] **Step 2: Walk every producer and action**

Exercise W1 incoming request and approved/declined outgoing request; W2 pending offer, consume, call
leave and expired fallback; W3 reminder after route-away, selected verifier, observer and thanks;
accepted merge when reachable. Trigger repeated runtime start, reads, timer reconciliation and action
double taps; each stable id remains one row.

- [ ] **Step 3: Walk the full UI/a11y matrix**

Check centre and bell at 360px in light/dark and en/fr/sw; counts 0/1/9/100; valid/expired/malformed
records; keyboard through mark-all, actions and read toggles; visible focus; exactly one h1; measured
44px targets; no overflow; reduced-motion; pre-mounted live status and accessible names. Record audible
screen-reader verification as manual/pending unless actually performed.

- [ ] **Step 4: Run a whole-session adversarial review**

Review `git diff 5a8ea4f` against the approved spec with special attention to cross-account privacy,
runtime cleanup, cyclic imports, status races, false claims, action expiry, StrictMode duplicates,
i18n tokens and dark/360px behavior. Rank blocker/major/minor against the two north stars. Fix every
confirmed blocker/major, rerun affected browser paths and all final static gates, then commit fixes.
Do not run the local multi-model panel without separate permission.

- [ ] **Step 5: Close the session truthfully**

Update P11 W4 and prepend the S39 changelog with actual commit range, owner-key migration, reminder
lifetime, `global-v19` unchanged, i18n delta, browser coverage, review verdict and push state. Write the
S40 prompt from the verified remaining roadmap with a mandatory premise-recheck section. Update the
plan execution ledger with exact evidence and remaining manual checks.

- [ ] **Step 6: Commit closeout and stop at the push gate**

```bash
git add MASTER_TODO.md docs/session-prompts/session-40-next-roadmap.md \
  docs/superpowers/plans/2026-09-10-s39-notification-centre.md
git commit -m "docs(s39): close notification centre session"
```

Present the reviewed diff and concrete evidence. Do not push until Eston explicitly says to push.

---

## Execution ledger

- Planning baseline, 2026-09-10: local `ui` `5a8ea4f`; cached `origin/ui` `ac8523b`; only `.agents/`
  untracked. Baseline typecheck, local build, grep gates, parity 1413/1413 and whitespace passed.
- Design approved by Eston and committed as `74fe1a0`.
- Implementation, browser evidence, review and push remain pending.
