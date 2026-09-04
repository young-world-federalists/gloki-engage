# Prompt 1 — Causes forum, discussion status pill, impact assessment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Repo-specific:** load `gloki-change-control` + `gloki-session-lifecycle` first; subagents run SEQUENTIALLY (slow USB drive); implementer subagents verify with `npx tsc -b` / `npm run build` only — the controller drives the ONE preview browser.

**Goal:** Turn each problem's Discussion into a *Causes* forum with root-comment up/down ranking, show a five-band discussion-status pill on every initiative card, carry the top-15 causes into Solutions with a required cause alignment, and let three top-ten writers attach a structured impact assessment that voters see next to metrics and implementation measures.

**Architecture:** All data crosses the seam (`src/services/api.ts`) unchanged; new contract methods are added to the demo stubs on `ui` and delivered to Ouri as a Python patch (the real `gloki_engage_initiative_contract.py` lives only on `server-side`). Ranking, status and writer eligibility are pure client utils in `src/utils/` reading data the contract already returns. New read-only surfaces resolve contracts with `resolveInitiativeStageContract` and never deploy.

**Tech Stack:** React 19 + TypeScript + Redux Toolkit + SCSS modules (tokens in `src/styles/variables.scss`), Vite, lucide-react, `t()` i18n with fr/sw parity, demo layer under `src/services/demo/`.

**Spec:** `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` (§2, §4) and the rulings in `docs/superpowers/specs/2026-09-02-s34-decision-record.md` (D1–D12, F1–F10). Cite rulings by number in commit messages.

## Global Constraints

- Seam rule: components import only from `src/services/api.ts` wrappers / flow `*Api.ts` files; never from `src/services/demo/*` (existing `isDemoContract` imports are Ouri's; do not add more).
- Wire names byte-match the Python: `vote_comment(comment_id, direction)`, `get_comment_votes()`, `add_proposal(..., cause_id)`, `add_impact_assessment(proposal_id, target, targets_cause, mechanism, broader_effects, risks, opportunity_costs, time_horizon)`, `get_impact_assessments()`. Storage: flat composite-keyed collections `comment_votes` (key `caller:comment_id`) and `impact_assessments` (key `proposal_id:caller`) — F1.
- Root comments only for votes, enforced in the contract (D4). Replies keep `like_comment`.
- Status bands (D6/F3): `New / Contested / Divided / Converging / Consensus`, tones `neutral / warning / info / primary / success`, `STATUS_VOTE_FLOOR = 10`, `MIN_VOTED_COMMENTS = 3`, thresholds `0.25 / 0.5 / 0.75`. No red.
- Cause alignment (D5): required + pre-selected #1 when ≥1 ranked cause; omitted (`cause_id: ''`) when none. `causeId` immutable (F2).
- Assessor eligibility (D7/F7/F8/D12): top 10 by `total = causeScore + solutionScore`; filters `causeScore > 0`, not author/co-author of the solution, not author/co-author of any solution sharing its `causeId`; ladder `strict → no-floor → top-25 → any-verified`; self-dealing never relaxed; UI-gated only.
- Every user-facing string: `t('ns.key', 'English default')` + the same key in `src/i18n/fr.ts` and `src/i18n/sw.ts`; run `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` before each commit.
- No ad-hoc style values (tokens only); `grep -rn 'color: \$gray-400' src --include='*.module.scss'` must match no text colour.
- `npx tsc -b` and `npm run build` clean before every commit (`noUnusedLocals` is on: an unused import fails the build).
- Commit prefix `feat(s35)` / `chore(s35)` / `docs(s35)`; end commit messages with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never push without Eston's explicit go.
- DEMO_VERSION (`src/services/demo/mockApi.ts:17`, currently `'global-v17'`) bumps to `'global-v18'` exactly once, in Task 12.

---

## File map

| File | Responsibility |
|---|---|
| `docs/contracts/s34-initiative-contract-additions.py` (new) | The Python methods Ouri adds to `gloki_engage_initiative_contract.py` on `server-side` — the wire truth for this plan |
| `docs/FOR_OURI_seam.md` | Hand-off doc: new "S35 addendum" section + D12 note |
| `src/services/demo/demoContracts/discussion.ts` | Demo stub: `comment_votes` collection, `vote_comment`, `get_comment_votes` |
| `src/services/demo/demoContracts/approval.ts` | Demo stub: `cause_id` on `add_proposal`, `impact_assessments` collection, `add_impact_assessment`, `get_impact_assessments` |
| `src/services/demo/fixtures/deliberation.ts` | Seeded votes, `causeId` on seeded solutions, two seeded assessments |
| `src/services/demo/seedDemoCommunity.ts` | Wires the new fixtures into the seed |
| `src/components/collaboration/flows/discussion/discussionApi.ts` | `voteComment`, `getCommentVotes`, `CommentVote` type |
| `src/components/collaboration/flows/voting/approvalApi.ts` | `causeId` param, `addImpactAssessment`, `getImpactAssessments`, `ImpactAssessment` type |
| `src/utils/causes.ts` (new) | `tallyVotes`, `rankCauses`, `TOP_CAUSES_CARRIED`, `TOP_CAUSES_ALIGN` |
| `src/utils/discussionStatus.ts` (new) | `computeDiscussionStatus` + constants + band metadata |
| `src/utils/writerRank.ts` (new) | `rankWriters`, `eligibleAssessors`, `canAssess`, ladder |
| `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` (+ `.module.scss`) | Up/down on roots, rank chips, hint, copy |
| `src/components/initiative/DiscussionPill.tsx` (+ `.module.scss`) | "Causes" label + status word |
| `src/components/initiative/DiscussionStatusPill.tsx` (new, + `.module.scss`) | Standalone status pill for cards |
| `src/components/initiative/TopCausesPanel.tsx` (new, + `.module.scss`) | Top-15 panel on the Solutions board |
| `src/components/initiative/ImpactAssessmentForm.tsx`, `ImpactAssessmentCard.tsx` (new, + scss) | Seven-field form and read view |
| `src/components/initiative/stages/SolutionsBoard.tsx` | Cause select, chips, assess CTA, assessments count |
| `src/components/collaboration/flows/voting/QVFlow.tsx`, `src/components/initiative/stages/VotePreview.tsx` | Three-fold evidence: measures · metrics · impact assessments |
| `src/components/onboarding/welcomeHints.ts` | New hint id `causesVoteHint` (existing dismiss-once pattern; F6) |
| `src/i18n/fr.ts`, `src/i18n/sw.ts` | Parity for every new key |
| `DESIGN_SYSTEM.md` | Status-pill row + five-band definition |
| `CLAUDE.md`, `.claude/skills/{gloki-change-control,gloki-session-lifecycle,gloki-build-env-run}/SKILL.md` | Deploy-branch model (D11) |

---

## Wave 0 — housekeeping (D11, W0 items)

### Task 1: Deploy-branch model in the docs of record

**Files:**
- Modify: `CLAUDE.md` (the "Branch model & data-layer seam" and "Deployment" sections)
- Modify: `.claude/skills/gloki-change-control/SKILL.md` (Rule 1 + the `ui` branch jargon row)
- Modify: `.claude/skills/gloki-session-lifecycle/SKILL.md` (Push gate row + Step 7)
- Modify: `.claude/skills/gloki-build-env-run/SKILL.md` (deploy branch mentions)

- [ ] **Step 1: Find every stale claim**

Run: `grep -n "push to .ui. IS\|Push = production\|push = deploy\|source branch .ui.\|branches: \[ui\]\|deploys on every push" CLAUDE.md .claude/skills/gloki-change-control/SKILL.md .claude/skills/gloki-session-lifecycle/SKILL.md .claude/skills/gloki-build-env-run/SKILL.md`
Expected: a handful of hits; each becomes an edit below.

- [ ] **Step 2: Rewrite CLAUDE.md**

Replace the first line under `# Communities2` and the Deployment bullets with:

```markdown
**Branch:** `ui` — the UI branch (built against stubs). **Deploys come from Ouri's `server-side` branch** (since 2026-09-02): Ouri merges `ui` → `server-side`; GitHub Pages builds on every push to `server-side`. A push to `ui` does NOT deploy.
```

```markdown
## Deployment

- GitHub Pages builds from **`server-side`** (`.github/workflows/deploy.yml`, trigger `push: branches: [server-side]` + `workflow_dispatch`). `ui` → `server-side` is Ouri's merge (PRs #22/#23 precedent).
- `public/404.html` handles SPA deep-link routing
- **Production build runs `tsc -b`** — fix all TS errors before pushing; Ouri's merge inherits any red build
- Contracts are immutable after deploy — new methods require new communities
- The real initiative contract lives on `server-side` at `src/assets/contracts/gloki_engage_initiative_contract.py`; contract additions made on `ui` are delivered as a patch under `docs/contracts/` + `docs/FOR_OURI_seam.md`
```

- [ ] **Step 3: Rewrite Rule 1 in the change-control skill and the push-gate rows in the lifecycle + build-env skills** so they read: "A push to `ui` no longer deploys; Ouri merges `ui` into `server-side`, which deploys. Rule 1 still holds: never push without Eston's explicit go, because Ouri may merge at any time." Update the jargon table row for `ui`.

- [ ] **Step 4: Verify no stale claim remains**

Run the Step-1 grep again. Expected: zero hits.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md .claude/skills/gloki-change-control/SKILL.md .claude/skills/gloki-session-lifecycle/SKILL.md .claude/skills/gloki-build-env-run/SKILL.md
git commit -m "docs(s35): deploy now comes from server-side, not ui (D11)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 2: Demo stub defects that block this plan

**Files:**
- Modify: `src/services/demo/demoContracts/discussion.ts:146` (`parentId` read)
- Modify: `src/services/demo/demoContracts/initiative.ts` (add `get_roles`, `endorse_expert`, `unendorse_expert` handlers)

**Interfaces:**
- Produces: demo `add_comment` honours `parent_id`; demo `get_roles` returns `{ author, coAuthors, experts, endorsementCounts, endorsements, status, mergedInto }` matching `src/services/initiativeRoles.ts`.

- [ ] **Step 1: Fix the reply flattening**

In `discussion.ts` `add_comment`, replace
```ts
parentId: (method.values?.parentId as string | null | undefined) ?? null,
```
with
```ts
// discussionApi sends `parent_id` (wire name); accept the legacy camelCase too.
parentId: ((method.values?.parent_id ?? method.values?.parentId) as string | null | undefined) || null,
```

- [ ] **Step 2: Add roles handlers to `demoContracts/initiative.ts`**

Read the file first; the state object needs a `roles` field. Add to the state type:
```ts
roles?: { coAuthors: string[]; experts: string[]; endorsements: Record<string, string[]>; endorsementCounts: Record<string, number>; status: 'active' | 'merged_into'; mergedInto: string | null };
```
Add read case:
```ts
case 'get_roles': {
  const r = s.roles ?? { coAuthors: [], experts: [], endorsements: {}, endorsementCounts: {}, status: 'active', mergedInto: null };
  return { author: s.author ?? '', ...r };
}
```
Add write cases mirroring the real contract (`endorse_expert`/`unendorse_expert` take `public_key`; recount `endorsementCounts[public_key]` = number of endorsers whose list contains it; `endorse_expert` also appends to `experts`).

- [ ] **Step 3: Verify**

Run: `npx tsc -b && npm run build` → clean. Preview (controller): post a reply in the databroker discussion → it nests under its parent after refresh.

- [ ] **Step 4: Commit**

```bash
git add src/services/demo/demoContracts/discussion.ts src/services/demo/demoContracts/initiative.ts
git commit -m "chore(s35): demo stubs — honour parent_id on add_comment; add get_roles/endorse_expert handlers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Wave 1 — Causes: votes, ranking, rename (D3, D4, F1, F6)

### Task 3: Contract patch for Ouri + FOR_OURI addendum

**Files:**
- Create: `docs/contracts/s34-initiative-contract-additions.py`
- Modify: `docs/FOR_OURI_seam.md` (new section "### S35 addendum — Causes, status, impact assessment")

- [ ] **Step 1: Write the patch file** (this is the wire truth; the demo stubs in Tasks 4 and 9 mirror it exactly)

```python
# Additions to gloki_engage_initiative_contract.py (server-side). Additive only.
# S35 / rulings D4, D5, F1, F2, D12. Apply inside class GlokiEngageInitiative.

# __init__ additions
#     self.comment_votes = Storage('comment_votes')          # F1: flat, key = caller + ':' + comment_id
#     self.impact_assessments = Storage('impact_assessments') # F1: flat, key = proposal_id + ':' + caller

# ─── Causes: up/down on ROOT comments only (D4) ─────────────────────────────
def vote_comment(self, comment_id, direction):
    # direction: 'up' | 'down' | 'none' ('none' removes the caller's vote). 1p1v.
    caller = master()
    if comment_id not in self.comments:
        return
    if self.comments[comment_id]['parentId']:
        return  # replies are not causes; they keep like_comment
    key = caller + ':' + comment_id
    if direction == 'none':
        if key in self.comment_votes:
            del self.comment_votes[key]
        return
    if direction != 'up' and direction != 'down':
        return
    self.comment_votes[key] = {'voter': caller, 'commentId': comment_id, 'direction': direction}

def get_comment_votes(self):
    return {str(key): self.comment_votes[key].get_dict() for key in self.comment_votes}

# ─── Solutions: cause alignment (D5, F2) — replace the existing signature ────
def add_proposal(self, text, co_authors, commitments, sources, metrics, cause_id=''):
    proposal_id = self.proposals.append({
        'text': text,
        'author': master(),
        'timestamp': timestamp(),
        'coAuthors': co_authors,
        'commitments': commitments,
        'sources': sources,
        'metrics': metrics,
        'causeId': cause_id,          # immutable once written (F2); '' = proposed before any cause was ranked
        'expertReviewRequests': [],
        'expertReviews': [],
        'mergeSuggestions': [],
        'mergedInto': None,
    })
    self.proposals[proposal_id]['id'] = proposal_id
    return proposal_id

# ─── Impact assessment (W4). Eligibility is UI-gated (D12); the contract enforces
#     only: proposal exists, max 3 per proposal, one per author. ────────────────
def add_impact_assessment(self, proposal_id, target, targets_cause, mechanism,
                          broader_effects, risks, opportunity_costs, time_horizon):
    caller = master()
    if proposal_id not in self.proposals:
        return
    existing = [k for k in self.impact_assessments if self.impact_assessments[k]['proposalId'] == proposal_id]
    if len(existing) >= 3:
        return
    for k in existing:
        if self.impact_assessments[k]['author'] == caller:
            return
    key = proposal_id + ':' + caller
    self.impact_assessments[key] = {
        'author': caller, 'proposalId': proposal_id, 'timestamp': timestamp(),
        'target': target, 'targetsCause': targets_cause, 'mechanism': mechanism,
        'broaderEffects': broader_effects, 'risks': risks,
        'opportunityCosts': opportunity_costs, 'timeHorizon': time_horizon,
    }

def get_impact_assessments(self):
    return {str(key): self.impact_assessments[key].get_dict() for key in self.impact_assessments}
```

- [ ] **Step 2: FOR_OURI addendum** — add after the "Conviction / backing" section:

```markdown
### S35 addendum — Causes, discussion status, impact assessment (`docs/contracts/s34-initiative-contract-additions.py`)

Wire truth for these methods is the patch file above (apply to `gloki_engage_initiative_contract.py` on `server-side`). Rulings: `docs/superpowers/specs/2026-09-02-s34-decision-record.md`.

- **`vote_comment(comment_id, direction)`** — `'up' | 'down' | 'none'`; ROOT comments only (the contract returns without writing when the comment has a `parentId`). Storage: flat `comment_votes` collection keyed `caller + ':' + comment_id` → `{voter, commentId, direction}`. Read: **`get_comment_votes()`**. Ranking (top 15 / top 5) and the five-band discussion status are computed client-side from this read; no status method on chain.
- **`add_proposal(..., cause_id='')`** — trailing optional arg, stored as `causeId`; immutable; `''` means "proposed before any cause was ranked".
- **`add_impact_assessment(proposal_id, target, targets_cause, mechanism, broader_effects, risks, opportunity_costs, time_horizon)`** — flat `impact_assessments` collection keyed `proposal_id + ':' + caller`; contract guards: proposal exists, max 3 per proposal, one per author. Read: **`get_impact_assessments()`**.
- **D12 (on the record):** assessor eligibility (top-10 writers, `causeScore > 0`, no self-dealing on the same solution or the same cause) and cause alignment are **UI-gated only** in this wave, exactly like the `add_expert_review` expert gate. Server-side eligibility checks belong on the contract roadmap.
- S13 gap (still open): `set_property` / `get_properties` on the initiative contract are used by the UI and undocumented here.
```

- [ ] **Step 3: Commit**

```bash
git add docs/contracts/s34-initiative-contract-additions.py docs/FOR_OURI_seam.md
git commit -m "docs(s35): contract patch for Ouri + FOR_OURI S35 addendum (F1, D4, D5, D12)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 4: Demo stub — `vote_comment` / `get_comment_votes`

**Files:**
- Modify: `src/services/demo/demoContracts/discussion.ts`

**Interfaces:**
- Produces: read `get_comment_votes` → `Record<string, { voter: string; commentId: string; direction: 'up' | 'down' }>`; write `vote_comment` with `values: { comment_id, direction }`.

- [ ] **Step 1: Extend the state type**

Next to `comments: DiscussionComment[]` in `DiscussionState` add:
```ts
commentVotes?: Record<string, { voter: string; commentId: string; direction: 'up' | 'down' }>; // key `${voter}:${commentId}` (F1)
```

- [ ] **Step 2: Add the read case** in `discussionRead`:

```ts
case 'get_comment_votes':
  return s.commentVotes ?? {};
```

- [ ] **Step 3: Add the write case** in `discussionWrite`, after `like_comment`:

```ts
// S35 (D4/F1): 1p1v up/down on ROOT comments only — replies return without writing.
case 'vote_comment': {
  const id = method.values?.comment_id as string | undefined;
  const direction = method.values?.direction as 'up' | 'down' | 'none' | undefined;
  if (!id || !direction) return null;
  const target = (load(contractId).comments ?? []).find((c) => c.id === id);
  if (!target || target.deleted || target.parentId) return null;
  const key = `${caller}:${id}`;
  updateState<DiscussionState>(contractId, (s) => {
    const votes = { ...(s.commentVotes ?? {}) };
    if (direction === 'none') delete votes[key];
    else votes[key] = { voter: caller, commentId: id, direction };
    return { ...defaultState(), ...s, commentVotes: votes };
  });
  return null;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc -b`. Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/services/demo/demoContracts/discussion.ts
git commit -m "feat(s35): demo stub vote_comment/get_comment_votes, roots only (D4, F1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 5: API wrappers + pure ranking util

**Files:**
- Modify: `src/components/collaboration/flows/discussion/discussionApi.ts`
- Create: `src/utils/causes.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface CommentVote { voter: string; commentId: string; direction: 'up' | 'down' }
  export async function voteComment(serverUrl, publicKey, contractId, commentId: string, direction: 'up' | 'down' | 'none'): Promise<unknown>
  export async function getCommentVotes(serverUrl, publicKey, contractId): Promise<CommentVote[]>
  // src/utils/causes.ts
  export interface VoteTally { up: number; down: number }
  export interface CauseRank { comment: Comment; up: number; down: number; score: number; rank: number }
  export const TOP_CAUSES_CARRIED = 15; export const TOP_CAUSES_ALIGN = 5;
  export function tallyVotes(votes: CommentVote[]): Record<string, VoteTally>
  export function rankCauses(comments: Comment[], votes: CommentVote[]): CauseRank[]
  export function myVote(votes: CommentVote[], publicKey: string, commentId: string): 'up' | 'down' | null
  ```

- [ ] **Step 1: discussionApi additions** (after `likeComment`):

```ts
export interface CommentVote { voter: string; commentId: string; direction: 'up' | 'down' }

export async function voteComment(
  serverUrl: string, publicKey: string, contractId: string,
  commentId: string, direction: 'up' | 'down' | 'none',
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'vote_comment', values: { comment_id: commentId, direction } } as IMethod,
  });
}

export async function getCommentVotes(serverUrl: string, publicKey: string, contractId: string): Promise<CommentVote[]> {
  const raw = await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_comment_votes', values: {} } as IMethod,
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Partial<CommentVote>>;
  return Object.values(obj)
    .filter((v) => v && (v.direction === 'up' || v.direction === 'down') && v.commentId && v.voter)
    .map((v) => ({ voter: String(v.voter), commentId: String(v.commentId), direction: v.direction as 'up' | 'down' }));
}
```

- [ ] **Step 2: `src/utils/causes.ts`**

```ts
import type { Comment, CommentVote } from '../components/collaboration/flows/discussion/discussionApi';

/**
 * Causes ranking (S35, rulings D4/D5). ROOT comments only — replies are conversation,
 * not candidate causes, and the contract refuses votes on them. Pure; no I/O.
 */
export const TOP_CAUSES_CARRIED = 15; // carried into the Solutions board
export const TOP_CAUSES_ALIGN = 5;    // a new solution must align to one of these

export interface VoteTally { up: number; down: number }
export interface CauseRank { comment: Comment; up: number; down: number; score: number; rank: number }

export function tallyVotes(votes: CommentVote[]): Record<string, VoteTally> {
  const out: Record<string, VoteTally> = {};
  for (const v of votes) {
    const t = (out[v.commentId] ||= { up: 0, down: 0 });
    if (v.direction === 'up') t.up += 1; else t.down += 1;
  }
  return out;
}

export function myVote(votes: CommentVote[], publicKey: string, commentId: string): 'up' | 'down' | null {
  const v = votes.find((x) => x.voter === publicKey && x.commentId === commentId);
  return v ? v.direction : null;
}

/** score = up − down; ties → older first; deleted roots excluded. rank is 1-based. */
export function rankCauses(comments: Comment[], votes: CommentVote[]): CauseRank[] {
  const tally = tallyVotes(votes);
  return comments
    .filter((c) => !c.parentId && !c.deleted)
    .map((c) => { const t = tally[c.id] ?? { up: 0, down: 0 }; return { comment: c, up: t.up, down: t.down, score: t.up - t.down, rank: 0 }; })
    .sort((a, b) => b.score - a.score || a.comment.timestamp - b.comment.timestamp)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
```

- [ ] **Step 3: Verify** — `npx tsc -b` clean. Quick node check of the util's ordering:

Run: `node -e "const {rankCauses}=require('./node_modules/.cache/x')"` is NOT available (no test runner); instead add a temporary `console.assert` block in a scratch `.mts` file under the scratchpad, run with `npx tsx`, then delete it. Assert: two roots, one with 3 up 1 down (score 2) and one with 1 up (score 1) → ranks 1 and 2; a reply with 10 up never appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/collaboration/flows/discussion/discussionApi.ts src/utils/causes.ts
git commit -m "feat(s35): voteComment/getCommentVotes wrappers + rankCauses util (D4)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 6: ThreadedDiscussion — up/down on roots, rank chips, hint, Causes copy

**Files:**
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx`
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.module.scss`
- Modify: `src/components/onboarding/welcomeHints.ts` (add `'causesVoteHint'` to `WelcomeHintId`)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- Consumes: `voteComment`, `getCommentVotes`, `CommentVote` (Task 5); `rankCauses`, `myVote`, `tallyVotes`, `TOP_CAUSES_CARRIED`.

- [ ] **Step 1: State + fetch.** Next to `flat` state add `const [votes, setVotes] = useState<CommentVote[]>([]);`. In `refresh` fetch both: `const [list, v] = await Promise.all([api.getComments(...), api.getCommentVotes(...)]); setFlat(list); setVotes(v);`.

- [ ] **Step 2: Sorting.** In `buildTree(flat, sort)` add a third param `tally: Record<string, VoteTally>`; for ROOT nodes the `'top'` comparator uses `score = (tally[id]?.up ?? 0) − (tally[id]?.down ?? 0)` then timestamp; child nodes keep `likes.length`. Compute `const tally = useMemo(() => tallyVotes(votes), [votes])` and `const ranks = useMemo(() => rankCauses(flat, votes), [flat, votes])`; pass `tally` to `buildTree`.

- [ ] **Step 3: Vote handler** (next to `handleLike`):

```ts
const handleVote = useCallback(async (id: string, direction: 'up' | 'down') => {
  if (!serverUrl || !publicKey || !contractId) return;
  const current = myVote(votes, publicKey, id);
  const next = current === direction ? 'none' : direction; // tap again to clear
  await api.voteComment(serverUrl, publicKey, contractId, id, next);
  if (isDemoContract(contractId)) await refresh(); // demo emits no events; real contracts refresh via useContractSync
}, [serverUrl, publicKey, contractId, votes, refresh]);
```
(`isDemoContract` is already imported in this file on `server-side`; on `ui` HEAD it is not — check with grep and, if absent, always `await refresh()` instead of importing from the demo layer.)

- [ ] **Step 4: CommentItem props + UI.** Add props `depth`-aware controls: when `depth === 0` render, in place of the Heart button:

```tsx
<div className={styles.voteGroup} role="group" aria-label={t('causes.vote.group', 'Vote on this cause')}>
  <button type="button" className={`${styles.voteBtn} ${mine === 'up' ? styles.voteOn : ''}`}
    aria-pressed={mine === 'up'} disabled={!canParticipate}
    onClick={() => onVote(node.id, 'up')}
    aria-label={t('causes.vote.up', 'Vote up — a real driver of the problem')}>
    <ThumbsUp size={16} aria-hidden />
  </button>
  <span className={styles.voteScore} aria-label={t('causes.vote.score', 'Net score {n}', { n: score })}>{score > 0 ? `+${score}` : score}</span>
  <button type="button" className={`${styles.voteBtn} ${mine === 'down' ? styles.voteOn : ''}`}
    aria-pressed={mine === 'down'} disabled={!canParticipate}
    onClick={() => onVote(node.id, 'down')}
    aria-label={t('causes.vote.down', 'Vote down — not a real driver')}>
    <ThumbsDown size={16} aria-hidden />
  </button>
</div>
{rank != null && rank <= TOP_CAUSES_CARRIED && (
  <span className={styles.rankChip}>{t('causes.rank', '#{n}', { n: rank })}</span>
)}
```
Replies (`depth > 0`) keep the existing Heart/like control unchanged. Pass `onVote`, `mine`, `score`, `rank` down from the tree renderer (look them up from `tally`, `votes`, `ranks` by `node.id`).

- [ ] **Step 5: SCSS** (tokens only): `.voteGroup { display: inline-flex; align-items: center; gap: $spacing-xs; }`, `.voteBtn { min-width: 44px; min-height: 44px; border-radius: $radius-full; border: 1px solid $gray-300; background: transparent; color: $gray-600; &.voteOn { border-color: $primary; color: $primary; background: rgba($primary, 0.1); } }`, `.voteScore { font-variant-numeric: tabular-nums; font-size: $text-sm; min-width: 2ch; text-align: center; }`, `.rankChip { font-size: $text-xs; color: $gray-500; margin-left: $spacing-xs; }` plus the `@include dark` overrides using `$dark-text-secondary` / `$primary-on-dark` (follow the file's existing dark pattern).

- [ ] **Step 6: Hint (F6).** Add `'causesVoteHint'` to `WelcomeHintId`. Above the comment list, when `!getHintSeen('causesVoteHint')`, render a `Banner`-style line with a dismiss button: `t('causes.hint', "Vote up if this is a real driver of the problem, down if it isn't.")`; dismiss → `markHintSeen('causesVoteHint')` + local state.

- [ ] **Step 7: Copy.** Composer placeholder `t('deliberation.thread.placeholder', …)` → `t('causes.composer.placeholder', 'What is causing this problem?')`; the count label stays; empty hint in `DiscussionStageView` → `t('causes.empty', 'Name a cause of this problem to start.')`.

- [ ] **Step 8: i18n parity.** Add every new key to `fr.ts` and `sw.ts` (French/Swahili drafts; log them in `docs/i18n-native-review-candidates.md` under "Session 35"). Run `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` → 0 errors.

- [ ] **Step 9: Verify.** `npx tsc -b && npm run build` clean. Controller preview walk at 360px light + dark on the databroker discussion: vote up, vote again to clear, vote down, re-sort Top/Newest, rank chips on roots only, replies still show the Heart, hint dismisses and stays dismissed after reload, keyboard: Tab reaches both vote buttons and `aria-pressed` toggles.

- [ ] **Step 10: Commit**

```bash
git add src/components/collaboration/flows/discussion src/components/onboarding/welcomeHints.ts src/i18n/fr.ts src/i18n/sw.ts docs/i18n-native-review-candidates.md
git commit -m "feat(s35): Causes — up/down on root comments, rank chips, first-use hint (D4, F6)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task 7: Rename surfaces to "Causes" (labels only, D3)

**Files:**
- Modify: `src/components/initiative/DiscussionPill.tsx:63` (`stage.discussionPill` default → `'Causes'`; count aria → `'{label} — {n} causes'`)
- Modify: `src/components/collaboration/DiscussionStageView.tsx:70` (`header.section.discussion` default → `'Causes'`)
- Modify: `src/components/community/StageGate.tsx` (discussion copy), `src/components/initiative/stages/DiscussionEngage.tsx` (teaser copy), `src/components/collaboration/StageAdvanceBar.tsx:19`, `src/components/collaboration/InitiativeStagePanel.tsx:34`, `src/pages/CreateInitiativePage.tsx:35`, `src/pages/StageFeedView.tsx:49`, `src/components/community/CommunitySettings.tsx:18` — English label `'Discussion'` → `'Causes'` where it names the per-problem function (NOT the `discussion` stage key, route, or contract slot).
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts` — same keys, fr `Causes`, sw `Sababu` (native review pending).

- [ ] **Step 1:** grep `'Discussion'` across `src/components src/pages` and change only display defaults; leave `stageKey: 'discussion'`, `/discussion` paths and `discussionContractId` untouched (grep them after: counts must be unchanged).
- [ ] **Step 2:** Add one sentence to the `DiscussionStageView` `ContextCard` body or a caption under the title: `t('causes.explainer', 'Causes are ranked by votes. The top 15 are carried into Solutions; a solution must address one of the top 5.')` — never wording that implies a cause is validated (D3).
- [ ] **Step 3:** parity script clean; `npx tsc -b` clean; preview: chin pill reads "Causes · n", discussion page eyebrow reads "Causes — {community}".
- [ ] **Step 4: Commit** — `feat(s35): rename Discussion → Causes on labels only (D3)`.

---

## Wave 2 — Discussion status pill (D6, F3, F4, F5)

### Task 8: `discussionStatus.ts` + `DiscussionStatusPill` + surfaces

**Files:**
- Create: `src/utils/discussionStatus.ts`
- Create: `src/components/initiative/DiscussionStatusPill.tsx`, `DiscussionStatusPill.module.scss`
- Modify: `src/components/initiative/DiscussionPill.tsx` (append the status word inside the existing pill)
- Modify: `src/components/initiative/InitiativeStageCard.tsx` (header meta), `src/components/community/ProblemActivityCard.tsx`, `SolutionActivityCard.tsx`, `VoteActivityCard.tsx` (header meta), `src/pages/StageFeedView.tsx` (card summary), `src/components/collaboration/DiscussionStageView.tsx` (AppHeader subtitle)
- Modify: `DESIGN_SYSTEM.md` (Badge inventory row + "Discussion status pill" subsection)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
```ts
export type DiscussionStatusKey = 'open' | 'contested' | 'divided' | 'converging' | 'consensus';
export interface DiscussionStatus { key: DiscussionStatusKey; agreement: number; votes: number; votedComments: number; participants: number }
export const STATUS_VOTE_FLOOR = 10; export const MIN_VOTED_COMMENTS = 3; export const STATUS_SAMPLE = 10;
export const STATUS_THRESHOLDS = { contested: 0.25, divided: 0.5, converging: 0.75 } as const;
export const STATUS_META: Record<DiscussionStatusKey, { labelKey: string; labelDefault: string; tone: BadgeTone }>
export function computeDiscussionStatus(comments: Comment[], votes: CommentVote[]): DiscussionStatus
```

- [ ] **Step 1: The util**

```ts
import type { BadgeTone } from '../components/shared/Badge';
import type { Comment, CommentVote } from '../components/collaboration/flows/discussion/discussionApi';
import { tallyVotes } from './causes';

/**
 * Five-band discussion status (S35, rulings D6/F3). Computed over ROOT comments only —
 * do not "fix" this to include replies: replies cannot be voted on (D4) and the pill
 * claims to measure agreement about causes. Sample = the ≤10 root comments with the most
 * total votes. agreement = Σ|up−down| / Σ(up+down) over the sample.
 */
export type DiscussionStatusKey = 'open' | 'contested' | 'divided' | 'converging' | 'consensus';
export interface DiscussionStatus { key: DiscussionStatusKey; agreement: number; votes: number; votedComments: number; participants: number }
export const STATUS_VOTE_FLOOR = 10;
export const MIN_VOTED_COMMENTS = 3;
export const STATUS_SAMPLE = 10;
export const STATUS_THRESHOLDS = { contested: 0.25, divided: 0.5, converging: 0.75 } as const;
export const STATUS_META: Record<DiscussionStatusKey, { labelKey: string; labelDefault: string; tone: BadgeTone }> = {
  open:       { labelKey: 'causes.status.open',       labelDefault: 'New',        tone: 'neutral' },
  contested:  { labelKey: 'causes.status.contested',  labelDefault: 'Contested',  tone: 'warning' },
  divided:    { labelKey: 'causes.status.divided',    labelDefault: 'Divided',    tone: 'info' },
  converging: { labelKey: 'causes.status.converging', labelDefault: 'Converging', tone: 'primary' },
  consensus:  { labelKey: 'causes.status.consensus',  labelDefault: 'Consensus',  tone: 'success' },
};

export function computeDiscussionStatus(comments: Comment[], votes: CommentVote[]): DiscussionStatus {
  const tally = tallyVotes(votes);
  const roots = comments.filter((c) => !c.parentId && !c.deleted);
  const voted = roots
    .map((c) => ({ id: c.id, ...(tally[c.id] ?? { up: 0, down: 0 }) }))
    .filter((r) => r.up + r.down > 0)
    .sort((a, b) => (b.up + b.down) - (a.up + a.down))
    .slice(0, STATUS_SAMPLE);
  const totalVotes = roots.reduce((n, c) => n + ((tally[c.id]?.up ?? 0) + (tally[c.id]?.down ?? 0)), 0);
  const participants = new Set(votes.map((v) => v.voter)).size;
  const base = { votes: totalVotes, votedComments: voted.length, participants };
  if (totalVotes < STATUS_VOTE_FLOOR || voted.length < MIN_VOTED_COMMENTS) return { key: 'open', agreement: 0, ...base };
  const num = voted.reduce((s, r) => s + Math.abs(r.up - r.down), 0);
  const den = voted.reduce((s, r) => s + r.up + r.down, 0);
  const agreement = den === 0 ? 0 : num / den;
  const key: DiscussionStatusKey =
    agreement < STATUS_THRESHOLDS.contested ? 'contested'
    : agreement < STATUS_THRESHOLDS.divided ? 'divided'
    : agreement < STATUS_THRESHOLDS.converging ? 'converging'
    : 'consensus';
  return { key, agreement, ...base };
}
```

- [ ] **Step 2: The pill component** — reads via `resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'discussionContractId')` then `getComments` + `getCommentVotes` (copy the cancellation pattern from `DiscussionPill.tsx`); **never** `useFlowContract`. Renders:

```tsx
<Badge tone={meta.tone} dot size="sm" className={overflow ? styles.dotOnly : undefined}
  aria-label={scoped} title={scoped}>
  <span className={styles.word}>{t(meta.labelKey, meta.labelDefault)}</span>
</Badge>
```
where `scoped` = for `consensus` `t('causes.status.scoped', 'Consensus among {n} Gloki participants in {community}', { n: status.participants, community })` (F4), otherwise `t('causes.status.aria', 'Causes discussion: {word}', { word })`. Props: `{ initiativeId, communityName, className? }`. Export also a presentational `DiscussionStatusBadge({ status, communityName })` so surfaces that already hold comments+votes (the discussion page, `TopCausesPanel`) render without a second fetch.

- [ ] **Step 3: Width rule (F5).** `.word { max-width: 12ch; overflow: hidden; }` is NOT allowed to ellipsis. Instead: measure once with a `ResizeObserver`/`scrollWidth > clientWidth` check on the badge; if it overflows, add `.dotOnly` which sets `.word { position: absolute; clip: rect(0 0 0 0); }` (sr-only) — the dot + `aria-label` remain. Budget check: every en default ≤ 12 chars (they are).

- [ ] **Step 4: Surfaces.** `DiscussionPill`: after the count, render `<DiscussionStatusBadge>` inline if the pill already fetched comments (extend its effect to fetch votes too; one fetch, two outputs). Card header metas + stage feed summary: `<DiscussionStatusPill initiativeId communityName />` after the stage `Badge`. Discussion page: `AppHeader subtitle={word}` via the presentational badge (the page already has comments/votes in `ThreadedDiscussion`; lift `status` up through an `onStatus` callback prop rather than a second fetch).

- [ ] **Step 5: DESIGN_SYSTEM.md.** In the Badge inventory add `| \`DiscussionStatusPill\` | Five-band Causes status (New / Contested / Divided / Converging / Consensus → neutral / warning / info / primary / success), \`Badge dot size="sm"\`; overflow at 360px degrades to dot + accessible name, never ellipsis. Off-app surfaces use the scoped "Consensus among {n} Gloki participants in {community}". Rules in S34 decision record D6/F3–F5. |`. Add a short "Discussion status" subsection under the pill/chin section with the formula and floors.

- [ ] **Step 6: i18n parity** for `causes.status.*`; run the parity script.

- [ ] **Step 7: Verify.** `npx tsc -b && npm run build`. Preview: databroker (seeded votes, Task 12 seeds land later — for now vote enough in the preview to cross floor 10 / 3 comments and watch the word change through the bands); 360px light+dark; force a long fr label (temporarily) and confirm dot-only degradation; screen-reader name via `read_page` shows the scoped string on Consensus.

- [ ] **Step 8: Commit** — `feat(s35): five-band discussion status pill on every initiative card (D6, F3–F5)`.

---

## Wave 3 — Causes carried into Solutions (D5, F2)

### Task 9: Demo stub — `cause_id` on `add_proposal`, `impact_assessments` collection

**Files:**
- Modify: `src/services/demo/demoContracts/approval.ts`

- [ ] **Step 1:** In `add_proposal`, read `const causeId = typeof method.values?.cause_id === 'string' ? method.values.cause_id.slice(0, 64) : '';` and store `causeId` on the proposal (add `causeId?: string` to the stub's `Proposal` type). Never allow a later write to change it (there is no such method — keep it that way).
- [ ] **Step 2:** Add to the state type `impactAssessments?: Record<string, ImpactAssessmentDoc>` with `ImpactAssessmentDoc = { author, proposalId, timestamp, target, targetsCause: 'cause' | 'symptom' | 'both', mechanism, broaderEffects, risks, opportunityCosts, timeHorizon }`. Read case `get_impact_assessments` → `s.impactAssessments ?? {}`. Write case `add_impact_assessment`: proposal must exist; count existing for that proposal ≥ 3 → `{ error: 'This solution already has three impact assessments' }`; same author → `{ error: 'You already assessed this solution' }`; trim/limit each text field to 700 chars via a local helper; key `${pid}:${caller}`; `writeState`.
- [ ] **Step 3:** `npx tsc -b` clean. Commit — `feat(s35): demo stub cause_id + impact_assessments collection (D5, F1)`.

### Task 10: `TopCausesPanel` + cause select in the add-solution modal + cause chips

**Files:**
- Modify: `src/components/collaboration/flows/voting/approvalApi.ts` (`addProposal(..., metrics, causeId = '')` → `values.cause_id`)
- Create: `src/components/initiative/TopCausesPanel.tsx`, `TopCausesPanel.module.scss`
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Interfaces:**
- `TopCausesPanel` props: `{ initiativeId: string; communityName: string; solutions: Array<{ id: string; causeId?: string }>; onCauses?: (ranks: CauseRank[]) => void }`. It resolves the discussion contract with `resolveInitiativeStageContract(..., 'discussionContractId')` (read-only), fetches comments + votes, computes `rankCauses`, renders a collapsible `Card` "Top causes ({n})" listing up to 15 rows: rank, text (2-line clamp), net score, `UserIdentity` author, "{k} solutions" count; header carries `DiscussionStatusBadge`. Calls `onCauses(ranks)` so the board can populate the select without a second fetch.
- `SolutionsBoard`: `const [causes, setCauses] = useState<CauseRank[]>([])`; `const alignable = causes.slice(0, TOP_CAUSES_ALIGN)`; new state `newCauseId`, initialised to `alignable[0]?.comment.id ?? ''` whenever the modal opens (D5 pre-select). Modal renders, when `alignable.length > 0`, above the textarea:

```tsx
<p className={styles.commitPrompt}>{t('causes.align.prompt', 'Which cause does this address?')}</p>
<p className={styles.commitHint}>{t('causes.align.hint', 'Your metrics and implementation measures should follow from this cause.')}</p>
<SearchableSelect
  options={alignable.map((c) => ({ value: c.comment.id, label: `#${c.rank} ${c.comment.text}` }))}
  value={newCauseId}
  onChange={setNewCauseId}
  placeholder={t('causes.align.placeholder', 'Choose a cause')}
/>
```
`canSubmit` additionally requires `alignable.length === 0 || newCauseId !== ''`. `handleAdd` passes `alignable.length > 0 ? newCauseId : ''`.

- [ ] **Step 1:** approvalApi param + wire value.
- [ ] **Step 2:** Panel component (read-only resolver; tokens; `EmptyState` when no causes: `t('causes.none', 'No causes ranked yet — start in the Causes discussion.')`).
- [ ] **Step 3:** Board integration as above; relabel `mechanisms.approval.commitmentsPrompt` default to `'Implementation measures — who and what needs to change?'` (wire stays `commitments`).
- [ ] **Step 4:** Cause chip in `SolutionEvidence` (first line): if `proposal.causeId` → resolve the cause from `causes`; render `t('causes.addresses', 'Addresses cause: {text}', { text })` plus a `Badge tone="neutral" size="sm"`: rank ≤ 15 → `t('causes.rankNow', 'Cause now ranked #{n}', { n })`, otherwise `t('causes.unranked', 'Cause no longer ranked')`; if `causeId === ''` → `t('causes.beforeRank', 'Proposed before any cause was ranked')` (F2).
- [ ] **Step 5:** i18n parity; `npx tsc -b && npm run build`.
- [ ] **Step 6:** Preview: open Add solution on databroker → select is pre-filled with #1; change it; submit; the new card shows "Addresses cause: …" + "Cause now ranked #n"; open a problem with no causes → no select, submit works, chip "Proposed before any cause was ranked".
- [ ] **Step 7:** Commit — `feat(s35): Top causes panel + required cause alignment with pre-select (D5, F2)`.

### Task 11: Cause line on the ballot, vote preview and mandate

**Files:**
- Modify: `src/components/collaboration/flows/voting/QVFlow.tsx` (`BallotSolution` gains `causeId?: string`, `causeText?: string`; fetch comments+votes from the discussion contract once via `resolveInitiativeStageContract` to map `causeId → text/rank`)
- Modify: `src/components/initiative/stages/VotePreview.tsx` (same line, read-only)
- Modify: `src/components/mandate/MandateCard.tsx` (one line under the solution title: "Addresses cause: …")

- [ ] **Step 1–3:** Add the line as the first item of the evidence fold in each surface using the same three i18n keys from Task 10; no new keys.
- [ ] **Step 4:** `npx tsc -b && npm run build`; preview the vote stage of databroker and the published mandate.
- [ ] **Step 5:** Commit — `feat(s35): cause line on ballot, vote preview and mandate (F2)`.

---

## Wave 4 — Impact assessment (D7, F7, F8, D12)

### Task 12: Fixtures + DEMO_VERSION bump

**Files:**
- Modify: `src/services/demo/fixtures/deliberation.ts` — add `DISCUSSION_VOTES_BY_KEY: Record<string, Array<{ voter: string; commentId: string; direction: 'up' | 'down' }>>` for `misinfo` and `databroker` (≥ 12 votes over ≥ 4 root comments each so both discussions clear the F3 floors; make databroker land in `divided` and misinfo in `converging`); add `causeId` to `PROPOSAL_AUTHOR_EXTRAS_BY_KEY` entries for the seeded databroker solutions (point at seeded root comment ids); add `PROPOSAL_IMPACT_ASSESSMENTS_BY_KEY` with two assessments on one databroker solution — one by a seeded persona, one by the viewer persona (so "Assessment 2 of 3" and the remaining CTA both demo).
- Modify: `src/services/demo/demoContracts/discussion.ts` (`initDiscussion` accepts and writes `commentVotes` from the seed), `src/services/demo/seedDemoCommunity.ts` (pass the new fixtures through), `src/services/demo/demoContracts/approval.ts` (seed `causeId` + `impactAssessments`)
- Modify: `src/services/demo/mockApi.ts:17` → `const DEMO_VERSION = 'global-v18';`

- [ ] Steps: write fixtures → wire seed → bump → `npx tsc -b && npm run build` → preview with cleared localStorage (menu "Reset demo") → status words visible without voting; commit `feat(s35): seed comment votes, cause links and impact assessments; DEMO_VERSION v18`.

### Task 13: `writerRank.ts` + `approvalApi` assessment wrappers

**Files:**
- Create: `src/utils/writerRank.ts`
- Modify: `src/components/collaboration/flows/voting/approvalApi.ts`

**Interfaces:**
```ts
// approvalApi
export type TargetsCause = 'cause' | 'symptom' | 'both';
export interface ImpactAssessment { author: string; proposalId: string; timestamp: number; target: string; targetsCause: TargetsCause; mechanism: string; broaderEffects: string; risks: string; opportunityCosts: string; timeHorizon: string }
export async function addImpactAssessment(serverUrl, publicKey, contractId, a: Omit<ImpactAssessment, 'author' | 'timestamp'>): Promise<unknown>   // values: { proposal_id, target, targets_cause, mechanism, broader_effects, risks, opportunity_costs, time_horizon }
export async function getImpactAssessments(serverUrl, publicKey, contractId): Promise<ImpactAssessment[]>
// writerRank
export interface WriterScore { publicKey: string; causeScore: number; solutionScore: number; total: number; firstAt: number }
export type EligibilityRung = 'strict' | 'no-floor' | 'top-25' | 'any-verified';
export const TOP_WRITERS = 10; export const WIDE_WRITERS = 25; export const ASSESSORS_PER_SOLUTION = 3;
export function rankWriters(comments: Comment[], votes: CommentVote[], proposals: Array<{ id: string; author: string; coAuthors?: string[]; timestamp: number | string }>, approvalCounts: Record<string, number>): WriterScore[]
export function eligibleAssessors(args: { proposal: { id: string; author: string; coAuthors?: string[]; causeId?: string }; allProposals: Array<{ id: string; author: string; coAuthors?: string[]; causeId?: string }>; writers: WriterScore[]; verifiedKeys: string[]; existing: ImpactAssessment[] }): { keys: string[]; rung: EligibilityRung }
export function canAssess(publicKey: string, args: Parameters<typeof eligibleAssessors>[0]): boolean
```

- [ ] **Step 1: writerRank.ts** — doc comment pins (F7): sort `total desc → causeScore desc → firstAt asc → publicKey asc`; `causeScore` = Σ (up − down) over the writer's root comments; `solutionScore` = Σ `approvalCounts[p.id]` over solutions where the writer is author or co-author; `firstAt` = earliest comment/proposal timestamp. `eligibleAssessors`: `authorsOf(p) = [p.author, ...(p.coAuthors ?? [])]`; `sameCauseAuthors` = authors of every proposal with the same non-empty `causeId`; `never(k)` = k in authorsOf(proposal) ∪ sameCauseAuthors ∪ existing.map(author); rungs: strict = top 10 ∧ causeScore > 0; no-floor = top 10; top-25 = top 25; any-verified = verifiedKeys; return the first rung whose filtered set has ≥ `ASSESSORS_PER_SOLUTION − existing.length` members (or the last rung); `existing.length ≥ 3` → `{ keys: [], rung: 'strict' }`.
- [ ] **Step 2: approvalApi wrappers** (mirror `addExpertReview`/`getProposals` style; normaliser filters malformed docs).
- [ ] **Step 3:** scratch-file assertions (as in Task 5): a solution author is never eligible on their own solution; an author of another solution with the same `causeId` is excluded even at rung `any-verified`; with 2 strict-eligible writers the rung reported is `no-floor` when that adds a third.
- [ ] **Step 4:** Commit — `feat(s35): writer ranking + assessor eligibility ladder; impact-assessment wrappers (D7, F7, F8)`.

### Task 14: Form, card, board CTA, voter surfaces

**Files:**
- Create: `src/components/initiative/ImpactAssessmentForm.tsx` (+ scss), `src/components/initiative/ImpactAssessmentCard.tsx` (+ scss)
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx`
- Modify: `src/components/collaboration/flows/voting/QVFlow.tsx`, `src/components/initiative/stages/VotePreview.tsx`, `src/components/mandate/MandateCard.tsx`
- Modify: `docs/FOR_OURI_seam.md` (D12 sentence already in Task 3 — confirm it is there), `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: Form** — kit `Modal` `size="lg"`; seven fields, each `label` + helper prompt (i18n keys `impact.field.target`, `.targetsCause` (SegmentedControl: Cause / Symptom / Both), `.mechanism`, `.broaderEffects`, `.risks`, `.opportunityCosts`, `.timeHorizon`); helper defaults exactly: "What cause or mechanism does this solution target?", "Does it target the cause or a symptom?", "How is it expected to produce its intended effect?", "Expected broader effects and consequences", "Potential risks and trade-offs", "Opportunity costs — what is given up by choosing this?", "Time horizon — how quickly it should work, and how long the effect should last". Textareas `maxLength={700}`, `rows={3}`; submit disabled until every text field is non-empty; intro line `t('impact.intro', 'Summarise, in plain words, what this solution is meant to change and what it will cost.')`.
- [ ] **Step 2: Card** — seven labelled rows (`dl`), author `UserIdentity` with trust shield, header `t('impact.nOfMax', 'Assessment {i} of {max}', { i, max: 3 })`, timestamp via `formatDateTime`.
- [ ] **Step 3: Board** — fetch `getImpactAssessments` alongside proposals; per solution chin: count `t('impact.count', 'Impact assessments · {n}/3', { n })`; when `canAssess(publicKey, …)` → outlined pill `t('impact.cta', 'Assess impact')` (chin pill law: outlined `$radius-full`); the panel copy names the rung when not strict: `t('impact.rung.noFloor', 'Open to the top 10 writers')`, `'impact.rung.top25'` → `'Open to the top 25 writers'`, `'impact.rung.anyVerified'` → `'Open to any verified member'`. `verifiedKeys` come from `useCommunityTrust(communityId)` (members whose `trustOf` is `'verified'`). After submit: demo → refetch; real → `useContractSync`.
- [ ] **Step 4: Voter surfaces** — `QVFlow.tsx:316–319`: replace the single flattened list with three `<details>` folds: `t('mechanisms.qv.measuresN', 'Implementation measures ({n})')` → commitments; `t('mechanisms.qv.metricsN', 'Metrics ({n})')` → author metrics + expert metrics (dedupe); `t('impact.foldN', 'Impact assessments ({n})')` → `ImpactAssessmentCard`s. Same in the results view (`:353–383`) and `VotePreview` (read-only). `MandateCard`: section `t('impact.mandateHeading', 'Why we expected this to work')` listing the winning solution's assessments.
- [ ] **Step 5:** i18n parity; `npx tsc -b && npm run build`; `$gray-400` grep gate.
- [ ] **Step 6: Preview walk** — databroker as the viewer persona: seeded assessments render "Assessment 1 of 3 / 2 of 3"; the CTA appears only when eligible (switch persona via Reset demo / identity to confirm an author sees no CTA on their own solution); submit a third → CTA disappears, count 3/3; vote stage shows three folds; 360px light+dark; keyboard through the modal (focus trap holds).
- [ ] **Step 7: Commit** — `feat(s35): impact assessments — form, card, eligibility-gated CTA, voter folds (D7, D12)`.

### Task 15: Closeout for Prompt 1

- [ ] `MASTER_TODO.md` §7: add tier **P10 Causes · status · impact assessment ✅** with spec + decision-record links; §8 changelog entry (commit range). Add the D12 follow-up ("server-side eligibility enforcement") under Blocked/coordination for Ouri.
- [ ] `docs/i18n-native-review-candidates.md`: "Session 35" section listing every new fr/sw string.
- [ ] Opus whole-branch review of the S35 diff (0 Critical / 0 Important or fixes applied).
- [ ] Present the review verdict + one-paragraph summary to Eston; **wait for the explicit "push"**. After the push, remind Eston that the deploy happens when Ouri merges `ui` → `server-side`, and send Ouri the patch file + FOR_OURI addendum.
- [ ] Memory: session-35 file + MEMORY.md line; next-session prompt for Prompt 2 Wave 1 (`docs/session-prompts/session-36-verification-w1.md`) with its own "re-verify these premises vs HEAD" list.

---

## Self-review against the spec

- §2.1 Causes (vote method, ranking, rename, composer copy, hint, fixtures) → Tasks 3–7, 12. ✔
- §2.2 Status pill (util, component, surfaces, DS row, width rule, scoped consensus) → Task 8. ✔
- §2.3 Causes → Solutions (`cause_id`, panel, pre-select, chips, ballot/preview/mandate line, "Implementation measures" relabel) → Tasks 9–11. ✔
- §2.4 Impact assessment (eligibility + ladder + tie-break, contract, form, card, CTA, voter folds, mandate, seeds, DEMO_VERSION) → Tasks 12–14. ✔
- §2.5 W0 (docs, FOR_OURI, demo defects) → Tasks 1–3; the optional `emitsWriteEvents()` predicate is deliberately NOT in this plan (it changes files Ouri is editing; revisit after his next merge). ✔
- Rulings D1–D3, D8–D11, F9, F10 need no code in this plan (D1 no-op; D2 is a separate one-hook change — **add as Task 16 if Eston wants it in S35**: `useAllInitiatives` conditional demo fallback + persistent "Example activity" banner). Type names are consistent across tasks (`CommentVote`, `CauseRank`, `WriterScore`, `ImpactAssessment`, `EligibilityRung`).
