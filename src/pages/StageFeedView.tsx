import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSelector } from '../store/hooks';
import { useAllInitiatives, type InitiativeWithMeta } from '../hooks/useAllInitiatives';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import type { PipelineStage } from '../types/initiative';
import PageHeader from '../components/PageHeader';
import HomepageMenu from '../components/identity/HomepageMenu';
import ProblemStage from '../components/stages/ProblemStage';
import DiscussionStage from '../components/stages/DiscussionStage';
import ProposalsStage from '../components/stages/ProposalsStage';
import VoteStage from '../components/stages/VoteStage';
import MandateStage from '../components/stages/MandateStage';
import styles from './StageFeedView.module.scss';
import cs from './Container.module.scss';

// Sample data for development — shown when no real initiatives exist at a stage.
// Exported so the cross-community Home (HomeView) reuses the same fallback set.
export const SAMPLE_INITIATIVES: Record<string, Array<{ id: string; title: string; description: string; communityName: string; authorName: string; stage: string; tally?: { up: number; down: number; total: number } }>> = {
  problem: [
    { id: 'sample-1', title: 'Access to Clean Drinking Water', description: 'Over 2 billion people worldwide lack access to safely managed drinking water. This affects health, education, and economic development across multiple countries.', communityName: 'Global Health Network', authorName: 'Maria S.', stage: 'problem', tally: { up: 42, down: 5, total: 47 } },
    { id: 'sample-2', title: 'Misinformation and Democratic Erosion', description: 'AI-generated misinformation is undermining democratic processes globally. Voters are being manipulated and public trust in institutions is declining.', communityName: 'Democracy Watch', authorName: 'James T.', stage: 'problem', tally: { up: 28, down: 12, total: 40 } },
    { id: 'sample-3', title: 'Youth Unemployment Crisis', description: 'Youth unemployment rates exceed 30% in many countries. Millions of young people face economic exclusion, leading to social instability and brain drain.', communityName: 'Future Economy Forum', authorName: 'Aisha K.', stage: 'problem', tally: { up: 35, down: 3, total: 38 } },
  ],
  discussion: [
    { id: 'sample-4', title: 'Ocean Plastic Pollution', description: 'Over 8 million tons of plastic enter the oceans each year. Marine ecosystems are collapsing and microplastics are entering the food chain.', communityName: 'Ocean Alliance', authorName: 'Lin W.', stage: 'discussion' },
    { id: 'sample-5', title: 'Global Teacher Shortage', description: 'UNESCO estimates a shortage of 69 million teachers by 2030. Rural and disadvantaged communities are disproportionately affected.', communityName: 'Education for All', authorName: 'Priya M.', stage: 'discussion' },
  ],
  proposals: [
    { id: 'sample-6', title: 'Antibiotic Resistance', description: 'Drug-resistant infections kill 1.27 million people annually. Without coordinated global action, routine surgeries and minor infections could become deadly again.', communityName: 'Global Health Network', authorName: 'Dr. Chen L.', stage: 'proposals' },
  ],
  vote: [
    { id: 'sample-7', title: 'Digital Privacy Standards', description: 'Personal data is harvested at an unprecedented scale with minimal regulation in most countries. A global framework for digital rights is urgently needed.', communityName: 'Digital Rights Coalition', authorName: 'Sam R.', stage: 'vote' },
  ],
  mandate: [
    { id: 'sample-8', title: 'Universal Climate Adaptation Fund', description: 'Communities worldwide voted to establish a decentralized climate adaptation fund. Local communities can apply directly for resilience infrastructure and disaster preparedness resources.', communityName: 'Climate Action Network', authorName: 'Elena V.', stage: 'mandate' },
  ],
};

const STAGE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number }>; description: string; emptyHint: string }> = {
  problem: {
    label: 'Problem',
    icon: AlertCircle,
    description: 'Problems being identified. Vote to advance them.',
    emptyHint: 'No problems at this stage yet. Start an initiative from a community to propose a global problem.',
  },
  discussion: {
    label: 'Discussion',
    icon: MessageCircle,
    description: 'Problems under community discussion.',
    emptyHint: 'No problems in discussion. Problems advance here after reaching 50% community approval.',
  },
  proposals: {
    label: 'Proposals',
    icon: Lightbulb,
    description: 'Problems ready for solution proposals.',
    emptyHint: 'No problems at the proposals stage. Problems advance here after community discussion.',
  },
  vote: {
    label: 'Vote',
    icon: Vote,
    description: 'Formal voting on proposed solutions.',
    emptyHint: 'No problems in formal voting. Problems advance here after proposals reach approval.',
  },
  mandate: {
    label: 'Mandate',
    icon: ScrollText,
    description: 'Completed mandates — democratic decisions made.',
    emptyHint: 'No mandates yet. Mandates are created when a problem completes the full governance pipeline.',
  },
};

const StageFeedView: React.FC = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityMembers, communityActiveMembers } = useAppSelector((s) => s.communities);

  const stage = (stageId || 'problem') as PipelineStage;
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.problem;

  // Cross-community aggregation + per-initiative stage resolution lives in one
  // shared hook (also powers the cross-community Home).
  const { initiatives, isLoading } = useAllInitiatives();

  // Filter initiatives to the current stage (excludes unresolved / _unknown).
  const stageInitiatives = useMemo(
    () => initiatives.filter((item) => item.stage === stage),
    [initiatives, stage],
  );

  const handleCardClick = (item: InitiativeWithMeta) => {
    const hostServer = item.hostServer || serverUrl || 'local';
    const hostAgent = item.hostAgent || publicKey || 'local';
    navigate(
      `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${item.communityId}/${item.id}/roadmap`,
    );
  };

  const handleCommunityClick = (e: React.MouseEvent, communityId: string) => {
    e.stopPropagation();
    navigate(`/community/${communityId}/initiative`);
  };

  // Show sample data when no real initiatives exist at this stage
  const usingSampleData = stageInitiatives.length === 0 && !isLoading;
  const sampleItems = SAMPLE_INITIATIVES[stage] || [];

  const StageIcon = config.icon;

  const handleMenuNavigate = (path: string) => {
    navigate(`/identity/${path}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={cs.container}>
      <PageHeader
        title="Gloki"
        layout="homepage"
        onMenuClick={() => setMenuOpen(true)}
        menuOpen={menuOpen}
      />

      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleMenuNavigate}
        onLogout={handleLogout}
      />

      <div className={styles.feedContainer}>
        {stage === 'problem' && (
          <div className={styles.thresholdBanner}>
            <AlertCircle size={16} />
            <span>25% of active community members must participate. 50% must approve a problem for it to advance to discussion.</span>
          </div>
        )}
        {stage === 'discussion' && (
          <div className={styles.thresholdBanner}>
            <MessageCircle size={16} />
            <span>33% of community members must contribute perspectives before a problem advances to proposals.</span>
          </div>
        )}
        {stage === 'proposals' && (
          <div className={styles.thresholdBanner}>
            <Lightbulb size={16} />
            <span>Submit solution proposals and approve the ones you support. Top proposals advance to the formal vote.</span>
          </div>
        )}
        {stage === 'vote' && (
          <div className={styles.thresholdBanner}>
            <Vote size={16} />
            <span>Distribute your voting credits across proposals. Requires membership in a web of trust community.</span>
          </div>
        )}
        {stage === 'mandate' && (
          <div className={styles.thresholdBanner}>
            <ScrollText size={16} />
            <span>Completed mandates representing the collective will of community members across borders.</span>
          </div>
        )}

        {isLoading && stageInitiatives.length === 0 && (
          <div className={styles.empty}>
            <StageIcon size={48} />
            <h3>Loading initiatives...</h3>
            <p>Fetching data from communities...</p>
          </div>
        )}

        {usingSampleData && (
          <div className={styles.sampleBanner}>Example initiatives — join or create a community to participate</div>
        )}

        {(stageInitiatives.length > 0 ? stageInitiatives : usingSampleData ? [] : []).map((item) => {
          const memberCount = Array.isArray(communityMembers[item.communityId])
            ? communityMembers[item.communityId].length
            : 0;
          const activeMemberCount = communityActiveMembers[item.communityId] ?? memberCount;

          return (
            <div key={item.id} className={`${styles.card} ${stage !== 'discussion' ? styles.noClick : ''}`} onClick={stage === 'discussion' ? () => handleCardClick(item) : undefined}>
              <div className={styles.cardMeta}>
                <button
                  className={styles.communityBadge}
                  onClick={(e) => handleCommunityClick(e, item.communityId)}
                >
                  {item.communityName}
                </button>
                {item.authorName && (
                  <span className={styles.author}>{item.authorName}</span>
                )}
                {item.createdAt && (
                  <span className={styles.time}>{formatTimeAgo(item.createdAt)}</span>
                )}
              </div>

              <h3 className={styles.cardTitle}>{item.title || 'Untitled Initiative'}</h3>
              {item.description && (
                <p className={styles.cardDescription}>{item.description}</p>
              )}

              {/* Stage-specific participation UI — lane-owned stage components */}
              {stage === 'problem' && (
                <div className={styles.inlineFlow}>
                  <ProblemStage initiativeId={item.id} communityMemberCount={activeMemberCount} />
                </div>
              )}

              {stage === 'discussion' && (
                <DiscussionStage
                  variant="feed"
                  initiativeId={item.id}
                  communityId={item.communityId}
                  title={item.title || ''}
                  hostServer=""
                  hostAgent=""
                />
              )}

              {stage === 'proposals' && (
                <div className={styles.inlineFlow}>
                  <ProposalsStage
                    variant="feed"
                    initiativeId={item.id}
                    communityId={item.communityId}
                    title={item.title || ''}
                    hostServer=""
                    hostAgent=""
                  />
                </div>
              )}

              {stage === 'vote' && (
                <div className={styles.inlineFlow}>
                  <VoteStage initiativeId={item.id} />
                </div>
              )}

              {stage === 'mandate' && (
                <div className={styles.inlineFlow}>
                  <MandateStage variant="feed" initiativeId={item.id} />
                </div>
              )}
            </div>
          );
        })}

        {/* Sample cards when no real data */}
        {usingSampleData && sampleItems.map((sample) => (
          <div
            key={sample.id}
            className={`${styles.card} ${styles.sampleCard} ${styles.noClick}`}
          >
            <div className={styles.cardMeta}>
              <span className={styles.communityBadge}>{sample.communityName}</span>
              <span className={styles.author}>{sample.authorName}</span>
            </div>

            <h3 className={styles.cardTitle}>{sample.title}</h3>
            <p className={styles.cardDescription}>{sample.description}</p>

            {stage === 'problem' && (
              <div className={styles.stageInfo}>
                <AlertCircle size={14} />
                <span>Join a community to vote on problems</span>
              </div>
            )}

            {stage === 'discussion' && (
              <div className={styles.stageInfo}>
                <MessageCircle size={14} />
                <span>Tap to join the discussion</span>
              </div>
            )}

            {stage === 'proposals' && (
              <div className={styles.stageInfo}>
                <Lightbulb size={14} />
                <span>Join a community to submit and approve proposals</span>
              </div>
            )}

            {stage === 'vote' && (
              <div className={styles.stageInfo}>
                <Vote size={14} />
                <span>Join a community to allocate voting credits</span>
              </div>
            )}

            {stage === 'mandate' && (
              <div className={styles.stageInfo}>
                <ScrollText size={14} />
                <span>Join a community to stake your conviction</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageFeedView;
