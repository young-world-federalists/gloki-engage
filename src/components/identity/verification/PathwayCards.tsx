import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, UserCheck, Mail, Video } from 'lucide-react';
import { Card, Button } from '../../shared';
import { useT } from '../../../i18n';
import { isBeta } from '../../../appMode';
import styles from './PathwayCards.module.scss';

interface Pathway {
  key: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  to: string;
  /** The call card's F10 bandwidth line — see below. Absent on the others. */
  extra?: React.ReactNode;
}

/**
 * The ways to collect approvals (spec §3.3, E3). Wave 1 shipped the two
 * text-first pathways; Wave 2 (Task 8) adds the call. The daily-session card
 * stays out (Wave 3). Non-video pathways stay first (F10 ordering) — the
 * call card goes last, not because it's newest, but because F10 requires it.
 */
const PathwayCards: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  // S43 (critique P1): in the beta "Ask a member" is the one recommended path;
  // the other three stay reachable under a disclosure. Demo: four equal cards.
  const [showOthers, setShowOthers] = useState(!isBeta);
  const pathways: Pathway[] = [
    {
      key: 'request',
      icon: <UserCheck size={24} aria-hidden />,
      title: isBeta ? t('beta.verification.request.title', 'Ask someone who knows you') : t('verification.pathway.request.title', 'Ask a member'),
      body: isBeta
        ? t('beta.verification.request.body', 'Pick people who know you and ask them to vouch. Four approvals make you verified; the first is the hard one.')
        : t('verification.pathway.request.body', 'Choose verified members who know you and ask them to vouch.'),
      cta: isBeta ? t('beta.verification.request.cta', 'Ask someone') : t('verification.pathway.request.cta', 'Ask a member'),
      to: '/identity/verification/request',
    },
    {
      key: 'invite',
      icon: <Mail size={24} aria-hidden />,
      title: t('verification.pathway.invite.title', 'Invitations'),
      body: t('verification.pathway.invite.body', 'Get invited by a verified member — or, once verified, invite people you know.'),
      cta: t('verification.pathway.invite.cta', 'Invitations'),
      to: '/identity/verification/invite',
    },
    {
      key: 'call',
      icon: <Video size={24} aria-hidden />,
      title: t('verification.pathway.call.title', 'Video call'),
      body: t('verification.pathway.call.body', 'Get verified live by video with members who join your call.'),
      cta: t('verification.pathway.call.cta', 'Start a call'),
      to: '/identity/verification/call',
      // F10's line, VERBATIM — the same two keys Task 5 put on the call's own
      // `select` step, not a second copy of the sentence under a new key.
      extra: (
        <p className={styles.body}>
          {t('verification.call.bandwidth', 'Uses your camera and mobile data.')}{' '}
          <Link to="/identity/verification/request" className={styles.link}>
            {t('verification.call.bandwidthLink', 'No camera? Ask a member to vouch for you instead.')}
          </Link>
        </p>
      ),
    },
    {
      key: 'daily',
      icon: <CalendarClock size={24} aria-hidden />,
      title: t('verification.pathway.daily.title', 'Daily verification'),
      body: t('verification.pathway.daily.body', 'Join the scheduled daily group and receive approvals from selected verified volunteers.'),
      cta: t('verification.pathway.daily.cta', 'View daily session'),
      to: '/identity/verification/daily',
      // Beta: the camera/data line is said once, on the call card.
      extra: isBeta ? undefined : (
        <p className={styles.body}>
          {t('verification.call.bandwidth', 'Uses your camera and mobile data.')}{' '}
          <Link to="/identity/verification/request" className={styles.link}>
            {t('verification.call.bandwidthLink', 'No camera? Ask a member to vouch for you instead.')}
          </Link>
        </p>
      ),
    },
  ];
  const [primary, ...others] = pathways;
  const renderCard = (p: Pathway, isPrimary: boolean) => (
    <Card as="li" key={p.key} className={styles.card}>
      <span className={styles.icon}>{p.icon}</span>
      <h3 className={styles.title}>{p.title}</h3>
      <p className={styles.body}>{p.body}</p>
      {p.extra}
      <Button size="md" variant={isPrimary ? 'primary' : 'secondary'} fullWidth onClick={() => navigate(p.to)}>
        {p.cta}
      </Button>
    </Card>
  );
  return (
    <>
      <ul className={styles.grid}>
        {renderCard(primary, isBeta)}
        {showOthers && others.map((p) => renderCard(p, false))}
      </ul>
      {!showOthers && (
        <Button
          variant="ghost"
          fullWidth
          className={styles.othersToggle}
          onClick={() => setShowOthers(true)}
          aria-expanded={false}
        >
          {t('beta.verification.otherWays', 'Other ways to get approvals ({n})', { n: others.length })}
        </Button>
      )}
    </>
  );
};

export default PathwayCards;
