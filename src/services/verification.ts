// Verification seam (S36 — Prompt 2). THE ONLY import components use for
// verification data. Requests and vouches run on the app-wide verification
// contract (verificationRegistry.ts); invitations stay on the demo layer.
//
// The call functions (S37 — Wave 2) are the one exception: they simulate a
// call in memory and have no contract counterpart to swap to — see the S37
// addendum in the same doc.
import {
  demoGetState,
  demoSendInvitation,
  demoRequestInvitation,
} from './demo/verificationDemo';
import { store } from '../store';
import {
  declineVouch,
  getRegistryStatus,
  personSummary,
  requestVouch as registryRequestVouch,
  vouch,
  type RegistryIdentity,
} from './verificationRegistry';
import { simAvailableNow, simInviteToCall, simJoinAsVerifier, simJoinStream, simLeaveCall, simStartCall, simVerifyInCall } from './demo/verificationSim';
import { DAILY_SESSION_RESET_EVENT, simDailySessionState, simEnterDailyCall, simFinishDailyCall, simJoinDaily, simJoinDailyStream, simLeaveDaily, simSetDailyReminder } from './demo/dailyVerificationSim';
import type {
  CallParticipant,
  CallSession,
  DailySnapshot,
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
  
  
  
  
  
  
  DailySnapshot,
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  
  
  VouchRequest,
  
} from './verificationModel';

export { DAILY_SESSION_RESET_EVENT };

// Ask a member / Requests to vouch run on the app-wide verification contract
// (verificationRegistry.ts), the single source of truth for who is verified.
// Invitations, calls and the daily session below stay simulated: their vouches
// never reach the contract, so they can't verify anyone yet.

const toMs = (at: string): number => {
  const ms = Date.parse(at);
  return Number.isNaN(ms) ? 0 : ms;
};

const requestId = (requester: string, approver: string): string => `${requester}:${approver}`;

function identityFor(ctx: VerificationCtx): RegistryIdentity {
  return { publicKey: ctx.publicKey, address: ctx.serverUrl, profile: store.getState().user.digitalAgentContractId ?? '' };
}

/** Vouches held, requests waiting on the user (verified users only), requests sent. */
export async function getVerificationState(ctx: VerificationCtx): Promise<VerificationState> {
  const [status, demo] = await Promise.all([getRegistryStatus(), demoGetState(ctx)]);
  const me = ctx.publicKey;
  const isVerified = status.verified.some((v) => v.key === me);
  const toRequest = (r: (typeof status.requests)[number]): VouchRequest => ({
    id: requestId(r.requester, r.approver),
    requester: r.requester,
    approver: r.approver,
    at: toMs(r.at),
    status: r.status,
  });
  return {
    approvals: status.vouches
      .filter((v) => v.requester === me)
      .map((v) => ({ id: `ap-${v.voucher}`, approver: v.voucher, method: 'direct', at: toMs(v.at) })),
    pending: isVerified
      ? status.requests.filter((r) => r.approver === me && r.status === 'pending').map(toRequest)
      : [],
    sent: status.requests.filter((r) => r.requester === me).map(toRequest),
    invitationRequests: demo.invitationRequests,
  };
}

/** Everyone verified app-wide except the caller, with names from their profiles; `query` filters by name. */
export async function listVerifiedMembers(ctx: VerificationCtx, query?: string): Promise<MemberSummary[]> {
  const status = await getRegistryStatus();
  const people = await Promise.all(
    status.verified.filter((v) => v.key !== ctx.publicKey).map((v) => personSummary(v)),
  );
  const all = people.map((p) => ({ ...p, online: false }));
  const q = query?.trim().toLowerCase();
  return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
}

/** Records the request on the contract; it stays pending until the approver answers. */
export async function requestVouch(ctx: VerificationCtx, approverKey: string): Promise<VouchRequest> {
  await registryRequestVouch(identityFor(ctx), approverKey);
  return { id: requestId(ctx.publicKey, approverKey), requester: ctx.publicKey, approver: approverKey, at: Date.now(), status: 'pending' };
}

export async function respondToRequest(ctx: VerificationCtx, id: string, approve: boolean): Promise<void> {
  const requester = id.split(':')[0];
  if (approve) await vouch(ctx.publicKey, requester);
  else await declineVouch(ctx.publicKey, requester);
}

/** Off-platform (email) — the demo records it locally and sends nothing. */
export function sendInvitation(ctx: VerificationCtx, draft: InvitationDraft): Promise<void> {
  return demoSendInvitation(ctx, draft);
}

export function requestInvitation(ctx: VerificationCtx, memberKey: string): Promise<void> {
  return demoRequestInvitation(ctx, memberKey);
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
 * cleanup, not a value to await. Unsubscribing removes that listener only;
 * `leaveCall` owns the session timers and is the lifecycle cancellation point.
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
 * { method: session.method, at })` only when the session's own candidate is the local
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

/**
 * The E6 verifier role (C1 amendment — `inviteToCall` assumes the caller is
 * the candidate, and this role inverts that). Joins an already-active session
 * against `pendingCandidate()` as its sole verifier; no auto-verify schedule,
 * this user taps for themselves.
 *
 * `async` for the same reason as `startCall`: "no eligible pending candidate"
 * throws synchronously in the sim, and a caller's `.catch()` must see it.
 */
export async function joinAsVerifier(ctx: VerificationCtx, offerEventId?: string): Promise<CallSession> {
  return simJoinAsVerifier(ctx, offerEventId);
}

// ── Daily verification simulation (S38 — Prompt 2 Wave 3) ────────────────
// No contract counterpart. The only durable effect is the already-documented
// vouch(public_key, 'daily'); lifecycle and reminder state die with the tab.

export async function dailySessionState(ctx: VerificationCtx): Promise<DailySnapshot> {
  return simDailySessionState(ctx);
}

export function joinDailyStream(id: string, onUpdate: (snapshot: DailySnapshot) => void): () => void {
  return simJoinDailyStream(id, onUpdate);
}

export async function joinDaily(ctx: VerificationCtx, id: string): Promise<DailySnapshot> {
  return simJoinDaily(ctx, id);
}

export async function enterDailyCall(ctx: VerificationCtx, id: string): Promise<DailySnapshot> {
  return simEnterDailyCall(ctx, id);
}

export async function finishDailyCall(ctx: VerificationCtx, id: string): Promise<DailySnapshot> {
  return simFinishDailyCall(ctx, id);
}

export async function setDailyReminder(ctx: VerificationCtx, id: string, enabled: boolean): Promise<DailySnapshot> {
  return simSetDailyReminder(ctx, id, enabled);
}

export async function leaveDaily(ctx: VerificationCtx, id: string): Promise<void> {
  simLeaveDaily(ctx, id);
}
