import React, { useState } from 'react';
import { VerifyButton, type VerifyButtonState } from '../../shared';
import { useT } from '../../../i18n';
import { verifyInCall, type CallSession, type VerificationCtx } from '../../../services/verification';
import styles from './CallFlow.module.scss';

export interface InCallVerifyActionProps {
  ctx: VerificationCtx;
  sessionId: string;
  /** The local user's own public key — this is who `verifyInCall` marks verified. */
  verifierKey: string;
  /** Fires with the seam's returned session once the tap resolves — bubbled to CallFlow via InCallView. */
  onVerified: (session: CallSession) => void;
}

/**
 * The verifier-role half of InCallView (S37 Wave 2 Task 7, split out per the
 * task brief's size guidance). Owns the one piece of state a verifier's tap
 * needs: idle -> loading -> confirmed (terminal — `VerifyButton` disables
 * itself once `state !== 'idle'`, so a double-tap can't reach `verifyInCall`
 * twice; the `state !== 'idle'` guard below is the same check made explicit,
 * matching the seam's other busy guards).
 *
 * The vouch this tap eventually banks does NOT land on the local user's own
 * agent — `verifyInCall`'s sim guards that by checking which key the SESSION
 * was built for (`joinAsVerifier`'s sessions are never `selfIsCandidate`), not
 * by anything this component does. Nothing here needs to re-implement that.
 */
const InCallVerifyAction: React.FC<InCallVerifyActionProps> = ({ ctx, sessionId, verifierKey, onVerified }) => {
  const t = useT();
  const [state, setState] = useState<VerifyButtonState>('idle');

  const handleVerify = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const updated = await verifyInCall(ctx, sessionId, verifierKey);
      onVerified(updated);
      setState('confirmed');
    } finally {
      // Only reset on failure — a successful tap must stay 'confirmed'
      // (terminal, one vouch per verifier per call), not bounce back to
      // 'idle' and re-enable the button.
      setState((s) => (s === 'confirmed' ? s : 'idle'));
    }
  };

  return (
    <VerifyButton
      state={state}
      onVerify={() => void handleVerify()}
      idleLabel={t('verification.call.verifyIdle', 'Verify')}
      loadingLabel={t('verification.call.verifyLoading', 'Verifying…')}
      confirmedLabel={t('verification.call.verifyConfirmed', 'Verified')}
      className={styles.verifyButton}
    />
  );
};

export default InCallVerifyAction;
