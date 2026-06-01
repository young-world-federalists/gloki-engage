import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import PageHeader from '../PageHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import CoAuthoringPanel from './flows/modifications/CoAuthoringPanel';
import DeliberationThread from './flows/discussion/DeliberationThread';
import cs from '../../pages/Container.module.scss';
import styles from './DiscussionStageView.module.scss';

interface DiscussionStageViewProps {
  title: string;
  communityId: string;
}

/**
 * The dedicated, full-screen deliberation view (navigated from the dashboard).
 * Stacks the track-changes co-authoring of the problem statement (C2) above the
 * threaded, co-present discussion (C1). UI-only — the flows read the
 * deliberation fixture and hold optimistic local state.
 */
const DiscussionStageView: React.FC<DiscussionStageViewProps> = ({ title, communityId }) => {
  const navigate = useNavigate();
  const t = useT();
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);

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
            <CoAuthoringPanel />
            <DeliberationThread />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default DiscussionStageView;
