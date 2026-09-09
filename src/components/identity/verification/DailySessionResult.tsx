import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Users } from 'lucide-react';
import { Badge, Button, CountdownTimer, EmptyState, MemberCard } from '../../shared';
import { useT } from '../../../i18n';
import type { DailySnapshot } from '../../../services/verification';
import CallSummary from './CallSummary';
import styles from './DailySession.module.scss';

interface Props {
  snapshot: DailySnapshot;
  busy: boolean;
  onEnterCall: () => void;
  onFinish: () => void;
}

const DailySessionResult: React.FC<Props> = ({ snapshot, busy, onEnterCall, onFinish }) => {
  const t = useT();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [stay, setStay] = useState(false);
  const selected = snapshot.participants.filter((participant) => snapshot.selectedVerifierKeys.includes(participant.publicKey));
  const settled = snapshot.phase === 'finished' || snapshot.call?.state === 'complete';

  useEffect(() => {
    headingRef.current?.focus();
  }, [snapshot.assignment, snapshot.phase]);

  if (snapshot.assignment === 'unavailable') {
    return (
      <section className={styles.stack}>
        <h2 ref={headingRef} className={styles.title} tabIndex={-1}>
          {t('verification.daily.unavailableTitle', 'No verification group is available')}
        </h2>
        <EmptyState
          icon={<Users size={48} aria-hidden />}
          title={t('verification.daily.unavailableBody', 'Try the next daily session or ask a member to vouch for you.')}
          action={
            <Link to="/identity/verification/request" className={styles.textLink}>
              {t('verification.daily.askMember', 'Ask a member instead')}
            </Link>
          }
        />
        <Button fullWidth variant="ghost" onClick={() => navigate('/identity/verification')}>
          {t('verification.daily.back', 'Back to verification')}
        </Button>
      </section>
    );
  }

  if (snapshot.assignment === 'observer') {
    return (
      <section className={styles.stack}>
        <h2 ref={headingRef} className={styles.title} tabIndex={-1}>
          {settled
            ? t('verification.daily.observerDoneTitle', 'Thanks for joining today')
            : t('verification.daily.observerTitle', 'Other volunteers were selected')}
        </h2>
        <p className={styles.copy}>
          {settled
            ? t('verification.daily.verifiedCount', 'New members verified in this demo session: {count}', {
                count: snapshot.newlyVerifiedCount,
              })
            : t('verification.daily.observerBody', 'The selected group is verifying the sample member now. You can leave at any time.')}
        </p>
        {snapshot.call && !settled && (
          <p className={styles.copy} aria-live="polite">
            {t('verification.call.verifiedCount', '{verified} of {total} verified', {
              verified: snapshot.call.verifiers.filter((verifier) => verifier.verified).length,
              total: snapshot.call.verifiers.length,
            })}
          </p>
        )}
        {settled && !stay && (
          <CountdownTimer
            seconds={5}
            onDone={() => navigate('/identity/verification')}
            label={(value) => t('verification.daily.returningIn', 'Returning to verification in {value}', { value })}
          />
        )}
        <div className={styles.actions}>
          <Button fullWidth onClick={() => navigate('/identity/verification')}>
            {t('common.dismiss', 'Dismiss')}
          </Button>
          {settled && !stay && (
            <Button fullWidth variant="ghost" onClick={() => setStay(true)}>
              {t('verification.daily.stay', 'Stay here')}
            </Button>
          )}
        </div>
      </section>
    );
  }

  if (snapshot.phase === 'finished' && snapshot.call) {
    return (
      <section className={styles.stack}>
        <h2 ref={headingRef} className={styles.title} tabIndex={-1}>
          {t('verification.daily.resultTitle', 'Daily session result')}
        </h2>
        <CallSummary session={snapshot.call} role={snapshot.role} embedded />
        <p className={styles.copy}>
          {snapshot.newlyVerifiedCount > 0
            ? t('verification.daily.verifiedCount', 'New members verified in this demo session: {count}', {
                count: snapshot.newlyVerifiedCount,
              })
            : t('verification.daily.partialProgress', 'The approvals from this session were recorded, but nobody crossed four yet.')}
        </p>
        {!stay && (
          <CountdownTimer
            seconds={5}
            onDone={() => navigate('/identity/verification')}
            label={(value) => t('verification.daily.returningIn', 'Returning to verification in {value}', { value })}
          />
        )}
        <div className={styles.actions}>
          <Button fullWidth onClick={() => navigate('/identity/verification')}>
            {t('common.dismiss', 'Dismiss')}
          </Button>
          {!stay && (
            <Button fullWidth variant="ghost" onClick={() => setStay(true)}>
              {t('verification.daily.stay', 'Stay here')}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const verifierAssignment = snapshot.assignment === 'selectedVerifier';
  return (
    <section className={styles.stack}>
      <h2 ref={headingRef} className={styles.title} tabIndex={-1}>
        {verifierAssignment
          ? t('verification.daily.selectedTitle', "You've been selected to help verify {name}", { name: snapshot.candidate.name })
          : t('verification.daily.candidateTitle', 'Your verification group is ready')}
      </h2>
      <p className={styles.copy}>{t('verification.daily.selectedRoster', 'Your group for this session:')}</p>
      <ul className={styles.roster}>
        {selected.map((participant) => (
          <MemberCard
            as="li"
            key={participant.publicKey}
            name={participant.name}
            countryCode={participant.country}
            online
            onlineLabel={t('verification.daily.joined', 'Joined')}
            offlineLabel={t('verification.daily.waiting', 'Waiting')}
            action={
              <Badge tone="success" size="sm">
                {t('verification.daily.selected', 'Selected')}
              </Badge>
            }
          />
        ))}
      </ul>
      <p className={styles.copy}>{t('verification.call.bandwidth', 'Uses your camera and mobile data.')}</p>
      <Link to="/identity/verification/request" className={styles.textLink}>
        {t('verification.call.bandwidthLink', 'No camera? Ask a member to vouch for you instead.')}
      </Link>
      <Button fullWidth leftIcon={<CheckCircle2 size={18} aria-hidden />} disabled={busy} onClick={onEnterCall}>
        {t('verification.daily.enterCall', 'Join call')}
      </Button>
      <Button fullWidth variant="ghost" disabled={busy} onClick={onFinish}>
        {t('verification.daily.leave', 'Leave session')}
      </Button>
    </section>
  );
};

export default DailySessionResult;
