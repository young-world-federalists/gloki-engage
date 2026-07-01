// Mock gloki/profile contract — serves a seeded persona's profile.
//
// In the demo a persona's "profile contract id" is simply the persona's public
// key: the seed registers it (see seedDemoCommunity) and the community contract's
// get_partners points each persona member's `profile` at it. This lets the real
// member-profile flow (getPartners → fetchMemberProfile → get_profile) resolve
// persona names everywhere they're read from `state.communities.profiles`
// (cross-community Home, stage feed, member lists, country participation) without
// leaking any demo knowledge into the UI/hook layer.
import type { IMethod } from '../../interfaces';
import { getPersona } from '../fixtures/identity';
import { expertProfile } from '../fixtures/deliberation';

export function profileRead(contractId: string, method: IMethod): unknown {
  if (method.name === 'get_profile') {
    const persona = getPersona(contractId);
    if (persona) {
      return {
        firstName: persona.firstName,
        lastName: persona.lastName,
        userPhoto: persona.userPhoto,
        userBio: persona.userBio,
        country: persona.country,
        displayName: persona.displayName,
      };
    }
    // S12: seeded experts (demo-expert-*) resolve too, so an attributed expert
    // review shows a real name + country. `field` doubles as their bio/credential.
    const expert = expertProfile(contractId);
    if (expert) {
      const [firstName, ...rest] = expert.name.split(' ');
      return {
        firstName,
        lastName: rest.join(' '),
        userPhoto: '',
        userBio: expert.field,
        country: expert.country,
      };
    }
    return null;
  }
  return null;
}

export function profileWrite(): unknown {
  // Demo profiles are read-only.
  return null;
}
