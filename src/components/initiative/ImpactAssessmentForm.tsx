import React, { useEffect, useId, useState } from 'react';
import { Modal, Button, SegmentedControl } from '../shared';
import { useT } from '../../i18n';
import type { ImpactAssessment, TargetsCause } from '../collaboration/flows/voting/approvalApi';
import styles from './ImpactAssessmentForm.module.scss';

export interface ImpactAssessmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<ImpactAssessment, 'author' | 'timestamp' | 'proposalId'>) => void;
  /** The solution's own text, shown at the top of the form for context. */
  solutionText: string;
  submitting: boolean;
  /** F13: a contract-thrown error message (e.g. "max 3 per proposal", "one
   *  per author") from the last submit attempt — shown above the footer and
   *  the modal stays open so the user's draft isn't lost. Null/undefined
   *  renders nothing. */
  error?: string | null;
}

const FIELD_MAX = 700;

/**
 * Task 14 — the "Assess impact" form. Seven fields, each a label + a helper
 * prompt (helper copy is the brief's verbatim text — D7/D12): what this
 * targets, whether that's the cause or a symptom (SegmentedControl), the
 * mechanism, broader effects, risks, opportunity costs, and time horizon.
 * Submit stays disabled until every text field is non-empty after trim.
 * Fields reset whenever the modal closes, so a later re-open (a different
 * solution, or the same one again) never leaks a stale draft.
 */
const ImpactAssessmentForm: React.FC<ImpactAssessmentFormProps> = ({ isOpen, onClose, onSubmit, solutionText, submitting, error }) => {
  const t = useT();
  // Task 14 fix-round 1 (Minor 6) — prefix every element id from useId() so
  // the form stays safe to mount twice (e.g. two SolutionsBoard instances,
  // or a future side-by-side review layout) without id collisions.
  const uid = useId();
  const [target, setTarget] = useState('');
  const [targetsCause, setTargetsCause] = useState<TargetsCause>('cause');
  const [mechanism, setMechanism] = useState('');
  const [broaderEffects, setBroaderEffects] = useState('');
  const [risks, setRisks] = useState('');
  const [opportunityCosts, setOpportunityCosts] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('');

  useEffect(() => {
    if (isOpen) return;
    setTarget('');
    setTargetsCause('cause');
    setMechanism('');
    setBroaderEffects('');
    setRisks('');
    setOpportunityCosts('');
    setTimeHorizon('');
  }, [isOpen]);

  const canSubmit = [target, mechanism, broaderEffects, risks, opportunityCosts, timeHorizon]
    .every((v) => v.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      target: target.trim(),
      targetsCause,
      mechanism: mechanism.trim(),
      broaderEffects: broaderEffects.trim(),
      risks: risks.trim(),
      opportunityCosts: opportunityCosts.trim(),
      timeHorizon: timeHorizon.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t('impact.formTitle', 'Assess this solution’s impact')}
      closeLabel={t('common.close', 'Close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!canSubmit} aria-describedby={`${uid}-required`}>
            {t('impact.submit', 'Submit assessment')}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.solutionText}>{solutionText}</p>
        <p className={styles.intro}>
          {t('impact.intro', 'Summarise, in plain words, what this solution is meant to change and what it will cost.')}
        </p>
        <p id={`${uid}-required`} className={styles.helper}>{t('impact.allRequired', 'All fields are required.')}</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-target`}>{t('impact.field.targetLabel', 'Target')}</label>
          <p className={styles.helper} id={`${uid}-target-helper`}>{t('impact.field.target', 'What cause or mechanism does this solution target?')}</p>
          <textarea
            id={`${uid}-target`}
            aria-describedby={`${uid}-target-helper`}
            className={styles.textarea}
            value={target}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          {/* Minor 5 (fix-round 1) — SegmentedControl takes ariaLabel (a text
              string), not aria-describedby/aria-labelledby, so this label span
              needs no id: an id here would be dead weight, not a11y wiring. */}
          <span className={styles.label}>{t('impact.field.targetsCauseLabel', 'Cause or symptom')}</span>
          <p className={styles.helper}>{t('impact.field.targetsCause', 'Does it target the cause or a symptom?')}</p>
          <SegmentedControl<TargetsCause>
            options={[
              { value: 'cause', label: t('impact.targets.cause', 'Cause') },
              { value: 'symptom', label: t('impact.targets.symptom', 'Symptom') },
              { value: 'both', label: t('impact.targets.both', 'Both') },
            ]}
            value={targetsCause}
            onChange={setTargetsCause}
            ariaLabel={t('impact.field.targetsCauseLabel', 'Cause or symptom')}
            fullWidth
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-mechanism`}>{t('impact.field.mechanismLabel', 'Mechanism')}</label>
          <p className={styles.helper} id={`${uid}-mechanism-helper`}>{t('impact.field.mechanism', 'How is it expected to produce its intended effect?')}</p>
          <textarea
            id={`${uid}-mechanism`}
            aria-describedby={`${uid}-mechanism-helper`}
            className={styles.textarea}
            value={mechanism}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setMechanism(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-broader-effects`}>{t('impact.field.broaderEffectsLabel', 'Broader effects')}</label>
          <p className={styles.helper} id={`${uid}-broader-effects-helper`}>{t('impact.field.broaderEffects', 'Expected broader effects and consequences')}</p>
          <textarea
            id={`${uid}-broader-effects`}
            aria-describedby={`${uid}-broader-effects-helper`}
            className={styles.textarea}
            value={broaderEffects}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setBroaderEffects(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-risks`}>{t('impact.field.risksLabel', 'Risks')}</label>
          <p className={styles.helper} id={`${uid}-risks-helper`}>{t('impact.field.risks', 'Potential risks and trade-offs')}</p>
          <textarea
            id={`${uid}-risks`}
            aria-describedby={`${uid}-risks-helper`}
            className={styles.textarea}
            value={risks}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setRisks(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-opportunity-costs`}>{t('impact.field.opportunityCostsLabel', 'Opportunity costs')}</label>
          <p className={styles.helper} id={`${uid}-opportunity-costs-helper`}>{t('impact.field.opportunityCosts', 'Opportunity costs — what is given up by choosing this?')}</p>
          <textarea
            id={`${uid}-opportunity-costs`}
            aria-describedby={`${uid}-opportunity-costs-helper`}
            className={styles.textarea}
            value={opportunityCosts}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setOpportunityCosts(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${uid}-time-horizon`}>{t('impact.field.timeHorizonLabel', 'Time horizon')}</label>
          <p className={styles.helper} id={`${uid}-time-horizon-helper`}>{t('impact.field.timeHorizon', 'Time horizon — how quickly it should work, and how long the effect should last')}</p>
          <textarea
            id={`${uid}-time-horizon`}
            aria-describedby={`${uid}-time-horizon-helper`}
            className={styles.textarea}
            value={timeHorizon}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setTimeHorizon(e.target.value)}
          />
        </div>

        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>
    </Modal>
  );
};

export default ImpactAssessmentForm;
