import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useDigitalAgent } from '../components/identity/agent/useDigitalAgent';
import {
  getCommunityVouches,
  getStagePermissions,
  resolveTrustState,
  canParticipate,
  DEFAULT_STAGE_PERMISSIONS,
  type PipelineStage,
  type StageRule,
  type TrustState,
} from '../services/trust';

export interface CommunityTrust {
  trustOf: (publicKey: string) => TrustState;
  vouchCountOf: (publicKey: string) => number;
  isMember: (publicKey: string) => boolean;
  ruleFor: (stage: PipelineStage) => StageRule;
  /** Whether the CURRENT user may act at this stage. */
  canCurrentUserParticipate: (stage: PipelineStage) => boolean;
  currentUserTrust: TrustState;
  currentUserVouchCount: number;
  isReady: boolean;
}

/**
 * Resolve trust + per-stage rules for one community, all through the seam.
 * Persona vouches come from the community contract; the current user's own
 * vouches overlay from the Digital Agent store (reactive). Per-community by
 * design; in the demo every persona is a member of every community, so the
 * current user's count reads the same everywhere (documented simplification).
 */
export function useCommunityTrust(communityId: string | undefined): CommunityTrust {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => (communityId ? s.communities.communityMembers[communityId] : undefined));
  const { agent } = useDigitalAgent();

  const [vouches, setVouches] = useState<Record<string, string[]>>({});
  const [permissions, setPermissions] = useState<Record<PipelineStage, StageRule> | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    let cancelled = false;
    getCommunityVouches({ serverUrl, publicKey, communityId }).then((v) => {
      if (!cancelled) setVouches(v);
    });
    getStagePermissions({ serverUrl, publicKey, communityId }).then((p) => {
      if (!cancelled) setPermissions(p);
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, communityId]);

  const memberSet = useMemo(() => new Set(Array.isArray(members) ? members : []), [members]);
  const currentUserVouchCount = useMemo(
    () => (agent?.vouchedBy ?? []).filter((v) => memberSet.has(v)).length,
    [agent, memberSet],
  );

  const vouchCountOf = useCallback(
    (pk: string) => (pk === publicKey ? currentUserVouchCount : (vouches[pk]?.length ?? 0)),
    [publicKey, currentUserVouchCount, vouches],
  );
  const trustOf = useCallback((pk: string) => resolveTrustState(vouchCountOf(pk)), [vouchCountOf]);
  const isMember = useCallback((pk: string) => memberSet.has(pk), [memberSet]);
  const ruleFor = useCallback(
    (stage: PipelineStage) => (permissions ?? DEFAULT_STAGE_PERMISSIONS)[stage],
    [permissions],
  );
  const canCurrentUserParticipate = useCallback(
    (stage: PipelineStage) => canParticipate(ruleFor(stage), trustOf(publicKey || ''), isMember(publicKey || '')),
    [ruleFor, trustOf, isMember, publicKey],
  );

  return {
    trustOf,
    vouchCountOf,
    isMember,
    ruleFor,
    canCurrentUserParticipate,
    currentUserTrust: trustOf(publicKey || ''),
    currentUserVouchCount,
    isReady: permissions !== null,
  };
}

export default useCommunityTrust;
