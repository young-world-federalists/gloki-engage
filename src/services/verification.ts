// Verification seam (S36 — Prompt 2). THE ONLY import components use for
// verification data. Every function delegates to the demo layer today;
// FOR OURI swaps these bodies for contractRead/contractWrite against the
// Digital Agent contract (get_vouches / request_vouch / vouch / decline_vouch —
// docs/FOR_OURI_seam.md, S36 addendum) without touching a component.
import {
  demoGetState,
  demoListMembers,
  demoRequestVouch,
  demoRespondToRequest,
  demoSendInvitation,
  demoRequestInvitation,
} from './demo/verificationDemo';
import type {
  InvitationDraft,
  MemberSummary,
  VerificationCtx,
  VerificationState,
  VouchRequest,
} from './verificationModel';

export type {
  Approval,
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
