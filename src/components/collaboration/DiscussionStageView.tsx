import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers } from '../../store/slices/communitiesSlice';
import { useT } from '../../i18n';
import { Button } from '../shared';
import PageHeader from '../PageHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useFlowContract } from './flows/shared/useFlowContract';
import { useDiscussionData } from './flows/discussion/useDiscussionData';
import useCommunityTrust from '../../hooks/useCommunityTrust';
import SharedStatement from './flows/discussion/SharedStatement';
import PositionsBoard from './flows/discussion/PositionsBoard';
import ParticipationMeter from './flows/discussion/ParticipationMeter';
import AnchoredThread from './flows/discussion/AnchoredThread';
import CoPresenceBar from './flows/discussion/CoPresenceBar';
import { DELIBERATION_PARTICIPANTS, PRESENCE_NOW, PRESENCE_TICKER } from '../../services/demo/fixtures/deliberation';
import GlobalHeader from '../GlobalHeader';
import cs from '../../pages/Container.module.scss';
import styles from './DiscussionStageView.module.scss';

interface DiscussionStageViewProps {
  title: string;
  communityId: string;
  initiativeId: string;
}

/**
 * The dedicated, full-screen co-authoring space (navigated from the dashboard).
 * One co-owned statement + ranked, country-tagged positions + anchored
 * discussion, all seam-backed through a shared discussion sub-contract of the
 * initiative, all one person, one vote. Viewing is always visible; actions gate
 * on the community's per-stage trust rule.
 */
const DiscussionStageView: React.FC<DiscussionStageViewProps> = ({ title, communityId, initiativeId }) => {
  const navigate = useNavigate();
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);
  const members = useAppSelector((s) => s.communities.communityMembers[communityId]);
  const memberCount = Array.isArray(members) ? members.length : 0;

  // Direct/deep-link to this route doesn't pass through the community loader, so
  // pull members here (gates the trust rule + the participation meter denominator).
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId || members) return;
    dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, members, dispatch]);

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
      <GlobalHeader />
      <PageHeader
        showBackButton
        backButtonText={t('common.back', 'Back')}
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
                <div className={styles.copresence}>
                  <CoPresenceBar participants={DELIBERATION_PARTICIPANTS} hereNow={PRESENCE_NOW} ticker={PRESENCE_TICKER} />
                  <ParticipationMeter taken={data.participantCount} members={memberCount} />
                </div>
                <SharedStatement
                  contractId={contractId}
                  statement={data.statement}
                  edits={data.edits}
                  participantCount={data.participantCount}
                  canParticipate={canParticipate}
                  onChanged={data.refresh}
                  discussionSlot={
                    <AnchoredThread
                      anchor="statement"
                      anchored={data.anchored}
                      contractId={contractId}
                      canParticipate={canParticipate}
                      onChanged={data.refresh}
                      placeholder={t('deliberation.coauthor.discussPlaceholder', 'Discuss the statement as a whole…')}
                    />
                  }
                />
                <PositionsBoard
                  positions={data.positions}
                  anchored={data.anchored}
                  contractId={contractId}
                  canParticipate={canParticipate}
                  onChanged={data.refresh}
                />
              </>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default DiscussionStageView;
