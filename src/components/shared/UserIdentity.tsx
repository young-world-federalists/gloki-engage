import React from 'react';
import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';
import { useT } from '../../i18n';
import CountryFlag from './CountryFlag';
import type { TrustState } from '../../services/trustModel';
import styles from './UserIdentity.module.scss';

export interface UserIdentityProps {
  /** Display name, already composed + translated (e.g. "Mei Chen"). */
  name: string;
  /** ISO 3166-1 alpha-2 code; renders a flag BEFORE the name when present. */
  countryCode?: string;
  /** Web-of-trust state; a verified member gets a small shield after the name. */
  trustState?: TrustState;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Canonical inline identity: [flag] Name [verified-shield].
 * - Country flag (when known) BEFORE the name (reuses CountryFlag's accessible label).
 * - A verified member gets a ShieldCheck rendered like an exponent AFTER the name.
 *   Non-verified members get no shield (absence = not verified) so the adornment
 *   never adds noise. The shield is icon-only → aria-label ("Verified") is its name.
 * Replaces the text TrustBadge in feed/byline contexts; the dedicated verification
 * page (IdentityTrust) keeps the full descriptive TrustBadge.
 */
const UserIdentity: React.FC<UserIdentityProps> = ({
  name,
  countryCode,
  trustState,
  size = 'sm',
  className,
}) => {
  const t = useT();
  const verified = trustState === 'verified';
  return (
    <span className={clsx(styles.identity, styles[size], className)}>
      {countryCode && <CountryFlag code={countryCode} size="sm" className={styles.flag} />}
      <span className={styles.name}>{name}</span>
      {verified && (
        <ShieldCheck
          className={styles.shield}
          size={size === 'md' ? 13 : 11}
          role="img"
          aria-label={t('trust.verified', 'Verified')}
        />
      )}
    </span>
  );
};

export default UserIdentity;
