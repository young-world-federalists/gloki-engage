import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { contractRead } from '../services/api';
import type { IMethod } from '../services/interfaces';

export type FoundState = 'loading' | 'found' | 'missing';

/**
 * Whether an initiative exists in the page's data layer (docs/DEMO_MODE.md):
 * the flag decides the layer, so an id from the other one — a demo id on a
 * real page, a real id on a demo page — comes back 'missing'. Call it inside
 * the page wrapper, so the read goes to the right layer.
 */
export function useInitiativeFound(initiativeId: string | undefined): FoundState {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [state, setState] = useState<{ id: string | undefined; found: FoundState }>({ id: undefined, found: 'loading' });

  useEffect(() => {
    if (!serverUrl || !publicKey || !initiativeId) return;
    let cancelled = false;
    contractRead({
      serverUrl,
      publicKey,
      contractId: initiativeId,
      method: { name: 'get_details', values: {} } as IMethod,
    })
      .then((details: unknown) => {
        // The real node answers an unknown contract with {"message": "no such
        // contract"}; the demo layer answers null. Either way: not here.
        const ok = !!details && typeof details === 'object' && !('message' in details) && Object.keys(details).length > 0;
        if (!cancelled) setState({ id: initiativeId, found: ok ? 'found' : 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ id: initiativeId, found: 'missing' });
      });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, initiativeId]);

  return state.id === initiativeId ? state.found : 'loading';
}

export default useInitiativeFound;
