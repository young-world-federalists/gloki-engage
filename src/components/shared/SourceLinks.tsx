import React from 'react';
import { ExternalLink } from 'lucide-react';
import { normalizeSources, type SourceLink } from '../../utils/sources';
import styles from './SourceLinks.module.scss';

export interface SourceLinksProps {
  /** Accepts the new `{url,label}` shape and the legacy bare-URL `string[]`. */
  sources: Array<string | SourceLink>;
  /** Optional heading rendered above the list (already translated). */
  heading?: string;
  className?: string;
}

// Canonical citation render: a sanitised list of external links, label as the
// link text when present, otherwise the URL. Matches the existing evidence-link
// pattern (ProblemVoteFlow) so sources read the same everywhere.
const SourceLinks: React.FC<SourceLinksProps> = ({ sources, heading, className }) => {
  const clean = normalizeSources(sources);
  if (clean.length === 0) return null;
  return (
    <div className={[styles.sources, className].filter(Boolean).join(' ')}>
      {heading && <p className={styles.heading}>{heading}</p>}
      <ul className={styles.list}>
        {clean.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <ExternalLink size={13} aria-hidden className={styles.icon} />
              <span className={styles.linkText}>{s.label || s.url}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceLinks;
