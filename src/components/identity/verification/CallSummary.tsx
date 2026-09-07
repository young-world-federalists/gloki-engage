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
  /** CallFlow's frozen role (E6 / fix round 1 Critical 1) — passed straight
   *  through, never re-derived from live `trust` here (that would reintroduce
   *  the bug that freeze fixed). Branches the whole screen: see W6, fix
   *  round 1. */
  role: 'candidate' | 'verifier';
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
 * Branches on `role` (W6, fix round 1 Important): the CANDIDATE copy below
 * (the approval-count sentence, the "Verifiers who confirmed" list) is only
 * true read as a report about the LOCAL USER's own verification — for the
 * VERIFIER role this is the same screen after verifying someone ELSE
 * (`session.candidate`), so it gets its own branch instead (same family as
 * ruling R11: a shared honesty line that was accurate for one role and false
 * for the other).
 *
 * `trust`/`vouchCount` come live from `useVerification` (unlike CallFlow's
 * frozen `role`, S37 fix round 1 Critical 1) — the whole point of the
 * CANDIDATE branch is to show what the call just changed to the viewer's own
 * progress, so it must read the CURRENT state, not a snapshot from before the
 * call. The VERIFIER branch never reads `vouchCount`/`trust` at all — this
 * call did not change the viewer's own count (E5's `selfIsCandidate` guard in
 * the seam never banks a vouch onto a verifier's own agent for verifying
 * someone else's call), so nothing here should look like it did.
 */
const CallSummary: React.FC<CallSummaryProps> = ({ session, role }) => {
  const t = useT();
  const navigate = useNavigate();
  const { vouchCount, trust, ctx } = useVerification();

  if (role === 'verifier') {
    // The session's own verifier list holds exactly one entry when the local
    // user is the verifier (InCallView's doc comment) — this is that entry,
    // looked up by key rather than assumed to be verifiers[0] so the check
    // stays correct even if that invariant ever loosens.
    const selfEntry = session.verifiers.find((v) => v.publicKey === ctx?.publicKey);
    const didVerify = selfEntry?.verified ?? false;
    return (
      <div className={pages.page}>
        {/* AppHeader owns the page's single h1; this is the step's own
            in-content heading, same key as the candidate branch — the title
            itself ("Call summary") is true for both roles. */}
        <h2 className={pages.sectionTitle}>{t('verification.call.summaryTitle', 'Call summary')}</h2>
        <p className={pages.intro}>
          {didVerify
            ? t('verification.call.summaryVerifiedName', 'You verified {name}.', { name: session.candidate.name })
            : t('verification.call.summaryLeftEarly', 'You left before verifying {name}.', {
                name: session.candidate.name,
              })}
        </p>
        <div className={clsx(pages.actions, styles.stickyActions)}>
          <Button fullWidth onClick={() => navigate('/')}>
            {t('verification.hub.goHome', 'Go to Home')}
          </Button>
        </div>
      </div>
    );
  }

  // CANDIDATE branch — unchanged from before W6.
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
