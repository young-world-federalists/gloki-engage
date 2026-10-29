// Which data layer the current page uses (docs/DEMO_MODE.md). The URL flag
// decides, never the id: on a real page every contract call goes to the
// network, on a demo page (`?demo=true`) every call goes to the demo layer.
// An id from the other layer is then simply not found.
//
// The page wrappers (components/shared/PageModes.tsx) set this while the page
// renders, before any of its effects run; App resets it to real on every
// navigation. contractRead / contractWrite / joinContract read it per call.
import type { IContract } from './interfaces';
import { isDemoContract } from './demo/demoRegistry';

let demoDataMode = false;

export function setDemoDataMode(on: boolean): void {
  demoDataMode = on;
}

export function isDemoDataMode(): boolean {
  return demoDataMode;
}

/**
 * The communities a page of the current mode lists: the seeded demo
 * communities on a demo page, the real gloki-engage communities on a real one.
 * (Both live in `state.user.contracts`; each page shows only its own layer.)
 */
export function communitiesForMode(contracts: IContract[], demo = demoDataMode): IContract[] {
  return demo
    ? contracts.filter((c) => isDemoContract(c.id) && c.contract === 'community_contract.py')
    : contracts.filter((c) => !isDemoContract(c.id) && c.contract === 'gloki_engage_community_contract.py');
}
