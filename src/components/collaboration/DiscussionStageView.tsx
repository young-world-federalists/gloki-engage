import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import { Button } from '../shared';
import PageHeader from '../PageHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useFlowContract } from './flows/shared/useFlowContract';
import { useDiscussionData } from './flows/discussion/useDiscussionData';
import useCommunityTrust from '../../hooks/useCommunityTrust';
import SharedStatement from './flows/discussion/SharedStatement';
import DeliberationThread from './flows/discussion/DeliberationThread';
import cs from '../../pages/Container.module.scss';
import styles from './DiscussionStageView.module.scss';

interface DiscussionStageViewProps {
  title: string;
  communityId: string;
  initiativeId: string;
}

/**
 * The dedicated, full-screen co-authoring space (navigated from the dashboard).
 * One co-owned statement + (in A3) ranked positions + anchored discussion, all
 * seam-backed through a shared discussion sub-contract of the initiative, all
 * one person, one vote. Viewing is always visible; actions gate on the
 * community's per-stage trust rule.
 */
const DiscussionStageView: React.FC<DiscussionStageViewProps> = ({ title, communityId, initiativeId }) => {
  const navigate = useNavigate();
  const t = useT();
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);

  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    `discussion-${initiativeId}`,
    'discussion',
    'discussion_contract.py',
    '',
    initiativeId,
    'discussionContractId',
  );

  const data = useDiscussionData(contractId, isReady);
  const { canCurrentUserParticipate } = useCommunityTrust(communityId);
  const canParticipate = canCurrentUserParticipate('discussion');

  return (
    <div className={cs.container}>
      <PageHeader
        showBackButton
        backButtonText={t('deliberation.back', 'Back to Dashboard')}
        onBackClick={() => navigate(-1)}
        title={t('deliberation.discussion.viewTitle', '{title} — Discussion', { title })}
        subtitle={communityName}
        layout="two-row"
      />
      <div className={cs.content}>
        <div className={styles.main}>
          <ErrorBoundary fallbackMessage={t('deliberation.error', 'The discussion section encountered an error.')}>
            {hasError ? (
              <div className={`${styles.status} ${styles.statusError}`}>
                <AlertTriangle size={36} aria-hidden />
                <p>{errorMessage}</p>
                <Button variant="secondary" onClick={retry}>
                  {t('deliberation.retry', 'Try again')}
                </Button>
              </div>
            ) : !isReady ? (
              <div className={styles.status}>
                <MessageSquare size={36} aria-hidden />
                <p>{statusMessage || (isDeploying ? t('deliberation.settingUp', 'Setting up the co-authoring space…') : t('deliberation.loading', 'Loading…'))}</p>
              </div>
            ) : (
              <>
                <SharedStatement
                  contractId={contractId}
                  statement={data.statement}
                  edits={data.edits}
                  participantCount={data.participantCount}
                  canParticipate={canParticipate}
                  onChanged={data.refresh}
                />
                <DeliberationThread />
              </>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default DiscussionStageView;
