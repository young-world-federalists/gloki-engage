import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations, fetchCommunityProperties } from '../../store/slices/communitiesSlice';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import type { Collaboration } from '../../services/contracts/community';
import styles from './InitiativeFeed.module.scss';

interface InitiativeWithCommunity extends Collaboration {
  communityId: string;
  communityName: string;
}

const InitiativeFeed: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { contracts, serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityCollaborations, communityProperties } = useAppSelector((s) => s.communities);
  const { hidden } = useAppSelector((s) => s.preferences);

  const communityContracts = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py' && !hidden.includes(c.id)),
    [contracts, hidden],
  );

  // Fetch collaborations and properties for all visible communities
  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    communityContracts.forEach((c) => {
      if (!communityCollaborations[c.id]) {
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: c.id }));
      }
      if (!communityProperties[c.id]) {
        dispatch(fetchCommunityProperties({ serverUrl, publicKey, contractId: c.id }));
      }
    });
  }, [serverUrl, publicKey, communityContracts, communityCollaborations, communityProperties, dispatch]);

  const allInitiatives: InitiativeWithCommunity[] = useMemo(() => {
    const result: InitiativeWithCommunity[] = [];
    for (const c of communityContracts) {
      const collabs = communityCollaborations[c.id] ?? [];
      const name = communityProperties[c.id]?.name || c.name || c.id.slice(0, 8);
      for (const collab of collabs) {
        if (collab.type === 'initiative') {
          result.push({ ...collab, communityId: c.id, communityName: name });
        }
      }
    }
    return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityContracts, communityCollaborations, communityProperties]);

  const STAGE_LABELS: Record<string, string> = {
    problem: 'Identifying Problem',
    discussion: 'Community Discussion',
    proposals: 'Proposing Solutions',
    vote: 'Voting',
    mandate: 'Mandate',
  };

  const [stages, setStages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!serverUrl || !publicKey || allInitiatives.length === 0) return;
    allInitiatives.forEach((item) => {
      if (stages[item.id]) return;
      contractRead({
        serverUrl,
        publicKey,
        contractId: item.id,
        method: { name: 'get_stage', values: {} } as IMethod,
      })
        .then((result: unknown) => {
          if (typeof result === 'string') {
            setStages((prev) => ({ ...prev, [item.id]: result }));
          }
        })
        .catch(() => {});
    });
  }, [serverUrl, publicKey, allInitiatives]);

  const handleClick = (item: InitiativeWithCommunity) => {
    // The initiative roadmap lives inline on the community page now — link straight
    // there (auto-expands the card) instead of via the /…/roadmap redirect hop.
    navigate(`/community/${item.communityId}?initiative=${item.id}`);
  };

  if (!serverUrl || !publicKey) {
    return <div className={styles.empty}>Log in to see initiatives</div>;
  }

  return (
    <div className={styles.feed}>
      {allInitiatives.length === 0 ? (
        <div className={styles.empty}>
          <Zap size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Welcome to Gloki</h3>
          <p className={styles.emptySubtitle}>Global direct democracy starts here</p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <span>Open the <strong>Menu</strong> and tap <strong>Communities</strong></span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span>Join or create a community</span>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span>Start an initiative from the community&#39;s Initiative tab</span>
            </div>
          </div>
        </div>
      ) : (
        allInitiatives.map((item) => (
          <button key={item.id} className={styles.card} onClick={() => handleClick(item)}>
            <div className={styles.cardHeader}>
              <Zap size={16} className={styles.cardIcon} />
              <span className={styles.communityName}>{item.communityName}</span>
              {stages[item.id] && (
                <span className={styles.stageBadge}>
                  {STAGE_LABELS[stages[item.id]] || stages[item.id]}
                </span>
              )}
            </div>
            <div className={styles.cardTitle}>{item.title || 'Untitled Initiative'}</div>
          </button>
        ))
      )}
    </div>
  );
};

export default InitiativeFeed;
