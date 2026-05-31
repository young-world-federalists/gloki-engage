import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCollaborations } from '../../store/slices/communitiesSlice';
import { contractRead } from '../../services/api';
import type { IMethod } from '../../services/interfaces';
import type { Collaboration } from '../../services/contracts/community';
import { VFTC_COMMUNITY } from '../../services/demo/fixtures/community';
import { useT } from '../../i18n';
import { Card, Badge } from '../shared';
import type { BadgeTone } from '../shared';
import { ParticipationSummary } from '../shared/presence';
import MissionBanner from './MissionBanner';
import styles from './CommunityHome.module.scss';

interface StageMeta {
  tone: BadgeTone;
  icon: React.ComponentType<{ size?: number }>;
  labelKey: string;
  labelDefault: string;
}

const STAGE_META: Record<string, StageMeta> = {
  problem:    { tone: 'error',   icon: AlertCircle,   labelKey: 'stage.problem',    labelDefault: 'Problem' },
  discussion: { tone: 'warning', icon: MessageCircle, labelKey: 'stage.discussion', labelDefault: 'Discussion' },
  proposals:  { tone: 'info',    icon: Lightbulb,     labelKey: 'stage.proposals',  labelDefault: 'Proposals' },
  vote:       { tone: 'primary', icon: Vote,          labelKey: 'stage.vote',       labelDefault: 'Vote' },
  mandate:    { tone: 'success', icon: ScrollText,    labelKey: 'stage.mandate',    labelDefault: 'Mandate' },
};

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

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CommunityHomeProps {
  communityId: string;
}

const CommunityHome: React.FC<CommunityHomeProps> = ({ communityId }) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityCollaborations, communityMembers, communityProperties, profiles } = useAppSelector(
    (s) => s.communities,
  );
  const [stages, setStages] = useState<Record<string, string>>({});

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
  const isFlagship = props.name === VFTC_COMMUNITY.name;
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
    if (list.length === 0 && isFlagship) {
      const per = Math.max(1, Math.round(memberCount / VFTC_COMMUNITY.countries.length) || 1);
      list = VFTC_COMMUNITY.countries.map((code) => ({ code, participants: per }));
    }
    return list;
  }, [members, profiles, isFlagship, memberCount]);

  const handleCardClick = (item: Collaboration) => {
    const hostServer = item.hostServer || serverUrl || 'local';
    const hostAgent = item.hostAgent || publicKey || 'local';
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${item.id}/roadmap`,
    );
  };

  const usingSampleData = initiatives.length === 0;

  return (
    <div className={styles.home}>
      <MissionBanner
        name={props.name || t('community.fallbackName', 'Community')}
        description={props.description}
        mission={isFlagship ? VFTC_COMMUNITY.mission : undefined}
        journey={isFlagship ? VFTC_COMMUNITY.journey : undefined}
      />

      {participation.length > 0 && <ParticipationSummary participation={participation} />}

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <h3 className={styles.feedTitle}>{t('community.activityTitle', 'Community Activity')}</h3>
          <p className={styles.feedDescription}>
            {t(
              'community.activityDesc',
              'Recent initiatives and updates. Tap an initiative to see its progress through the governance pipeline.',
            )}
          </p>
        </div>

        {initiatives.map((item) => {
          const stage = stages[item.id] || 'problem';
          const meta = STAGE_META[stage] || STAGE_META.problem;
          const Icon = meta.icon;
          const authorProfile = item.author ? profiles[item.author] : undefined;
          const authorName = authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`.trim()
            : item.author
              ? item.author.slice(0, 8) + '…'
              : '';

          return (
            <Card
              key={item.id}
              as="article"
              interactive
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(item);
                }
              }}
            >
              <div className={styles.cardHeader}>
                <Badge tone={meta.tone}>
                  <span className={styles.badgeInner}>
                    <Icon size={12} />
                    {t(meta.labelKey, meta.labelDefault)}
                  </span>
                </Badge>
                {item.createdAt > 0 && <span className={styles.time}>{formatTimeAgo(item.createdAt)}</span>}
              </div>
              <h4 className={styles.cardTitle}>{item.title || t('community.untitled', 'Untitled Initiative')}</h4>
              {item.description && <p className={styles.cardDesc}>{item.description}</p>}
              {authorName && <span className={styles.author}>{authorName}</span>}
            </Card>
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
                    <span className={styles.time}>{formatTimeAgo(sample.createdAt)}</span>
                  </div>
                  <h4 className={styles.cardTitle}>{sample.title}</h4>
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
