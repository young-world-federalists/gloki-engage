import React from 'react';
import { Plus, Menu as MenuIcon, Users } from 'lucide-react';
import { Button } from '../shared';
import { ParticipationSummary } from '../shared/presence';
import { useT } from '../../i18n';
import styles from './CommunityCard.module.scss';

export interface CommunityCardProps {
  communityId: string;
  name: string;
  description?: string;
  mission?: string;
  journey?: string[];
  memberCount: number;
  participation: { code: string; participants: number }[];
  isDemo?: boolean;
  onStartInitiative: () => void;
  onOpenMenu: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  name, description, mission, journey, memberCount, participation,
  isDemo, onStartInitiative, onOpenMenu,
}) => {
  const t = useT();
  const blurb = mission || description;
  return (
    <section className={styles.card} aria-label={name}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>{t('community.eyebrow', 'Community')}</span>
        {isDemo && <span className={styles.demoPill}>{t('community.demo', 'Demo')}</span>}
      </div>
      <h1 className={styles.name}>{name}</h1>
      {blurb && <p className={styles.mission}>{blurb}</p>}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Users size={15} aria-hidden />
          {memberCount === 1
            ? t('community.members.one', '1 member')
            : t('community.members.many', '{n} members', { n: memberCount })}
        </span>
      </div>

      {participation.length > 0 && <ParticipationSummary participation={participation} />}

      {journey && journey.length > 0 && (
        <ul className={styles.journey}>
          {journey.map((j, i) => <li key={i} className={styles.journeyItem}>{j}</li>)}
        </ul>
      )}

      <div className={styles.actions}>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onStartInitiative} className={styles.startBtn}>
          {t('initiative.start', 'Start an initiative')}
        </Button>
        <Button
          variant="secondary"
          leftIcon={<MenuIcon size={18} />}
          onClick={onOpenMenu}
          aria-haspopup="menu"
        >
          {t('community.menuButton', 'Menu')}
        </Button>
      </div>
    </section>
  );
};

export default CommunityCard;
