# Sol synthesis: UI audit and Web of Trust readiness

Date: 2026-09-17  
Scope: review and planning evidence only; no source, deployment, contract, or production changes.  
Inputs: `provenance.md`, three Terra reviews, the WoT product prompt, and `CLAUDE.md`.

## Provenance and confidence boundary

- Local UI reviewed at `f606d9fb5f2a82a55b6e59b1b2d026ed2f0af84c`.
- The latest successful deployment workflow checked points to `server-side` SHA `a81218f9da6af21cb598441be1fbb930ddf5e1c1`, completed 2026-09-02 11:37 UTC.
- That SHA is the latest successful workflow observed, not proof that every external runtime component matches it.
- The external running server was not inspected. Backend conclusions apply to reviewed repository source only.
- Live browser coverage was limited to dark login and the organization dialog at 1280x720 and 360x800.
- Authenticated pages, live light mode, real calls, and real server behavior were not observed.
- New `identity/verification` UI and `src/services/verification.ts` are absent from the deployed SHA; they are local UI/demo work.
- Existing S36-S39 behavior is deliberately demo-scoped. Missing production behavior is readiness work, not a regression.
- Status vocabulary below: **built** = local UI exists; **partial** = some required behavior exists; **demo-only** = simulator/browser state; **missing** = absent from reviewed source; **deployed legacy** = present at deployed SHA; **unseen** = external server not audited.

## Executive conclusion

The local branch already contains reusable shells for the verification hub, four entry pathways, waiting room, in-call layout, daily lobby, approval history, and success state. It does not yet implement an authoritative Web of Trust. Current approvals, assignment, notifications, and status are simulated or browser-local. The reviewed deployed contracts contain no WoT authority, and protected operations are gated in React rather than proven server-side.

The plan should preserve the UI and replace its seam implementation in phases. Ouri owns authoritative service integration on `server-side`; UI work stays on `ui` and calls only `src/services/api.ts` or a mapped service seam. Do not merge or deploy automatically.

Live video can support human interaction and liveness signals, but no implementation can guarantee intelligence, humanity, or unique identity from video alone. Product claims and acceptance language must avoid that guarantee.

## Requirement ledger

### Seven required screens

| ID | Screen | Current status | Evidence / gap | Acceptance target |
|---|---|---|---|---|
| R-S1 | Verification home | **Built, demo-only** | `VerificationHub.tsx:39,49`; `useVerification.ts:44` show status, four segments, and X/4. `PathwayCards.tsx:28` exposes four pathways, but the scheduled CTA is represented as immediate “Start a call.” | Persistent authoritative X/4; distinct “Join Next Daily Session” and “Schedule a Verification Call” actions; refresh-safe status. |
| R-S2 | Availability picker | **Missing** | No weekly availability model in `verificationModel.ts`; `VerifierPicker.tsx:48` states scheduling/timezone is absent. | Weekly grid, timezone display, save/load through service seam, validation, keyboard/mobile operation. |
| R-S3 | Scheduled call | **Partial, demo-only** | `WaitingRoom.tsx:65` shows named selected members; no scheduled time, anonymisation policy, or embedded provider. | Time and timezone, permitted anonymised roster, join-state lifecycle, embedded video, no external redirect. |
| R-S4 | In-call verification | **Partial, demo-only** | `InCallView.tsx:116,171` renders tiles; `:141` says no real camera/mic/call. `InCallVerifyAction.tsx:57` offers Verify only. | Role-specific real video; prominent Approve and smaller Decline; present-verifier list; server acknowledgement and immediate authoritative progress. |
| R-S5 | Daily open lobby | **Partial, demo-only** | `DailySession.tsx:140,166,189` and `DailySessionLobby.tsx:41` provide countdown, join/reminder, count; fixed 21:00 UTC and enter/leave behavior. | “I’m Available” toggle, live count, timezone policy, server-selected four, dismissal state, durable session lifecycle. |
| R-S6 | Invitation | **Partial, demo-only** | `InvitePage.tsx:73,80`; model uses `vouch` at `verificationModel.ts:49`. Default is true at `InvitePage.tsx:23`; `:39` sends no email. Field naming may map at the seam. | Explicit default-off opt-in, required distinction copy, delivery, authoritative `approves_invitee` enforcement. |
| R-S7 | Success | **Partial, demo-only** | `VerificationHub.tsx:31` renders confetti and verified state. A separate route is unnecessary if this state fully satisfies the success experience. | Trigger only from authoritative fourth distinct approval; confirm full access; persist across reload/session. |

### Four pathways

| ID | Pathway | Current status | Required production behavior |
|---|---|---|---|
| R-P1 | Direct invitation | **Partial, demo-only** | Bare invitation never counts; explicit `approves_invitee=true` may create one eligible approval. UI default must be false. Naming may map from `vouch`; avoid needless public-interface renames. |
| R-P2 | Member request | **Partial, demo-only** | `RequestPage.tsx:62,67` searches and auto-responds locally. Production must notify a real eligible member and record their explicit response. |
| R-P3 | Direct approval | **Partial, demo-only** | `ApprovePage.tsx:80` handles incoming requests, but lacks a proactive pending-user directory and the specified “single button on both sides” meaning. Product decision required before build. |
| R-P4 | Random video verification | **Partial shell, missing production** | `VerifierPicker.tsx:77` lets the pending user choose verifiers, with a minimum of one; `verificationSim.ts:261` randomizes presentation only. Production selection, scheduling, video, attendance proof, signing, no-show handling, and abuse controls are absent. |

### Cross-cutting requirements

| ID | Requirement | Current status and evidence | Acceptance target |
|---|---|---|---|
| R-A1 | Four distinct approvals | **Demo-only / backend missing**: threshold in `trustModel.ts:21,35-40`; browser-key dedupe in `trust.ts:60-66`. | Server enforces four distinct eligible approvers and rejects duplicates. |
| R-A2 | Verified approver | **Demo-only / backend missing**: UI guard in `verificationDemo.ts:109-113,142-149`. | Eligibility checked at authoritative write time. |
| R-A3 | Self-approval rejection | **Missing**: `addUserVouch` has no self check. | Server rejects approver=approvee. |
| R-A4 | Global scope | **Partial local / backend missing**: current-user count is global locally; other persona graph is community-scoped. | One global status and approval graph; no new community tier. |
| R-A5 | Signed, session-bound approvals | **Missing**: `verificationModel.ts:14-19` lacks session/signature fields. | Immutable audit record with approver, approvee, session, timestamp, and verifiable authorization evidence. |
| R-A6 | Random 8–10 scheduled pool | **Missing production**: candidate IDs supplied by caller at `verification.ts:105-113`. | Server samples eligible pool; pending user cannot nominate or influence candidates. |
| R-A7 | Random four in daily lobby | **Demo-only**: deterministic rotation in `dailyVerificationSim.ts:122-136,177-207`. | Server samples four among present eligible volunteers and records the draw. |
| R-A8 | Embedded live video | **Missing**: simulator noted in `verificationSim.ts:5-13` and `FOR_OURI_seam.md:265-299`. | Chosen provider embedded in app; authenticated room tokens; role and session binding; camera/mic/error states. |
| R-A9 | Attendance and no-show requeue | **Missing**: `WaitingRoom.tsx:124` only offers manual alternatives. | Provider-backed attendance; zero-approval/no-show session automatically closes and requeues with a fresh draw. |
| R-A10 | Upcoming sessions and call history | **Partial**: `ApprovalHistory.tsx:17` is approval history only. | Upcoming schedule, completed/no-show calls, approvals per session, and privacy-safe details. |
| R-A11 | Notifications | **Demo-only**: tab-local simulation; S39 documents production need. | Recipient delivery for selection, schedule/update, reminder, request, response, and result. |
| R-A12 | Abuse metrics and limits | **Missing** | Server tracks attendance/approve/decline rates; policy defines thresholds, flagging, rate limits, review, and verifier exclusion. |
| R-A13 | Authoritative access | **Missing in reviewed backend**: `StageGate.tsx:52-72` and `useCommunityTrust.ts:58-85` are client gates. | Every protected operation checks global verified status server-side; UI mirrors, never grants, access. |
| R-A14 | Suspension | **Suggested model conflict** | Prompt model includes `suspended`, while scope says no downgrade/ban mechanics. | Decide whether `suspended` is reserved-only or excluded from this release. |

## Backend and deployment boundary

- Deployed `digital_agent_contract.py:1-18` contains profile fields only; it has no authoritative global approvals.
- Deployed `gloki_engage_community_contract.py:1-21` has details/initiatives only, while deployed `src/services/trust.ts:21-50` calls missing trust methods.
- Local `src/services/trust.ts:59-67`, `digitalAgentStore.ts:56-70,87-94`, and `useCommunityTrust.ts:59-69` allow browser-local trust state. This must never grant production rights.
- S36 documents proposed `request_vouch`, `vouch`, `decline_vouch`, `get_vouches`, and directory methods at `FOR_OURI_seam.md:236-260`; documentation is not implementation.
- S37/S38 deliberately keep call lifecycle out of the blockchain contract (`FOR_OURI_seam.md:265-320`). A production orchestration service may own video, attendance, assignment, signing, notifications, and abuse policy.
- Architecture should map existing UI vocabulary to authoritative API fields. Contract immutability and the established seam argue against renaming working UI purely to match suggested model names.
- No production provider, plan, or price is recommended here. Provider selection requires separate current research and product constraints.

## Visual quality findings to carry into UI work

| ID | Priority | Finding and evidence | Acceptance |
|---|---|---|---|
| V-1 | P1 | Login primary action has no visible fill; enabled and disabled look alike. `LoginPage.module.scss:219-225`; global reset `index.scss:92-104`. Text remains visible. | Visible enabled primary treatment and clearly differentiated disabled state in both schemes and interaction states. |
| V-2 | P1 | Dark helper text is ~3.03:1 and ~3.07:1: `LoginPage.module.scss:72-78,371-377`. | Small helper text/background pairs reach 4.5:1. |
| V-3 | P2 | Three live targets miss the project 44×44 rule: generator 42×44.5, modal close 32×32, country picker 280×40 (`LoginPage.module.scss:88-104`, `Modal.module.scss:54-66`, `SearchableSelect.module.scss:8-19`). | Interactive hitboxes meet project 44×44 rule. Do not characterize every instance as a blanket WCAG 2.1 failure. |
| V-4 | P1 source-only | Selected dropdown color may remain primary because of specificity; estimated contrast below 4.5 in both schemes (`SearchableSelect.module.scss:96-106`). | Recheck actual cascade, then achieve 4.5:1 in light/dark authenticated runtime. |
| V-5 | P2 | Inputs render Arial because `.input-field` lacks inherited family (`globals.scss:48-56`). | Inputs inherit the system body font. |

Retain the intentional serif display heading (`variables.scss:111-113`, `globals.scss:10-12`), locked brand choices, good dark primary text contrast, and the observed lack of horizontal overflow at 360px. White on brand blue is a recorded locked-brand deviation, not a new finding.

## Prioritized implementation backlog

### P0 — settle product and authority contracts before production claims

1. Resolve the core contradiction: “synchronous live-video only” and “randomness always” conflict with invitation, known-contact request, and direct approval counting without video and with chosen people.
2. Define the authoritative service owner, global user identity, approval record, session record, eligibility rules, idempotency, and server-side access decision.
3. Define what evidence “cryptographically signed” means in this system: authenticated server event, user-held signature, contract transaction, or another scheme.
4. Establish UI↔Ouri endpoint schemas through the existing seam; document field mappings including `vouch` ↔ `approves_invitee` if retained.
5. Define protected operations and enforce verified status for each on the server.

### P1 — production verification core

1. Ouri/service: authoritative approval writes, distinctness, eligibility, self-rejection, invitation flag enforcement, audit records, and status transition.
2. Ouri/service: server-owned random draws, weekly availability, timezone handling, scheduling, attendance, no-show closure/requeue, and notification delivery.
3. Joint: provider abstraction and embedded-video lifecycle; select provider only after requirements and current research.
4. UI: connect existing hub, waiting room, in-call, daily lobby, invitation, request, approval, history, and success shells to the service seam.
5. UI: add availability picker, scheduled-session details, Decline action, real upcoming/call history, loading/error/retry, and authoritative refresh behavior.

### P2 — abuse, privacy, and polish

1. Ouri/service: verifier statistics, rate limits, flags, exclusion policy, observability, and administrative review path consistent with current scope.
2. Joint: privacy rules for anonymised verifier rosters, pending-user directory exposure, and history retention.
3. UI: fix V-1 through V-5 and verify dark/light, hover/focus/disabled, keyboard use, 360px layout, and authenticated pages.
4. Joint: failure recovery for provider outage, revoked eligibility, duplicate clicks, late joins, reschedules, and concurrent fourth approval.

## Reuse map and ownership

- **UI owner:** reuse `VerificationHub`, `PathwayCards`, `WaitingRoom`, `InCallView`, `InCallVerifyAction`, `DailySession`, `DailySessionLobby`, `InvitePage`, `RequestPage`, `ApprovePage`, and `ApprovalHistory` rather than rebuilding screens.
- **UI owner:** preserve progress segments, role-specific call layout, confetti success state, responsive shell, and existing route structure where they meet the requirement.
- **Ouri/server-side owner:** replace simulation behind the seam with authoritative endpoints and provider integration; enforce all writes and protected operations.
- **Joint contract:** agree schemas, status transitions, error codes, notification events, privacy fields, and test fixtures before wiring.
- **Release owner:** Ouri merges `ui` into `server-side`; only `server-side` triggers deployment. Passing UI work must not be described as deployed until that merge and successful workflow are observed.

## Acceptance-test matrix for Astra planning

- A pending user sees the same authoritative X/4 after reload, logout/login, and another device.
- The same approver cannot increment twice; a pending user cannot approve themself; an ineligible approver is rejected server-side.
- Invitation without explicit opt-in adds zero; explicit opt-in defaults off and adds exactly one when inviter is eligible.
- The pending user cannot provide or alter verifier IDs; repeated scheduled sessions show server-owned random draws of 8–10 eligible people.
- Daily assignment draws exactly four eligible present volunteers when at least four exist; nonselected volunteers receive the defined dismissal state.
- Availability round-trips with an explicit timezone and produces the agreed earliest-overlap behavior.
- Approve/Decline is accepted only for an authenticated, attending verifier in the active matching session.
- Concurrent fourth approvals produce one verified transition and no duplicate entitlement/event.
- A zero-attendance/zero-approval session closes, requeues, and creates a fresh selection according to policy.
- Embedded call remains inside the app and handles permission denial, provider failure, reconnect, late join, and session end.
- Verification alone never grants access in browser state; protected server operations reject pending users and allow verified users.
- Abuse counters reflect attendance and decisions; configured flag/rate-limit/exclusion rules execute and are auditable.
- Invitation, request, schedule, reminder, selection, response, and completion notifications reach the intended recipient once.
- Home, availability, scheduled call, in-call views for both roles, lobby, invitation, and success all pass keyboard/mobile and light/dark checks.
- Login fixes show distinct enabled/disabled primary states, ≥4.5:1 helper/selected-option contrast, ≥44px project hitboxes, inherited input font, and no 360px overflow.

## Explicit unanswered decisions

1. Do P1–P3 approvals remain valid without synchronous video and random assignment? If yes, revise the absolute core principles; if no, redefine those pathways as introductions that lead to random live calls.
2. May a pending user request a known member, and may a verified member browse recognised pending users, despite the “cannot hand-pick verifiers” rule?
3. What is the pending user's required reciprocal action in “single button on both sides” for direct approval?
4. What information may scheduled participants see before joining: count only, pseudonyms, names, or other anonymised attributes?
5. Is the daily session fixed at 21:00 UTC, 9 PM local, region-based, or configurable? The prompt's 9 PM is an example; this is an open product choice.
6. Which availability granularity, timezone source, recurrence horizon, notice period, and rescheduling rules apply?
7. What is the minimum quorum for daily assignment when fewer than four volunteers attend, given scheduled calls may begin with one verifier?
8. What exactly proves attendance and permits a vote: provider join event, minimum duration, visible camera, or another policy?
9. What does a Decline mean for the pending user, and can a session with declines still accumulate approvals?
10. What abuse thresholds, observation window, appeal/review process, and exclusion duration apply?
11. What signing model, key custody, audit retention, deletion, and privacy jurisdiction are required?
12. Which operations constitute “full community access,” and how are existing sessions invalidated after status change?
13. Is `suspended` reserved for future compatibility or part of this release despite downgrade/ban tooling being out of scope?
14. Does the existing in-hub verified state satisfy the success screen, or is a dedicated route required for product reasons?
15. What traffic, browser/mobile support, accessibility target, budget, data residency, recording policy, and moderation constraints drive video-provider selection?

These decisions must be recorded before Astra converts the corresponding item into implementation work; they should not be silently inferred from the suggested interfaces.
