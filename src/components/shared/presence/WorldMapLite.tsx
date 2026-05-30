import React from 'react';
import clsx from 'clsx';
import { getCountryFlag, getCountryName } from '../../../utils/countries';
import { useT } from '../../../i18n';
import styles from './WorldMapLite.module.scss';

export interface WorldMapLiteProps {
  /** Per-country participant counts. */
  participation: { code: string; participants: number }[];
  /** Override the default heading. */
  title?: string;
  className?: string;
}

/**
 * A lightweight "where we're from" map — a flag constellation, not a geographic
 * map. The most-present country sits at the centre with the rest on a ring,
 * joined by faint lines. Token-only and tiny (no shipped vector asset), so it
 * holds up on low bandwidth and at 360px.
 */
const WorldMapLite: React.FC<WorldMapLiteProps> = ({ participation, title, className }) => {
  const t = useT();
  if (participation.length === 0) return null;

  const sorted = [...participation].sort((a, b) => b.participants - a.participants);
  const total = sorted.reduce((s, c) => s + c.participants, 0);
  const heading = title ?? t('presence.whereWeAreFrom', 'Where we’re from');

  // Largest at centre; the rest evenly on a ring (deterministic by index).
  const [center, ...rest] = sorted;
  const centerPos = { ...center, x: 50, y: 50 };
  const R = 33; // % radius of the ring
  const outer = rest.map((c, i) => {
    const angle = (2 * Math.PI * i) / rest.length - Math.PI / 2; // start at top
    return { ...c, x: 50 + R * Math.cos(angle), y: 50 + R * Math.sin(angle) };
  });
  const nodes = [centerPos, ...outer];

  return (
    <figure className={clsx(styles.map, className)}>
      <figcaption className={styles.title}>{heading}</figcaption>
      <div
        className={styles.canvas}
        role="img"
        aria-label={t('presence.mapAria', '{total} participants across {countries} countries', {
          total,
          countries: sorted.length,
        })}
      >
        <svg className={styles.links} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {outer.map((p) => (
            <line
              key={p.code}
              className={styles.link}
              x1={centerPos.x}
              y1={centerPos.y}
              x2={p.x}
              y2={p.y}
            />
          ))}
        </svg>
        {nodes.map((n) => (
          <div
            key={n.code}
            className={styles.node}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            title={getCountryName(n.code)}
          >
            <span className={styles.flag} role="img" aria-label={getCountryName(n.code)}>
              {getCountryFlag(n.code)}
            </span>
            <span className={styles.count}>{n.participants}</span>
          </div>
        ))}
      </div>
      <ul className={styles.srOnly}>
        {sorted.map((c) => (
          <li key={c.code}>
            {getCountryName(c.code)}: {c.participants}
          </li>
        ))}
      </ul>
    </figure>
  );
};

export default WorldMapLite;
