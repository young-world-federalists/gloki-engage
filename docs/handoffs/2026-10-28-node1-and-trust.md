# Restart prompt — node1, the trust root, and the open PRs (2026-10-28)

Paste this into a new session started in `Gloki Build` (`/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build`).

---

You're picking up Eston's Gloki work from 28 Oct 2026. Before anything else: read this file, check
`docs/handoffs/` on `ui` for anything newer, and check for other active sessions on the same work.
Re-check every state below with a command before relying on it.

## Rules for this work

- Never merge into `server-side` or push to it. A push there deploys the live app. **Ouri merges**
  PRs #29, #30 and #31; Eston said so on 28 Oct.
- After any deploy, DNS or server change, read back the live state and report that, not the intent.
- Don't promise Ouri dates or scope in drafts without asking Eston.

## 1. node1: a second, YWF-run node (main task tomorrow)

Goal: `https://node1.globaldemocracyinitiative.org` running Ouri's `ibc` node, independent of
Ouri's `gdi.gloki.contact`.

Ready, on the drive at `Gloki Build/node1/` (not in git): `compose.yml` (Ouri's compose plus Caddy
for HTTPS; the node is reachable only through Caddy), `Caddyfile`, `setup.sh` (fresh Ubuntu 24.04:
Docker, automatic security updates, key-only SSH, firewall 22/80/443, starts the stack), and
`README.md` with the steps and the known limits. The stack was tested on the Mac on 28 Oct with a
local certificate: agent sign-up, the `/stream` events and the CORS preflight all worked through
Caddy. `setup.sh` itself has only been syntax-checked.

SSH key: `~/.ssh/gloki_node1` on Eston's Mac (ed25519, no passphrase, comment `gloki-node1 (eston)`).

Waiting on Eston:
1. Order **OVHcloud VPS-1** (from €3.81/month ex. VAT on 28 Oct: 2 vCores, 4 GB, 40 GB, daily
   backup), Ubuntu 24.04, EU location, with the public key above. Hetzner showed every plan
   "currently unavailable" on 28 Oct; DigitalOcean ($6 for 1 GB, $12 for 2 GB) is the fallback.
2. In Cloudflare (account "YWF Cloudfare", `66cd61a5…`, zone `globaldemocracyinitiative.org`,
   Free plan) add **A `node1` → server IPv4, DNS only**. The wrangler OAuth login has zone read
   only, so Eston adds it in the dashboard (use the `readback` skill).
3. Send the IP.

Then: `scp` the three files, run `sudo bash setup.sh node1.globaldemocracyinitiative.org` as
`ubuntu` (OVH), and read back from outside:
`curl -s "https://node1.globaldemocracyinitiative.org/ibc/app/probe?action=is_exist_agent"` → `false`,
plus the certificate issuer and a register + `/stream` round trip.

The hostname must never change: each agent stores its node URL at `register_agent` and other nodes
use it to reach it. Nobody uses node1 until they type its URL at sign-in (`src/pages/LoginPage.tsx`
defaults to `https://gdi.gloki.contact`).

## 2. Ouri's app-wide verification (commit `15d86f7` on `server-side`, 28 Oct)

- One verification contract under agent `gloki-application` on `https://gdi.gloki.contact`
  (`.env`, `src/services/applicationServer.ts`). Phases: founder → one at a time with every verified
  person vouching (#2–#4) → four vouches from #5. Seam notes: `docs/FOR_OURI_seam.md`, 28 Oct addenda.
- Live on 28 Oct: deployed, one founder verified (key starts `P4ZtJ88H…`, method `founder`).
  **Not confirmed whose key that is.** Ask Eston.
- Eston's concern: it puts the verified list on one node members don't share, which clashes with the
  beta copy ("no company in the middle", `src/pages/beta/BetaDoorsPage.tsx:71`) and the 15 Oct
  reframe (`Communities2/docs/2026-10-15-beta-reframe-email-and-landing.md`). G2 in
  `docs/superpowers/specs/2026-09-17-production-wot-decisions.md` still says Unresolved.
- Proposed order (sent or about to be sent to Ouri): signatures on writes first (the node checks
  none today), then a second independently run node (node1), then copy the verified list across
  those few nodes.
- Ouri asked Eston for a `ui`-branch stub of `src/services/verificationRegistry.ts` reporting
  V ≥ 4 with the 30 demo personas, so the demo keeps the four-option page. Not done.

## 3. Open PRs (all open, unmerged, mergeable on 28 Oct)

- **#29** `claude/account-kind-contract` → `server-side`: `set_account_kind` on the Digital Agent
  contract, so the account kind survives a second device. Tested on a local node. Merged
  `server-side` (`15d86f7`) in to clear a MASTER_TODO conflict; builds and type-checks.
- **#30** `claude/pages-two-versions` → `server-side` and **#31** `claude/pages-two-versions-ui` →
  `ui`: one Pages site, beta (`server-side`, `build:beta`) at `/gloki-engage/`, the full demo on
  dummy data (`ui`, `build:prod`) at `/gloki-engage/demo/`. Identical `deploy.yml` on both
  branches; `public/404.html` routes `/demo/` deep links. Tested locally against a Pages-style
  server. Known: both apps share localStorage keys (`user`, `gloki.*`). Merging #30 changes what
  the live root shows (today it is the full app, after merge the beta).

## 4. Loose ends

- Gmail draft to Ouri (id `r1715612923958248401`) is unsent and superseded by WhatsApp; Eston may
  delete it.
- Onboarding Kind-step copy still says "The node software is not ready yet": a copy call for Eston.
- `Gloki Build/.claude/launch.json` has two entries pointing at the 28 Oct session's scratchpad
  (`gloki-beta-account-kind`, `gloki-pages-two-versions`); they won't work in a new session. Remove
  or repoint them.
- First verifiers: Eston wanted the YWF group (and possibly Giorgia). Check with Ouri whether the
  one-at-a-time phase allows that.
