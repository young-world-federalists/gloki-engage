import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityProperties } from '../../store/slices/communitiesSlice';
import { useT } from '../../i18n';
import { Button, EmptyState } from '../shared';
import AppHeader from '../AppHeader';
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
const DiscussionStageView: React.FC<DiscussionStageViewProps> = ({ communityId, initiativeId }) => {
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
  // pull members + properties here (members gate the trust rule + the participation
  // meter denominator; properties carry the community name shown as the page's <h1>,
  // which otherwise falls back to a truncated id).
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (!members) dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
    if (!communityProps) dispatch(fetchCommunityProperties({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, members, communityProps, dispatch]);

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
      <AppHeader
        showBack
        onBack={() => navigate(-1)}
        title={communityName}
        eyebrow={t('header.section.discussion', 'Discussion')}
      />
      <main id="main" tabIndex={-1} className={cs.content}>
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
                {/* Un-started discussion: lead with a friendly invitation rather
                    than empty statement/positions scaffolding. The co-authoring
                    controls below stay reachable (SharedStatement carries the
                    "Suggest an edit" action + the statement editor), so the user
                    can still start the first statement. */}
                {data.participantCount === 0 && !data.statement.title && data.positions.length === 0 && (
                  <EmptyState
                    icon={<MessageSquare size={36} aria-hidden />}
                    title={t('deliberation.empty.title', 'No discussion yet')}
                    message={t(
                      'deliberation.empty.body',
                      'Be the first to co-author a shared statement for this problem.',
                    )}
                  />
                )}
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
      </main>
    </div>
  );
};

export default DiscussionStageView;
