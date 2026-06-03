import React from 'react';
import { ShieldCheck, Shield, ShieldOff } from 'lucide-react';
import Badge, { type BadgeTone } from './Badge';
import { useT } from '../../i18n';
import type { TrustState } from '../../services/trustModel';

const CONFIG: Record<TrustState, { tone: BadgeTone; Icon: typeof Shield }> = {
  verified: { tone: 'success', Icon: ShieldCheck },
  vouched: { tone: 'info', Icon: Shield },
  unverified: { tone: 'neutral', Icon: ShieldOff },
};

export interface TrustBadgeProps {
  state: TrustState;
  /** Used to render "Vouched by N" for the pending state. */
  vouchCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A member's web-of-trust state as a Badge. Icon AND text — never colour alone —
 * so it reads under colour-blindness and screen readers (the visible label is the
 * accessible name). Tones map to AA-compliant semantic surfaces in light + dark.
 */
const TrustBadge: React.FC<TrustBadgeProps> = ({ state, vouchCount, size = 'sm', className }) => {
  const t = useT();
  const { tone, Icon } = CONFIG[state];
  const label =
    state === 'verified'
      ? t('trust.verified', 'Verified')
      : state === 'vouched'
        ? t('trust.vouched', 'Vouched by {count}', { count: vouchCount ?? 0 })
        : t('trust.unverified', 'Unverified');
  return (
    <Badge tone={tone} size={size} className={className}>
      <Icon size={12} aria-hidden />
      <span>{label}</span>
    </Badge>
  );
};

export default TrustBadge;
