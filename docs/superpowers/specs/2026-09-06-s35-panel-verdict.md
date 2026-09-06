# S35 adversarial panel — verdict and full record (2026-09-06)

**Branch:** `ui` · panel argued `18b54c6` · MUST list shipped in `935bcdb..e536880` · pushed to
`origin/ui` 2026-09-06.

Three Opus reviewers worked adversarially at Eston's request: a **prosecutor** (P1–P15, told to
assume the branch would embarrass the project), a **defender** (told to refute every finding with
evidence, then prosecute from the lenses R1 covered least — 360px usability, fr/sw, docs, the Ouri
hand-off; filed D1–D13), and a **judge** (adjudicated all 28 with a read-only copy of Ouri's real
`server-side` contract that neither panellist had, and produced the fix list).

**Outcome:** 13 upheld as filed, 14 upheld-narrowed, 1 dismissed. The judge's MUST list (38 items,
9 commits) shipped; the LATER list is carried in
`docs/session-prompts/session-36-verification-w1.md`.

**The line the judge drew for MUST:** exactly the set of items where the app tells a user, an
auditor, or a ministry something that is not true — a year-2612 date, a vote that does nothing,
"Consensus" from one person or from unanimous rejection, "Cause no longer ranked" for a cause
ranked #1, "Open to the top 10 writers" on a full solution, a 33% threshold nothing enforces, and
four false numbers in the docs of record.

**Two product-adjacent guards shipped inside this list** (reversible in two lines, flagged to
Eston): `MIN_PARTICIPANTS = 3` and a non-positive-net band cap in `computeDiscussionStatus`. The
D6/F3 formula and its thresholds are untouched — these are preconditions on which bands the ruled
formula may reach, serving F4's stated purpose that the app never claims an unsupportable consensus
outside itself.

**What the panel dismissed, and why it matters:** the defender filed the alleged hand-off blocker
D1 — that both new contract methods might be permanent silent no-ops because
`Collection.__contains__` may not coerce a hex string to an ObjectId. The judge dismissed it as a
blocker on evidence neither panellist had: Ouri's live contract already runs the identical
membership guard in four production methods on the same append-keyed collections
(`delete_comment`, `like_comment`, `request_expert_review`, `add_expert_review`). The residual
question went to Ouri as a note rather than a patch change.

---

# Panel R3 — JUDGE ruling
Session 35, branch `ui`, HEAD `18b54c6`, range `origin/ui..ui` = `101e4a3..18b54c6`.
Adjudicating P1–P15 (prosecutor, R1) and D1–D13 (defender, R2).

Authorities, in order: the S34 decision record
(`docs/superpowers/specs/2026-09-02-s34-decision-record.md`), the plan's Global Constraints
(`docs/superpowers/plans/2026-09-02-prompt1-causes-impact-status.md`), then the code at HEAD.
A formula ruled in D6/F3 may be **guarded**, never **replaced**, without a new product decision.

New evidence neither panellist had: a read-only copy of Ouri's real initiative contract at
`origin/server-side` @ `cef1fe5`, in this folder as `server-side-contract-cef1fe5.py`.
That file decides D1 and D2.

---

## Adjudication

### D1 — "`Collection.__contains__` does no ObjectId coercion, so both new writes are permanent silent no-ops" — **DISMISSED as a blocker; UPHELD-NARROWED to one line in the hand-off note. Severity: Critical → Minor (hand-off).**

**Decisive fact.** The defender reasoned from `storage_interface.py` alone and could not see the
contract. I can. On the real contract, `self.comments = Storage('discussion')` and
`self.proposals = Storage('proposals')` (`server-side-contract-cef1fe5.py:8-9`), and both are
`append()`-keyed exactly as the defender suspected — `comment_id = self.comments.append({...})`
(`:137`), `self.comments[comment_id]['id'] = comment_id` (`:146`),
`proposal_id = self.proposals.append({...})` (`:181`). **And the very guard the defender calls a
blocker is already live in production on those same collections:**

- `:150` `def delete_comment(...)`: `if comment_id in self.comments:` — the *positive* form. If
  `__contains__` failed on an append-keyed collection, no user could ever delete a comment.
- `:159` `def like_comment(...)`: `if comment_id not in self.comments: return`.
- `:254` `request_expert_review` and `:263` `add_expert_review`:
  `if proposal_id not in self.proposals: return`.

The S35 patch's `if comment_id not in self.comments: return` (`docs/contracts/s34-initiative-contract-additions.py:19`)
and `if proposal_id not in self.proposals: return` (`:61`) are **byte-identical in form** to four
methods shipped and exercised on the live site today. Delete-comment, like-comment and
expert-review are visible, used features; if the coercion cliff bit, they would be observably
inert and Ouri would know. So the patch introduces **no new risk relative to shipped code**, and
the risk it does carry is a pre-existing property of the whole contract, not of S35.

The defender's *mechanism* is nonetheless sound in the abstract, and worth recording: `Collection.__contains__`
is `find_one({'_id': item})` with no coercion (`storage_interface.py:57-58`), while
`Document.__init__` does coerce (`:105-107`) — and `Document.__init__`'s own
`real_key if real_key in self.storage else key` proves `__contains__` *does* answer correctly when
handed an `ObjectId`. So if the platform's live `Storage` behaves like this repo's mirror, the
four production methods above are already silent no-ops. That is a question for Ouri about his
whole contract, not a gate on this patch.

**Ruling.** Do **not** change the patch's guards to `.exists()` before the push: that would make
the four new methods the only ones in the contract with a different guard form, on a hypothesis
this repo cannot test, and it would mask rather than answer the question. Instead **add one line
to the hand-off** asking Ouri to confirm.

**Fix (MUST, docs only, 1 line).** In `docs/FOR_OURI_seam.md`, S35 addendum, add:
> **Question for Ouri (not a patch change):** `vote_comment` and `add_impact_assessment` guard with
> `if <id> not in self.comments / self.proposals`, the same form as the live `delete_comment`,
> `like_comment`, `request_expert_review` and `add_expert_review`. If the storage bridge's
> `Collection.__contains__` does not coerce a hex string to an `ObjectId` on an `append()`-keyed
> collection, all of these — old and new — refuse silently. Please confirm on a live community;
> if it bites, the one-word fix for all six is `self.comments[comment_id].exists()`.

### D2 — "The two `Storage(...)` declarations are commented out and absent from the FOR_OURI addendum" — **UPHELD-NARROWED. Severity: Important → Minor (docs/hand-off).**

**Decisive fact.** The real `__init__` (`server-side-contract-cef1fe5.py:3-13`) is a flat block of
thirteen `self.x = Storage('name')` lines. The patch's block
(`docs/contracts/s34-initiative-contract-additions.py:11-13`) is headed `# __init__ additions` and
carries the two lines in exactly that shape, differing only by the `#` and four spaces of indent.
Against the real `__init__`, the intent is unambiguous to anyone holding the file they are patching
— which Ouri is. So the "ships four methods that raise on first call" repro requires a reader who
skips a header that says `__init__ additions`; that is a documentation weakness, not an Important
defect.

What **is** genuinely deficient is the asymmetry the defender identifies: `FOR_OURI_seam.md:196`
carries a loud, correct warning about the `add_proposal` signature and says nothing about the two
new collections needing declaring, while `:195` and `:197` describe their key shapes in enough
detail that a reader could believe the storage layout was the whole instruction.

**Fix (MUST, docs only).** In `docs/FOR_OURI_seam.md`, as the **first** bullet of the S35 addendum:
> - **`__init__` first:** add `self.comment_votes = Storage('comment_votes')` and
>   `self.impact_assessments = Storage('impact_assessments')` to `GlokiEngageInitiative.__init__`.
>   The other four methods raise `AttributeError` on first call without them.

And in `docs/contracts/s34-initiative-contract-additions.py`, replace the `# __init__ additions`
header at `:11` with `# --- add these two lines to __init__ (do this first) ---` and leave the two
lines commented (they are not valid at module scope; the whole file is a paste-in patch, not an
executable module).

### P1 — impact-assessment timestamp bypasses the packed-digit normaliser — **UPHELD. Severity: Important (on `server-side`); not reachable on `ui` today.**

**Decisive fact.** `approvalApi.ts:279` is `timestamp: Number(r.timestamp)`, and it is the only
`formatDateTime` feed in the repo that skips a normaliser. The real contract writes
`'timestamp': timestamp()` in `add_comment` (`server-side-contract-cef1fe5.py:141`) and
`add_proposal` (`:184`) — the same call the S35 patch uses for assessments (`patch:71`) — so
whatever format the platform emits, comments and assessments emit it identically. That is
conclusive: `normalizeTimestamp` exists in `discussionApi.ts:31-54` **because someone had to parse
that value coming back off a live deployment**, and the assessment path skips it.

**Actionability on `ui` today (asked, and answered):** not reachable. `src/services/api.ts:86-97`
routes `contractWrite`/`contractRead` to the mock, and the demo stub writes `Date.now()`
(`demoContracts/approval.ts:308`, and `:173` for proposals). The wrong date only appears once Ouri
applies the patch and his real transport is in place. So P1 is not a user-visible defect on `ui` —
but the code that will consume the real value ships in this merge, so the fix belongs in this wave,
exactly as both panellists say.

**Fix (MUST).** See D6 for the parser; then `approvalApi.ts:279` becomes
`timestamp: normalizeTimestamp(r.timestamp as number | string | undefined),`.

### P2 — live cause-vote buttons on a focused reply — **UPHELD. Severity: Important. Reachability escalation accepted.**

**Decisive fact.** `ThreadedDiscussion.tsx:207` gates on `depth === 0`, not on `parentId`;
`visibleRoots` re-roots any node found anywhere in the tree and `:551-554` renders it at
`depth={0}`. The gate also *replaces* the Like button on the focused reply (`:225-238`, the `:` arm
of the same ternary), so the fix must restore Like for non-roots too. The data layer refuses the
write on both sides — `demoContracts/discussion.ts:212` and the real-contract-shaped patch at
`:21-22` — so every tap is a silent no-op.

**The defender's escalation is correct and I adopt it.** No user-built five-deep thread is needed:
`src/services/demo/fixtures/deliberation.ts:285-287` states in its own comment that the
`d1 → d1a → d1b → d1c → d1d` branch "runs 5 deep so the 'Continue this thread →' affordance (depth
cap 3) is demoable", and `:305-308` defines `d1c` (depth 3) with child `d1d`. On a fresh
`global-v18` seed this is **two taps from the demo's front door**, on the branch that exists to be
demoed. That is the strongest reachability argument on either list.

**Fix (MUST).** In `ThreadedDiscussion.tsx`, replace the `depth === 0` condition at `:207` with
`!node.parentId`. No other change: the vote group and the Like button already swap on the same
ternary, so a focused reply regains Like automatically.

### P3 — `rankWriters.firstAt` mixes two time scales — **UPHELD-NARROWED. Severity: Important → Minor.**

**Decisive fact.** `writerRank.ts:65` pushes an already-normalised comment ms; `:69,75` push a raw
`Number(p.timestamp)`; `:87` `Math.min`-es them into one `firstAt`. Confirmed.

I accept all three of the defender's narrowings, and the third is decisive on severity: `firstAt`
is the **third** sort key (`:91-95`), reached only when `total` and `causeScore` both tie, and a
proposal-only writer (the only one who gets the inflated value) has `causeScore === 0` and is
already excluded from the `strict` rung by `causeScore > 0` (`:149`). I also confirm the mismatch
is **inherited**: `add_proposal`'s `'timestamp': timestamp()` is pre-existing production code
(`server-side-contract-cef1fe5.py:184`), untouched by the patch, and the pre-branch board already
sorted proposals with `new Date(a.timestamp).getTime()`.

Same reachability caveat as P1: unreachable on `ui` (demo proposals carry `Date.now()`,
`demoContracts/approval.ts:173`). It rides in P1's commit because it is the same one-line call.

**Fix (MUST, same commit as P1).** `writerRank.ts:69` → `const ts = normalizeTimestamp(p.timestamp);`
(import the exported parser). Leave `:75`'s `Number.isFinite` guard in place.

### P4 — the F5 width guard is a one-way latch — **UPHELD. Severity: Minor. → LATER.**

**Decisive fact.** `DiscussionStatusPill.tsx:84-90` measures `el.scrollWidth > el.clientWidth` on
`wordRef`, and `:103` applies `.dotOnly` — which sets `.word { position:absolute; width:1px;
overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }` (`DiscussionStatusPill.module.scss:15-23`)
— **to the ancestor of the element being measured**. Once true, `clientWidth === 1` forever and
`next` can never return `false`. The `ResizeObserver` at `:92-95` observes `el.parentElement`, so it
does keep firing; it fires into a measurement that cannot change. The charge is exactly right.

**Why LATER, not MUST.** Two reasons, both weighed. (a) The trigger is unproven: the initial `true`
requires a Swahili band word to exceed `max-width: 12ch`, which the defender correctly calls a
coin-flip on font metrics that neither panellist could measure. (b) There is **no one-line fix** —
any CSS that hides the word breaks the measurement, because the measurement reads the element the
CSS hides; a correct fix needs a separate, never-collapsed measuring node, i.e. a small structural
change to a shared pill in a one-pass fix wave. The failure state is also benign: the defender
verified `.dotOnly` uses the standard `clip` sr-only pattern, so the word stays in the
accessibility tree and no information is lost — only two pills on one screen look different.

**Ledger entry for S36 (exact).** `DiscussionStatusPill.tsx`: render the word twice — a visible
`<span ref={wordRef}>` and an `aria-hidden`, absolutely-positioned, never-collapsed measuring clone
— and measure the clone against the badge's content box. Then the guard becomes two-way and the
`ResizeObserver` does what its doc-comment at `:62-64` promises.

### P5 — the F4 scoped sentence on a role-less `<span>` — **UPHELD-NARROWED. Severity: Minor. MUST (one line).**

**Decisive fact.** `Badge.tsx:22-27` renders `<span className=… title={title} aria-label={ariaLabel}>`
with no `role`. ARIA 1.2 prohibits naming `role=generic`; axe-core flags it as
`aria-prohibited-attr`. `DiscussionStatusPill.tsx:104-105` is the only place a `Badge` is given an
`aria-label`, and `StageFeedView.tsx:124` is its only non-decorative render.

I accept the defender's narrowing on the *consequence* — the prohibition is a SHOULD-ignore and
engine behaviour is not uniform, so "the sentence is dropped" is not guaranteed — and their
counter-narrowing that the F5 dot-only state does not compound it. What is certain is the standards
violation plus the `title`-only fallback that a 360px touch user cannot reach. That is enough to
fix, at Minor.

**Fix (MUST).** `Badge.tsx:24` — add `role={ariaLabel ? 'img' : undefined}` to the span. One line,
and it is inert for every Badge that passes no `aria-label` (all of them but the status pill).
The two `aria-label`-on-a-bare-`<span>` score readouts the prosecutor footnoted
(`ThreadedDiscussion.tsx:216`, `TopCausesPanel.tsx:140-143`) are the same defect class — **LATER**.

### P6 — one identity acting alone can raise a green **Consensus** pill — **UPHELD. Severity: Important. MUST.**

**Decisive fact.** `discussionStatus.ts:40` gates only on `totalVotes` and `voted.length`;
`participants` is computed at `:38` and consumed by nothing but the F4 sentence. Neither contract
forbids voting on your own comment — the S35 patch guards only existence / not-a-reply /
not-deleted (`patch:19-23`), the stub matches (`demoContracts/discussion.ts:211-212`), and
`ThreadedDiscussion.tsx:207-224` renders the vote group with no `isOwn` test (contrast `:250-257`,
where Delete *is* `isOwn`-gated). Ten root comments and ten self-taps ⇒ `totalVotes = 10`,
`voted.length = 10`, `agreement = 1.0` ⇒ `consensus`, and the exported sentence reads "Consensus
among **1** Gloki participants".

I accept the defender's realism argument in full: the failure needs a community with one active
member, which is the state of a freshly created community — the first thing a ministry pilot makes.
The plural break is confirmed: `DiscussionStatusPill.tsx:29-36` has no `.one`/`.many` pair, in a
branch that added exactly such a pair eleven lines away in `TopCausesPanel.tsx:149-153`.

**Fix (MUST) — see "Rulings on the status-formula guards" below for the participant floor's number
and its standing against D6/F3.**

### P7 — stub returns `{error}`, the Python patch returns nothing — **UPHELD-NARROWED, and split. Severity: Important → the new half MUST, the inherited half LATER.**

**Decisive fact, and it settles the split.** The defender is right that the divergence is
house-wide and pre-existing, and the real contract proves it beyond their evidence: the production
`GlokiEngageInitiative` never returns an error object anywhere — every refusal is a bare `return`
(`server-side-contract-cef1fe5.py:151-153`, `:159-160`, `:254-255`, `:263-264`). The `{error}`
shape is a **demo-stub convention that the real contract has never spoken**. So "the F13 fix
silently dies on the real contract" is true of every write in the app, has been since S2x, and is
not something an S35 patch tweak can fix.

The genuinely **new** half stands and is cheap: the stub validates the six required text fields and
the `targets_cause` enum (`demoContracts/approval.ts:292-299`) and the patch validates neither
(`patch:58-68`). Client-side, `normalizeImpactAssessment` rejects a bad enum on read
(`approvalApi.ts:271`) — so a direct call with a junk `targets_cause` writes a row that then
**silently disappears from every UI**, which is worse than a refusal — and it accepts six empty
strings (`:272-275` only check `typeof … !== 'string'`), rendering a card with seven blank `<dd>`s.

**Fix (MUST — patch file only, no app code).** In
`docs/contracts/s34-initiative-contract-additions.py`, before the write at `:69`, add:
```python
    if targets_cause != 'cause' and targets_cause != 'symptom' and targets_cause != 'both':
        return
    for field in [target, mechanism, broader_effects, risks, opportunity_costs, time_horizon]:
        if not field:
            return
```
**Fix (LATER).** The `{'error': …}` convention is a seam-wide decision, not an S35 item — ledger it
with D5, and put one sentence in `FOR_OURI_seam.md` when it is decided, not before.

### P8 — docs-of-record counts — **UPHELD. The defender's numbers are correct; the prosecutor's are not. Severity: Minor. MUST.**

**Measured by me, at HEAD `18b54c6`:**
```
git rev-list --count 2e3aada..15b9d59        → 28
git rev-list --count 101e4a3..15b9d59        → 29
git rev-list --count 101e4a3..18b54c6        → 38     (= origin/ui..ui)
grep -cE "^  '[^']+':" src/i18n/fr.ts        → 1248
grep -cE "^  '[^']+':" src/i18n/sw.ts        → 1248
key-set diff 101e4a3→18b54c6, fr:  1189 → 1248, +60 added, −1 removed
key-set diff 101e4a3→18b54c6, sw:  1189 → 1248, +60 added, −1 removed
```
The range defect is confirmed exactly as both filed it. On the i18n numbers I rule **for the
defender**: parity is **1248/1248**, the delta is **+60 keys / 1 retired**. The prosecutor's
"1249 / +67" is wrong twice over — the raw count is 1248, and "+67" counted *added diff lines*,
which conflates new keys with re-worded values; their own "Verified clean" section says 60,
contradicting their own P8. Writing +67/1249 into the doc of record would replace one false number
with another.

**Fix (MUST) — with a re-measure. See THE FIX LIST §D.**

### P9 — "Open to the top 10 writers…" over a 3/3 solution — **UPHELD. Severity: Minor. MUST (one condition).**

**Decisive fact.** `writerRank.ts:131` returns the sentinel `{ keys: [], rung: 'strict' }` for a
full solution — its own doc-comment at `:119-120` says the sentinel is deliberate — and
`SolutionsBoard.tsx:786` derives `rungNote` from `elig.rung` alone, rendered at `:829-836` with no
cap or `keys.length` test. The opposite case (`keys: []` falling through to `any-verified` at
`:158-159`, printing "Open to any verified member" when nobody can assess) is the same bug.
I also adopt the defender's addition: the note renders for **every** viewer, outside the
`canAssessThis` guard, so a non-writer reads it as an invitation addressed to them.

**Fix (MUST).** `SolutionsBoard.tsx:786` →
`const rungNote = eligibilityReady && elig.keys.length > 0 && solutionAssessments.length < ASSESSORS_PER_SOLUTION ? rungCopy(t, elig.rung) : null;`
(`ASSESSORS_PER_SOLUTION` is already imported from `writerRank`; if not, import it.) No new i18n key.

### P10 — the `VIEWER` assessor branch skips the non-author check — **UPHELD-NARROWED. Not a governance defect. Severity: Minor. Comment fix MUST; fixture optic LATER.**

**Decisive fact — I checked the ruling myself.** D7 as ruled
(`docs/superpowers/specs/2026-09-02-s34-decision-record.md:34`) is: "`causeScore > 0`; not
author/co-author of the solution assessed; not author/co-author of **any solution sharing that
`causeId`**". `eligibleAssessors` implements precisely that (`writerRank.ts:133-141`). The viewer's
seeded `p3` carries no `causeId` (`seedDemoCommunity.ts:225-240`) and `p0` carries `db-c1`, so the
viewer shares no `causeId` with the solution they assess and is not one of its authors — **D7 as
ruled and as coded permits this seed.** The defender is right and the prosecutor's framing
("the stated invariant is false") is inverted: what is false is the *comment*
(`seedDemoCommunity.ts:245-246`), which states a stricter rule ("any solution on this initiative")
than the ruling it cites.

The showcase optic — "You" assessing `p0` while your own `p3`, on the same board, carries a merge
suggestion *into* `p0` — is real and worth fixing, but fixing it means re-composing seeded fixture
content (`PROPOSAL_IMPACT_ASSESSMENTS_BY_KEY.databroker`, which deliberately seeds `p0` at 2-of-3 to
demo the cap). That is not a change to make blind in a single fix wave.

**Fix (MUST, comment only).** `seedDemoCommunity.ts:245-246` → state the rule the code actually
implements: `// D7 self-dealing: an assessor must not author the solution they assess, nor any`
`// solution sharing its causeId. This seed additionally avoids all solution authors.`
**Fix (LATER).** Move the seeded `VIEWER` assessment off `p0`, or drop `p3`'s merge suggestion into
`p0`, so the showcase does not display a rival author assessing a rival.

### P11 — "Causes" heading over a Discussion paragraph — **UPHELD. Severity: Minor. MUST.**

**Decisive fact.** `CreateInitiativePage.tsx:33-38` is `name: 'Causes'` over
`description: 'Community members discuss the problem openly. At least 33% of members must
participate…'`, rendered as `<h4>`/`<p>` at `:210-211`, with `initiative.stages.discussion.desc`
untouched in `fr.ts:295` and `sw.ts:294`. The sibling explainer *was* rewritten in the same rename
(`InitiativeStagePanel.tsx:34`, "Members name and rank the causes of the problem"), so the two
contradict each other. This is the first explanation of the pipeline a first-time author reads.

I adopt the defender's D3-companion escalation: the same paragraph, and the one above it
(`:31`, "At least 50% of voters must agree"), assert enforcement thresholds that no code
implements. Since P11 already requires editing this array, the false numbers must not survive the
edit. **Fix in THE FIX LIST §C with exact en/fr/sw text.**

### P12 — `CauseLine` cannot tell "not loaded" from "demoted" — **UPHELD, and WIDENED. Severity: Important. MUST.**

**Decisive fact.** `CauseLine.tsx:44-50` renders "Cause no longer ranked" whenever `causeId` is
present and `causeText` is not — and its own doc-comment at `:27-28` admits the conflation
("deleted, **or the caller has no ranks to look it up in**"). `QVFlow.tsx:129` sets
`approvalProposals`, then `:137` and `:140-143` `await` twice before `:144` `setCauses(...)`, so an
intermediate commit with `causes === []` is guaranteed; `:147`'s `catch { setCauses([]) }` makes it
**permanent** on a failed discussion read. `useMandate.ts:178,192-194` has the identical shape and
`MandateCard.tsx:113` renders it into the published document.

**I adopt the defender's widening.** There are **five** call sites, not three:
`SolutionsBoard.tsx:123`, `QVFlow.tsx:360` and `:452`, `VotePreview.tsx:119`, `MandateCard.tsx:113`.
`SolutionsBoard`'s causes arrive from `TopCausesPanel`'s `onDiscussionData`, and `discussionReady`
is deliberately set true even on the failure path (`TopCausesPanel.tsx:78-84`, and the comment at
`SolutionsBoard.tsx:259-266` says so) — so `discussionReady` is **not** a usable gate here, and an
implementer who reaches for it would not fix the permanent case. That is why the fix below does not
use it.

**Fix (MUST) — one prop, one expression, five call sites.**
1. `CauseLine.tsx`: add `causesLoaded?: boolean` to `CauseLineProps` (default `true`), and make the
   middle branch `if (!causeText) { if (!causesLoaded) return null; …existing badge… }`.
2. Pass `causesLoaded={causes.length > 0}` at `SolutionsBoard.tsx:123`, `QVFlow.tsx:360`,
   `QVFlow.tsx:452`, `VotePreview.tsx:119` — each file already holds a `causes` array in scope.
3. `useMandate.ts:192-194`: add `causeResolvable: causes.length > 0,` to the returned mandate object
   (and to its interface near `:27`); `MandateCard.tsx:113` passes
   `causesLoaded={mandate.causeResolvable}`.

Rationale for `causes.length > 0` rather than a new loading flag: when the rank list is empty we
cannot distinguish "not loaded", "read failed" and "no causes exist" — and in **all three**
"Cause no longer ranked" is an unsupportable claim, so rendering nothing is correct in every one.
When the list is non-empty and the id is absent, the cause really is gone and the badge is right.
No new state, no new i18n key, and it fixes the transient flash, the permanent-failure case and the
widened Solutions-board case together.

### P13 — double-punctuated toggle accessible name — **UPHELD-NARROWED to trivial. MUST (one expression).**

**Decisive fact.** `InitiativeStageCard.tsx:105-107` joins with a hard `'. '`;
`toggleBaseName = post.title || post.headline` and no activity card supplies `post.title`;
`useInitiativePost.ts:108` builds the headline from a sentence that ends in a period. So
`"…makes them sick.. Causes discussion: Converging"` is the literal accessible name.

I accept the defender's narrowing: screen readers render `.` as a prosodic pause at default
verbosity, so the described "stutter" is overstated. It is a malformed string in an accessible
name — trivial, but the fix is one expression and this commit touches the same family. Their
second observation (the name changes asynchronously when `discussionStatus` resolves, dropping the
stage badge from the computed name) is real and more interesting — **LATER**, since fixing it
properly means deciding what the name should be before status loads.

**Fix (MUST).** `InitiativeStageCard.tsx:106-107` →
```ts
const toggleAriaLabel = discussionStatus
  ? `${toggleBaseName.replace(/[.!?]+$/, '')}. ${statusAccessibleName(t, discussionStatus, communityName)}`
  : undefined;
```

### P14 — bare status word as the page subtitle, no scoped name — **UPHELD. Severity: Minor. MUST.**

**Decisive fact.** F4 rules (`2026-09-02-s34-decision-record.md:80`) that "the in-app pill stays one
word **with the scoped string as its `title`/`aria-label`**". `DiscussionStageView.tsx:70` computes
only the translated word and `:81` passes it to `AppHeader`, whose prop is `subtitle?: string`
(`AppHeader.tsx:29`) rendered as bare `<p>{subtitle}</p>` (`:118`). Every other surface honours F4;
this one — the largest rendering of the word, and the most screenshot-prone — does not. The
defender's mitigation (the code documents the limitation at `:66-69`) makes it deliberate, not
accidental; it does not make it compliant.

Note for the implementer: do **not** "fix" this by putting `aria-label` on the `<p>`. `<p>` maps to
`role=paragraph`, which ARIA prohibits naming for the same reason as P5's `generic`.

**Fix (MUST).**
1. `AppHeader.tsx:29` → `subtitle?: React.ReactNode;` (additive; every existing caller passes a
   string).
2. `DiscussionStageView.module.scss` → add `.srOnly` copied verbatim from
   `src/components/shared/LanguageSwitcher.module.scss:37`.
3. `DiscussionStageView.tsx:81` → pass, when `status` is set:
   `subtitle={<>{statusWord}<span className={styles.srOnly}> — {statusAccessibleName(t, status, communityName)}</span></>}`
   (import `statusAccessibleName` from `DiscussionStatusPill`), and give the same element a
   `title` is **not** possible on a fragment — the visible word already sits inside `<p>`, so the
   sr-only span is the whole fix. No new i18n key: `statusAccessibleName` reuses
   `causes.status.aria` / `causes.status.scoped`.

### P15 — disabled, unexplained vote buttons for a non-participant — **UPHELD-NARROWED, reachability re-based. Severity: Minor → Important-minus. MUST (one line of copy).**

**Decisive fact.** `ThreadedDiscussion.tsx:209-221` renders both vote buttons `disabled={!canParticipate}`
with no `title` or `aria-describedby`, while Reply is removed from the DOM at `:239-243`, and the F6
hint that would explain them is suppressed for exactly this viewer (`:532`
`{showVoteHint && canParticipate && …}`).

I accept both of the defender's narrowings — keeping the group visible is *right*, because
`.voteScore` (`:215`) is the only place a read-only viewer sees a cause's net score, and a
`disabled` button is announced as unavailable by AT — so the defect is the **missing "why"**, not
the disabled state. And I adopt their re-basing of reachability, which I verified:
`useCommunityTrust.ts:80-84` returns `!isOrganization && canParticipate(...)`, so **every
organization/ministry account** browsing a Causes page lands in this state. That is the account a
pilot is demonstrated on, which is why this moves above the other Minors.

**Fix (MUST).** In `ThreadedDiscussion.tsx`, render one line under the thread when
`!canParticipate` (mirroring where the composer would be, `:498-505`), and point both vote buttons'
`aria-describedby` at its `id`. New key `causes.vote.locked` — en/fr/sw text in THE FIX LIST §C.

### D3 — a doc of record still asserts, as *verified*, that a `ui` push deploys — **UPHELD. Severity: Important (docs). MUST.**

**Decisive fact, checked myself.** `.github/workflows/deploy.yml:5` is `branches: [server-side]`.
`.claude/skills/gloki-build-env-run/SKILL.md:116` reads "**Mechanism** (verified in
`.github/workflows/deploy.yml`): push to branch `ui` → …". The sentence cites the very file that
contradicts it, under the heading "Deploy pipeline — precisely", in the skill whose stated job is to
stop wasted deploy debugging — and twelve lines later the same file says the opposite. W0's D11
sweep updated everything around this line and missed the line itself.

**Fix (MUST).** `SKILL.md:116` → "push to branch `server-side`". `SKILL.md:128-129` → cite
`.github/workflows/deploy.yml` as the authority, not CLAUDE.md.

**Companion (folded into P11's edit, MUST).** `CreateInitiativePage.tsx:31` and `:37` promise "At
least 50% of voters must agree" and "At least 33% of members must participate". I confirmed no code
enforces either. Pre-existing, but P11 already opens that array — the false numbers must not survive
the edit.

### D4 — "Consensus" is sign-blind — **UPHELD. Severity: Important. MUST.**

**Decisive fact.** `discussionStatus.ts:41` is `num = Σ Math.abs(r.up − r.down)`; `:42` is
`den = Σ (r.up + r.down)`; `:44-48` band on `num/den` alone, with no reference anywhere to the sign
of `up − down`. Ten root comments each carrying one **down**-vote gives `|0−1|/1 = 1` each ⇒
`agreement = 1.0` ⇒ `'consensus'`, with ten real, distinct voters — so it survives every floor P6's
fix adds. The formula measures **unanimity per comment**, and the pill, `discussionStatus.ts:8` and
the new `DESIGN_SYSTEM.md` block all claim it measures **agreement about causes**. Unanimous
rejection is not agreement about causes.

This is the more dangerous of the two Consensus holes because it needs no bad actor — a
community whose first-draft causes list is simply wrong produces it honestly.

**Fix (MUST) — see "Rulings on the status-formula guards" for the exact guard, the band a
unanimously-rejected sample lands in, and its standing against D6.**

### D5 — the seven-field form never says why Submit is dead; its error surface prints raw English — **UPHELD, split. Severity: Important-minus. Half (a) MUST; half (b) LATER.**

**Decisive fact (a).** `ImpactAssessmentForm.tsx:57-58` requires all six textareas non-empty after
trim; `:83` is `disabled={!canSubmit}` with no `aria-describedby`; the six `.field` blocks carry a
label and a helper and no required affordance. At 360px the fields do not fit one screen, so a user
who filled four meets a grey button with no stated reason. And the one string in the codebase that
states the rule — `'All assessment fields are required'` (`demoContracts/approval.ts:299`) — is
**unreachable**, because `canSubmit` prevents the call that would emit it. Confirmed, and it is the
single worst newcomer moment on the branch: the most expensive form in the app with no completion
signal.

**Decisive fact (b).** `SolutionsBoard.tsx:416` does `setAssessError(err.message)` and
`ImpactAssessmentForm.tsx:199` renders `{error}` verbatim; the stub's five refusal strings are
hard-coded English with no key. So an fr/sw user's only F13 feedback is English in red. Real — but
the fix is the same error-code convention P7's inherited half needs, and that is a seam-wide
decision, not a one-wave edit. **LATER, ledgered together with P7's `{'error': …}` convention.**

**Fix (MUST, half (a) only).** New key `impact.allRequired`; render it as a `<p id={requiredId}>`
directly under the modal intro, and add `aria-describedby={requiredId}` to the Submit button at
`ImpactAssessmentForm.tsx:83`. en/fr/sw text in THE FIX LIST §C.

### D6 — `normalizeTimestamp`'s regex rejects a decimal-separated packed timestamp — **UPHELD-NARROWED. Severity: Minor. MUST (rides with P1/P3).**

**Decisive fact, and a correction to the defender's framing.** The regex is
`/^\d{14,}$/` (`discussionApi.ts:37`) and the branch below it slices a `fractional` tail with no
separator — so the parser was written on the model stated in its own comment at `:35`
("YYYYMMDDHHMMSS + fractional digits", no separator). That model is a **first-hand observation of a
live deployment**: the real contract's `add_comment` writes `'timestamp': timestamp()`
(`server-side-contract-cef1fe5.py:141`) and this parser is what makes comment dates render
correctly today. So the *evidence* favours pure digits, and the decimal point comes from the
prosecutor's repro literal, which is illustrative rather than sourced. The defender is right that
*if* the platform emits a separator the proposed P1 fix would be a no-op; they are wrong to present
that as established.

Since nobody in this repo can prove the format, the valuable half of D6 is not the regex — it is the
**sanity guard**, which makes the outcome safe under *every* format hypothesis.

**Fix (MUST).** In `discussionApi.ts`:
1. `:37` → `if (/^\d{14,}(\.\d+)?$/.test(raw)) {`, and slice from `raw.replace('.', '')` — cheap
   insurance, no behaviour change on today's data.
2. After the `Date.UTC` computation and before returning, and again before the final
   `return parsed`, add: `if (ms > Date.now() + 3_155_760_000_000) return 0;` (≈100 years) — so no
   parser hypothesis can ever put a four-digit-future year on a card.
3. `export function normalizeTimestamp(...)` and use it in `approvalApi.ts:279` (P1) and
   `writerRank.ts:69` (P3).

### D7 — the five-item comment action row has no `flex-wrap`, and its sibling does — **UPHELD. Severity: Minor. MUST (one line).**

**Decisive fact, checked myself.** `ThreadedDiscussion.module.scss:160` is
`.commentActions { display: flex; align-items: center; gap: $spacing-md; }` — no `flex-wrap` — while
`.commentHeader` one line above at `:127` **does** carry `flex-wrap: wrap`. So the omission is an
inconsistency inside one file, not a house style, and this branch tripled that row's contents
(vote group + rank chip + Reply + Delete) without touching the rule. I accept the defender's honest
caveat that the 360px arithmetic is computed, not rendered — but the structural claim needs no
browser, and the fix carries no risk.

**Fix (MUST).** `ThreadedDiscussion.module.scss:160` → add `flex-wrap: wrap; row-gap: $spacing-xs;`.

### D8 — French quality: four defects in the new strings — **UPHELD-NARROWED, split 2/2. Two MUST, two LATER.**

**Decisive facts, read at HEAD.** `fr.ts:818` is
`'causes.status.scoped': 'Consensus parmi {n} participants Gloki à {community}'` and `fr.ts:819` is
`'causes.status.scopedNoCommunity': 'Consensus entre {n} participants Gloki'`. Both are produced by
the same function eight lines apart (`DiscussionStatusPill.tsx:29` and `:33`), and the seeded
community names are organisation names, not places ("Digital Rights Coalition" etc.). Two clear-cut
defects: `à {community}` is wrong before an organisation name, and one function must not render
`parmi` in one branch and `entre` in the other. This is the F4 sentence — the one string on the
branch designed to be read outside the app — so it is worth a MUST despite being Minor.

**Narrowed to LATER:** (3) the gender of `Contesté / Divisé / Convergent` inside
`'Discussion des causes : {word}'` and (4) `rédacteurs` → `contributeurs`. Both are register
judgements I will not make from here, (4) is bound to an English vocabulary decision that does not
exist yet (D12), and the repo has a purpose-built venue: `docs/i18n-native-review-candidates.md`,
which the defender confirmed was updated with 65 new rows this branch. Route them there.

**Fix (MUST).** `fr.ts:818` → `'Consensus parmi {n} participants Gloki dans {community}'`;
`fr.ts:819` → `'Consensus parmi {n} participants Gloki'`.

### D9 — Swahili: one calque that does not carry meaning — **UPHELD. Severity: Minor. LATER (native-review packet).**

**Decisive fact.** `sw.ts:841` is `'impact.field.risks': 'Hatari zinazowezekana na mizani ya
kubadilishana'` — "trade-offs" rendered literally as "scales of exchanging" — while `sw.ts:843`
(`'Gharama za fursa — ni nini kinachopotea kwa kuchagua hili?'`) shows the same file *glossing* a
technical term rather than calquing it. The inconsistency is real and it is helper text on a
required field.

**Why LATER, not MUST.** The defender proposes a specific replacement string. I will not put an
un-reviewed Swahili sentence into the product on a fix-wave deadline when the repo has a native
review packet built for exactly this and the defender themselves says "this is one of the ~6 lines
I would put in front of a native reviewer". Route to `docs/i18n-native-review-candidates.md` with
the proposed alternative recorded. Their trailing note (French takes the singular for zero, so
`causes.panel.solutions.one|many` renders "0 solutions" in fr) goes in the same packet row.

### D10 — an untranslated string on the Solutions board — **UPHELD-NARROWED to one key, and the headline claim is REFUTED. Severity: Minor. LATER.**

**Decisive fact — I re-measured, and this is the most consequential correction in the ruling.**
`mechanisms.approval.reviewPending` **is** translated, in both locales:
`src/i18n/fr.ts:1083` and `src/i18n/sw.ts:1082`. It is invisible to the defender's extraction (and
to the count command the docs use) because those two lines carry **two key–value pairs on one
physical line**, and `grep -oE "^  '[^']+':"` only ever sees the first. So D10's headline —
"no entry in `fr.ts` or `sw.ts`" — is wrong, and it does **not** refute the prosecutor's
"every `t()` key resolves in both" for this key.

`writeTogether.submittedNote` **is** genuinely missing from both locales and is genuinely used
(`src/components/community/writeTogether/DraftEditor.tsx:79`). Pre-existing, outside S35's surface,
not on the S35 newcomer path. **LATER.**

**The correction that matters more than the finding** is the counting method, and it changes P8 —
see the corrected numbers there and the mandated re-measure command in THE FIX LIST §D. The
double-key lines should also be split so the repo's own documented command stops lying: **MUST**.

### D11 — the new form removes the focus outline, against an explicit DESIGN_SYSTEM law — **UPHELD. Severity: Minor. MUST (one line).**

**Decisive fact, checked myself.** `ImpactAssessmentForm.module.scss:21` is
`&:focus { border-color: $primary; outline: none; }`. `DESIGN_SYSTEM.md:672` states the law with no
exception: 2px `$primary` ring, 2px offset, on **every** focusable element, "Never remove the
outline without replacing it." A 1px border tint against a `$gray-200` border is not a replacement
and does not reach 3:1 non-text contrast. This is a **new file** on this branch putting **six** new
focusable controls outside a law that every other new control on the branch obeys — including
`.composeTextarea` in the same component family, which gets it right
(`ThreadedDiscussion.module.scss:34`).

**Fix (MUST).** `ImpactAssessmentForm.module.scss:21` →
`&:focus-visible { outline: 2px solid $primary; outline-offset: 1px; border-color: $primary; }`
(copied verbatim from `ThreadedDiscussion.module.scss:34`).

### D12 — a forward promise with no forward affordance, and undefined vocabulary — **UPHELD. Severity: Minor. LATER (both halves).**

**Decisive fact.** `DiscussionStageView.tsx:88-93` is new copy on this branch telling the reader
"The top 15 are carried into Solutions; a solution must address one of the top 5", and the page then
ends at `:118-121` with no stage strip, no "Solutions →" link, and only `showBack` on the header.
Pre-branch this page made no such promise, so both the expectation and the gap are new. The
"writers" half is also real: `impact.rung.*` is the only place the product uses the word, it renders
to every viewer (outside the `canAssessThis` guard, `SolutionsBoard.tsx:833-836`), and both
translators independently un-metaphored "driver" (`fr` *facteur*, `sw` *sababu halisi*) — when both
translations have to rewrite the source, the source is what to fix.

**Why LATER for both.** (a) The forward affordance means mounting `InitiativeStageStrip` (or an
equivalent) on a page that has never had one — a navigation change, not a copy change, and one that
interacts with the frozen route map; that needs a scoped decision, not a fix-wave guess.
(b) "writers" → "contributors" is an English product-vocabulary decision that then invalidates six
translated strings in two locales; doing it half-way (English only) is worse than not doing it.
Ledger both for S36 with D8.4 and D9 attached.

### D13 — two items the defender would not block on — **UPHELD-NARROWED. Severity: Minor. LATER (both).**

**D13.1** (`SolutionsBoard.tsx:600-609`) — the primary "Add a solution" CTA is `disabled` +
`aria-disabled` while `discussionReady` is false, explained only by a `title` that never fires on
touch, with `TopCausesPanel` returning `null` until loaded (`:92`) so no loading indicator exists
anywhere on screen. Confirmed, and it is the same defect class as P15 (an unexplained disabled
control). It differs in that the state is *transient* — it clears as soon as the read returns —
which is why P15 is MUST and this is not. **LATER**, and it should be fixed with P15's copy pattern.

**D13.2** (`InitiativeStageCard.tsx:135`/`:217` → `DiscussionPill.tsx:105`) — an expanded stage card
shows the five-band word twice, ~200px apart. Confirmed; both renders are `decorative` so AT hears
it once, and the new DESIGN_SYSTEM rule ("exactly one discussion signal") is scoped to the
*collapsed* summary, so this is redundancy, not a law violation. **LATER.**

---

## Rulings on the status-formula guards

P6 and D4 both propose changing `computeDiscussionStatus`. D6 ruled the formula
(`agreement = Σ|up−down| / Σ(up+down)` over the ≤10 most-voted root comments) and its bands
(`0.25 / 0.5 / 0.75`); F3 ruled its two floors. The Global Constraint is that a ruled formula may be
**guarded**, not **replaced**, without a new product decision. I rule on each separately.

### Guard 1 — `MIN_PARTICIPANTS`: **inside the ruling's intent. IMPLEMENT. Value = 3.**

F3's own stated reason for its second floor is, verbatim
(`docs/superpowers/specs/2026-09-02-s34-decision-record.md:75`): "stops one lopsided comment with 10
votes from declaring 'Consensus' for a whole discussion — the failure mode most damaging to the
word's external meaning (F4)." A distinct-voter floor is **the same instrument aimed at the same
failure mode**, one axis over: F3 stopped one lopsided *comment*; this stops one lopsided *person*.
It is structurally identical to the two floors already there — a precondition that returns `'open'`
before the formula runs — and it changes neither the formula nor a single threshold. It sits
squarely inside F3's intent and needs no new product decision.

**Value = 3, and not more.** Three reasons: it matches `MIN_VOTED_COMMENTS = 3`, so the module has
one floor concept and not two; it is the smallest number that makes the F4 sentence's plural true
and the claim defensible; and D6's own recorded dissent warns that "two floors make a genuinely
converging small discussion sit on 'New' longer than it deserves" — a higher floor would compound
exactly the cost the panel already accepted reluctantly.

**Verified not to disturb the demo.** `DISCUSSION_VOTES_BY_KEY` seeds 22 votes on `misinfo` and 19
on `databroker` (`fixtures/deliberation.ts:442-459`) drawn by a monotonic cursor over a 16-key
`VOTER_POOL`, so both discussions carry 16 distinct voters — far above 3. The documented bands
(misinfo → converging, databroker → divided) are unchanged.

**Consequence that removes work from the wave.** With this floor, `consensus` is unreachable below
3 participants, so the "Consensus among **1** Gloki participants" string P6 filed is **structurally
unreachable**. `statusAccessibleName` is only ever called on a `DiscussionStatus` produced by
`computeDiscussionStatus` (verified: `DiscussionStatusPill`, `DiscussionPill`, `TopCausesPanel`,
`InitiativeStageCard` are its only consumers). I therefore **DISMISS the `causes.status.scoped.one/.many`
half of P6's proposed fix as redundant** — do not add four i18n keys on push day to serve a branch
the floor makes dead. Record the dependency in a code comment instead (spelled out in the fix list),
so nobody lowers the floor later without noticing.

### Guard 2 — consensus requires a positive net: **inside F4's intent. IMPLEMENT, as a band cap, not a formula change.**

D4 is right that `Math.abs` makes `agreement` sign-blind, so a sample the community has **unanimously
rejected** scores 1.0 and paints green "Consensus" — with ten real distinct voters, so Guard 1 does
not touch it. F4's ruling is a legitimacy rule, not a copy rule: "an unscoped 'Consensus' in a
ministry briefing is a claim we cannot support" (`decision-record:80`). A Consensus badge earned by
unanimous rejection is precisely such a claim, and it leaves the app through the mandate export.

**But implement it as a cap, not as a rewrite.** Do **not** take D4's first option ("compute the
numerator over the upheld direction only") — that *replaces* the D6 formula and needs a new product
decision. Take the second: leave `agreement` exactly as ruled, and add a precondition on which bands
that value may reach. This is the same shape as the existing floors, which already override the band
mapping.

**Which band a unanimously-rejected sample lands in: `divided`.** Ruled, with reasons, because the
implementer must not have to choose:
- **Not `open`/"New"** — false. The discussion has ≥10 votes on ≥3 root comments from ≥3 people;
  calling it New hides real engagement and would make the pill lie in the other direction.
- **Not `contested`** — "Contested" (amber) implies conflict *between voters*. Unanimous rejection is
  agreement between voters; the amber tone would misdescribe it.
- **`divided`** (info/teal, `STATUS_META.divided`) is the honest reading — the community has not
  settled on the causes — it carries a neutral tone, and per F4 it is not a claim anything can
  export. It is also the band that already means "no clear signal", which is exactly the state.

Implement as a **cap**: a sample with net ≤ 0 that already computes to `contested` stays `contested`.
Only the two claim-making bands (`converging`, `consensus`) become unreachable. That is the narrowest
guard that satisfies F4 and touches nothing D6 ruled.

**Verified not to disturb the demo.** Seeded net scores are positive on both showcases —
misinfo `5+3+3+1 = 12`, databroker `4+0+0+1 = 5` — so `converging` and `divided` land exactly as the
fixture comments document.

### Exact code (both guards, one edit to `src/utils/discussionStatus.ts`)

```ts
export const MIN_PARTICIPANTS = 3;   // beside STATUS_VOTE_FLOOR / MIN_VOTED_COMMENTS

// …inside computeDiscussionStatus, replacing the guard at :40 and the band block at :44-48:

// F3 + S35 R3 guard 1: three floors, all counted before the formula runs. MIN_PARTICIPANTS is
// what makes `status.participants >= 3`, which is why causes.status.scoped needs no singular form.
if (totalVotes < STATUS_VOTE_FLOOR || voted.length < MIN_VOTED_COMMENTS || participants < MIN_PARTICIPANTS) {
  return { key: 'open', agreement: 0, ...base };
}
const num = voted.reduce((s, r) => s + Math.abs(r.up - r.down), 0);
const den = voted.reduce((s, r) => s + r.up + r.down, 0);
const agreement = den === 0 ? 0 : num / den;
const band: DiscussionStatusKey =
  agreement < STATUS_THRESHOLDS.contested ? 'contested'
  : agreement < STATUS_THRESHOLDS.divided ? 'divided'
  : agreement < STATUS_THRESHOLDS.converging ? 'converging'
  : 'consensus';
// S35 R3 guard 2 (F4): `agreement` is D6's ruled formula and is sign-blind — a sample the
// community unanimously REJECTED scores 1.0. The formula and its thresholds are untouched; a
// non-positive net score simply cannot reach the two bands that make an external claim.
const net = voted.reduce((s, r) => s + r.up - r.down, 0);
const key: DiscussionStatusKey =
  net > 0 || (band !== 'converging' && band !== 'consensus') ? band : 'divided';
return { key, agreement, ...base };
```

`DESIGN_SYSTEM.md`'s "Discussion status" block documents the floors and was accurate at HEAD; it
must be updated in the same commit — exact wording in THE FIX LIST §A6.

---

# THE FIX LIST

Ordered, grouped into nine commits. Everything marked **MUST** ships before the push; everything
marked **LATER** is a ledger entry for S36 and **ships as-is**. New English strings go inline in the
`t()` call (per `src/i18n/en.ts`'s header: `en.ts` is a partial seed dictionary and lanes pass
English defaults inline); **fr.ts and sw.ts must both gain every new key**, or parity breaks.

## §A — MUST

### Commit 1 — `fix(causes): normalise contract timestamps through one parser` (P1, P3, D6)
1. `src/components/collaboration/flows/discussion/discussionApi.ts:31` — `export` the
   `normalizeTimestamp` function.
2. Same file `:37` — widen to `if (/^\d{14,}(\.\d+)?$/.test(raw)) {` and slice from
   `const digits = raw.replace('.', '');` instead of `raw`.
3. Same file — before each of the two success returns (`return ms;` and `return parsed;`), add
   `if (<value> > Date.now() + 3_155_760_000_000) return 0;` (≈100 years). This is the load-bearing
   half: no format hypothesis can then put a four-digit-future year on a card.
4. `src/components/collaboration/flows/voting/approvalApi.ts:279` →
   `timestamp: normalizeTimestamp(r.timestamp as number | string | undefined),` (add the import).
5. `src/utils/writerRank.ts:69` → `const ts = normalizeTimestamp(p.timestamp);` (add the import;
   keep the `Number.isFinite` guard at `:75`).

### Commit 2 — `fix(causes): vote on roots, and guard the Consensus claim` (P2, P6, D4)
6. `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx:207` — replace
   `depth === 0` with `!node.parentId`. Nothing else: the Like button is the other arm of the same
   ternary and returns automatically for a focused reply.
7. `src/utils/discussionStatus.ts` — apply both guards exactly as written in
   **"Rulings on the status-formula guards → Exact code"** above (`MIN_PARTICIPANTS = 3`, the
   third floor, and the `net > 0` band cap to `divided`). Keep both code comments verbatim; they
   are the record of why the singular i18n form is not needed.
8. `DESIGN_SYSTEM.md:487-489` — replace "**Floors** below which the band is always `open`
   ("New"), regardless of agreement: fewer than 10 total votes, or fewer than 3 voted-on root
   comments." with:
   > **Floors** below which the band is always `open` ("New"), regardless of agreement: fewer than
   > 10 total votes, fewer than 3 voted-on root comments, or fewer than 3 distinct voters. And
   > because `agreement` is sign-blind (`Σ|up−down|`), a sample whose **net** score is not positive
   > is capped at `Divided` — a unanimously *rejected* causes list must never read "Consensus" (F4).

### Commit 3 — `fix(causes): never claim a cause was demoted before ranks resolve` (P12)
9. `src/components/initiative/CauseLine.tsx` — add `causesLoaded?: boolean` to `CauseLineProps`,
   default `true` in the destructure; make the middle branch
   `if (!causeText) { if (!causesLoaded) return null; /* existing badge */ }`.
10. Pass `causesLoaded={causes.length > 0}` at `SolutionsBoard.tsx:123`, `QVFlow.tsx:360`,
    `QVFlow.tsx:452`, `VotePreview.tsx:119` (each file already has `causes` in scope).
    **Do not use `discussionReady`** — `TopCausesPanel` sets it true on its failure path by design
    (`TopCausesPanel.tsx:78-84`), so it would not fix the permanent case.
11. `src/hooks/useMandate.ts` — add `causeResolvable?: boolean;` to the mandate interface near `:27`
    and `causeResolvable: causes.length > 0,` to the returned object at `:192-194`;
    `src/components/mandate/MandateCard.tsx:113` passes `causesLoaded={mandate.causeResolvable}`.

### Commit 4 — `fix(a11y): accessible names, focus ring, and the locked-vote explanation` (P5, P13, P14, P15, D5a, D7, D11)
12. `src/components/shared/Badge.tsx:24` — add `role={ariaLabel ? 'img' : undefined}` to the span.
13. `src/components/initiative/InitiativeStageCard.tsx:106-107` — strip trailing sentence
    punctuation from the base:
    `` `${toggleBaseName.replace(/[.!?]+$/, '')}. ${statusAccessibleName(t, discussionStatus, communityName)}` ``
14. `src/components/AppHeader.tsx:29` — `subtitle?: React.ReactNode;` (additive).
15. `src/components/collaboration/DiscussionStageView.module.scss` — add a `.srOnly` block copied
    verbatim from `src/components/shared/LanguageSwitcher.module.scss:37`.
16. `src/components/collaboration/DiscussionStageView.tsx:81` — when `status` is set, pass
    `subtitle={<>{statusWord}<span className={styles.srOnly}> — {statusAccessibleName(t, status, communityName)}</span></>}`
    (import `statusAccessibleName` from `../initiative/DiscussionStatusPill`). Update the comment at
    `:66-69`, which currently records the limitation this removes. **Do not** put `aria-label` on the
    `<p>` — `role=paragraph` is name-prohibited, same reason as item 12.
17. `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` — when `!canParticipate`,
    render one `<p id={lockedId}>` (via `useId()`) above the thread list carrying
    `t('causes.vote.locked', 'Voting on causes is open to verified community members.')`, and add
    `aria-describedby={lockedId}` to both vote buttons at `:211` and `:219`.
    New key — **fr**: `'causes.vote.locked': 'Le vote sur les causes est réservé aux membres vérifiés de la communauté.'`
    · **sw**: `'causes.vote.locked': 'Kupiga kura kuhusu sababu ni kwa wanachama waliothibitishwa wa jumuiya.'`
    (Copy states the rule rather than instructing "get verified", because an *organization* account —
    the reachable case, `useCommunityTrust.ts:80-84` — can never satisfy it.)
18. `src/components/initiative/ImpactAssessmentForm.tsx` — add
    `<p id={requiredId} className={styles.helper}>{t('impact.allRequired', 'All fields are required.')}</p>`
    under the modal intro, and `aria-describedby={requiredId}` on the Submit button at `:83`.
    New key — **fr**: `'impact.allRequired': 'Tous les champs sont obligatoires.'`
    · **sw**: `'impact.allRequired': 'Sehemu zote zinahitajika.'`
19. `src/components/initiative/ImpactAssessmentForm.module.scss:21` →
    `&:focus-visible { outline: 2px solid $primary; outline-offset: 1px; border-color: $primary; }`
20. `src/components/collaboration/flows/discussion/ThreadedDiscussion.module.scss:160` — add
    `flex-wrap: wrap; row-gap: $spacing-xs;` to `.commentActions`.

### Commit 5 — `fix(solutions): don't advertise assessment slots that don't exist` (P9)
21. `src/components/initiative/stages/SolutionsBoard.tsx:786` →
    `const rungNote = eligibilityReady && elig.keys.length > 0 && solutionAssessments.length < ASSESSORS_PER_SOLUTION ? rungCopy(t, elig.rung) : null;`
    (import `ASSESSORS_PER_SOLUTION` from `../../../utils/writerRank` if not already imported).

### Commit 6 — `fix(copy): the Causes stage explainer, and thresholds nothing enforces` (P11, D3-companion, D8)
22. `src/pages/CreateInitiativePage.tsx:37` — `description:` →
    `'Community members name the causes of the problem and vote them up or down. The most-supported causes are carried into Solutions.'`
23. `src/pages/CreateInitiativePage.tsx:31` — `description:` →
    `'Your community votes on whether this is a real problem worth addressing before it moves forward.'`
    (drops the unenforced "At least 50% of voters must agree".)
24. `src/i18n/fr.ts:295` `'initiative.stages.discussion.desc'` →
    `'Les membres de la communauté nomment les causes du problème et votent pour ou contre. Les causes les plus soutenues sont reprises dans les Solutions.'`
25. `src/i18n/fr.ts:294` `'initiative.stages.problem.desc'` →
    `'Votre communauté vote pour déterminer si c’est un vrai problème qui mérite d’être traité avant qu’il avance.'`
26. `src/i18n/sw.ts:294` `'initiative.stages.discussion.desc'` →
    `'Wanachama wa jumuiya wanataja sababu za tatizo na kupiga kura ya kuunga mkono au kupinga. Sababu zinazoungwa mkono zaidi zinaendelezwa katika Suluhisho.'`
27. `src/i18n/sw.ts:293` `'initiative.stages.problem.desc'` →
    `'Jumuiya yako inapiga kura kuamua kama hili ni tatizo halisi linalostahili kushughulikiwa kabla halijasonga mbele.'`
28. `src/i18n/fr.ts:818` → `'causes.status.scoped': 'Consensus parmi {n} participants Gloki dans {community}'`
    (`à` is wrong before an organisation name).
29. `src/i18n/fr.ts:819` → `'causes.status.scopedNoCommunity': 'Consensus parmi {n} participants Gloki'`
    (one function must not render `parmi` in one branch and `entre` in the other).

### Commit 7 — `fix(demo): state the D7 rule the code actually implements` (P10)
30. `src/services/demo/seedDemoCommunity.ts:245-246` — replace the two comment lines with:
    `// D7 self-dealing (decision record :34): an assessor must not author the solution they`
    `// assess, nor any solution sharing its causeId. This seed is additionally strict — it`
    `// avoids every solution author it can — but the persona branch below is the only branch`
    `// that enforces it; the VIEWER branch relies on the ruled rule, which it satisfies.`

### Commit 8 — `docs(ouri): __init__ additions, patch guards, and the membership-guard question` (D2, D1, P7-new-half)
31. `docs/FOR_OURI_seam.md` — insert as the **first** bullet of the S35 addendum (before the
    `vote_comment` bullet at `:195`):
    > - **`__init__` first:** add `self.comment_votes = Storage('comment_votes')` and
    >   `self.impact_assessments = Storage('impact_assessments')` to
    >   `GlokiEngageInitiative.__init__`. The other four methods raise `AttributeError` on first
    >   call without them.
32. `docs/FOR_OURI_seam.md` — append as the **last** bullet of the S35 addendum the D1 question,
    verbatim from the D1 ruling above ("**Question for Ouri (not a patch change):** …").
33. `docs/contracts/s34-initiative-contract-additions.py:11` — replace the `# __init__ additions`
    header with `# --- add these two lines to __init__ (do this FIRST) ---`. Leave both lines
    commented: the file is a paste-in patch, not an executable module.
34. `docs/contracts/s34-initiative-contract-additions.py` — in `add_impact_assessment`, immediately
    before the `key = proposal_id + ':' + caller` line at `:69`, add the enum + required-field
    guards given in the P7 ruling. **Do not** change the two `not in` membership guards.

### Commit 9 — `docs(s35): corrected closeout counts` (P8, D10 measurement fix)
35. `src/i18n/fr.ts:1083` and `src/i18n/sw.ts:1082` — split the two key–value pairs onto separate
    lines. These are the only double-key lines in either file, and they are why the repo's own
    documented count command reports 1248 instead of 1249.
36. `MASTER_TODO.md:485`, `MASTER_TODO.md:611`, and
    `docs/session-prompts/session-36-verification-w1.md:5` — print the range as
    **`origin/ui..ui` (`101e4a3..<final HEAD>`, N commits)**. Delete every occurrence of
    `2e3aada..15b9d59`; it is a 28-commit range that has been printed beside both 38 and 29.
37. `MASTER_TODO.md:625-626` — the i18n line becomes **"+60 keys / 1 retired at fr/sw parity
    K/K"**. My measurement at `18b54c6`: base 1190 → head **1249**, **+60 / −1**, key sets
    byte-identical between fr and sw. The prosecutor's "+67" counted added diff lines (which
    conflates new keys with re-worded values); the defender's "1248" came from a line-anchored grep
    that cannot see the second key on a shared line.
38. **RE-MEASURE at the end of the wave and write the final numbers** — this wave adds commits and
    at least two keys (`causes.vote.locked`, `impact.allRequired`), so N and K above are not yet
    known. Run, from the repo root, after the last fix commit:
    ```
    git rev-list --count origin/ui..ui                                     # → N
    grep -oE "'[A-Za-z0-9_.]+':" src/i18n/fr.ts | sort -u | wc -l          # → K  (fr)
    grep -oE "'[A-Za-z0-9_.]+':" src/i18n/sw.ts | sort -u | wc -l          # → K  (sw, must match)
    git rev-parse --short HEAD                                             # → final HEAD
    ```
    Use **this** counting command, not `grep -cE "^  '[^']+':"`. After item 35 the two agree, but
    the `-oE … sort -u` form is correct regardless of line layout — put it in the doc beside the
    number so the next session can reproduce it.

## §B — LATER (S36 ledger; these ship as-is)

39. **P4** — `DiscussionStatusPill`'s F5 width guard is a one-way latch. Fix structurally: an
    `aria-hidden`, never-collapsed measuring clone, measured against the badge's content box.
40. **P5 tail** — `aria-label` on role-less `<span>`s at `ThreadedDiscussion.tsx:216` and
    `TopCausesPanel.tsx:140-143` ("Net score {n}"); same defect class as item 12, lower stakes.
41. **P7 inherited half + D5(b)** — decide the seam-wide refusal convention. The real contract
    returns bare `return` on **every** refusal (`server-side-contract-cef1fe5.py:151, 159, 254, 263`),
    so this is a house-wide condition, not an S35 patch item. When decided: give the demo stub's
    refusals stable codes, map them to i18n keys client-side, and state the convention once in
    `FOR_OURI_seam.md`.
42. **P10 optic** — move the seeded `VIEWER` impact assessment off `databroker`'s `p0`, or drop
    `p3`'s merge suggestion into `p0`, so the showcase stops displaying a rival author assessing a
    rival. Touches seeded showcase composition (`p0` is deliberately 2-of-3 to demo the cap) —
    needs a fixture pass, not a one-line edit.
43. **P13 tail** — `toggleAriaLabel` goes from `undefined` to a value when `discussionStatus`
    resolves, changing the button's accessible name after mount and dropping the stage badge from
    it. Decide what the name should be *before* status loads.
44. **D8.3 / D8.4 / D9 / D12(b)** — French gender agreement on the three band adjectives inside
    `'Discussion des causes : {word}'`; `rédacteurs` → `contributeurs`; the Swahili `mizani ya
    kubadilishana` calque at `sw.ts:841`; French singular-for-zero on
    `causes.panel.solutions.one|many`. **Route all four to
    `docs/i18n-native-review-candidates.md`**, not to a fix wave — they are register judgements, and
    D8.4 is blocked on the English "writers" decision below.
45. **D12(a)** — `DiscussionStageView` promises "carried into Solutions" and offers no way to get
    there (no stage strip, no link); `TopCausesPanel`'s `causes.none` has the same gap in reverse.
    Navigation change, needs a scoped decision.
46. **D12(b)** — "writers" and "driver" are undefined product vocabulary on the newcomer path; both
    translators independently un-metaphored "driver". Decide the English first, then re-translate
    `impact.rung.*`, `causes.hint`, `causes.vote.up/.down` together.
47. **D10 tail** — `writeTogether.submittedNote` (used at `DraftEditor.tsx:79`) is missing from both
    locales. Pre-existing, off the S35 path.
48. **D13.1** — the "Add a solution" CTA is disabled with only a `title` while `discussionReady`
    is false, and `TopCausesPanel` renders nothing until loaded, so there is no loading indicator on
    screen. Fix with item 17's copy pattern.
49. **D13.2** — an expanded stage card renders the status word twice, ~200px apart. Redundancy, not
    a law violation.

## §C — new i18n keys added by this wave (fr + sw both, en inline)

| key | en (inline default) | fr | sw |
|---|---|---|---|
| `causes.vote.locked` | Voting on causes is open to verified community members. | Le vote sur les causes est réservé aux membres vérifiés de la communauté. | Kupiga kura kuhusu sababu ni kwa wanachama waliothibitishwa wa jumuiya. |
| `impact.allRequired` | All fields are required. | Tous les champs sont obligatoires. | Sehemu zote zinahitajika. |

No other new keys. In particular, **do not** add `causes.status.scoped.one/.many` — the
`MIN_PARTICIPANTS = 3` floor makes the singular unreachable (ruled above).

## §D — docs numbers, measured by me at `18b54c6`

| number | value at HEAD | who was right |
|---|---|---|
| `git rev-list --count 101e4a3..18b54c6` (= `origin/ui..ui`) | **38** | both |
| `git rev-list --count 2e3aada..15b9d59` | **28** | both (the printed range is wrong everywhere) |
| `git rev-list --count 101e4a3..15b9d59` | **29** | both |
| fr/sw key count at HEAD | **1249 / 1249**, key sets identical | **prosecutor** |
| key delta `101e4a3..18b54c6` | base 1190 → 1249, **+60 / −1** (`mechanisms.qv.commitsMetricsN`) | **defender** |

Neither panellist had both halves. Write **+60 keys / 1 retired at fr/sw parity 1249/1249** — then
**re-measure per item 38**, because the wave itself adds commits and two keys.

---

# Verdict

**Ready to push after the MUST list? — Yes.** Nothing on this branch corrupts data, breaks a fresh
`global-v18` seed, or fails `tsc`; the one item filed as a hand-off blocker (D1) is dismissed as a
blocker because Ouri's real contract already runs the identical membership guard in four live
production methods, and everything that remains in §A is a bounded, line-specified edit that leaves
the D6/F3 formula and every locked product decision intact.

## Scoreboard

**Upheld as filed (12):** P1, P2, P4, P6, P8, P9, P11, P12, P14, D3, D4, D7, D11.
**Upheld-narrowed (10):** P3 (Important→Minor), P5, P7 (split: new half MUST, inherited half LATER),
P10 (not a D7 violation — comment only), P13 (→trivial), P15 (Minor→Important-minus, re-based on the
*organization* viewer), D2 (Important→Minor), D5 (split), D6 (regex speculative, sanity guard is the
value), D9, D10 (headline **refuted** — `mechanisms.approval.reviewPending` *is* translated),
D12, D13.
**Dismissed (1):** D1 as a blocker (retained as one line of hand-off text).

## Three corrections the controller should carry forward

1. **D1 was not a blocker.** The real contract at `cef1fe5` runs
   `if comment_id in self.comments` (`:150`), `if comment_id not in self.comments` (`:159`) and
   `if proposal_id not in self.proposals` (`:254`, `:263`) in production today. The patch's guards
   are byte-identical in form. The residual question is about Ouri's whole contract, not this patch,
   and it costs one sentence in `FOR_OURI_seam.md`.
2. **Both panellists' i18n numbers were half-wrong**, for opposite reasons — and the cause is a
   counting command the repo itself documents. `fr.ts:1083` / `sw.ts:1082` each carry two keys on one
   physical line, invisible to `grep -cE "^  '[^']+':"`. True: **1249/1249, +60/−1**. Item 35 splits
   those lines so the documented command stops lying; item 38 mandates a re-measure with the
   layout-independent command.
3. **The MIN_PARTICIPANTS floor removes work, not adds it.** With a 3-voter floor, "Consensus among
   1 Gloki participants" is structurally unreachable, so the four plural i18n keys P6 asked for are
   dead code. Two new keys ship this wave, not six.

## What ships unfixed, stated plainly

A pill that can latch to dot-only and not come back (P4); two "Net score" readouts on role-less
spans (P5 tail); a demo showcase in which "You" assess a rival's solution (P10 optic); a Causes page
that promises Solutions and offers no route there, in vocabulary — "writers", "driver" — that both
translators had to rewrite (D12); four fr/sw register defects routed to the native-review packet
(D8.3/8.4, D9); a pre-existing untranslated string off the S35 path (D10 tail); and the seam-wide
fact that on the real contract **every** refusal is silent, in every write the app has ever made
(P7 inherited half, D5b). None of these is a claim the product cannot support, which is the line I
drew: **the MUST list is exactly the set of items where the app tells a user, an auditor, or a
ministry something that is not true** — a year-2612 date, a vote that does nothing, "Consensus" from
one person or from unanimous rejection, "Cause no longer ranked" for a cause ranked #1, "Open to the
top 10 writers" on a full solution, a 33% threshold nothing enforces, and four false numbers in the
docs of record.
