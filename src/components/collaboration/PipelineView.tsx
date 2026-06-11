import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useT } from '../../i18n';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useSwipeRef } from '../../hooks/useSwipeNavigation';
import { contractRead, contractWrite } from '../../services/api';
import { resolveAndJoinInitiativeStageContract } from '../../services/contracts/initiative';
import { fetchCommunityMembers } from '../../store/slices/communitiesSlice';
import type { IMethod } from '../../services/interfaces';
import type { PipelineStage } from '../../types/initiative';
import ProblemVoteFlow from './flows/voting/ProblemVoteFlow';
import DiscussionFlow from './flows/discussion/DiscussionFlow';
import ApprovalFlow from './flows/voting/ApprovalFlow';
import QVFlow from './flows/voting/QVFlow';
import ModificationSuggestions from './flows/modifications/ModificationSuggestions';
import PageHeader from '../PageHeader';
import ErrorBoundary from '../shared/ErrorBoundary';
import AIToolbar from '../shared/AITools';
import cs from '../../pages/Container.module.scss';
import styles from './PipelineView.module.scss';

interface StageConfig {
  id: PipelineStage;
  label: string;
  hint: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'problem',
    label: 'Problem',
    hint: 'Does this problem affect people across multiple countries? Review the evidence, then vote. The community needs 50% upvotes to move forward.',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    hint: 'Share how this problem looks in your country. What context or nuances should the community consider? At least 33% of members need to contribute before moving on.',
  },
  {
    id: 'proposals',
    label: 'Proposals',
    hint: 'Suggest solutions backed by evidence. Review others\' proposals and approve the ones you support. The most-approved proposals advance to the final vote.',
  },
  {
    id: 'vote',
    label: 'Vote',
    hint: 'Distribute your voting credits across the proposals you support. Spreading your credits is strategic — concentrating them gives diminishing returns.',
  },
  {
    id: 'mandate',
    label: 'Mandate',
    hint: 'The community has reached a decision. This mandate represents your collective position. Pledge your support and commit to action.',
  },
];

interface PipelineViewProps {
  title: string;
  collaborationId: string;
  communityId: string;
}

const PipelineView: React.FC<PipelineViewProps> = ({ title, collaborationId, communityId }) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);

  const [stage, setStage] = useState<PipelineStage>('problem');
  const [viewStage, setViewStage] = useState<PipelineStage>('problem');
  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [advancing, setAdvancing] = useState(false);
  const [problemTally, setProblemTally] = useState<{ up: number; down: number; total: number }>({ up: 0, down: 0, total: 0 });
  const [confirmAdvance, setConfirmAdvance] = useState(false);

  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;

    contractRead({
      serverUrl,
      publicKey,
      contractId: collaborationId,
      method: { name: 'get_stage', values: {} } as IMethod,
    })
      .then((result: unknown) => {
        if (typeof result === 'string' && STAGES.some((s) => s.id === result)) {
          setStage(result as PipelineStage);
          setViewStage(result as PipelineStage);
        }
      })
      .catch(() => {});

    contractRead({
      serverUrl,
      publicKey,
      contractId: collaborationId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((result: Record<string, unknown>) => {
        if (result && typeof result === 'object') {
          setDetails(result);
        }
      })
      .catch(() => {});
  }, [serverUrl, publicKey, collaborationId]);

  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (communityMembers[communityId]) return;
    dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, communityMembers, dispatch]);

  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId || stage !== 'problem') return;
    const fetchProblemTally = async () => {
      try {
        const pvStageContract = await resolveAndJoinInitiativeStageContract(
          serverUrl,
          publicKey,
          collaborationId,
          'problemVoteContractId',
        );
        const pvContractId = pvStageContract?.contractId ?? null;
        if (!pvContractId) return;
        const tally = await contractRead({
          serverUrl, publicKey, contractId: pvContractId,
          method: { name: 'get_tally', values: {} } as IMethod,
        });
        if (tally && typeof tally === 'object') {
          setProblemTally(tally as { up: number; down: number; total: number });
        }
      } catch { /* non-blocking */ }
    };
    fetchProblemTally();
  }, [serverUrl, publicKey, collaborationId, stage]);

  const memberCount = Array.isArray(communityMembers[communityId])
    ? communityMembers[communityId].length
    : 0;

  const currentStageIndex = STAGES.findIndex((s) => s.id === stage);
  const viewStageIndex = STAGES.findIndex((s) => s.id === viewStage);
  const viewStageConfig = STAGES[viewStageIndex];
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;
  const isViewingCurrentStage = viewStage === stage;

  const pipelineSwipeRef = useSwipeRef<HTMLDivElement>({
    onSwipeLeft: () => {
      const nextIdx = viewStageIndex + 1;
      if (nextIdx < STAGES.length) setViewStage(STAGES[nextIdx].id);
    },
    onSwipeRight: () => {
      const prevIdx = viewStageIndex - 1;
      if (prevIdx >= 0) setViewStage(STAGES[prevIdx].id);
    },
  });

  const handleAdvance = async () => {
    if (!nextStage || !serverUrl || !publicKey || advancing) return;
    if (!stageReadiness.ready) return;
    if (!confirmAdvance) {
      setConfirmAdvance(true);
      return;
    }
    setAdvancing(true);
    setConfirmAdvance(false);
    try {
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: collaborationId,
        method: { name: 'set_stage', values: { stage: nextStage.id } } as IMethod,
      });
      setStage(nextStage.id);
      setViewStage(nextStage.id);
    } catch { /* silently fail */ }
    finally { setAdvancing(false); }
  };

  const getStageReadiness = (): { ready: boolean; reason: string } => {
    if (stage === 'problem' && memberCount > 0) {
      const threshold = Math.ceil(memberCount * 0.50);
      if (problemTally.up < threshold) {
        return {
          ready: false,
          reason: `${Math.max(threshold - problemTally.up, 0)} more upvote${threshold - problemTally.up !== 1 ? 's' : ''} needed to reach 50% threshold (${problemTally.up}/${threshold})`,
        };
      }
    }
    return { ready: true, reason: '' };
  };
  const stageReadiness = getStageReadiness();

  const flowInstanceId = `${collaborationId}_${viewStage}`;

  const evidenceLinks = Array.isArray(details.evidence)
    ? (details.evidence as string[])
    : [];
  const countries = Array.isArray(details.countries)
    ? (details.countries as string[])
    : [];
  const description = typeof details.description === 'string' ? details.description : '';

  return (
    <div className={cs.container}>
      <PageHeader
        showBackButton
        backButtonText="Back"
        onBackClick={() => navigate(-1)}
        title={title}
        subtitle={communityName}
        layout="two-row"
      />

      <div className={cs.content}>
        <div className={cs.main} ref={pipelineSwipeRef}>
          {/* Stage heading */}
          <div className={styles.stageHeading}>
            <h2>{viewStageConfig?.label}</h2>
            <span className={styles.stageStep}>Step {viewStageIndex + 1} of {STAGES.length}</span>
          </div>
          {viewStageConfig && (
            <div className={styles.stageHint}>
              {!isViewingCurrentStage && <span className={styles.previewBadge}>Preview</span>}
              {viewStageConfig.hint}
            </div>
          )}

          {/* AI tools: translate description, summarize discussion */}
          {description && (
            <AIToolbar
              text={description}
              discussionContent={viewStage === 'discussion' ? { title, description, comments: [] } : undefined}
            />
          )}

          {/* ── Step 1: Problem ── */}
          {viewStage === 'problem' && (
            <ErrorBoundary fallbackMessage="The voting section encountered an error.">
              <ProblemVoteFlow
                instanceId={`${collaborationId}_problem_vote`}
                description={description}
                evidenceLinks={evidenceLinks}
                countries={countries}
                communityMemberCount={memberCount}
                parentContractId={collaborationId}
                stageKey="problemVoteContractId"
              />
            </ErrorBoundary>
          )}

          {/* ── Step 2: Discussion ── */}
          {viewStage === 'discussion' && (
            <ErrorBoundary fallbackMessage="The discussion section encountered an error.">
              <div className={styles.flowContainer}>
                <div className={styles.discussionContext}>
                  <p>{t('pipeline.discussion.intro', 'Add nuances and perspectives to this problem. What does it look like in your country? How does it affect your community?')}</p>
                  {/* Lead/body split around <strong> (no <Trans> mechanism) */}
                  <p className={styles.discussionMetric}>
                    <strong>{t('pipeline.discussion.quorumCount', '{n} members', { n: Math.ceil(memberCount * 0.33) })}</strong>{' '}
                    {t('pipeline.discussion.quorumRest', '(33% of community) must contribute for this stage to advance.')}
                  </p>
                </div>
                <DiscussionFlow
                  instanceId={flowInstanceId}
                  collaborationId={collaborationId}
                  collaborationType="initiative"
                />
                <ModificationSuggestions
                  instanceId={`${collaborationId}_discussion_mods`}
                  parentContractId={collaborationId}
                  stageKey="discussionModsContractId"
                  fieldLabel="problem"
                />
              </div>
            </ErrorBoundary>
          )}

          {/* ── Step 3: Proposals ── */}
          {viewStage === 'proposals' && (
            <ErrorBoundary fallbackMessage="The proposals section encountered an error.">
              <div className={styles.flowContainer}>
                {description && (
                  <div className={styles.problemContext}>
                    <span className={styles.contextLabel}>The Problem:</span>
                    <p>{description}</p>
                  </div>
                )}
                <ApprovalFlow
                  instanceId={flowInstanceId}
                  collaborationId={collaborationId}
                  collaborationType="initiative"
                  parentContractId={collaborationId}
                  stageKey="proposalsContractId"
                />
                <ModificationSuggestions
                  instanceId={`${collaborationId}_proposals_mods`}
                  parentContractId={collaborationId}
                  stageKey="proposalsModsContractId"
                  fieldLabel="solution"
                />
              </div>
            </ErrorBoundary>
          )}

          {/* ── Step 4: Vote ── */}
          {viewStage === 'vote' && (
            <ErrorBoundary fallbackMessage="The voting section encountered an error.">
              <div className={styles.flowContainer}>
                <QVFlow
                  instanceId={flowInstanceId}
                  collaborationId={collaborationId}
                  collaborationType="initiative"
                  parentContractId={collaborationId}
                  stageKey="voteContractId"
                />
              </div>
            </ErrorBoundary>
          )}

          {/* ── Step 5: Mandate ── */}
          {viewStage === 'mandate' && (
            <div className={styles.mandateStage}>
              <h2>Mandate Reached</h2>
              <p>
                The community has voted and established a shared position on this issue.
                This mandate represents the collective will of community members across borders.
              </p>
              <div className={styles.mandateActions}>
                <button className={styles.pledgeBtn}>
                  Pledge Support
                </button>
                <p className={styles.mandateNote}>
                  Click to pledge your support and commit to action. Track your progress and report back to the community.
                </p>
              </div>
            </div>
          )}

          {/* Advance bar — only show when viewing current stage */}
          {isViewingCurrentStage && (
            <div className={styles.advanceBar}>
              {nextStage ? (
                <div className={styles.advanceSection}>
                  {!stageReadiness.ready && (
                    <div className={styles.advanceWarning}>
                      <AlertTriangle size={14} />
                      <span>{stageReadiness.reason}</span>
                    </div>
                  )}
                  {confirmAdvance ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>
                        {`Advance to ${nextStage.label}?`}
                      </span>
                      <button className={styles.confirmYes} onClick={handleAdvance} disabled={advancing}>
                        {advancing ? 'Moving...' : 'Confirm'}
                      </button>
                      <button className={styles.confirmNo} onClick={() => setConfirmAdvance(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`${styles.advanceButton} ${!stageReadiness.ready ? styles.advanceButtonWarn : ''}`}
                      onClick={handleAdvance}
                      disabled={advancing || !stageReadiness.ready}
                    >
                      {advancing ? 'Moving...' : `Move to ${nextStage.label}`}
                    </button>
                  )}
                </div>
              ) : (
                <span className={styles.finalStage}>Final stage reached</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineView;
