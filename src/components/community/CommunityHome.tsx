import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useUrlExpandedSet } from '../../hooks/useUrlExpandedSet';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations, fetchInitiativeStage } from '../../store/slices/communitiesSlice';
import { useContractSyncMany } from '../collaboration/flows/shared/useContractSync';
import { DEMO_COMMUNITIES } from '../../services/demo/fixtures/community';
import { displayNameFor } from '../../utils/displayName';
import { useT } from '../../i18n';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { Card, Badge, Banner, EmptyState } from '../shared';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import CommunityCard from './CommunityCard';
import { STAGE_META } from './stageMeta';
import ActivityCard from './ActivityCard';
import styles from './CommunityHome.module.scss';

interface SampleItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  authorName: string;
  createdAt: number;
}

const SAMPLE_FEED: SampleItem[] = [
  { id: 's1', title: 'Access to Clean Drinking Water', description: 'Over 2 billion people lack safe drinking water globally.', stage: 'problem', authorName: 'Maria S.', createdAt: Date.now() - 3600000 },
  { id: 's2', title: 'Ocean Plastic Pollution', description: '8 million tons of plastic enter our oceans annually.', stage: 'problem', authorName: 'Lin W.', createdAt: Date.now() - 7200000 },
  { id: 's3', title: 'Antibiotic Resistance', description: 'Drug-resistant infections threaten global health security.', stage: 'proposals', authorName: 'Dr. Chen L.', createdAt: Date.now() - 86400000 },
  { id: 's4', title: 'Digital Privacy Standards', description: 'Personal data harvested at unprecedented scale.', stage: 'vote', authorName: 'Sam R.', createdAt: Date.now() - 172800000 },
  { id: 's5', title: 'Universal Climate Fund', description: 'Decentralized climate adaptation resources for communities.', stage: 'mandate', authorName: 'Elena V.', createdAt: Date.now() - 259200000 },
];

interface CommunityHomeProps {
  communityId: string;
  onOpenMenu: () => void;
  isDemo?: boolean;
}

const CommunityHome: React.FC<CommunityHomeProps> = ({ communityId, onOpenMenu, isDemo }) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const {
    communityCollaborations,
    collaborationsLoading,
    communityMembers,
    communityProperties,
    profiles,
    initiativeStages,
  } = useAppSelector((s) => s.communities);
  const trust = useCommunityTrust(communityId);
  const deepLinked = searchParams.get('initiative');
  // Expansion lives in the URL (S23) so it survives the discussion round-trip;
  // the `?initiative=` deep link seeds it below (idempotent add — StrictMode-safe).
  const { expandedIds, toggleExpanded, expand } = useUrlExpandedSet();
  useEffect(() => {
    if (deepLinked) expand(deepLinked);
  }, [deepLinked, expand]);
  const deepCardRef = useRef<HTMLDivElement | null>(null);
  const didFocusDeepLink = useRef(false);

  // One-shot "initiative created" confirmation (S18 W1, m3): the new card only
  // appears after its contract deploy resolves, which otherwise reads as silence.
  const location = useLocation();
  const [showCreated, setShowCreated] = useState(
    () => !!(location.state as { initiativeCreated?: boolean } | null)?.initiativeCreated,
  );
  useEffect(() => {
    if (showCreated) window.history.replaceState({}, ''); // don't re-show on refresh
  }, [showCreated]);

  // Fetch collaborations if not already loaded. For a real gloki-engage
  // community, fetchCollaborations itself reads the community's own
  // get_initiatives refs and each one's details/roles (in parallel, since
  // they may live on different members' servers) and maps them into this
  // same Collaboration shape — so this one effect covers both cases.
  useEffect(() => {
    if (!serverUrl || !publicKey || communityCollaborations[communityId]) return;
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, communityCollaborations, dispatch]);

  const initiatives = useMemo(() => {
    const collabs = communityCollaborations[communityId] ?? [];
    return collabs
      .filter((c) => c.type === 'initiative')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityCollaborations, communityId]);

  // Open the tapped card *in focus*: when arriving via `?initiative=`, scroll the
  // matching (already-expanded) card into view and move keyboard focus to its
  // control — so a tapped Home/feed card lands on that item, not the feed top.
  useEffect(() => {
    if (!deepLinked || didFocusDeepLink.current) return;
    const el = deepCardRef.current;
    if (!el) return;
    didFocusDeepLink.current = true;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // Focus the stable wrapper (tabIndex -1), not an inner control: the card
    // remounts when its stage resolves async (get_stage), which would drop focus
    // off an inner button. The wrapper survives that swap.
    el.focus({ preventScroll: true });
  }, [deepLinked, initiatives]);

  // Fetch each initiative's current stage into Redux (not local state): the
  // same initiativeStages slot is written by StageAdvanceBar on a successful
  // advance (set_stage), so keeping the read here on Redux too means an
  // advance updates every card showing this initiative immediately, instead
  // of leaving a locally-cached stage stuck at its pre-advance value.
  useEffect(() => {
    if (!serverUrl || !publicKey || initiatives.length === 0) return;
    initiatives.forEach((item) => {
      if (initiativeStages[item.id]) return;
      dispatch(fetchInitiativeStage({ serverUrl, publicKey, initiativeId: item.id }));
    });
  }, [serverUrl, publicKey, initiatives, initiativeStages, dispatch]);

  // Re-read an initiative's stage whenever ANY write lands on it — including
  // a stage advance from someone else's client, which nothing else here would
  // otherwise ever notice (StageAdvanceBar only updates Redux for its OWN
  // advance). Never a direct refetch after our own action — purely reacting
  // to the contract_write SSE event, same principle as useContractSync.
  const initiativeIds = useMemo(() => initiatives.map((item) => item.id), [initiatives]);
  useContractSyncMany(initiativeIds, (changedId) => {
    if (serverUrl && publicKey) {
      dispatch(fetchInitiativeStage({ serverUrl, publicKey, initiativeId: changedId }));
    }
  });

  const props = communityProperties[communityId] || {};
  const fixture = DEMO_COMMUNITIES.find((c) => c.name === props.name);
  const members: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const memberCount = members.length;

  // Presence: tally member countries from profiles; fall back to fixture
  // countries (flagship only) so the demo always shows the strip.
  const participation = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pk of members) {
      const c = profiles[pk]?.country;
      if (c) counts[c] = (counts[c] ?? 0) + 1;
    }
    let list = Object.entries(counts).map(([code, participants]) => ({ code, participants }));
    if (list.length === 0 && fixture) {
      const per = Math.max(1, Math.round(memberCount / fixture.countries.length) || 1);
      list = fixture.countries.map((code) => ({ code, participants: per }));
    }
    return list;
  }, [members, profiles, fixture, memberCount]);

  // "Loading" covers both the active fetch and the not-yet-dispatched initial
  // moment (communityCollaborations[communityId] is undefined until the fetch
  // above resolves at least once) — without the latter, usingSampleData below
  // would read as "confirmed empty" for one render and flash the mockup feed.
  const isLoadingInitiatives =
    collaborationsLoading[communityId] || communityCollaborations[communityId] === undefined;
  // The sample feed is onboarding decoration for the seeded demo communities
  // only — a real community with zero initiatives gets a genuine empty state
  // below, not fake example cards implying activity that doesn't exist.
  const usingSampleData = !isLoadingInitiatives && isDemo && initiatives.length === 0;
  const showEmptyState = !isLoadingInitiatives && !isDemo && initiatives.length === 0;

  return (
    <div className={styles.home}>
      <CommunityCard
        name={props.name || t('community.fallbackName', 'Community')}
        description={props.description}
        mission={fixture?.mission}
        memberCount={memberCount}
        participation={participation}
        isDemo={isDemo}
        onStartInitiative={() => navigate(`/community/${communityId}/create-initiative`)}
        onOpenMenu={onOpenMenu}
      />

      <div className={styles.feed}>
        {showCreated && (
          <Banner
            tone="success"
            onDismiss={() => setShowCreated(false)}
            dismissLabel={t('common.dismiss', 'Dismiss')}
          >
            {t(
              'initiative.createdConfirmation',
              'Your initiative was created — it appears at the top of the feed as soon as it’s ready.',
            )}
          </Banner>
        )}
        <div className={styles.feedHeader}>
          <h2 className={styles.feedTitle}>{t('community.activityTitle', 'Community Activity')}</h2>
          <p className={styles.feedDescription}>
            {t(
              'community.activityDesc',
              'Recent initiatives and updates. Tap an initiative to see its progress through the governance pipeline.',
            )}
          </p>
        </div>

        {isLoadingInitiatives ? (
          <div className={styles.feedLoading}>
            <div className="loading-spinner-small" />
            <p>{t('community.activityLoading', 'Loading activity…')}</p>
          </div>
        ) : (
          <>
            {initiatives.map((item) => {
              const stage = initiativeStages[item.id] || 'problem';
              const authorProfile = item.author ? profiles[item.author] : undefined;
              const authorName = item.author ? displayNameFor(authorProfile, item.author) : '';
              const hostServer = item.hostServer || serverUrl || 'local';
              const hostAgent = item.hostAgent || publicKey || 'local';

              return (
                <div
                  key={item.id}
                  ref={item.id === deepLinked ? deepCardRef : undefined}
                  tabIndex={item.id === deepLinked ? -1 : undefined}
                  className={styles.cardWrap}
                >
                  <ActivityCard
                    item={item}
                    communityId={communityId}
                    stage={stage}
                    authorName={authorName}
                    authorKey={item.author}
                    trustState={trust.trustOf(item.author || '')}
                    vouchCount={trust.vouchCountOf(item.author || '')}
                    hostServer={hostServer}
                    hostAgent={hostAgent}
                    expanded={expandedIds.has(item.id)}
                    onToggle={() => toggleExpanded(item.id)}
                  />
                </div>
              );
            })}

            {showEmptyState && (
              <EmptyState
                icon={<Megaphone size={32} aria-hidden />}
                title={t('community.noInitiatives.title', 'No initiatives yet')}
                message={t(
                  'community.noInitiatives.body',
                  'Be the first to start one and bring your community together around it.',
                )}
              />
            )}

            {usingSampleData && (
              <>
                <div className={styles.sampleBanner}>
                  {t('community.sampleBanner', 'Example initiatives — start an initiative to participate')}
                </div>
                {SAMPLE_FEED.map((sample) => {
                  const meta = STAGE_META[sample.stage] || STAGE_META.problem;
                  const Icon = meta.icon;
                  return (
                    <Card key={sample.id} as="article" className={`${styles.card} ${styles.sampleCard}`}>
                      <div className={styles.cardHeader}>
                        <Badge tone={meta.tone}>
                          <span className={styles.badgeInner}>
                            <Icon size={12} />
                            {t(meta.labelKey, meta.labelDefault)}
                          </span>
                        </Badge>
                        <span className={styles.time}>{formatTimeAgo(t, sample.createdAt)}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{sample.title}</h3>
                      <p className={styles.cardDesc}>{sample.description}</p>
                      <span className={styles.author}>{sample.authorName}</span>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityHome;
