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
//
// TIMER CONTRACT (S37 fix round 1, ruling R4) — two cleanup paths, ONE
// cancellation point:
//   - `simJoinStream`'s unsubscribe removes only THAT subscriber. It cancels
//     nothing, because the joins, the 20 s timeout and the auto-verify
//     schedule belong to the SESSION, not to a subscription: they are driven
//     once per session (`driven`), so the WaitingRoom -> InCallView handoff
//     (unsubscribe, then subscribe again on the same session) neither restarts
//     the join sequence nor anchors a second 20 s clock to the later subscribe.
//   - `simLeaveCall` is the single cancellation point: it clears EVERY timer
//     family for the session (joins, timeout, auto-verify) and drops it.
// Therefore `CallFlow` — the one component that creates a session — MUST call
// `leaveCall` from its unmount cleanup. That is binding on the UI tasks.
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
/** Sessions whose timeline (joins + timeout) has already been started, so a second subscription never restarts it. */
const driven = new Set<string>();
/** Sessions `simStartCall` switched to auto-verify, so a verifier who joins AFTER the start still gets scheduled. */
const autoVerifying = new Set<string>();
/** Per-session stagger slot for the auto-verify schedule; only ever climbs, so a late join queues behind the last one. */
const verifyCursor = new Map<string, number>();

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
 * else's call. The call completes once every joined verifier has verified AND
 * nobody who was invited is still on their way in.
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
  // "Every joined verifier has verified" is only the whole story once nobody
  // else is still on their way in. An invited non-decliner who has not arrived
  // yet WILL arrive (`driveSession` has their timer), so completing over the
  // currently-joined subset would strand them: the late-join auto-verify hook
  // only fires while the session is `active`. Concretely — invite four with a
  // decliner second, and the 3 s gap their absence leaves in the join sequence
  // is longer than the first 2 s verify slot, so without this clause the call
  // would flip to `complete` at ~3.5 s with 1 of 3 verified. `memberDeclines`
  // is the same (and still the only) join gate `driveSession` uses, so this
  // asks exactly the question "is anyone still coming?".
  const stillArriving = next.verifiers.some((v) => !v.joined && !memberDeclines(v.publicKey));
  if (joined.length > 0 && !stillArriving && joined.every((v) => v.verified)) {
    patchSession(sessionId, { state: 'complete' });
  }
  emit(sessionId);
}

/**
 * Queues one verifier's auto-verification. The stagger slot is per session and
 * only climbs, so a verifier who joins after the call started lands in the next
 * slot instead of colliding with an earlier one. A double-schedule is harmless:
 * `applyVerification` returns early once a verifier is already `verified`.
 */
function scheduleVerify(sessionId: string, verifierKey: string): void {
  const slot = (verifyCursor.get(sessionId) ?? 0) + 1;
  verifyCursor.set(sessionId, slot);
  const handle = setTimeout(
    () => applyVerification(sessionId, verifierKey),
    Math.max(slot * VERIFY_STAGGER_MS + jitter(VERIFY_JITTER_MS), 0),
  );
  addTimer(sessionId, handle);
}

/** 8–10 online members, minus `excludeKeys`. Presentation-random only (§3.2) — never affects who ends up in a call. */
export function simAvailableNow(excludeKeys: string[]): CallParticipant[] {
  const pool = allVerificationMembers().filter((m) => m.online && !excludeKeys.includes(m.publicKey));
  const count = 8 + Math.floor(Math.random() * 3); // 8, 9, or 10
  return shuffled(pool)
    .slice(0, count)
    .map((m) => ({ publicKey: m.publicKey, name: m.name, country: m.country, joined: false, verified: false }));
}

/**
 * Creates a waiting session with `candidateKey` as candidate; no verifier has
 * joined yet.
 *
 * INVARIANT: callers MUST pass the LOCAL USER'S own public key as
 * `candidateKey`. This constructor records `selfIsCandidate: true` for the
 * session unconditionally, and that record is the sole thing licensing
 * `applyVerification` to bank a vouch onto the local Digital Agent. Passing
 * someone else's key here would silently invert the anti-misattribution guard.
 * The seam hard-codes `ctx.publicKey`; keep it that way. A call in which the
 * local user is the VERIFIER goes through `simJoinAsVerifier` instead.
 */
export function simInviteToCall(candidateKey: string, verifierKeys: string[]): CallSession {
  const id = newSessionId();
  if (import.meta.env.DEV) {
    // Silently shrinking the list would shrink "{n} of {total} joined" with no signal.
    const dropped = verifierKeys.filter((key) => findVerificationMember(key) === undefined);
    if (dropped.length > 0) {
      console.warn(`[verificationSim] simInviteToCall dropped ${dropped.length} verifier key(s) absent from the fixture: ${dropped.join(', ')}`);
    }
  }
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
 * Drives ONE session's simulated timeline: the joins (§3.2 — every invited
 * verifier joins except `memberDeclines`, staggered by index; never random on
 * outcome, only on presentation) and the 20 s waiting-room timeout. Runs at
 * most once per session, from the first `simJoinStream`, so the
 * WaitingRoom -> InCallView handoff cannot restart the join sequence or anchor
 * a fresh timeout to the second subscribe. Every handle goes to the session
 * registry, so `simLeaveCall` is the one thing that cancels any of it.
 */
function driveSession(session: CallSession): void {
  const sessionId = session.id;
  const schedule = (delay: number, fn: () => void): void => {
    addTimer(sessionId, setTimeout(fn, Math.max(delay, 0)));
  };

  session.verifiers.forEach((v, i) => {
    if (memberDeclines(v.publicKey)) return; // never joins — the outcome, not the timing, is fixed
    schedule((i + 1) * JOIN_STAGGER_MS + jitter(JOIN_JITTER_MS), () => {
      patchVerifier(sessionId, v.publicKey, { joined: true });
      // A verifier who joins AFTER `simStartCall` ran still has to be queued:
      // `simStartCall` can only see who had joined at the instant it ran, and
      // the Start button enables at the FIRST join — so this is the normal
      // path, not an edge case. Without it, only the first joiner ever
      // verifies and the call can never reach `complete`.
      if (autoVerifying.has(sessionId) && sessions.get(sessionId)?.state === 'active') {
        scheduleVerify(sessionId, v.publicKey);
      }
      emit(sessionId);
    });
  });

  schedule(CALL_TIMEOUT_MS, () => {
    // `timedOut` is a WAITING-ROOM concept everywhere it is consumed ("nobody
    // else is joining"). A call that has already started — or finished — must
    // never be flagged, or a successful verification renders as a timeout.
    if (sessions.get(sessionId)?.state !== 'waiting') return;
    patchSession(sessionId, { timedOut: true });
    emit(sessionId);
  });
}

/**
 * Subscribes to one session's live updates; emits the current snapshot right
 * away, then again after every join, the timeout, and every verification. The
 * first subscription also starts the session's timeline (`driveSession`);
 * later ones only attach. The returned unsubscribe removes this subscriber and
 * nothing else — see the TIMER CONTRACT in the module header: `simLeaveCall`
 * is the only call that cancels a session's timers.
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

  if (!driven.has(sessionId)) {
    driven.add(sessionId);
    driveSession(session);
  }

  return () => {
    subscribers.get(sessionId)?.delete(onUpdate);
  };
}

/**
 * `waiting` → `active`, and from here on the session auto-verifies. Two halves,
 * both required: every verifier already joined is queued NOW, and the session
 * is recorded in `autoVerifying` so `driveSession`'s join callback queues each
 * verifier that arrives LATER. The late half is the normal case — the Start
 * button enables at the first join, so most invitees are still on their way in
 * when this runs. Idempotent: calling it again on an already-active or
 * -complete session is a no-op.
 *
 * Only the candidate role reaches this. The verifier role gets an already
 * `active` session from `simJoinAsVerifier` (never recorded in
 * `autoVerifying`) and taps for itself — hence no `autoVerify` flag.
 */
export function simStartCall(sessionId: string): CallSession {
  const current = sessions.get(sessionId);
  if (!current) throw new Error(`[verificationSim] simStartCall: unknown session ${sessionId}`);
  if (current.state !== 'waiting') return current;
  const next = patchSession(sessionId, { state: 'active' });
  if (!next) return current;
  autoVerifying.add(sessionId);
  next.verifiers.forEach((v) => {
    if (v.joined) scheduleVerify(sessionId, v.publicKey);
  });
  return next;
}

/** Marks `verifierKey` verified; see `applyVerification` for where — and where not — the vouch lands. */
export function simVerifyInCall(sessionId: string, verifierKey: string): CallSession {
  const current = sessions.get(sessionId);
  if (!current) throw new Error(`[verificationSim] simVerifyInCall: unknown session ${sessionId}`);
  applyVerification(sessionId, verifierKey);
  return sessions.get(sessionId) ?? current;
}

/**
 * Ends the session: one final `complete` update to any live subscriber, then
 * EVERY timer family cleared (joins, timeout, auto-verify — they all register
 * in `sessionTimers`) and every per-session record dropped. The single
 * cancellation point of the module's TIMER CONTRACT; `CallFlow` must call it
 * on unmount.
 */
export function simLeaveCall(sessionId: string): void {
  if (!sessions.has(sessionId)) return;
  patchSession(sessionId, { state: 'complete' });
  emit(sessionId);
  clearSessionTimers(sessionId);
  sessions.delete(sessionId);
  selfIsCandidate.delete(sessionId);
  subscribers.delete(sessionId);
  driven.delete(sessionId);
  autoVerifying.delete(sessionId);
  verifyCursor.delete(sessionId);
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
