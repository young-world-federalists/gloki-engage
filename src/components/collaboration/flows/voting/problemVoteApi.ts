import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

export async function upvote(serverUrl: string, publicKey: string, contractId: string) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'upvote', values: {} } as IMethod,
  });
}

export async function downvote(serverUrl: string, publicKey: string, contractId: string) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'downvote', values: {} } as IMethod,
  });
}

export async function removeVote(serverUrl: string, publicKey: string, contractId: string) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'remove_vote', values: {} } as IMethod,
  });
}

export async function getVotes(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_votes', values: {} } as IMethod,
  });
}

export async function getMyVote(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_my_vote', values: {} } as IMethod,
  });
}

export async function getTally(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_tally', values: {} } as IMethod,
  });
}
