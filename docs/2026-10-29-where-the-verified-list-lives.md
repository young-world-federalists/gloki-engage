# Where the verified list lives now (29 Oct 2026)

After Ouri's change on `server-side` (`27c65e9`, tidied in `8d9e062`). Sources: `src/services/verificationRegistry.ts`,
`src/services/applicationSettings.ts`, `src/assets/contracts/gloki_engage_application_settings.py`, and the
29 Oct addendum in `docs/FOR_OURI_seam.md` ("Where it lives (revised 2026-10-29)").

## The short version

- **The verified list** is the verification contract. It is now deployed by the first person to get verified (the
  founder and steward) on **their own agent, on the node they signed in with**. The app's sign-in defaults to
  `https://gdi.gloki.contact`, so unless the founder types another node's URL, the list still sits on Ouri's node.
- **What stays on `gdi.gloki.contact`:** the central account `gloki-application` and a small new contract on it,
  "gloki engage application settings". It is a signpost: it holds the verification contract's id and a list of hosts
  (`{server, agent}`) that hold a copy. Every client reads the signpost first, then calls the list on the first host.
  So Ouri's node is still the one way in: if it is down, nobody can find the list, wherever the list itself lives.
- **The ui stub Ouri asked for is moot for now.** `ui` has no `verificationRegistry.ts`; its verification pages run
  on mock data and already show the four-vouch page. It comes back as part of the single-`main` plan: demo mode will
  need a mock registry behind the same interface.

## What is live right now

Read-only checks on 29 Oct, about 10:00 UTC:

- The site root (`young-world-federalists.github.io/gloki-engage/`) runs the new code: the bundle references the
  settings contract.
- `gloki-application` on `gdi.gloki.contact` holds **one** contract: the 28 Oct verification contract (the one with a
  founder whose key starts `P4ZtJ88H…`). The new code ignores it. **There is no settings contract yet.**
- So the live app is **back in the founder phase.** The first signed-in person who opens Verification sees
  "Get verified", and pressing it makes them the steward and first verified person of the whole app. Nobody is
  verified under the new setup, and the 28 Oct founder would have to do it again.

**Decide who goes first before the link is shared.**

## What node1 would need to be a steward

node1 (`node1.globaldemocracyinitiative.org`, not running yet) is the first steward candidate. To actually hold a
copy of the list it needs:

1. **A steward agent on node1:** a person who signs in with node1's URL, so their agent lives there.
2. **A copy of the verification contract.** The node can do this (`join_contract`: the steward's agent joins the
   founder's contract, and the nodes keep the copies in step), but the app has no steward-join step yet.
3. **Its entry on the signpost:** `register_verification(node1 URL, steward agent, same contract id)`. The contract
   already allows this: the same id adds another host.
4. **Clients that use more than the first host.** Today the app only ever calls `hosts[0]`, so a second host adds a
   copy but not resilience until clients fall back to the next host.
5. **For real independence: a second signpost.** As long as the only signpost is on `gdi.gloki.contact`, that node
   is a single point of failure. A copy of the settings contract on node1, with the app knowing both URLs, removes it.

## Limits that still apply

- **No signatures.** The node checks none, so any caller can pass any key. On the signpost, anyone can add
  themselves as a host for the existing contract id. That is harmless while clients only use the first host, and it
  becomes a hijack route once they use the others. Ouri doesn't expect signatures soon: he says a secure version needs
  a funded full-time team.
- **Open deploy.** Anyone can deploy contracts on any agent name, including `gloki-application`. Whichever settings
  contract the account lists first wins.
- The design reduces central control but does not remove it: someone still has to find the first verified person,
  and the signpost lives on one node.
