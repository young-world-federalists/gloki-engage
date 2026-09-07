import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Button, CountdownTimer, VideoTile } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import { joinCallStream, leaveCall, type CallSession } from '../../../services/verification';
import InCallVerifyAction from './InCallVerifyAction';
import pages from './VerificationPages.module.scss';
import styles from './CallFlow.module.scss';

export interface InCallViewProps {
  /** The session CallFlow holds; this component never creates or destroys it (mirrors WaitingRoom). */
  session: CallSession;
  /** Decided once in CallFlow from trust (E6) — the whole layout branches on this. */
  role: 'candidate' | 'verifier';
  /** Every push (candidate's `joinCallStream`) or direct return (verifier's `verifyInCall`) lands here. */
  onUpdate: (session: CallSession) => void;
  /** Fires on an explicit Leave tap or the completion overlay's Dismiss; CallFlow advances to `summary`. */
  onLeave: () => void;
}

/**
 * InCallView — CallFlow's `inCall` step (state C, S37 Wave 2 Task 7). Where
 * both roles finally meet (E6):
 *
 * - CANDIDATE (trust !== 'verified'): the top `lg` tile IS the local user.
 *   Subscribes to `joinCallStream` — the sim's own auto-verify schedule
 *   (armed by WaitingRoom's `startCall`) drives the verifier grid's count
 *   upward with no timer of this component's own. No `VerifyButton`: you
 *   cannot verify yourself.
 * - VERIFIER (trust === 'verified'): CallFlow already called `joinAsVerifier`
 *   before this mounts, so `session.verifiers` holds exactly one entry — the
 *   local user. It never subscribes: the only change left is its own tap,
 *   and `verifyInCall`'s return value IS that update, handed to `onUpdate`
 *   directly by `InCallVerifyAction`.
 *
 * Mute/video are LOCAL SIMULATION TOGGLES ONLY — they flip whichever tile
 * represents "you" (the candidate tile for the candidate role, your one
 * entry in the grid for the verifier role) and touch nothing else; no
 * backing field exists on `CallParticipant` for them, and the honesty line
 * rendered under the controls says so in-product (E7 — reusing
 * `verification.call.demoNote` verbatim, not a second copy of that line).
 */
const InCallView: React.FC<InCallViewProps> = ({ session, role, onUpdate, onLeave }) => {
  const t = useT();
  const navigate = useNavigate();
  const { ctx } = useVerification();
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Candidate only — see the role split in the doc comment above. Returned
  // straight through as this effect's cleanup, same shape as WaitingRoom's
  // subscription; the call-sim module's TIMER CONTRACT (its header comment)
  // is explicit that this handoff (WaitingRoom unsubscribes, InCallView
  // subscribes again on the same session id) neither restarts the join
  // sequence nor re-arms the waiting-room timeout.
  useEffect(() => {
    if (role !== 'candidate') return undefined;
    return joinCallStream(session.id, onUpdate);
  }, [role, session.id, onUpdate]);

  const total = session.verifiers.length;
  const verifiedCount = session.verifiers.filter((v) => v.verified).length;
  const isComplete = session.state === 'complete';
  const selfKey = ctx?.publicKey;

  const handleLeave = async () => {
    if (!ctx || leaving) return;
    setLeaving(true);
    try {
      await leaveCall(ctx, session.id);
      onLeave();
    } finally {
      setLeaving(false);
    }
  };

  const mutedLabel = t('verification.call.statusMuted', 'Muted');
  const cameraOffLabel = t('verification.call.statusCameraOff', 'Camera off');
  const verifiedLabel = t('trust.verified', 'Verified');

  return (
    <div className={pages.page}>
      <VideoTile
        size="lg"
        name={session.candidate.name}
        countryCode={session.candidate.country}
        // Only the candidate role's own tile is "you" here — a verifier's
        // top tile is the fixture person being verified, whose mic/camera
        // this UI never controls.
        muted={role === 'candidate' ? muted : undefined}
        cameraOff={role === 'candidate' ? cameraOff : undefined}
        mutedLabel={mutedLabel}
        cameraOffLabel={cameraOffLabel}
      />

      {role === 'verifier' && ctx && (
        <InCallVerifyAction ctx={ctx} sessionId={session.id} verifierKey={ctx.publicKey} onVerified={onUpdate} />
      )}

      {/* Changes on its own (the sim's pushes for candidates, the verifier's
          own tap) — announce it, but don't also wrap the grid below in a
          live region (that would re-announce every tile on every push). */}
      <p className={pages.intro} aria-live="polite">
        {t('verification.call.verifiedCount', '{verified} of {total} verified', { verified: verifiedCount, total })}
      </p>

      <div className={styles.tileGrid}>
        {session.verifiers.map((v) => {
          const isSelf = role === 'verifier' && v.publicKey === selfKey;
          return (
            <VideoTile
              key={v.publicKey}
              size="sm"
              name={v.name}
              countryCode={v.country}
              muted={isSelf ? muted : undefined}
              cameraOff={isSelf ? cameraOff : undefined}
              verified={v.verified}
              mutedLabel={mutedLabel}
              cameraOffLabel={cameraOffLabel}
              verifiedLabel={verifiedLabel}
            />
          );
        })}
      </div>

      {!isComplete && (
        <div className={styles.controls}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={muted ? <MicOff size={20} /> : <Mic size={20} />}
            aria-label={muted ? t('verification.call.unmute', 'Unmute') : t('verification.call.mute', 'Mute')}
            onClick={() => setMuted((m) => !m)}
            className={styles.controlButton}
          />
          <Button
            variant="ghost"
            size="sm"
            leftIcon={cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            aria-label={
              cameraOff ? t('verification.call.cameraOff', 'Turn on camera') : t('verification.call.camera', 'Turn off camera')
            }
            onClick={() => setCameraOff((c) => !c)}
            className={styles.controlButton}
          />
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<PhoneOff size={20} />}
            aria-label={t('verification.call.leave', 'Leave call')}
            disabled={leaving}
            onClick={() => void handleLeave()}
            className={styles.controlButton}
          />
        </div>
      )}

      {/* The honesty line (E7) — this call view is exactly the surface where
          fixture people appear to judge the user, so it carries the same
          demo note VerifierPicker already shows, verbatim (one sentence, one
          home). Placed right under the controls, hidden once the call is
          over (the completion overlay below takes its place). */}
      {!isComplete && (
        <p className={pages.intro}>
          {t(
            'verification.call.demoNote',
            'Demo: no real call is made and your camera stays off — these members join and verify automatically.',
          )}
        </p>
      )}

      {isComplete && (
        <div className={styles.completeOverlay}>
          {/* role="status" (not "dialog"): this announces the outcome ONCE on
              mount. CountdownTimer's own `aria-live="off"` keeps its per-second
              digit out of that announcement (see its doc comment) — nesting an
              off region inside a polite one excludes that subtree from being
              read again, so "5… 4… 3…" never floods the region. Dismiss is
              always reachable so the countdown is never a trap. */}
          <div className={styles.completeCard} role="status">
            <h2 className={styles.completeTitle}>{t('verification.call.completeTitle', 'Verification complete')}</h2>
            <p className={styles.completeBody}>
              {t('verification.call.completeBody', 'This call has finished. Thanks for taking part.')}
            </p>
            <CountdownTimer
              seconds={5}
              onDone={() => navigate('/identity/verification')}
              label={(n) => t('verification.call.returningIn', 'Returning to verification in {n}s', { n })}
            />
            <Button fullWidth variant="ghost" onClick={onLeave}>
              {t('common.dismiss', 'Dismiss')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InCallView;
