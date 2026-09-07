import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Users } from 'lucide-react';
import { Badge, Banner, Button, EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import {
  joinCallStream,
  leaveCall,
  startCall,
  type CallParticipant,
  type CallSession,
  type MemberSummary,
} from '../../../services/verification';
import MemberList from './MemberList';
import pages from './VerificationPages.module.scss';
import styles from './CallFlow.module.scss';

export interface WaitingRoomProps {
  /** The session CallFlow holds; this component never creates or destroys it. */
  session: CallSession;
  /** Every `joinCallStream` push lands here — CallFlow banks it as the new session. */
  onUpdate: (session: CallSession) => void;
  /** Fires once `startCall` resolves; CallFlow banks the returned session and advances to `inCall`. */
  onStart: (session: CallSession) => void;
  /** Fires once `leaveCall` resolves; CallFlow advances the machine back to `select`. */
  onCancel: () => void;
}

// The invited verifiers, reshaped for MemberList. Repurposes the presence dot:
// here "online" means "present in this call right now" (joined), not the
// network-online sense VerifierPicker hardcodes true for its invite list.
const toMemberSummary = (p: CallParticipant): MemberSummary => ({
  publicKey: p.publicKey,
  name: p.name,
  country: p.country,
  online: p.joined,
});

/**
 * WaitingRoom — CallFlow's `waiting` step (state B, S37 Wave 2 Task 6).
 * Subscribes to `joinCallStream` for live join pushes; the sim owns every
 * timer — the staggered joins AND the ~20s timeout — so this component
 * schedules nothing itself, it only renders what arrives.
 *
 * R4 (CallFlow's binding ruling) already calls `leaveCall` on session-unmount
 * as a safety net; the explicit Cancel path here calls it directly too so the
 * candidate gets immediate feedback instead of waiting on that effect, and so
 * `onCancel` can drive the state machine back to `select` right away.
 */
const WaitingRoom: React.FC<WaitingRoomProps> = ({ session, onUpdate, onStart, onCancel }) => {
  const t = useT();
  const navigate = useNavigate();
  const { ctx } = useVerification();
  const [busy, setBusy] = useState<'start' | 'cancel' | null>(null);

  // The ONE non-Promise seam export: returns an unsubscribe, which this
  // effect returns straight through as its cleanup. No setTimeout/setInterval
  // here — the sim drives every join and the timeout on its own schedule.
  useEffect(() => {
    return joinCallStream(session.id, onUpdate);
  }, [session.id, onUpdate]);

  const joinedCount = session.verifiers.filter((v) => v.joined).length;
  const total = session.verifiers.length;
  const canStart = joinedCount >= 1;

  const handleStart = async () => {
    if (!ctx || busy || !canStart) return;
    setBusy('start');
    try {
      onStart(await startCall(ctx, session.id));
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!ctx || busy) return;
    setBusy('cancel');
    try {
      await leaveCall(ctx, session.id);
      onCancel();
    } finally {
      setBusy(null);
    }
  };

  const actionFor = (member: MemberSummary): React.ReactNode => (
    <Badge tone={member.online ? 'success' : 'neutral'} size="sm">
      {member.online ? t('verification.call.joined', 'Joined') : t('verification.call.waiting', 'Waiting')}
    </Badge>
  );

  return (
    <div className={pages.page}>
      <h2 className={pages.sectionTitle}>{t('verification.call.waitingTitle', 'Waiting for verifiers')}</h2>
      {/* Changes on its own as the sim pushes joins — announce it, but don't
          also wrap the list below in a live region (that would re-announce
          every row on every push). */}
      <p className={pages.intro} aria-live="polite">
        {t('verification.call.joinedCount', '{joined} of {total} joined', { joined: joinedCount, total })}
      </p>

      <div className={styles.listGuard}>
        <MemberList
          members={session.verifiers.map(toMemberSummary)}
          action={actionFor}
          empty={
            // Unreachable in practice — VerifierPicker requires >=1 selected
            // verifier before a session can exist — but MemberList's `empty`
            // is required, so this guards the type honestly.
            <EmptyState
              icon={<Users size={48} aria-hidden />}
              title={t('verification.call.pickerEmpty', 'No one is available right now.')}
            />
          }
        />
      </div>

      {session.timedOut && (
        <Banner
          tone="info"
          title={t('verification.call.timeoutTitle', 'Nobody else is joining')}
          action={
            !canStart ? (
              <Button size="md" onClick={() => navigate('/identity/verification/request')}>
                {t('verification.call.pickerEmptyCta', 'Ask a member to vouch instead')}
              </Button>
            ) : undefined
          }
        >
          {canStart
            ? t(
                'verification.call.timeoutBody',
                "It's been a few minutes and no one new has joined. You can start with who's here, or cancel and try again later.",
              )
            : t('verification.call.timeoutEmpty', 'Nobody joined this time. Cancel and ask a member to vouch for you instead.')}
        </Banner>
      )}

      <div className={clsx(pages.actions, styles.stickyActions)}>
        <Button fullWidth disabled={!canStart || busy !== null} loading={busy === 'start'} onClick={() => void handleStart()}>
          {t('verification.call.start', 'Start')}
        </Button>
        <Button fullWidth variant="ghost" disabled={busy !== null} loading={busy === 'cancel'} onClick={() => void handleCancel()}>
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>
    </div>
  );
};

export default WaitingRoom;
