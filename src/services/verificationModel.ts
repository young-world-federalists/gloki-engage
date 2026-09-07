// Pure types for the verification seam (S36). Dependency-free so the demo
// layer, its fixtures and the seam can all import them without a cycle.
import type { VouchMethod, VouchMeta } from './trustModel';

export type { VouchMethod, VouchMeta };

/** Verification is platform-wide on the Digital Agent (D8): no communityId. */
export interface VerificationCtx {
  serverUrl: string;
  publicKey: string;
}

/** A vouch the current user HOLDS. */
export interface Approval {
  id: string;
  approver: string;
  method: VouchMethod;
  at: number;
}

export type VouchRequestStatus = 'pending' | 'approved' | 'declined';

export interface VouchRequest {
  id: string;
  requester: string;
  approver: string;
  at: number;
  status: VouchRequestStatus;
}

export interface VerificationState {
  approvals: Approval[];
  /** Incoming requests waiting on the user. Empty until the user is verified. */
  pending: VouchRequest[];
  /** Requests the user has made, any status. */
  sent: VouchRequest[];
  /** Member keys the user has asked for an invitation. */
  invitationRequests: string[];
}

export interface MemberSummary {
  publicKey: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  online: boolean;
}

export interface InvitationDraft {
  name: string;
  email: string;
  vouch: boolean;
}

// ── Call simulation (S37 — Prompt 2 Wave 2) ─────────────────────────────────
// Still pure: no new imports needed. `verificationSim.ts` and the seam both
// import these; nothing here depends on the sim, so there is no cycle.

export type CallState = 'waiting' | 'active' | 'complete';

/** One person in a call — the candidate being verified, or an invited verifier. */
export interface CallParticipant {
  publicKey: string;
  name: string;
  country: string;
  joined: boolean;
  verified: boolean;
}

export interface CallSession {
  id: string;
  /** The person being verified. */
  candidate: CallParticipant;
  /** Invited; `joined` fills in over time. */
  verifiers: CallParticipant[];
  state: CallState;
  startedAt: number;
  /** The 5-min timeout, simulated at 20 s. */
  timedOut: boolean;
}
