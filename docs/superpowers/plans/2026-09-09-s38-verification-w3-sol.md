# S38 — Daily verification session: implementation plan for Sol

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task, with sequential workers and controller-owned preview. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Prompt 2 Wave 3 at `/identity/verification/daily`: scheduled entry, lobby, deterministic verifier selection, both call roles, and an honest session result. Make the daily session the in-product door for verified members to give a call vouch.

**Architecture:** Keep daily orchestration in a new in-memory simulation behind `src/services/verification.ts`. Reuse the existing call registry, vouch writer, `InCallView`, and `CallSummary`; add the narrow adaptations required for daily attribution and multiple verifier updates. The daily route owns its session and child-call lifetime. Timers that advance the session live in services; the shared countdown hook only displays time.

**Tech Stack:** Existing React + strict TypeScript + Vite, SCSS Modules and shared kit, Redux authentication, Digital Agent trust, inline-English/fr/sw i18n. No new dependencies or test framework.

**Spec:** [S34 parent §3.3 W3](../specs/2026-09-02-s34-review-causes-impact-verification-design.md), [S34 rulings D8/D9/F9/F10](../specs/2026-09-02-s34-decision-record.md), [S36 amendments](../specs/2026-09-06-s36-verification-w1-design.md), [S37 as-built addendum](../specs/2026-09-07-s37-verification-w2-design.md), and [S38 prompt](../../session-prompts/session-38-verification-w3.md). Task 0 records this wave's accepted design in a new addendum before implementation.

**Status, 2026-09-09:** Implementation started after Eston said “Continue.” Proceeding with the documented recommended defaults; this is execution authorization, not a claim that Eston supplied each detail verbatim. Reviewed against local `ui` at **`ac8523b`**, matching cached `origin/ui`. Live GitHub verification failed (DNS from git; web fetch unavailable). Existing tracked worktree was clean; the pre-existing untracked `.agents/` directory belongs to the user. Do not stage it.

## Global constraints

- D8: verification is platform-wide on the Digital Agent; `VERIFIED_THRESHOLD = 4`. Trust gates eligibility, never vote weight.
- D9: add only `verification/daily` and its title inside `src/pages/IdentityView.tsx`; no `App.tsx` route change.
- **Locked by Eston, 2026-09-07:** the daily session is the verifier's door. No standing “verify someone now” hub card. A verified user opts into the daily session before selection and a call.
- F10: every call/daily entry carries **“Uses your camera and mobile data. No camera? Ask a member to vouch for you instead.”**, with the second sentence linked to `/identity/verification/request`. Text pathways remain first. Add a separate role-accurate demo disclosure; the camera and microphone remain off.
- Only the seam is imported by production verification components. The existing `.demo.tsx` state-switcher exception remains explicitly dev-only.
- All session timers live in the simulation; `useCountdown` is the sole component timer. Subscription removal does not cancel a session; its owner must call the leave operation.
- Freeze the role at session entry. Receiving the fourth vouch must not turn the candidate into their own verifier.
- Every seam write has a synchronous busy guard and `try/catch/finally`; show an inline retryable error and release the guard on failure. Ignore stale async results and dispose sessions created after cancellation.
- Shared kit, style tokens, one AppHeader/h1, minimum 44×44 tap targets, 360px light/dark, en/fr/sw parity. Existing brand-blue exception remains; other success fills use the existing AA-safe treatment.
- Build sequentially on `ui`, in small commits. Docs before features. No new persisted fixture data is planned, so **no `DEMO_VERSION` bump**. Reclassify and bump only if fixture/seed data actually changes.
- W4 owns notification types/producers, bell, centre, and later scheduling. No notification permission, email, service worker, or promised background reminder in W3.
- Whole-session Opus review remains a gate before proposing a push. If unavailable, record it pending; do not call Sol's self-review an Opus review. Never run the local review panel or push without Eston's explicit authorization for that action. Ouri owns `ui` → `server-side` integration and deployment.

## 1. What the past sessions teach this implementation

This is a targeted historical review, not a retrospective audit of every commit. The roadmap/changelog supplies the earlier arcs; S34–S37 specs, plans, rulings, and current source were read in depth for W3.

| Session / evidence | Consequence for Sol |
|---|---|
| S9 claims honesty; S10–S15 repeated stale premises | Check source before building; do not turn a simulation, reminder preference, or fixture result into a claim about real people. |
| S14 adopted an existing orphaned kit; S22–S33 kit and navigation consolidation | Reuse CountdownTimer, MemberCard, call screens, and the established shell. No new nav system or duplicate timer implementation. |
| S34 D8/D9/F10; S35 completed Prompt 1 | W3 is verification-only. Causes, impact assessment, and Ouri's outstanding backend work do not become prerequisites or extra scope. |
| S36 E1/E2/E3 and review §8 | Platform-wide vouches; deterministic outcomes; only built pathways; demo disclosure on simulated judgement; every seam function gets a documented wire-name row, including “none.” |
| S37 C1 / frozen-role Critical | Candidate construction and verifier construction are different. Preserve explicit ownership; never bank a verifier's action onto their own agent. |
| S37 R4/R6/R9–R13 and final review | One cancellation owner; count actual joined/verifying people; preserve late arrivals in W2; inline completion; role-accurate copy; visible escape actions. |
| S37 preview-lore commit `2eda4e8` | A hidden pane throttles timers. Check visibility, elapsed wall time, accessible labels, and measured hit targets; do not infer correctness from a screenshot alone. |
| S37 final ruling `ac8523b` | The missing verifier door is resolved through the daily session. Old “needs founder decision” text under that ruling is historical residue. |

### Re-grounded premises and corrections

| S38 prompt premise | Actual local evidence at `ac8523b` |
|---|---|
| Tip `1c7a41a`; contradictory “NOT PUSHED” heading / pushed body | Three later docs commits: `17948ef`, `2eda4e8`, `ac8523b`. Cached `origin/ui..ui` is empty. S37 push approval and push are recorded; do not ask for that historical approval again. Live remote status is unverified. |
| 18 verification files | **19 files** in `src/components/identity/verification/`. Count files, not the prompt's estimate. |
| Five verification routes | Confirmed: hub/request/approve/invite/call; daily absent. |
| 14 seam functions; selectVerifiers absent | Confirmed. Ordinary text grep of `^export` also matches the type-export block; count function declarations. |
| `global-v19`; 1358 fr/sw keys | Confirmed. Parity script executed: en=76, fr=1358, sw=1358; interpolation tokens match. |
| No verificationSim references in components | **One comment reference** in `InCallView.tsx`; no implementation import. Use an import-focused gate, not a zero-text-hit assertion. |
| Countdown kit exists / reduced motion | Confirmed. Hook is mount-initialized and decrements ticks; it does not currently track a wall-clock deadline or react to changed seconds. |
| Bell still W4 | Confirmed by the notification type/routing implementation. No daily notification infrastructure exists. |

Additional source findings that affect W3:

- `MemberList` hardcodes `trustState="verified"`. Use `MemberCard` directly for mixed-role lobby rows; a candidate must not acquire a verified shield just by joining.
- `verificationSim.ts` hardcodes `method: 'call'` in its durable write. Daily must carry `'daily'` from call creation through automatic and manual verification.
- `InCallView` subscribes only in candidate mode because W2's verifier session contains one manual verifier. A daily verifier session with automatic peers needs updates in verifier mode too.
- `InCallView` hardcodes completion navigation to the hub. Daily needs an optional completion callback to show its own result before leaving.
- `ApprovalHistory` renders invitation specially and treats every other method as direct. Add call/daily display labels when exposing daily attribution.
- `joinCallStream`'s seam comment incorrectly promises timer cancellation on unsubscribe. The sim's actual contract is session-owned cancellation; correct the comment when touching this seam.
- `pendingCandidate()` is a demo persona, **not an eligibility/directory read**. Existing fixture-directory membership cannot prove a person's candidate status. Any daily sample candidate is explicitly a simulated role, never a claim that a known verified fixture person lost trust.

## 2. Proposed product details to settle in Task 0

**Execution note:** Eston subsequently said “Continue”; the controller proceeds with these recommended defaults, retaining their recommendation provenance. These are **recommendations from this planning pass, not individually recorded founder rulings**. The optional question about clock and selection was sent while planning; absent a reply, retain “proposed.” Reuse any approval already present in the implementing conversation rather than asking again. Finish the design below as a reviewable package; only unresolved product choices need Eston's decision before their implementation (project change-control Rule 3).

| Choice | Recommended design | Alternative / trade-off |
|---|---|---|
| Clock | Real UTC schedule normally; **dev-only**, conspicuously labelled accelerated scenarios in the existing state switcher. | A production demo clock would make walkthroughs easier but broadens the prompt's open product choice. |
| Selection | **Up to four** distinct eligible, opted-in verifiers per candidate. Stable order for a UTC day/candidate pair; no random outcome and no retry lottery. | Fewer verifiers is simpler but removes the reliable 0→4 path; production selection fairness is not being designed here. |
| Verifier discoverability | Candidate gets the fourth PathwayCard; verified hub gets a simple **“Daily verification session · 21:00 UTC” row/link**, with verifier-framed helper copy and F10 disclosure. Both go to pre-session, never directly to a call. | A global-menu entry is possible but adds navigation scope. This row implements the locked daily door, not a standalone “verify now” card. |
| Session window | Join opens **20:55:00 UTC**, selection at **21:02:30 UTC**. Early joiners wait to 21:00; the shared lobby then counts down 2:30. New entry at/after selection offers tomorrow. | A per-join 2:30 timer lets late entrants select in different sessions; avoid that ambiguity. |
| Reminder | Toggle **“Set reminder (demo)”** stores a tab-lifetime preference via the seam; visible helper: **“This demo saves your choice while this tab stays open; it sends no reminder.”** | Durable or actual reminders belong with W4. Do not silently omit the requested toggle or imply delivery. |
| Not selected / totals | Show thanks without implying failed verification. Remain able to leave while the sample call finishes; show a session-scoped, demo-labelled completed-member count, then a 5-second dismiss countdown with a “Stay here” control. | A canned “Today N…” would invent global activity; a count of approvals would mislabel vouches as newly verified members. |

Recommended simulation size: one candidate and one group of up to four selected verifiers per local daily-session run. This supplies all requested screens without building a multi-room scheduler. Candidates always enter the candidate path; only verified volunteers can be selected/not selected as verifiers. No candidate loses their chance through a verifier lottery.

Use a deterministically chosen sample candidate for verifier/observer walks, with a clearly labelled **simulated baseline of zero approvals** stored in the daily runtime, separate from fixture-directory trust. Do not mutate that fixture's global trust or add it as a community member. Each simulated vouch changes this run's progress only; four distinct vouches can complete one simulated candidate.

## 3. File and interface map

All paths below are relative to the repository root.

| File | Responsibility |
|---|---|
| Create `docs/superpowers/specs/2026-09-09-s38-verification-w3-design.md` | Accepted choices, state transitions, lifetime, clock and tally semantics; no retroactive rewrite of S34–S37. |
| Modify `src/services/verificationModel.ts` | Pure daily types; add required `method: 'call' \| 'daily'` to CallSession and update constructors. |
| Create `src/services/demo/dailyVerificationSim.ts` | Daily clock, roster, deterministic assignment, child-call ownership, result ledger, tab-only reminder, subscriptions. |
| Modify `src/services/demo/verificationSim.ts` | Daily call constructor using existing registry, method-aware vouch write, automatic peers with manual local verifier. Preserve W2 defaults. |
| Modify `src/services/verification.ts` and `docs/FOR_OURI_seam.md` | Daily API/type exports and same-commit simulation-only rows; existing vouch method handles `'daily'`. |
| Modify `src/hooks/useCountdown.ts`, `src/components/shared/CountdownTimer.tsx` | Backward-compatible deadline display and duration formatting. |
| Create `src/hooks/useDailyVerification.ts` | Seam subscription, loading/error/busy state, cancellation and ref cleanup. |
| Create `src/components/identity/verification/DailySession.tsx` | Route controller and frozen role; owns call/result handoff. |
| Create `src/components/identity/verification/DailySessionLobby.tsx` | Mixed-role participant list with actual trust and joined labels. |
| Create `src/components/identity/verification/DailySessionResult.tsx` | Selected/observer/empty/finished messaging and result dismissal. |
| Create `src/components/identity/verification/DailySession.module.scss` | Token-based daily layout, focus, sticky actions, reduced-motion rules. |
| Modify `src/components/identity/verification/InCallView.tsx` | Daily verifier subscription and optional completion callback. |
| Modify `src/components/identity/verification/ApprovalHistory.tsx` | Preserve and distinguish direct/invitation/call/daily provenance. |
| Modify `src/pages/IdentityView.tsx`, `src/components/identity/verification/PathwayCards.tsx`, `src/components/identity/verification/VerificationHub.tsx` | Nested route/title and daily entry surfaces. |
| Modify `src/components/identity/verification/VerificationDemoState.demo.tsx`, `src/components/identity/HomepageMenu.tsx` | Existing dev UI extended with daily scenarios; DEV-only lazy loading. |
| Modify `src/i18n/fr.ts`, `src/i18n/sw.ts`, `docs/i18n-native-review-candidates.md` | Inline English defaults in components, translations, Session 38 packet. |
| Closeout: `MASTER_TODO.md`, `docs/session-prompts/session-39-verification-w4.md` | Honest shipped/build/review status and next-wave prompt. |

### Public types and seam contracts

Names below are the implementation contract between tasks. Define types in `verificationModel.ts`, re-export through `verification.ts`. Existing `VerificationCtx`, `CallParticipant`, `CallSession`, and `MemberSummary` remain the shared types.

```ts
export type DailyRole = 'candidate' | 'verifier';
export type DailyPhase = 'preSession' | 'lobby' | 'selection' | 'inCall' | 'finished';
export type DailyAssignment = 'candidate' | 'selectedVerifier' | 'observer' | 'unavailable';
export interface DailyParticipant extends MemberSummary {
  role: DailyRole;
  joined: boolean;
  // Candidate's actual/simulated baseline; never inferred from online status.
  approvalCount: number;
}
export interface DailySnapshot {
  id: string;
  dayKey: string;                  // UTC YYYY-MM-DD
  role: DailyRole;                 // frozen
  phase: DailyPhase;
  now: number;                     // epoch milliseconds from service clock
  startsAt: number;
  joinOpensAt: number;
  selectionAt: number;
  joinAllowed: boolean;
  joined: boolean;
  reminderEnabled: boolean;
  demoClock: boolean;
  clockGeneration: number;        // increments on dev override/reset
  participants: DailyParticipant[];
  candidate: CallParticipant;
  selectedVerifierKeys: string[];
  assignment: DailyAssignment | null;
  call: CallSession | null;
  newlyVerifiedCount: number;      // unique candidates crossing 4 in this run
}

dailySessionState(ctx: VerificationCtx): Promise<DailySnapshot>;
joinDailyStream(id: string, onUpdate: (s: DailySnapshot) => void): () => void;
joinDaily(ctx: VerificationCtx, id: string): Promise<DailySnapshot>;
selectVerifiers(ctx: VerificationCtx, id: string): Promise<DailySnapshot>;
enterDailyCall(ctx: VerificationCtx, id: string): Promise<DailySnapshot>;
finishDailyCall(ctx: VerificationCtx, id: string): Promise<DailySnapshot>;
setDailyReminder(ctx: VerificationCtx, id: string, enabled: boolean): Promise<DailySnapshot>;
leaveDaily(ctx: VerificationCtx, id: string): Promise<void>;
```

`dailySessionState` gets/creates an owner-scoped pre-session runtime; it does not opt the user in. Key ownership by `ctx.publicKey` and the UTC day; reject writes with another owner. Allocate a fresh unique run id after cancellation so a late cleanup cannot destroy its replacement. `selectVerifiers` is an idempotent deadline transition, not a UI “try my luck” action. `enterDailyCall` returns the same call on a retry. `finishDailyCall` snapshots partial/completed results, calls the existing call cancellation path, and moves to `finished`. `leaveDaily` cancels the daily run and child call, preserving vouches already banked. All potentially throwing seam functions are `async` so callers receive rejections rather than uncaught synchronous exceptions.

## 4. Implementation tasks

### Task 0 — Ground the execution and record the accepted design

**Files:** this plan, new S38 design addendum, S38 prompt if its handoff note needs updating. **Worker:** controller only.

- [x] Record HEAD/worktree state and the implementation base SHA. Read all commits after `ac8523b` before assuming this file still describes current source. Preserve unrelated changes.
- [x] Resolve only still-open recommendations in §2, recording who approved what and when. Clock/selection approval does not imply approval of unrelated product choices. Do not reopen the locked verifier door, threshold, or F10.
- [x] Write the S38 addendum from §2–§3, including both role journeys, one-candidate demo scope, UTC boundaries, reminder limitation and simulated total wording. Link it from this plan. Record later deviations there as dated amendments.
- [x] Capture a baseline using the four commands in §5. Record actual errors separately from new regressions; do not claim a green baseline from S37's old report.
- [x] Commit only these planning docs as `docs(s38): record daily verification design and Sol implementation plan` before feature commits. Keep progress in this plan, not AGENTS.md.

**Acceptance:** accepted decisions distinguishable from recommendations; no implementation yet; recorded baseline and exact base SHA.

### Task 1 — Make the countdown suitable for a daily deadline

**Files:** `src/hooks/useCountdown.ts`, `src/components/shared/CountdownTimer.tsx`; SCSS only if duration width requires existing-token layout changes. **Worker:** safe sequential task.

**Consumes:** existing `(seconds, onDone)` and `CountdownTimer` usages. **Produces:** optional third hook argument `{ deadlineMs: number }`; optional `deadlineMs` and `formatValue` props on CountdownTimer. Existing callers remain valid.

- [ ] Preserve mount/reset semantics and once-only `onDone`. Compute remaining time from a fixed deadline instead of subtracting one tick:

  ```ts
  const remainingAt = (deadline: number, now: number) =>
    Math.max(0, Math.ceil((deadline - now) / 1000));
  // Initial deadline = supplied deadlineMs ?? Date.now() + seconds * 1000.
  // Each existing interval tick samples Date.now(); on visibility return,
  // sample again. Run onDone from an effect, never inside a state updater.
  ```

- [ ] Clean up the interval and visibility listener. StrictMode must not double-fire completion. `CountdownTimer` displays `formatValue?.(remaining) ?? remaining`; its translated `label(remaining)` contract and `aria-live="off"` remain unchanged.
- [ ] Daily consumers use `deadlineMs={Date.now() + Math.max(0, target - snapshot.now)}` at a phase mount and key by run id + target + demo-clock generation. They never restart every render. The service still decides Join eligibility/selection; a displayed zero cannot authorize a join.
- [ ] Verify a normal 5s W2 countdown, zero-duration mount, background/foreground beyond deadline, changed-key restart, and once-only completion under StrictMode. Display 23h/2m30s without raw five-digit seconds; no per-second screen-reader announcements.

**Acceptance:** baseline commands + controller countdown walk in both themes; W2 completion still reaches the hub. **Commit:** `fix(s38): make shared countdown follow elapsed time`.

### Task 2 — Build the daily runtime and adapt the existing call simulation

**Files:** `src/services/verificationModel.ts`, new `src/services/demo/dailyVerificationSim.ts`, `src/services/demo/verificationSim.ts`, `src/services/verification.ts`, `docs/FOR_OURI_seam.md`. **Worker:** one sequential worker; these files are coupled.

- [ ] Add §3's types and API. Compute schedule with UTC calendar functions, never local date setters:

  ```ts
  const todayStart = Date.UTC(
    new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(), 21, 0, 0,
  );
  const selectionAt = todayStart + 150_000;
  const startsAt = now < selectionAt ? todayStart : todayStart + 86_400_000;
  // Existing joined runs retain their original date/deadline after selection.
  // A fresh run at/after selection uses tomorrow.
  // joinAllowed: startsAt - 300_000 <= now && now < startsAt + 150_000.
  ```

- [ ] The daily runtime schedules the next boundary and reconciles its absolute deadlines before every read/write and on visibility return. On selection deadline it invokes the same internal transition exposed by `selectVerifiers`; the UI does not drive selection from CountdownTimer. Before the user joins, rollover updates tomorrow's schedule without simulating their participation. Cancel boundary timers and visibility listeners on `leaveDaily`.

- [ ] Build the demo roster from existing verified member profiles, excluding self, candidate, duplicate keys, and members with `declines: true` from the available/opted-in verifier set. Add the local participant with actual frozen role and actual approval count. Keep absent members out of the joined count. Snapshot membership once; no random resampling on rerenders.
- [ ] Select only joined verifiers; exclude the candidate's existing voucher keys. Pin a reproducible ordering by rotating lexicographically sorted keys with a stable hash of `dayKey + ':' + candidate.publicKey`, then take at most `VERIFIED_THRESHOLD`. Do not use `Math.random` for assignments. Store selection once. Ordinary and dev scenarios execute this same algorithm.
- [ ] Candidate path is always assigned `candidate` when a nonempty eligible group exists. Verified user is `selectedVerifier` only if their key is in the frozen group, otherwise `observer`. Empty group becomes `unavailable`, with a direct-request/next-session exit; never an indefinite spinner. Partial groups bank actual vouches and remain short of threshold if appropriate.
- [ ] Add an internal constructor in the existing call sim:

  ```ts
  simCreateDailyCall(
    ownerPublicKey: string,
    candidate: CallParticipant,
    verifiers: CallParticipant[],
  ): CallSession;
  ```

  It uses the existing session registry, cancellation and verification machinery, creates an active daily call with the selected joined roster, and sets self-candidate ownership only when candidate.publicKey equals ownerPublicKey. Set `method: 'daily'`; W2 constructors set `'call'`. Mark the daily call's join timeline already driven so subscribing cannot schedule W2's joins/timeout again. Automatic verification schedules all fixture verifiers **except the local manual verifier**; candidate sessions auto-verify everyone. An observer has no manual participant.
- [ ] Use `session.method` in `applyVerification`; preserve one-vouch-per-pair and `selfIsCandidate`. No component writes trust. No auto-verification before explicit candidate/selected-verifier entry. An observer's sample group may run automatically after selection, with the persistent demo disclosure.
- [ ] Store the daily child call's owner key. Immediately before banking an automatic daily vouch, compare it with `store.getState().user.publicKey` (`src/store/index.ts`); an owner mismatch cancels that run without writing. Component cleanup alone is insufficient if authentication changes just before a queued timer fires. This guard prevents new cross-account writes; it does not claim to fix the pre-existing per-browser Digital Agent persistence model.
- [ ] Make `enterDailyCall` idempotent and restricted to candidate/selected assignments. Create the child call only once, subscribe in the daily runtime, and publish updated snapshots. `finishDailyCall` captures results before deleting the call; `leaveDaily` clears **all** daily timers/subscribers and delegates to `simLeaveCall`. Stream unsubscribe only detaches that subscriber. Stale resolves must be disposed, including StrictMode replay and account changes.
- [ ] Maintain an in-memory set of completed candidate keys: compare baseline distinct approvals with distinct successful verifier keys; increment only when `<4` becomes `>=4`, once. No increment for joining, selecting, a single vouch, or manually leaving. Candidate uses their real baseline; fixture candidate uses the clearly disclosed simulated zero baseline. Scope the UI count to this local session, not global “today.”
- [ ] Tab-only reminder preference uses an owner-keyed in-memory map and survives leaving/reopening the route within the tab; reload clears it. This produces no notification. Document the intentional lifetime exception to call/session cleanup.
- [ ] Add a FOR_OURI S38 row for **each of the eight** public daily functions: simulation-only, no contract counterpart. The durable effect is already-described `vouch(public_key, 'daily')`, by the verifier/caller in the real implementation. No `join_daily`/`select_verifiers` wire invention. Correct the stale unsubscribe comment.

**Acceptance:** §5 commands; use the app's development environment to inspect seam outputs for repeated selection/entry, empty/partial groups, cancellation and method metadata. Check candidate 0→4, partial 2→4+, verifier's own count unchanged, duplicate vouch no-op, and zero timers writing after leave. No fixture/seed files or DEMO_VERSION changed. **Commit:** `feat(s38): add daily verification simulation behind the seam`.

### Task 3 — Ship pre-session, lobby and the dev walkthrough controls

**Files:** new `useDailyVerification.ts`, `DailySession.tsx`, `DailySessionLobby.tsx`, `DailySession.module.scss`; `IdentityView.tsx`; demo-state sidecar and `HomepageMenu.tsx`; fr/sw + packet. **Worker:** one sequential worker, controller performs preview.

**Consumes:** §3 API and deadline countdown. **Produces:** reachable daily route with pre-session/lobby and complete cleanup; normal product entry links wait for Task 5.

- [ ] `useDailyVerification` returns `{ snapshot, loading, error, busy, join, enterCall, finishCall, setReminder, retry }`. Each action uses the current ctx/run id; `retry` cancels the old run before loading a new one. Subscribe after loading; cleanup unsubscribes and leaves the captured run. A late creation result after cleanup is immediately left, never abandoned.
- [ ] Render loading/error/unauthenticated states explicitly. Retry and Back to verification remain reachable. Account/public-key changes remount the run; ordinary agent vouch updates do not reset it.
- [ ] Pre-session shows the fixed 21:00 UTC time and, optionally, a locale-formatted local-time equivalent; CountdownTimer with hours/minutes/seconds; Join disabled before 20:55 with a visible explanation. Render F10's two existing keys plus a separate daily demo line before Join. Reminder is a controlled labelled checkbox with a 44px label target and the §2 limitation visible.
- [ ] Register `verification/daily` and `verificationTitles.daily` in IdentityView. The route's AppHeader owns h1; all internal headings start at h2.
- [ ] Lobby joins through the seam, uses `MemberCard` directly with `resolveTrustState(participant.approvalCount)`, and pairs each presence label with joined/waiting text. The live count is joined participants, not the full fixture directory. Show “Session starts in…” before 21:00 and “Selecting verifiers in…” afterwards. Mount a quiet status region before populating it; do not wrap the per-second timer in it. Leave remains reachable above StageFooter.
- [ ] Extend the existing demo dialog with deterministic presets: real clock, pre-session closed, join window, lobby near selection, selected verifier, observer, and empty verifier pool. Export dev controls from the daily sim to this `.demo.tsx` exception only; keep normal components on the seam. Presets select eligible roster/clock inputs, never set a winning result or bypass trust directly. Reuse existing trust presets when preparing each walkthrough.
- [ ] For a selected-verifier preset, prepare exactly four eligible opted-in verifiers including the local verified user. For an observer preset, prepare a deterministic larger roster/day for which the same selection algorithm leaves the local user outside the first four. Apply the existing trust scenario **first**, allow its reload, then apply the in-memory daily preset. Expose no production control for choosing an outcome.
- [ ] Clock offset advances from an anchored real clock; it must not freeze at an absolute timestamp. Applying a preset clears the old run and child call and updates subscribers **without reloading away an in-memory override**. Show “Demo clock” throughout the affected daily flow; reset to real clock explicitly. Keep controls guarded in the implementation as well as the menu.
- [ ] `HomepageMenu` lazy-loads the demo dialog behind `import.meta.env.DEV`, with a Suspense fallback; production must not eagerly import or execute the controls. Preserve the four existing S36 scenarios and their reload behavior.

**Acceptance:** §5 commands; controller checks 20:54:59 / 20:55:00 / 21:00 / 21:02:29 / 21:02:30, midnight UTC rollover, hidden-tab return, reminder toggle failure recovery, and leaving during load/lobby. At this checkpoint the route can show selection as a status but must have an escape; add public pathway links only after Task 4. **Commit:** `feat(s38): add daily session entry and lobby`.

### Task 4 — Connect selection, both call roles and truthful results

**Files:** `DailySession.tsx`, new `DailySessionResult.tsx`, `DailySession.module.scss`, `InCallView.tsx`, `ApprovalHistory.tsx`, fr/sw + packet. Read/reuse `CallSummary.tsx`; change it only if an actual daily requirement cannot be supplied around it. **Worker:** one sequential worker.

- [ ] Render candidate assignment as “Your verification group is ready”; selected-verifier assignment as “You've been selected to help verify {name}.” Show the selected roster and an explicit “Join call” action. Both call entries retain the daily demo disclosure and F10 context. No manual Verify button appears for the candidate.
- [ ] Add optional `onComplete?: () => void` to `InCallViewProps`. Its existing countdown invokes this when supplied; otherwise it keeps W2's hub navigation. Daily passes a callback that awaits `finishCall` and shows the daily result. Daily's explicit leave/dismiss uses the same idempotent finish action and retains the last call snapshot for CallSummary.
- [ ] Subscribe InCallView when `role === 'candidate' || session.method === 'daily'`. Keep W2's manual verifier semantics. For a daily verifier, automatic peer updates and the manual button return both update the same call snapshot. VerifyButton confirms only the local member's vouch; it does not mark the whole group confirmed. Use stable callbacks so subscriptions do not restart unnecessarily.
- [ ] Daily result keeps the frozen role for `CallSummary`, and adds the session result. A candidate who crosses four remains a candidate through completion. A verifier sees whom they helped, not a claim that their own approvals increased. Incomplete groups clearly preserve partial progress.
- [ ] Observer result thanks the volunteer and explains that others were selected; it does not create a rejection or failure state. While the sample group runs, show progress and an immediate exit. Once settled, display **“New members verified in this demo session: {count}”**, then a 5s countdown to the hub with Dismiss and Stay here controls. The count remains visible after Stay here; do not auto-remove information on a focused user.
- [ ] Empty pool uses a neutral EmptyState with next session and text-vouch exits. Partial verification yields zero newly verified members when threshold was not crossed; explain actual approvals separately. A completed call and a newly verified member are different facts.
- [ ] Replace ApprovalHistory's binary method formatter with explicit direct/invitation/call/daily branches; proposed English labels: “Vouched for you”, “Invited you”, “Vouched by video call”, “Vouched in the daily session”. Record these new strings in the packet. Read persisted metadata to verify labels, not only visible progress.
- [ ] Move focus to the new state's h2 (`tabIndex={-1}`) after an explicit step change. Preserve always-mounted polite announcements for selection/completion. Decorative icons are aria-hidden; inline completion uses no fake modal scrim. No repeated countdown announcements.

**Acceptance:** §5 commands; controller walks candidate 0, candidate 2, selected verifier, observer, partial and empty pool end-to-end. Regression-walk W2 candidate with a decliner/late joiner and W2 verifier manual action, completion, dismissal and summary. **Commit:** `feat(s38): connect daily selection to calls and session results`.

### Task 5 — Add the daily doors and finish the handoff

**Files:** `PathwayCards.tsx`, `VerificationHub.tsx`, their existing SCSS modules only as necessary; fr/sw + packet; S38 spec/plan; `MASTER_TODO.md`; new S39 prompt. **Worker:** sequential UI task, then controller-only review/closeout.

- [ ] Add fourth candidate PathwayCard after request, invitation and call. Reuse F10 keys/link. Verified hub gets the accepted daily row with **verifier** copy, linking to `/identity/verification/daily`. It must be reachable through the normal UI, not just a typed URL or dev control. Leave the candidate-framed call card hidden for verified users.
- [ ] Keep daily disclosures visible before either role commits; do not make every fixture person appear actually online or verified. Review en/fr/sw at 360px for wrapping, count 0/1/4, no overflow, keyboard focus, and real hit targets. Use agreement-free count formulations; add unresolved native-language questions to Session 38 rather than copying S37's plural-at-one pattern.
- [ ] Run §5 and the full matrix below. Record actual results next to unchecked tasks; do not mark a browser/manual check complete from typechecking alone.
- [ ] Review the entire diff from Task 0's saved base SHA, including docs and shared countdown/call changes. Obtain the required whole-session review, fix findings, and rerun only affected checks plus required final gates. Local multi-model panel remains opt-in; never add `--yes` without its separate authorization.
- [ ] Update MASTER_TODO P11 W3 and prepend the S38 changelog **only with achieved status**. Record DEMO_VERSION decision, i18n delta, commit range, preview coverage and review status. Keep W4, native review, unrelated S36/S37 minors and Ouri coordination open.
- [ ] Write S39 W4 prompt with verified premises, eight daily seam functions, reminder limitation, available daily lifecycle transitions, and where future notification producers can attach. Update available project session memory according to the lifecycle skill; repo docs must be sufficient to start cold even without that memory.
- [ ] Present the concrete completed diff and review result before the push gate. Do not infer authorization to push from authorization to implement this plan.

**Acceptance:** both roles enter through real UI; all required states observed; no unreported regression; closeout distinguishes built/reviewed/pushed/deployed. **Commits:** `feat(s38): expose daily verification pathways`, then `docs(s38): record verification evidence and W4 handoff`.

## 5. Verification commands and acceptance matrix

Run from the quoted repo root, sequentially. The commands were confirmed to exist; only i18n parity was executed during this planning pass. Sol must run the build and browser checks during implementation.

```sh
cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
npx --no-install tsc -b --noEmit
npm run build
sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh
node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs
```

Also inspect these targeted gates (a nonzero `rg` exit means no hits, not a build error):

```sh
rg -n '^import .*verificationSim|^import .*dailyVerificationSim|from .*services/demo' src/components/identity/verification --glob '*.tsx' --glob '!*.demo.tsx'
rg -n 'setTimeout\(|setInterval\(' src/components/identity/verification
rg -n 'getUserMedia|RTCPeerConnection|Notification\.requestPermission' src/components/identity/verification src/services/demo/dailyVerificationSim.ts
git diff --check
```

Expected: no new forbidden imports, component timers, media/notification calls or whitespace errors. Inspect multiline imports too; grep is a lead, not a parser. Review token use in changed SCSS and fixture/seed diffs manually. Do not treat the existing comment mentioning `verificationSim.ts` as a seam violation.

| Scenario | Required observation |
|---|---|
| Candidate, zero approvals | Daily card → pre-session → lobby → candidate group → call → four distinct `'daily'` vouches → verified; no role flip. |
| Candidate, two approvals | Prior voucher keys excluded; only new unique approvals added; existing metadata preserved; partial/full result accurate. |
| Verified volunteer, selected | Normal hub daily link works; own count remains unchanged; own Verify is manual; peer updates arrive; no self-vouch. |
| Verified volunteer, observer | Stable result on reread; no Verify action; sample total reflects threshold crossing only; stay/dismiss/leave work. |
| Empty/partial eligible pool | Finite result, no retry lottery or spinner; available vouches banked once, threshold not falsely claimed. |
| Leave / back / route away | No later vouches from the abandoned run; child and daily timers cleaned; rapid double taps create one run/call. |
| Async failure / StrictMode / account change | Retryable visible error; busy resets; late session disposed; account switch cannot deliver an old run's vouches to the new agent. |
| UTC boundaries / late entry | Exact 20:55 gate; shared 21:00 + 150s deadline; closed at selection; tomorrow computed in UTC. |
| Hidden tab / dev clock | Deadline catches up on visibility return; no outcome driven by slow display ticks; override labelled and absent in production. |
| Reload / repeated route visit | In-flight simulation resets honestly; already banked vouches persist; reminders have the stated tab-only lifetime. |
| W2 regression | Existing picker selection/refresh, decliner, first-join Start, late auto-verification, both summaries and 5s completion remain correct; method stays `'call'`. |
| Accessibility / language | One h1; 44px targets; reachable leave; focus follows steps; status node pre-mounted; no per-tick announcements; 360px light/dark en/fr/sw and reduced-motion checked. |

**Evidence boundary:** DOM/accessible-name inspection is not proof of audible screen-reader announcements. Record a manual screen-reader check as pending if it was not performed. A production bundle check proves dev controls are absent; it does not prove a deployed site was updated.

## 6. Copy-paste kickoff for Sol

> Implement S38 Prompt 2 Wave 3 using `docs/superpowers/plans/2026-09-09-s38-verification-w3-sol.md`. First compare HEAD with its `ac8523b` baseline and read the linked S34–S37 decisions. Complete Task 0, carrying forward any approvals already given; distinguish proposed product choices from locked ones. Then implement tasks sequentially, keeping status and evidence in the plan. Reuse the existing verification seam and call simulation; protect frozen roles, daily vouch attribution, timer cancellation, truthful totals and the daily-only verifier door. The controller owns all preview interaction. Finish implementation, checks, required review and closeout; ask for push authorization only after the result is concrete. W4 remains separate.

## Execution ledger (2026-09-09)

- Task 0: complete. Base `ac8523b`; no intervening commits. Typecheck/build/grep gates/parity passed; existing Sass deprecation warnings only. Vite reports 8.1.5 (older skill stack versions are historical).
- Task 1–5: pending. Browser verification not yet performed. Required Opus review and push remain pending.
