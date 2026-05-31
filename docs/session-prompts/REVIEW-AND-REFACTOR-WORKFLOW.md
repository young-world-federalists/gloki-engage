# Wave 1 review + refactor (multi-agent workflow)

> **This is a Workflow, not a session prompt.** It dispatches ~21 parallel subagents across 5 phases
> to audit the current `ui` build, code-review each merged lane the way Ouri would, synthesize a
> refactor plan, and emit ready-to-use Wave 1.5 lane prompts. Run after a wave's lanes are merged into
> `ui` and you're ready to consolidate before opening another build wave.

---

## When to run it

- After Wave 1 batch lanes merge into `ui` (and Pages reflects them).
- When the user (you) wants a hard look at: design-system drift, cross-lane consistency, code
  elegance, and how reviewable each PR feels to Ouri.
- Output: top issues, recurring themes, **3–5 cohesive Wave 1.5 refactor lane prompts** ready to drop
  into `docs/session-prompts/wave-1.5/`, plus quick-win items a Foundation batch-2 pass can absorb.

## How to run it

In a Claude Code session in the repo, ask Claude to:

> "Run the wave-1 review-and-refactor workflow at
> `docs/session-prompts/REVIEW-AND-REFACTOR-WORKFLOW.md` — use the embedded script."

Claude invokes the `Workflow` tool with the inline script below. The workflow runs in the background;
when it completes, Claude will:
1. Present findings (top issues + themes).
2. Save the generated Wave 1.5 lane prompts to `docs/session-prompts/wave-1.5/<lane>.md`.
3. Update `MASTER_TODO.md` §11 with the formal review-wave findings.
4. Open a new Foundation batch-2 PR if quickWins warrant it.

## What it does (5 phases)

| Phase | Agents | Output |
|---|---|---|
| **1. Map state** | 1 (Explore) | Snapshot of branches, PRs, shipped lanes |
| **2. Audit dimensions** | 8 in parallel (Explore each) | Findings per dimension: design system, shared-kit usage, cross-lane consistency, i18n, a11y, tech debt, fixture quality, Ouri-reviewability |
| **3. Per-lane code review** | 7 in parallel (Explore, one per lane) | Lane-level findings as Ouri would see them — "if you do ONE thing to make this lane more elegant…" |
| **4. Synthesize** | 1 | Top issues, themes, **Wave 1.5 refactor lane definitions**, quick wins, dropped items |
| **5. Generate Wave 1.5 prompts** | 3–5 in parallel | One copy-paste-ready lane prompt per refactor lane |

## Inline script

The script below is the source of truth. Edit it in place and re-run with
`Workflow({scriptPath: "<this file>"})` to iterate; cached agent results return instantly for unchanged
phases.

```javascript
export const meta = {
  name: 'wave-1-review-and-refactor',
  description: 'Audit the Wave 1 Gloki UI for design-system coherence, code elegance, and Ouri-reviewability. Produce a refactor plan and the Wave 1.5 lane prompts.',
  phases: [
    { title: 'Map state' },
    { title: 'Audit dimensions' },
    { title: 'Per-lane code review' },
    { title: 'Synthesize' },
    { title: 'Generate Wave 1.5 prompts' }
  ]
}

// See the canonical script at:
//   /Users/eston/.claude/projects/-Volumes-2TB-Drive---Work---Volunteer----gloki-Gloki-Build-Communities2/<session-id>/workflows/scripts/wave-1-review-and-refactor-<run-id>.js
// (the Workflow tool persists every invocation's script there)
//
// The script:
//  - dims[]: 8 audit dimensions (design_system, shared_kit_usage, cross_lane_consistency,
//    i18n_hygiene, a11y_consistency, tech_debt, fixture_quality, ouri_reviewability)
//  - lanePRs: { A:9, B:10, C:11, D:17, E:16, F:12, G:18 }
//  - FINDINGS_SCHEMA: { findings: [{ severity ∈ {blocker|refactor|polish|note}, category, location, issue, recommendation }] }
//  - SYNTHESIS_SCHEMA: { topIssues, themes, refactorLanes:[{ name, oneLineGoal, rationale, ownedPaths, tasks, dependencies, estimatedSize }], quickWins, deferredOrDropped }
//  - North-stars baked into the Synthesize prompt: usability-first (≥70% unaided) + felt
//    transnational collaboration; one-person-one-vote, never plutocratic; deliberation precedes
//    aggregation; progressive decentralization; elegance over verbosity for Ouri's review.
```

## Important conventions the workflow assumes

- **Lane PR numbers** are hard-coded (A=9, B=10, C=11, D=17, E=16, F=12, G=18). Update if you reshuffle.
- **Foundation branch** is `wave-1/foundation` (commit `fb64534`).
- **`ui`** has all 7 lanes merged on top of Foundation. The audit and lane-review agents read against
  this state.
- **Repo** is `young-world-federalists/gloki-engage`.
- All agents are **read-only** (Explore subagent type) — the workflow does **not** modify files. The
  human (or the parent Claude session) commits the generated prompts.

## When NOT to run it

- Mid-batch (some lanes still open as PRs to `ui`) — you'll get incomplete picture; merge them first.
- Right after Foundation only (no lanes merged yet) — there's nothing to audit beyond Foundation.
- If you just want a GitHub-structure check, use `REVIEW-STRUCTURE.md` instead (single session, ~300
  words out).
