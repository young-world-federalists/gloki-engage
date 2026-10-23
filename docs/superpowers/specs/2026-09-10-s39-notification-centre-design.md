# S39 — Notification centre and bell design addendum

Date: 2026-09-10. Implementation base: `ui` at `5a8ea4f`.

Parent: [S34 §3.3 Wave 4](2026-09-02-s34-review-causes-impact-verification-design.md).
Carry-forward decisions: [S34 D8, D9, F10](2026-09-02-s34-decision-record.md),
[S38 daily lifecycle](2026-09-09-s38-verification-w3-design.md), and
[S39 handoff](../../session-prompts/session-39-verification-w4.md).

## Authorization and scope

Eston approved the direction on 2026-09-10: owner-scoped notification persistence,
deterministic domain-event producers, a tab-lifetime in-app reminder scheduler, a shared
`NotificationItem`, a nested notification centre, and a bell that links to the centre.
The old 7×12 call-scheduling grid remains deferred.

Wave 4 closes the permanently-empty bell follow-up. It does not add browser notification
permission, email, push delivery, a service worker, WebRTC, new contract methods, or a
background promise that survives reload or tab closure. Verification remains platform-wide
on the Digital Agent (D8), the route remains inside `IdentityView` (D9), and all video entry
points retain F10's camera/data disclosure and text-vouch alternative.

## Re-grounded premises

The prompt was checked against local HEAD before design:

- Local `ui`, HEAD and the branch ref are `5a8ea4f`; cached `origin/ui` is `ac8523b`, so
  S38 is seven local commits ahead and has not been pushed. The only worktree item is the
  user's pre-existing untracked `.agents/` directory.
- `/identity/verification/daily`, its candidate pathway card, and its verified-volunteer
  hub row exist.
- `src/services/verification.ts` exposes all eight S38 daily seam functions. They remain
  simulation-only; the only durable daily write is the existing `vouch(public_key, 'daily')`
  concept.
- `notificationsSlice.ts` still supports only `merge_absorbed`, loads the browser-wide
  `communityNotifications` key at module initialization, and creates random ids.
- `NotificationsBell` is still a dropdown. There is no `/identity/notifications` route and
  no shared `NotificationItem`.
- Baseline `tsc -b --noEmit`, local build, grep gates, `git diff --check`, and i18n parity
  pass. French and Swahili are at 1413/1413; `DEMO_VERSION` is `global-v19`.

## Product behavior

### Bell and centre

The bell remains in the single `AppHeader`. It shows the signed-in owner's unread count and
acts as a direct link to `/identity/notifications`; it no longer opens a dropdown. The
accessible label includes the unread count when non-zero. A count above 99 renders `99+`
visually while the accessible label retains the actual total.

`NotificationCenter` is registered as `notifications` inside `IdentityView`'s wildcard;
`App.tsx` is untouched. `IdentityView` supplies the page's one `AppHeader` h1 and a back
action. The centre has:

- newest-first notifications through shared `NotificationItem` rows;
- a visible unread distinction that does not rely on colour alone;
- per-item mark read / mark unread controls;
- mark-all-read, shown only when unread items exist;
- a proper empty state; and
- one pre-mounted polite live region for read-state updates, never timestamps or countdowns.

Opening a notification's valid action marks it read. Merely entering the centre does not.
All controls meet the 44px floor and retain visible focus. `NotificationItem` owns icon,
localized title/body, `formatTimeAgo` timestamp, unread marker, optional inline action, and
read-state control; it owns no routing or domain state.

### Event copy and actions

All seven types render localized, useful copy. Actions exist only when they lead to a
truthful current surface:

| Type | Event shown to the current owner | Action |
|---|---|---|
| `merge_absorbed` | A supported initiative was absorbed into another | Open the target initiative when target and community ids are valid; otherwise informational fallback |
| `verification_request` | A member asked this verified owner to vouch | Open `/identity/verification/approve` while the request is pending; settled/malformed records explain that it is no longer pending |
| `approval_received` | The owner's outgoing request was approved | Open `/identity/verification` |
| `call_invite` | A fixture candidate is waiting for this verified owner in the demo | Open `/identity/verification/call?invite={eventId}` while the tab-scoped offer is pending; accepting or expiring it removes the action |
| `daily_reminder` | The daily join window opened | Open `/identity/verification/daily` |
| `verifier_selected` | The owner was selected to verify the named candidate | Open the active daily run only while it still exists; leaving/finishing marks the event expired |
| `session_thanks` | The owner's daily participation finished | Informational; includes role-accurate outcome copy and no dead action |

Missing optional names use neutral localized fallbacks. Unknown types, invalid payloads,
invalid timestamps, duplicate ids, and oversized persisted arrays are sanitized at hydration;
they never crash the header or centre. Recognized old merge records with missing optional
fields remain readable. Unrecognized records are omitted rather than exposed as raw internal
type strings.

## Ownership, persistence and privacy

### Owner-scoped store

The notification Redux state gains `storageScope: string | null`, mirroring the proven
`flowContractsSlice` hydration pattern. `buildNotificationsScope(serverUrl, publicKey)`
returns `${encodeURIComponent(serverUrl)}::${publicKey}`; persistence uses
`communityNotifications:<scope>`. `AuthContext` hydrates the matching notification scope
whenever either identity field changes and hydrates `null` on logout, immediately emptying
the visible list.

The old `communityNotifications` record has no owner metadata. Assigning it to whoever logs
in next would expose another person's verification events, so hydration removes that legacy
key without migration. This one-time notification-history reset is documented in the S39
changelog and push handoff. It is separate from demo fixtures and does not justify a
`DEMO_VERSION` bump.

Every mutating reducer persists the current scoped collection. Hydration validates plain
objects, recognized types, non-empty ids, finite timestamps, booleans, and plain-object
payloads; keeps at most 100 unique newest-first items; and never reads another scope.

### Deterministic publication

Domain producers call a small notification service; components do not manufacture durable
events from mount/render effects. Publication carries the owner scope and a stable event id.
The reducer ignores a publication for a scope other than the currently hydrated scope and
upserts by id, so StrictMode replay, repeated reads, timer reconciliation, and repeated sim
callbacks cannot duplicate an event.

Stable ids derive from the domain record, not time or randomness:

- `verification-request:<requestId>`
- `approval-received:<requestId>`
- `call-invite:<candidatePublicKey>:<dayKey>:<ownerPublicKey>`
- `daily-reminder:<dayKey>:<ownerPublicKey>`
- `verifier-selected:<dailyRunId>:<ownerPublicKey>`
- `session-thanks:<dailyRunId>:<ownerPublicKey>`
- merge producers supply a stable source/target merge id rather than reducer-generated entropy.

Upserting an existing event may update its payload/status but preserves its original
`createdAt` and read state. Expiring an event never creates a replacement.

## Producer matrix

Producer ownership stays with the service module that owns the underlying transition:

| Producer | Attachment point | Duplicate / truth guard |
|---|---|---|
| W1 incoming request | When `verificationDemo` creates or explicitly resets its seeded incoming request state | Request id; only current verified owner; no render-effect dispatch |
| W1 approval received | After `demoRequestVouch` settles approved and the distinct vouch is banked | Request id; declined requests emit nothing |
| W2 call invite | The authenticated notification runtime asks `verificationSim` for one deterministic pending candidate for a verified owner | Candidate + UTC day + owner id; accepting the offer creates the existing verifier-role call and marks the event consumed; call end marks it expired |
| W3 reminder | App-level tab scheduler at the upcoming run's `joinOpensAt` | Day + owner id; setting off cancels; fired ids suppress repeats |
| W3 selected verifier | `dailyVerificationSim.selectRun`, only for `selectedVerifier` | Run + owner id; observer/candidate emit no selection claim |
| W3 thanks | The daily completion transition for the current owner | Run + owner id; role and result are frozen from the run |
| Existing merge | The accepted-merge action after its cross-contract work completes | Stable source + target id; no random reducer id |

The dev scenario switcher may reset the existing W1 scenario and daily clock/roster inputs,
but it does not bypass these producers or insert arbitrary outcome notifications. The normal
producer path therefore remains the deterministic walkthrough path.

The call invitation is an event-driven verifier door, not a standing hub card. On authenticated
runtime start, a verified owner gets at most one pending demo offer for the UTC day. Its action
adds only a query parameter to the already-approved nested call route. `CallFlow` passes that
event id through the seam when creating the existing `joinAsVerifier` session; the simulation
verifies that the offer belongs to the active owner and candidate before consuming it. Direct
navigation keeps the existing W2 behavior. This preserves S38's ruling that the daily session is
the standing verifier door while making the W4 call invitation type useful and honest.

## Reminder lifecycle

S38's reminder choice currently dies with neither a notification nor an honest delivery
path. S39 moves reminder ownership from the daily route runtime into a small app-level
simulation scheduler keyed by notification scope:

1. `setDailyReminder(true)` registers the upcoming run's `dayKey` and `joinOpensAt`.
2. The scheduler remains alive when `/identity/verification/daily` unmounts, so navigating
   elsewhere inside Gloki can produce a real in-app `daily_reminder` at the bell.
3. Setting it false cancels the pending timer. Re-registering the same day replaces the
   timer without duplicating the event.
4. Authentication changes cancel the previous owner's pending timers before notification
   hydration. Reload/tab close clears the scheduler naturally; no localStorage reminder,
   browser notification API, service worker, or operating-system delivery is introduced.
5. The daily UI changes its helper to say that the demo can remind the user elsewhere in
   Gloki while this tab stays open, and that reload or tab closure clears it.

The existing dev join-window clock preset makes the producer deterministic: enabling a
reminder whose simulated `joinOpensAt` is already due emits once immediately. Timer callbacks
still verify the active owner scope before publication.

## Simulation seam and backend handoff

The UI reads notification state from Redux and uses UI actions for read/unread controls.
`AuthContext` starts and cleans up one owner-scoped notification runtime after identity
hydration; this is an authentication lifecycle event, not a page-render producer. The runtime
primes existing W1 pending-request events and the one-per-day W2 demo offer, then owns reminder
timers. Verification domain events remain behind `src/services/verification.ts` and its demo modules.
No component imports `verificationDemo`, `verificationSim`, `dailyVerificationSim`, or a demo
notification scheduler.

`docs/FOR_OURI_seam.md` receives an S39 addendum with explicit `none` rows for the simulated
notification publication, expiry, reminder scheduling/cancellation, and subscription-free
Redux read-state lifecycle. The durable real implementation needs authenticated recipient
routing, server event ids, replay/cursor semantics, account isolation, and a transport capable
of delivering request/approval/call/selection events while their routes are not mounted.
Those are transport/auth requirements, not Digital Agent contract methods. Do not invent
`create_notification`, `schedule_reminder`, `join_daily`, or `select_verifiers` wire methods.

## Fixtures, versioning and deferred scheduling

No file under `src/services/demo/fixtures/` and no seed shape changes. Existing W1 requests,
W2 sessions, and W3 scenarios exercise the producers. `DEMO_VERSION` therefore stays
`global-v19`; bumping it would erase unrelated user demo activity for no benefit.

The W2 "Schedule for later" grid remains deferred. A notification centre can display an
invite, but the product still cannot match real verifier availability or promise delivery
after the tab closes. Reintroducing 84 time toggles would claim a capability S39 does not add.

## Accessibility, i18n and visual constraints

- One `AppHeader` h1; notification item headings begin at h2-level semantics without adding
  multiple page h1s.
- Token-only SCSS, `@include page-column`, `$footer-clearance`, and `@include dark`; no ad-hoc
  dimensions, colours, or raw media queries.
- Every interactive target is at least 44×44px. Visible text is the accessible name where an
  action has a caption; icon-only read toggles receive localized labels.
- Unread state uses marker + weight + accessible text, not colour alone. Dynamic read-state
  updates use one quiet polite region. Relative timestamps are not announced as live updates.
- Reduced motion disables decorative transitions without changing state.
- Every new string uses inline English plus matching French and Swahili overlays and is appended
  to the Session 39 native-review packet. Agreement-free count wording is required.
- Controller verification covers 360px light/dark in English, French and Swahili, keyboard
  order/focus, accessible names, exact h1 count, and measured targets.

## Acceptance and evidence

The implementation is complete only when:

- account switch/logout immediately hides the previous owner's items, and returning to an
  owner restores only that owner's read states;
- legacy browser-wide storage is removed once and never assigned to a user;
- all seven event types render localized useful copy and malformed records degrade safely;
- individual read/unread, mark-all-read, unread badge and navigation persist after reload;
- W1 request/approval, W2 invite, and W3 reminder/selection/thanks each have a deterministic
  producer walkthrough with no duplicate event under repeated callbacks;
- expired calls/selections show truthful fallback copy and no broken action;
- reminder survives route changes but not reload/tab close, exactly matching its disclosure;
- there are no component-side domain notification dispatches, new contract wire methods,
  fixture changes, or `DEMO_VERSION` bump;
- typecheck, local and production builds, grep gates, i18n parity, whitespace, targeted producer
  greps, and the full 360px/a11y matrix pass; and
- a whole-session adversarial review is resolved before the push gate. The local multi-model
  panel and any push still require Eston's separate explicit authorization.
