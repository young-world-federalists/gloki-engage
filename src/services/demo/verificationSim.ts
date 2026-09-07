// Call simulation behind src/services/verification.ts (S37 — Prompt 2 Wave 2).
// The sibling of verificationDemo.ts (S36): same seam, same demo directory, a
// separate module because this one owns timers instead of localStorage.
//
// In-memory only: a module-level Map, no localStorage, no contract call, no
// fetch/EventSource. A session dies with the tab — that is correct and
// intended, not a gap, so there is no DEMO_VERSION bump and no fixture edit.
//
// FOR OURI: this whole module is replaced by NOTHING on the contract side —
// the call is a UI simulation with no contract counterpart. See
// docs/FOR_OURI_seam.md, S37 addendum. Its one durable effect is a
// `vouch(public_key, 'call')` per verifier, banked through the same
// `addUserVouch` the direct-request path (verificationDemo.ts) already uses.
import { getAgent } from '../../components/identity/agent/digitalAgentStore';
import { addUserVouch } from '../trust';
import { allVerificationMembers, findVerificationMember, memberDeclines } from './fixtures/verification';
import type { CallParticipant, CallSession, MemberSummary } from '../verificationModel';

type TimerHandle = ReturnType<typeof setTimeout>;

const sessions = new Map<string, CallSession>();
const subscribers = new Map<string, Set<(session: CallSession) => void>>();
/** Every live timer for a session, regardless of which function scheduled it — so `simLeaveCall` can clear all of them at once. */
const sessionTimers = new Map<string, Set<TimerHandle>>();
/**
 * True for a session `simInviteToCall` built (the caller is its candidate),
 * false for one `simJoinAsVerifier` built (a fixture is its candidate). Set
 * once at creation; `applyVerification` reads it to decide whether to bank —
 * so a verifier can never bank a vouch onto their own agent by verifying
 * someone else's call, regardless of which key is passed as `verifierKey`.
 */
const selfIsCandidate = new Map<string, boolean>();

const JOIN_STAGGER_MS = 1500;
const JOIN_JITTER_MS = 200;
const CALL_TIMEOUT_MS = 20_000;
const VERIFY_STAGGER_MS = 2000;
const VERIFY_JITTER_MS = 150;
/** Fixed, not random — determinism (E2/§3.2): the same member every time. */
const PENDING_CANDIDATE_INDEX = 0;

const newSessionId = (): string => `call-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/** ±spread, small jitter on a delay that is already staggered — presentation only (§3.2). */
const jitter = (spread: number): number => Math.random() * spread * 2 - spread;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** The current device's own agent, standing in as a call participant. */
function selfParticipant(publicKey: string): CallParticipant {
  const agent = getAgent();
  return {
    publicKey,
    name: agent?.displayName?.trim() || 'You',
    country: agent?.country ?? '',
    joined: true,
    verified: false,
  };
}

/**
 * The candidate slot for a caller-initiated call. `findVerificationMember`
 * normally misses — the demo user isn't one of the 30 fixture members (see
 * verification.ts) — so this falls back to a generic self participant built
 * from the user's own Digital Agent record.
 */
function candidateParticipant(candidateKey: string): CallParticipant {
  const fixture = findVerificationMember(candidateKey);
  return fixture
    ? { publicKey: fixture.publicKey, name: fixture.name, country: fixture.country, joined: true, verified: false }
    : selfParticipant(candidateKey);
}

function addTimer(sessionId: string, handle: TimerHandle): void {
  let set = sessionTimers.get(sessionId);
  if (!set) {
    set = new Set();
    sessionTimers.set(sessionId, set);
  }
  set.add(handle);
}

function clearSessionTimers(sessionId: string): void {
  sessionTimers.get(sessionId)?.forEach((handle) => clearTimeout(handle));
  sessionTimers.delete(sessionId);
}

function emit(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  subscribers.get(sessionId)?.forEach((cb) => cb(session));
}

function patchSession(sessionId: string, patch: Partial<CallSession>): CallSession | undefined {
  const current = sessions.get(sessionId);
  if (!current) return undefined;
  const next: CallSession = { ...current, ...patch };
  sessions.set(sessionId, next);
  return next;
}

function patchVerifier(sessionId: string, verifierKey: string, patch: Partial<CallParticipant>): CallSession | undefined {
  const current = sessions.get(sessionId);
  if (!current) return undefined;
  const next: CallSession = {
    ...current,
    verifiers: current.verifiers.map((v) => (v.publicKey === verifierKey ? { ...v, ...patch } : v)),
  };
  sessions.set(sessionId, next);
  return next;
}

/**
 * Shared by the exported `simVerifyInCall` (the verifier role tapping their
 * own button) and `simStartCall`'s auto-verify schedule (the candidate role
 * watching verifiers verify themselves). Banks the vouch ONLY when this
 * session's candidate is the local user (E5) — `selfIsCandidate` makes that
 * a lookup against how the session was built, not a runtime guess, so a
 * verifier can never bank a vouch onto their own agent by verifying someone
 * else's call. When every joined verifier has verified, the call completes.
 */
function applyVerification(sessionId: string, verifierKey: string): void {
  const current = sessions.get(sessionId);
  if (!current) return;
  const verifier = current.verifiers.find((v) => v.publicKey === verifierKey);
  if (!verifier || verifier.verified) return;
  const next = patchVerifier(sessionId, verifierKey, { verified: true });
  if (!next) return;
  if (selfIsCandidate.get(sessionId)) {
    addUserVouch(verifierKey, { method: 'call', at: Date.now() });
  }
  const joined = next.verifiers.filter((v) => v.joined);
  if (joined.length > 0 && joined.every((v) => v.verified)) {
    patchSession(sessionId, { state: 'complete' });
  }
  emit(sessionId);
}

/** 8–10 online members, minus `excludeKeys`. Presentation-random only (§3.2) — never affects who ends up in a call. */
export function simAvailableNow(excludeKeys: string[]): CallParticipant[] {
  const pool = allVerificationMembers().filter((m) => m.online && !excludeKeys.includes(m.publicKey));
  const count = 8 + Math.floor(Math.random() * 3); // 8, 9, or 10
  return shuffled(pool)
    .slice(0, count)
    .map((m) => ({ publicKey: m.publicKey, name: m.name, country: m.country, joined: false, verified: false }));
}

/** Creates a waiting session with `candidateKey` as candidate; no verifier has joined yet. */
export function simInviteToCall(candidateKey: string, verifierKeys: string[]): CallSession {
  const id = newSessionId();
  const verifiers: CallParticipant[] = verifierKeys
    .map((key) => findVerificationMember(key))
    .filter((m): m is MemberSummary => m !== undefined)
    .map((m) => ({ publicKey: m.publicKey, name: m.name, country: m.country, joined: false, verified: false }));
  const session: CallSession = {
    id,
    candidate: candidateParticipant(candidateKey),
    verifiers,
    state: 'waiting',
    startedAt: Date.now(),
    timedOut: false,
  };
  sessions.set(id, session);
  selfIsCandidate.set(id, true);
  return session;
}

/**
 * Subscribes to one session's live updates; emits the current snapshot right
 * away, then again after every join, the timeout, and every verification.
 * Drives the joins and the 20 s timeout (§3.2: every invited verifier joins
 * except `memberDeclines`, staggered by index — never random on outcome, only
 * on presentation). Returns an unsubscribe that clears every timer THIS call
 * started, so an unmount before a session finishes never leaks one.
 */
export function simJoinStream(sessionId: string, onUpdate: (session: CallSession) => void): () => void {
  const session = sessions.get(sessionId);
  if (!session) return () => {};

  let subs = subscribers.get(sessionId);
  if (!subs) {
    subs = new Set();
    subscribers.set(sessionId, subs);
  }
  subs.add(onUpdate);
  onUpdate(session);

  const localTimers = new Set<TimerHandle>();
  const schedule = (delay: number, fn: () => void): void => {
    const handle = setTimeout(fn, Math.max(delay, 0));
    localTimers.add(handle);
    addTimer(sessionId, handle);
  };

  session.verifiers.forEach((v, i) => {
    if (memberDeclines(v.publicKey)) return; // never joins — the outcome, not the timing, is fixed
    schedule((i + 1) * JOIN_STAGGER_MS + jitter(JOIN_JITTER_MS), () => {
      patchVerifier(sessionId, v.publicKey, { joined: true });
      emit(sessionId);
    });
  });

  schedule(CALL_TIMEOUT_MS, () => {
    patchSession(sessionId, { timedOut: true });
    emit(sessionId);
  });

  return () => {
    subscribers.get(sessionId)?.delete(onUpdate);
    localTimers.forEach((handle) => clearTimeout(handle));
    localTimers.clear();
  };
}

/**
 * `waiting` → `active`. When `autoVerify` (default true — the candidate role;
 * the verifier role never reaches this at all, since `simJoinAsVerifier`
 * starts a session `active` already — `autoVerify: false` is there for a
 * caller that wants the transition without the schedule), schedules every
 * verifier already joined at this moment to verify ~2 s apart, so the
 * candidate watches the count climb without tapping anything. Idempotent:
 * calling it again on an already-active or -complete session is a no-op.
 */
export function simStartCall(sessionId: string, autoVerify = true): CallSession {
  const current = sessions.get(sessionId);
  if (!current) throw new Error(`[verificationSim] simStartCall: unknown session ${sessionId}`);
  if (current.state !== 'waiting') return current;
  const next = patchSession(sessionId, { state: 'active' });
  if (!next) return current;
  if (autoVerify) {
    next.verifiers.forEach((v, i) => {
      if (!v.joined) return;
      const handle = setTimeout(
        () => applyVerification(sessionId, v.publicKey),
        Math.max((i + 1) * VERIFY_STAGGER_MS + jitter(VERIFY_JITTER_MS), 0),
      );
      addTimer(sessionId, handle);
    });
  }
  return next;
}

/** Marks `verifierKey` verified; see `applyVerification` for where — and where not — the vouch lands. */
export function simVerifyInCall(sessionId: string, verifierKey: string): CallSession {
  const current = sessions.get(sessionId);
  if (!current) throw new Error(`[verificationSim] simVerifyInCall: unknown session ${sessionId}`);
  applyVerification(sessionId, verifierKey);
  return sessions.get(sessionId) ?? current;
}

/** Ends the session: one final `complete` update to any live subscriber, then every timer cleared and the session dropped. */
export function simLeaveCall(sessionId: string): void {
  if (!sessions.has(sessionId)) return;
  patchSession(sessionId, { state: 'complete' });
  emit(sessionId);
  clearSessionTimers(sessionId);
  sessions.delete(sessionId);
  selfIsCandidate.delete(sessionId);
  subscribers.delete(sessionId);
}

/** The fixture member a verified user (E6) sees waiting for a verifier — deterministic, excluding anyone already in the user's vouchers. */
export function simPendingCandidate(): CallParticipant | null {
  const vouchedBy = new Set(getAgent()?.vouchedBy ?? []);
  const pool = allVerificationMembers().filter((m) => !vouchedBy.has(m.publicKey));
  if (pool.length === 0) return null;
  const member = pool[PENDING_CANDIDATE_INDEX % pool.length];
  return { publicKey: member.publicKey, name: member.name, country: member.country, joined: true, verified: false };
}

/**
 * The C1 amendment (E6's verifier role) — an eighth seam function because
 * `inviteToCall` assumes the caller is the candidate, and this role inverts
 * that. Joins a session already `active`, candidate from
 * `simPendingCandidate()`, `verifierKey` as its sole, already-joined
 * verifier. No schedule — this user verifies by tapping, not by simulation.
 */
export function simJoinAsVerifier(verifierKey: string): CallSession {
  const candidate = simPendingCandidate();
  if (!candidate) throw new Error('[verificationSim] simJoinAsVerifier: no eligible pending candidate');
  const id = newSessionId();
  const session: CallSession = {
    id,
    candidate,
    verifiers: [selfParticipant(verifierKey)],
    state: 'active',
    startedAt: Date.now(),
    timedOut: false,
  };
  sessions.set(id, session);
  selfIsCandidate.set(id, false);
  return session;
}
