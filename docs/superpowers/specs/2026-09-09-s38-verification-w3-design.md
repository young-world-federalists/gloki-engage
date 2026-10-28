# S38 — Daily verification session design addendum

Date: 2026-09-09. Implementation base: `ui` at `ac8523b`.

Parent: [S34 §3.3 W3](2026-09-02-s34-review-causes-impact-verification-design.md). Implementation contract and acceptance matrix: [Sol plan](../plans/2026-09-09-s38-verification-w3-sol.md).

## Authorization and scope

Eston requested a plan for Sol, then said “Continue” after the completed planning handoff. The controller proceeds with the plan's recommended defaults. These defaults are controller recommendations authorized for execution, not quotations or individually attributed founder rulings. The existing 2026-09-07 ruling remains locked: the daily session is the verifier's door; no standing verify-now hub card.

Wave 3 only. D8 platform-wide trust and threshold four, D9 nested Identity route, F10 camera/data framing and linked text alternative, S36 deterministic outcomes and honesty, and S37 frozen roles/cancellation/role-aware call copy all bind. W4 notifications, real video, production selection fairness, and backend deployment remain separate.

## Daily session behavior

- Route `/identity/verification/daily`, titled by IdentityView. Candidate enters from the fourth PathwayCard; verified volunteer enters from a daily-session row on the hub. Both first see pre-session.
- Fixed UTC start 21:00; Join opens 20:55; selection closes entry at 21:02:30. Early joiners wait until 21:00 before the shared 2:30 countdown. Late new runs show tomorrow. Existing joined runs retain their day.
- One simulated candidate and a group of at most four distinct joined, opted-in eligible verifiers. Deterministic day/candidate ordering, stable on retry. Exclude self/candidate/prior vouchers and decliners; no random outcome. Candidate always follows the candidate path; verified volunteer may be selected or observer.
- Candidate/selected verifier explicitly joins the assigned call after seeing the selected roster. Observer may watch a clearly labelled sample group progress. Empty/partial groups have a finite result and text-vouch/next-session exit.
- Reuse InCallView and CallSummary with frozen entry role. Daily has multiple verifier updates; the local verifier acts manually, fixture peers act automatically. Candidate receives actual distinct demo vouches with method `daily`; verified volunteer never receives their own action.
- Count unique candidates crossing four distinct approvals, not approvals or attendees. Sample candidate has explicitly simulated zero baseline independent of fixture-directory trust. Result says “New members verified in this demo session: {count}”; no global today claim. Observer's settled result offers five-second auto-return, Dismiss, and Stay here.
- Reminder is a tab-lifetime, owner-keyed choice. Label “Set reminder (demo)” and helper “This demo saves your choice while this tab stays open; it sends no reminder.” No notification or background-delivery promise.
- Normal clock is real UTC. Existing dev state dialog gains labelled clock/roster presets; production excludes controls. Offset advances with wall time; overrides never bypass eligibility or directly set an outcome.

## State, ownership and persistence

`preSession → lobby → selection → inCall → finished`, with observer/unavailable branches from selection. Role freezes when the run is created. New runs receive unique ids; idempotent actions cannot create duplicate child calls. The route hook owns daily lifetime; daily runtime owns child-call cancellation. Subscriber removal detaches only that subscriber. Stale async creation results are immediately disposed. Account changes cannot bank an old run's queued vouch onto the new agent.

Session transitions and timers live in services, and reconcile absolute UTC deadlines at reads/writes/visibility return. Countdown hook displays wall-clock remaining time and has once-only completion with cleanup; it never decides service eligibility. Daily module is in-memory; no seeded fixture edit or DEMO_VERSION bump. Vouches already banked persist through the existing Digital Agent store. Runtime totals and reminders are explicitly local simulation state.

## Interfaces and UI constraints

The plan §3 defines the eight daily seam functions and pure types. Every new function receives a simulation-only wire row in FOR_OURI; no daily or call lifecycle contract method is invented. The existing vouch method already accepts `daily`. CallSession gains required `method: 'call' | 'daily'`; W2 defaults stay call.

Use existing kit and tokens, mixed-role MemberCard rows with real trust labels, one h1, 44px targets, reachable sticky leave, role-accurate disclosures before commitment, pre-mounted polite status regions, no per-tick announcements, reduced-motion behavior, and fr/sw parity with a Session 38 native-review packet. Preserve W2 late arrivals, decliners and both summaries.

## Evidence and review

Baseline typecheck/build/grep gates/parity passed on 2026-09-09; existing Sass deprecation warnings only. Implementation and browser evidence are recorded in the plan as completed. A required Opus whole-session review remains distinct from available-model task reviews. Push requires Eston's explicit instruction after the concrete reviewed result; Ouri merges to server-side for deployment.
