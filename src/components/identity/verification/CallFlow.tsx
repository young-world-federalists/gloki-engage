import React, { useEffect, useMemo, useState } from 'react';
import { Hammer } from 'lucide-react';
import { EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import { leaveCall, type CallSession } from '../../../services/verification';
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
 * `select` (state A, Task 5) and `waiting` (state B, Task 6) are built.
 * Task 7 replaces `inCall` with InCallView, Task 8 replaces `summary` with
 * CallSummary — until then those two render the placeholder below. `inCall`
 * is reachable TODAY by any already-verified user visiting this route, so
 * the placeholder is live UI, not dead code.
 */
const CallFlow: React.FC = () => {
  const t = useT();
  const { ctx, state, trust } = useVerification();
  const role: 'candidate' | 'verifier' = trust === 'verified' ? 'verifier' : 'candidate';
  const [step, setStep] = useState<CallStep>(role === 'verifier' ? 'inCall' : 'select');
  const [session, setSession] = useState<CallSession | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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

  // Task 7/8 placeholder — see the file doc comment above.
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
