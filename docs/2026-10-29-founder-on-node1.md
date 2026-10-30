# Becoming Gloki's founder on node1 (29 Oct 2026)

Rehearsed on two local nodes on 29 Oct: node A played `gdi.gloki.contact`, node B played node1 behind Caddy. The
full rehearsal report is `2026-10-29-founder-rehearsal.md`, next to this file.

## What the rehearsal showed

- **It works across two nodes.**
  - The founder signed in on B and pressed "Get verified" (done within 8 seconds).
  - The settings signpost was created on A's `gloki-application` and points to B.
  - The verification contract sits on the founder's agent on B, with the founder as steward.
  - A second person on A asked, the founder approved, and they were verified. No CORS or cross-node errors.
- **HTTPS through Caddy:** the probe, the browser's cross-origin check, sign-up, deploy and the live event stream
  all worked with curl against Caddy's certificate. The browser pane couldn't trust a local certificate, so HTTPS
  in a real browser is first tested on node1 itself, with a real Let's Encrypt certificate.
- **When B (node1) is down:** the signpost on A still answers. Everyone sees "Could not reach the verification
  service. Check your connection and try again." The founder's home page hangs on "Validating session…" until a
  manual reload, even after B is back. Nothing is lost.
- **The URL you type at sign-in is stored exactly as typed**, and every client calls it later, so it has to be
  right first time. Wrong URLs (https on http, http to Caddy, spaces) **fail silently**: the form comes back with
  the key empty and the server reset to `https://gdi.gloki.contact`.

## Eston's script (after node1 is up and read back)

1. Open <https://node1.globaldemocracyinitiative.org/ibc/app/probe?action=is_exist_agent>. It must show `false`
   with a padlock. If not, stop.
2. Open <https://young-world-federalists.github.io/gloki-engage/> in your normal browser and choose
   **Get Started** (not "Sign in as an organization"). In **Server URL**, clear the field and type exactly
   `https://node1.globaldemocracyinitiative.org`: lower case, no slash at the end, no spaces, and **don't** pick
   from the list that drops down (gdi is always first in it).
3. Press the generate button next to the key field (tooltip "Generate a new identity key"). **Before going on,** copy the whole key into your password manager and keep a
   second copy offline, for example written down. There is no recovery: a lost key is a lost founder account.
   Then press **Get Started**.
   - **If the form comes back blank with gdi in the Server URL, sign-in failed. Don't press Get Started again,**
     or the founder account is created on gdi. Tell Claude instead.
4. Finish profile and rules. Then open ☰ → **Verification**, press **Get verified once**, and wait for
   **"You're verified"** (about 8 seconds). Don't press it twice.
5. Send Claude the first 8 characters of your key. Claude reads back the signpost and your contract. Every later
   sign-in is the same key and the same node1 URL, typed: signing in with gdi's URL silently makes a second,
   empty account there.

## Risk: who else could step in

- **The slot is open now, not just while you press.** Since Ouri's new build went live this morning (about 08:30
  UTC), anyone who signs in on the live site sees "Get verified", and the first press makes them founder. It stays
  open until your step finishes. Nothing in the app guards it; the "If you are Eston or Ouri…" line is copy only.
  - To keep it short: do the founder step **straight after node1 is read back**, and don't share the live link
    before then.
  - Ouri could hide the button meanwhile, but that's a code change and his call.
- **During your step (about 8 seconds):** the order is deploy your contract on node1 → initialize → create the
  signpost on gdi if none exists → register (`src/services/verificationRegistry.ts:195-223`). If someone gets in
  first, you see "Verification has already started", and your contract is left unused. Claude reads back right
  after, so a lost race would show at once.
- **After your step, permanently:**
  - Anyone can overwrite your entry on the signpost and point every client at another server.
    `register_verification` replaces `hosts[agent]` without checking (settings contract line 31), and clients
    always use the first host.
  - Anyone can vouch as anyone in the verification contract.
  - **Both contracts are created from the live site's code at the moment you press, and their code can't change
    afterwards.** A fix has to be live before you press, or it means a new contract and moving the list later.
  - The smallest fix is one check in `register_verification`: refuse to change the server for an agent already on
    the list. That stops the repointing. Others could still add themselves, but the founder entry stays.
  - Caveat: "first host" comes from the node's storage order, which is unsorted and not guaranteed. It is
    insertion order in practice; Ouri can confirm.
  - Vouching as someone else can't be fixed without signatures.
- **Choice for Eston:** press soon after node1 is up and accept these flaws for the beta, **or** ask Ouri to ship
  the one-line signpost fix first, which keeps the slot open longer. Either way, a regular read-only check that
  the signpost still points at node1 would catch tampering.
