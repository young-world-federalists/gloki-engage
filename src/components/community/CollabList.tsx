import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, ChevronRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { addCollaboration, type Collaboration } from '../../services/contracts/community';
import CreateCollabDialog from './dialogs/CreateCollabDialog';
import type { CollabTemplate } from '../collaboration/collabTemplates';
import { useT } from '../../i18n';
import styles from './CollabList.module.scss';

interface CollabListProps {
  communityId: string;
}

const CollabList: React.FC<CollabListProps> = ({ communityId }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const t = useT();

  const { communityMembers, membersLoading, communityCollaborations } = useAppSelector(
    (state) => state.communities,
  );
  const { publicKey, serverUrl } = useAppSelector((state) => state.user);

  const [showDialog, setShowDialog] = useState(false);

  const allMembers: string[] = Array.isArray(communityMembers[communityId])
    ? communityMembers[communityId]
    : [];
  const isMember = publicKey && allMembers.includes(publicKey);

  const collabs: Collaboration[] = useMemo(() => {
    const items = communityCollaborations[communityId] ?? [];
    return items.filter((item) => item.type === 'collab');
  }, [communityCollaborations, communityId]);

  useEffect(() => {
    if (!communityId || !serverUrl || !publicKey) return;
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  }, [communityId, serverUrl, publicKey, dispatch]);

  const handleCreate = async (name: string, template: CollabTemplate) => {
    if (!serverUrl || !publicKey) throw new Error('Not logged in');

    const collabId = crypto.randomUUID();

    const existingTabs = JSON.parse(localStorage.getItem('collaborationTabs') || '{}');
    const tabs = template.flowIds.map((flowId) => ({
      id: crypto.randomUUID(),
      flowId,
      label: flowId,
      instanceId: crypto.randomUUID(),
    }));
    existingTabs[collabId] = tabs;
    localStorage.setItem('collaborationTabs', JSON.stringify(existingTabs));

    const newCollab: Collaboration = {
      id: collabId,
      type: 'collab',
      title: name,
      createdAt: Date.now(),
      activityCount: 0,
      hostServer: serverUrl,
      hostAgent: publicKey,
    };

    await addCollaboration(serverUrl, publicKey, communityId, newCollab);
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  };

  const handleClick = (item: Collaboration) => {
    navigate(`/community/${communityId}/collab/${item.id}`);
  };

  if (membersLoading[communityId] === true) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>{t('common.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{t('collab.listTitle', 'Collabs')}</h2>
          <p>{t('collab.notMember', 'You are not yet a member of this community.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}><Users2 size={20} /></div>
        <div>
          <h2>{t('collab.listTitle', 'Collabs')}</h2>
          <p>{t('collab.listSubtitle', 'Template-based workspaces for teamwork')}</p>
        </div>
      </div>

      {collabs.length === 0 ? (
        <p className={styles.empty}>{t('collab.empty', 'No collabs yet. Start one from a template.')}</p>
      ) : (
        <div className={styles.list}>
          {collabs.map((item) => (
            <button
              key={item.id}
              className={styles.item}
              onClick={() => handleClick(item)}
            >
              <span className={styles.itemTitle}>{item.title}</span>
              <ChevronRight size={16} className={styles.itemChevron} />
            </button>
          ))}
        </div>
      )}

      <button className={styles.createBtn} onClick={() => setShowDialog(true)}>
        {t('collab.start', 'Start Collab')}
      </button>

      <CreateCollabDialog
        isVisible={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default CollabList;
