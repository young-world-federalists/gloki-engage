import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCollaborations } from '../store/slices/communitiesSlice';
import { hostedContract } from '../services/contractHosts';
import { isDemoDataMode } from '../services/dataMode';

/**
 * For routes that reach an initiative without its host in the URL (e.g.
 * /mandate/:communityId/:mandateId): every call to an initiative must go to
 * its creator's node, which is learned from the community's initiative list.
 * Loads that list when the host isn't known yet; true once it is (or once the
 * load settles, so a missing initiative still renders its empty state).
 */
export function useInitiativeHostReady(communityId: string | undefined, initiativeId: string | undefined): boolean {
  const dispatch = useAppDispatch();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const known = !initiativeId || isDemoDataMode() || !!hostedContract(initiativeId);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (known || !communityId || !serverUrl || !publicKey) return;
    let cancelled = false;
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId })).finally(() => {
      if (!cancelled) setSettled(true);
    });
    return () => {
      cancelled = true;
    };
  }, [known, communityId, serverUrl, publicKey, dispatch]);

  return known || settled;
}
