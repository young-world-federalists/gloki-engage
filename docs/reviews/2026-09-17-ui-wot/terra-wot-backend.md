# Terra: Web of Trust backend review

Read-only 2026-09-17. Deployed/source means git a81218f9da6af21cb598441be1fbb930ddf5e1c1. External running server not audited. Local ui f606d9f.

The deployed Python contracts reviewed contain no WoT methods. Local verification intentionally simulates UI and persists vouches in browser localStorage. Older trust UI calls community methods absent from the deployed community contract; its participation gates run in React. These are production-readiness blockers, not proof of an exploit against the unseen running server and not regressions against approved demo scope.

| Finding | Evidence | Acceptance |
|---|---|---|
| Missing authoritative global approval store | deployed src/assets/contracts/digital_agent_contract.py:1-18 only profile fields | Server supports unique approver/approvee records, eligibility, count and signature/audit evidence. |
| Older service/contract mismatch | deployed src/assets/contracts/gloki_engage_community_contract.py:1-21 only details/initiatives; deployed src/services/trust.ts:21-50 calls get_vouches/get_stage_permissions/set_stage_permissions | Defined, wired authoritative API, including required permission enforcement. |
| Locally mutable verification status | local src/services/trust.ts:59-67 addUserVouch accepts arbitrary keys; src/components/identity/agent/digitalAgentStore.ts:56-70,87-94; src/hooks/useCommunityTrust.ts:59-69 derives count | Browser cache cannot grant production rights. |
| No real call/attendance proof | src/services/demo/verificationSim.ts:5-13; src/services/verification.ts:102-152; docs/FOR_OURI_seam.md:265-299 | Server-owned session and verified provider attendance gate call approvals. |
| No server random assignment | src/services/verification.ts:105-113 accepts candidate supplied verifier IDs; src/services/demo/dailyVerificationSim.ts:122-136,177-207 deterministic rotation | Server samples eligible verified pool, caller cannot choose. |
| Client-only reviewed access gates | src/components/community/StageGate.tsx:52-72; src/hooks/useCommunityTrust.ts:58-85 | Protected operations check authoritative global status server-side. |

| Requirement | Local UI/demo | Reviewed backend source |
|---|---|---|
| Four approvals | trustModel.ts:21,35-40 threshold | Missing authoritative count |
| Distinct approvers | trust.ts:60-66 key dedupe | Missing |
| Verified approver | verificationDemo.ts:109-113,142-149 UI/demo guard | Missing |
| Self-vouch rejection | addUserVouch lacks self rejection | Missing |
| Global scope | useCommunityTrust.ts:59-63 local current-user global; other persona graph per-community | No global backend directory/store |
| Signed approvals | verificationModel.ts:14-19 lacks signature/session | Missing |
| Invitation explicit flag | verificationModel.ts:49-53 vouch; verificationDemo.ts:208-213 stores only draft | Missing enforcement |
| Request/direct approval | verificationDemo.ts:163-206 local queues/auto-responses | Missing |
| Scheduled availability/random8-10 | supplied keys, no availability model | Missing |
| Daily/random4 | in-memory deterministic simulation | Missing |
| Embedded provider video | simulation only | Missing reviewed source |
| Attendance/no-show/requeue | tab cleanup only | Missing durable lifecycle |
| Abuse metrics/limits | no verifier-stat model | Missing |
| Notifications | tab-local simulation | Missing server recipient delivery |
| Access enforcement | StageGate UX | Missing reviewed server enforcement |

Short model/service paths above under src/services, demo files under src/services/demo.

S36 intended request_vouch/vouch/decline_vouch/get_vouches/directory methods are documented but unimplemented in reviewed contracts (FOR_OURI_seam.md:236-260). S37/S38 :265-320 deliberately prohibit call lifecycle methods on the contract. This does not prohibit an off-contract production service for orchestration, video, attendance, randomness, signing, notifications and abuse policy. S39 :322-356 states notification production needs. Plan explicit architecture with Ouri rather than inventing blockchain lifecycle methods or treating handoff prose as implemented backend.
