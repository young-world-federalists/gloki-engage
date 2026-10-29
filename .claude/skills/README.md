# Gloki Skill Library

Fifteen skills that let a zero-context session (human or AI) debug, extend, validate, and
advance Communities2/Gloki at the standard the project holds. Written for the trunk (`unified`,
becoming `main`): **one app on the real network, where any page can also show a demo variant at
`?demo=true`** — the structure is specified in [docs/DEMO_MODE.md](../../docs/DEMO_MODE.md). Each skill
ends with a **Provenance and maintenance** section of one-line re-verification commands — if one
disagrees with a skill, the repo wins: update the skill.

**`REVIEW NEEDED (date)`** marks user-facing behaviour that changed and still needs a decision (for
example the verification rule, or who may join a community). Those passages are left visible on
purpose; find them all with `grep -rn "REVIEW NEEDED" .claude/skills`.

## Read these two first (every session)

| Skill | One line |
|---|---|
| **gloki-change-control** | The gates and non-negotiables: 4 hard invariants, the working rules (explicit go before any push), locked product decisions, change classification (UI / demo variant / real side / contract / product), scope discipline. |
| **gloki-session-lifecycle** | The unit of work: session prompt → re-ground premises vs HEAD (the #1 lesson) → recommend-then-confirm → spec → build → review → push gate → close-out. |

## Reach for by situation

| Skill | Reach for it when… |
|---|---|
| **gloki-build-env-run** | Setting up, running, building, deploying; required `.env` settings, base paths, the beta build, the local ibc node, Node/CI, the slow-USB-drive discipline. |
| **gloki-seam-and-demo-data** | Any data read/write: the real/demo split per page, the real seam and the demo layer, wire names, DEMO_VERSION, fixtures/personas. |
| **gloki-python-contracts** | Reading/writing `.py` contracts: the sandboxed dialect, the `agent` argument for contracts used without joining, `__init__` re-run semantics, immutability, keeping real contract ↔ service ↔ demo stub ↔ seam doc in step. |
| **gloki-frontend-architecture** | Navigating src/: flows, useFlowContract vs resolveInitiativeStageContract, slices/persistence, frozen route map, known-weak points. |
| **gloki-governance-domain** | QV hearts/credits math, trust layers, mandate/ratification model, turnout denominators, stage semantics. |
| **gloki-i18n-playbook** | Any user-facing string: the t() ritual, fr/sw parity (scripts/check-i18n-parity.mjs), native-review packet. |
| **gloki-debugging-playbook** | A live symptom: the symptom→triage table with first-check commands. |
| **gloki-failure-archaeology** | Tempted to rebuild/revert/"fix" something that may be settled history — the chronicle of every dead end and deliberate deletion. |
| **gloki-verification-and-qa** | Claiming "done": the evidence bar, preview-automation lore, scripts/ (grep-gates.sh, contrast-eval.js), review tiers. |
| **gloki-refactor-and-dead-code** | Deleting or cleaning up: consumer-graph tracing, SCSS-aware checks, recomposition-not-revert, orphaned-prior-art check. |
| **gloki-docs-and-writing** | Touching any doc of record: the authority map, templates, changelog/memory close-out, stale-doc hygiene. |
| **gloki-ui-review-campaign** | Running the full UI review (a11y, usability, normalisation, standardisation, attractiveness, beauty) — a phased, decision-gated campaign. |
| **gloki-research-frontier** | Scoping ambitious/next work: low-bandwidth civic UX and measurable democratic outcomes, with first-steps and falsifiable milestones. |

## House rules of the library itself

- **One home per fact**: detail lives in exactly one skill; siblings cross-reference by name.
  If you find the same detail written out twice, that is drift — consolidate toward the home.
- Every skill says **when NOT to use it** and which sibling to use instead.
- Nothing here overrides `CLAUDE.md`, `DESIGN_SYSTEM.md`, or `docs/FOR_OURI_seam.md`, and no
  skill routes around change control.
