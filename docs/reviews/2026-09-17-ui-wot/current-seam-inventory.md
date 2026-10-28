# Current verification seam inventory

Read-only inventory of the current UI branch as of 2026-09-17, based on `src/services/verification.ts`, `src/services/verificationModel.ts`, and `src/services/trust.ts`. This describes current frontend contracts and implementation boundaries; it is not an accepted production backend contract.

## Verification facade

`verification.ts` is the component-facing facade. Its `VerificationCtx` currently carries `serverUrl` and `publicKey`, and verification state has no `communityId` because the model says verification is platform-wide on the Digital Agent.

The facade exports state/member/request operations (`getVerificationState`, `listVerifiedMembers`, `requestVouch`, `respondToRequest`, `sendInvitation`, `requestInvitation`) and call/daily-session operations (`inviteToCall`, `availableVerifiers`, call stream/start/verify/leave, pending candidate/verifier join, and daily state/join/select/enter/finish/reminder/leave). The first group delegates to `demo/verificationDemo`; call and daily operations delegate to in-memory simulations. Invitation delivery is explicitly local-only in the current implementation. Call and daily session lifecycle are simulations, not durable backend operations.

## Current data model

`VerificationState` contains approvals held by the current user, incoming requests, sent requests, and requested invitations. An `Approval` has `id`, `approver`, method (`VouchMethod`), and timestamp. A `VouchRequest` has `id`, requester/approver keys, timestamp, and pending/approved/declined status. `InvitationDraft` carries name, email, and a vouch boolean. `MemberSummary` contains public key, display name, ISO alpha-2 country, and online status.

Call simulation types describe candidate/verifier participants, waiting/active/complete state, call method, and simulated timing. Daily snapshot types describe day and phase, timing/join state, participants, selected verifier keys, assignment, call, and newly verified count. These types encode UI/demo state; they do not establish server authority, identity proof, persistence, privacy policy, or a secure random selection contract.

## Trust helpers

`trust.ts` has a separate community-scoped seam (`serverUrl`, `publicKey`, `communityId`) that reads community vouches and stage permissions via `contractRead`, and writes stage permissions via `contractWrite`. These are community contract operations and do not provide global verification authority. `addUserVouch` deduplicates and appends a vouch to the local Digital Agent store, with method/timestamp metadata; this is local browser state and must not be treated as authoritative production approval evidence.

## Handoff boundary and unknowns

The current verification facade is demo-backed. Its comments describe possible swap points, but no backend repository/location was provided and no production transport or accepted schema is present in the inspected files. B1 still requires Ouri's backend inspection and an agreed authoritative model, identity/key-binding and signature rules, operation authorization, persistence/replay semantics, and negative-case results. Do not infer endpoints, wire errors, or contract methods from these UI types. No B1 gate is complete based on this inventory.
