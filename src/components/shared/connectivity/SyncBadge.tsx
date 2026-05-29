import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import Badge from '../Badge';
import type { BadgeTone } from '../Badge';
import { useT } from '../../../i18n';
import type { SyncStatus } from '../../../services/demo/fixtures/presence';

export interface SyncBadgeProps {
  status: SyncStatus;
  className?: string;
}

/**
 * "Works offline / syncs later" indicator. Makes intermittent connectivity
 * legible: a contribution is saved locally and will sync, or is already synced.
 */
const SyncBadge: React.FC<SyncBadgeProps> = ({ status, className }) => {
  const t = useT();

  const map: Record<SyncStatus, { tone: BadgeTone; icon: React.ReactNode; label: string }> = {
    synced: {
      tone: 'success',
      icon: <Cloud size={12} aria-hidden />,
      label: t('connectivity.synced', 'Synced'),
    },
    pending: {
      tone: 'warning',
      icon: <RefreshCw size={12} aria-hidden />,
      label: t('connectivity.pending', 'Saved · syncs later'),
    },
    offline: {
      tone: 'neutral',
      icon: <CloudOff size={12} aria-hidden />,
      label: t('connectivity.offline', 'Offline'),
    },
  };

  const { tone, icon, label } = map[status];

  return (
    <Badge tone={tone} size="sm" className={className}>
      {icon}
      {label}
    </Badge>
  );
};

export default SyncBadge;
