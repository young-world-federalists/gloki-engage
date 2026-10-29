import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

export interface Concern {
  id: string;
  text: string;
  severity: string;
  author: string;
  timestamp: string;
  resolved: boolean;
}

export interface Resolution {
  text: string;
  author: string;
  timestamp: string;
}

export async function addConcern(
  serverUrl: string, publicKey: string, contractId: string, text: string, severity: string,
) {
  return await contractWrite({ serverUrl, publicKey, contractId,
    method: { name: 'add_concern', values: { text, severity } } as IMethod });
}

export async function addResolution(
  serverUrl: string, publicKey: string, contractId: string, concernId: string, text: string,
) {
  return await contractWrite({ serverUrl, publicKey, contractId,
    method: { name: 'add_resolution', values: { concern_id: concernId, text } } as IMethod });
}

export async function resolveConcern(
  serverUrl: string, publicKey: string, contractId: string, concernId: string,
) {
  return await contractWrite({ serverUrl, publicKey, contractId,
    method: { name: 'resolve_concern', values: { concern_id: concernId } } as IMethod });
}

export async function getConcerns(
  serverUrl: string, publicKey: string, contractId: string,
) {
  return await contractRead({ serverUrl, publicKey, contractId,
    method: { name: 'get_concerns', values: {} } as IMethod });
}

export async function getResolutions(
  serverUrl: string, publicKey: string, contractId: string, concernId: string,
) {
  return await contractRead({ serverUrl, publicKey, contractId,
    method: { name: 'get_resolutions', values: { concern_id: concernId } } as IMethod });
}
