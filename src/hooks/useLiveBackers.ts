import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { resolveInitiativeStageContract } from '../services/contracts/initiative';
import { getTotalConviction } from '../components/collaboration/flows/voting/convictionApi';

/**
 * S33 — the LIVE number of people backing a mandate.
 *
 * The mandate fixture carries a hand-authored `provenance.convictionBackers`
 * (760). The conviction contract carries the real count (~15 in the demo). Both
 * were rendered on the published mandate page, inches apart, saying different
 * things — and the fixture one never moved when you backed. One read, shared by
 * the hero card and the backing panel, so they cannot disagree.
 *
 * READ-ONLY by construction: `resolveInitiativeStageContract` is a plain
 * `contractRead`. Never swap this for `useFlowContract`/`useMandate`, both of
 * which DEPLOY when the parent has no registered sub-contract.
 *
 * Returns `null` until (or unless) a conviction contract resolves, so callers
 * can fall back to the provenance figure.
 */
export function useLiveBackers(initiativeId: string | undefined, refreshToken = 0): number | null {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [backers, setBackers] = useState<number | null>(null);

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    (async () => {
      try {
        const stage = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'convictionContractId');
        if (!stage?.contractId || cancelled) return;
        const total = await getTotalConviction(serverUrl, publicKey, stage.contractId);
        const count = (total as { count?: number } | null)?.count;
        if (!cancelled && typeof count === 'number') setBackers(count);
      } catch {
        /* no conviction contract yet — caller falls back to provenance */
      }
    })();
    return () => { cancelled = true; };
  }, [serverUrl, publicKey, initiativeId, refreshToken]);

  return backers;
}
