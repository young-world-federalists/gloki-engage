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
