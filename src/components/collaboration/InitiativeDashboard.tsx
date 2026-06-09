import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoleDisplay from '../shared/RoleDisplay';
import { getInitiativeRoles, type InitiativeRoles } from '../../services/initiativeRoles';
import { CheckCircle2, Circle, Lock, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers, setInitiativeStage } from '../../store/slices/communitiesSlice';
import { contractRead, contractWrite } from '../../services/api';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import {
  fetchDiscussionSummary,
  fetchProposalsSummary,
  fetchVoteSummary,
  type DiscussionSummary,
  type ProposalsSummary,
  type VoteSummary,
} from './flows/shared/stageMetrics';
import type { IMethod } from '../../services/interfaces';
import type { PipelineStage } from '../../types/initiative';
import ProblemStage from '../stages/ProblemStage';
import DiscussionStage from '../stages/DiscussionStage';
import ProposalsStage from '../stages/ProposalsStage';
import VoteStage from '../stages/VoteStage';
import MandateStage from '../stages/MandateStage';
import StageGate from '../community/StageGate';
import JourneyRecap from '../mandate/JourneyRecap';
import PageHeader from '../PageHeader';
import cs from '../../pages/Container.module.scss';
import styles from './InitiativeDashboard.module.scss';

interface StageConfig {
  id: PipelineStage;
  label: string;
  description: string;
}

const STAGES: StageConfig[] = [
  { id: 'problem', label: 'Problem', description: 'Community identifies whether this is a cross-border problem' },
  { id: 'discussion', label: 'Discussion', description: 'Members share perspectives from their countries' },
  { id: 'proposals', label: 'Proposals', description: 'Solution proposals are submitted and reviewed' },
  { id: 'vote', label: 'Vote', description: 'Weighted voting on the best proposals' },
  { id: 'mandate', label: 'Mandate', description: 'Community conviction and commitment to action' },
];

interface InitiativeDashboardProps {
  title: string;
  collaborationId: string;
  communityId: string;
}

type StageStatus = 'completed' | 'active' | 'locked';

const InitiativeDashboard: React.FC<InitiativeDashboardProps> = ({ title, collaborationId, communityId }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);
  const communityProps = useAppSelector((s) => s.communities.communityProperties[communityId]);
  const communityName = communityProps?.name || communityId.slice(0, 8);

  const [stage, setStage] = useState<PipelineStage>('problem');
  const [details, setDetails] = useState<Record<string, unknown>>({});
  const [advancing, setAdvancing] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [problemTally, setProblemTally] = useState<{ up: number; down: number; total: number }>({ up: 0, down: 0, total: 0 });
  const [discussionSummary, setDiscussionSummary] = useState<DiscussionSummary | null>(null);
  const [proposalsSummary, setProposalsSummary] = useState<ProposalsSummary | null>(null);
  const [voteSummary, setVoteSummary] = useState<VoteSummary | null>(null);
  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  const params = useParams<{ initiativeHostServer: string; initiativeHostAgent: string }>();

  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, collaborationId).then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, collaborationId]);

  // Fetch stage and details
  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;
    contractRead({
      serverUrl, publicKey, contractId: collaborationId,
      method: { name: 'get_stage', values: {} } as IMethod,
    })
      .then((result: unknown) => {
        if (typeof result === 'string' && STAGES.some((s) => s.id === result)) {
          setStage(result as PipelineStage);
        }
      })
      .catch(() => {});

    contractRead({
      serverUrl, publicKey, contractId: collaborationId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((result: Record<string, unknown>) => {
        if (result && typeof result === 'object') setDetails(result);
      })
      .catch(() => {});
  }, [serverUrl, publicKey, collaborationId]);

  // Fetch community members
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (communityMembers[communityId]) return;
    dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, communityMembers, dispatch]);

  // Fetch active-member count (falls back to raw count on old communities)
  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    if (communityActiveMembers[communityId] !== undefined) return;
    dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: communityId }));
  }, [serverUrl, publicKey, communityId, communityActiveMembers, dispatch]);

  // Fetch problem tally for completed/active problem stage
  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;
    const fetchProblemData = async () => {
      try {
        // Read-only use — don't join (that would auto-register the caller as
        // a partner on the sub-contract, which has to be gated by the active
        // ProblemVoteFlow deploy path, not by the dashboard summary fetch).
        const pvStageContract = await resolveInitiativeStageContract(
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
    fetchProblemData();
  }, [serverUrl, publicKey, collaborationId]);

  // Fetch compact summaries for completed stages. Each returns null silently
  // on old initiatives without the relevant sub-contract — the UI hides that
  // line accordingly.
  useEffect(() => {
    if (!serverUrl || !publicKey || !collaborationId) return;
    let cancelled = false;
    Promise.allSettled([
      fetchDiscussionSummary(serverUrl, publicKey, collaborationId),
      fetchProposalsSummary(serverUrl, publicKey, collaborationId),
      fetchVoteSummary(serverUrl, publicKey, collaborationId),
    ]).then(([d, p, v]) => {
      if (cancelled) return;
      setDiscussionSummary(d.status === 'fulfilled' ? d.value : null);
      setProposalsSummary(p.status === 'fulfilled' ? p.value : null);
      setVoteSummary(v.status === 'fulfilled' ? v.value : null);
    });
    return () => { cancelled = true; };
    // `stage` intentionally omitted — the summaries reflect historical data
    // that doesn't change with the active stage, and re-fetching on every
    // advance is wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, publicKey, collaborationId]);

  const memberCount = Array.isArray(communityMembers[communityId])
    ? communityMembers[communityId].length : 0;
  const activeMemberCount = communityActiveMembers[communityId] ?? memberCount;

  const currentStageIndex = STAGES.findIndex((s) => s.id === stage);
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  const getStageStatus = (stageId: PipelineStage): StageStatus => {
    const idx = STAGES.findIndex((s) => s.id === stageId);
    if (idx < currentStageIndex) return 'completed';
    if (idx === currentStageIndex) return 'active';
    return 'locked';
  };

  const getStageReadiness = (): { ready: boolean; reason: string } => {
    if (stage === 'problem' && activeMemberCount > 0) {
      const threshold = Math.ceil(activeMemberCount * 0.50);
      if (problemTally.up < threshold) {
        return {
          ready: false,
          reason: `${Math.max(threshold - problemTally.up, 0)} more upvote${threshold - problemTally.up !== 1 ? 's' : ''} needed (${problemTally.up}/${threshold})`,
        };
      }
    }
    return { ready: true, reason: '' };
  };

  const handleAdvance = async () => {
    if (!nextStage || !serverUrl || !publicKey || advancing) return;
    if (!stageReadiness.ready) return;
    if (!confirmAdvance) { setConfirmAdvance(true); return; }
    setAdvancing(true);
    setConfirmAdvance(false);
    try {
      await contractWrite({
        serverUrl, publicKey, contractId: collaborationId,
        method: { name: 'set_stage', values: { stage: nextStage.id } } as IMethod,
      });
      setStage(nextStage.id);
      // Keep Communities mandate counts fresh in this tab without a refetch.
      dispatch(setInitiativeStage({ initiativeId: collaborationId, stage: nextStage.id }));
    } catch { /* silently fail */ }
    finally { setAdvancing(false); }
  };

  const stageReadiness = getStageReadiness();
  const description = typeof details.description === 'string' ? details.description : '';
  const evidenceLinks = Array.isArray(details.evidence) ? (details.evidence as string[]) : [];
  const countries = Array.isArray(details.countries) ? (details.countries as string[]) : [];

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
        <div className={cs.main}>
          {roles?.status === 'merged_into' && roles.mergedInto && (
            <div className={styles.absorbedBanner}>
              <div>
                <strong>This initiative merged into another one.</strong>
                <p>Continue the conversation on the surviving initiative.</p>
              </div>
              <button onClick={() => navigate(`/initiative/${encodeURIComponent(params.initiativeHostServer || '')}/${encodeURIComponent(params.initiativeHostAgent || '')}/${communityId}/${roles.mergedInto}`)}>
                Go to merged initiative →
              </button>
            </div>
          )}

          {roles && (
            <RoleDisplay roles={roles} />
          )}

          {/* Description */}
          {description && (
            <p className={styles.description}>{description}</p>
          )}

          {/* Stage Progress Bar */}
          <div className={styles.progressBar}>
            {STAGES.map((s, i) => {
              const status = getStageStatus(s.id);
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && (
                    <div className={`${styles.connector} ${status !== 'locked' ? styles.connectorActive : ''}`} />
                  )}
                  <div className={styles.progressStep}>
                    <div className={`${styles.stepDot} ${styles[status]}`}>
                      {status === 'completed' ? <CheckCircle2 size={16} /> :
                       status === 'locked' ? <Lock size={12} /> :
                       <Circle size={16} />}
                    </div>
                    <span className={`${styles.stepLabel} ${styles[`${status}Label`]}`}>{s.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* E3 — journey recap: the whole arc, culminating in the published mandate */}
          {stage === 'mandate' && (
            <JourneyRecap
              problemUp={problemTally.up}
              discussion={discussionSummary}
              proposals={proposalsSummary}
              vote={voteSummary}
              onViewMandate={() => navigate(`/mandate/${communityId}/${collaborationId}`)}
            />
          )}

          {/* Stage Cards */}
          <div className={styles.stageCards}>
            {STAGES.map((s) => {
              const status = getStageStatus(s.id);
              return (
                <div key={s.id} className={`${styles.stageCard} ${styles[`card${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{s.label}</h2>
                    <span className={`${styles.statusBadge} ${styles[`badge${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                      {status === 'completed' ? 'Completed' : status === 'active' ? 'Active' : 'Locked'}
                    </span>
                  </div>
                  <p className={styles.cardDescription}>{s.description}</p>

                  {/* LOCKED */}
                  {status === 'locked' && (
                    <div className={styles.lockedOverlay}>
                      <Lock size={20} />
                      <span>Awaiting earlier stages</span>
                    </div>
                  )}

                  {/* COMPLETED: problem summary */}
                  {status === 'completed' && s.id === 'problem' && (
                    <div className={styles.completedMetrics}>
                      <span>{problemTally.up} upvotes / {problemTally.down} downvotes</span>
                      <span className={styles.thresholdMet}>Threshold met</span>
                    </div>
                  )}

                  {/* COMPLETED: discussion summary */}
                  {status === 'completed' && s.id === 'discussion' && discussionSummary && (
                    <div className={styles.completedMetrics}>
                      <span>{discussionSummary.participants} participant{discussionSummary.participants !== 1 ? 's' : ''} · {discussionSummary.comments} comment{discussionSummary.comments !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* COMPLETED: proposals summary */}
                  {status === 'completed' && s.id === 'proposals' && proposalsSummary && (
                    <div className={styles.completedMetrics}>
                      <span>{proposalsSummary.proposals} proposal{proposalsSummary.proposals !== 1 ? 's' : ''}{proposalsSummary.topApprovedText ? ` · top: "${proposalsSummary.topApprovedText}" (${proposalsSummary.topApprovedCount} approval${proposalsSummary.topApprovedCount !== 1 ? 's' : ''})` : ''}</span>
                    </div>
                  )}

                  {/* COMPLETED: vote summary */}
                  {status === 'completed' && s.id === 'vote' && voteSummary && (
                    <div className={styles.completedMetrics}>
                      <span>{voteSummary.winnerText ? `Winner: "${voteSummary.winnerText}" (${voteSummary.winnerCredits.toFixed(1)} votes)` : `${voteSummary.voters} voter${voteSummary.voters !== 1 ? 's' : ''}`}</span>
                    </div>
                  )}

                  {/* ACTIVE: lane-owned stage participation UI, gated by the
                      community's per-stage rule. Completed/locked rendering above
                      stays untouched; read-only summaries are never blocked. */}
                  {status === 'active' && (
                    <StageGate communityId={communityId} stage={s.id}>
                      {s.id === 'problem' && (
                        <ProblemStage
                          initiativeId={collaborationId}
                          communityMemberCount={activeMemberCount}
                          evidenceLinks={evidenceLinks}
                          countries={countries}
                        />
                      )}

                      {s.id === 'discussion' && (
                        <DiscussionStage
                          variant="dashboard"
                          initiativeId={collaborationId}
                          communityId={communityId}
                          title={title}
                          hostServer={params.initiativeHostServer || ''}
                          hostAgent={params.initiativeHostAgent || ''}
                          memberCount={memberCount}
                        />
                      )}

                      {s.id === 'proposals' && (
                        <ProposalsStage
                          variant="dashboard"
                          initiativeId={collaborationId}
                          communityId={communityId}
                          title={title}
                          hostServer={params.initiativeHostServer || ''}
                          hostAgent={params.initiativeHostAgent || ''}
                        />
                      )}

                      {s.id === 'vote' && (
                        <VoteStage initiativeId={collaborationId} />
                      )}

                      {s.id === 'mandate' && (
                        <MandateStage variant="dashboard" initiativeId={collaborationId} />
                      )}
                    </StageGate>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advance bar */}
          {nextStage && (
            <div className={styles.advanceBar}>
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
                  <button className={styles.confirmNo} onClick={() => setConfirmAdvance(false)}>Cancel</button>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default InitiativeDashboard;
