import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { UserX } from 'lucide-react';
import { Badge, Button, EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import { VERIFIED_THRESHOLD } from '../../../services/trustModel';
import type { CallSession, MemberSummary } from '../../../services/verification';
import MemberList from './MemberList';
import pages from './VerificationPages.module.scss';
import styles from './CallFlow.module.scss';

export interface CallSummaryProps {
  /** The session CallFlow held for the call that just ended. Never null when
   *  this renders — see the guard in CallFlow.tsx's `summary` branch. */
  session: CallSession;
}

// Only the verifiers who actually verified — "what the call produced" (spec
// §6.5), not the full invited/joined roster WaitingRoom and InCallView show.
// `online: true` throughout: MemberList's presence dot is repurposed here
// (its own doc comment) so every row's dot agrees with its "Vouched" Badge —
// the same fix Task 6 made for WaitingRoom's Joined/Waiting pair.
const toMemberSummary = (p: CallSession['verifiers'][number]): MemberSummary => ({
  publicKey: p.publicKey,
  name: p.name,
  country: p.country,
  online: true,
});

/**
 * CallSummary — CallFlow's `summary` step (state D, S37 Wave 2 Task 8). What
 * the call produced: who verified, the resulting approval count, and the
 * next step. Reached from InCallView's `onLeave` — the explicit Leave tap and
 * the completion panel's Dismiss both call that one prop.
 *
 * `trust`/`vouchCount` come live from `useVerification` (unlike CallFlow's
 * frozen `role`, S37 fix round 1 Critical 1) — the whole point of this screen
 * is to show what the call just changed, so it must read the CURRENT state,
 * not a snapshot from before the call.
 */
const CallSummary: React.FC<CallSummaryProps> = ({ session }) => {
  const t = useT();
  const navigate = useNavigate();
  const { vouchCount, trust } = useVerification();
  const verified = trust === 'verified';
  const shown = Math.min(vouchCount, VERIFIED_THRESHOLD);
  const verifiedInCall = session.verifiers.filter((v) => v.verified);
  const vouchedLabel = t('verification.request.vouched', 'Vouched');

  return (
    <div className={pages.page}>
      {/* AppHeader owns the page's single h1 ("Verification call"); this is
          the step's own in-content heading, matching WaitingRoom/InCallView. */}
      <h2 className={pages.sectionTitle}>{t('verification.call.summaryTitle', 'Call summary')}</h2>

      {/* Reuses the hub's own progress sentence (verification.hub.progress /
          .verifiedTitle) rather than a second copy of the same fact — the
          hub is the one place that sentence is defined. */}
      <p className={pages.intro}>
        {verified
          ? t('verification.hub.verifiedTitle', "You're verified")
          : t('verification.hub.progress', '{count} of {threshold} approvals received', {
              count: shown,
              threshold: VERIFIED_THRESHOLD,
            })}
      </p>

      <h3 className={pages.sectionTitle}>{t('verification.call.summaryVerifiers', 'Verifiers who confirmed')}</h3>
      <div className={styles.listGuard}>
        <MemberList
          members={verifiedInCall.map(toMemberSummary)}
          action={() => (
            <Badge tone="success" size="sm">
              {vouchedLabel}
            </Badge>
          )}
          onlineLabel={vouchedLabel}
          offlineLabel={vouchedLabel}
          empty={
            <EmptyState
              icon={<UserX size={48} aria-hidden />}
              title={t('verification.call.summaryNone', 'Nobody confirmed on this call.')}
            />
          }
        />
      </div>

      <div className={clsx(pages.actions, styles.stickyActions)}>
        {verified ? (
          <Button fullWidth onClick={() => navigate('/')}>
            {t('verification.hub.goHome', 'Go to Home')}
          </Button>
        ) : (
          <Button fullWidth onClick={() => navigate('/identity/verification/request')}>
            {t('verification.call.summaryNext', 'Ask a member to vouch')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CallSummary;
