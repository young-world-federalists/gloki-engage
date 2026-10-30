# node1.globaldemocracyinitiative.org

A public Gloki node run by YWF, independent of Ouri's `gdi.gloki.contact`. It runs Ouri's
`ibc` image (Mongo, Redis, the node) with Caddy in front for HTTPS. Only ports 22, 80 and
443 are open; the node itself is reachable only through Caddy.

Tested on the Mac on 2026-10-28 with a local certificate: register an agent, the `/stream`
events and the browser's CORS check all work through Caddy.

## Your steps

### 1. Order the server (OVHcloud, VPS-1)

- Go to <https://www.ovhcloud.com/en-ie/vps/> and choose **VPS-1** (2 vCores, 4 GB RAM,
  40 GB NVMe, daily backup). Listed from €3.81/month before VAT on 2026-10-28.
- **Location:** any EU datacentre (e.g. Gravelines or Frankfurt).
- **Image:** Ubuntu **24.04**.
- **SSH key:** paste the public key from `~/.ssh/gloki_node1.pub` on Eston's Mac when asked (one line,
  ending `gloki-node1 (eston)`; `setup.sh` checks for that name).

- **Term:** check what the checkout says. The "from" price may assume a longer commitment;
  pick monthly if you want to be able to stop.
- Pay, then send Claude the server's **IPv4 address** from the OVH console.

### 2. Point the name at it (YWF Cloudflare)

In the Cloudflare dashboard, account **YWF Cloudfare**, zone **globaldemocracyinitiative.org**,
DNS → Records → Add record:

| Type | Name | IPv4 address | Proxy status | TTL |
|---|---|---|---|---|
| A | `node1` | the server's IPv4 | **DNS only** (grey cloud) | Auto |

DNS only, so Caddy can get its own Let's Encrypt certificate. Don't add an AAAA record.

### 3. Claude runs the setup

From this folder, with `USER` = `ubuntu` on OVH:

```bash
scp -i ~/.ssh/gloki_node1 compose.yml Caddyfile setup.sh ubuntu@SERVER_IP:
```

```bash
ssh -i ~/.ssh/gloki_node1 ubuntu@SERVER_IP 'sudo bash setup.sh node1.globaldemocracyinitiative.org'
```

Then check from outside:

```bash
curl -s "https://node1.globaldemocracyinitiative.org/ibc/app/probe?action=is_exist_agent"
```

It should print `false`.

## Running it

- Logs: `ssh -i ~/.ssh/gloki_node1 ubuntu@SERVER_IP 'cd /opt/ibc-node && sudo docker compose logs -f ibc'`
- Update the node image: `cd /opt/ibc-node && sudo docker compose pull && sudo docker compose up -d`
- Security updates install themselves (`unattended-upgrades`).
- The hostname must never change: every agent registered here stores it as its address.
- The SSH private key is `~/.ssh/gloki_node1` on Eston's Mac, with no passphrase. Back it up
  somewhere safe, or add a passphrase with `ssh-keygen -p -f ~/.ssh/gloki_node1`.

## Known limits

- Anyone can deploy contracts here, and contract code runs in a reduced-builtins `exec`
  inside the container. That is why this runs on its own server and not at home.
- The node checks no signatures yet (`consensus/pbft.py`), so a second node adds a second
  operator but not proof of who wrote what.
- People only use this node if they type its URL at sign-in; the app defaults to Ouri's.
