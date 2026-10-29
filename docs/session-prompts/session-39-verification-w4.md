# Session 39 — Prompt 2 Wave 4: notification centre and bell

## Context recap (as of 2026-09-09, `ui` at S38, not pushed)

S38 built Prompt 2 Wave 3 at `/identity/verification/daily`: real 21:00 UTC scheduling, a five-minute
join window, a 2m30s selection deadline, lobby, deterministic groups of at most four, candidate,
selected-verifier, observer, empty and partial branches, shared simulated calls, and truthful results.
The verified-member row on the hub is now the verifier's product door; candidates see the fourth
pathway card. Daily lifecycle is in-memory and vouches alone persist with `method: 'daily'`.

The implementation has **eight public daily seam functions** in `src/services/verification.ts`:

1. `dailySessionState`
2. `joinDailyStream`
3. `joinDaily`
4. `selectVerifiers`
5. `enterDailyCall`
6. `finishDailyCall`
7. `setDailyReminder`
8. `leaveDaily`

All eight are simulation-only and have no contract wire method. The durable write remains the S36
`vouch(public_key, 'daily')` concept. Do not invent `join_daily`, `select_verifiers`, or notification
contract methods without Ouri coordination.

S38 did **not** change fixtures or `DEMO_VERSION` (`global-v19`). French/Swahili parity reached
1413/1413. Its native strings remain machine drafts in `docs/i18n-native-review-candidates.md`.

## Re-verify before planning

- Compare local `ui`, cached `origin/ui`, and `git status`; read every commit after S38's saved base
  `ac8523b`. Do not assume the commit ids or push state in this prompt stayed current.
- Confirm `/identity/verification/daily` and both hub doors still exist.
- Read `src/store/slices/notificationsSlice.ts` and `src/components/shared/NotificationsBell.tsx`.
  At S38 they support only `merge_absorbed`; the bell is a dropdown, there is no notification-centre
  route, and the localStorage record is browser-wide rather than owner-keyed.
- Confirm there is still no `NotificationItem` in `src/components/shared/`.
- Run typecheck, build, grep gates and i18n parity before editing.

## Read first

1. `CLAUDE.md` and the project change-control, session-lifecycle, seam/demo, i18n, governance and QA skills.
2. `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3.3 Wave 4.
3. `docs/superpowers/specs/2026-09-02-s34-decision-record.md` D8, D9, F9 and F10.
4. `docs/superpowers/specs/2026-09-09-s38-verification-w3-design.md` and
   `docs/superpowers/plans/2026-09-09-s38-verification-w3-sol.md` for the lifecycle now available.
5. `docs/FOR_OURI_seam.md` S36–S38 addenda.

## Wave 4 scope

Extend `NotificationType` from `merge_absorbed` to:

- `verification_request`
- `call_invite`
- `approval_received`
- `daily_reminder`
- `verifier_selected`
- `session_thanks`

Build a shared `NotificationItem`, a centre at `/identity/notifications` nested inside
`IdentityView`, type-specific copy/actions, read/unread controls, and a bell that exposes the unread
count and links to the centre. Keep verification platform-wide (D8) and the route nested (D9).

Define producer ownership before editing. W1 request/approval producers live behind the verification
seam; W2 call events live in `verificationSim.ts`; W3 selection and completion transitions live in
`dailyVerificationSim.ts`. Components may dispatch UI read actions, but durable domain events should
not be manufactured from render effects. Keep notification ids and duplicate suppression stable
under StrictMode and repeated simulation callbacks.

## Decisions that need explicit treatment

- **Reminder limitation:** S38 `setDailyReminder` stores an owner-keyed choice in memory while the tab
  remains open and explicitly sends no reminder. The daily runtime is destroyed when the route is
  left, so it cannot honestly promise a later notification. Decide whether W4 seeds a clearly labelled
  demo reminder, keeps the setting informational, or introduces an app-level scheduler with explicit
  lifetime and cleanup. Do not silently turn the current checkbox into a background promise.
- **Account scope:** the current notification localStorage key is shared by every demo identity in the
  browser. Decide and document owner-keyed migration before adding personal verification events.
- **Inline actions:** map each type only to a route/action that exists. A daily reminder may open
  `/identity/verification/daily`; verifier selection is meaningful only while its in-memory run still
  exists. Expired events need honest fallback copy, not a broken action.
- **Fixtures and versioning:** if notification fixtures or persisted seed shape change, bump
  `DEMO_VERSION` exactly once and document the reset. Pure runtime producers do not require a bump.
- **Call scheduling follow-up:** S37's “Schedule for later” remains deferred until this centre can
  honestly deliver an invite/reminder. Reassess it only after the notification lifecycle works; do not
  pull the old 7×12 grid in by default.

## Acceptance bar

- All seven types render useful localized copy; malformed/old persisted items degrade safely.
- Unread count, individual read, mark-all-read and centre navigation persist correctly per signed-in
  owner; logout/account switch cannot expose another person's verification events.
- W1 request and approval, W2 invite/call, and W3 reminder/selection/thanks each have a reachable,
  deterministic demo walkthrough without duplicate events.
- Notification actions lead to existing states or explain expiry. No event claims a call, reminder,
  selection, or approval that did not occur.
- One AppHeader h1, 44px controls, keyboard/focus pass, quiet live announcements, 360px light/dark in
  English/French/Swahili, reduced motion, typecheck/build/grep/parity clean.
- Update the FOR_OURI seam with explicit “none” rows for simulation-only notification lifecycle and
  document any real transport/auth requirement separately.
- Whole-session adversarial review before the push gate. Do not run the local multi-model review panel
  or push without Eston's separate explicit authorization.
