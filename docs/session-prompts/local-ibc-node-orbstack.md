# Local session: run Ouri's ibc node on OrbStack and point server-side at it

Paste everything below the line into a local Claude Code session on Eston's Mac, started in
the Communities2 repo.

---

We're setting up a local ibc node (Ouri's backend) on this Mac with OrbStack, then running
the `server-side` branch of the app against it. Work through the phases in order and stop at
each **STOP**, reporting what you found before going on. I'll do the clicking in the browser;
you run the commands, watch the logs, and check the node's state with curl.

## Background (already verified, don't redo the research)

- Ouri added a "Run with Docker" section to https://github.com/ouripoupko/ibc. Compose runs
  three containers (ibc, mongo:7, redis:8) and serves the API at `http://localhost:2611`, bound
  to 127.0.0.1 only. Data lives in Docker volumes and survives restarts.
- The image `ghcr.io/ouripoupko/ibc:latest` is public and multi-arch (amd64 + arm64).
- On 2026-10-24 a cloud session ran the full loop against this node: register agent,
  deploy `gloki_engage_initiative_contract.py` from `origin/server-side`, `set_details` and
  `upvote` writes, reads back, the `/stream` SSE ack, and data surviving a container restart.
  All passed. Total memory about 280 MB.
- On `server-side`, `isExistAgent` / `registerAgent` / `getContracts` always hit the real
  server. The digital-agent profile, gloki-engage community and gloki-engage initiative use
  `deployContractOnChain` / `contractWriteOnChain` / `contractReadOnChain`. Everything else
  is still the demo mock layer, so most screens will show seeded demo content even when
  pointed at the local node. That's expected, not a bug.
- `ui` is all stubs and never calls a server. Nothing in this session changes `ui`.

## Rules for this session

- The repo is on the slow USB drive. Follow the I/O rules in the `gloki-build-env-run`
  skill: small sequential reads, no parallel fan-out, never grep `node_modules/` or `dist/`.
- Keep the node and the server-side checkout **off the USB drive**: `~/ibc-node` and
  `~/gloki-server-side`.
- `server-side` is Ouri's branch. Check it out detached and never commit or push to it.
  Don't commit or push anything to `ui` either without asking me.
- Don't change the port binding in compose.yml. Writes carry the identity key in the URL
  with no signature, so the node must stay on 127.0.0.1.
- Don't edit Ouri's ibc repo or compose.yml. Anything that looks like a bug on his side goes
  in the notes file for me to pass on.
- Keep running notes in `~/ibc-node/NOTES.md`: commands run, what passed, anything odd, exact
  error text.

## Phase 1: start the node

1. Confirm OrbStack is the active engine: `docker context show` (expect `orbstack`),
   `docker version`, `docker compose version`. If OrbStack isn't running, tell me and wait.
2. Install as the README says:
   ```bash
   mkdir -p ~/ibc-node && cd ~/ibc-node
   curl -O https://raw.githubusercontent.com/ouripoupko/ibc/main/compose.yml
   docker compose up -d
   docker compose ps
   ```
3. Known trap: if the image pull fails, compose falls back to `build: .` and fails with
   `open Dockerfile: no such file or directory`. That means the **pull** failed, not the
   setup. Run `docker compose pull` and read its error instead.
4. Expect mongo and redis `(healthy)` and ibc `Up`.

**STOP.** Report `docker compose ps`.

## Phase 2: smoke test with curl

Save this as `~/ibc-node/smoke.sh` and run it. It reads the contract straight from git, so
nothing is copied off the USB drive by hand.

```bash
#!/bin/bash
set -euo pipefail
REPO="/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
B=http://localhost:2611
K="smoke-$(date +%s)"
TMP=$(mktemp -d)
git -C "$REPO" fetch -q origin server-side
git -C "$REPO" show origin/server-side:src/assets/contracts/gloki_engage_initiative_contract.py > "$TMP/c.py"

echo "exists before: $(curl -sS "$B/ibc/app/$K?action=is_exist_agent")"            # false
curl -sS -X PUT -H 'Content-Type: application/json' -d "{\"address\":\"$B\"}" \
  "$B/ibc/app/$K?action=register_agent" >/dev/null; sleep 2
echo "exists after:  $(curl -sS "$B/ibc/app/$K?action=is_exist_agent")"            # true

python3 - "$TMP/c.py" "$K" "$B" > "$TMP/deploy.json" <<'EOF'
import json, sys
print(json.dumps({"name": "smoke", "contract": "GlokiEngageInitiative",
  "code": open(sys.argv[1]).read(), "constructor": {}, "protocol": "BFT",
  "default_app": "", "pid": sys.argv[2], "address": sys.argv[3], "profile": ""}))
EOF
curl -sS -X PUT -H 'Content-Type: application/json' --data @"$TMP/deploy.json" \
  "$B/ibc/app/$K?action=deploy_contract" >/dev/null; sleep 4
C=$(curl -sS "$B/ibc/app/$K?action=get_contracts" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
r(){ curl -sS -X POST -H 'Content-Type: application/json' -d "{\"values\":$2}" "$B/ibc/app/$K/$C/$1?action=contract_read"; echo; }
w(){ curl -sS -X POST -H 'Content-Type: application/json' -d "{\"values\":$2}" "$B/ibc/app/$K/$C/$1?action=contract_write" >/dev/null; }

(curl -sS -N --max-time 8 "$B/stream?agent=$K&contract=" > "$TMP/sse.txt" 2>/dev/null || true) &
sleep 1
echo "stage: $(r get_stage '{}')"                                                  # "problem"
w set_details '{"description":"Smoke","explanation":"local node","links":[],"countries":["FR"]}'
w upvote '{}'; sleep 3
echo "details: $(r get_details '{}')"                                              # author = $K
echo "tally:   $(r get_tally '{}')"                                                # up 1
wait
echo "stream acks: $(grep -c contract_write "$TMP/sse.txt" || true)"                       # 2 or more
```

**STOP.** Report the output line by line against the expected values in the comments.

## Phase 3: run server-side against the node

1. Make a detached checkout on the internal disk:
   ```bash
   REPO="/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"
   git -C "$REPO" worktree add --detach ~/gloki-server-side origin/server-side
   cd ~/gloki-server-side && node --version && npm ci   # Node 22+ (CI pins 22)
   npm run dev
   ```
2. In a second terminal, tail the node: `cd ~/ibc-node && docker compose logs -f ibc`.
3. I'll open `http://localhost:5173`, set the server URL on the login page to
   `http://localhost:2611`, and walk through: log in or register, fill the digital-agent
   profile, create a community, create an initiative, write something on it.
4. After each of my steps, confirm it on the node with
   `curl -s "http://localhost:2611/ibc/app/<my key>?action=get_contracts"` and the log lines.
   I'll give you the key from the app. Tell me which steps reached the chain and which stayed
   on the mock layer, and flag any request that errored, with the exact log line.
5. Use the GitHub Pages site only if I ask. A public https page calling `localhost` gets
   blocked or prompted by Chrome's local-network rules, so local dev is the only clean test.

**STOP.** Report a table: step, reached chain (yes/no), evidence, any error.

## Phase 4: wrap up

- Stop the dev server. Leave the node running unless I say otherwise.
  (`docker compose stop` pauses it; `docker compose down -v` wipes all its data.)
- Keep `~/gloki-server-side` for later sessions unless I ask you to remove it
  (`git -C "$REPO" worktree remove ~/gloki-server-side`).
- Finish `~/ibc-node/NOTES.md` and give me two lists: anything to pass on to Ouri, and
  anything worth adding to the `gloki-build-env-run` skill as a "local ibc node" section.
  Don't edit the skill yet.

## Not in this session unless I ask

Testing the contract patches in `docs/contracts/` (start with
`2026-09-25-initiative-ballot-guards.py`) against this node is the next job: apply the
patch to a copy of the initiative contract, deploy it with the same request as Phase 2, and
check every refusal path plus whether the sandbox allows `isinstance`, `int` and `dict`.
Mention it at the end, but don't start it.
