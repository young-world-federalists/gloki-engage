# Orchestrator handoff: GDI / Gloki (30 Oct 2026)

Paste the prompt below into a new session opened in `Gloki Build/`.

---

## Restart prompt

You are the orchestrator for the GDI / Gloki work. Keep the builder sessions moving and help them collaborate. Relay what Ouri Poupko says into their work, and help Eston draft short WhatsApp replies to Ouri. Don't merge or deploy anything without Eston's explicit OK.

**Read first:**
- `Gloki Build/docs/STATUS.md`, the workstream board.
- `docs/2026-10-29-signing-decisions.md`, the seven signing answers and the build order.
- `docs/2026-10-29-unified-test.md`
- `docs/2026-10-29-founder-on-node1.md`

These are local files on the 2TB drive and aren't in git. Gloki Build itself isn't a repo.

**Sessions:**
- **Gloki Build Restart** (`local_6e4ec11e-daad-42ad-8ccd-7e6bb1e35eb5`): node1, the trust model, the gloki-engage app.
- GDI Site and GDI List finished on 29 Oct. gloki-site #3 and #4 are merged, and #1 and #2 are closed. The waitlist is on Brevo.

### Where things stand (checked 29 Oct 17:38 UTC, unless noted)

**Repos.** Ouri merged `unified` into gloki-engage `main` (44792f2). Old main is now `archive-main-oct-26`. The new workflow: feature branches off `main`, merged back when done. `ui` and `server-side` are retired. His "heavy and deep cleanup" (abc2c54, 235 files) removed nothing of ours. gloki-engage PR #20 (`ui`, from June) is still open and is now stale.

**Deploy.** Deploys are manual: Actions → Deploy to GitHub Pages → Run workflow. The whole site at https://young-world-federalists.github.io/gloki-engage/ is built as the beta. `?demo=true` switches any page to demo data, and localStorage `gloki.fullApp=true` shows the full app. A merge to `main` deploys nothing until someone runs the workflow, and that needs Eston's OK.

**Still broken on `main`:**
1. `register_verification` (`src/assets/contracts/gloki_engage_application_settings.py:23`) overwrites `hosts[agent]`, so anyone can repoint it. The fix is to refuse to change an existing host's server. Contract code is fixed at deploy, so this must be live before the founder presses "Get verified".
2. The Back button carries demo mode into real pages: module-level `stickyDemo` in `src/hooks/useDemoMode.ts`.
3. The beta home is `/forum` (`App.tsx:90`), but `/forum` is wrapped in `DemoOnlyPage` (`App.tsx:164`). So every real visitor lands on "Not yet implemented".

**Founder.** Eston decided to be the founder, signed in on node1. The live `gloki-application` on gdi.gloki.contact held only the 28 Oct verification contract, with no settings contract. So the founder slot is open, and the first signed-in visitor to press "Get verified" becomes founder. Re-check before acting:

```bash
curl -s "https://gdi.gloki.contact/ibc/app/gloki-application?action=get_contracts"
```

**node1** (node1.globaldemocracyinitiative.org) is waiting on Eston:
1. Order the OVH VPS-1.
2. Add the Cloudflare A record `node1`, DNS only, in the "YWF Cloudfare" account.
3. Send the IP.

Then Gloki Build runs `node1/setup.sh`. Read the result back with dig and curl, using the readback skill's table.

**Ouri, 29 Oct evening.** He's done until Tuesday 3 Nov. He asked:
- whether the real forum is the priority;
- when the demonstration is.

Eston's reply is drafted but not sent. The drafted plan is that Ouri builds the real forum on Tuesday. YWF takes fixes 1 and 2 on feature branches, then signing pieces 1 and 2: the approved-code list and the join-reply check. **Open:** Eston hasn't confirmed this priority, and hasn't given the demonstration date. Ask him, don't guess.

**Strategy (Eston).** YWF builds signing itself, with Ouri as architect and reviewer. Eston doesn't expect clients or funding, so the plan is to build what Ouri thinks a small team can't. Present the signing answers as decisions, not as questions. The hardest one is retiring `gloki-application`, which undoes Ouri's signpost. Raise it in the alignment meeting, not by text.

**Gloki Build Restart, 30 Oct check-in.**
- Nothing is in flight. Its only branch is `claude/verification-note-and-git-plan`: the git plan in it is superseded, but the verification note is still accurate.
- It can take the two fixes once Eston says go.
- It's waiting only on Eston's node1 steps.
- Gloki Build Restart then closed. Its handoff is `docs/handoffs/2026-10-30-node1-session.md` on `main` (0c75edb). A new session, started from that handoff, runs node1 setup and the two fixes.
- Backup: `node1/`, the 29 Oct reports, the signing docs, the Ouri draft and a STATUS snapshot are on branch `claude/node1-and-29oct-reports` (af9767f). There's no PR, and it isn't merged.
- Leave the node on 127.0.0.1:2611 running. It's Eston's own dev node (compose project `ibc`, from `~/ibc-node`), not a test node.
- Eston also wants to update the GDI site (gloki-site). Ask him what to change, then start a session for it.

### Next steps
1. Get Eston's answers: is the forum the priority, and when is the demo? Then finalise the WhatsApp reply.
2. With Eston's go, Gloki Build opens two PRs off `main`: the `register_verification` fix and the Back-button fix. Test each on a local node, and don't merge.
3. Once Eston sends the IP, run node1 setup and the readback. Then fix 1 goes live (Eston's OK, plus a manual deploy). Then Eston presses "Get verified" on node1, following `docs/2026-10-29-founder-on-node1.md`.
4. Signing pieces 1 and 2, on feature branches against `ouripoupko/ibc`, for Ouri to review.
5. The alignment meeting with Ouri. Ask Eston what it should focus on.
6. Housekeeping:
   - Close the stale gloki-engage PR #20, with Eston's OK.
   - Ask Ouri whether to bring `docs/handoffs/2026-10-28-node1-and-trust.md` onto `main`. It's only on `ui`.
