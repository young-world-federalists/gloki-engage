import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoOff } from 'lucide-react';
import { Button, EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import { joinAsVerifier, leaveCall, type CallSession } from '../../../services/verification';
import CallSummary from './CallSummary';
import InCallView from './InCallView';
import VerifierPicker from './VerifierPicker';
import WaitingRoom from './WaitingRoom';
import pages from './VerificationPages.module.scss';

type CallStep = 'select' | 'waiting' | 'inCall' | 'summary';

/**
 * /identity/verification/call — the call flow's state machine (S37 Wave 2
 * Task 5). Role comes from trust (E6): a verified user is the VERIFIER for
 * someone else's call and enters at `inCall`; anyone else is the CANDIDATE
 * and enters at `select` to pick who to invite. Holds the CallSession and the
 * selected verifier keys, passed down to whichever step is mounted.
 *
 * `select` (state A, Task 5), `waiting` (state B, Task 6), `inCall` (state C,
 * Task 7) and `summary` (state D, Task 8 — `CallSummary`) are all built.
 */
const CallFlow: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { ctx, state, trust } = useVerification();
  // FROZEN AT FIRST RENDER ON PURPOSE (fix round 1, Critical 1). `trust` is
  // LIVE — useVerification -> useDigitalAgent -> useSyncExternalStore, and
  // every simulated verification in THIS call banks a vouch onto the local
  // agent (addUserVouch -> saveAgent -> notify). A candidate therefore crosses
  // VERIFIED_THRESHOLD *during* their own call (the canonical 2-vouch agent
  // does it on the 2nd of 4), and a role derived from live trust would flip
  // them from candidate to verifier mid-call: InCallView's subscription effect
  // would unsubscribe and install nothing (the count freezes, completion never
  // arrives), and a Verify button would appear under the user's own face,
  // which E6 forbids outright. The role of the person who walked into this
  // call cannot change because of what the call did to them. `trust` is
  // already correct on this first render — `getAgent` reads a module-level
  // cache synchronously — so a lazy initialiser is safe here.
  const [role] = useState<'candidate' | 'verifier'>(() => (trust === 'verified' ? 'verifier' : 'candidate'));
  const [step, setStep] = useState<CallStep>(role === 'verifier' ? 'inCall' : 'select');
  const [session, setSession] = useState<CallSession | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  // C1 amendment: the verifier role has no `select`/`waiting` step to create
  // its session from, so CallFlow creates it here instead, the moment `ctx`
  // is ready. `simJoinAsVerifier` throws when nobody eligible is waiting
  // (everyone the fixtures offer is already among this user's own vouchers) —
  // rare, but real, so it's caught rather than left as an unhandled rejection.
  const [verifierJoinFailed, setVerifierJoinFailed] = useState(false);

  // E5: never offer someone who has already vouched — addUserVouch dedupes,
  // so a repeat invite would be a silent no-op. Memoized so toggling a
  // selection doesn't re-trigger VerifierPicker's fetch effect.
  const excludeKeys = useMemo(() => (state?.approvals ?? []).map((a) => a.approver), [state]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleStarted = (started: CallSession) => {
    setSession(started);
    setStep('waiting');
  };

  // R4 (binding ruling): CallFlow owns the call session's lifecycle and MUST
  // call leaveCall on unmount. Nothing else cancels a session's timers, and
  // the simulation's auto-verify timers keep writing vouches to the user's
  // agent if a session is abandoned without this. Keyed on the session id.
  useEffect(() => {
    if (!session) return undefined;
    const sessionId = session.id;
    return () => {
      if (ctx) void leaveCall(ctx, sessionId);
    };
  }, [session?.id, ctx]);

  // The verifier entry (C1 amendment). `inviteToCall` assumes the caller is
  // the candidate, so a verified user reaching this route goes through
  // `joinAsVerifier` instead — there is no `select`/`waiting` step to hand it
  // a session, so CallFlow builds one itself, once `ctx` is ready. Guarded on
  // `session`/`verifierJoinFailed` so it runs exactly once; cancelled on
  // unmount so a slow resolve after the user navigates away never calls
  // setState on a gone component.
  useEffect(() => {
    if (role !== 'verifier' || !ctx || session || verifierJoinFailed) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const started = await joinAsVerifier(ctx);
        if (!cancelled) setSession(started);
      } catch {
        if (!cancelled) setVerifierJoinFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, ctx, session, verifierJoinFailed]);

  if (step === 'select') {
    // Wait for the real approvals list before sampling verifiers — starting
    // from an empty exclude list (before the first fetch resolves) would let
    // an already-vouched member flash into "Available now".
    if (state === null) {
      return (
        <div className={pages.page}>
          <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
        </div>
      );
    }
    return (
      <VerifierPicker excludeKeys={excludeKeys} selectedKeys={selectedKeys} onToggleKey={toggleKey} onStarted={handleStarted} />
    );
  }

  if (step === 'waiting') {
    // Guarded for the type checker: handleStarted always sets session and
    // step together, so this is unreachable in practice.
    if (!session) {
      return (
        <div className={pages.page}>
          <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
        </div>
      );
    }
    return (
      <WaitingRoom
        session={session}
        onUpdate={setSession}
        onStart={(started) => {
          setSession(started);
          setStep('inCall');
        }}
        onCancel={() => {
          setSession(null);
          setStep('select');
        }}
      />
    );
  }

  if (step === 'inCall') {
    // Rare: nobody eligible for this verifier to see right now (§4's fixture
    // pool exhausted by their own prior vouches). Reuses `pickerEmpty` — same
    // "no one available" fact as the candidate-side empty state, just from
    // the other role. `VideoOff` (not `Hammer`, fix round 1 M1): this is a
    // working feature with nobody to show, not the unbuilt-yet placeholder
    // below, and VerifierPicker already pairs that icon with this same key.
    // The back-to-hub button keeps it from being a dead end.
    if (verifierJoinFailed) {
      return (
        <div className={pages.page}>
          <EmptyState
            icon={<VideoOff size={48} aria-hidden />}
            title={t('verification.call.pickerEmpty', 'No one is available right now.')}
            action={
              <Button size="md" onClick={() => navigate('/identity/verification')}>
                {t('verification.call.backToHub', 'Back to verification')}
              </Button>
            }
          />
        </div>
      );
    }
    // Guarded for the type checker: the candidate path always sets session
    // and step together (handleStarted / WaitingRoom's onStart), and the
    // verifier-entry effect above sets it as soon as `ctx` resolves — this
    // only shows while that effect's `joinAsVerifier` call is in flight.
    if (!session) {
      return (
        <div className={pages.page}>
          <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
        </div>
      );
    }
    return <InCallView session={session} role={role} onUpdate={setSession} onLeave={() => setStep('summary')} />;
  }

  // 'summary' (state D, Task 8) — CallSummary. Reached from InCallView's
  // `onLeave`: the explicit Leave tap and the completion panel's Dismiss both
  // call that one prop, which is why neither needs its own branch here.
  // Guarded for the type checker: InCallView requires a `session` to render
  // at all, so this step is never reached without one already set.
  // `role` passed straight through from the frozen state above (W6, fix
  // round 1) — never re-derived from live trust, same reasoning as the
  // `inCall` branch's InCallView call just above.
  if (!session) {
    return (
      <div className={pages.page}>
        <p className={pages.intro}>{t('common.loading', 'Loading…')}</p>
      </div>
    );
  }
  return <CallSummary session={session} role={role} />;
};

export default CallFlow;
