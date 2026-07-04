import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCollaborations,
  fetchCommunityProperties,
  fetchCommunityMembers,
  fetchCommunityActiveMembers,
} from '../store/slices/communitiesSlice';
import { contractRead } from '../services/api';
import type { IMethod } from '../services/interfaces';
import type { Collaboration } from '../services/contracts/community';

export interface InitiativeWithMeta extends Collaboration {
  communityId: string;
  communityName: string;
  authorName?: string;
  /** Resolved pipeline stage; `'_unknown'` until the read resolves (or if it fails). */
  stage?: string;
}

export interface UseAllInitiativesResult {
  /** Every initiative across the user's visible communities, newest first, each with `.stage`. */
  initiatives: InitiativeWithMeta[];
  /** initiativeId → resolved stage string (or `'_unknown'`). */
  stages: Record<string, string>;
  /** True while at least one initiative's stage is still being resolved. */
  isLoading: boolean;
}

/**
 * Aggregates initiatives across all of the user's (non-hidden) communities and
 * resolves each one's pipeline stage. Shared by the cross-community Home
 * (`HomeView`) and the per-stage feed (`StageFeedView`) so this collection logic
 * lives in exactly one place.
 *
 * All reads/writes go through the service seam (`contractRead` + the community
 * thunks) — never a direct server call from a component.
 */
export function useAllInitiatives(): UseAllInitiativesResult {
  const dispatch = useAppDispatch();
  const { contracts, serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityCollaborations, communityProperties, communityMembers, communityActiveMembers } =
    useAppSelector((s) => s.communities);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const { hidden } = useAppSelector((s) => s.preferences);

  const communityContracts = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py' && !hidden.includes(c.id)),
    [contracts, hidden],
  );

  // Fetch collaborations, properties, and members for all visible communities.
  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    communityContracts.forEach((c) => {
      if (!communityCollaborations[c.id]) {
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: c.id }));
      }
      if (!communityProperties[c.id]) {
        dispatch(fetchCommunityProperties({ serverUrl, publicKey, contractId: c.id }));
      }
      if (!communityMembers[c.id]) {
        dispatch(fetchCommunityMembers({ serverUrl, publicKey, contractId: c.id }));
      }
      if (communityActiveMembers[c.id] === undefined) {
        dispatch(fetchCommunityActiveMembers({ serverUrl, publicKey, contractId: c.id }));
      }
    });
  }, [
    serverUrl,
    publicKey,
    communityContracts,
    communityCollaborations,
    communityProperties,
    communityMembers,
    communityActiveMembers,
    dispatch,
  ]);

  // Collect all initiatives across communities, newest first.
  const baseInitiatives: InitiativeWithMeta[] = useMemo(() => {
    const result: InitiativeWithMeta[] = [];
    for (const c of communityContracts) {
      const collabs = communityCollaborations[c.id] ?? [];
      const name = communityProperties[c.id]?.name || c.name || c.id.slice(0, 8);
      for (const collab of collabs) {
        if (collab.type === 'initiative') {
          const authorProfile = collab.author && profiles ? profiles[collab.author] : undefined;
          const profileName = authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`.trim()
            : '';
          const authorName = profileName || (collab.author ? collab.author.slice(0, 8) + '...' : undefined);
          result.push({ ...collab, communityId: c.id, communityName: name, authorName });
        }
      }
    }
    return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityContracts, communityCollaborations, communityProperties, profiles]);

  // Resolve each initiative's pipeline stage (read-only).
  const [stages, setStages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!serverUrl || !publicKey || baseInitiatives.length === 0) return;
    baseInitiatives.forEach((item) => {
      if (stages[item.id]) return;
      contractRead({
        serverUrl,
        publicKey,
        contractId: item.id,
        method: { name: 'get_stage', values: {} } as IMethod,
      })
        .then((result: unknown) => {
          setStages((prev) => ({ ...prev, [item.id]: typeof result === 'string' ? result : '_unknown' }));
        })
        .catch(() => {
          setStages((prev) => ({ ...prev, [item.id]: '_unknown' }));
        });
    });
    // `stages` is intentionally omitted: we guard per-id and update via the
    // functional setter, so we must not re-run when a stage resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, publicKey, baseInitiatives]);

  // Attach the resolved stage to each initiative. Redux `initiativeStages`
  // (written by StageAdvanceBar on advance) overlays the local cache so an
  // in-feed advance is reflected live — the local map is guarded per-id and
  // never re-reads.
  const reduxStages = useAppSelector((s) => s.communities.initiativeStages);
  const initiatives = useMemo(
    () => baseInitiatives.map((i) => ({ ...i, stage: reduxStages[i.id] ?? stages[i.id] })),
    [baseInitiatives, stages, reduxStages],
  );

  const isLoading = baseInitiatives.length > 0 && Object.keys(stages).length < baseInitiatives.length;

  return { initiatives, stages, isLoading };
}

export default useAllInitiatives;
