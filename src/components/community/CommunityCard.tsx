import React from 'react';
import { Plus, Menu as MenuIcon, Users, Flag } from 'lucide-react';
import { Button } from '../shared';
import { useT } from '../../i18n';
import styles from './CommunityCard.module.scss';

export interface CommunityCardProps {
  name: string;
  description?: string;
  mission?: string;
  memberCount: number;
  participation: { code: string; participants: number }[];
  isDemo?: boolean;
  onStartInitiative: () => void;
  onOpenMenu: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  name, description, mission, memberCount, participation,
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
      <h2 className={styles.name}>{name}</h2>
      {blurb && <p className={styles.mission}>{blurb}</p>}

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Users size={15} aria-hidden />
          {memberCount === 1
            ? t('community.members.one', '1 member')
            : t('community.members.many', '{n} members', { n: memberCount })}
        </span>
        {participation.length > 0 && (
          <span className={styles.metaItem}>
            <Flag size={15} aria-hidden />
            {t('community.countries', '{n} countries', { n: participation.length })}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onStartInitiative} className={styles.startBtn}>
          {t('initiative.start', 'Start an initiative')}
        </Button>
        <div className={styles.optionsWrap}>
          <Button
            variant="secondary"
            leftIcon={<MenuIcon size={20} />}
            onClick={onOpenMenu}
            aria-haspopup="dialog"
            aria-label={t('community.menuButton', 'Community options')}
            className={styles.optionsBtn}
          />
          <span className={styles.optionsCaption} aria-hidden="true">
            {t('community.menuCaption', 'Options')}
          </span>
        </div>
      </div>
    </section>
  );
};

export default CommunityCard;
