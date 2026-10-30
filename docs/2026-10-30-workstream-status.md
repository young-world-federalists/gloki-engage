# Gloki / GDI workstreams — status (30 Oct 2026)

Restart handoff: `docs/handoffs/2026-10-30-orchestrator.md` (also on gloki-engage `main`).

Kept by the orchestrator session. Not in git: Gloki Build itself isn't a repo.

| Workstream | Session | Repo / branch | PR | State |
|---|---|---|---|---|
| node1, trust model, Gloki app | Gloki Build Restart (`local_6e4ec11e…`) | gloki-engage `ui` / `server-side` (Ouri merges) | #29–#31 merged by Ouri | Working: reading Ouri's seed-list change (27c65e9), testing the new build on a local node, writing the git consolidation plan. node1 is waiting on Eston's OVH order and DNS. Done 29 Oct: the trust-model and git-consolidation notes (gloki-engage branch `claude/verification-note-and-git-plan` @ d109938), the signatures sizing (`docs/2026-10-29-signatures-sizing.md`), and the `._` cleanup in .git. Task 2 done: `docs/2026-10-29-build-test.md` (20 ranked items, tested on a local node, nothing written to gdi). **Decided 29 Oct: Eston is the founder, signed in on node1.** The verification contract will live on node1, and the signpost stays on gdi. Task 6 done: the two-node rehearsal passed (`docs/2026-10-29-founder-on-node1.md`). Contract code is fixed at the moment of the press, so the one-line `register_verification` fix has to be live before Eston presses. At 10:27 UTC there was still no founder on live. Waiting on Eston: the OVH order, the DNS A record, the IP, and asking Ouri to hold the link. The `._` files came back in .git because macOS recreates them on this drive. **Live app is back in founder phase:** checked 09:56 UTC, `gloki-application` holds only the 28 Oct verification contract and no settings contract, so the first visitor to press "Get verified" becomes steward. |
| GDI site redesign | GDI Site Restart | gloki-site `claude/gdi-redesign` | #4 merged 29 Oct (#1, #2 closed) | Done. |
| GDI waitlist close-out | GDI List Restart | Brevo only | #3 merged | Done 29 Oct (live submit and Turnstile checked). |

## Ouri's `unified` branch (29 Oct)

Head a06c7eb, built from server-side: one app, with `?demo=true` switching a page to demo data. Ouri wants to merge it into main, then everyone works from main. It has every ui source file and keeps the beta flag. Task 7 done (`docs/2026-10-29-unified-test.md`): safe to merge as code. Before Pages builds from main, three things need fixing:
- The browser Back button carries demo mode into real pages.
- The beta home goes to the demo-only /forum.
- deploy.yml and the github-pages environment still allow only server-side and ui.

main (d28594a, May) is not an ancestor of unified: a trial merge conflicts in 34 files. The reply is drafted, not sent.

**Update 17:38 UTC:** Ouri merged it. `main` is at 44792f2, with old main kept as `archive-main-oct-26`. His "heavy and deep cleanup" (abc2c54) touched 235 files, mostly dead code. Nothing of ours was removed: the account-kind contract is still there. Deploy is now manual (workflow_dispatch), and the whole site is built as beta. Last run: 15:45 UTC, success. Still open on `main`:
- the Back-button demo carry-over (`stickyDemo`);
- `/forum` is the beta home but demo-only (`App.tsx:90`, `:164`);
- the `register_verification` fix.

Live `gloki-application` still holds only the 28 Oct verification contract, so the founder slot is still open. From now on, work goes on feature branches off `main`, and our `claude/verification-note-and-git-plan` git plan is superseded.

## Signing decisions (29 Oct)

`docs/2026-10-29-signing-decisions.md` holds the seven answers. Fable drafted them and Opus checked them. New: a node's join reply replays an unauthenticated history, so a fake one can be fed in. It goes in the build as piece 2.

## File overlap (gloki-site)

- **GDI Site** owns `index.html` (outside `#join`), `style.css`, `build.html`, `DESIGN.md`, `.impeccable/`, `assets/`.
- **GDI List** owns the Brevo templates, the `#join` form behaviour, and the waitlist wording in `privacy.html`.
- Shared, so message the other session before changing: the `#join` markup, the waitlist CSS rules, `privacy.html`, `confirmed.html`.
- GDI List won't fix non-waitlist `style.css` rules. It passes its findings to GDI Site instead.

## Cross-session dependencies

- Gloki Build → GDI Site: a plain-English note on the new trust model, for the status board and `build.html`.
- GDI List → GDI Site (handed over 29 Oct): the style.css findings (low-contrast hover, body overflow). Also two `#join` fixes that now ship on the redesign branch: move focus to the success panel after submit, and use "Contribute" as the visible word in the nav and the form (value/data-value stays "Contribute a node"). Turnstile rejects localhost, so a local test submit will fail.
- GDI List won't branch gloki-site at all, so step 1 of the merge order below is empty.

## Ouri, 29 Oct (summary)

- The central account holds only a seed list. The verification contract sits on the first verified person's node, and stewards will copy it later.
- Signatures and locking down contract deploys need a funded team. They aren't coming soon.
- node1 as a steward: endorsed.
- He proposes one `main`, short feature branches off it, and a demo/real software switch.
- New build at https://young-world-federalists.github.io/gloki-engage/. He wants Eston to try it, then an alignment meeting.

## Merge order (when ready)

1. GDI List fixes (if any), so `main` is stable for the redesign.
2. GDI Site redesign PR, rebased on top. Eston's yes is needed because merging deploys.
3. gloki-engage: nothing for us to merge. Ouri merges. The consolidation plan goes to him only after Eston approves.
