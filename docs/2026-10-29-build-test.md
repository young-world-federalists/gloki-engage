# Gloki build test, 29 Oct 2026: `server-side` @ 0cbbf6e on a local node

**What was tested:** Ouri's `server-side` branch at commit `0cbbf6e`, run with `npm run dev` against the local ibc node in Docker (`127.0.0.1:2611`). `.env.local` pointed the application server at the local node. Five test people each used their own browser origin:

| Person | Origin |
|---|---|
| Alice (A) | `localhost:7173` |
| Bob (B) | `b.localhost:7173` |
| Carol (C) | `c.localhost:7173` |
| Dan (D) | `d.localhost:7173` |
| Eve (E) | `e.localhost:7173` |

**Safety check:** nothing in this test wrote to `gdi.gloki.contact`.
- The dev server's built config reads `VITE_APPLICATION_SERVER_URL = http://127.0.0.1:2611`.
- In every tab, the browser's resource list showed only the page's own origin and `127.0.0.1:2611`.
- The only contact with gdi.gloki.contact was two read-only lookups (GET `is_exist_agent` and `get_contracts`) for the live section below.

## What worked (I watched each of these happen)

1. **Sign-up** worked for all five people on the local node: key, profile, rules, ready.
2. **Founder.** Alice pressed **Get verified** and was "You're verified" in about 5 seconds. A curl check confirmed it on the node:
   - The settings contract `gloki_engage_application_settings.py` is now on `gloki-application@127.0.0.1:2611`.
   - `get_verification` returns the verification contract `99a268d1…`, with hosts `[{agent: Alice, server: http://127.0.0.1:2611}]`.
   - That contract sits on Alice's own agent. `get_status` lists Alice as steward and as verified with `method: founder`.
3. **Community.** Alice created "Riverside Neighbours".
4. **Joining by JSON.** Bob pasted `{server, agent, contract}` on the Join Community page, which is in the ☰ menu under "Join Community". He joined in about 5 seconds, and Alice's Members page now shows both Alice and Bob.
5. **Sequential phase, person #2.** Bob opened Verification and saw "0 of 1 verified people have vouched for you", with Alice listed by name. He pressed **Ask**. Alice saw "Requests to vouch: 1 waiting" and pressed **Approve**. Bob's page turned to "You're verified" by itself within one 15-second refresh. The contract shows Bob as `sequential` with Alice as his voucher.
6. **Person #3, and "someone else is being verified".** Carol asked Alice. While Carol held the slot, Dan saw "Someone else is being verified right now". Alice approved, then Bob approved, and Carol became verified on her own. Dan's page then switched by itself to "0 of 3 verified people have vouched for you".
7. **Open phase (#5 onward).** With four people verified, Eve saw "0 of 4 approvals received" and the four pathway cards. "Ask a member" listed all four verified people by name. Dan only got to four through the curl test in issue 1.
8. **Node down.** I stopped the node container. Pages showed "Could not reach the verification service…", then recovered by themselves after I restarted it. No data was lost.

## What I could not get through, or didn't see

- I didn't get the clipboard "copy join details" to work. The browser pane blocks clipboard writes, so I built the JSON by hand from `get_contracts`. This is also issue 6.
- **No open-phase verification through the UI.** Nobody went from 0 to 4 approvals by asking in the app.

---

## Ranked list (most serious first)

### 1. Anyone can vouch, register or reset *as anyone else*. Bug (security, by design today)
- **Steps:** Ouri can run this, or Eston can paste it into Terminal with the local node running.
  1. Read the verification status. It lists every verified person's key:
     `curl -s -X POST -H 'Content-Type: application/json' -d '{"values":{}}' "http://127.0.0.1:2611/ibc/app/<FOUNDER_KEY>/<VERIFICATION_ID>/get_status?action=contract_read"`
  2. As a brand-new person (Dan), send `request_vouch` to each verified person.
  3. Then send `vouch` with `voucher` set to *Alice's* key, then Bob's, then Carol's.
  4. Then send `register`.
- **What happened:** Dan became verified (`method: sequential`, vouchers Alice, Bob and Carol). None of them pressed anything. Their screens never showed a request from Dan.
- **Expected:** only Alice can vouch as Alice.
- **Cause:**
  - Every method takes the acting person's key as a plain argument, and keys are public in `get_status`.
  - Affected methods: `vouch(voucher, requester)`, `register(newcomer, …)`, `decline_vouch(approver, …)` and `reset_candidate(steward)`.
  - Locations: `src/assets/contracts/gloki_verification_contract.py` lines 100, 114, 125 and 162.
  - The seam doc already says "no signatures — the same trust model as everything else today". For the verification list, though, that means the "verified" badge proves nothing yet.
  - The same goes for `reset_candidate`: anyone can pass the steward's key.
- **For the meeting:** is this acceptable for the beta? If not, what is the plan (signatures, or people joining the contract)?

### 2. Anyone can point the whole app's verification at another server, or break it. Bug (security)
- **Steps:** Ouri can run this. On a *throwaway* settings contract I sent `register_verification` with `agent` set to the founder's agent and `server` set to `http://evil.example`.
- **What happened:** `get_verification` now returns the founder's entry with `server: http://evil.example`. Every client uses `hosts[0]` (`src/services/verificationRegistry.ts:135`). So one call can either break Verification for everyone ("Could not reach the verification service") or send everyone to a server the caller controls.
- **Expected:** only the host itself (or a steward) can add or change its own entry.
- **Cause:** `register_verification` doesn't check who is calling and overwrites `self.hosts[agent]` (`src/assets/contracts/gloki_engage_application_settings.py` lines 23–32, line 31). Writes to `gloki-application` also carry no signature, so anyone can make them.

### 3. On the live site, the first visitor to press "Get verified" becomes steward of the whole live app. Bug / risk
- **Evidence (read only, no writes):**
  - `gloki-application` on gdi.gloki.contact exists. Its only contract is an *old* `gloki_verification_contract.py` (id `f580c1cb…`, default_app `http://localhost:7173`).
  - There is **no** settings contract yet.
  - The live bundle (`index-BPfqOWIe.js`) contains the new code: "gloki engage application settings", `gdi.gloki.contact` and `gloki-application`.
  - The seam doc says the new code ignores the old contract. The live app is therefore in the founder phase.
- **Steps (don't do this on live):**
  1. Sign up on https://young-world-federalists.github.io/gloki-engage/.
  2. Open ☰ → Verification.
  3. You get one button: "If you are Eston or Ouri, you can become verified by clicking the button."
- **What would happen:** whoever clicks first deploys the verification contract on their own agent, becomes steward, and is the only person who can start everyone else's verification.
- **Expected:** a real gate, or Eston/Ouri claim it first.
- **Cause:** `src/components/identity/verification/VerificationHub.tsx` lines 70–86. The copy is a reminder, not a check.
- **Decision for the meeting:** should Ouri (or Eston) press it on live today?

### 4. The demo at `/demo/` and the live app share sign-in storage. A demo sign-up quietly creates an account on Ouri's live node. Bug (data / privacy)
- **Steps:** I did not run these on live. The second half is reproduced locally.
  1. Sign up on `…/gloki-engage/demo/` (mock data).
  2. Open `…/gloki-engage/` (real servers) in the same browser.
- **What happens (from the code, plus a local test):**
  - Both apps live on the same origin, `young-world-federalists.github.io`, and both keep the session in `localStorage['user']`. On `ui`, the default server is also `gdi.gloki.contact`.
  - On load, the real app finds a stored `user` and calls `initializeUser`, which runs `registerAgent` if the agent doesn't exist.
  - Locally I put a made-up key in `localStorage['user']` and reloaded. The node then reported that agent as existing (`is_exist_agent → true`), and the app opened profile setup with no question asked.
- **Expected:** demo and real sessions are kept separate, for example with different storage keys.
- **Cause:** `src/contexts/AuthContext.tsx` lines 62–70 and `.github/workflows/deploy.yml` (both apps on one Pages site).

### 5. "Request" or "Ask" when the node is down shows "Requested ✓" forever, but nothing was sent. Bug
- **Steps:**
  1. Open Verification → Ask a member.
  2. Stop the node (or lose connection), then press **Request**.
- **What happened:**
  - The button turned into "Requested ✓", with no lasting error.
  - When the node came back, the button still said "Requested ✓".
  - The contract had **no** request.
  - The console showed `Uncaught (in promise) Error: Could not connect to the server`.
- **Expected:** a clear error, and the button returns to "Request".
- **Cause:**
  - In `src/components/identity/verification/RequestPage.tsx` lines 33–38, `await refetch()` sits in `finally`. When it throws, the line that clears the "in flight" state never runs.
  - The `useEffect` in `src/hooks/useVerification.ts` (~line 50) also has no `.catch`.

### 6. "Share Community Link" can fail silently, and it doesn't share a link. Bug + UX note
- **Steps:**
  1. Open a community, then Options (☰) → **Share Community Link**.
- **What happened:**
  - In the browser pane, clipboard write was denied. The only sign was a console error ("Failed to copy join details: NotAllowedError"). No message appeared and the JSON was never shown on screen.
  - In normal Chrome it will usually work, but a blocked clipboard (some browsers, iframes, phones) gives a dead end.
- **Expected:** show the JSON (or a QR code) on screen with a Copy button and a fallback.
  - The label should also match: it copies JSON, not a link.
  - "Invite Members" just opens the member list, with no invite tool.
- **Cause:** `src/pages/CommunityView.tsx` lines 254–270 (the catch only logs) and line 307 (the label). There is a `Share.tsx` component with a QR code and copy, but the menu doesn't use it.

### 7. Sign-up tells people "nothing here leaves your browser yet". That's false on the real app. Bug (copy)
- **Steps:**
  1. Sign up.
  2. Look at step 2, "How we work together".
- **What happened:** "This is an early pilot — nothing here leaves your browser yet." But the profile, community and vouches are written to the node.
- **Cause:** `src/components/onboarding/steps/RulesStep.tsx:53`.

### 8. The steward sees a raw key instead of a name. Bug
- **Steps:**
  1. As the founder, wait until someone asks for a vouch.
  2. Open Verification.
- **What happened:** "kJcFEWFU is being verified now…" The Approve page shows the same person correctly as "Bob Test".
- **Cause:** the name lookup only covers *verified* people (`useVerifiedMembers`), and the candidate isn't verified yet (`src/components/identity/verification/VerificationHub.tsx:97`). `useRequesterSummaries` (in `useVerificationRegistry.ts`) already does the right lookup.

### 9. Once you're verified, the record of who vouched for you disappears. Bug
- **Steps:**
  1. Get verified as person #2 or #3.
  2. Open Verification.
- **What happened:** "Your approvals: No approvals yet. Ask a member to vouch for you." The contract does keep the vouchers in the verified record (`vouchers: [Alice]`).
- **Cause:**
  - `register` deletes that person's vouches (`_drop_requester`, `gloki_verification_contract.py:157`).
  - The approvals list reads only the `vouches` list (`src/services/verification.ts:107–109`), not `verified[].vouchers`.
  - The same empty-state text tells a *verified* person, including the founder, to "ask a member to vouch for you" (`ApprovalHistory.tsx:43`).

### 10. In the open phase, three of the four ways to get verified are pretend, and a pretend call leaves fake notifications behind. Bug + UX note
- **Steps:**
  1. As person #5 or later, open Verification → **Start a call**.
  2. Pick four people and press **Start**.
  3. Wait for the call to end.
  4. Open the bell.
- **What happened:**
  - The call screen says "Demo: no real call is made…" and lists made-up people (Sereana Naidu, Valentina López…). They "join and verify", then you land back on "0 of 4 approvals received".
  - Afterwards the browser's local record says Eve has four vouches (`vouchedBy: demo-verif-…`).
  - The bell showed 6 unread, including "A vouch request from Wanjiru Kamau is waiting for you" from "5h ago", for an account made minutes earlier.
  - Invitations and the Daily session are simulated too.
- **Expected:** on the real app, hide or clearly mark what can't verify anyone, and don't create fake notifications.
- **Cause:** `src/services/demo/verificationDemo.ts:110–112` (`demoPrimeRequestNotifications` uses the local `vouchedBy`), and the sims in `src/services/demo/verificationSim.ts` and `dailyVerificationSim.ts`.

### 11. People asked to vouch get no notification. UX note
- **Steps:**
  1. As Bob, ask Alice.
  2. As Alice, open the bell.
- **What happened:** "No notifications yet". The only sign was "Requests to vouch: 1 waiting" deep inside the Verification page. Nobody is told when they are verified, or when the queue frees up.

### 12. Node-down message blames the user's connection and talks about "the verification service". UX note
- **Steps:**
  1. Stop the node.
  2. Open Verification.
- **What happened:** "Could not reach the verification service. Check your connection and try again." The person's own connection is fine. What is down is the founder's node, or `gdi.gloki.contact`, which holds the settings. "Verification service" also sounds like a company in the middle.
- **Cause:** `VerificationHub.tsx:59`.

### 13. "Someone else is being verified right now" is a dead end. UX note (data model)
- **What happens:**
  - You get no name, no wait time, and no alert when the slot frees up (Dan's page did update on its own, but only while it stayed open).
  - The slot never expires. If the candidate gives up, everyone waits until the steward presses "Reset current candidate".
  - While Gloki has fewer than four verified people, one absent person blocks everyone.
- **Cause:** contract `request_vouch` (lines 84–89), with no timeout.

### 14. The Approve page says "Your vouch counts toward their four" during the first phase. UX note (copy)
- During the sequential phase, *everyone* verified must vouch: 1, then 2, then 3, not four.
- `ApprovePage.tsx:62`. The Ask page has the same wording: "Each approval counts toward your four."

### 15. Little feedback while waiting for the network. UX note
- **Get verified:** the button just greys out for about 5 seconds, with no spinner or "Setting up…".
- **Ask and Approve:** these flip to "Requested ✓" and "Approved" right away, before the node confirms. The toast comes about 4 seconds later, and if the write fails the screen still says it worked (see issue 5).
- **After the last vouch:** the newcomer just turns verified within 15 seconds. There's no "Alice vouched for you" moment.

### 16. Joining a community: hard to find, and no confirmation. UX note
- **Hard to find:** the empty Communities page says "Create or join a community to get started" but only has a **Create** button. Join is only in the ☰ menu.
- **Asks too much of the person:** they have to paste raw JSON with `server`, `agent` and `contract`, which is not doable for a non-technical person without hand-holding. A QR scanner is there but untested.
- **No confirmation:** after joining, the app goes back to Communities with no "You joined" message. The success banner in `JoinCommunity.tsx` (`joinSuccess`) is never set to true.

### 17. Member counts disagree. Bug (minor)
- **What happened:** after creating or joining, the Communities list says "0 members" while the community page says "1 member · 1 countries". The second is also a grammar slip.
- **Cause:** the count is only filled in after the community page has loaded (`src/components/identity/Communities.tsx:147`).

### 18. The automatic "register me" step fails silently. Bug (code reading, not triggered)
- **The gap:** if the final `register` call is refused, the only trace is `console.error('[Verification] register failed')` (`src/hooks/useVerificationRegistry.ts:59–60`).
- **The fallback doesn't help:** the "Complete verification" button just repeats the same silent attempt.
- **What the person sees:** stuck on "N of N vouched" with no explanation.

### 19. A failed founder step can leave an orphan contract. Bug (code reading, not triggered)
- **The steps:** `becomeFounder` deploys on the founder's agent, then calls `initialize`, then deploys or registers settings on the central account.
- **What can go wrong:** if the last step fails (for example, gdi.gloki.contact is down), the founder keeps an initialized but unpublished contract. Pressing again deploys a second one.
- **Location:** `src/services/verificationRegistry.ts` lines 195–224.

### 20. Data-model notes for Ouri (not bugs as such)
- **Two single points of failure.** Every client needs **both** gdi.gloki.contact (the settings) **and** the founder's own node (`hosts[0]`). Only the first host is ever used, with no fallback to others (`verificationRegistry.ts:135`). If Alice's node is down, nobody in the app can check, ask, vouch or become verified.
- **The host is cached until reload.** Clients keep the host they found until the page reloads (`known`, `verificationRegistry.ts:128–137`).
- **The contract's header comment is stale.** It still says "Deployed once, under the application agent" (`gloki_verification_contract.py` lines 2–7).
- **The Verification page fires duplicate checks.** It sent 9 identical `is_exist_agent` calls at once on load (seen in the browser's network list). It's harmless, but it's wasted calls on a slow phone.
- **Every verified person is listed to every newcomer.** The sequential list shows all verified people app-wide, not people from your communities. Carol, in no community, was asked to approach Alice and Bob. That's fine for four founders, but worth deciding.

---

## Live URL, read only (https://young-world-federalists.github.io/gloki-engage/)

- **Sign-in page.** It loads and shows "Welcome to Gloki" with Problem / Solutions / Vote / Mandate, an identity key field, and Server URL prefilled as `https://gdi.gloki.contact`. A language switcher is shown.
- **No network calls on load.** Opening the page made no requests to gdi.gloki.contact.
- **"How Gloki works" (i).** It explains the key and the server in two short lines. Nothing says that the key *is* you, that it isn't stored anywhere else, or that losing it means losing the account.
- **The root and `/demo/` speak differently.**
  - `/demo/` (the `ui` beta trim) says "a network of people who vouch for each other, with a key instead of a password and no company in the middle" and offers person, organisation, node contributor and "I already have a key".
  - The root uses older demo-mode wording ("Global direct democracy…") and still has "Sign in as an organization" on the first screen.
- **The live app is in the founder phase.** See issue 3. Anyone who signs up gets the "If you are Eston or Ouri…" button.
- **Shared sign-in storage.** Both apps share one browser storage area. See issue 4.

## What I could NOT test, and why

- **The live site beyond reading.** By your rules: no sign-in, no sign-up, no writes.
- **The clipboard copy and QR scan for joining.** The browser pane blocks clipboard writes and has no camera. I pasted the JSON by hand.
- **One person's node down while others stay up.** All test people used the same local node, so stopping it took everyone down together. That a separate founder node going down would break verification for everyone is inferred from the code (`hosts[0]`), not seen.
- **A full open-phase verification through the UI.** No four real UI vouches for person #5. Dan reached four only through the curl test in issue 1.
- **Decline and "Ask again".**
- **"Reset current candidate"** pressed by the steward.
- **Two founders racing.**
- **"Complete verification"** fallback button.
- **The `/demo/` (beta) build.** I didn't run it locally. Issue 4's cross-path step comes from reading the code plus a local repro of the auto-register half.
- **Phone layout** and other browsers.

## State left behind

- **Local node.** Still running; the node container was stopped once and restarted, and its data was kept. It now holds:
  - `gloki-application` with the settings contract
  - verification contract `99a268d1…` on Alice's agent, with Alice, Bob, Carol and Dan verified
  - the community "Riverside Neighbours"
  - Eve (unverified)
  - a throwaway agent `throwaway-settings-1793267927`
  - an agent registered from a stored key (`StoredDemoKey…001`)
- **Worktree.** `…/scratchpad/ge-server-side`, holding `.env.local` (gitignored). Nothing committed or pushed.
- **launch.json.** The entry I added is removed. Another session's `gdi-redesign` entry was left alone.
