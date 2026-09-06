import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Mail } from 'lucide-react';
import { Card, Button } from '../../shared';
import { useT } from '../../../i18n';
import styles from './PathwayCards.module.scss';

/**
 * The ways to collect approvals (spec §3.3, E3). Wave 1 ships the two built
 * pathways; the call and daily-session cards arrive with Waves 2–3 together
 * with F10's camera+data line. Non-video pathways first (F10 ordering).
 */
const PathwayCards: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const pathways = [
    {
      key: 'request',
      icon: <UserCheck size={24} aria-hidden />,
      title: t('verification.pathway.request.title', 'Ask a member'),
      body: t('verification.pathway.request.body', 'Choose verified members who know you and ask them to vouch.'),
      cta: t('verification.pathway.request.cta', 'Ask a member'),
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
  ];
  return (
    <ul className={styles.grid}>
      {pathways.map((p) => (
        <Card as="li" key={p.key} className={styles.card}>
          <span className={styles.icon}>{p.icon}</span>
          <h3 className={styles.title}>{p.title}</h3>
          <p className={styles.body}>{p.body}</p>
          <Button size="sm" variant="secondary" fullWidth onClick={() => navigate(p.to)}>
            {p.cta}
          </Button>
        </Card>
      ))}
    </ul>
  );
};

export default PathwayCards;
