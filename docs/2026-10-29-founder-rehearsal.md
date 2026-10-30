# Founder setup rehearsal: verification on node1, signpost on gdi (29 Oct 2026)

**Short answer.** The setup works as planned:
- The founder signs in on node1 and presses **Get verified**.
- The verification contract ends up on node1, under the founder's own agent.
- The signpost (the settings contract) ends up on the central account, `gloki-application` on gdi.
- A second person signed up on gdi asked the founder for a vouch, got it, and became verified.
- I saw no CORS or cross-node errors.

There are two traps at sign-in that Eston should know about (see "Sign-in instructions for Eston").

## Setup

| Piece | What it was in the rehearsal |
|---|---|
| App | `server-side` @ `0cbbf6e` (Ouri hasn't pushed since; checked with `git log -1 origin/server-side` after a fetch). `npm run dev` on port 7183, with `.env.local` set to `VITE_APPLICATION_SERVER_URL=http://127.0.0.1:2621`. I confirmed that value in the module the dev server serves. |
| Origins | Fresh origins, so no leftover browser storage: founder `f1.localhost:7183`, second person `p2.localhost:7183`, throwaway `t3.localhost:7183`. |
| Node A (plays gdi.gloki.contact) | Compose project `reh-a`, a copy of the local dev compose with ibc on `127.0.0.1:2621`. |
| Node B (plays node1) | Compose project `reh-b`, a copy of `node1/compose.yml` and `Caddyfile`. The originals were not edited. Changes in the copy: `NODE_HOST=node1.localhost`; Caddy on `127.0.0.1:8880` (http) and `127.0.0.1:8443` (https); plus a rehearsal-only plain port, ibc on `127.0.0.1:2622`. Host ports 80, 443 and 8443 were all free; I used 8443 and 8880 and bound them to localhost only. |
| Browser flow on B | Used `http://127.0.0.1:2622`, because the browser pane can't trust Caddy's local certificate authority. |
| HTTPS on B | Proven separately with curl (below). |

I made no changes to the macOS keychain or trust settings. The "certificate installed properly in linux trusts" line in Caddy's log refers to the inside of its own container.

### What the founder typed
`http://127.0.0.1:2622`

That exact string is stored everywhere:
- in the founder's browser session (`localStorage.user.serverUrl`)
- in node B's agent record (`agents.address`)
- in the verification contract (`verified[].address`)
- in the signpost (`hosts[0].server`)

Every client, the second person included, then calls that string.

## What worked (each one seen)

### HTTPS through Caddy (curl with `--cacert`, using the root cert copied out of the container)
- **`is_exist_agent`:** `https://node1.localhost:8443/ibc/app/probe?action=is_exist_agent` answers `false` with HTTP 200.
  - Without `--cacert`, curl fails with "unable to get local issuer certificate", as expected.
- **CORS preflight:** an OPTIONS request with `Origin: http://f1.localhost:7183` gets HTTP/2 200. The response echoes that origin back in `access-control-allow-origin`, and allows the PUT and POST methods and the content-type header. The GET reply carries `access-control-allow-origin: *`.
- **Register and `/stream`:** `register_agent` worked (ack returned, then `is_exist_agent` returned `true`). I opened `/stream?agent=…&contract=` over HTTPS and deployed a contract. The stream delivered `{"action":"deploy_contract","reply":true,…}`. The stream's response headers are `content-type: text/event-stream` and `access-control-allow-origin: *`, served through Caddy (`via: 1.1 Caddy`). The contract's stored address is `https://node1.localhost:8443`.

### Step 1: the founder on B
1. The founder generated a key, typed `http://127.0.0.1:2622`, finished the profile, opened Verification and saw "If you are Eston or Ouri… **Get verified**". He clicked it and was "You're verified" within 8 seconds. The console showed no errors, and the page only talked to `127.0.0.1:2622` and `127.0.0.1:2621`.
2. **Read back with curl:**
   - **On node A:** `gloki-application` holds exactly one contract, `gloki_engage_application_settings.py` (id `d244bd45…`).
   - **On node B:** there is no `gloki-application` account at all (`is_exist_agent` returns `false`).
   - **A's `get_verification`:** returns `{"contract":"18dfe7b0…","hosts":[{"agent":"9qeYfi8Y…(founder)","server":"http://127.0.0.1:2622"}]}`.
   - **The founder's agent on B:** holds `digital_agent_contract.py` and `gloki_verification_contract.py` (`18dfe7b0…`).
   - **`get_status` on B:** returns `steward: 9qeYfi8Y…`, with the founder verified (`method: founder`) and `address http://127.0.0.1:2622`.
   - **The founder on A:** has no account there (`is_exist_agent` returns `false`). That is correct: the founder lives only on B.

### Step 2: a second person on A
1. The second person signed up with `http://127.0.0.1:2621` and opened Verification. The page read "0 of 1 verified people have vouched for you", with **Founder Rehearsal** listed by name. That name was read from the founder's profile on B.
2. **Ask:** the request was recorded on B (`candidate 4dzveIiO…`, request `pending`, `address http://127.0.0.1:2621`).
3. **Approve:** on the founder's side, "Second Person … asked you to vouch" appeared, with the name read from A. He pressed **Approve**.
4. **Verified:** within one 15-second refresh, the second person's page showed "You're verified". On B, `get_status` lists them as `sequential`, with the founder as voucher and `address http://127.0.0.1:2621`.
5. **Cross-node errors:** none. Both consoles stayed empty. The network list shows the second person's browser calling B directly (preflights, `get_status`, `register`, all 200). The one `/stream … ERR_ABORTED` is the app closing its own ack watcher, which is normal.

### Step 3: node B down
1. I ran `docker compose -p reh-b stop`, which stopped all of B (Caddy, ibc, mongo and redis).
2. **A's signpost still answers:** `get_verification` on A returned the same contract and hosts.
3. **Both people, on Verification after a reload:**
   > Could not reach the verification service. Check your connection and try again. [Try again]

   The page title still says "Get verified", even for the founder. The console shows `Uncaught (in promise) Error: Could not connect to the server — it may be unreachable.` from `getRegistryStatus`, plus `ERR_CONNECTION_REFUSED`.
4. **The founder, reloading the home page:** stuck on **"Validating session…"**, a spinner with no message or button. It was still stuck after 40+ seconds, and still stuck 10 seconds after B came back. Only a manual reload fixed it.
5. **The second person, reloading the home page:** works ("No activity yet…"). Their account is on A; only verification depends on B.
6. **Recovery:** I ran `docker compose -p reh-b start`. B answered again (`is_exist_agent` returned `true` over both http and https). After a reload, both people saw "You're verified" again. No data was lost.

## Sign-in URL tests (throwaway person only, against B)

`validateServerUrl` (`src/pages/LoginPage.tsx`) accepts anything `new URL()` parses with `http:` or `https:`. Whatever is typed is stored exactly as typed; nothing is trimmed or normalised.

| Typed | Accepted? | What happened | Stored (browser and node) |
|---|---|---|---|
| `http://127.0.0.1:2622` | yes | works | `http://127.0.0.1:2622` |
| `http://127.0.0.1:2622/` (trailing slash) | yes | works: requests go to `…2622//ibc/app/…` and the node answers them | `http://127.0.0.1:2622/` (the slash is kept, in the node's agent record too) |
| `HTTP://Node1.LocalHost:2622` (upper case) | yes | works: the browser sends lower case | `HTTP://Node1.LocalHost:2622`, exactly as typed |
| `https://127.0.0.1:2622` (https on a plain-http port) | yes | **fails silently**: "Validating session…", then the form comes back reset | nothing stored |
| `https://node1.localhost:8443` (certificate not trusted) | yes | **fails silently**, the same way (`ERR_CERT_AUTHORITY_INVALID` in the console) | nothing stored |
| `http://node1.localhost:8880` (http to Caddy) | yes | **fails silently**. The console shows: "Access to fetch at 'http://node1.localhost:8880/…' … blocked by CORS policy". Caddy answers 308 → https, and a redirect reply carries no CORS header. | nothing stored |
| `  http://127.0.0.1:2622  ` (spaces) | yes, the button turns blue | **fails silently** | nothing stored |
| `node1.localhost:2622` (no scheme) | **no**: button disabled, "Server URL must use http or https." | (not sent) | n/a |
| `node1.globaldemocracyinitiative.org` (no scheme) | **no**: "Please enter a valid URL" (checked with the same parse rule in the page) | (not sent) | n/a |

**"Fails silently" means:**
- The screen shows "Validating session…" for a few seconds.
- Then the sign-in form comes back with the **key field empty** and the **Server URL reset to `https://gdi.gloki.contact`**.
- **No error is shown.**

The sign-in code does set an error, but the whole sign-in page is swapped out for the spinner while it waits (`src/App.tsx:115–121`), so the error is lost when the page comes back.

## Sign-in instructions for Eston

1. **Type exactly** `https://node1.globaldemocracyinitiative.org`:
   - `https`, lower case
   - no trailing slash
   - no spaces
   - no port

   This string is stored forever in the signpost, and everyone calls it.
   - **Before pressing Get Started:** check in a browser that `https://node1.globaldemocracyinitiative.org/ibc/app/probe?action=is_exist_agent` shows `false` with a valid padlock.
   - **`http://` doesn't work**, even on a node that redirects to https. The redirect breaks CORS, and the live site, which is on https, would also block an http call.
2. **If the form comes back blank with `https://gdi.gloki.contact` in the Server URL, the sign-in failed.** Do **not** press Get Started again: that would create the founder's account on gdi. Fix node1 first.
3. **Which choices to make:**
   - **Door:** none. The live root runs the full app, not the beta, so it has no doors page. Use the person sign-in ("Get Started").
   - **Account kind:** do **not** use "Sign in as an organization".
   - **History dropdown:** clicking into the Server URL field opens a list of past servers, with `https://gdi.gloki.contact` always first. Clicking an entry replaces the typed URL. Type the URL, don't pick it from the list, and check the field before pressing Get Started.
4. **Save the key before doing anything else.** It is the only way back in.
5. **Every later sign-in with that key must also use node1's URL.** The field resets to gdi every time.
   - I tested this with a throwaway key that already lived on B, signed in with A's URL. A's node silently created a second, empty account for the same key (`is_exist_agent` returned `true` on both A and B) and sent the person to "Create your profile".
   - With the founder's key, that would be a second, empty founder account on gdi.

## Other things found
- **The founder's whole app hangs when node1 is down,** not just Verification: "Validating session…" forever, with no way out except a reload after node1 is back. Cause: `src/contexts/AuthContext.tsx` lines 62–70, together with `validateStoredCredentials` at lines 80–97. The stored session is checked without catching errors, so `isLoading` never clears.
- **The node-down message blames the user's connection.** Both people saw "Check your connection", while the real cause is node1.
- **`node1/compose.yml` uses `name: ibc`,** the same Compose project name as the local dev node on this Mac. Running both on one machine without `-p` would merge them into one project. Not a problem on the server, but worth knowing.
- **http://node1 redirects to https://node1, and that redirect breaks CORS.** This needs no change on the server, as long as nobody types `http://`.

## What I could not test
- **Caddy's real HTTPS in the browser.** The pane can't trust Caddy's local certificate authority, and installing it wasn't allowed. The HTTPS path was proven with curl only: `is_exist_agent`, preflight, register, deploy and `/stream`. The browser flow ran over plain http on port 2622.
- **Let's Encrypt on the real node1 domain.** The rehearsal used Caddy's internal certificate.
- **The live site (https://young-world-federalists.github.io) calling node1.** That page is https, while the browser flow here was http-to-http.

## Tear-down
- **Rehearsal stacks:** I ran `docker compose -p reh-a down -v` and `docker compose -p reh-b down -v`. No `reh-*` containers, volumes or networks remain.
- **Dev node:** the original `ibc` stack (127.0.0.1:2611) was left alone and is still up.
- **launch.json:** the rehearsal entry is removed; `gdi-redesign` is untouched.
- **Worktree:** `.env.local` is set back to `http://127.0.0.1:2611`. Nothing committed or pushed, and no messages sent.
