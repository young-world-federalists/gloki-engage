import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

export async function setAuthor(serverUrl: string, publicKey: string, contractId: string, author: string) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'set_author', values: { author } } as IMethod,
  });
}

export async function suggestModification(
  serverUrl: string, publicKey: string, contractId: string,
  field: string, suggestedText: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'suggest_modification', values: { field, suggested_text: suggestedText } } as IMethod,
  });
}

export async function voteOnSuggestion(
  serverUrl: string, publicKey: string, contractId: string,
  suggestionId: string, vote: 'approve' | 'reject',
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'vote_on_suggestion', values: { suggestion_id: suggestionId, vote } } as IMethod,
  });
}

export async function authorDecide(
  serverUrl: string, publicKey: string, contractId: string,
  suggestionId: string, decision: 'accept' | 'reject',
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'author_decide', values: { suggestion_id: suggestionId, decision } } as IMethod,
  });
}

export async function getSuggestions(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_suggestions', values: {} } as IMethod,
  });
}

export async function getMyVotes(serverUrl: string, publicKey: string, contractId: string) {
  return await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_my_votes', values: {} } as IMethod,
  });
}
