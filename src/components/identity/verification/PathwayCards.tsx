import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Mail, Video } from 'lucide-react';
import { Card, Button } from '../../shared';
import { useT } from '../../../i18n';
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
  const pathways: Pathway[] = [
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
  ];
  return (
    <ul className={styles.grid}>
      {pathways.map((p) => (
        <Card as="li" key={p.key} className={styles.card}>
          <span className={styles.icon}>{p.icon}</span>
          <h3 className={styles.title}>{p.title}</h3>
          <p className={styles.body}>{p.body}</p>
          {p.extra}
          <Button size="md" variant="secondary" fullWidth onClick={() => navigate(p.to)}>
            {p.cta}
          </Button>
        </Card>
      ))}
    </ul>
  );
};

export default PathwayCards;
