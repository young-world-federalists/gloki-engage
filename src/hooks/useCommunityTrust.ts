import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useOrganization } from './useOrganization';
import { useVerificationRegistry } from './useVerificationRegistry';
import {
  getStagePermissions,
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
 * Trust is app-wide and comes from one place: the verification contract's
 * verified list (useVerificationRegistry). Stage rules stay per community.
 */
export function useCommunityTrust(communityId: string | undefined): CommunityTrust {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => (communityId ? s.communities.communityMembers[communityId] : undefined));
  const { isOrganization } = useOrganization();
  const registry = useVerificationRegistry();

  const [permissions, setPermissions] = useState<Record<PipelineStage, StageRule> | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !communityId) return;
    let cancelled = false;
    getStagePermissions({ serverUrl, publicKey, communityId }).then((p) => {
      if (!cancelled) setPermissions(p);
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, communityId]);

  const memberSet = useMemo(() => new Set(Array.isArray(members) ? members : []), [members]);
  const { isVerified, vouchCountOf } = registry;
  const currentUserVouchCount = publicKey ? vouchCountOf(publicKey) : 0;
  const trustOf = useCallback(
    (pk: string): TrustState => (isVerified(pk) ? 'verified' : vouchCountOf(pk) > 0 ? 'vouched' : 'unverified'),
    [isVerified, vouchCountOf],
  );
  const isMember = useCallback((pk: string) => memberSet.has(pk), [memberSet]);
  const ruleFor = useCallback(
    (stage: PipelineStage) => (permissions ?? DEFAULT_STAGE_PERMISSIONS)[stage],
    [permissions],
  );
  // S33 — organizations never participate, at any stage, under any rule. This
  // check belongs HERE, not in StageGate: this predicate is what every
  // participation surface consults (StageGate, DiscussionStageView,
  // ThreadedDiscussion, SharedStatement…), and StageGate wraps only four of
  // them. Putting the check in the wrapper left deliberation and chat open to
  // an institution, which contradicts one-person-one-vote.
  const canCurrentUserParticipate = useCallback(
    (stage: PipelineStage) =>
      !isOrganization
      && canParticipate(ruleFor(stage), trustOf(publicKey || ''), isMember(publicKey || '')),
    [isOrganization, ruleFor, trustOf, isMember, publicKey],
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
