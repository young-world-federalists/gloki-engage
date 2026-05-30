import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CountryPresence, CountryFlag } from '../../../shared';
import { useT } from '../../../../i18n';
import {
  deliberationParticipant,
  type PresenceEvent,
} from '../../../../services/demo/fixtures/deliberation';
import styles from './CoPresenceBar.module.scss';

export interface CoPresenceBarProps {
  /** All participant publicKeys — drives the flag cluster + "N from M countries". */
  participants: string[];
  /** Subset present "right now" — drives the live pulse + here-now avatars. */
  hereNow: string[];
  /** Optional rotating live events (gated behind prefers-reduced-motion). */
  ticker?: PresenceEvent[];
  /** Tighter layout for stage cards. */
  compact?: boolean;
  className?: string;
}

/** React to the user's reduced-motion preference so the live ticker never animates against their wishes. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

const TICKER_INTERVAL_MS = 3200;

/**
 * "Who's here, from where" — makes cross-border participation feel present and
 * alive. A flag cluster + participation count, a pulsing here-now indicator,
 * and a gentle live ticker of arrivals/reading/writing. The ticker only
 * animates when the user hasn't asked to reduce motion.
 */
const CoPresenceBar: React.FC<CoPresenceBarProps> = ({
  participants,
  hereNow,
  ticker,
  compact,
  className,
}) => {
  const t = useT();
  const reducedMotion = usePrefersReducedMotion();

  const countries = participants.map((k) => deliberationParticipant(k).country).filter(Boolean);
  const uniqueCountries = Array.from(new Set(countries));

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reducedMotion || !ticker || ticker.length === 0) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % ticker.length), TICKER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, ticker]);

  const presenceLabel = t(
    'deliberation.presence.takingPart',
    '{people} taking part from {countries} countries',
    { people: participants.length, countries: uniqueCountries.length },
  );

  const verbFor = (kind: PresenceEvent['kind']) =>
    kind === 'joined'
      ? t('deliberation.presence.verb.joined', 'just joined')
      : kind === 'typing'
        ? t('deliberation.presence.verb.typing', 'is writing…')
        : t('deliberation.presence.verb.viewing', 'is reading');

  const current = ticker && ticker.length > 0 ? ticker[idx % ticker.length] : undefined;

  return (
    <div className={clsx(styles.bar, compact && styles.compact, className)}>
      <CountryPresence countries={countries} label={presenceLabel} size={compact ? 'sm' : 'md'} />

      <div className={styles.liveRow}>
        <span className={styles.liveDot} aria-hidden />
        <span className={styles.liveCount}>
          {t('deliberation.presence.hereNow', '{n} here now', { n: hereNow.length })}
        </span>
        {hereNow.length > 0 && (
          <span className={styles.hereAvatars}>
            {hereNow.slice(0, 4).map((k) => {
              const p = deliberationParticipant(k);
              return (
                <span key={k} className={styles.hereAvatar} title={p.name} aria-hidden>
                  {p.initials}
                </span>
              );
            })}
          </span>
        )}
      </div>

      {current && (
        <p className={styles.ticker} aria-live="polite">
          {reducedMotion ? (
            t('deliberation.presence.staticHere', '{name} and others are here', {
              name: deliberationParticipant(hereNow[0] ?? current.author).name,
            })
          ) : (
            <span key={idx} className={styles.tickerItem}>
              <CountryFlag code={deliberationParticipant(current.author).country} size="sm" />
              <strong>{deliberationParticipant(current.author).name.split(' ')[0]}</strong>{' '}
              {verbFor(current.kind)}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default CoPresenceBar;
