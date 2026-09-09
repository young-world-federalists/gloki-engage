// In-memory daily verification session (S38 Wave 3). The daily schedule,
// selection and call lifecycle have no contract counterpart. Components use
// only src/services/verification.ts; the dev-only scenario dialog is the one
// sanctioned direct consumer of the controls at the bottom of this file.
import { getAgent } from '../../components/identity/agent/digitalAgentStore';
import { VERIFIED_THRESHOLD } from '../trustModel';
import type {
  CallParticipant,
  CallSession,
  DailyAssignment,
  DailyDemoScenario,
  DailyParticipant,
  DailyRole,
  DailySnapshot,
  MemberSummary,
} from '../verificationModel';
import { allVerificationMembers, memberDeclines } from './fixtures/verification';
import { simCreateDailyCall, simJoinStream, simLeaveCall, simSetDailyCallInvalidator } from './verificationSim';

type TimerHandle = ReturnType<typeof setTimeout>;

interface DailyRun {
  owner: string;
  snapshot: DailySnapshot;
  timer?: TimerHandle;
  visibility?: () => void;
  callUnsubscribe?: () => void;
}

interface DemoConfig {
  scenario: DailyDemoScenario;
  offsetMs: number;
  generation: number;
}

const runs = new Map<string, DailyRun>();
const runByOwner = new Map<string, string>();
const subscribers = new Map<string, Set<(snapshot: DailySnapshot) => void>>();
const reminders = new Map<string, boolean>();
const configs = new Map<string, DemoConfig>();
const completedCandidates = new Set<string>();
let sequence = 0;

export const DAILY_SESSION_RESET_EVENT = 'gloki:daily-verification-reset';
export const DAILY_DEMO_SCENARIOS: DailyDemoScenario[] = [
  'real',
  'pre-session',
  'join-window',
  'lobby',
  'selected-verifier',
  'observer',
  'empty-pool',
  'partial-pool',
];
const DAY_MS = 86_400_000;
const SELECT_AFTER_MS = 150_000;
const JOIN_BEFORE_MS = 300_000;

const clone = (snapshot: DailySnapshot): DailySnapshot => ({
  ...snapshot,
  participants: snapshot.participants.map((participant) => ({ ...participant })),
  candidate: { ...snapshot.candidate },
  selectedVerifierKeys: [...snapshot.selectedVerifierKeys],
  call: snapshot.call
    ? {
        ...snapshot.call,
        candidate: { ...snapshot.call.candidate },
        verifiers: snapshot.call.verifiers.map((verifier) => ({ ...verifier })),
      }
    : null,
});

const emit = (run: DailyRun): void => {
  const value = clone(run.snapshot);
  subscribers.get(run.snapshot.id)?.forEach((subscriber) => subscriber(value));
};

const memberToCallParticipant = (member: MemberSummary): CallParticipant => ({
  publicKey: member.publicKey,
  name: member.name,
  country: member.country,
  joined: true,
  verified: false,
});

function selfMember(publicKey: string): MemberSummary {
  const agent = getAgent();
  return {
    publicKey,
    name: agent?.displayName?.trim() || 'You',
    country: agent?.country ?? '',
    online: true,
  };
}

function serviceNow(owner: string): number {
  return Date.now() + (configs.get(owner)?.offsetMs ?? 0);
}

function nextSchedule(now: number): Pick<DailySnapshot, 'dayKey' | 'startsAt' | 'joinOpensAt' | 'selectionAt'> {
  const date = new Date(now);
  const todayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 21, 0, 0);
  const startsAt = now < todayStart + SELECT_AFTER_MS ? todayStart : todayStart + DAY_MS;
  return {
    dayKey: new Date(startsAt).toISOString().slice(0, 10),
    startsAt,
    joinOpensAt: startsAt - JOIN_BEFORE_MS,
    selectionAt: startsAt + SELECT_AFTER_MS,
  };
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

function deterministicSelection(candidateKey: string, dayKey: string, members: DailyParticipant[]): string[] {
  const eligible = members
    .filter((member) => member.role === 'verifier' && member.joined && member.publicKey !== candidateKey)
    .map((member) => member.publicKey)
    .sort();
  if (eligible.length === 0) return [];
  const offset = stableHash(`${dayKey}:${candidateKey}`) % eligible.length;
  return [...eligible.slice(offset), ...eligible.slice(0, offset)].slice(0, VERIFIED_THRESHOLD);
}

function selectedAssignment(run: DailyRun, selected: string[]): DailyAssignment {
  if (selected.length === 0) return 'unavailable';
  if (run.snapshot.role === 'candidate') return 'candidate';
  return selected.includes(run.owner) ? 'selectedVerifier' : 'observer';
}

function updateResult(run: DailyRun, call: CallSession): void {
  const baseline = run.snapshot.participants.find((participant) => participant.role === 'candidate')?.approvalCount ?? 0;
  const approvals = new Set(call.verifiers.filter((verifier) => verifier.verified).map((verifier) => verifier.publicKey)).size;
  const candidateKey = run.snapshot.candidate.publicKey;
  const crossed =
    baseline < VERIFIED_THRESHOLD &&
    baseline + approvals >= VERIFIED_THRESHOLD &&
    !completedCandidates.has(candidateKey);
  if (crossed) completedCandidates.add(candidateKey);
  run.snapshot = {
    ...run.snapshot,
    now: serviceNow(run.owner),
    call,
    newlyVerifiedCount: crossed ? 1 : run.snapshot.newlyVerifiedCount,
  };
  emit(run);
}

function attachCall(run: DailyRun, call: CallSession): void {
  run.callUnsubscribe?.();
  run.callUnsubscribe = simJoinStream(call.id, (next) => updateResult(run, next));
}

function createChildCall(run: DailyRun): CallSession {
  const selected = new Set(run.snapshot.selectedVerifierKeys);
  const verifiers = run.snapshot.participants
    .filter((participant) => selected.has(participant.publicKey))
    .map(memberToCallParticipant);
  const call = simCreateDailyCall(run.owner, run.snapshot.candidate, verifiers);
  simSetDailyCallInvalidator(call.id, () => simLeaveDaily(run.owner, run.snapshot.id));
  return call;
}

function selectRun(run: DailyRun): void {
  if (run.snapshot.assignment !== null) return;
  const selected = deterministicSelection(run.snapshot.candidate.publicKey, run.snapshot.dayKey, run.snapshot.participants);
  const assignment = selectedAssignment(run, selected);
  run.snapshot = {
    ...run.snapshot,
    now: serviceNow(run.owner),
    phase: 'selection',
    joinAllowed: false,
    selectedVerifierKeys: selected,
    assignment,
  };
  if (assignment === 'observer') {
    const call = createChildCall(run);
    run.snapshot = { ...run.snapshot, call };
    attachCall(run, call);
  }
  emit(run);
}

function reconcile(run: DailyRun): void {
  const now = serviceNow(run.owner);
  if (!run.snapshot.joined && now >= run.snapshot.selectionAt) {
    const schedule = nextSchedule(now);
    run.snapshot = {
      ...run.snapshot,
      ...schedule,
      now,
      joinAllowed: now >= schedule.joinOpensAt && now < schedule.selectionAt,
    };
  } else {
    run.snapshot = {
      ...run.snapshot,
      now,
      joinAllowed: !run.snapshot.joined && now >= run.snapshot.joinOpensAt && now < run.snapshot.selectionAt,
    };
    if (run.snapshot.joined && now >= run.snapshot.selectionAt) selectRun(run);
  }
}

function scheduleBoundary(run: DailyRun): void {
  if (run.timer) clearTimeout(run.timer);
  reconcile(run);
  const now = serviceNow(run.owner);
  const targets = run.snapshot.joined
    ? [run.snapshot.startsAt, run.snapshot.selectionAt]
    : [run.snapshot.joinOpensAt, run.snapshot.selectionAt];
  const target = targets.find((value) => value > now);
  if (target === undefined || run.snapshot.phase === 'inCall' || run.snapshot.phase === 'finished') return;
  run.timer = setTimeout(() => {
    reconcile(run);
    emit(run);
    scheduleBoundary(run);
  }, Math.max(0, target - now));
}

function buildRoster(owner: string, role: DailyRole, scenario: DailyDemoScenario): {
  candidate: CallParticipant;
  participants: DailyParticipant[];
} {
  const agent = getAgent();
  const self = selfMember(owner);
  const priorCandidateVouchers = role === 'candidate' ? new Set(agent?.vouchedBy ?? []) : new Set<string>();
  const fixturePool = allVerificationMembers().filter(
    (member, index, all) =>
      member.publicKey !== owner &&
      !priorCandidateVouchers.has(member.publicKey) &&
      all.findIndex((candidate) => candidate.publicKey === member.publicKey) === index &&
      !memberDeclines(member.publicKey),
  );
  const sampleCandidate = fixturePool[0] ?? self;
  const candidateMember = role === 'candidate' ? self : sampleCandidate;
  let verifierPool = fixturePool.filter((member) => member.publicKey !== candidateMember.publicKey).slice(0, 6);
  // With exactly three fixture verifiers plus the local verified volunteer,
  // every eligible member is selected by the normal four-person selector.
  if (scenario === 'selected-verifier' && role === 'verifier') verifierPool = verifierPool.slice(0, 3);
  if (scenario === 'empty-pool') verifierPool = [];
  if (scenario === 'partial-pool') verifierPool = verifierPool.slice(0, 2);
  const actualCount = agent?.vouchedBy?.length ?? 0;
  const participants: DailyParticipant[] = [
    {
      ...candidateMember,
      role: 'candidate',
      joined: true,
      approvalCount: role === 'candidate' ? actualCount : 0,
    },
    ...verifierPool.map((member) => ({ ...member, role: 'verifier' as const, joined: true, approvalCount: VERIFIED_THRESHOLD })),
  ];
  if (role === 'verifier') {
    const selfParticipant: DailyParticipant = {
      ...self,
      role: 'verifier',
      joined: true,
      approvalCount: actualCount,
    };
    // Scenario inputs shape the eligible set; the normal selection algorithm
    // still decides the first four.
    if (scenario === 'observer') participants.push(selfParticipant);
    else participants.splice(1, 0, selfParticipant);
  }
  return { candidate: memberToCallParticipant(candidateMember), participants };
}

function observerStart(owner: string, baseStart: number): number {
  const roster = buildRoster(owner, 'verifier', 'observer');
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const startsAt = baseStart + dayOffset * DAY_MS;
    const dayKey = new Date(startsAt).toISOString().slice(0, 10);
    const selected = deterministicSelection(roster.candidate.publicKey, dayKey, roster.participants);
    if (!selected.includes(owner)) return startsAt;
  }
  return baseStart;
}

function createRun(owner: string): DailyRun {
  const now = serviceNow(owner);
  const schedule = nextSchedule(now);
  const role: DailyRole = (getAgent()?.vouchedBy?.length ?? 0) >= VERIFIED_THRESHOLD ? 'verifier' : 'candidate';
  const config = configs.get(owner);
  const scenario = config?.scenario ?? 'real';
  const roster = buildRoster(owner, role, scenario);
  const id = `daily-${Date.now().toString(36)}-${(sequence += 1).toString(36)}`;
  const run: DailyRun = {
    owner,
    snapshot: {
      id,
      ...schedule,
      role,
      phase: 'preSession',
      now,
      joinAllowed: now >= schedule.joinOpensAt && now < schedule.selectionAt,
      joined: false,
      reminderEnabled: reminders.get(owner) ?? false,
      demoClock: scenario !== 'real',
      clockGeneration: config?.generation ?? 0,
      participants: roster.participants,
      candidate: roster.candidate,
      selectedVerifierKeys: [],
      assignment: null,
      call: null,
      newlyVerifiedCount: 0,
    },
  };
  run.visibility = () => {
    if (document.visibilityState !== 'visible') return;
    reconcile(run);
    emit(run);
    scheduleBoundary(run);
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', run.visibility);
  runs.set(id, run);
  runByOwner.set(owner, id);
  scheduleBoundary(run);
  return run;
}

function ownedRun(owner: string, id: string): DailyRun {
  const run = runs.get(id);
  if (!run || run.owner !== owner) throw new Error('[dailyVerificationSim] unknown or unowned session');
  reconcile(run);
  return run;
}

export function simDailySessionState(owner: string): DailySnapshot {
  const existingId = runByOwner.get(owner);
  const existing = existingId ? runs.get(existingId) : undefined;
  const run = existing ?? createRun(owner);
  reconcile(run);
  return clone(run.snapshot);
}

export function simJoinDailyStream(id: string, onUpdate: (snapshot: DailySnapshot) => void): () => void {
  const run = runs.get(id);
  if (!run) return () => {};
  let set = subscribers.get(id);
  if (!set) {
    set = new Set();
    subscribers.set(id, set);
  }
  set.add(onUpdate);
  onUpdate(clone(run.snapshot));
  return () => subscribers.get(id)?.delete(onUpdate);
}

export function simJoinDaily(owner: string, id: string): DailySnapshot {
  const run = ownedRun(owner, id);
  if (!run.snapshot.joinAllowed) throw new Error('[dailyVerificationSim] daily session is not open');
  run.snapshot = { ...run.snapshot, joined: true, phase: 'lobby', joinAllowed: false };
  emit(run);
  scheduleBoundary(run);
  return clone(run.snapshot);
}

export function simSelectVerifiers(owner: string, id: string): DailySnapshot {
  const run = ownedRun(owner, id);
  if (!run.snapshot.joined) throw new Error('[dailyVerificationSim] join before selection');
  if (serviceNow(owner) < run.snapshot.selectionAt) throw new Error('[dailyVerificationSim] selection is not ready');
  selectRun(run);
  return clone(run.snapshot);
}

export function simEnterDailyCall(owner: string, id: string): DailySnapshot {
  const run = ownedRun(owner, id);
  if (run.snapshot.assignment !== 'candidate' && run.snapshot.assignment !== 'selectedVerifier') {
    throw new Error('[dailyVerificationSim] this participant has no call assignment');
  }
  if (!run.snapshot.call) {
    const call = createChildCall(run);
    run.snapshot = { ...run.snapshot, phase: 'inCall', call };
    attachCall(run, call);
  } else {
    run.snapshot = { ...run.snapshot, phase: 'inCall' };
  }
  emit(run);
  return clone(run.snapshot);
}

export function simFinishDailyCall(owner: string, id: string): DailySnapshot {
  const run = ownedRun(owner, id);
  const lastCall = run.snapshot.call;
  if (lastCall) {
    updateResult(run, lastCall);
    run.callUnsubscribe?.();
    run.callUnsubscribe = undefined;
    simLeaveCall(lastCall.id);
  }
  run.snapshot = { ...run.snapshot, phase: 'finished', call: lastCall };
  if (run.timer) clearTimeout(run.timer);
  emit(run);
  return clone(run.snapshot);
}

export function simSetDailyReminder(owner: string, id: string, enabled: boolean): DailySnapshot {
  const run = ownedRun(owner, id);
  reminders.set(owner, enabled);
  run.snapshot = { ...run.snapshot, reminderEnabled: enabled };
  emit(run);
  return clone(run.snapshot);
}

export function simLeaveDaily(owner: string, id: string): void {
  const run = runs.get(id);
  if (!run || run.owner !== owner) return;
  if (run.timer) clearTimeout(run.timer);
  run.callUnsubscribe?.();
  if (run.snapshot.call) simLeaveCall(run.snapshot.call.id);
  if (run.visibility && typeof document !== 'undefined') document.removeEventListener('visibilitychange', run.visibility);
  subscribers.delete(id);
  runs.delete(id);
  if (runByOwner.get(owner) === id) runByOwner.delete(owner);
}

/** DEV-only control. Normal UI must never import this function. */
export function applyDailyDemoScenario(scenario: DailyDemoScenario, owner: string): void {
  if (!import.meta.env.DEV) return;
  const oldId = runByOwner.get(owner);
  if (oldId) simLeaveDaily(owner, oldId);
  const real = Date.now();
  const date = new Date(real);
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 21, 0, 0);
  const observerSessionStart = observerStart(owner, start);
  const targetOffset: Partial<Record<DailyDemoScenario, number>> = {
    'pre-session': start - 360_000,
    'join-window': start - 240_000,
    lobby: start + 130_000,
    'selected-verifier': start + 130_000,
    observer: observerSessionStart + 130_000,
    'empty-pool': start + 130_000,
    'partial-pool': start + 130_000,
  };
  const previous = configs.get(owner);
  configs.set(owner, {
    scenario,
    offsetMs: scenario === 'real' ? 0 : (targetOffset[scenario] ?? start) - real,
    generation: (previous?.generation ?? 0) + 1,
  });
  window.dispatchEvent(new CustomEvent(DAILY_SESSION_RESET_EVENT));
}
