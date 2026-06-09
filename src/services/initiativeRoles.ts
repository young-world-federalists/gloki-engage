import { contractRead, contractWrite } from './api';
import type { IMethod } from './interfaces';

export interface InitiativeRoles {
  author: string;
  coAuthors: string[];
  experts: string[];
  endorsementCounts: Record<string, number>;
  endorsements: Record<string, string[]>;
  status: 'active' | 'merged_into' | 'archived';
  mergedInto: string | null;
}

const EMPTY_ROLES: InitiativeRoles = {
  author: '',
  coAuthors: [],
  experts: [],
  endorsementCounts: {},
  endorsements: {},
  status: 'active',
  mergedInto: null,
};

export async function getInitiativeRoles(
  serverUrl: string, publicKey: string, initiativeId: string,
): Promise<InitiativeRoles> {
  try {
    const [rolesResult, detailsResult] = await Promise.all([
      contractRead({
        serverUrl, publicKey, contractId: initiativeId,
        method: { name: 'get_roles', values: {} } as IMethod,
      }),
      contractRead({
        serverUrl, publicKey, contractId: initiativeId,
        method: { name: 'get_details', values: {} } as IMethod,
      }),
    ]);

    const r = (rolesResult && typeof rolesResult === 'object') ? rolesResult as Partial<InitiativeRoles> : {};
    const d = (detailsResult && typeof detailsResult === 'object') ? detailsResult as Record<string, unknown> : {};

    const rawEndorsements = d.endorsements;
    const endorsements: Record<string, string[]> = {};
    if (rawEndorsements && typeof rawEndorsements === 'object') {
      for (const [k, v] of Object.entries(rawEndorsements as Record<string, unknown>)) {
        endorsements[k] = Array.isArray(v) ? v as string[] : [];
      }
    }

    return {
      // Older/demo initiative contracts don't implement get_roles; the author
      // is still recorded in get_details, so fall back to it (keeps the
      // author-only advance gate working across both contract generations).
      author: typeof r.author === 'string' && r.author
        ? r.author
        : (typeof d.author === 'string' ? d.author : ''),
      coAuthors: Array.isArray(r.coAuthors) ? r.coAuthors : [],
      experts: Array.isArray(r.experts) ? r.experts : [],
      endorsementCounts: (r.endorsementCounts && typeof r.endorsementCounts === 'object') ? r.endorsementCounts as Record<string, number> : {},
      endorsements,
      status: r.status === 'merged_into' || r.status === 'archived' ? r.status : 'active',
      mergedInto: typeof r.mergedInto === 'string' ? r.mergedInto : null,
    };
  } catch {
    return EMPTY_ROLES;
  }
}

export async function endorseExpert(
  serverUrl: string, publicKey: string, initiativeId: string, target: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'endorse_expert', values: { public_key: target } } as IMethod,
  });
}

export async function unendorseExpert(
  serverUrl: string, publicKey: string, initiativeId: string, target: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'unendorse_expert', values: { public_key: target } } as IMethod,
  });
}

export async function addCoAuthor(
  serverUrl: string, publicKey: string, initiativeId: string, target: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'add_co_author', values: { public_key: target } } as IMethod,
  });
}

export async function markMergedInto(
  serverUrl: string, publicKey: string, initiativeId: string, targetInitiativeId: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId: initiativeId,
    method: { name: 'mark_merged_into', values: { target_initiative_id: targetInitiativeId } } as IMethod,
  });
}

export function isAuthorOrCoAuthor(roles: InitiativeRoles, publicKey: string | null): boolean {
  if (!publicKey) return false;
  if (roles.author === publicKey) return true;
  return roles.coAuthors.includes(publicKey);
}
