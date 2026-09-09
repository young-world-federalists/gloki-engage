import React, { useEffect, useRef } from 'react';
import { Badge, Button, CountdownTimer, MemberCard } from '../../shared';
import { useT } from '../../../i18n';
import { resolveTrustState } from '../../../services/trustModel';
import type { DailySnapshot } from '../../../services/verification';
import styles from './DailySession.module.scss';

interface Props {
  snapshot: DailySnapshot;
  busy: boolean;
  onLeave: () => void;
}

const DailySessionLobby: React.FC<Props> = ({ snapshot, busy, onLeave }) => {
  const t = useT();
  const joined = snapshot.participants.filter((participant) => participant.joined).length;
  const beforeStart = snapshot.now < snapshot.startsAt;
  const target = beforeStart ? snapshot.startsAt : snapshot.selectionAt;
  const deadlineMs = Date.now() + Math.max(0, target - snapshot.now);
  const joinedLabel = t('verification.daily.joined', 'Joined');
  const waitingLabel = t('verification.daily.waiting', 'Waiting');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formatRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours > 0
      ? t('verification.daily.timeHours', '{hours}h {minutes}m {seconds}s', { hours, minutes, seconds: remainder })
      : t('verification.daily.timeMinutes', '{minutes}m {seconds}s', { minutes, seconds: remainder });
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.stack} aria-labelledby="daily-lobby-title">
      <h2 id="daily-lobby-title" ref={headingRef} className={styles.title} tabIndex={-1}>
        {t('verification.daily.lobbyTitle', 'Daily session lobby')}
      </h2>
      <p className={styles.copy} aria-live="polite">
        {t('verification.daily.joinedCount', 'People in this session: {count}', { count: joined })}
      </p>
      <CountdownTimer
        key={`${snapshot.id}:${target}:${snapshot.clockGeneration}`}
        seconds={0}
        deadlineMs={deadlineMs}
        formatValue={formatRemaining}
        label={(value) =>
          beforeStart
            ? t('verification.daily.startsIn', 'Session starts in {time}', { time: formatRemaining(value) })
            : t('verification.daily.selectingIn', 'Selecting verifiers in {time}', { time: formatRemaining(value) })
        }
      />
      <ul className={styles.roster}>
        {snapshot.participants.map((participant) => (
          <MemberCard
            as="li"
            key={participant.publicKey}
            name={participant.name}
            countryCode={participant.country}
            online={participant.joined}
            onlineLabel={joinedLabel}
            offlineLabel={waitingLabel}
            trustState={resolveTrustState(participant.approvalCount)}
            action={
              <Badge tone={participant.joined ? 'success' : 'neutral'} size="sm">
                {participant.joined ? joinedLabel : waitingLabel}
              </Badge>
            }
          />
        ))}
      </ul>
      <div className={styles.actions}>
        <Button fullWidth variant="ghost" disabled={busy} onClick={onLeave}>
          {t('verification.daily.leave', 'Leave session')}
        </Button>
      </div>
    </section>
  );
};

export default DailySessionLobby;
