// Routes mock contract read/write calls to the right handler based on the
// contract's Python file name stored in the registry at deploy time.
import type { IMethod } from '../interfaces';
import { getDemoContract, registerDemoContract, newDemoId } from './demoRegistry';
import { communityRead, communityWrite } from './demoContracts/community';
import { initiativeRead, initiativeWrite } from './demoContracts/initiative';
import { problemVoteRead, problemVoteWrite } from './demoContracts/problemVote';
import { approvalRead, approvalWrite } from './demoContracts/approval';
import { qvRead, qvWrite } from './demoContracts/qv';
import { convictionRead, convictionWrite } from './demoContracts/conviction';
import { modificationRead, modificationWrite } from './demoContracts/modification';
import { chatRead, chatWrite } from './demoContracts/chat';
import { discussionRead, discussionWrite } from './demoContracts/discussion';
import { concernsRead, concernsWrite } from './demoContracts/concerns';
import { mergeRead, mergeWrite } from './demoContracts/merge';
import { profileRead, profileWrite } from './demoContracts/profile';

type Handler = (contractId: string, method: IMethod, caller: string) => unknown;

const READ: Record<string, Handler> = {
  'community_contract.py': communityRead,
  'initiative_contract.py': initiativeRead,
  'problem_vote_contract.py': problemVoteRead,
  'approval_contract.py': approvalRead,
  'qv_contract.py': qvRead,
  'conviction_contract.py': convictionRead,
  'modification_contract.py': modificationRead,
  'chat_contract.py': chatRead,
  'discussion_contract.py': discussionRead,
  'concerns_contract.py': concernsRead,
  'merge_contract.py': mergeRead,
  'gloki_contract.py': profileRead,
};

const WRITE: Record<string, Handler> = {
  'community_contract.py': communityWrite,
  'initiative_contract.py': initiativeWrite,
  'problem_vote_contract.py': problemVoteWrite,
  'approval_contract.py': approvalWrite,
  'qv_contract.py': qvWrite,
  'conviction_contract.py': convictionWrite,
  'modification_contract.py': modificationWrite,
  'chat_contract.py': chatWrite,
  'discussion_contract.py': discussionWrite,
  'concerns_contract.py': concernsWrite,
  'merge_contract.py': mergeWrite,
  'gloki_contract.py': profileWrite,
};

// If a contract is read/written before its deploy was registered (e.g. a
// rehydrated localStorage flowId from a previous session), auto-register it as
// a generic stub. Reads return null, writes are accepted as no-ops.
function autoRegister(contractId: string): void {
  registerDemoContract({
    id: contractId.startsWith('demo-') ? contractId : `demo-${newDemoId('stage').slice(5)}-orphan`,
    name: 'orphan',
    contract: 'unknown',
    createdAt: Date.now(),
  });
}

function getOrAutoRegister(contractId: string) {
  let meta = getDemoContract(contractId);
  if (!meta && contractId) {
    autoRegister(contractId);
    meta = getDemoContract(contractId);
  }
  return meta;
}

export function routeRead(contractId: string, method: IMethod, caller: string): unknown {
  const meta = getOrAutoRegister(contractId);
  if (!meta) return null;
  const handler = READ[meta.contract];
  if (!handler) return null;
  return handler(contractId, method, caller);
}

export function routeWrite(contractId: string, method: IMethod, caller: string): unknown {
  const meta = getOrAutoRegister(contractId);
  if (!meta) return null;
  const handler = WRITE[meta.contract];
  if (!handler) return null;
  return handler(contractId, method, caller);
}
