# Session prompt — Batch 16: the merge-stub fix + the still-human-gated tail

Paste this into a fresh Claude Code session on the `ui` branch. **Batch 15 closed item 2** (the chat +
merge i18n stragglers) and it is **pushed & live**. What remains is the same light, mostly **human-gated**
tail as B15 — *plus one concrete standalone code item that B15 surfaced*: the merge demo-stub↔card shape
mismatch. There is no large coding batch queued. This is again a "tie off loose ends as the humans make
their calls, and knock out the one well-scoped bug" session.

> Check `git log` first. Batch 15 is **pushed & live**: the i18n straggler commit `2d6062f` and this
> prompt's own docs commit sit on top of B14's `c986ab1`; the Pages deploy ran green; PR #20 (`ui` → `main`,
> for Ouri) was refreshed to the B15 state. So you start fully synced — local `ui` == `origin/ui`. Push only
> with Eston's green light, as always.

---

## What Batch 15 shipped (commit `2d6062f`, live)

- **Chat/merge i18n stragglers.** The B14 headline ("Retry"/"Topic not found.") under-scoped it — the sweep
  found two **fully un-wired** files. `ChatTopic` (2 literals reuse existing `chat.topicNotFound` +
  `chat.backTitle`, 0 new keys). `MergeProposalsList` (title/propose/empty/loadError/settingUp; Retry reuses
  `common.retry`). `MergeProposalCard` (source/proposedBy/tally/support/vote+decide buttons + singular-plural
  countdown via the `count===1 ?` pattern + status badge). **19 new `deliberation.merge.list.*`/`.card.*`
  keys → fr + sw** (now **878 each, parity OK, 0 var-drift**), matching house terms (fr
  *fusion/proposition/initiative source*; sw *muunganisho/pendekezo/mpango wa chanzo*).
- **One regression guard** that matters for B16: the status badge is `{proposal.status && t(...)}` — so an
  **undefined** status renders nothing instead of the raw key. That undefined comes from the bug below.

## How we work (unchanged, non-negotiable)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr/sw where strings changed. Pin light with
  `preview_resize({colorScheme:'light'})` (preview defaults to dark).
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push** without Eston's green light.
- Slow external drive: small sequential I/O. **`.module.scss` / `fr.ts` / `sw.ts` must be Read before Edit.**
- Demo seed (already persisted in the preview browser): `localStorage.user = {publicKey:'a'×64,
  serverUrl:'https://gdi.gloki.contact'}`, onboarding `{step:6,completed:true}`, `gloki.locale`; seeded demo
  communities (`gloki_demo_*`) present — working community `demo-comm-mqdm428q-q0vj0t69`. Switch locale live:
  `localStorage.setItem('gloki.locale','fr')` then navigate. Artifact check:
  `document.body.innerText.match(/\{\w+\}/g)` → null.
- Parity scanner: `node /tmp/i18ncheck_b12.mjs "$(pwd)"` → `RESULT: PARITY OK` (re-create if /tmp cleared).

---

## The remaining tail

### 1. Merge demo-stub↔card SHAPE MISMATCH — the one standalone code item (chip `task_8d7e7a42`)

Pre-existing (not from B15's i18n work); B15 surfaced it while verifying the card. The demo mock and the
React card disagree on the proposal shape, so **any rendered merge card is broken** (today it's latent —
see reachability below — but it breaks the moment a proposal exists, and it matters for Ouri's wiring).

Three parts:
1. **status vs decision.** `src/services/demo/demoContracts/merge.ts` `get_merge_proposals` (~line 34)
   returns proposals raw, with `decision: 'pending'|'accepted'|'rejected'` + `votes: Record<caller,
   'support'|'oppose'>`. The card's interface `src/components/collaboration/flows/merge/mergeApi.ts`
   (`MergeProposal`) expects `status` + `forCount` + `againstCount`; `getMergeProposals` casts with **no
   mapping**. Net in `MergeProposalCard.tsx`: `proposal.status` is `undefined` → status badge empty AND
   `isPending = status === 'pending'` is **always false**, so the Vote For/Against + Accept/Reject buttons
   and the "N days left to decide" countdown **never render**.
2. **forCount/againstCount undefined** → tally shows "Community: undefined for · undefined against",
   `supportPct` is NaN → "NaN% support".
3. **vote vocab** — card sends `'for'`/`'against'` to `voteOnMerge` and compares `myVote === 'for'`; the
   mock types votes `'support'|'oppose'`. Pick ONE and make both sides agree.

**Suggested fix (mock side — keeps the UI runnable, the branch's whole point):** map at read time in
`get_merge_proposals`:
```ts
case 'get_merge_proposals':
  return s.proposals.map((p) => ({
    ...p,
    status: p.decision,
    forCount: Object.values(p.votes).filter((v) => v === 'for' || v === 'support').length,
    againstCount: Object.values(p.votes).filter((v) => v === 'against' || v === 'oppose').length,
  }));
```
and align the vote vocab (accept both, or normalize in `voteOnMerge`). Keep changes inside
`src/services/demo/` + the merge components; **do NOT touch the i18n overlays**. This is demo-only — the
real contract on `new-features` presumably already returns the right shape, but `ui` must stay runnable.

**Reachability caveat (cost B15 time):** seeded initiatives are authored by personas, not the demo user, so
"Propose Merge" likely shows no eligible source and a normal demo user can't create a proposal. To render a
card for verification, inject one through the seam in DevTools / `preview_eval`:
```js
const m = await import('/src/components/collaboration/flows/merge/mergeApi.ts');
await m.proposeMerge('https://gdi.gloki.contact','a'.repeat(64), <mergeContractId>, <anySourceInitiativeId>, 'rationale');
```
Get `<mergeContractId>` from the `flowContracts:*` localStorage entry under key `<initiativeId>_merge`. Reach
the tab via an initiative's `/initiative/<encoded-serverUrl>/<pk>/<communityId>/<initiativeId>/collaboration`
→ "Merge Proposals" tab. After the fix the card should show a real status badge, "N for · M against", a sane
support %, the Vote/Decide buttons + countdown. Walk it **en + fr + sw** (the i18n is already correct — B15
verified the strings; this just makes the data render). Remember to clean up the injected state after.

If Eston would rather leave demo data shapes to Ouri, this is also fine to **skip + leave the chip** — it's a
demo-runnability nicety, not a live-site bug.

### 2. fr/sw native-speaker review — route the deliverable (human-gated)

`docs/i18n-native-review-candidates.md` is ready and now also covers the **19 new B15 merge keys**
(`deliberation.merge.list.*`/`.card.*`). Next step is Eston's: route it to a native **fr** and native **sw**
reviewer, or scope a *specific* fix wave. If Eston names specific strings/families, do **only those**,
keeping fr/sw key + `{var}` parity and re-running the scanner. Do **not** silently rewrite the overlays.
(Two sw terms worth a reviewer's eye in the new keys: `muda umeisha` for the expired status, and the
`kuunga mkono`/`kupinga` vote-tally phrasing.)

### 3. PipelineView — Ouri's call (gated)

Still orphaned (no importer), flagged in-code since B14. Ouri decides delete vs. re-wire on `new-features`.
Don't delete blindly; its i18n is already correct if revived.

### 4. (Optional, explicit-ask only) extend-Button-then-convert

Unchanged from B14/B15: first add the missing primitives to shared `Button` (a `success`/themed variant +
an icon-only square mode), *then* convert the themed/icon/list buttons intentionally left in B14. Design-led,
bigger than a polish batch, several surfaces hard to browser-verify. **Not planned** — pick up only on an
explicit ask. The "when to use `<Button>` vs bespoke" boundary is in `DESIGN_SYSTEM.md`.

### 5. Push / PR #20 — Eston's call

`origin/ui` is at the B15 state and PR #20 reflects it. New work needs his green light to push
(auto-deploys to Pages); refresh the PR body + ahead-count when you do.

## Sizing + when done

Light session. The one piece of standalone code is the merge-stub fix (item 1) — small, well-scoped, but
note the reachability caveat for verification. Everything else waits on Eston (native review, push) or Ouri
(PipelineView). Whatever you touch: `tsc -b` + build green; en/fr/sw spot-walks of touched routes; parity
scan `RESULT: PARITY OK`; small local commits; **no push** without the green light. Hand back with
shipped-vs-deferred.
