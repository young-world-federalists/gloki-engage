# UI Repairs and Production Web of Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use checkbox steps for tracking. Planning does not authorize deployment or resolve the product gates below.

**Goal:** Repair the evidenced visual defects and turn the existing verification demo into an authoritative, accessible Web of Trust, delivering daily verification before availability-based scheduling.

**Architecture:** Retain React screens and the `src/services/verification.ts` seam. Ouri owns authoritative global approval/access enforcement and a separate off-contract orchestration service for selection, video, presence, scheduling, notifications, and abuse enforcement. Components never contact a real server directly; production adapters belong inside `src/services/`.

**Tech Stack:** React 19, TypeScript, Redux Toolkit, SCSS Modules, existing contract API; production orchestration and embedded video technology selected jointly with Ouri.

**Spec:** [Sol synthesis and requirement ledger](../../reviews/2026-09-17-ui-wot/sol-synthesis.md), informed by [provenance](../../reviews/2026-09-17-ui-wot/provenance.md), [UI review](../../reviews/2026-09-17-ui-wot/terra-wot-ui.md), [backend review](../../reviews/2026-09-17-ui-wot/terra-wot-backend.md), and [style review](../../reviews/2026-09-17-ui-wot/terra-styles.md).

## Global constraints and evidence boundary

- Baseline: local `f606d9f`; latest successful deployment observed: `server-side` `a81218f`, September 2, 2026. The newer verification screens were not in that deployment. External running server behavior remains unseen.
- Live observations cover login/organization dialog in dark mode at 1280×720 and 360×800. Authenticated routes, light mode, calls, and backend behavior still need runtime evidence.
- Follow `CLAUDE.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and `docs/FOR_OURI_seam.md`. S36–S39 are intentional demo implementations, not failed production implementations.
- Preserve platform-wide verification on the Digital Agent, four distinct approvals, nested IdentityView routes, established notification ownership, display serif, locked brand blue, and the documented brand contrast exception.
- Use shared components, token-only SCSS, `dark` mixin, one page heading, 360px layout, 44×44 project touch floor, WCAG 2.1 AA checks, and i18n parity. Do not reopen unrelated typography, navigation, or brand decisions.
- No blockchain call lifecycle: S37–S39 explicitly exclude it. No invented contract methods or backend repository paths. New authoritative integration requires a recorded Ouri handoff.
- Browser/demo approvals, seeded personas, and localStorage must never become production verification evidence or bootstrap identities.
- Video is evidence supporting human judgment; copy must not promise proof of humanity, intelligence, or uniqueness.
- No implementation, builds, commits, pushes, provider purchase, or deployment are performed by this planning document.

## Execution status — 2026-09-17

- Track A's bounded source repairs are implemented. Local and production builds,
  whitespace checks, and project grep gates pass. Scoped login lint still reports six
  findings reproduced unchanged at baseline `f606d9f`.
- Rendered evidence confirms the repaired primary action, fonts, helper contrast, 44 px
  targets, selected-option contrast, keyboard activation/focus, modal focus behavior,
  360 px layouts, and desktop overflow. Runtime hover, isolated Button loading,
  disabled shared-select behavior, authenticated shared-select use, and the complete
  cross-product matrix remain open, so Track A is not marked release-accepted.
- B1 has a current frontend seam inventory, a proposed/unexecuted negative-case file,
  and Eston's 2026-09-17 G1 decision: all four remain approval pathways and random live
  calls are mandatory only for the video pathway. Reciprocal direct-approval consent,
  G2–G4, backend locations, wire schemas, and owner sign-off remain unresolved. B1 is
  a documentation draft, not a frozen authority contract.
- B2–B8 remain blocked by their recorded gates and dependencies. No commit, push,
  merge, provider purchase, deployment, or production-backend execution occurred.

## Delivery structure and blocking decisions

Two independently reviewable tracks: **A, visual repairs**, can start without WoT decisions; **B, production WoT**, proceeds through the gates below. Daily MVP is the first production milestone, not completion of the scheduled pathway. Both daily and scheduled verification are required for final scope completion.

| Gate | Decision owner | Required decision and recommended direction |
|---|---|---|
| G1 — approval policy | Eston/product | Resolve synchronous-video-only/randomness-always versus three known-contact pathways. Recommend preserving four pathways and explicitly restricting mandatory random live calls to the random-video pathway. If the absolute principles win, invitation/request/direct entry points become introductions to random calls and cannot independently add approval. Decide reciprocal consent for direct approval in the same record. |
| G2 — authority and trust root | Ouri + product/security | Choose authoritative global identity/status store, verified-pool bootstrap, signature/key-custody model, and protected-operation matrix. Bootstrap needs a documented trusted initial verifier population (at least four for daily; at least eight for scheduled draws), not demo migration. Enumerate which operations require verification under existing policies; public reads and currently permitted pending-user actions stay governed by those policies. |
| G3 — live-call policy and provider | Ouri + product | Agree daily timezone/time, attendance/quorum/decline rules, privacy and recording policy, provider constraints, and enforceable abuse rules. Recommend configurable daily time displayed locally, no recording by default, queue when fewer than four daily volunteers exist, and no account downgrade/ban in this release. Verifier exclusion/rate limits remain mandatory. Research current providers only during implementation. |
| G4 — scheduled matching | Ouri + product | Before scheduled implementation, define availability granularity, horizon, notice period, rescheduling/cutoff rules, and how earliest overlap with an 8–10-person random eligible pool is computed. Record tie-breaking and insufficient-pool behavior. Never silently substitute manual verifier choice. |

Recommendations are reviewable proposals, not recorded decisions. G1–G3 block enabling production verification; G4 blocks scheduled implementation. Smaller details belong to the task acceptance record, not a separate list of fifteen equal-priority questions. UI repairs and seam inventory can proceed now.

## File and interface map

Paths below are repository-relative and exact; `(new)` means proposed frontend or documentation file. Backend file locations must be supplied by Ouri in Task B1 after inspecting the actual server repository.

| Responsibility | Files |
|---|---|
| Login and shared control fixes | `src/pages/LoginPage.tsx`, `src/pages/LoginPage.module.scss`, `src/components/shared/Modal.module.scss`, `src/components/shared/SearchableSelect.module.scss`, `src/styles/globals.scss`; tokens only if needed in `src/styles/variables.scss` |
| Authoritative seam/types and adapters | `src/services/verification.ts`, `src/services/verificationModel.ts`, `src/services/trust.ts`, `src/services/api.ts`; `src/services/verificationTransport.ts` (new) |
| Status and access mirror | `src/hooks/useVerification.ts`, `src/hooks/useCommunityTrust.ts`, `src/components/community/StageGate.tsx`, `src/components/community/IdentityTrust.tsx`, `src/components/identity/agent/digitalAgentStore.ts` |
| Existing verification screens | All named components below live in `src/components/identity/verification/`: `VerificationHub.tsx`, `PathwayCards.tsx`, `WaitingRoom.tsx`, `CallFlow.tsx`, `VerifierPicker.tsx`, `InCallView.tsx`, `InCallVerifyAction.tsx`, `CallSummary.tsx`, `DailySession.tsx`, `DailySessionLobby.tsx`, `DailySessionResult.tsx`, `InvitePage.tsx`, `RequestPage.tsx`, `ApprovePage.tsx`, `ApprovalHistory.tsx` |
| New focused UI | `src/components/identity/verification/EmbeddedCall.tsx`, `AvailabilityPicker.tsx`, `AvailabilityPicker.module.scss`, `ScheduledSession.tsx`, `SessionHistory.tsx`, `PendingDirectory.tsx` (all new; directory conditional on G1) |
| Video adapter | `src/services/verificationVideo.ts` (new); provider SDK access stays here, tokens obtained through verification seam |
| Daily lifecycle | `src/hooks/useDailyVerification.ts`; existing `DailySession.module.scss`, `CallFlow.module.scss`, `VerificationPages.module.scss`, `VerificationHub.module.scss` in the verification component directory |
| Routes and translations | `src/pages/IdentityView.tsx`, `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts`, `docs/i18n-native-review-candidates.md` |
| Notifications | `src/services/notifications.ts`, `src/services/notificationEvents.ts`, `src/store/slices/notificationsSlice.ts`, `src/components/shared/NotificationItem.tsx`, `src/components/identity/notifications/NotificationCenter.tsx` |
| Contracts and test evidence | `docs/FOR_OURI_seam.md`; `docs/superpowers/specs/2026-09-17-production-wot-decisions.md`, `docs/reviews/2026-09-17-ui-wot/implementation-acceptance.md`, `docs/reviews/2026-09-17-ui-wot/service-contract-cases.json` (new) |

The existing demo files remain demo-owned: `src/services/demo/verificationDemo.ts`, `verificationSim.ts`, `dailyVerificationSim.ts`, and `notificationRuntime.ts`. Adapt their types only as needed to keep the demo runnable and clearly disclosed. Production must not fall back to these files after an error.

## Track A — visual repairs

### Task A1: Restore login hierarchy and readable form text

**Owner:** UI. **Depends on:** none. **Requirements:** V-1, V-2, V-5.
**Modify:** `src/pages/LoginPage.tsx`, `src/pages/LoginPage.module.scss`, `src/styles/globals.scss`.

- [ ] Capture current login enabled/disabled, hover, focus, loading, and error states in forced light/dark; record computed fill and helper foreground/background in the acceptance document.
- [x] Use the existing shared Button where compatible or correct the local cascade that lets the global reset remove the primary fill; keep the intentional brand palette. Apply a dark text token that reaches 4.5:1 for both helper-text pairs.
- [x] Add inherited font family to `.input-field`; retain intentional serif heading rules. Confirm inputs inherit the body font without changing display typography.
- [ ] Repeat the state matrix at 360×800 and 1280×720; check keyboard submission, disabled nonactivation, visible focus, and no horizontal overflow. Do not add a test framework for this CSS repair.

**Review gate:** evidence demonstrates distinct enabled/disabled actions, ≥4.5:1 helper contrast, inherited input font, unchanged heading/brand behavior.

### Task A2: Repair shared targets and selected-option contrast

**Owner:** UI. **Depends on:** none; review with A1. **Requirements:** V-3, V-4.
**Modify:** `src/pages/LoginPage.module.scss`, `src/components/shared/Modal.module.scss`, `src/components/shared/SearchableSelect.module.scss`; `src/styles/variables.scss` only for a genuinely missing reusable token.

- [x] Measure generator, modal close, and country-selector hitboxes; use existing sizing tokens to reach ≥44×44 without overlapping adjacent targets.
- [x] Inspect the actual selected-option cascade in light and dark; adjust the selected text/background pair and specificity together, preserving the locked primary-button exception elsewhere.
- [ ] Verify selected, selected+hover, keyboard focus, disabled, long labels, modal focus trap, Escape/close, and 360px layout. Check shared select/modal use on authenticated routes as well as login.
- [x] Record computed selected-option contrast ≥4.5:1 and hitbox measurements in `implementation-acceptance.md`.

**Release gate A:** A1–A2 evidence plus scoped lint, `npm run build`, and `npm run build:prod`; no unrelated design changes. This track can be reviewed/released separately through Ouri's normal merge path.

## Track B — production WoT

### Task B1: Freeze the authority contract and execution test cases

**Owner:** joint; Ouri owns server mapping. **Depends on:** G1–G3 for accepted contract. **Requirements:** all R-A authority requirements, R-P1–R-P4.
**Modify:** `docs/FOR_OURI_seam.md`, `src/services/verificationModel.ts`.
**Create:** the decisions document and `service-contract-cases.json` identified above.

- [ ] Record G1–G3, protected-operation matrix, bootstrap source/process, global identity boundaries, storage owner, signature verification/key rotation, and privacy/retention policy. Reserve or omit `suspended`; no account ban tooling in this scope.
- [ ] Ouri records actual service implementation locations and wire schemas; distinguish global durable approval writes from off-contract orchestration. Preserve existing seam names where compatible; map `InvitationDraft.vouch` to authoritative `approves_invitee` without cosmetic renaming.
- [ ] Define authenticated actor derivation, eligible-at-write checks, unique approver/approvee constraint, idempotency key, atomic fourth-approval transition, server timestamps, and durable event IDs. Caller-supplied `publicKey` is routing context, not proof of identity.
- [ ] Define a versioned approval record containing approver, approvee, method, session binding for call/daily, timestamp, canonical signed payload, signature/verification reference, issuer/key ID, and audit ID. Non-call methods receive an explicit authorization-event binding if G1 permits them; never invent a fake video session.
- [ ] Define session states, role permissions, expiry, authoritative count/status, upcoming/history responses, availability timezone fields, and stream revision/cursor recovery. Never accept caller-selected verifier IDs in production.
- [x] Write input/expected-result cases for duplicate/self/ineligible approvals, wrong session/actor, invalid signature, replay, expired session, altered invite flag, and concurrent fourth approvals before implementing the authority. These cases are proposed and unexecuted; completing this drafting step does not pass the B1 contract gate.

**Contract gate:** recorded schemas and real backend file map, signed off by responsible owners; UI can consume approved fixtures without implying production readiness.

### Task B2: Implement authoritative approval and protected-operation enforcement

**Owner:** Ouri/server-side; UI mirrors only. **Depends on:** B1, G2 bootstrap. **Requirements:** R-A1–R-A5, R-A13, R-A14; R-S1, R-S7.
**Frontend modify:** `src/services/verification.ts`, `src/services/trust.ts`, `src/services/api.ts`, `src/hooks/useVerification.ts`, `src/hooks/useCommunityTrust.ts`, `src/components/community/StageGate.tsx`, `src/components/community/IdentityTrust.tsx`, `src/components/identity/agent/digitalAgentStore.ts`, `src/components/identity/verification/VerificationHub.tsx`.
**Create:** `src/services/verificationTransport.ts`; backend targets come from B1.

- [ ] Run B1 rejection cases against the real authority and verify they fail before implementing validation. Use the server's existing test runner; do not invent a frontend test stack or claim browser tests prove server enforcement.
- [ ] Implement atomic distinct approvals, eligibility/self checks, signature validation and immutable audit evidence; enforce each protected operation from the matrix at its authoritative boundary.
- [ ] Replace browser-authoritative reads with authenticated global status; on unavailable/unknown authority show recoverable pending/loading state and deny protected writes. No automatic demo fallback or fixture import in production.
- [ ] Reuse X/4 segments and hub success state; only server-confirmed verification shows full access/confetti. On errors retain last display with explicit stale state; access still rechecks server authority.
- [ ] Verify cross-device/reload/global-community consistency, duplicate retries, two simultaneous fourth approvals, localStorage tampering, forged API calls, and cross-account status/cache isolation. Ensure unprotected operations still follow existing policy.

**Gate:** direct server calls reject pending users for every protected operation; trusted bootstrap is documented; no seed/demo evidence is imported. Frontend gating alone cannot pass this gate.

### Task B3: Build embedded call and decision lifecycle

**Owner:** joint; Ouri owns tokens/provider events and presence authority. **Depends on:** B1–B2, G3. **Requirements:** R-S3, R-S4, R-A5, R-A8–R-A9.
**Modify:** `src/services/verification.ts`, `src/services/verificationModel.ts`, existing `CallFlow.tsx`, `WaitingRoom.tsx`, `InCallView.tsx`, `InCallVerifyAction.tsx`, `CallSummary.tsx`, `CallFlow.module.scss` in the verification directory.
**Create:** `src/services/verificationVideo.ts`, `src/components/identity/verification/EmbeddedCall.tsx`.

- [ ] Select provider using current browser/mobile support, embedding, bandwidth, privacy/residency, accessibility, capacity, and budget requirements; approve procurement separately if needed.
- [ ] Implement server-issued short-lived room tokens bound to authenticated participant, role, and active session. Verify provider event authenticity, deduplicate/reorder events, and derive eligible attendance on the server.
- [ ] Embed the real call inside the existing role-specific layout; provide camera/microphone permission, joining, muted, reconnect, provider error, and ended states. Retain camera/data disclosure; reconcile alternative-path copy with G1.
- [ ] Replace simulated auto-approval with prominent Approve and smaller Decline. Submit session ID, decision, and idempotency data through the seam; derive verifier identity server-side. Show progress only after authoritative acknowledgement.
- [ ] Exercise candidate/unselected/absent-verifier attempts, mismatched room tokens, replayed signatures, forged presence, late/expired decisions, duplicate clicks, reconnect, device denial, and provider outage. No external redirect qualifies as embedded video.

**Gate:** real multi-client call with authenticated presence and session-bound decisions; approval cannot be created by simply opening a screen or changing client state.

### Task B4: Deliver daily MVP with secure selection and fresh requeue

**Owner:** joint. **Depends on:** B2–B3. **Requirements:** R-S5, R-P4, R-A7, R-A9.
**Modify:** `src/hooks/useDailyVerification.ts`, `src/services/verification.ts`, `src/services/verificationModel.ts`, verification `DailySession.tsx`, `DailySessionLobby.tsx`, `DailySessionResult.tsx`, `DailySession.module.scss`, `PathwayCards.tsx`, `VerificationHub.tsx`.

- [ ] Implement durable daily run and “I'm Available” opt-in, authenticated live volunteer count, selected/dismissed states, and local-time display of the configured daily start.
- [ ] Have the server securely sample exactly four distinct eligible present volunteers; filter prior approvers, the candidate, and excluded verifiers before drawing. Store auditable selection metadata without exposing exploitable seed material.
- [ ] Reject candidate-supplied verifier lists and client-triggered redraw manipulation. With fewer than four eligible volunteers, show the agreed waiting/reschedule state without silently shrinking the draw.
- [ ] Implement server-owned timeout/no-show closure and automatic requeue for zero-approval/no-show sessions according to G3. Generate a new session/draw; prevent immediate reuse of the failed cohort where enough eligible alternatives exist. A fresh draw may legitimately overlap; define shortage behavior explicitly.
- [ ] Test pools of 0/3/4/5+, opt-out at selection, stale/disconnected presence, simultaneous candidates, duplicate joins, server restart, timezone display, zero-attendance/no-approval closure, and requeue idempotency. Test the random algorithm and eligibility invariants without demanding chance draws never repeat.

**Milestone:** daily MVP is functionally integrated; production enablement still requires B6–B7 and release checks.

### Task B5: Connect invitation and conditional known-contact pathways

**Owner:** joint. **Depends on:** B1–B2, G1. **Requirements:** R-S6, R-P1–R-P3.
**Modify:** verification `InvitePage.tsx`, `RequestPage.tsx`, `ApprovePage.tsx`, `MemberList.tsx`, `PathwayCards.tsx`, `src/services/verification.ts`, `src/services/verificationModel.ts`.
**Create conditionally:** `src/components/identity/verification/PendingDirectory.tsx`.

- [ ] Default invitation approval checkbox off; explain invitation versus approval. Implement real delivery and identity-bound, expiring, one-use redemption. Bare invitation adds zero; opted-in approval adds exactly one only under G1 and authoritative inviter eligibility.
- [ ] If G1 permits known-contact approval: deliver member requests to real eligible recipients; remove automatic responses; implement explicit approval/decline and the agreed reciprocal consent. Add a minimal, privacy-filtered pending directory for proactive direct approval, with pagination/search limits and no private contact exposure.
- [ ] If G1 requires random live video for all approvals: retain these entry routes as invitation/introduction/request flows, route to server-assigned calls, omit the direct-approval directory, and state that an invitation/known-contact response itself cannot add approval.
- [ ] Verify false/missing/altered opt-in, replayed invitation, wrong redemption account, revoked inviter eligibility, self-request, unauthorized directory access, duplicate direct approval, pending-user approval attempt, real decline, and recipient isolation.

**Gate:** behavior matches the recorded G1 branch; four pathways are represented truthfully and no hidden non-video bypass exists.

### Task B6: Deliver durable notifications and real history

**Owner:** joint. **Depends on:** B2–B4; extend for B5/B8 as they land. **Requirements:** R-A10–R-A11, R-S1.
**Modify:** notification files in the map, verification `ApprovalHistory.tsx`, `VerificationHub.tsx`, `src/services/verification.ts`.
**Create:** `src/components/identity/verification/SessionHistory.tsx`.

- [ ] Publish recipient-scoped request, invitation, selection/dismissal, schedule/change, reminder, response, and completion events from committed server transitions. Retry delivery using stable event IDs, never component mount effects.
- [ ] Hydrate authoritative notifications with cursor/replay semantics; preserve owner isolation/read state and render expired actions truthfully. Delivery/reminders must survive tab closure using the agreed channel.
- [ ] Show upcoming calls, completed/no-show sessions, and approvals per session; retain approval history separately and restrict roster details to the approved privacy policy.
- [ ] Test offline replay, reconnect/reload, account switch, duplicate delivery, expiry, cancellation, route not mounted, and server restart. Verify intended recipient receives one visible event and another account receives none.

**Gate:** durable lifecycle evidence and privacy-safe history; tab-local simulated notifications do not satisfy it.

### Task B7: Enforce abuse controls before any production verification release

**Owner:** Ouri/service; UI provides truthful errors. **Depends on:** B1–B4. **Requirements:** R-A12, R-A14.
**Frontend modify:** `src/services/verificationModel.ts`, `src/services/verification.ts`, `InCallVerifyAction.tsx`, `DailySessionLobby.tsx` in the verification directory; backend locations from B1.

- [ ] Implement auditable attendance, approval, decline, and no-show counters plus configured observation windows; protect raw telemetry and document retention.
- [ ] Enforce request/invite/join/decision rate limits, suspicious-pattern flags, review ownership, and verifier exclusion before pool selection and again before approval acceptance. Do not substitute account bans or verification downgrades for this scoped control.
- [ ] Record numeric thresholds, exclusion duration, review/appeal route, and response/error codes in the decisions document before activation; recommendations alone are insufficient for release.
- [ ] Exercise threshold boundaries, concurrent requests, exclusion between draw and vote, requeue farming, repeated pair/collusion signals, reset-window behavior, and audit visibility. Provide an operational procedure to pause new verification if integrity fails.

**Gate:** enforcement and operational ownership proven; this is a release requirement, not optional post-launch polish.

### Task B8: Add availability and earliest-overlap scheduled verification

**Owner:** joint. **Depends on:** daily MVP B4, B6–B7, G4. **Requirements:** R-S2–R-S3, R-P4, R-A6, R-A9–R-A11.
**Modify:** `src/services/verificationModel.ts`, `src/services/verification.ts`, `src/pages/IdentityView.tsx`, verification `PathwayCards.tsx`, `VerifierPicker.tsx`, `WaitingRoom.tsx`, `CallFlow.tsx`, `VerificationHub.tsx`.
**Create:** `AvailabilityPicker.tsx`, `AvailabilityPicker.module.scss`, `ScheduledSession.tsx` in the verification directory.

- [ ] Add accessible weekly availability grid/list with explicit IANA timezone, save/load, invalid/empty-slot errors, and keyboard/mobile operation; register nested availability/scheduled views in IdentityView.
- [ ] Implement server-side scheduling using the recorded G4 earliest-overlap algorithm and secure random pool of 8–10 eligible verifiers. Retire production candidate-selected verifier picking; `VerifierPicker` may remain demo-only. Handle insufficient pool/no overlap with a truthful wait state.
- [ ] Reuse WaitingRoom and embedded call for scheduled time/timezone, privacy-permitted anonymized roster, reminders, attendance, and call entry. Display distinct “Join Next Daily Session” and “Schedule a Verification Call” actions.
- [ ] Reuse durable no-show closure/requeue with a fresh draw; support cancel/reschedule according to policy, invalidating old room tokens and notifications.
- [ ] Test timezone round-trip, daylight-saving gap/fold, earliest eligible overlap, ties, horizon/notice limits, 7/8/10/11-member pools, no overlap, malicious verifier IDs, double booking, concurrent reschedule, and no-show recovery. Verify server-selected 8–10, not client selection or mere randomized presentation.

**Gate:** real scheduled multi-client journey passes from saved availability through signed decisions; daily-only release cannot close full WoT scope.

## Integrated release and completion gates

- [ ] **UI evidence:** all seven screens and both call roles at 360px/desktop, light/dark, keyboard/focus, reduced motion, loading/error/retry; translated strings in en/fr/sw and native-review log. Hub success state satisfies R-S7; no extra route required.
- [ ] **Authority/security evidence:** B1 negative cases executed against real backend; protected-operation matrix complete; replay/signature/eligibility/concurrency attacks rejected; browser storage cannot grant rights; bootstrap audited.
- [ ] **Operational evidence:** real embedded video/presence, secure daily draws, fresh no-show requeue, durable notifications/history, abuse enforcement, privacy policy, outage recovery, and pause procedure. Partial approvals persist without fabricating remaining approvals.
- [ ] **Code evidence:** scoped lint, type/build gates through `npm run build` and `npm run build:prod`, whitespace check, i18n parity, and appropriate existing server tests. No blanket claim that a build proves behavior; save actual results in `implementation-acceptance.md`.
- [ ] **Daily release gate:** G1–G3, B1–B7 and applicable UI checks pass; scheduled feature is explicitly unavailable rather than deceptively simulated in production. This is an interim milestone only.
- [ ] **Full release gate:** G4/B8 plus all R-S1–R-S7, R-P1–R-P4 under recorded policy, R-A1–R-A14 dispositions, and V-1–V-5 evidenced. No open authority or abuse-control defect.
- [ ] **Deployment gate:** Ouri reviews integration and merges `ui` into `server-side`; verify successful workflow SHA and post-deploy smoke behavior before calling it deployed. A push to `ui` is not a deployment. No automatic merge/push from plan execution.

## Handoff and sizing

Review each task's concrete diff and evidence before advancing its dependents. Keep `ui` runnable against explicit demo adapters while Ouri implements real services; do not present a production badge on simulator behavior. Record any actual contract change as a separate reviewed handoff because deployed contracts are immutable.

Visual repairs are bounded local work. Production WoT contains service authority, cryptography, realtime video, scheduling, and operations dependencies; a credible calendar estimate requires G1–G3, provider selection, backend inspection, and Ouri capacity. Estimate after B1 rather than assigning invented day counts now.

Plan coverage: A1–A2 cover V-1–V-5; B2 covers authoritative home/success and global four-approval access; B3–B4 cover live call/daily; B5 covers invitations/member/direct pathways; B6 covers history/notifications; B7 covers abuse/suspension disposition; B8 covers availability/scheduled random matching. Execution can begin with Track A and B1 documentation without treating unresolved recommendations as approval.
