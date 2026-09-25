# Terra review: Web of Trust UI coverage

2026-09-17; local ui HEAD f606d9fb5f2a82a55b6e59b1b2d026ed2f0af84c. Source inspection only; deployed authenticated behavior unverified.

| Requirement | Status and evidence |
|---|---|
| Home status and X/4 | Built UI: VerificationHub.tsx:39,49; useVerification.ts:44. Four segments and threshold-derived status. |
| Home daily/scheduled CTAs | Partial: PathwayCards.tsx:28 has four pathways; immediate Start a call replaces scheduled path. |
| Progress/history | Partial: ApprovalHistory.tsx:17 has approval history, not call history or upcoming sessions. |
| Weekly availability/profile storage | Missing in verificationModel.ts; VerifierPicker.tsx:48 explicitly lacks scheduling/timezone picker. |
| Scheduled call screen | Missing/conflicting: WaitingRoom.tsx:65 lists named chosen members; no scheduled time or embedded provider. |
| In-call roles | Partial/simulated: InCallView.tsx:116,171 tiles; :141 explicitly no real camera/mic/call. InCallVerifyAction.tsx:57 single Verify action; no in-call Decline. |
| Daily lobby | Partial/simulated: DailySession.tsx:140,166,189 countdown,21:00 UTC,join/reminder; DailySessionLobby.tsx:41 count. Enter/leave instead of availability toggle. UTC example alone is not decisive failure: prompt gives local 9 PM as example. |
| Daily four-verifier selection | Simulated: dailyVerificationSim.ts:128 sorted deterministic rotation; verificationSim.ts:437 automatic fixture verification except local manual verifier. |
| Invitation | Partial/simulated: InvitePage.tsx:73,80 name/email and vouch toggle, default true at :23. Model :49 calls flag vouch; naming can map at seam. :39 sends no email. Explicit opt-in default false and server enforcement needed. |
| Success | Partial: VerificationHub.tsx:31 confetti and verified state; no proven authoritative full-access grant. Separate route not necessarily required if success state fulfills intent. |
| Member request | Partial/simulated: RequestPage.tsx:62,67 search and auto-response, no person contacted. |
| Direct approval | Partial: ApprovePage.tsx:80 incoming-request actions; no proactive pending-user directory. |
| Random scheduled video | Conflicting: VerifierPicker.tsx:77 candidate picks any >=1; verificationSim.ts:261 presentation-random only. |
| Real video and signed approvals | Missing from reviewed UI implementation: verification.ts:102 delegates to simulator; FOR_OURI_seam.md:267 labels tab-lived simulation; Approval at verificationModel.ts:14 lacks session/signature. Backend reviewer to verify enforcement scope separately. |
| No-show requeue | Missing: WaitingRoom.tsx:124 offers manual alternatives; no automatic fresh draw/reschedule. |
| Abuse metrics/rate limits | Missing in reviewed model/call UI; backend reviewer follows. |

Priority: production approval authority and embedded video; system assignment and scheduling; real daily lifecycle; invitation opt-in and server enforcement; histories/requeue/abuse. Reuse existing UI shells.

Open questions: live-video-only principle vs three non-video approval pathways; random assignment vs known contacts; meaning of pending user's action in proactive approval; permitted anonymised roster disclosure. Global scope is explicit in prompt: do not introduce community tier merely from loose wording.

All short paths above are under src/components/identity/verification unless stated; verificationModel.ts and verification.ts under src/services, simulators under src/services/demo, useVerification.ts under src/hooks.
