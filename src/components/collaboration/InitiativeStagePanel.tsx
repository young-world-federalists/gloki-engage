import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import RoleDisplay from '../shared/RoleDisplay';
import { getInitiativeRoles, isAuthorOrCoAuthor, type InitiativeRoles } from '../../services/initiativeRoles';
import { AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCommunityMembers, fetchCommunityActiveMembers, setInitiativeStage } from '../../store/slices/communitiesSlice';
import { contractRead, contractWrite } from '../../services/api';
import { resolveInitiativeStageContract } from '../../services/contracts/initiative';
import type { IMethod } from '../../services/interfaces';
import type { PipelineStage } from '../../types/initiative';
import ProblemEngage from '../initiative/stages/ProblemEngage';
import ProblemChinExtras from '../initiative/ProblemChinExtras';
import MandateEngage from '../initiative/stages/MandateEngage';
import SolutionEngage from '../initiative/stages/SolutionEngage';
import VoteEngage from '../initiative/stages/VoteEngage';
import DiscussionEngage from '../initiative/stages/DiscussionEngage';
import StageGate from '../community/StageGate';
import { Banner, Button } from '../shared';
import styles from './InitiativeStagePanel.module.scss';

interface StageConfig {
  id: PipelineStage;
  label: string;
  description: string;
}

// Canonical pipeline order — drives currentStageIndex / nextStage and readiness.
// (Mirrors InitiativeDashboard; descriptions kept only for the stage-label
// translation default — the per-stage roadmap cards live on the dashboard.)
const STAGES: StageConfig[] = [
  { id: 'problem', label: 'Problem', description: 'Community identifies whether this is a cross-border problem' },
  { id: 'discussion', label: 'Discussion', description: 'Members share perspectives from their countries' },
  { id: 'proposals', label: 'Solutions', description: 'Solutions are submitted and reviewed' },
  { id: 'vote', label: 'Vote', description: 'Vote on the best solutions' }, // one person, one vote — never "weighted"
  { id: 'mandate', label: 'Mandate', description: 'Community conviction and commitment to action' },
];

interface InitiativeStagePanelProps {
  /** The collaboration/initiative contract id. */
  initiativeId: string;
  communityId: string;
  title: string;
  hostServer: string;
  hostAgent: string;
}

/**
 * Embeddable engagement panel for an initiative's CURRENT stage. Renders bare
 * content (no page chrome): the merged-into banner, the author/MC RoleDisplay,
 * the active stage's StageGate-wrapped participation UI (the mandate stage renders
 * MandateEngage directly — it carries its own JourneyRecap + StageGate), and the
 * author/co-author advance bar. Mounted inside an ActivityCard on the community page.
 */
const InitiativeStagePanel: React.FC<InitiativeStagePanelProps> = ({
  initiativeId,
  communityId,
  title,
  hostServer,
  hostAgent,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const communityMembers = useAppSelector((s) => s.communities.communityMembers);
  const communityActiveMembers = useAppSelector((s) => s.communities.communityActiveMembers);

  const [stage, setStage] = useState<PipelineStage>('problem');
  const [advancing, setAdvancing] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [problemTally, setProblemTally] = useState<{ up: number; down: number; total: number }>({ up: 0, down: 0, total: 0 });
  const [roles, setRoles] = useState<InitiativeRoles | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId]);

  // Fetch the current stage (the per-stage read chrome — countries, evidence —
  // now lives in the cards' own data hooks, so the panel no longer reads details).
  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    contractRead({
      serverUrl, publicKey, contractId: initiativeId,
      method: { name: 'get_stage', values: {} } as IMethod,
    })
      .then((result: unknown) => {
        if (typeof result === 'string' && STAGES.some((s) => s.id === result)) {
          setStage(result as PipelineStage);
        }
      })
      .catch(() => {});
  }, [serverUrl, publicKey, initiativeId]);

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
    if (!serverUrl || !publicKey || !initiativeId) return;
    const fetchProblemData = async () => {
      try {
        // Read-only use — don't join (that would auto-register the caller as
        // a partner on the sub-contract, which has to be gated by the active
        // ProblemVoteFlow deploy path, not by the panel's summary fetch).
        const pvStageContract = await resolveInitiativeStageContract(
          serverUrl,
          publicKey,
          initiativeId,
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
  }, [serverUrl, publicKey, initiativeId]);

  const memberCount = Array.isArray(communityMembers[communityId])
    ? communityMembers[communityId].length : 0;
  const activeMemberCount = communityActiveMembers[communityId] ?? memberCount;

  const currentStageIndex = STAGES.findIndex((s) => s.id === stage);
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  // Stage labels resolve through the canonical full-label family `stage.{id}`
  // (shared with CommunityHome badges + CreateInitiativePage). English source is
  // the STAGES array above (passed as the inline default).
  const stageLabel = (s: StageConfig) => t(`stage.${s.id}`, s.label);

  const getStageReadiness = (): { ready: boolean; reason: string } => {
    if (stage === 'problem' && activeMemberCount > 0) {
      const threshold = Math.ceil(activeMemberCount * 0.50);
      if (problemTally.up < threshold) {
        const remaining = Math.max(threshold - problemTally.up, 0);
        return {
          ready: false,
          // Full-string singular/plural alternatives — a bare '{s}' suffix is
          // English-only morphology and untranslatable (W5).
          reason: remaining === 1
            ? t('dashboard.readiness.upvotes.one', '1 more upvote needed ({up}/{threshold})',
                { up: problemTally.up, threshold })
            : t('dashboard.readiness.upvotes.many', '{remaining} more upvotes needed ({up}/{threshold})',
                { remaining, up: problemTally.up, threshold }),
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
    setAdvanceError(null);
    try {
      await contractWrite({
        serverUrl, publicKey, contractId: initiativeId,
        method: { name: 'set_stage', values: { stage: nextStage.id } } as IMethod,
      });
      setStage(nextStage.id);
      // Keep Communities mandate counts fresh in this tab without a refetch.
      dispatch(setInitiativeStage({ initiativeId, stage: nextStage.id }));
    } catch (err) {
      // Surface the failure (was silently swallowed — review §2 / Gate B minimum).
      console.error('[StagePanel] set_stage failed:', err);
      setAdvanceError(t('dashboard.advance.failed', "Couldn't advance the stage. Please try again."));
    }
    finally { setAdvancing(false); }
  };

  const stageReadiness = getStageReadiness();

  return (
    <div>
      {roles?.status === 'merged_into' && roles.mergedInto && (
        <Banner
          tone="warning"
          title={t('dashboard.merged.title', 'This initiative merged into another one.')}
          className={styles.absorbedBanner}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${roles.mergedInto}`)}
            >
              {t('dashboard.merged.cta', 'Go to merged initiative →')}
            </Button>
          }
        >
          {t('dashboard.merged.body', 'Continue the conversation on the surviving initiative.')}
        </Banner>
      )}

      {roles && (
        <RoleDisplay roles={roles} />
      )}

      {/* Active-stage participation UI only, gated by the community's per-stage
          rule. The completed/locked roadmap cards are dashboard-only and gone.
          Mandate, Solution (proposals) and Discussion are the exceptions:
          MandateEngage / SolutionEngage own their own StageGate (and MandateEngage
          its JourneyRecap), so they render directly — wrapping them again would
          double-gate. DiscussionEngage is a read-only live preview (actions live
          in the full view), so it needs no gate. */}
      <div className={styles.activeStage}>
        {stage === 'mandate' ? (
          <MandateEngage initiativeId={initiativeId} communityId={communityId} />
        ) : stage === 'proposals' ? (
          <SolutionEngage
            initiativeId={initiativeId}
            communityId={communityId}
            title={title}
            hostServer={hostServer}
            hostAgent={hostAgent}
            communityMemberCount={activeMemberCount}
          />
        ) : stage === 'vote' ? (
          <VoteEngage initiativeId={initiativeId} communityId={communityId} />
        ) : stage === 'discussion' ? (
          <DiscussionEngage
            initiativeId={initiativeId}
          />
        ) : (
          <>
            <StageGate communityId={communityId} stage={stage}>
              {stage === 'problem' && (
                <ProblemEngage
                  initiativeId={initiativeId}
                  communityId={communityId}
                  communityMemberCount={activeMemberCount}
                />
              )}
            </StageGate>
            {/* Suggest + code chip live ungated below the vote (S30 A-5) — this
                legacy fallthrough has no chin, so they render inline as before. */}
            {stage === 'problem' && (
              <ProblemChinExtras
                initiativeId={initiativeId}
                communityId={communityId}
                hostServer={hostServer}
                hostAgent={hostAgent}
              />
            )}
          </>
        )}
      </div>

      {/* Advance bar — author/co-authors only (Eston's Gate-B call, Batch 9b):
          the thresholds gate readiness, but executing the advance is the
          authors' action. */}
      {nextStage && roles && isAuthorOrCoAuthor(roles, publicKey) && (
        <div className={styles.advanceBar}>
          {!stageReadiness.ready && (
            <div className={styles.advanceWarning}>
              <AlertTriangle size={14} />
              <span>{stageReadiness.reason}</span>
            </div>
          )}
          {advanceError && (
            <div className={styles.advanceWarning} role="alert">
              <AlertTriangle size={14} />
              <span>{advanceError}</span>
            </div>
          )}
          {confirmAdvance ? (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>
                {t('dashboard.advance.confirm', 'Advance to {stage}?', { stage: stageLabel(nextStage) })}
              </span>
              <button className={styles.confirmYes} onClick={handleAdvance} disabled={advancing}>
                {advancing ? t('dashboard.advance.moving', 'Moving...') : t('common.confirm', 'Confirm')}
              </button>
              <button className={styles.confirmNo} onClick={() => setConfirmAdvance(false)}>{t('common.cancel', 'Cancel')}</button>
            </div>
          ) : (
            <button
              className={`${styles.advanceButton} ${!stageReadiness.ready ? styles.advanceButtonWarn : ''}`}
              onClick={handleAdvance}
              disabled={advancing || !stageReadiness.ready}
            >
              {advancing ? t('dashboard.advance.moving', 'Moving...') : t('dashboard.advance.move', 'Move to {stage}', { stage: stageLabel(nextStage) })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InitiativeStagePanel;
