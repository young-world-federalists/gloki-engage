# Session prompt — Batch 15: route the native review + the small tail

Paste this into a fresh Claude Code session on the `ui` branch. **Batch 14 closed out the redesign/i18n
polish arc.** The two product decisions are decided, the native-review work is scoped into a deliverable,
and the button-consolidation wave is done where it was clean and deliberately stopped where it wasn't (with
the boundary recorded in `DESIGN_SYSTEM.md`). What's left is a small, mostly **human-gated** tail — there is
no large coding batch queued. This is a "tie off the loose ends as the humans make their calls" session.

> Check `git log` first. At B14 handback `ui` was **4 commits ahead of origin/ui** (`33f12be`, `8415d34`,
> `01dd6c3`, `3bceb1a`) on top of `318ccfe`. **NOT pushed** (the prior batches through `318ccfe` *are* live).
> The push/PR decision is Eston's — do NOT push without his green light.

---

## What Batch 14 shipped (4 local commits on top of `318ccfe`, NOT pushed)

- **`33f12be` — §1 + PipelineView decisions, in-code.** IdentityCardSVG gets a header comment recording that
  the downloadable credential is **deliberately kept in canonical English** (Eston's call) and how to revisit
  (layout reflow, not a string swap). PipelineView gets an in-code **orphaned / flagged-for-Ouri** banner.
- **`8415d34` — §2 native-review deliverable.** `docs/i18n-native-review-candidates.md`: a *scoped* worklist
  (not all 859 keys) of the least-reviewed families (B13 `join.*`/`identityCard.*`/`identityTrust.*`, B12
  `collab.flow|group|template.*`, `community.reset*`) with current fr+sw strings + the concern per family,
  plus the two cross-cutting decisions a reviewer must make: **sw civic-vocab consistency** (mpango/agizo/
  udhamini/ushirikiano/kura/pendekezo — incl. the `agizo` vs `mamlaka`/`idhini` drift to verify) and **fr
  register / inclusive-writing** house style.
- **`01dd6c3` — §3 button wave, the clean part (identity cluster), fully verified.**
  - **IdentityCardDialog → shared `Modal` + `Button`** — the real win: gains focus-trap / Esc / body-scroll
    lock / focus-restore / backdrop blur the hand-rolled overlay lacked. Download/Close → `<Button>` footer;
    Download uses Button's `loading` prop. Dropped the dead `.identityCard` HTML-card SCSS subtree; un-nested
    `.cardContainer`; added `.cardScaler` so the fixed-aspect SVG credential scales on narrow screens.
  - **IdentityTrust** 3 trustBtns → `<Button variant="secondary">` (matches the page's existing "Meet a
    member" button).
  - **JoinCommunity** scan / join / scanner-cancel → `<Button>`; join's one-off `$success` green normalized
    to design-system primary, and joining/resetting states moved to Button's `loading` prop.
  - Verified en, 360px **light + dark**: Modal focus/Esc work, all buttons render, no console errors;
    `tsc -b` + `npm run build` both exit 0.
- **`3bceb1a` — §3 boundary, documented (Eston: "stop here, document").** `DESIGN_SYSTEM.md` now records
  **when to reach for `<Button>` vs. keep a bespoke `<button>`**. The finding: the *rest* of the wave is
  mostly **themed** (CollabList's teal `.createBtn`), **icon-only square** (chat `.sendBtn` / top-bar
  `.backBtn`, 40×40), or **list-row / indicator** (CollabList collab rows, `Stepper` step dots) buttons that
  don't fit the four pill variants — and a **global `button:focus-visible` rule** (`src/styles/index.scss`)
  already gives every `<button>` the design-system focus ring, so forcing them onto `<Button>` would be
  consistency-only at the cost of a design regression. (OnboardingFlow's main buttons already use `<Button>`.)

## How we work (unchanged, non-negotiable)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr/sw where strings changed. Pin light with
  `preview_resize({colorScheme:'light'})` (preview defaults to dark).
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push** without Eston's green light.
- Slow external drive: small sequential I/O. **`.module.scss` / `fr.ts` / `sw.ts` must be Read before Edit.**
- Demo seed (re-verified live in B14): `localStorage.user = {publicKey:'a'×64, serverUrl:'https://gdi.gloki.contact'}`,
  `gloki.digitalAgent`/`gloki.onboarding = {step:6,completed:true}`/`gloki.locale`; the seeded demo communities
  (`gloki_demo_*`) are already present — working community `demo-comm-mqdm428q-q0vj0t69`. Switch locale live:
  `localStorage.setItem('gloki.locale','fr')` then navigate. Artifact check: `document.body.innerText.match(/\{\w+\}/g)` → null.
- Parity scanner: `node /tmp/i18ncheck_b12.mjs "$(pwd)"` → `RESULT: PARITY OK` (re-create if /tmp cleared).

---

## The remaining tail (pick up as the humans make their calls — none are large)

1. **fr/sw native-speaker review — route the deliverable (human-gated).** `docs/i18n-native-review-candidates.md`
   is ready. Next step is Eston's: route it to a native **fr** and a native **sw** reviewer, or scope a
   *specific* fix wave from it. If Eston names specific strings/families to fix, do **only those**, carefully,
   keeping fr/sw key + `{var}` parity and re-running the scanner. Do **not** silently rewrite the overlays.

2. **i18n stragglers in chat + merge (small, spawned as a background task).** Found during B14's survey:
   hardcoded English not wrapped in `t()` — `ChatTopic.tsx` "Topic not found." / "Back to Chat", and
   `MergeProposalsList.tsx` "Retry" — plus a sweep of `chat/` and `flows/merge/` for siblings. A task chip
   was spawned for this; it can run standalone. If doing it here: inline-default `t()`, add keys to fr **and**
   sw, parity scan, build, en/fr/sw spot-walk.

3. **PipelineView — Ouri's call (gated).** Still orphaned (no importer), now flagged in-code. Ouri decides
   delete vs. re-wire on `new-features`. Don't delete blindly; its i18n is already correct if revived.

4. **(Optional, only if Eston later wants full button consistency) extend-Button-then-convert.** The path the
   B14 finding implies: first add the missing primitives to the shared `Button` — a `success` (and/or
   section-themed) variant + an **icon-only square** mode — *then* convert the themed/icon/list buttons that
   were intentionally left. This is a design-led effort bigger than a polish batch and several surfaces (the
   merge flow especially) are hard to reach for browser verification. **Not currently planned** — Eston chose
   "stop here" in B14. Only pick this up on an explicit ask.

5. **Push / PR #20 — Eston's call.** If he green-lights: refresh the PR body + ahead-count and push `origin/ui`
   (auto-deploys to Pages). `origin/ui` is at `318ccfe`; local adds the 4 B14 commits above.

## Sizing + when done

This is a light, human-gated session — most items wait on Eston routing the native review or Ouri's
PipelineView call. The one piece of standalone code is the small chat/merge i18n straggler fix (item 2).
Whatever you touch: `tsc -b` + build green; en/fr/sw spot-walks of touched routes; parity scan `RESULT:
PARITY OK`; small local commits; **no push**. Hand back with shipped-vs-deferred.
