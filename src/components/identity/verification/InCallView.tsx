import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
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
  /** Frozen once in CallFlow from trust at first render (E6); the whole layout branches on this. */
  role: 'candidate' | 'verifier';
  /** Every push (candidate's `joinCallStream`) or direct return (verifier's `verifyInCall`) lands here. */
  onUpdate: (session: CallSession) => void;
  /** Fires on an explicit Leave tap or the completion panel's Dismiss; CallFlow advances to `summary`. */
  onLeave: () => void;
}

/**
 * InCallView — CallFlow's `inCall` step (state C, S37 Wave 2 Task 7). Where
 * both roles finally meet (E6):
 *
 * - CANDIDATE (not verified when the call began): the top `lg` tile IS the
 *   local user. Subscribes to `joinCallStream` — the sim's own auto-verify
 *   schedule (armed by WaitingRoom's `startCall`) drives the verifier grid's
 *   count upward with no timer of this component's own. No `VerifyButton`:
 *   you cannot verify yourself.
 * - VERIFIER (already verified when the call began): CallFlow already called
 *   `joinAsVerifier` before this mounts, so `session.verifiers` holds exactly
 *   one entry — the local user. It never subscribes: the only change left is
 *   its own tap, and `verifyInCall`'s return value IS that update, handed to
 *   `onUpdate` directly by `InCallVerifyAction`.
 *
 * `role` is frozen by CallFlow at first render and never re-derived here — see
 * the long comment there: a candidate's live trust crosses the threshold
 * BECAUSE of this call, so a live-derived role would swap them into the
 * verifier branch partway through (fix round 1, Critical 1).
 *
 * Mute/video are LOCAL SIMULATION TOGGLES ONLY — they flip whichever tile
 * represents "you" (the candidate tile for the candidate role, your one
 * entry in the grid for the verifier role) and touch nothing else; no
 * backing field exists on `CallParticipant` for them, and the honesty line
 * rendered directly under the candidate tile — above the fold, before the
 * verifier's Verify action (W5, fix round 2) — says so in-product (E7, and
 * per role, since "these members verify automatically" is false for the
 * role that is doing the verifying by hand).
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
  // sequence nor re-arms the waiting-room timeout. `role` is frozen upstream,
  // so this subscription is installed once and never torn down mid-call.
  useEffect(() => {
    if (role !== 'candidate') return undefined;
    return joinCallStream(session.id, onUpdate);
  }, [role, session.id, onUpdate]);

  // R10 (fix round 1): the in-call denominator is the JOINED set, not the
  // invited set. With a decliner in the invite list the sim completes the
  // call once every JOINED verifier has verified — counting invitees would
  // announce "verification complete" beside a permanently unreachable "3 of
  // 4 verified". The grid renders the same set for the same reason: a
  // VideoTile for someone who never joined is indistinguishable from one for
  // someone who did. (WaitingRoom deliberately keeps the invited denominator
  // — there the question is "who is still coming".)
  const joinedVerifiers = session.verifiers.filter((v) => v.joined);
  const total = joinedVerifiers.length;
  const verifiedCount = joinedVerifiers.filter((v) => v.verified).length;
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
      {/* AppHeader owns the page's single h1 (IdentityView's "Verification
          call"); this is the step's own in-content heading, matching
          WaitingRoom's h2. */}
      <h2 className={pages.sectionTitle}>{t('verification.call.inCallTitle', 'On the call')}</h2>

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

      {/* W5, fix round 2 — moved here (directly under the candidate tile,
          before the verifier's Verify action) from after the controls bar,
          where it sat below the fold entirely. Measured live at 360x780 in
          the VERIFIER role: the Verify button was fully visible at top 480
          while this line sat at top 841 — a user could verify a fixture
          "person" without ever seeing the note that no real call happens
          and no vouch is real (S36-I1). Placing it here puts it before the
          Verify button in both reading order and visual order, in both
          roles, and it no longer depends on the sticky controls bar (left
          untouched — still `.stickyActions`, still after the tile grid).
          Still gated on `!isComplete`: the completion panel takes its place
          once the call ends (R9, fix round 1). */}
      {!isComplete && (
        <p className={pages.intro}>
          {role === 'verifier'
            ? t(
                'verification.call.demoNoteVerifier',
                'Demo: no real call is made — your camera and microphone stay off, and the person above is a sample profile, so verifying them changes nothing outside this demo.',
              )
            : t(
                'verification.call.demoNote',
                'Demo: no real call is made — your camera and microphone stay off, and these members join and verify automatically.',
              )}
        </p>
      )}

      {/* Gated on `!isComplete` (fix round 1, M5) so a finished call can never
          leave a live Verify control mounted beside the completion panel. */}
      {role === 'verifier' && ctx && !isComplete && (
        <InCallVerifyAction ctx={ctx} sessionId={session.id} verifierKey={ctx.publicKey} onVerified={onUpdate} />
      )}

      {/* Changes on its own (the sim's pushes for candidates, the verifier's
          own tap) — announce it, but don't also wrap the grid below in a
          live region (that would re-announce every tile on every push). */}
      <p className={pages.intro} aria-live="polite">
        {t('verification.call.verifiedCount', '{verified} of {total} verified', { verified: verifiedCount, total })}
      </p>

      {/* R8's pairing, applied here too (fix round 1, Important 4): the guard
          reserves the sticky bar's height so the last tile row is never left
          under it. */}
      <div className={styles.listGuard}>
        <div className={styles.tileGrid}>
          {joinedVerifiers.map((v) => {
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
      </div>

      {/* R8 (fix round 1, Important 4): measured at 360px, this bar's top sat
          at y=808 in a 780px viewport — mute, camera and, worst, "Leave call"
          (the only escape from a call) all below the fold. Sticky in normal
          flow, same treatment VerifierPicker and WaitingRoom already give
          their primary actions in this very stylesheet. */}
      {!isComplete && (
        <div className={clsx(styles.controls, styles.stickyActions)}>
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

      {/* R9 (fix round 1): rendered INLINE, in the page flow where the
          controls bar has just unmounted — no scrim, no fixed layer. The old
          overlay borrowed Modal's entire visual contract while providing none
          of its obligations (no focus move, no trap, no Escape, no scroll
          lock, header/nav still tab-reachable but invisible underneath).
          Sighted users got modal behaviour; keyboard and AT users got a page
          they could still tab through blind. Dropping the scrim deletes that
          whole class of problem instead of solving it with machinery, and
          costs nothing the brief asked for: announced once, 5 s countdown,
          Dismiss always reachable, never a trap. */}
      {isComplete && (
        <div className={styles.completeCard}>
          <h2 className={styles.completeTitle}>{t('verification.call.completeTitle', 'Verification complete')}</h2>
          <p className={styles.completeBody}>
            {t('verification.call.completeBody', 'This call has finished. Thanks for taking part.')}
          </p>
          {/* CountdownTimer carries its own aria-live="off" (see its doc
              comment) so "5… 4… 3…" is never announced; the status node
              below announces the outcome once instead. */}
          <CountdownTimer
            seconds={5}
            onDone={() => navigate('/identity/verification')}
            label={(n) => t('verification.call.returningIn', 'Returning to verification in {n}s', { n })}
          />
          {/* Dismiss fires `onLeave` directly, not `handleLeave` — it does not
              await `leaveCall` (fix round, M5, judged safe not fixed). Proof:
              we only reach here once `isComplete`, at which point no
              `verifyInCall` can still be pending, and the sim's own 20s
              waiting-room timeout early-returns whenever the session's state
              isn't 'waiting' (verificationSim.ts) — so there is no pending
              timer left for an un-awaited leave to race. */}
          <Button fullWidth variant="ghost" onClick={onLeave}>
            {t('common.dismiss', 'Dismiss')}
          </Button>
        </div>
      )}

      {/* The completion announcement (fix round 1, Important 2). The region is
          ALWAYS in the DOM and empty until the call completes — a role="status"
          element that arrives already populated generally is not announced at
          all, which is exactly why Toast.tsx keeps its own polite region
          permanently mounted. Populating an existing empty region is the
          change screen readers actually report. */}
      <p className={pages.srOnly} role="status">
        {isComplete ? t('verification.call.completeTitle', 'Verification complete') : ''}
      </p>
    </div>
  );
};

export default InCallView;
