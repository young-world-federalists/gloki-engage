import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FilePen, GitMerge, ArrowRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { getInitiativeRoles, isAuthorOrCoAuthor, type InitiativeRoles } from '../../services/initiativeRoles';
import ModificationSuggestions from './flows/modifications/ModificationSuggestions';
import MergeProposalsList from './flows/merge/MergeProposalsList';
import AppHeader from '../AppHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import { Button, SegmentedControl } from '../shared';
import { useT } from '../../i18n';
import cs from '../../pages/Container.module.scss';
import styles from './CollaborationFullView.module.scss';

interface CollaborationFullViewProps {
  title: string;
  collaborationId: string;
  communityId: string;
}

type Tab = 'suggestions' | 'merges';

const CollaborationFullView: React.FC<CollaborationFullViewProps> = ({
  title, collaborationId, communityId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);
  const collaborations = useAppSelector((s) => s.communities.communityCollaborations[communityId]);
  const collaborationsLoading = useAppSelector((s) => s.communities.collaborationsLoading[communityId]);

  const initialTab = ((location.state as { tab?: Tab })?.tab) || 'suggestions';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  const [mergeCount, setMergeCount] = useState<number>(0);

  useEffect(() => {
    if (!serverUrl || !publicKey || collaborations || collaborationsLoading) return;
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, collaborations, collaborationsLoading, dispatch, communityId]);

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, collaborationId).then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, collaborationId]);

  const canDecide = roles ? isAuthorOrCoAuthor(roles, publicKey) : false;
  const originalAuthor = roles?.author;
  const coAuthors = roles?.coAuthors ?? [];

  const isMerged = roles?.status === 'merged_into';
  const mergedInto = roles?.mergedInto;

  const handleSuggestionAccepted = () => {
    if (!serverUrl || !publicKey) return;
    getInitiativeRoles(serverUrl, publicKey, collaborationId).then(setRoles);
  };

  const initiativeHostServer = useMemo(() => location.pathname.split('/')[2] ?? '', [location.pathname]);
  const initiativeHostAgent = useMemo(() => location.pathname.split('/')[3] ?? '', [location.pathname]);

  if (isMerged && mergedInto) {
    return (
      <div className={cs.container}>
        <AppHeader showBack onBack={() => navigate(-1)} title={communityName} eyebrow={t('header.section.collaboration', 'Collaboration')} />
        <main id="main" tabIndex={-1} className={cs.content}>
          <div className={cs.main}>
            <div className={styles.mergedBanner}>
              <strong className={styles.mergedTitle}>
                {t('collab.mergedTitle', 'This initiative merged into another one.')}
              </strong>
              <p className={styles.mergedBody}>
                {t('collab.mergedBody', 'Continue the conversation on the surviving initiative.')}
              </p>
              <Button
                variant="primary"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate(`/initiative/${encodeURIComponent(initiativeHostServer)}/${encodeURIComponent(initiativeHostAgent)}/${communityId}/${mergedInto}`)}
              >
                {t('collab.mergedCta', 'Go to merged initiative')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cs.container}>
      <AppHeader showBack onBack={() => navigate(-1)} title={communityName} eyebrow={t('header.section.collaboration', 'Collaboration')} />
      <main id="main" tabIndex={-1} className={cs.content}>
        <div className={cs.main}>
          <SegmentedControl<Tab>
            className={styles.viewToggle}
            ariaLabel={t('collab.viewToggle', 'Collaboration view')}
            fullWidth
            value={tab}
            onChange={setTab}
            options={[
              {
                value: 'suggestions',
                label: t('collab.tabSuggestions', 'Edit Suggestions'),
                icon: <FilePen size={16} />,
              },
              {
                value: 'merges',
                label: t('collab.tabMerges', 'Merge Proposals · {n}', { n: mergeCount }),
                icon: <GitMerge size={16} />,
              },
            ]}
          />

          {tab === 'suggestions' && (
            <ErrorBoundary fallbackMessage="Edit suggestions encountered an error.">
              <ModificationSuggestions
                instanceId={`${collaborationId}_discussion_mods`}
                parentContractId={collaborationId}
                stageKey="discussionModsContractId"
                originalAuthor={originalAuthor}
                coAuthors={coAuthors}
                fieldLabel="initiative"
                targetInitiativeId={collaborationId}
                onAccept={handleSuggestionAccepted}
              />
            </ErrorBoundary>
          )}

          {tab === 'merges' && (
            <ErrorBoundary fallbackMessage="Merge proposals encountered an error.">
              <MergeProposalsList
                targetInitiativeId={collaborationId}
                targetTitle={title}
                targetCommunityId={communityId}
                canDecide={canDecide}
                onCountChange={setMergeCount}
              />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollaborationFullView;
