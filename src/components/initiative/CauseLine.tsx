import React from 'react';
import clsx from 'clsx';
import { useT } from '../../i18n';
import { TOP_CAUSES_CARRIED } from '../../utils/causes';
import { Badge } from '../shared';
import styles from './CauseLine.module.scss';

export interface CauseLineProps {
  /** '' or undefined = proposed before any cause was ranked. */
  causeId?: string;
  /** The cause comment's text, when it's still resolvable (found in the
   *  current ranks). Absent when the cause has been deleted/is unresolvable. */
  causeText?: string;
  /** The cause's current rank, when resolvable. null/undefined behaves like
   *  "no longer ranked" whenever `causeText` is present. */
  causeRank?: number | null;
  className?: string;
}

/**
 * Shared cause-alignment line (S35 F2) — one of the three cause states every
 * solution/ballot row/mandate carries:
 *  - no `causeId` → "proposed before any cause was ranked" badge only.
 *  - `causeId` + resolvable `causeText` → the addressed-cause sentence
 *    (clamped to two lines) followed by "ranked #n" (still in the carried
 *    top N) or "no longer ranked".
 *  - `causeId` set but the cause isn't resolvable (deleted, or the caller
 *    has no ranks to look it up in) → "no longer ranked" badge only.
 *
 * Used by SolutionsBoard, QVFlow's ballot + results, VotePreview, and
 * MandateCard — one renderer for all four surfaces (Task 11).
 */
const CauseLine: React.FC<CauseLineProps> = ({ causeId, causeText, causeRank, className }) => {
  const t = useT();

  if (!causeId) {
    return (
      <div className={clsx(styles.causeLine, className)}>
        <Badge tone="neutral" size="sm">{t('causes.beforeRank', 'Proposed before any cause was ranked')}</Badge>
      </div>
    );
  }

  if (!causeText) {
    return (
      <div className={clsx(styles.causeLine, className)}>
        <Badge tone="neutral" size="sm">{t('causes.unranked', 'Cause no longer ranked')}</Badge>
      </div>
    );
  }

  return (
    <div className={clsx(styles.causeLine, className)}>
      <p className={styles.text} title={causeText}>
        {t('causes.addresses', 'Addresses cause: {text}', { text: causeText })}
      </p>
      {causeRank != null && causeRank <= TOP_CAUSES_CARRIED ? (
        <Badge tone="neutral" size="sm">{t('causes.rankNow', 'Cause now ranked #{n}', { n: causeRank })}</Badge>
      ) : (
        <Badge tone="neutral" size="sm">{t('causes.unranked', 'Cause no longer ranked')}</Badge>
      )}
    </div>
  );
};

export default CauseLine;
