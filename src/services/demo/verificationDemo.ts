// Demo implementation behind src/services/verification.ts (S36).
//
// State lives under ONE localStorage key with the `gloki_demo` prefix, so a
// DEMO_VERSION bump (mockApi.ts clearAllDemoState) wipes it with the rest.
// Vouches the user HOLDS are not here — they persist on the Digital Agent
// store (`vouchedBy` + `vouchMeta`), exactly as the QR scan writes them.
//
// FOR OURI: this whole module is replaced by Digital Agent contract calls
// (`get_vouches`, `request_vouch`, `vouch`, `decline_vouch`) — see
// docs/FOR_OURI_seam.md, S36 addendum. Nothing outside src/services imports it
// except the dev-only scenario dialog and the authenticated notification runtime.
import { getAgent, saveAgent } from '../../components/identity/agent/digitalAgentStore';
import { store } from '../../store';
import { addUserVouch } from '../trust';
import { VERIFIED_THRESHOLD } from '../trustModel';
import { publishNotification, updateNotificationEvent, type NotificationOwner } from '../notificationEvents';
import { PERSONAS } from './fixtures/identity';
import {
  allVerificationMembers,
  memberDeclines,
  SEEDED_INCOMING_REQUESTERS,
} from './fixtures/verification';
import type {
  Approval,
  InvitationDraft,
  MemberSummary,
  VerificationState,
  VouchMeta,
  VouchRequest,
  VouchRequestStatus,
} from '../verificationModel';

const LEGACY_KEY = 'gloki_demo_verification';
const HOUR = 3_600_000;

interface DemoState {
  seeded: boolean;
  sent: VouchRequest[];
  incoming: VouchRequest[];
  /** Vouches the user has GIVEN (requester key → meta). Display-only in W1. */
  given: Record<string, VouchMeta>;
  invitations: (InvitationDraft & { at: number })[];
  invitationRequests: string[];
}

const EMPTY: DemoState = {
  seeded: false,
  sent: [],
  incoming: [],
  given: {},
  invitations: [],
  invitationRequests: [],
};

function storageKey(owner: NotificationOwner): string {
  return `${LEGACY_KEY}:${encodeURIComponent(owner.serverUrl)}::${owner.publicKey}`;
}

function read(owner: NotificationOwner): DemoState {
  try {
    const raw = localStorage.getItem(storageKey(owner));
    localStorage.removeItem(LEGACY_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<DemoState>) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function write(owner: NotificationOwner, state: DemoState): void {
  try {
    localStorage.setItem(storageKey(owner), JSON.stringify(state));
  } catch (err) {
    console.error('[VerificationDemo] Failed to persist state:', err);
  }
}

const newId = (): string => `vr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
/** The spec's simulated response window: 2–5 s. Random delay, deterministic outcome (E2). */
const responseDelay = (): number => 2000 + Math.floor(Math.random() * 3000);

function seededIncoming(approver: string, now: number): VouchRequest[] {
  return SEEDED_INCOMING_REQUESTERS.map((requester, i) => ({
    id: `vr-seed-in-${i}`,
    requester,
    approver,
    at: now - (i + 1) * 5 * HOUR,
    status: 'pending' as const,
  }));
}

function ensureSeeded(owner: NotificationOwner): DemoState {
  const state = read(owner);
  if (state.seeded) return state;
  const next: DemoState = { ...state, seeded: true, incoming: seededIncoming(owner.publicKey, Date.now()) };
  write(owner, next);
  return next;
}

function memberName(publicKey: string): string | null {
  return allVerificationMembers().find((member) => member.publicKey === publicKey)?.name ?? null;
}

function ownerIsCurrent(owner: NotificationOwner): boolean {
  const user = store.getState().user;
  return user.serverUrl === owner.serverUrl && user.publicKey === owner.publicKey;
}

/** Publish the seeded incoming queue explicitly; reads remain side-effect free. */
export function demoPrimeRequestNotifications(owner: NotificationOwner): void {
  const agent = getAgent();
  if ((agent?.vouchedBy.length ?? 0) < VERIFIED_THRESHOLD) return;
  const state = ensureSeeded(owner);
  state.incoming
    .filter((request) => request.status === 'pending' && request.approver === owner.publicKey)
    .forEach((request) => {
      publishNotification(owner, {
        id: `verification-request:${request.id}`,
        type: 'verification_request',
        createdAt: request.at,
        payload: {
          requestId: request.id,
          requesterKey: request.requester,
          requesterName: memberName(request.requester),
        },
      });
    });
}

export async function demoGetState(owner: NotificationOwner): Promise<VerificationState> {
  const state = ensureSeeded(owner);
  const agent = getAgent();
  const vouchedBy = agent?.vouchedBy ?? [];
  const meta = agent?.vouchMeta ?? {};
  const approvals: Approval[] = vouchedBy.map((approver) => {
    const m: VouchMeta = meta[approver] ?? {
      method: approver === agent?.invitedBy ? 'invitation' : 'direct',
      at: agent?.createdAt ?? 0,
    };
    return { id: `ap-${approver}`, approver, method: m.method, at: m.at };
  });
  // Requests only reach verified members: hidden until the user crosses the threshold.
  const verified = vouchedBy.length >= VERIFIED_THRESHOLD;
  return {
    approvals,
    pending: verified ? state.incoming.filter((r) => r.status === 'pending') : [],
    sent: state.sent,
    invitationRequests: state.invitationRequests,
  };
}

export async function demoListMembers(query?: string): Promise<MemberSummary[]> {
  await wait(50);
  const all = allVerificationMembers();
  const q = query?.trim().toLowerCase();
  return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
}

/**
 * Writes the pending request synchronously (before the first await) so a
 * re-fetch right after the call shows "Requested", then settles after 2–5 s.
 */
export async function demoRequestVouch(owner: NotificationOwner, approverKey: string): Promise<VouchRequest> {
  const state = ensureSeeded(owner);
  const request: VouchRequest = { id: newId(), requester: owner.publicKey, approver: approverKey, at: Date.now(), status: 'pending' };
  write(owner, { ...state, sent: [...state.sent.filter((r) => r.approver !== approverKey), request] });
  await wait(responseDelay());
  if (!ownerIsCurrent(owner)) return request;
  const status: VouchRequestStatus = memberDeclines(approverKey) ? 'declined' : 'approved';
  const settled: VouchRequest = { ...request, status, at: Date.now() };
  const current = read(owner);
  write(owner, { ...current, sent: current.sent.map((r) => (r.id === request.id ? settled : r)) });
  if (status === 'approved') {
    addUserVouch(approverKey, { method: 'direct', at: settled.at });
    publishNotification(owner, {
      id: `approval-received:${request.id}`,
      type: 'approval_received',
      createdAt: settled.at,
      payload: {
        requestId: request.id,
        approverKey,
        approverName: memberName(approverKey),
      },
    });
  }
  return settled;
}

export async function demoRespondToRequest(
  owner: NotificationOwner,
  requestId: string,
  approve: boolean,
): Promise<void> {
  await wait(300);
  if (!ownerIsCurrent(owner)) return;
  const state = read(owner);
  const target = state.incoming.find((r) => r.id === requestId);
  if (!target || target.approver !== owner.publicKey || target.status !== 'pending') return;
  const status: VouchRequestStatus = approve ? 'approved' : 'declined';
  write(owner, {
    ...state,
    incoming: state.incoming.map((r) => (r.id === requestId ? { ...r, status } : r)),
    given: approve ? { ...state.given, [target.requester]: { method: 'direct', at: Date.now() } } : state.given,
  });
  updateNotificationEvent(owner, `verification-request:${requestId}`, 'consumed');
}

export async function demoSendInvitation(owner: NotificationOwner, draft: InvitationDraft): Promise<void> {
  await wait(300);
  if (!ownerIsCurrent(owner)) return;
  const state = ensureSeeded(owner);
  write(owner, { ...state, invitations: [...state.invitations, { ...draft, at: Date.now() }] });
}

export async function demoRequestInvitation(owner: NotificationOwner, memberKey: string): Promise<void> {
  await wait(300);
  if (!ownerIsCurrent(owner)) return;
  const state = ensureSeeded(owner);
  if (state.invitationRequests.includes(memberKey)) return;
  write(owner, { ...state, invitationRequests: [...state.invitationRequests, memberKey] });
}

// ── Demo scenarios (dev-only state switcher, spec §3.1) ─────────────────────

export type DemoScenario = 'unverified-0' | 'partial-2' | 'verified-4' | 'member-view';
export const DEMO_SCENARIOS: DemoScenario[] = ['unverified-0', 'partial-2', 'verified-4', 'member-view'];

const SCENARIO_VOUCHES: Record<DemoScenario, number> = {
  'unverified-0': 0,
  'partial-2': 2,
  'verified-4': 4,
  'member-view': 4,
};

/** Rewrites the agent's vouches + this module's state. The caller reloads. */
export function applyDemoScenario(scenario: DemoScenario, owner: NotificationOwner): void {
  const n = SCENARIO_VOUCHES[scenario];
  const now = Date.now();
  const vouchers = PERSONAS.slice(0, n).map((p) => p.publicKey);
  const vouchMeta: Record<string, VouchMeta> = Object.fromEntries(
    vouchers.map((pk, i): [string, VouchMeta] => [pk, { method: i === 0 ? 'invitation' : 'direct', at: now - (n - i) * 24 * HOUR }]),
  );
  saveAgent({ vouchedBy: vouchers, vouchMeta, invitedBy: vouchers[0] });

  const base: DemoState = { ...EMPTY, seeded: true, incoming: seededIncoming(owner.publicKey, now) };
  if (scenario === 'verified-4') base.incoming = [];
  if (scenario === 'member-view') {
    base.sent = [{ id: 'vr-seed-declined', requester: owner.publicKey, approver: 'demo-verif-np-sita', at: now - 2 * HOUR, status: 'declined' }];
    base.given = { 'demo-user-pl-marta': { method: 'direct', at: now - 30 * HOUR } };
  }
  write(owner, base);
}
