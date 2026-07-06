import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { contractRead } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';
import { proposeMerge } from './mergeApi';
import { useT } from '../../../../i18n';
import { Banner, Button, Modal } from '../../../shared';
import styles from './MergeProposalSubmitModal.module.scss';

interface MergeProposalSubmitModalProps {
  targetInitiativeId: string;
  targetTitle: string;
  targetCommunityId: string;
  mergeContractId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const MIN_RATIONALE = 50;
const ELIGIBLE_STAGES: string[] = ['problem', 'discussion', 'proposals'];

interface EligibleCollab {
  id: string;
  title: string;
  stage: string;
}

const MergeProposalSubmitModal: React.FC<MergeProposalSubmitModalProps> = ({
  targetInitiativeId, targetTitle, targetCommunityId, mergeContractId, onClose, onSubmitted,
}) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const collaborations = useAppSelector((s) => s.communities.communityCollaborations[targetCommunityId]);

  const [sourceId, setSourceId] = useState<string>('');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [eligibleSources, setEligibleSources] = useState<EligibleCollab[] | null>(null);

  const ownAuthored = useMemo(() => {
    if (!Array.isArray(collaborations) || !publicKey) return [];
    return collaborations.filter((c) => c.id !== targetInitiativeId && c.author === publicKey);
  }, [collaborations, publicKey, targetInitiativeId]);

  useEffect(() => {
    if (!serverUrl || !publicKey) { setEligibleSources([]); return; }
    let cancelled = false;
    (async () => {
      const results: EligibleCollab[] = [];
      await Promise.all(ownAuthored.map(async (c) => {
        try {
          const stage = await contractRead({
            serverUrl, publicKey, contractId: c.id,
            method: { name: 'get_stage', values: {} } as IMethod,
          });
          if (typeof stage === 'string' && ELIGIBLE_STAGES.includes(stage)) {
            results.push({ id: c.id, title: c.title, stage });
          }
        } catch {
          // non-fatal per candidate
        }
      }));
      if (!cancelled) setEligibleSources(results);
    })();
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, ownAuthored]);

  const handleSubmit = async () => {
    if (!serverUrl || !publicKey || !mergeContractId) {
      setError(t('deliberation.merge.submit.notReady', 'Merge contract is not ready yet. Try again in a moment.'));
      return;
    }
    if (!sourceId) { setError(t('deliberation.merge.submit.pickSource', 'Pick a source initiative.')); return; }
    if (rationale.trim().length < MIN_RATIONALE) {
      setError(t('deliberation.merge.submit.rationaleTooShort', 'Rationale must be at least {n} characters.', { n: MIN_RATIONALE }));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await proposeMerge(serverUrl, publicKey, mergeContractId, sourceId, rationale.trim());
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      setError(t('deliberation.merge.submit.failed', 'Failed to submit: {detail}', { detail: err instanceof Error ? err.message : 'unknown error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const hasEligible = eligibleSources !== null && eligibleSources.length > 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('deliberation.merge.submit.title', 'Propose a merge into “{title}”', { title: targetTitle })}
      closeLabel={t('common.close', 'Close')}
      footer={
        hasEligible ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {submitting ? t('deliberation.merge.submit.submitting', 'Submitting…') : t('deliberation.merge.submit.submit', 'Submit Merge Proposal')}
            </Button>
          </>
        ) : undefined
      }
    >
      {eligibleSources === null ? (
        <div className={styles.emptyState}>
          <p>{t('deliberation.merge.submit.loading', 'Loading your initiatives…')}</p>
        </div>
      ) : eligibleSources.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('deliberation.merge.submit.noEligible', 'You need an initiative you authored in Problem, Discussion, or Proposals stage to propose a merge.')}</p>
          <p className={styles.hint}>{t('deliberation.merge.submit.noEligibleHint', 'Vote- and Mandate-stage initiatives can’t be merged.')}</p>
        </div>
      ) : (
        <>
          <label className={styles.label}>
            {t('deliberation.merge.submit.sourceLabel', 'Which of your initiatives should be merged into this one?')}
            <select
              className={styles.select}
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">{t('deliberation.merge.submit.chooseOne', 'Choose one…')}</option>
              {eligibleSources.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            {t('deliberation.merge.submit.rationaleLabel', 'Rationale (why should these merge?)')}
            <textarea
              className={styles.textarea}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t('deliberation.merge.submit.rationalePlaceholder', 'Explain the overlap and the benefits of consolidating.')}
              rows={5}
            />
            <span className={styles.charCount}>
              {rationale.trim().length} / {MIN_RATIONALE} min
            </span>
          </label>

          {error && <Banner tone="error">{error}</Banner>}
        </>
      )}
    </Modal>
  );
};

export default MergeProposalSubmitModal;
