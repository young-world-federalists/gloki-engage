import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';
import ConvictionStaking from '../collaboration/flows/voting/ConvictionStaking';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import type { StageVariant } from '../../types/initiative';
import styles from './MandateStage.module.scss';

export interface MandateStageProps {
  /** The initiative contract id — used as the shared parent contract. */
  initiativeId: string;
  /** Feed renders the compact staking control; dashboard renders the full one. */
  variant: StageVariant;
}

/**
 * Stage 5 — Mandate. Owned by Lane E (`src/components/stages/MandateStage.*`).
 * Renders time-weighted conviction staking (compact in the feed, full in the
 * dashboard). In the feed it also links through to the published mandate
 * artifact; the dashboard surfaces that link via the JourneyRecap instead, so
 * the two contexts never double up.
 */
const MandateStage: React.FC<MandateStageProps> = ({ initiativeId, variant }) => {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams<{ communityId?: string }>();
  const communityCollaborations = useAppSelector((s) => s.communities.communityCollaborations);

  // Which community hosts this initiative — needed to build the mandate route.
  // Derived from the store so the feed shell never has to pass it down.
  const communityId = useMemo(() => {
    for (const [cid, collabs] of Object.entries(communityCollaborations || {})) {
      if (Array.isArray(collabs) && collabs.some((c) => c.id === initiativeId)) return cid;
    }
    return params.communityId ?? null;
  }, [communityCollaborations, initiativeId, params.communityId]);

  return (
    <ErrorBoundary fallbackMessage={t('mandate.stakeError', 'Conviction staking encountered an error.')}>
      <div className={styles.stage}>
        <ConvictionStaking
          instanceId={`${initiativeId}_conviction`}
          parentContractId={initiativeId}
          stageKey="convictionContractId"
          compact={variant === 'feed'}
        />
        {variant === 'feed' && communityId && (
          <button
            type="button"
            className={styles.viewMandate}
            onClick={() => navigate(`/mandate/${communityId}/${initiativeId}`)}
          >
            <span>{t('mandate.viewPublished', 'View the published mandate')}</span>
            <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MandateStage;
