import React from 'react';
import { useT } from '../../i18n';
import { Card, Badge } from '../shared';
import type { BadgeTone } from '../shared';
import type { JourneyPhase } from '../../services/demo/fixtures/community';
import styles from './MissionBanner.module.scss';

export interface MissionBannerProps {
  /** Community name (real, from community properties). */
  name: string;
  /** Community description (real, from community properties). */
  description?: string;
  /** One-line mission tagline (flagship only; omit to hide). */
  mission?: string;
  /** Deliberation journey phases (flagship only; omit to hide). */
  journey?: JourneyPhase[];
}

const STATUS_TONE: Record<JourneyPhase['status'], BadgeTone> = {
  done: 'success',
  active: 'primary',
  upcoming: 'neutral',
};

/**
 * Mission banner band atop the community home. Pure presentational —
 * degrades to just name + description when mission/journey are absent.
 */
const MissionBanner: React.FC<MissionBannerProps> = ({ name, description, mission, journey }) => {
  const t = useT();

  return (
    <Card as="section" className={styles.banner}>
      <p className={styles.eyebrow}>{t('community.missionEyebrow', 'Our shared mission')}</p>
      <h2 className={styles.name}>{name}</h2>
      {mission && <p className={styles.mission}>{mission}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {journey && journey.length > 0 && (
        <div className={styles.journey} aria-label={t('community.journeyAria', 'Deliberation journey')}>
          {journey.map((phase) => (
            <Badge key={phase.key} tone={STATUS_TONE[phase.status]} dot={phase.status === 'active'}>
              {t(phase.labelKey, phase.labelDefault)}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MissionBanner;
