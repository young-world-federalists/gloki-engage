import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityProperties } from '../../store/slices/communitiesSlice';
import { useT } from '../../i18n';
import { Button, ContextCard } from '../shared';
import AppHeader from '../AppHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useFlowContract } from './flows/shared/useFlowContract';
import useCommunityTrust from '../../hooks/useCommunityTrust';
import ThreadedDiscussion from './flows/discussion/ThreadedDiscussion';
import cs from '../../pages/Container.module.scss';
import styles from './DiscussionStageView.module.scss';

interface DiscussionStageViewProps {
  title: string;
  /** The problem/initiative summary shown as the ContextCard body (the item under discussion). */
  description?: string;
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
const DiscussionStageView: React.FC<DiscussionStageViewProps> = ({ title, description, communityId, initiativeId }) => {
  const navigate = useNavigate();
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);
  const members = useAppSelector((s) => s.communities.communityMembers[communityId]);

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

  const { canCurrentUserParticipate } = useCommunityTrust(communityId);
  const canParticipate = canCurrentUserParticipate('discussion');

  return (
    <div className={cs.container}>
      {/* The discussed item is the headline (S23): h1 = the initiative title,
          with "Discussion — community" demoted to the quiet eyebrow. */}
      <AppHeader
        showBack
        onBack={() => navigate(-1)}
        eyebrow={`${t('header.section.discussion', 'Discussion')} — ${communityName}`}
        title={title}
      />
      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={styles.main}>
          {/* The item under discussion stays visible (§5 rule 11). Body-only:
              the h1 already carries the initiative title (S23), so passing the
              title here too would double it. */}
          <ContextCard body={description} ariaLabel={t('context.discussion.aria', 'The problem under discussion')} />
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
                <p>{statusMessage || (isDeploying ? t('deliberation.settingUp', 'Setting up the discussion…') : t('deliberation.loading', 'Loading…'))}</p>
              </div>
            ) : (
              <ThreadedDiscussion
                contractId={contractId!}
                communityId={communityId}
                canParticipate={canParticipate}
                emptyHint={t('deliberation.thread.empty', 'Start the conversation about this problem.')}
              />
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default DiscussionStageView;
