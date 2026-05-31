# Review GitHub structure (single session, run anytime)

> Paste into a fresh Claude Code session in the repo on `ui`. Light read-only audit of branch
> hygiene + PR layout from Ouri's perspective. No code review — that's `REVIEW-AND-REFACTOR-WORKFLOW.md`.

---

You are reviewing the **GitHub structure** of `young-world-federalists/gloki-engage` — branches, PRs,
deploys — to confirm the parallel-session operating model is being followed cleanly and Ouri's review
queue is healthy. Read-only audit.

**Read first:** `MASTER_TODO.md` §4 (operating model), `docs/session-prompts/README.md` (the workflow
this is meant to support), and `docs/LANES.md`.

**Use `gh` and `git` to gather:**

1. **PR topology** — `gh pr list --repo young-world-federalists/gloki-engage --state all --limit 25 --json number,title,state,isDraft,baseRefName,headRefName,mergedAt`
   - Group by target branch (→ `ui` vs → `main` vs → other).
   - Count: READY, DRAFT, MERGED, CLOSED-unmerged.
   - Confirm the intended posture: **all lane work → `ui` (now MERGED); one ready Foundation → main + one DRAFT per lane → main for Ouri**. Flag any deviation.

2. **Branch hygiene** — `git ls-remote --heads origin`
   - Are stale branches lingering after merge? (e.g. `lane/*` branches whose PR has merged.)
   - Is anything misleadingly named? (e.g. earlier we found `foundation-baseline` predates Foundation.)
   - Recommend a one-line `git push origin --delete <branch>` for each cleanup candidate (do NOT run
     deletes yourself — leave for human approval).

3. **`ui` vs `main` divergence** — `git log origin/main..origin/ui --oneline | wc -l` and tail the log
   - How many commits on `ui` are not yet on `main`? Roughly which lanes/Foundation do they represent?
   - Does the divergence match what Ouri's PR queue says?

4. **Pages deploy health** — `gh api repos/young-world-federalists/gloki-engage/deployments -q '.[0:5][] | "deploy=\(.id) ref=\(.ref) sha=\(.sha[0:8]) created=\(.created_at)"'` and a quick `curl -s -o /dev/null -w "%{http_code}\n" https://young-world-federalists.github.io/gloki-engage/`
   - Latest deploy SHA matches `ui` tip?
   - Site responds 200? Asset path correct (`/gloki-engage/...`)?

5. **MASTER_TODO drift check** — `git diff origin/main -- MASTER_TODO.md | head -200` (just glance)
   - Are §10 (coordination log) and §11 (changelog) populated with the actually-shipped work? Anything
     stale, contradictory, or missing per the latest lane PR descriptions (run `gh pr view <n>` on a
     couple to spot-check)?

**Output: one ~300-word report with three sections:**

- **State:** the one-line "as of now" — what's on `ui`, what's on `main`, what's in Ouri's queue.
- **Hygiene issues:** anything misnamed/stale/missing, ranked. Concrete cleanup commands inline (for
  human to run, not for you).
- **Recommended next step:** one of {merge Foundation → main now, run more lanes, run the
  refactor workflow, do nothing}, with a one-sentence reason.

Do not edit files. Do not run delete/merge/push commands. This is review only.
