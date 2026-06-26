import React from 'react';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import type { FlowProps } from '../types';
import { useAppSelector } from '../../../../store/hooks';
import { useFlowContract } from '../shared/useFlowContract';
import { useT } from '../../../../i18n';
import ThreadedDiscussion from './ThreadedDiscussion';
import styles from './DiscussionFlow.module.scss';

/**
 * Collab-menu "Discussion" flow — now a thin wrapper over the shared
 * {@link ThreadedDiscussion} (one threaded UI everywhere). No community context
 * here (FlowProps carries none), so author shields are omitted; flag + name still
 * render. Backed by the same discussion sub-contract comment group.
 */
const DiscussionFlow: React.FC<FlowProps> = ({ instanceId, parentContractId, stageKey }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'discussion', 'discussion_contract.py', '', parentContractId, stageKey,
  );

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <AlertTriangle size={36} />
          <p>{errorMessage}</p>
          <button className={styles.btnSubmit} onClick={retry}>{t('common.retry', 'Try again')}</button>
        </div>
      </div>
    );
  }

  if (!isReady || !contractId) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{statusMessage || (isDeploying ? t('deliberation.settingUp', 'Setting up the discussion…') : t('common.loading', 'Loading…'))}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ThreadedDiscussion contractId={contractId} canParticipate={!!publicKey} />
    </div>
  );
};

export default DiscussionFlow;
