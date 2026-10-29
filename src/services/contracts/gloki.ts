import { contractRead } from '../api';
import type { IMethod } from '../interfaces';

/**
 * Gloki contract interface
 * Handles all gloki/profile-specific contract calls
 */

/**
 * Get profile from gloki contract
 */
export async function getProfile(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'get_profile',
      values: {},
    } as IMethod,
  });
}
