# "Write together" Community Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained "Write together" community page where members co-author a problem or solution draft (co-owned statement + track-changes edits, 1p1v fold-in), tag a solution to a problem (dropdown + 3-word code), and submit it to any of their communities' feeds.

**Architecture:** A new `community/writeTogether/` feature (list ↔ start ↔ editor, local state, mirroring `Currency`). The draft editor **reuses** the dormant `SharedStatement` co-authoring mechanic (adapted to `UserIdentity` + real profiles) and attaches `ThreadedDiscussion`. Each draft is a deployed `discussion_contract.py`; drafts are registered on the community via `set_property`/`get_properties` (`wtdraft_<id>`). Submit mints real feed items via `proposeCandidateIssue` (problem) or `add_proposal` (solution), both carrying an optional `coAuthors` list. Everything stays behind `src/services/api.ts`; re-fetch after writes (no `contract_write` events).

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules; the demo seam (`src/services/demo/`); the shared kit + `UserIdentity` + `ThreadedDiscussion` + `SharedStatement`.

## Global Constraints

- **Branch `ui`, keep it runnable.** Never call a real server from a component — read/write only through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`). Demo seam emits **no** `contract_write` events → **re-fetch after every write**.
- **No test framework.** Verify each task with `npm run build` (runs `tsc -b`) — must be clean before commit. Visible tasks are previewed by the orchestrator at **360px, light + dark**.
- **Tokens only** (`DESIGN_SYSTEM.md`): no ad-hoc hex; color means "stage" or "status"; AA contrast (no `$gray-400` text); ≥44px touch targets; visible focus rings. Stage accents from the canonical `$stage-*` palette.
- **Reuse the kit:** `Button`, `Card`, `Modal`, `Banner`, `Badge`, `EmptyState`, `InfoDisclosure`, `SearchableSelect`, `UserIdentity`, `ThreadedDiscussion`. Prefer these over hand-rolled.
- **New user-facing strings:** use `t('key', 'English default')` inline (en works immediately); fr + sw parity is backfilled in Task 12. Sentence case.
- **New contract method names are documented for Ouri** (comments in the demo contract files).
- **Do NOT** touch `SolutionEngage`/the solution card (S4), delete the dormant pieces (`PositionsBoard`/`AnchoredThread`/`ParticipationMeter`/`CoPresenceBar`), or do the three S2-deferred cleanups.

---

## File Structure

**New**
- `src/utils/problemCode.ts` — pure 3-word code (generate/parse/resolve) + curated wordlist.
- `src/components/community/writeTogether/writeTogetherApi.ts` — draft types, registry (get/save), `startDraft`, `submitDraft`, `resolveSolutionsContract`.
- `src/components/community/writeTogether/WriteTogetherPage.tsx` (+ `.module.scss`) — list ↔ start ↔ editor container.
- `src/components/community/writeTogether/StartDraftForm.tsx` (+ `.module.scss`) — A-style start form.
- `src/components/community/writeTogether/DraftEditor.tsx` (+ `.module.scss`) — B-style editor.
- `src/components/community/writeTogether/ProblemTagPicker.tsx` (+ `.module.scss`) — dropdown + 3-word-code paste.

**Modified**
- `src/services/demo/demoContracts/discussion.ts` — `set_statement` write.
- `src/components/collaboration/flows/discussion/discussionApi.ts` — `setStatement`.
- `src/services/demo/demoContracts/approval.ts` — `coAuthors` on `add_proposal`.
- `src/components/collaboration/flows/voting/approvalApi.ts` — `addProposal` accepts `coAuthors`.
- `src/components/stages/ProblemStage.demo.ts` — `coAuthors` on `ProposeIssueInput`/`proposeCandidateIssue`.
- `src/components/collaboration/flows/discussion/SharedStatement.tsx` — render via `UserIdentity` + profiles + trust.
- `src/components/initiative/stages/ProblemEngage.tsx` (+ `.module.scss`) — copyable problem-code line.
- `src/pages/CommunityView.tsx` — menu item + route.
- `src/services/demo/seedDemoCommunity.ts` (+ `fixtures/`) — sample draft seed.
- `src/services/demo/mockApi.ts` — `DEMO_VERSION` → `global-v7`.
- `src/i18n/fr.ts`, `src/i18n/sw.ts` — new keys at parity.
- `docs/i18n-native-review-candidates.md` — append new strings.

---

## Task 1: Seam — `set_statement` write (start a draft's co-owned statement)

**Files:**
- Modify: `src/services/demo/demoContracts/discussion.ts` (the co-authoring write group, after `add_anchored_comment`)
- Modify: `src/components/collaboration/flows/discussion/discussionApi.ts` (after `getStatement`)

**Interfaces:**
- Produces: contract write `set_statement` `values:{ title, body }` → sets `statement = { title, body, coAuthors:[caller] }`, returns the statement. `discussionApi.setStatement(serverUrl, publicKey, contractId, title, body): Promise<unknown>`.

- [ ] **Step 1: Add the `set_statement` case** in `discussionWrite` (`discussion.ts`), in the co-authoring group:

```ts
    // Start a co-owned draft (Write Together, S3). NEW METHOD FOR OURI:
    // `set_statement(title, body)` initialises the co-owned statement with the
    // caller as sole co-author. Used once when a draft is created; fold-ins via
    // `support_edit` extend `coAuthors` thereafter.
    case 'set_statement': {
      const title = str(method.values?.title);
      const body = str(method.values?.body);
      const s = load(contractId);
      const statement: Statement = { title, body, coAuthors: [caller] };
      writeState<DiscussionState>(contractId, { ...s, statement });
      return statement;
    }
```

- [ ] **Step 2: Add `setStatement`** in `discussionApi.ts` (after `getStatement`):

```ts
export async function setStatement(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  title: string,
  body: string,
) {
  return await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'set_statement', values: { title, body } } as IMethod,
  });
}
```

- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean (no TS errors).
- [ ] **Step 4: Commit.**

```bash
git add src/services/demo/demoContracts/discussion.ts src/components/collaboration/flows/discussion/discussionApi.ts
git commit -m "feat(write-together): set_statement write to start a co-owned draft"
```

---

## Task 2: Seam — optional `coAuthors` on the two submit writes

**Files:**
- Modify: `src/services/demo/demoContracts/approval.ts` (the `Proposal` interface + `add_proposal` case)
- Modify: `src/components/collaboration/flows/voting/approvalApi.ts` (`addProposal`)
- Modify: `src/components/stages/ProblemStage.demo.ts` (`ProposeIssueInput` + `proposeCandidateIssue`)

**Interfaces:**
- Produces:
  - `approvalApi.addProposal(serverUrl, publicKey, contractId, text, coAuthors?: string[])`.
  - `proposeCandidateIssue(input)` where `ProposeIssueInput` gains `coAuthors?: string[]`.

- [ ] **Step 1: Extend the proposal shape + write** in `approval.ts`. Add `coAuthors?: string[]` to `interface Proposal`, and in the `add_proposal` case set it:

```ts
    case 'add_proposal': {
      const text = cleanText(method.values?.text);
      if (!text) return { error: 'Proposal text must be between 1 and 500 characters' };
      const id = 'p' + s.count;
      // coAuthors (Write Together, S3): optional credited co-authors carried from
      // a co-owned draft. FOR OURI: `add_proposal` gains optional `co_authors`.
      const rawCo = method.values?.co_authors;
      const coAuthors = Array.isArray(rawCo) ? rawCo.map((x) => String(x)).filter(Boolean) : [];
      s.proposals[id] = { id, text, author: caller, timestamp: Date.now(), coAuthors };
      s.count += 1;
      writeState(contractId, s);
      return id;
    }
```

- [ ] **Step 2: Extend `addProposal`** in `approvalApi.ts`:

```ts
export async function addProposal(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  text: string,
  coAuthors: string[] = [],
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_proposal', values: { text, co_authors: coAuthors } } as IMethod,
  }));
}
```

- [ ] **Step 3: Thread `coAuthors` through `proposeCandidateIssue`** in `ProblemStage.demo.ts`. Add `coAuthors?: string[]` to `ProposeIssueInput`; destructure it; pass it onto the initiative + the `add_collaboration` payload. Update the dormancy comment to note it's now used by Write Together. The two writes:

```ts
  // in initInitiative(...): add `coAuthors: coAuthors ?? []` to the properties object
  // in the add_collaboration values.collaboration object: add `coAuthors: coAuthors ?? []`
```

Specifically change the signature line and the two object literals:

```ts
export function proposeCandidateIssue(input: ProposeIssueInput): string {
  const { publicKey, communityId, title, description, countries, evidence, whoWhy, sdg, coAuthors } = input;
```
add `coAuthors: coAuthors ?? [],` inside the `initInitiative(initiativeId, { … }, 'problem')` properties object, and inside the `add_collaboration` `collaboration: { … }` object.

- [ ] **Step 4: Build.** Run `npm run build`. Expected: clean. (`initInitiative`'s param type may need `coAuthors?: string[]` added to its properties interface in `demoContracts/initiative.ts` — if `tsc` complains, add the optional field there.)
- [ ] **Step 5: Commit.**

```bash
git add src/services/demo/demoContracts/approval.ts src/components/collaboration/flows/voting/approvalApi.ts src/components/stages/ProblemStage.demo.ts src/services/demo/demoContracts/initiative.ts
git commit -m "feat(write-together): carry optional coAuthors onto submitted problems and solutions"
```

---

## Task 3: `utils/problemCode.ts` — the 3-word code

**Files:**
- Create: `src/utils/problemCode.ts`

**Interfaces:**
- Produces: `codeForId(id: string): string` (e.g. `"brave-otter-river"`); `parseCode(raw: string): string | null` (normalises/validates a pasted code, else null); `resolveCode(raw: string, problems: {id:string; title:string; community:string}[]): {id:string; title:string; community:string} | null`.

- [ ] **Step 1: Create the file** with a curated, safe wordlist (32 each is plenty: 32³ = 32 768 codes) and a deterministic hash:

```ts
// Human-memorable 3-word codes for problems (Write Together, S3).
// Deterministic + derived from the problem's contract id — no storage. Pattern:
// adjective-animal-noun (e.g. "brave-otter-river"). The wordlist is curated to
// be unambiguous and inoffensive; codes are for memorability/word-of-mouth, not
// security. Resolution scans a known set of problems and matches codeForId.

const ADJECTIVES = [
  'brave', 'calm', 'clever', 'bright', 'bold', 'kind', 'swift', 'warm',
  'gentle', 'happy', 'eager', 'fair', 'keen', 'lively', 'merry', 'noble',
  'proud', 'quick', 'sunny', 'tidy', 'wise', 'witty', 'jolly', 'lucky',
  'plucky', 'snug', 'spry', 'steady', 'sturdy', 'sunny', 'trusty', 'vivid',
];
const ANIMALS = [
  'otter', 'falcon', 'heron', 'bison', 'koala', 'lynx', 'gecko', 'tapir',
  'panda', 'robin', 'finch', 'crane', 'moose', 'ibex', 'lemur', 'puffin',
  'badger', 'beaver', 'marten', 'osprey', 'quokka', 'raven', 'salmon', 'turtle',
  'walrus', 'wombat', 'yak', 'zebra', 'dolphin', 'gazelle', 'hare', 'newt',
];
const NOUNS = [
  'river', 'meadow', 'harbor', 'summit', 'canyon', 'orchard', 'lantern', 'compass',
  'beacon', 'garden', 'bridge', 'haven', 'forest', 'valley', 'island', 'spring',
  'harvest', 'anchor', 'ember', 'willow', 'cedar', 'maple', 'cove', 'delta',
  'fjord', 'glade', 'grove', 'ridge', 'shore', 'thicket', 'tundra', 'prairie',
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function codeForId(id: string): string {
  const h = hash(id);
  const a = ADJECTIVES[h % ADJECTIVES.length];
  const b = ANIMALS[(h >>> 5) % ANIMALS.length];
  const c = NOUNS[(h >>> 10) % NOUNS.length];
  return `${a}-${b}-${c}`;
}

/** Normalise a pasted code to the canonical "word-word-word" form, or null. */
export function parseCode(raw: string): string | null {
  const norm = raw.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(norm) ? norm : null;
}

export function resolveCode<T extends { id: string }>(raw: string, problems: T[]): T | null {
  const code = parseCode(raw);
  if (!code) return null;
  return problems.find((p) => codeForId(p.id) === code) ?? null;
}
```

> Note: a couple of words repeat in the lists above intentionally only if you leave them — **dedupe** any accidental duplicates (`sunny` appears twice in ADJECTIVES; replace the second with `zesty`) so every index is distinct.

- [ ] **Step 2: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 3: Sanity-check determinism.** Run:

```bash
node -e "const h=(s)=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}; console.log(h('demo-abc')===h('demo-abc'))"
```
Expected: `true`.

- [ ] **Step 4: Commit.**

```bash
git add src/utils/problemCode.ts
git commit -m "feat(write-together): deterministic 3-word problem codes"
```

---

## Task 4: Adapt `SharedStatement` to `UserIdentity` + profiles + trust

**Files:**
- Modify: `src/components/collaboration/flows/discussion/SharedStatement.tsx`

This relocates the co-authoring hero off the misinfo fixture. Behaviour (edits, 1p1v support, fold-in `target`) is unchanged — only author rendering changes.

**Interfaces:**
- Consumes: `UserIdentity` (`../../../shared`), `useCommunityTrust` (`../../../../hooks/useCommunityTrust`), `state.communities.profiles`.
- Produces: `SharedStatementProps` gains `communityId?: string` (drives the verified shield via trust). The `participantCount`/`canParticipate`/`onChanged`/`contractId`/`statement`/`edits`/`discussionSlot` props are unchanged.

- [ ] **Step 1: Swap the author source.** Replace the `deliberationParticipant` import and `CountryFlag` byline usage with `UserIdentity` + profile lookup + trust. Add to props: `communityId?: string`. At the top of the component:

```tsx
import { Badge, Banner, Button, Modal, EmptyState } from '../../../shared';
import UserIdentity from '../../../shared/UserIdentity';
import { useCommunityTrust } from '../../../../hooks/useCommunityTrust';
// (remove: CountryFlag, deliberationParticipant)
```

Inside the component, read profiles + trust:

```tsx
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const trust = useCommunityTrust(communityId);
  const nameOf = (key: string) => {
    if (key === currentUserKey) return t('deliberation.you', 'You');
    const p = profiles[key];
    const full = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '';
    return full || `${key.slice(0, 8)}…`;
  };
```

- [ ] **Step 2: Render bylines via `UserIdentity`.** In `EditCard` (pass `profiles`/`trust`/`nameOf` down, or lift the byline up), replace the avatar-initials + name + `CountryFlag` block with:

```tsx
<UserIdentity
  name={nameOf(edit.author)}
  countryCode={profiles[edit.author]?.country}
  trustState={trust.trustOf(edit.author)}
  size="sm"
/>
```

Do the same for the co-author credit list (`creditNames.map`) and the resolved-edit `Banner` author name (`nameOf(e.author)`). Remove `person.initials`/`person.country` usages. `EditCard`'s props change from `currentUserKey`-based name derivation to receiving `nameOf`, `profiles`, `trust` (or compute the byline in the parent and pass the rendered `UserIdentity` — simplest is to pass `profiles`, `trust`, `nameOf`).

- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean (watch for unused-import errors from the removed `CountryFlag`/`deliberationParticipant`; remove them).
- [ ] **Step 4: Commit.**

```bash
git add src/components/collaboration/flows/discussion/SharedStatement.tsx
git commit -m "refactor(write-together): SharedStatement renders co-authors via UserIdentity + profiles"
```

---

## Task 5: `writeTogetherApi.ts` — registry + start + submit orchestration

**Files:**
- Create: `src/components/community/writeTogether/writeTogetherApi.ts`

**Interfaces:**
- Consumes: `contractRead`/`contractWrite`/`deployContract` (`src/services/api`), `normalizeStageContract` (`src/services/contracts/initiative`), `setStatement` (Task 1), `addProposal` (Task 2), `proposeCandidateIssue` (Task 2), `getStatement` (existing `discussionApi`).
- Produces: `DraftMode`, `DraftTag`, `DraftEntry`; `getDrafts`, `saveDraft`, `startDraft`, `submitDraft`.

- [ ] **Step 1: Create the module:**

```ts
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
  return (resp as { id?: string })?.id || (resp as string);
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
```

- [ ] **Step 2: Verify `getStatement` exports `Statement`.** In `discussionApi.ts`, `Statement` is already `export interface Statement`. If `getStatement`'s return type isn't `Promise<Statement>`, it returns the normalized statement — confirm the import compiles.
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 4: Commit.**

```bash
git add src/components/community/writeTogether/writeTogetherApi.ts
git commit -m "feat(write-together): draft registry + start/submit orchestration"
```

---

## Task 6: `ProblemTagPicker` — dropdown + 3-word code

**Files:**
- Create: `src/components/community/writeTogether/ProblemTagPicker.tsx` (+ `.module.scss`)

**Interfaces:**
- Consumes: `codeForId`/`resolveCode` (Task 3), `SearchableSelect`, `state.communities.communityCollaborations`, `fetchCollaborations` (`store/slices/communitiesSlice`), `state.user.contracts`, `DraftTag` (Task 5).
- Produces: `ProblemTagPicker` props `{ targetCommunity: string; value?: DraftTag; onChange: (tag: DraftTag | undefined) => void; }`.

- [ ] **Step 1: Create the component.** On mount (and when `state.user.contracts` changes) dispatch `fetchCollaborations` for the target community and for every community the user belongs to (so the code resolver can reach problems across communities). Build the dropdown from the **target** community's initiatives; build the resolver pool from **all** your communities' initiatives.

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCollaborations } from '../../../store/slices/communitiesSlice';
import { useT } from '../../../i18n';
import { SearchableSelect } from '../../shared';
import { codeForId, resolveCode } from '../../../utils/problemCode';
import type { DraftTag } from './writeTogetherApi';
import styles from './ProblemTagPicker.module.scss';

interface ProblemRow { id: string; title: string; community: string; }

export interface ProblemTagPickerProps {
  targetCommunity: string;
  value?: DraftTag;
  onChange: (tag: DraftTag | undefined) => void;
}

const ProblemTagPicker: React.FC<ProblemTagPickerProps> = ({ targetCommunity, value, onChange }) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { serverUrl, publicKey, contracts } = useAppSelector((s) => s.user);
  const collabs = useAppSelector((s) => s.communities.communityCollaborations);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const myCommunityIds = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py').map((c) => c.id),
    [contracts],
  );

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    const ids = new Set([targetCommunity, ...myCommunityIds]);
    ids.forEach((id) => {
      if (id && !Array.isArray(collabs[id])) dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: id }));
    });
  }, [serverUrl, publicKey, targetCommunity, myCommunityIds, collabs, dispatch]);

  const toRows = (id: string): ProblemRow[] =>
    (collabs[id] ?? []).filter((c) => c.type === 'initiative').map((c) => ({ id: c.id, title: c.title, community: id }));

  const targetProblems = useMemo(() => toRows(targetCommunity), [collabs, targetCommunity]);
  const allProblems = useMemo(
    () => Array.from(new Set([targetCommunity, ...myCommunityIds])).flatMap(toRows),
    [collabs, targetCommunity, myCommunityIds],
  );

  const options = targetProblems.map((p) => ({ value: p.id, label: `${p.title}  ·  ${codeForId(p.id)}` }));

  const handlePaste = () => {
    const hit = resolveCode(codeInput, allProblems);
    if (hit) { onChange({ problemId: hit.id, title: hit.title, community: hit.community }); setCodeInput(''); setCodeError(false); }
    else setCodeError(true);
  };

  return (
    <div className={styles.picker}>
      <SearchableSelect
        options={options}
        value={value?.problemId ?? ''}
        onChange={(id) => {
          const p = targetProblems.find((x) => x.id === id);
          onChange(p ? { problemId: p.id, title: p.title, community: p.community } : undefined);
        }}
        placeholder={t('writeTogether.pickProblem', 'Choose a problem…')}
      />
      <div className={styles.codeRow}>
        <input
          className={styles.codeInput}
          value={codeInput}
          onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
          placeholder={t('writeTogether.pasteCode', 'or paste a code · brave-otter-river')}
          aria-label={t('writeTogether.pasteCode', 'or paste a code · brave-otter-river')}
        />
        <button type="button" className={styles.codeBtn} onClick={handlePaste} disabled={!codeInput.trim()}>
          {t('writeTogether.resolveCode', 'Find')}
        </button>
      </div>
      {codeError && <p className={styles.codeError}>{t('writeTogether.codeNotFound', 'No problem found for that code.')}</p>}
      {value && <p className={styles.tagged}>{t('writeTogether.taggedTo', 'Tagged to {title}', { title: value.title })}</p>}
    </div>
  );
};

export default ProblemTagPicker;
```

- [ ] **Step 2: Create `ProblemTagPicker.module.scss`** with token-only rules: `.picker { display:flex; flex-direction:column; gap:8px; }`, `.codeRow { display:flex; gap:8px; }`, `.codeInput { flex:1; min-height:44px; ... }` (reuse the app input pattern), `.codeBtn { min-height:44px; min-width:44px; ... }`, `.codeError { color: var(--color, $error token per DESIGN_SYSTEM); font-size: …; }`, `.tagged { color: $gray-600-or-darker; }`. Follow `DESIGN_SYSTEM.md` for the error/caption token (use `$error-on-surface` / the AA caption color, never `$gray-400`).
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean. (Confirm the `collabs[id]` items expose `type` + `title` + `id`; if the collaboration summary type differs, adjust the `.filter`/`.map`.)
- [ ] **Step 4: Commit.**

```bash
git add src/components/community/writeTogether/ProblemTagPicker.tsx src/components/community/writeTogether/ProblemTagPicker.module.scss
git commit -m "feat(write-together): problem tag picker (dropdown + 3-word code)"
```

---

## Task 7: `StartDraftForm` — the A-style start form

**Files:**
- Create: `src/components/community/writeTogether/StartDraftForm.tsx` (+ `.module.scss`)

**Interfaces:**
- Consumes: `SearchableSelect`, `Button`, `ProblemTagPicker` (Task 6), `startDraft`/`DraftEntry`/`DraftMode`/`DraftTag` (Task 5), `state.user.contracts`, `useAlert`.
- Produces: `StartDraftForm` props `{ communityId: string; onStarted: (draft: DraftEntry) => void; onCancel: () => void; }`.

- [ ] **Step 1: Create the component.** A stacked form: mode segmented toggle → target `SearchableSelect` (your communities, default current) → `ProblemTagPicker` (solution only) → title input → body textarea → Start button. On Start, call `startDraft` and `onStarted(entry)`.

```tsx
import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Button, SearchableSelect } from '../../shared';
import { useAlert } from '../../shared/useAlert';
import ProblemTagPicker from './ProblemTagPicker';
import { startDraft, type DraftEntry, type DraftMode, type DraftTag } from './writeTogetherApi';
import styles from './StartDraftForm.module.scss';

export interface StartDraftFormProps {
  communityId: string;
  onStarted: (draft: DraftEntry) => void;
  onCancel: () => void;
}

const StartDraftForm: React.FC<StartDraftFormProps> = ({ communityId, onStarted, onCancel }) => {
  const t = useT();
  const { serverUrl, publicKey, contracts } = useAppSelector((s) => s.user);
  const { showAlert, alertElement } = useAlert();
  const communities = useMemo(
    () => contracts.filter((c) => c.contract === 'community_contract.py'),
    [contracts],
  );
  const [mode, setMode] = useState<DraftMode>('problem');
  const [target, setTarget] = useState(communityId);
  const [tag, setTag] = useState<DraftTag | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const targetName = communities.find((c) => c.id === target)?.name ?? '';
  const canStart = title.trim() && body.trim() && (mode === 'problem' || !!tag);

  const handleStart = async () => {
    if (!serverUrl || !publicKey || !canStart) return;
    setBusy(true);
    try {
      const entry = await startDraft(serverUrl, publicKey, communityId, {
        mode, target, targetName, tag: mode === 'solution' ? tag : undefined, title: title.trim(), body: body.trim(),
      });
      onStarted(entry);
    } catch (e) {
      console.error('[WriteTogether] start failed', e);
      showAlert(t('writeTogether.startFailed', 'Could not start the draft. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.form}>
      <button className={styles.back} onClick={onCancel} aria-label={t('common.back', 'Back')}><ArrowLeft size={20} /></button>
      <h2 className={styles.heading}>{t('writeTogether.startHeading', 'Start a draft')}</h2>

      <div className={styles.modeToggle} role="radiogroup" aria-label={t('writeTogether.modeLabel', 'Draft type')}>
        {(['problem', 'solution'] as DraftMode[]).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m}
            className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
            onClick={() => setMode(m)}>
            {m === 'problem' ? t('writeTogether.modeProblem', 'Problem') : t('writeTogether.modeSolution', 'Solution')}
          </button>
        ))}
      </div>

      <label className={styles.label}>{t('writeTogether.draftingFor', 'Drafting for')}</label>
      <SearchableSelect
        options={communities.map((c) => ({ value: c.id, label: c.name }))}
        value={target}
        onChange={(id) => { setTarget(id); setTag(undefined); }}
        placeholder={t('writeTogether.chooseCommunity', 'Choose a community…')}
      />

      {mode === 'solution' && (
        <>
          <label className={styles.label}>{t('writeTogether.tagToProblem', 'Tag to a problem')}</label>
          <ProblemTagPicker targetCommunity={target} value={tag} onChange={setTag} />
        </>
      )}

      <label className={styles.label} htmlFor="wt-title">{t('writeTogether.titleLabel', 'Title')}</label>
      <input id="wt-title" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder={t('writeTogether.titlePlaceholder', 'A clear one-line title')} />

      <label className={styles.label} htmlFor="wt-body">{t('writeTogether.bodyLabel', 'First draft')}</label>
      <textarea id="wt-body" className={styles.textarea} rows={5} value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={t('writeTogether.bodyPlaceholder', 'Write the first version — others can suggest edits.')} />

      <Button fullWidth size="lg" loading={busy} disabled={!canStart} onClick={handleStart}>
        {t('writeTogether.start', 'Start draft')}
      </Button>
      {alertElement}
    </div>
  );
};

export default StartDraftForm;
```

- [ ] **Step 2: Create `StartDraftForm.module.scss`** (token-only): `.form` flex column gap 14px; `.back` ≥44px icon button; `.modeToggle` two-button segmented (active = `$primary` tint, ≥44px); `.label` caption (AA color); `.input`/`.textarea` app input pattern (≥44px input). No hardcoded hex.
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 4: Commit.**

```bash
git add src/components/community/writeTogether/StartDraftForm.tsx src/components/community/writeTogether/StartDraftForm.module.scss
git commit -m "feat(write-together): start-draft form (mode/target/tag/title/body)"
```

---

## Task 8: `DraftEditor` — the B-style editor

**Files:**
- Create: `src/components/community/writeTogether/DraftEditor.tsx` (+ `.module.scss`)

**Interfaces:**
- Consumes: `SharedStatement` (Task 4), `ThreadedDiscussion`, `Button`, `Badge`, `getStatement`/`getEdits` (`discussionApi`), `submitDraft`/`saveDraft`/`DraftEntry` (Task 5), `useAlert`, `state.user`.
- Produces: `DraftEditor` props `{ communityId: string; draft: DraftEntry; canParticipate: boolean; onBack: () => void; onChanged: (draft: DraftEntry) => void; }`.

- [ ] **Step 1: Create the component.** Compact setup header (mode pill · for · tag chip) → `SharedStatement` (fetch statement + edits; compute `participantCount` from co-authors ∪ edit authors ∪ supporters) → collapsible "Discuss this draft" rendering `ThreadedDiscussion` against `draft.contractId` → Submit. Re-fetch after writes.

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Badge, Button } from '../../shared';
import { useAlert } from '../../shared/useAlert';
import SharedStatement from '../../collaboration/flows/discussion/SharedStatement';
import ThreadedDiscussion from '../../collaboration/flows/discussion/ThreadedDiscussion';
import { getStatement, getEdits, getComments, type Statement, type EditSuggestion } from '../../collaboration/flows/discussion/discussionApi';
import { submitDraft, type DraftEntry } from './writeTogetherApi';
import styles from './DraftEditor.module.scss';

export interface DraftEditorProps {
  communityId: string;
  draft: DraftEntry;
  canParticipate: boolean;
  onBack: () => void;
  onChanged: (draft: DraftEntry) => void;
}

const DraftEditor: React.FC<DraftEditorProps> = ({ communityId, draft, canParticipate, onBack, onChanged }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { showAlert, alertElement } = useAlert();
  const [statement, setStatement] = useState<Statement>({ title: draft.title, body: '', coAuthors: [] });
  const [edits, setEdits] = useState<EditSuggestion[]>([]);
  const [participants, setParticipants] = useState(1);
  const [showDiscuss, setShowDiscuss] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey) return;
    const [s, e, comments] = await Promise.all([
      getStatement(serverUrl, publicKey, draft.contractId),
      getEdits(serverUrl, publicKey, draft.contractId),
      getComments(serverUrl, publicKey, draft.contractId),
    ]);
    setStatement(s); setEdits(e);
    const ppl = new Set<string>([...s.coAuthors, ...e.flatMap((x) => [x.author, ...x.supporters]), ...comments.map((c) => c.author)]);
    setParticipants(Math.max(1, ppl.size));
  }, [serverUrl, publicKey, draft.contractId]);

  useEffect(() => { refresh(); }, [refresh]);

  const submitted = draft.status === 'submitted';
  const handleSubmit = async () => {
    if (!serverUrl || !publicKey) return;
    setSubmitting(true);
    try {
      const updated = await submitDraft(serverUrl, publicKey, communityId, draft);
      onChanged(updated);
      showAlert(t('writeTogether.submittedNote', 'Submitted to {name}. It now appears in the feed.', { name: draft.targetName }));
    } catch (e) {
      showAlert(e instanceof Error ? e.message : t('writeTogether.submitFailed', 'Could not submit. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.editor}>
      <button className={styles.back} onClick={onBack} aria-label={t('common.back', 'Back')}><ArrowLeft size={20} /></button>

      <div className={styles.setup}>
        <Badge tone={draft.mode === 'problem' ? 'warning' : 'info'} size="sm">
          {draft.mode === 'problem' ? t('writeTogether.modeProblem', 'Problem') : t('writeTogether.modeSolution', 'Solution')}
        </Badge>
        <span className={styles.setupText}>{t('writeTogether.forCommunity', 'for {name}', { name: draft.targetName })}</span>
        {draft.tag && <span className={styles.setupText}>· {draft.tag.title}</span>}
      </div>

      <SharedStatement
        contractId={draft.contractId}
        communityId={communityId}
        statement={statement}
        edits={edits}
        participantCount={participants}
        canParticipate={canParticipate && !submitted}
        onChanged={refresh}
      />

      <div className={styles.discussSection}>
        <button type="button" className={styles.discussToggle} onClick={() => setShowDiscuss((v) => !v)} aria-expanded={showDiscuss}>
          <MessageCircle size={16} aria-hidden /> {t('writeTogether.discuss', 'Discuss this draft')}
          {showDiscuss ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
        </button>
        {showDiscuss && (
          <ThreadedDiscussion contractId={draft.contractId} communityId={communityId} canParticipate={canParticipate && !submitted}
            emptyHint={t('writeTogether.discussEmpty', 'Talk through this draft together.')} />
        )}
      </div>

      {submitted ? (
        <p className={styles.submittedBanner}>{t('writeTogether.alreadySubmitted', 'Submitted to {name}.', { name: draft.targetName })}</p>
      ) : (
        <Button fullWidth size="lg" loading={submitting} onClick={handleSubmit} disabled={!canParticipate}>
          {t('writeTogether.submitTo', 'Submit to {name}', { name: draft.targetName })}
        </Button>
      )}
      {alertElement}
    </div>
  );
};

export default DraftEditor;
```

- [ ] **Step 2: Create `DraftEditor.module.scss`** (token-only): `.editor` flex column gap 16px; `.back` ≥44px; `.setup` flex row wrap, gap 8px, a `$gray-50`/secondary surface card padding; `.setupText` caption color; `.discussToggle` ≥44px row with border-top; `.submittedBanner` success tone. No hardcoded hex.
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean. (Confirm `getComments` is exported from `discussionApi`; it is.)
- [ ] **Step 4: Commit.**

```bash
git add src/components/community/writeTogether/DraftEditor.tsx src/components/community/writeTogether/DraftEditor.module.scss
git commit -m "feat(write-together): draft editor (compact setup + co-owned statement + discuss + submit)"
```

---

## Task 9: `WriteTogetherPage` + CommunityView wiring

**Files:**
- Create: `src/components/community/writeTogether/WriteTogetherPage.tsx` (+ `.module.scss`)
- Modify: `src/pages/CommunityView.tsx`

**Interfaces:**
- Consumes: `getDrafts`/`DraftEntry` (Task 5), `StartDraftForm` (Task 7), `DraftEditor` (Task 8), `UserIdentity`, `Badge`, `Button`, `EmptyState`, `InfoDisclosure`, `state.user`, `state.communities.communityMembers`, `useCommunityTrust`.
- Produces: default export `WriteTogetherPage` props `{ communityId: string }`.

- [ ] **Step 1: Create `WriteTogetherPage`.** Local `view` state; fetch drafts via `getDrafts`; list rows tap → editor; "Start a draft" → start form. `canParticipate` = the user is in `communityMembers[communityId]`.

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Badge, Button, EmptyState, InfoDisclosure, UserIdentity } from '../../shared';
import { useCommunityTrust } from '../../../hooks/useCommunityTrust';
import StartDraftForm from './StartDraftForm';
import DraftEditor from './DraftEditor';
import { getDrafts, type DraftEntry } from './writeTogetherApi';
import styles from './WriteTogetherPage.module.scss';

type View = { mode: 'list' } | { mode: 'start' } | { mode: 'edit'; draftId: string };

const WriteTogetherPage: React.FC<{ communityId: string }> = ({ communityId }) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const members = useAppSelector((s) => s.communities.communityMembers[communityId]);
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const trust = useCommunityTrust(communityId);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  const canParticipate = !!publicKey && Array.isArray(members) && members.includes(publicKey);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey) return;
    try { setDrafts(await getDrafts(serverUrl, publicKey, communityId)); }
    catch (e) { console.error('[WriteTogether] load drafts', e); }
  }, [serverUrl, publicKey, communityId]);

  useEffect(() => { refresh(); }, [refresh]);

  const current = useMemo(
    () => (view.mode === 'edit' ? drafts.find((d) => d.id === view.draftId) : undefined),
    [view, drafts],
  );

  if (view.mode === 'start') {
    return (
      <div className={styles.page}>
        <StartDraftForm communityId={communityId}
          onStarted={(d) => { setDrafts((prev) => [d, ...prev]); setView({ mode: 'edit', draftId: d.id }); }}
          onCancel={() => setView({ mode: 'list' })} />
      </div>
    );
  }

  if (view.mode === 'edit' && current) {
    return (
      <div className={styles.page}>
        <DraftEditor communityId={communityId} draft={current} canParticipate={canParticipate}
          onBack={() => { refresh(); setView({ mode: 'list' }); }}
          onChanged={(d) => setDrafts((prev) => prev.map((x) => (x.id === d.id ? d : x)))} />
      </div>
    );
  }

  const nameOf = (pk: string) => {
    const p = profiles[pk];
    return (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '') || `${pk.slice(0, 8)}…`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>{t('writeTogether.title', 'Write together')}</h2>
          <InfoDisclosure label={t('writeTogether.explainerTitle', 'How writing together works')}>
            <p>{t('writeTogether.explainerBody', 'Draft a problem or solution as a community — write a first version, let others suggest edits that fold in by vote, then submit it to a community’s feed.')}</p>
          </InfoDisclosure>
        </div>
        <p className={styles.subtitle}>{t('writeTogether.subtitle', 'Co-author a problem or solution, then submit it to the feed.')}</p>
      </div>

      <Button leftIcon={<PlusCircle size={18} />} onClick={() => setView({ mode: 'start' })} disabled={!canParticipate}>
        {t('writeTogether.startDraft', 'Start a draft')}
      </Button>

      {drafts.length === 0 ? (
        <EmptyState icon={<PlusCircle size={32} aria-hidden />} title={t('writeTogether.emptyTitle', 'No drafts yet')}
          message={t('writeTogether.empty', 'Start one and write it together.')} />
      ) : (
        <ul className={styles.list}>
          {drafts.map((d) => (
            <li key={d.id}>
              <button type="button" className={styles.row} onClick={() => setView({ mode: 'edit', draftId: d.id })}>
                <div className={styles.rowTop}>
                  <Badge tone={d.mode === 'problem' ? 'warning' : 'info'} size="sm">
                    {d.mode === 'problem' ? t('writeTogether.modeProblem', 'Problem') : t('writeTogether.modeSolution', 'Solution')}
                  </Badge>
                  <span className={styles.status}>{d.status === 'submitted' ? t('writeTogether.statusSubmitted', 'Submitted') : t('writeTogether.statusDraft', 'Draft')}</span>
                </div>
                <span className={styles.rowTitle}>{d.title}</span>
                <span className={styles.rowMeta}>{t('writeTogether.forCommunity', 'for {name}', { name: d.targetName })}{d.tag ? ` · ${d.tag.title}` : ''}</span>
                <UserIdentity name={nameOf(d.author)} countryCode={profiles[d.author]?.country} trustState={trust.trustOf(d.author)} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WriteTogetherPage;
```

- [ ] **Step 2: Create `WriteTogetherPage.module.scss`** (token-only): `.page` padding + flex column gap 16px; `.header`/`.titleRow` (flex, h2 + (i)); `.subtitle` caption; `.list` unstyled; `.row` full-width left-aligned card button (≥44px, border, radius-lg, hover); `.rowTop` flex row; `.status` caption; `.rowTitle` 15px/500; `.rowMeta` caption. No hardcoded hex.
- [ ] **Step 3: Wire into `CommunityView.tsx`.** (a) import the icon `PenLine` in the lucide import; (b) add the lazy import near the others: `const WriteTogetherPage = lazy(() => import('../components/community/writeTogether/WriteTogetherPage'));`; (c) add the menu item right after the `create-initiative` item:

```tsx
    { key: 'write-together', icon: PenLine, label: t('community.menu.writeTogether', 'Write together'), onClick: closeAfter(() => navigate(`/community/${communityId}/write-together`)) },
```
(d) add the route inside `<Routes>` (near `create-initiative`):

```tsx
              <Route path="write-together" element={<WriteTogetherPage communityId={communityId!} />} />
```

- [ ] **Step 4: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 5: Preview (orchestrator).** `npm run dev`; at 360px light + dark: open a community → menu → Write together → list renders → "Start a draft" → start a problem draft for the current community → editor opens → suggest + support an edit (co-author credited) → Discuss posts a comment → Submit → confirm it appears in the feed. Repeat for a solution draft for another community via dropdown and via a pasted code.
- [ ] **Step 6: Commit.**

```bash
git add src/components/community/writeTogether/WriteTogetherPage.tsx src/components/community/writeTogether/WriteTogetherPage.module.scss src/pages/CommunityView.tsx
git commit -m "feat(write-together): list/detail page + community menu entry and route"
```

---

## Task 10: Problem code on `ProblemEngage` (word-of-mouth discoverability)

**Files:**
- Modify: `src/components/initiative/stages/ProblemEngage.tsx` (+ `.module.scss`)

**Interfaces:**
- Consumes: `codeForId` (Task 3). `ProblemEngage` already receives the initiative id (the contract/collaboration id) — use that.

- [ ] **Step 1: Add a copyable code line.** Import `codeForId`; render a small line (near the CTA buttons) showing the problem's code with a copy affordance:

```tsx
import { codeForId } from '../../../utils/problemCode';
// …
<button type="button" className={styles.codeChip}
  onClick={() => navigator.clipboard?.writeText(codeForId(initiativeId))}
  aria-label={t('writeTogether.copyCode', 'Copy problem code')}>
  <span className={styles.codeLabel}>{t('writeTogether.problemCodeLabel', 'Problem code')}</span>
  <code className={styles.codeValue}>{codeForId(initiativeId)}</code>
  <Copy size={14} aria-hidden />
</button>
```
(Use the prop that holds the initiative id in `ProblemEngage`; if it's named `collaborationId`/`initiativeId`, use that. `Copy` from `lucide-react`.)

- [ ] **Step 2: Add `.codeChip`/`.codeLabel`/`.codeValue` SCSS** (token-only, ≥44px touch, mono for the value via `$font-mono` if defined else default). AA caption color.
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 4: Preview (orchestrator).** Problem card shows `Problem code · brave-otter-river`; tapping copies it; the same code resolves in the Write-Together tag picker.
- [ ] **Step 5: Commit.**

```bash
git add src/components/initiative/stages/ProblemEngage.tsx src/components/initiative/stages/ProblemEngage.module.scss
git commit -m "feat(write-together): surface the 3-word problem code on the problem card"
```

---

## Task 11: Seed a sample draft + bump `DEMO_VERSION`

**Files:**
- Modify: `src/services/demo/seedDemoCommunity.ts`
- Modify: `src/services/demo/mockApi.ts` (`DEMO_VERSION`)
- Possibly modify: a fixture file for the seed copy (or inline in the seeder)

**Interfaces:**
- Consumes: `mockDeployDirect` (`mockApi`), the discussion contract's `writeState`/`set_statement` shape, the community `set_property` write.

- [ ] **Step 1: Seed one in-progress draft** on the Global Health Network community inside `seedDemoCommunity` (after its initiatives are seeded). Deploy a `discussion_contract.py` draft contract, seed a statement + 2 co-authors + one open edit (one supporter short of fold-in) + 2–3 thread comments (reuse the `initDiscussion`/`writeState` pattern or the contract writes), then register a `wtdraft_<id>` property on the community with a `DraftEntry`-shaped JSON (`mode:'solution'`, `target` = the same community id, `tag` = one of its problems, `status:'draft'`). Keep authors within the seeded personas so `UserIdentity` resolves names/flags. Example registry write:

```ts
const draftContractId = mockDeployDirect({ name: 'wt_draft_seed', contract: 'discussion_contract.py', parentId: communityId, kind: 'stage' }).id;
// seed its statement/edits/comments via writeState (mirror initDiscussion shape)
const draftEntry = { id: draftContractId, contractId: draftContractId, mode: 'solution', target: communityId, targetName: '<community name>', tag: { problemId: '<a seeded problem id>', title: '<that problem title>', community: communityId }, title: '<draft title>', status: 'draft', author: '<a persona pk>', createdAt: Date.now() };
communityWrite(communityId, { name: 'set_property', values: { key: `wtdraft_${draftContractId}`, value: JSON.stringify(draftEntry) } } as IMethod, ownerPk);
```
(Use the seeder's existing community write + the actual seeded problem id/title for the tag — resolve from the initiatives just seeded for that community.)

- [ ] **Step 2: Bump `DEMO_VERSION`** in `mockApi.ts:17`: `const DEMO_VERSION = 'global-v7';`.
- [ ] **Step 3: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 4: Preview (orchestrator).** Fresh load re-seeds; Global Health → Write together → the seeded draft shows in the list with a co-author and opens with a statement + open edit + a couple of comments.
- [ ] **Step 5: Commit.**

```bash
git add src/services/demo/seedDemoCommunity.ts src/services/demo/mockApi.ts
git commit -m "feat(write-together): seed a sample draft; DEMO_VERSION -> global-v7"
```

---

## Task 12: i18n fr + sw parity + native-review candidates

**Files:**
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`
- Modify: `docs/i18n-native-review-candidates.md`

**Interfaces:**
- Consumes: every `t('writeTogether.*', …)` and `t('community.menu.writeTogether', …)` key added in Tasks 6–11.

- [ ] **Step 1: Collect the new keys.** Grep the new/modified files for `t('writeTogether.` and `t('community.menu.writeTogether'`:

```bash
grep -rhoE "t\('(writeTogether|community\.menu\.writeTogether)[^']*'" src | sed -E "s/t\('//; s/'$//" | sort -u
```

- [ ] **Step 2: Add each key to `fr.ts` and `sw.ts`** with a translation (mirror the en default's meaning; keep `{name}`/`{title}` placeholders verbatim). The 3-word **wordlist stays English** (a spoken shared code) — do not translate code words.
- [ ] **Step 3: Parity check.** Run:

```bash
cd "$(git rev-parse --show-toplevel)" && \
diff <(grep -oE "^[[:space:]]*'[^']+':" src/i18n/fr.ts | tr -d " " | sort -u) \
     <(grep -oE "^[[:space:]]*'[^']+':" src/i18n/sw.ts | tr -d " " | sort -u)
```
Expected: **no output** (fr and sw key sets identical).

- [ ] **Step 4: Cross-check coverage.** Confirm every key from Step 1 exists in both fr.ts and sw.ts (no missing, no orphan-added).
- [ ] **Step 5: Append to `docs/i18n-native-review-candidates.md`** the new `writeTogether.*` strings (note the wordlist is intentionally English).
- [ ] **Step 6: Build.** Run `npm run build`. Expected: clean.
- [ ] **Step 7: Commit.**

```bash
git add src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "i18n(write-together): fr/sw parity for writeTogether.* strings"
```

---

## Self-Review

**Spec coverage:**
- §4.1 menu + route → Task 9. §4.2 page structure → Task 9. §4.3 list → Task 9. §4.4 start form → Task 7. §4.5 editor (SharedStatement reuse + ThreadedDiscussion + submit) → Tasks 4, 8. §4.6 tagging + code + problem-card surfacing → Tasks 3, 6, 10. §4.7 submission → Tasks 2, 5. §4.8 seam (`set_statement`, `coAuthors`, registry) → Tasks 1, 2, 5. §4.9 seed + DEMO_VERSION → Task 11. §6 i18n → Task 12. All covered.
- Decision ⑤ (leave dead code / no SolutionEngage / no cleanups) honored — no task touches the dormant pieces or `SolutionEngage`.

**Placeholder scan:** SCSS steps describe class lists + token rules rather than full literal SCSS — acceptable (DESIGN_SYSTEM tokens are the source of truth and pixel SCSS is mechanical); every TS/TSX step carries real code. The seed (Task 11) and the SCSS files are the only "fill following the cited pattern" steps; both name the exact pattern to copy.

**Type consistency:** `DraftEntry`/`DraftTag`/`DraftMode` defined in Task 5, consumed identically in Tasks 6–9. `setStatement`/`addProposal`/`proposeCandidateIssue` signatures defined in Tasks 1–2 match their calls in Task 5. `SharedStatement` `communityId?` added in Task 4, passed in Task 8. `codeForId`/`resolveCode` defined in Task 3, used in Tasks 6, 10.

**Risks flagged in the spec:** SharedStatement adaptation (Task 4) and cross-community solutions-contract resolution (Task 5) — both have explicit, grounded code mirroring existing patterns (`useFlowContract` shared mode; `UserIdentity` usage in `ThreadedDiscussion`).
