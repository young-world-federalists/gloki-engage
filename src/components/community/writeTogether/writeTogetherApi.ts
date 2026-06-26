import { contractRead, contractWrite, deployContract } from '../../../services/api';
import type { IMethod } from '../../../services/interfaces';
import { normalizeStageContract } from '../../../services/contracts/initiative';
import { setStatement, getStatement, type Statement } from '../../collaboration/flows/discussion/discussionApi';
import { addProposal } from '../../collaboration/flows/voting/approvalApi';
import { proposeCandidateIssue } from '../../stages/ProblemStage.demo';

export type DraftMode = 'problem' | 'solution';
export interface DraftTag { problemId: string; title: string; community: string; }
export interface DraftEntry {
  id: string;            // == contractId (stable, unique)
  contractId: string;    // the deployed discussion-style draft contract
  mode: DraftMode;
  target: string;        // target community contract id
  targetName: string;    // cached community display name
  tag?: DraftTag;        // solution only
  title: string;         // cached statement title for the list
  status: 'draft' | 'submitted';
  submittedRef?: string; // created initiative id (problem) or problem id (solution)
  author: string;        // starter pk
  createdAt: number;
}

const PREFIX = 'wtdraft_';

function resolveId(resp: unknown): string {
  const id = (resp as { id?: string })?.id ?? (typeof resp === 'string' ? resp : undefined);
  if (!id) throw new Error(`deployContract returned no contract id: ${JSON.stringify(resp)}`);
  return id;
}

export async function getDrafts(serverUrl: string, publicKey: string, communityId: string): Promise<DraftEntry[]> {
  const raw = await contractRead({ serverUrl, publicKey, contractId: communityId, method: { name: 'get_properties', values: {} } as IMethod });
  const props = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: DraftEntry[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (!k.startsWith(PREFIX) || typeof v !== 'string') continue;
    try { out.push(JSON.parse(v) as DraftEntry); } catch { /* skip malformed */ }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveDraft(serverUrl: string, publicKey: string, communityId: string, entry: DraftEntry): Promise<void> {
  await contractWrite({
    serverUrl, publicKey, contractId: communityId,
    method: { name: 'set_property', values: { key: PREFIX + entry.id, value: JSON.stringify(entry) } } as IMethod,
  });
}

export interface StartDraftInput {
  mode: DraftMode;
  target: string;
  targetName: string;
  tag?: DraftTag;
  title: string;
  body: string;
}

export async function startDraft(
  serverUrl: string, publicKey: string, communityId: string, input: StartDraftInput,
): Promise<DraftEntry> {
  const resp = await deployContract({ serverUrl, publicKey, name: `wt_draft_${Date.now()}`, contract: 'discussion_contract.py', code: '' });
  const contractId = resolveId(resp);
  await setStatement(serverUrl, publicKey, contractId, input.title, input.body);
  const entry: DraftEntry = {
    id: contractId, contractId, mode: input.mode, target: input.target, targetName: input.targetName,
    tag: input.tag, title: input.title, status: 'draft', author: publicKey, createdAt: Date.now(),
  };
  await saveDraft(serverUrl, publicKey, communityId, entry);
  return entry;
}

// Mirror useFlowContract shared mode: read the problem's registered solutions
// contract; deploy + register if absent. Demo join is a no-op.
async function resolveSolutionsContract(serverUrl: string, publicKey: string, problemInitiativeId: string): Promise<string> {
  const raw = await contractRead({
    serverUrl, publicKey, contractId: problemInitiativeId,
    method: { name: 'get_stage_contract', values: { stage_key: 'proposalsContractId' } } as IMethod,
  });
  const stored = normalizeStageContract(raw);
  if (stored?.contractId) return stored.contractId;
  const resp = await deployContract({ serverUrl, publicKey, name: `approval_${problemInitiativeId}`, contract: 'approval_contract.py', code: '' });
  const newId = resolveId(resp);
  await contractWrite({
    serverUrl, publicKey, contractId: problemInitiativeId,
    method: { name: 'register_stage_contract', values: { stage_key: 'proposalsContractId', contract_id: newId, address: serverUrl, agent: publicKey } } as IMethod,
  });
  return newId;
}

export async function submitDraft(
  serverUrl: string, publicKey: string, communityId: string, entry: DraftEntry,
): Promise<DraftEntry> {
  const statement: Statement = await getStatement(serverUrl, publicKey, entry.contractId);
  let submittedRef: string;
  if (entry.mode === 'problem') {
    submittedRef = proposeCandidateIssue({
      publicKey, communityId: entry.target,
      title: statement.title || entry.title, description: statement.body,
      countries: [], evidence: [], coAuthors: statement.coAuthors,
    });
  } else {
    if (!entry.tag) throw new Error('A solution draft must be tagged to a problem before it can be submitted.');
    const solutionsId = await resolveSolutionsContract(serverUrl, publicKey, entry.tag.problemId);
    await addProposal(serverUrl, publicKey, solutionsId, statement.body || statement.title, statement.coAuthors);
    submittedRef = entry.tag.problemId;
  }
  const updated: DraftEntry = { ...entry, status: 'submitted', submittedRef };
  await saveDraft(serverUrl, publicKey, communityId, updated);
  return updated;
}
