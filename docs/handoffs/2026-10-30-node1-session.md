# Handoff: node1, the founder step and two small fixes (30 Oct 2026)

From the "Gloki Build Restart" session (28–31 Oct). Paste the prompt below into a new session opened in
`Gloki Build/`. The orchestrator's handoff covers the wider picture: `docs/handoffs/2026-10-30-orchestrator.md`.

---

## Restart prompt

You are picking up three things for Gloki: bringing up **node1** (`https://node1.globaldemocracyinitiative.org`, a
YWF-run ibc node), guiding Eston's **founder step** on it, and two **small fixes** on gloki-engage `main`.
Check `docs/handoffs/` and any other active Gloki sessions before starting. Don't merge or deploy without Eston's
explicit OK in your session.

**Read first:**
- `ops/node1/README.md` and `ops/node1/setup.sh`. These are on branch `claude/node1-and-29oct-reports` (e09fc0c).
  The working copies are in `Gloki Build/node1/` on the 2TB drive.
- `docs/2026-10-29-founder-on-node1.md` (same branch): Eston's 5-step founder script and the risks.
- `docs/2026-10-29-unified-test.md` (same branch): what is still broken on `main`.

### 1. node1: waiting on Eston
Eston does three steps; the README has the details:
1. Order OVHcloud **VPS-1** with Ubuntu 24.04 in an EU datacentre. Paste `~/.ssh/gloki_node1.pub` as the SSH key.
2. In Cloudflare, account **YWF Cloudfare** (check the account ID first), zone
   `globaldemocracyinitiative.org`: add an A record `node1` → the server IP, **DNS only** (grey cloud), no AAAA.
   Wrangler is read-only, so this is a dashboard step for Eston.
3. Send the IP.

Then you:
- Check the DNS (wrangler and `dig`), the SSH login, the Ubuntu version and `free -m`.
- `scp -i ~/.ssh/gloki_node1 compose.yml Caddyfile setup.sh ubuntu@IP:`
- `ssh -i ~/.ssh/gloki_node1 ubuntu@IP 'sudo bash setup.sh node1.globaldemocracyinitiative.org'`
  - setup.sh stops if the CPU has no AVX (mongo:7 needs it) or if the `gloki-node1` key isn't installed.
- Read back as a table (expected | actual | ✅/❌):
  - `curl -s "https://node1.globaldemocracyinitiative.org/ibc/app/probe?action=is_exist_agent"` → `false`
  - the certificate issuer is Let's Encrypt
  - a register plus `/stream` round trip, using a **throwaway probe agent only**
  - the DNS record
- Create no other agents on node1. Eston's founder account is his to create.
- The hostname must never change, because clients store the URL exactly as typed.

### 2. The founder step: Eston's decision
- The live founder slot is still open: `gloki-application` on gdi.gloki.contact holds only the 28 Oct verification
  contract. Re-check before anything else:
  `curl -s "https://gdi.gloki.contact/ibc/app/gloki-application?action=get_contracts"`
- Pressing "Get verified" creates the settings contract (the signpost), and its code is fixed from then on. So
  fix A below only protects Eston's entry if it is **merged and deployed** before he presses. Deploying is a manual
  workflow run and needs Eston's OK.
- After he presses, read back the signpost (its `hosts[0]` should point to node1 and his agent) and his
  verification contract on node1.

### 3. Two fixes: start only after Eston says go
Make one feature branch off `main` for each. Test each on a fresh local node, open a PR, and don't merge.
- **A. `register_verification`** (`src/assets/contracts/gloki_engage_application_settings.py:31`) overwrites
  `self.hosts[agent]`, so anyone can repoint the server for an agent already on the list. Fix: refuse to change
  the server of an agent that is already listed.
- **B. The Back button carries demo mode into real pages.** The cause is the module-level `stickyDemo` in
  `src/hooks/useDemoMode.ts:16-22`, together with `DemoFlagUrlSync`. Fix idea: on POP navigations
  (`useNavigationType()`), follow the URL only.
  - Repro: real `/`, then `/identity/communities?demo=true`, then press Back. The home comes back as
    `/?demo=true` with demo data.

### How to test locally (what worked)
- Fresh node: copy Ouri's `compose.yml` from `ouripoupko/ibc` and change the project name and the host port, for
  example `127.0.0.1:2631:2611`. Then `docker compose up -d`. Tear down with `docker compose down -v`.
- App: use a worktree of `main` with `.env.local` set to `VITE_APPLICATION_SERVER_URL=http://127.0.0.1:2631`.
  - Run it through `.claude/launch.json` in `Gloki Build`.
  - Use a separate `*.localhost` origin per test person, for separate storage.
  - To see every node call, wrap `window.fetch` in the page and log the calls.
- **Leave the stack on `127.0.0.1:2611` alone.** It is Eston's own dev node: compose project `ibc`, created on
  24 Oct from `~/ibc-node`. It isn't a test node.

### Rules carried over
- No messages or drafts to Ouri unless Eston asks.
- Never merge or push to `main` code that hasn't been reviewed. Ouri reviews.
- Make no writes to gdi.gloki.contact.
- Don't state guesses about infrastructure as fact: check first, or label it as an assumption.

### Loose ends (Eston decides)
- Branch `claude/verification-note-and-git-plan` (ba3b63a): the git plan is superseded, but the note
  `docs/2026-10-29-where-the-verified-list-lives.md` is still accurate. Keep it or delete it.
- PR #20 (`ui` → old main) is stale.
- `claude/node1-and-29oct-reports` is a backup branch, not for merge as is.
