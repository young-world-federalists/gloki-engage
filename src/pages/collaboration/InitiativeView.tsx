import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import InitiativeDashboard from '../../components/collaboration/InitiativeDashboard';
import DiscussionStageView from '../../components/collaboration/DiscussionStageView';
import CollaborationFullView from '../../components/collaboration/CollaborationFullView';
import { useAppSelector } from '../../store/hooks';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import type { InitiativeData } from '../../types/initiative';

const InitiativeView: React.FC = () => {
  const { communityId, initiativeId } = useParams<{
    initiativeHostServer: string;
    initiativeHostAgent: string;
    communityId: string;
    initiativeId: string;
  }>();
  const location = useLocation();
  const initiative = (location.state as { initiative?: InitiativeData })?.initiative;
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [title, setTitle] = useState(initiative?.title ?? 'Initiative');

  useEffect(() => {
    if (initiative?.title || !serverUrl || !publicKey || !initiativeId) return;
    contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((details: Record<string, unknown>) => {
        if (details?.title) setTitle(details.title as string);
      })
      .catch(() => {});
  }, [initiative?.title, serverUrl, publicKey, initiativeId]);

  // Check if we're on a sub-route
  const isDiscussion = location.pathname.endsWith('/discussion');
  const isCollaboration = location.pathname.endsWith('/collaboration');

  if (isDiscussion) {
    return (
      <DiscussionStageView
        title={title}
        communityId={communityId!}
      />
    );
  }

  if (isCollaboration) {
    return (
      <CollaborationFullView
        title={title}
        collaborationId={initiativeId!}
        communityId={communityId!}
      />
    );
  }

  return (
    <InitiativeDashboard
      title={title}
      collaborationId={initiativeId!}
      communityId={communityId!}
    />
  );
};

export default InitiativeView;
