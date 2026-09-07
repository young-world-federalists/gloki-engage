// Verification seam (S36 — Prompt 2). THE ONLY import components use for
// verification data. Every function delegates to the demo layer today;
// FOR OURI swaps these bodies for contractRead/contractWrite against the
// Digital Agent contract (get_vouches / request_vouch / vouch / decline_vouch —
// docs/FOR_OURI_seam.md, S36 addendum) without touching a component.
//
// The call functions (S37 — Wave 2) are the one exception: they simulate a
// call in memory and have no contract counterpart to swap to — see the S37
// addendum in the same doc.
import {
  demoGetState,
  demoListMembers,
  demoRequestVouch,
  demoRespondToRequest,
  demoSendInvitation,
  demoRequestInvitation,
} from './demo/verificationDemo';
import {
  simAvailableNow,
  simInviteToCall,
  simJoinAsVerifier,
  simJoinStream,
  simLeaveCall,
  simPendingCandidate,
  simStartCall,
  simVerifyInCall,
} from './demo/verificationSim';
import type {
  CallParticipant,
  CallSession,
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  VouchRequest,
} from './verificationModel';

export type {
  Approval,
  CallParticipant,
  CallSession,
  CallState,
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  VouchMeta,
  VouchMethod,
  VouchRequest,
  VouchRequestStatus,
} from './verificationModel';

/** Vouches held, requests waiting on the user (verified users only), requests sent. */
export function getVerificationState(ctx: VerificationCtx): Promise<VerificationState> {
  return demoGetState(ctx.publicKey);
}

/** The verified members a user can ask; `query` filters by name. */
export function listVerifiedMembers(_ctx: VerificationCtx, query?: string): Promise<MemberSummary[]> {
  return demoListMembers(query);
}

/** Records a pending request at once; resolves 2–5 s later with the settled request. */
export function requestVouch(ctx: VerificationCtx, approverKey: string): Promise<VouchRequest> {
  return demoRequestVouch(ctx.publicKey, approverKey);
}

export function respondToRequest(_ctx: VerificationCtx, requestId: string, approve: boolean): Promise<void> {
  return demoRespondToRequest(requestId, approve);
}

/** Off-platform (email) — the demo records it locally and sends nothing. */
export function sendInvitation(ctx: VerificationCtx, draft: InvitationDraft): Promise<void> {
  return demoSendInvitation(ctx.publicKey, draft);
}

export function requestInvitation(ctx: VerificationCtx, memberKey: string): Promise<void> {
  return demoRequestInvitation(ctx.publicKey, memberKey);
}

// ── Call simulation (S37 — Prompt 2 Wave 2) ─────────────────────────────────
// No contract counterpart — see docs/FOR_OURI_seam.md, S37 addendum.

/** Creates a waiting call session with the caller as candidate; nobody has joined yet. */
export function inviteToCall(ctx: VerificationCtx, verifierKeys: string[]): Promise<CallSession> {
  return Promise.resolve(simInviteToCall(ctx.publicKey, verifierKeys));
}

/** 8–10 online members the picker can invite, minus `excludeKeys` (already-vouched, E5). */
export function availableVerifiers(_ctx: VerificationCtx, excludeKeys: string[]): Promise<CallParticipant[]> {
  return Promise.resolve(simAvailableNow(excludeKeys));
}

/**
 * Live join/verify updates for one call session. The one non-Promise export:
 * a subscription needs a synchronous unsubscribe to call from an effect's
 * cleanup, not a value to await. Clears every timer it started, so a
 * component that unmounts mid-call never leaks one.
 */
export function joinCallStream(sessionId: string, onUpdate: (session: CallSession) => void): () => void {
  return simJoinStream(sessionId, onUpdate);
}

/**
 * `waiting` → `active`; from there the session auto-verifies every verifier,
 * both those already joined and those still arriving. Only the candidate role
 * calls this — the verifier role gets an already-active session from
 * `joinAsVerifier` and taps for itself.
 *
 * `async`, not `Promise.resolve(...)`: the sim throws synchronously on an
 * unknown session, and inside a plain (non-async) function that error would
 * escape before the promise existed — past any `.catch()` a caller attached.
 */
export async function startCall(_ctx: VerificationCtx, sessionId: string): Promise<CallSession> {
  return simStartCall(sessionId);
}

/**
 * Marks `verifierKey` verified in the call. Banks `addUserVouch(verifierKey,
 * { method: 'call', at })` only when the session's own candidate is the local
 * user — never onto a verifier's own agent for verifying someone else's call.
 */
// `async` for the same reason as `startCall`: an unknown session throws synchronously in the sim.
export async function verifyInCall(_ctx: VerificationCtx, sessionId: string, verifierKey: string): Promise<CallSession> {
  return simVerifyInCall(sessionId, verifierKey);
}

/** Ends the call session and clears every timer it still holds. */
export function leaveCall(_ctx: VerificationCtx, sessionId: string): Promise<void> {
  return Promise.resolve(simLeaveCall(sessionId));
}

/** The fixture member a verified user sees waiting to be verified (E6); deterministic, never one the caller already vouched for. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ctx kept for signature parity with the rest of the seam (spec §4); nothing here needs it yet.
export function pendingCandidate(_ctx: VerificationCtx): Promise<CallParticipant | null> {
  return Promise.resolve(simPendingCandidate());
}

/**
 * The E6 verifier role (C1 amendment — `inviteToCall` assumes the caller is
 * the candidate, and this role inverts that). Joins an already-active session
 * against `pendingCandidate()` as its sole verifier; no auto-verify schedule,
 * this user taps for themselves.
 *
 * `async` for the same reason as `startCall`: "no eligible pending candidate"
 * throws synchronously in the sim, and a caller's `.catch()` must see it.
 */
export async function joinAsVerifier(ctx: VerificationCtx): Promise<CallSession> {
  return simJoinAsVerifier(ctx.publicKey);
}
