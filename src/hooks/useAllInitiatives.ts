import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCollaborations,
  fetchGlokiEngageCommunityDetails,
  fetchCommunityMembers,
  fetchCommunityActiveMembers,
  fetchInitiativeStage,
} from '../store/slices/communitiesSlice';
import { useContractSyncMany } from '../components/collaboration/flows/shared/useContractSync';
import { communitiesForMode, isDemoDataMode } from '../services/dataMode';
import { displayNameFor } from '../utils/displayName';
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
  /** True while at least one initiative's stage is still being resolved. */
  isLoading: boolean;
}

/**
 * Aggregates initiatives across all of the user's (non-hidden) communities of
 * the page's data layer — real gloki-engage communities on a real page, the
 * seeded demo communities on a `?demo=true` page — and resolves each one's
 * pipeline stage. Shared by the cross-community Home (`HomeView`), the
 * per-stage feed (`StageFeedView`) and the organization home.
 *
 * All reads go through the community thunks (the service seam) — never a
 * direct server call from a component.
 */
export function useAllInitiatives(): UseAllInitiativesResult {
  const dispatch = useAppDispatch();
  const { contracts, serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { communityCollaborations, communityProperties, communityMembers, communityActiveMembers } =
    useAppSelector((s) => s.communities);
  const profiles = useAppSelector((s) => s.communities.profiles);
  const { hidden } = useAppSelector((s) => s.preferences);

  // Only the page's own layer (docs/DEMO_MODE.md): read while rendering, after
  // the page wrapper has set it.
  const demo = isDemoDataMode();
  const communityContracts = useMemo(
    () => communitiesForMode(contracts, demo).filter((c) => !hidden.includes(c.id)),
    [contracts, hidden, demo],
  );

  // Fetch collaborations, properties, and members for all visible communities.
  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    communityContracts.forEach((c) => {
      if (!communityCollaborations[c.id]) {
        dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: c.id }));
      }
      if (!communityProperties[c.id]) {
        dispatch(fetchGlokiEngageCommunityDetails({ serverUrl, publicKey, contractId: c.id }));
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
          // displayNameFor is the single source of truth for a byline name
          // (prefers the opt-in displayName pseudonym, then first+last, then
          // a truncated key) — real profiles only ever set displayName, so
          // reimplementing first+last concatenation here (as this used to)
          // rendered literally "undefined undefined" for every real author.
          const authorProfile = collab.author ? profiles[collab.author] : undefined;
          const authorName = collab.author ? displayNameFor(authorProfile, collab.author) : undefined;
          result.push({ ...collab, communityId: c.id, communityName: name, authorName });
        }
      }
    }
    return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityContracts, communityCollaborations, communityProperties, profiles]);

  // Resolve each initiative's pipeline stage into the SAME Redux slot
  // StageAdvanceBar writes on advance — one source of truth, not a separate
  // local cache. Fetched once per id on mount (page load); refreshed after
  // that only in reaction to a contract_write SSE event (below), never by
  // directly refetching after our own action.
  const reduxStages = useAppSelector((s) => s.communities.initiativeStages);
  useEffect(() => {
    if (!serverUrl || !publicKey || baseInitiatives.length === 0) return;
    baseInitiatives.forEach((item) => {
      if (reduxStages[item.id]) return;
      dispatch(fetchInitiativeStage({ serverUrl, publicKey, initiativeId: item.id }));
    });
  }, [serverUrl, publicKey, baseInitiatives, reduxStages, dispatch]);

  // Re-read an initiative's stage whenever ANY write lands on it — including
  // a stage advance from someone else's client.
  const initiativeIds = useMemo(() => baseInitiatives.map((i) => i.id), [baseInitiatives]);
  useContractSyncMany(initiativeIds, (changedId) => {
    if (serverUrl && publicKey) {
      dispatch(fetchInitiativeStage({ serverUrl, publicKey, initiativeId: changedId }));
    }
  });

  const initiatives = useMemo(
    () => baseInitiatives.map((i) => ({ ...i, stage: reduxStages[i.id] })),
    [baseInitiatives, reduxStages],
  );

  // "Loading" must stay true until every community's collaborations AND
  // every initiative's stage have actually been fetched at least once —
  // not just "some are still missing," which reads as false (not loading)
  // the moment baseInitiatives is empty, including at the very start before
  // any fetch has even resolved. That gap is exactly what let the sample
  // fallback flash before real data arrived (same class of bug fixed
  // earlier for CommunityHome.tsx). Both `.every()` checks are vacuously
  // true on an empty list, so zero real communities correctly resolves to
  // "done loading" immediately rather than spinning forever.
  const collaborationsLoaded = communityContracts.every((c) => communityCollaborations[c.id] !== undefined);
  const stagesLoaded = baseInitiatives.every((i) => reduxStages[i.id] !== undefined);
  const isLoading = !collaborationsLoaded || !stagesLoaded;

  return { initiatives, isLoading };
}
