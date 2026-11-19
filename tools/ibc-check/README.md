# Contract checks

Checks for the Solidity contracts in `src/assets/contracts/sol/`, run against a real ibc-go node:
each script makes a few agents (P-256 keys in place of passkeys), deploys a contract, calls it as
users would — including the calls it must refuse — and prints `ok` or `FAIL` per step.

| Script | Contract |
|---|---|
| `profile.mjs` | `DigitalAgent.sol` |
| `verification.mjs` | `ApplicationSettings.sol` and `GlokiVerification.sol` (all three phases) |
| `community.mjs` | `GlokiEngageCommunity.sol` |
| `initiative.mjs` | `GlokiEngageInitiative.sol` (every stage and its guards) |
| `forum.mjs` | `Forum.sol` |

Run a node (ibc-go's README), then from the repo root:

```sh
node tools/ibc-check/initiative.mjs              # one contract
for f in tools/ibc-check/[!l]*.mjs; do node "$f" || break; done   # all
IBC_URL=http://localhost:2612 node tools/ibc-check/forum.mjs     # another node
```

Each run makes new agents and contracts on the node; nothing is cleaned up. Exit status 1 if a check
failed. Run them after changing a contract: a deployed contract can't be fixed.
