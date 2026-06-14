import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, EyeOff, Eye, ArrowLeft, Users, ScrollText, PlusCircle, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchContracts } from '../../store/slices/userSlice';
import { fetchCommunityProperties, fetchCommunityMembers, fetchCollaborations, fetchInitiativeStage } from '../../store/slices/communitiesSlice';
import { toggleStar, toggleHide, unhide } from '../../store/slices/preferencesSlice';
import { useEventStream } from '../../hooks/useEventStream';
import { useI18n } from '../../i18n';
import styles from './Communities.module.scss';

interface CommunitiesProps {
  showHidden?: boolean;
}

const formatCreatedDate = (value: unknown, locale: string): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

const Communities: React.FC<CommunitiesProps> = ({ showHidden = false }) => {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const { contracts, loading } = useAppSelector((state) => state.user);
  const { starred, hidden } = useAppSelector((state) => state.preferences);
  const { communityProperties, communityMembers, communityCollaborations, initiativeStages } = useAppSelector(
    (state) => state.communities,
  );

  const communityContracts = useMemo(
    () => contracts.filter((contract) => contract.contract === 'community_contract.py'),
    [contracts],
  );

  const handleDeployContract = useCallback(() => {
    if (user.publicKey && user.serverUrl) {
      dispatch(fetchContracts());
    }
  }, [user.publicKey, user.serverUrl, dispatch]);

  useEventStream('deploy_contract', handleDeployContract);

  // Fetch properties, members, and collaborations for each community.
  // dispatchedRef prevents duplicate in-flight dispatches: when one fetch's
  // .fulfilled re-runs this effect, sibling fetches may still be pending (data
  // still undefined), so a data-only guard would redispatch them. The ref tracks
  // "already kicked off fetches for this community" regardless of which ones
  // have settled.
  const dispatchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user.serverUrl || !user.publicKey) return;
    communityContracts.forEach((c) => {
      if (dispatchedRef.current.has(c.id)) return;
      const needsProps = !communityProperties[c.id];
      const needsMembers = !communityMembers[c.id];
      const needsCollabs = !communityCollaborations[c.id];
      if (!needsProps && !needsMembers && !needsCollabs) return;
      dispatchedRef.current.add(c.id);
      if (needsProps) {
        dispatch(fetchCommunityProperties({ serverUrl: user.serverUrl!, publicKey: user.publicKey!, contractId: c.id }));
      }
      if (needsMembers) {
        dispatch(fetchCommunityMembers({ serverUrl: user.serverUrl!, publicKey: user.publicKey!, contractId: c.id }));
      }
      if (needsCollabs) {
        dispatch(fetchCollaborations({ serverUrl: user.serverUrl!, publicKey: user.publicKey!, contractId: c.id }));
      }
    });
  }, [
    user.serverUrl,
    user.publicKey,
    communityContracts,
    communityProperties,
    communityMembers,
    communityCollaborations,
    dispatch,
  ]);

  // Fetch stage for each initiative so mandate count can be stage-accurate.
  // `stageDispatchedRef` tracks initiatives we have already dispatched for
  // this session — without it, every fulfilled stage fetch would re-run the
  // effect (because `initiativeStages` is in deps) and redispatch reads for
  // every still-pending sibling, producing O(N^2) traffic on large communities.
  const stageDispatchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user.serverUrl || !user.publicKey) return;
    communityContracts.forEach((c) => {
      const collabs = communityCollaborations[c.id];
      if (!Array.isArray(collabs)) return;
      collabs.forEach((item) => {
        if (item.type !== 'initiative') return;
        if (initiativeStages[item.id] !== undefined) return;
        if (stageDispatchedRef.current.has(item.id)) return;
        stageDispatchedRef.current.add(item.id);
        dispatch(fetchInitiativeStage({ serverUrl: user.serverUrl!, publicKey: user.publicKey!, initiativeId: item.id }));
      });
    });
  }, [user.serverUrl, user.publicKey, communityContracts, communityCollaborations, initiativeStages, dispatch]);

  const handleCommunityClick = (contractId: string) => {
    navigate(`/community/${contractId}`);
  };

  const sortedContracts = useMemo(() => {
    const list = showHidden
      ? communityContracts.filter((c) => hidden.includes(c.id))
      : communityContracts.filter((c) => !hidden.includes(c.id));

    return list.sort((a, b) => {
      const aStarred = starred.includes(a.id);
      const bStarred = starred.includes(b.id);
      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [communityContracts, starred, hidden, showHidden]);

  const hiddenCount = communityContracts.filter((c) => hidden.includes(c.id)).length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p className={styles.text}>Loading communities...</p>
        </div>
      </div>
    );
  }

  if (showHidden) {
    return (
      <div className={styles.container}>
        <div className={styles.hiddenHeader}>
          <button className={styles.hiddenBackBtn} onClick={() => navigate('/identity/communities')}>
            <ArrowLeft size={18} />
          </button>
          <h2 className={styles.hiddenTitle}>Hidden Communities</h2>
        </div>
        {sortedContracts.length === 0 ? (
          <p className={styles.emptyNote}>No hidden communities.</p>
        ) : (
          <div className={styles.grid}>
            {sortedContracts.map((contract) => (
              <div key={contract.id} className={`${styles.card} ${styles.hiddenCard}`}>
                <span className={styles.cardName}>{contract.name || 'Community'}</span>
                <button
                  className={styles.unhideBtn}
                  onClick={() => dispatch(unhide(contract.id))}
                  title={`Show ${contract.name || 'Community'}`}
                  aria-label={`Show ${contract.name || 'Community'}`}
                >
                  <Eye size={18} strokeWidth={2.25} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Your Communities</h2>
        <p className={styles.pageDescription}>
          Communities you've joined on Gloki. Star your favourites to keep them at the top,
          or hide ones you don't need right now.
        </p>
      </div>

      <div className={styles.grid}>
        {sortedContracts.map((contract) => {
          const isStarred = starred.includes(contract.id);
          const props = communityProperties[contract.id] || {};
          const description = props.description || '';
          const memberCount = Array.isArray(communityMembers[contract.id]) ? communityMembers[contract.id].length : 0;
          const collaborations = communityCollaborations[contract.id] || [];
          // Separate truly-in-mandate from initiatives whose stage lookup
          // failed (`_unknown`, e.g. old contracts or transient errors).
          // Treating `_unknown` as "not mandate" silently undercounts — show
          // it as an explicit "unresolved" hint instead.
          const initiatives = collaborations.filter((c) => c.type === 'initiative');
          const mandateCount = initiatives.filter(
            (c) => initiativeStages[c.id] === 'mandate',
          ).length;
          const unresolvedCount = initiatives.filter(
            (c) => initiativeStages[c.id] === '_unknown',
          ).length;
          const createdDate = props.createdAt ? formatCreatedDate(props.createdAt, locale) : null;
          return (
            <div
              key={contract.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              aria-label={`Open ${contract.name || 'community'}`}
              onClick={() => handleCommunityClick(contract.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCommunityClick(contract.id);
                }
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardName}>{contract.name || 'Community'}</span>
                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`${styles.starBtn} ${isStarred ? styles.starBtnActive : ''}`}
                    onClick={() => dispatch(toggleStar(contract.id))}
                    title={isStarred ? 'Unstar' : 'Star'}
                    aria-label={isStarred ? 'Unstar community' : 'Star community'}
                  >
                    <Star size={18} strokeWidth={2.25} fill={isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className={styles.hideBtn}
                    onClick={() => dispatch(toggleHide(contract.id))}
                    title={`Hide ${contract.name || 'Community'}`}
                    aria-label={`Hide ${contract.name || 'Community'}`}
                  >
                    <EyeOff size={18} strokeWidth={2.25} />
                  </button>
                </div>
              </div>
              {description && <p className={styles.cardDescription}>{description}</p>}
              <div className={styles.cardMeta}>
                <span className={styles.metaItem}><Users size={12} /> {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                <span
                  className={styles.metaItem}
                  title={unresolvedCount > 0 ? `${unresolvedCount} initiative${unresolvedCount !== 1 ? 's' : ''} couldn't be resolved and aren't counted` : undefined}
                >
                  <ScrollText size={12} /> {mandateCount} mandate{mandateCount !== 1 ? 's' : ''}
                  {unresolvedCount > 0 && <span className={styles.metaItemHint}> · {unresolvedCount} unresolved</span>}
                </span>
                {createdDate && (
                  <span className={styles.metaItem}><Calendar size={12} /> {createdDate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create a community card */}
      <button
        className={styles.createCard}
        onClick={() => navigate('/create-community')}
      >
        <PlusCircle size={20} />
        <span>Create a community</span>
      </button>

      {sortedContracts.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <h3 className={styles.title}>No Communities Yet</h3>
          <p className={styles.description}>Create or join a community to get started</p>
        </div>
      )}

      {!showHidden && hiddenCount > 0 && (
        <button
          className={styles.hiddenToggle}
          onClick={() => navigate('/identity/hidden')}
        >
          {hiddenCount} hidden communit{hiddenCount === 1 ? 'y' : 'ies'}
        </button>
      )}
    </div>
  );
};

export default Communities;
