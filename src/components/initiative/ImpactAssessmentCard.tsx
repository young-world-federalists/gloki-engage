import React from 'react';
import { useI18n } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { displayNameFor } from '../../utils/displayName';
import { formatDateTime } from '../../utils/formatDateTime';
import { UserIdentity } from '../shared';
import type { ImpactAssessment, TargetsCause } from '../collaboration/flows/voting/approvalApi';
import type { TrustState } from '../../services/trustModel';
import { ASSESSORS_PER_SOLUTION } from '../../utils/writerRank';
import styles from './ImpactAssessmentCard.module.scss';

export interface ImpactAssessmentCardProps {
  assessment: ImpactAssessment;
  /** 1-based position among this solution's assessments (header reads "Assessment {i} of {max}"). */
  index: number;
  max?: number;
  trustState?: TrustState;
}

const TARGETS_KEY: Record<TargetsCause, string> = {
  cause: 'impact.targets.cause',
  symptom: 'impact.targets.symptom',
  both: 'impact.targets.both',
};

/**
 * Task 14 — one impact assessment, rendered as a labelled `<dl>` of its seven
 * fields (target, targets-cause, mechanism, broader effects, risks,
 * opportunity costs, time horizon). Self-contained: resolves the author's
 * byline (profiles + "You") and locale-formatted timestamp itself, so callers
 * only need to pass the raw `assessment` plus its position/cap and (where in
 * scope) the author's trust state — mirrors how `CauseLine` is a shared,
 * self-contained renderer across the four surfaces that show assessments
 * (SolutionsBoard, QVFlow ballot + results, VotePreview, MandateCard).
 */
const ImpactAssessmentCard: React.FC<ImpactAssessmentCardProps> = ({ assessment, index, max = ASSESSORS_PER_SOLUTION, trustState }) => {
  const { t, locale } = useI18n();
  const profiles = useAppSelector((s) => s.communities.profiles);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const authorName = publicKey && assessment.author === publicKey
    ? t('mechanisms.approval.author.you', 'You')
    : displayNameFor(profiles[assessment.author], assessment.author);

  const targetsCauseWord = t(TARGETS_KEY[assessment.targetsCause], assessment.targetsCause);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.badge}>{t('impact.nOfMax', 'Assessment {i} of {max}', { i: index, max })}</span>
        <UserIdentity name={authorName} countryCode={profiles[assessment.author]?.country} trustState={trustState} size="sm" />
        <span className={styles.timestamp}>{formatDateTime(assessment.timestamp, locale)}</span>
      </div>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>{t('impact.field.targetLabel', 'Target')}</dt>
          <dd>{assessment.target}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.targetsCauseLabel', 'Cause or symptom')}</dt>
          <dd>{targetsCauseWord}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.mechanismLabel', 'Mechanism')}</dt>
          <dd>{assessment.mechanism}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.broaderEffectsLabel', 'Broader effects')}</dt>
          <dd>{assessment.broaderEffects}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.risksLabel', 'Risks')}</dt>
          <dd>{assessment.risks}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.opportunityCostsLabel', 'Opportunity costs')}</dt>
          <dd>{assessment.opportunityCosts}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('impact.field.timeHorizonLabel', 'Time horizon')}</dt>
          <dd>{assessment.timeHorizon}</dd>
        </div>
      </dl>
    </div>
  );
};

export default ImpactAssessmentCard;
