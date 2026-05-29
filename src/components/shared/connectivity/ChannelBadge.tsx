import React from 'react';
import clsx from 'clsx';
import { Smartphone, MessageCircle, MessageSquare, Hash } from 'lucide-react';
import { useT } from '../../../i18n';
import type { ChannelKind } from '../../../services/demo/fixtures/presence';
import styles from './ChannelBadge.module.scss';

export interface ChannelBadgeProps {
  channel: ChannelKind;
  className?: string;
}

/**
 * Representation of how a participant reaches the deliberation — including
 * WhatsApp/SMS bridges, so a low-tech contributor reads as first-class.
 */
const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, className }) => {
  const t = useT();

  const map: Record<ChannelKind, { icon: React.ReactNode; label: string }> = {
    app: { icon: <Smartphone size={12} aria-hidden />, label: t('connectivity.viaApp', 'In app') },
    whatsapp: {
      icon: <MessageCircle size={12} aria-hidden />,
      label: t('connectivity.viaWhatsapp', 'via WhatsApp'),
    },
    sms: {
      icon: <MessageSquare size={12} aria-hidden />,
      label: t('connectivity.viaSms', 'via SMS'),
    },
    ussd: { icon: <Hash size={12} aria-hidden />, label: t('connectivity.viaUssd', 'via USSD') },
  };

  const { icon, label } = map[channel];

  return (
    <span className={clsx(styles.chip, className)}>
      <span className={styles.icon}>{icon}</span>
      {label}
    </span>
  );
};

export default ChannelBadge;
