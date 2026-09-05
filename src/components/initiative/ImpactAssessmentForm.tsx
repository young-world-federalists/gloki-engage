import React, { useEffect, useState } from 'react';
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
const ImpactAssessmentForm: React.FC<ImpactAssessmentFormProps> = ({ isOpen, onClose, onSubmit, solutionText, submitting }) => {
  const t = useT();
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
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="impact-target">{t('impact.field.targetLabel', 'Target')}</label>
          <p className={styles.helper}>{t('impact.field.target', 'What cause or mechanism does this solution target?')}</p>
          <textarea
            id="impact-target"
            className={styles.textarea}
            value={target}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="impact-targets-cause-label">{t('impact.field.targetsCauseLabel', 'Cause or symptom')}</span>
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
          <label className={styles.label} htmlFor="impact-mechanism">{t('impact.field.mechanismLabel', 'Mechanism')}</label>
          <p className={styles.helper}>{t('impact.field.mechanism', 'How is it expected to produce its intended effect?')}</p>
          <textarea
            id="impact-mechanism"
            className={styles.textarea}
            value={mechanism}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setMechanism(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="impact-broader-effects">{t('impact.field.broaderEffectsLabel', 'Broader effects')}</label>
          <p className={styles.helper}>{t('impact.field.broaderEffects', 'Expected broader effects and consequences')}</p>
          <textarea
            id="impact-broader-effects"
            className={styles.textarea}
            value={broaderEffects}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setBroaderEffects(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="impact-risks">{t('impact.field.risksLabel', 'Risks')}</label>
          <p className={styles.helper}>{t('impact.field.risks', 'Potential risks and trade-offs')}</p>
          <textarea
            id="impact-risks"
            className={styles.textarea}
            value={risks}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setRisks(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="impact-opportunity-costs">{t('impact.field.opportunityCostsLabel', 'Opportunity costs')}</label>
          <p className={styles.helper}>{t('impact.field.opportunityCosts', 'Opportunity costs — what is given up by choosing this?')}</p>
          <textarea
            id="impact-opportunity-costs"
            className={styles.textarea}
            value={opportunityCosts}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setOpportunityCosts(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="impact-time-horizon">{t('impact.field.timeHorizonLabel', 'Time horizon')}</label>
          <p className={styles.helper}>{t('impact.field.timeHorizon', 'Time horizon — how quickly it should work, and how long the effect should last')}</p>
          <textarea
            id="impact-time-horizon"
            className={styles.textarea}
            value={timeHorizon}
            maxLength={FIELD_MAX}
            rows={3}
            onChange={(e) => setTimeHorizon(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ImpactAssessmentForm;
