import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import { DEMO_COMMUNITIES } from '../../services/demo/fixtures/community';
import { useT } from '../../i18n';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { Card, Badge } from '../shared';
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
  { id: 's2', title: 'Ocean Plastic Pollution', description: '8 million tons of plastic enter our oceans annually.', stage: 'discussion', authorName: 'Lin W.', createdAt: Date.now() - 7200000 },
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
  const { communityCollaborations, communityMembers, communityProperties, profiles } = useAppSelector(
    (s) => s.communities,
  );
  const trust = useCommunityTrust(communityId);
  const [stages, setStages] = useState<Record<string, string>>({});
  const deepLinked = searchParams.get('initiative');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(deepLinked ? [deepLinked] : []),
  );
  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const deepCardRef = useRef<HTMLDivElement | null>(null);
  const didFocusDeepLink = useRef(false);

  // Fetch collaborations if not already loaded.
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

  // Fetch each initiative's current stage.
  useEffect(() => {
    if (!serverUrl || !publicKey || initiatives.length === 0) return;
    initiatives.forEach((item) => {
      if (stages[item.id]) return;
      contractRead({
        serverUrl,
        publicKey,
        contractId: item.id,
        method: { name: 'get_stage', values: {} } as IMethod,
      })
        .then((result: unknown) => {
          setStages((prev) => ({ ...prev, [item.id]: typeof result === 'string' ? result : 'problem' }));
        })
        .catch(() => {
          setStages((prev) => ({ ...prev, [item.id]: 'problem' }));
        });
    });
  }, [serverUrl, publicKey, initiatives]);

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

  const usingSampleData = initiatives.length === 0;

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
        <div className={styles.feedHeader}>
          <h2 className={styles.feedTitle}>{t('community.activityTitle', 'Community Activity')}</h2>
          <p className={styles.feedDescription}>
            {t(
              'community.activityDesc',
              'Recent initiatives and updates. Tap an initiative to see its progress through the governance pipeline.',
            )}
          </p>
        </div>

        {initiatives.map((item) => {
          const stage = stages[item.id] || 'problem';
          const authorProfile = item.author ? profiles[item.author] : undefined;
          const authorName = authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`.trim()
            : item.author
              ? item.author.slice(0, 8) + '…'
              : '';
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
      </div>
    </div>
  );
};

export default CommunityHome;
