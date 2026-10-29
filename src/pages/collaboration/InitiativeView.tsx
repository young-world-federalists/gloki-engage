import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import DiscussionStageView from '../../components/collaboration/DiscussionStageView';
import CollaborationFullView from '../../components/collaboration/CollaborationFullView';
import SuggestionDmView from '../../components/collaboration/SuggestionDmView';
import { useAppSelector } from '../../store/hooks';
import { contractRead } from '../../services/api';
import { registerInitiativeHost } from '../../services/contracts/glokiEngageInitiative';
import type { IMethod } from '../../services/interfaces';
import type { InitiativeData } from '../../types/initiative';
import { TwoStatePage, DemoOnlyPage } from '../../components/shared';
import { useInitiativeFound } from '../../hooks/useInitiativeFound';
import NotFound from '../NotFound';

/** Renders the page only once the initiative is found in the page's data layer. */
const IfInitiativeFound: React.FC<{ initiativeId: string; children: React.ReactNode }> = ({ initiativeId, children }) => {
  const found = useInitiativeFound(initiativeId);
  if (found === 'missing') return <NotFound />;
  if (found === 'loading') return null;
  return <>{children}</>;
};

const InitiativeView: React.FC = () => {
  const { communityId, initiativeId, initiativeHostServer, initiativeHostAgent } = useParams<{
    initiativeHostServer: string;
    initiativeHostAgent: string;
    communityId: string;
    initiativeId: string;
  }>();
  // Before any child reads the initiative: route every call to it through its
  // creator's node and agent (members don't join it). Idempotent, so safe in render.
  if (initiativeId && initiativeHostServer && initiativeHostAgent) {
    registerInitiativeHost(initiativeId, initiativeHostServer, initiativeHostAgent);
  }
  const location = useLocation();
  const initiative = (location.state as { initiative?: InitiativeData })?.initiative;
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [title, setTitle] = useState(initiative?.title ?? 'Initiative');
  const [description, setDescription] = useState(initiative?.description ?? '');

  useEffect(() => {
    if (initiative?.title || !serverUrl || !publicKey || !initiativeId) return;
    contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((details: Record<string, unknown>) => {
        if (details?.title) setTitle(details.title as string);
        if (typeof details?.description === 'string') setDescription(details.description);
      })
      .catch(() => {});
  }, [initiative?.title, serverUrl, publicKey, initiativeId]);

  // Check if we're on a sub-route
  const isDiscussion = location.pathname.endsWith('/discussion');
  const isSuggest = location.pathname.endsWith('/suggest');
  const isCollaboration = location.pathname.endsWith('/collaboration');

  // Two states per URL (docs/DEMO_MODE.md): the discussion has both; suggest
  // and collaboration exist only as demos so far.
  if (isSuggest) {
    return (
      <DemoOnlyPage>
        <SuggestionDmView communityId={communityId!} initiativeId={initiativeId!} />
      </DemoOnlyPage>
    );
  }

  if (isDiscussion) {
    return (
      <TwoStatePage>
        <IfInitiativeFound initiativeId={initiativeId!}>
          <DiscussionStageView
            title={title}
            description={description}
            communityId={communityId!}
            initiativeId={initiativeId!}
          />
        </IfInitiativeFound>
      </TwoStatePage>
    );
  }

  if (isCollaboration) {
    return (
      <DemoOnlyPage>
        <CollaborationFullView
          title={title}
          collaborationId={initiativeId!}
          communityId={communityId!}
        />
      </DemoOnlyPage>
    );
  }

  // Default / roadmap route → community page with card auto-expanded
  return (
    <Navigate
      to={`/community/${communityId}?initiative=${initiativeId}`}
      replace
    />
  );
};

export default InitiativeView;
