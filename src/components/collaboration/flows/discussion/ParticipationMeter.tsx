import React from 'react';
import { Users } from 'lucide-react';
import { useT } from '../../../../i18n';
import styles from './ParticipationMeter.module.scss';

export interface ParticipationMeterProps {
  /** Distinct people who have taken part (any contribution). */
  taken: number;
  /** Community member count. */
  members: number;
}

const THRESHOLD = 0.33;

/**
 * The 33%-participation motif as a visible gate on stage advancement. "Taking
 * part" = any contribution (suggest/support an edit, add/support a position,
 * post an anchored reply) — distinct from the edit fold-in target.
 */
const ParticipationMeter: React.FC<ParticipationMeterProps> = ({ taken, members }) => {
  const t = useT();
  const safeMembers = Math.max(1, members);
  const pct = Math.min(100, Math.round((taken / safeMembers) * 100));
  const thresholdPct = Math.round(THRESHOLD * 100);
  const met = pct >= thresholdPct;

  return (
    <div className={styles.meter}>
      <div className={styles.row}>
        <Users size={14} aria-hidden />
        <span className={styles.label}>
          {t('deliberation.meter.label', '{taken} of {members} taking part', { taken, members })}
        </span>
        <span className={`${styles.threshold} ${met ? styles.thresholdMet : ''}`}>
          {met
            ? t('deliberation.meter.met', '33% reached — ready to advance')
            : t('deliberation.meter.needed', '33% needed to advance')}
        </span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuenow={taken}
        aria-valuemin={0}
        aria-valuemax={safeMembers}
        aria-label={t('deliberation.meter.aria', '{taken} of {members} members taking part', { taken, members })}
      >
        <span className={`${styles.fill} ${met ? styles.fillMet : ''}`} style={{ width: `${pct}%` }} />
        <span className={styles.marker} style={{ left: `${thresholdPct}%` }} aria-hidden />
      </div>
    </div>
  );
};

export default ParticipationMeter;
