import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Banner, Button } from '../shared';
import { useT } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setInitiativeStage } from '../../store/slices/communitiesSlice';
import { contractWrite } from '../../services/api';
import { getInitiativeRoles, isAuthorOrCoAuthor, type InitiativeRoles } from '../../services/initiativeRoles';
import type { IMethod } from '../../services/interfaces';
import type { PipelineStage } from '../../types/initiative';
import styles from './StageAdvanceBar.module.scss';

// Canonical pipeline order — drives nextStage. (Mirrors InitiativeStagePanel /
// InitiativeDashboard.)
const PIPELINE_ORDER: PipelineStage[] = ['problem', 'discussion', 'proposals', 'vote', 'mandate'];
const STAGE_LABEL: Record<PipelineStage, string> = {
  problem: 'Problem',
  discussion: 'Discussion',
  proposals: 'Solutions',
  vote: 'Vote',
  mandate: 'Mandate',
};

export interface StageAdvanceBarProps {
  initiativeId: string;
  communityId: string;
  stage: PipelineStage;
  hostServer: string;
  hostAgent: string;
  /** Whether this stage's advance threshold is met (the parent owns per-stage readiness). */
  ready?: boolean;
  /** Shown when `ready` is false (e.g. "3 more upvotes needed"). */
  notReadyReason?: string;
  /** Fired after a successful advance, so the parent can refresh local stage state. */
  onAdvanced?: (next: PipelineStage) => void;
}

/**
 * The author/co-author **advance** control + the merged-into banner, extracted
 * so the new card path can preserve them (they previously lived only inside
 * `InitiativeStagePanel`). Self-contained: fetches the initiative's roles, words
 * the confirm step, and writes `set_stage` through the `api.ts` seam. Renders
 * nothing for non-authors with no merge to surface. Per-stage readiness is
 * injected (`ready`/`notReadyReason`) so this stays stage-agnostic.
 */
const StageAdvanceBar: React.FC<StageAdvanceBarProps> = ({
  initiativeId,
  communityId,
  stage,
  hostServer,
  hostAgent,
  ready = true,
  notReadyReason,
  onAdvanced,
}) => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const [roles, setRoles] = useState<InitiativeRoles | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    getInitiativeRoles(serverUrl, publicKey, initiativeId).then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  const currentStageIndex = PIPELINE_ORDER.indexOf(stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < PIPELINE_ORDER.length - 1
    ? PIPELINE_ORDER[currentStageIndex + 1]
    : null;
  const stageLabel = (s: PipelineStage) => t(`stage.${s}`, STAGE_LABEL[s]);

  const handleAdvance = async () => {
    if (!nextStage || !serverUrl || !publicKey || advancing) return;
    if (!ready) return;
    if (!confirmAdvance) {
      setConfirmAdvance(true);
      return;
    }
    setAdvancing(true);
    setConfirmAdvance(false);
    setAdvanceError(null);
    try {
      await contractWrite({
        serverUrl,
        publicKey,
        contractId: initiativeId,
        method: { name: 'set_stage', values: { stage: nextStage } } as IMethod,
      });
      // Keep Communities mandate counts fresh in this tab without a refetch.
      dispatch(setInitiativeStage({ initiativeId, stage: nextStage }));
      onAdvanced?.(nextStage);
    } catch (err) {
      console.error('[StageAdvanceBar] set_stage failed:', err);
      setAdvanceError(t('dashboard.advance.failed', "Couldn't advance the stage. Please try again."));
    } finally {
      setAdvancing(false);
    }
  };

  const merged = roles?.status === 'merged_into' && roles.mergedInto;
  const canAdvance = nextStage && roles && isAuthorOrCoAuthor(roles, publicKey);

  if (!merged && !canAdvance) return null;

  return (
    <>
      {merged && (
        <Banner
          tone="warning"
          title={t('dashboard.merged.title', 'This initiative merged into another one.')}
          className={styles.absorbedBanner}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                navigate(
                  `/initiative/${encodeURIComponent(hostServer)}/${encodeURIComponent(hostAgent)}/${communityId}/${roles!.mergedInto}`,
                )
              }
            >
              {t('dashboard.merged.cta', 'Go to merged initiative →')}
            </Button>
          }
        >
          {t('dashboard.merged.body', 'Continue the conversation on the surviving initiative.')}
        </Banner>
      )}

      {canAdvance && (
        <div className={styles.advanceBar}>
          {!ready && notReadyReason && (
            <div className={styles.advanceWarning}>
              <AlertTriangle size={14} />
              <span>{notReadyReason}</span>
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
                {t('dashboard.advance.confirm', 'Advance to {stage}?', { stage: stageLabel(nextStage!) })}
              </span>
              <button className={styles.confirmYes} onClick={handleAdvance} disabled={advancing}>
                {advancing ? t('dashboard.advance.moving', 'Moving...') : t('common.confirm', 'Confirm')}
              </button>
              <button className={styles.confirmNo} onClick={() => setConfirmAdvance(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          ) : (
            <button
              className={`${styles.advanceButton} ${!ready ? styles.advanceButtonWarn : ''}`}
              onClick={handleAdvance}
              disabled={advancing || !ready}
            >
              {advancing
                ? t('dashboard.advance.moving', 'Moving...')
                : t('dashboard.advance.move', 'Move to {stage}', { stage: stageLabel(nextStage!) })}
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default StageAdvanceBar;
