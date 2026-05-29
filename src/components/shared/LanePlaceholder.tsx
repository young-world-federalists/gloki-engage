import React from 'react';
import { Hammer } from 'lucide-react';
import EmptyState from './EmptyState';
import styles from './LanePlaceholder.module.scss';

export interface LanePlaceholderProps {
  /** e.g. "Lane A — Onboarding & Identity" */
  lane: string;
  /** One sentence: what the owning lane plugs in here. */
  what: string;
}

/**
 * Foundation placeholder for routes whose owning lane hasn't built them yet.
 * Makes it obvious in the running app where each parallel session's work lands.
 * The owning lane replaces the stub component's body with the real screen.
 */
const LanePlaceholder: React.FC<LanePlaceholderProps> = ({ lane, what }) => (
  <div className={styles.wrap}>
    <EmptyState icon={<Hammer size={48} />} title={`Coming soon — ${lane}`} message={what} />
  </div>
);

export default LanePlaceholder;
