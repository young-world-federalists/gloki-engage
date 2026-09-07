import React, { useEffect, useMemo, useState } from 'react';
import { Hammer } from 'lucide-react';
import { EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import { joinAsVerifier, leaveCall, type CallSession } from '../../../services/verification';
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
 * `select` (state A, Task 5), `waiting` (state B, Task 6) and `inCall`
 * (state C, Task 7) are built. Task 8 replaces `summary` with CallSummary —
 * until then it renders the placeholder below.
 */
const CallFlow: React.FC = () => {
  const t = useT();
  const { ctx, state, trust } = useVerification();
  const role: 'candidate' | 'verifier' = trust === 'verified' ? 'verifier' : 'candidate';
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
    // the other role.
    if (verifierJoinFailed) {
      return (
        <div className={pages.page}>
          <EmptyState
            icon={<Hammer size={48} aria-hidden />}
            title={t('verification.call.pickerEmpty', 'No one is available right now.')}
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

  // Task 8 placeholder — see the file doc comment above.
  return (
    <div className={pages.page}>
      <EmptyState
        icon={<Hammer size={48} aria-hidden />}
        title={t('verification.call.placeholder', "This part of the call isn't built yet.")}
      />
    </div>
  );
};

export default CallFlow;
