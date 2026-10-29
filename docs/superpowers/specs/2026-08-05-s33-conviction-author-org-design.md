# S33 — Conviction on the mandate page, the author's perspective, and the organization actor

**Date:** 2026-08-05 · **Branch:** `ui` · **Base:** `751c63a` (P8 closed, tree clean)
**Driver:** Eston's review notes, 2026-08-05 (verbatim asks captured in §0).
**Tier:** new roadmap tier **P9** (MASTER_TODO §7).

> Status legend — ✅ verified against HEAD · 🔶 design decision taken in this spec ·
> ⛔ explicitly out of scope.

---

## 0. What Eston asked for (verbatim intent)

1. **Conviction signalling shouldn't live only on the community page.** Clicking "Back this
   mandate" teleports you to a different page; it should expand (or at least preview) on the
   mandate page itself. Duplicated content is acceptable if it is easy and good.
2. **The author's perspective is missing.** When someone suggests an expert reviewer or a merge
   on the Solutions stage — or messages the author — *what does the author see?* We need a way
   to show both what a normal member sees and what the author sees.
3. **Let people edit their conviction after committing.** "It feels silly to have it locked in
   place." Also: it is unclear how much conviction you have — is it a one-time bank, how do you
   get more?
4. **An organizational login.** Organizations are not platform users; they interact *only* with
   finished mandates — endorse and subscribe. Almost a parallel app: they may view other
   content but cannot interact with it.
5. **The app reads as "vibe-coded / AI".** Research the telltale signs and make design changes
   where they apply. (Long-term Eston wants short-form video as initiative content; **not built
   now** — context only.)

---

## 1. Verified premises (re-grounded at `751c63a`)

Per the project's standing rule, every premise below was checked against HEAD before design.

| # | Premise | Verdict |
|---|---|---|
| P1 | "Back this mandate" navigates away from the mandate page | ✅ `MandatePage.tsx:34-36` — `navigate('/community/{cid}?initiative={mid}')`, which auto-expands the initiative card into `MandateStage` → `ConvictionStaking` |
| P2 | The mandate route's `:mandateId` **is the initiative contract id** | ✅ Confirmed at all three entry points: `MandateEngage.tsx:70`, `MandateActivityCard.tsx:87`, `StageFeedView.tsx:192` — each passes the initiative/item id |
| P3 | Conviction uses a **shared** contract keyed off the initiative | ✅ `MandateStage.tsx:29-34` mounts `ConvictionStaking` with `instanceId={`${initiativeId}_conviction`}`, `parentContractId={initiativeId}`, `stageKey="convictionContractId"`; `useFlowContract.ts:115-289` resolves it via the parent's `get_stage_contract` |
| P4 | Therefore the mandate page can mount the **same** contract, not a copy | ✅ Follows from P2+P3 — same `instanceId` ⇒ same Redux cache entry (`useFlowContract.ts:29`) ⇒ same contract id |
| P5 | `useFlowContract` **deploys** when no sub-contract is registered | ✅ `useFlowContract.ts:189-273`. A passive page view must therefore never mount it (the S11 lesson: a "read-only" component calling `useFlowContract` is not read-only) |
| P6 | There is **no edit/withdraw path** for a stake | ✅ `ConvictionStaking.tsx:112-141` renders the commitment summary with no control once `myStake` exists; `conviction.ts` exposes only `stake`, `get_my_stake`, `get_stakes`, `get_total_conviction`, `get_conviction_by_country`. Grepped `update_stake`, `unstake`, `withdraw`, `edit` across `src/` — no hits |
| P7 | Re-calling `stake` would **corrupt** the one-person-one-commitment invariant | ✅ `conviction.ts:81` — `newAmount = existing.amount + amount`, so a second call makes amount 2. The UI only avoids this today by hiding the form |
| P8 | Conviction is **time-only, never wealth-weighted** | ✅ `ConvictionStaking.tsx:28-31` — amount is always `1`; the duration multiplier (1/2/4/7/12) is the entire weight. Consistent with the locked 1p1v decision |
| P9 | Conviction has **no entry** in `docs/FOR_OURI_seam.md` | ✅ Grepped `conviction`/`stake` in that doc — zero hits. Pre-existing doc gap; this session closes it |
| P10 | The demo user (`'a'×64`) **authors nothing** in the seed | ✅ Already documented in `.claude/skills/gloki-verification-and-qa/SKILL.md:177-179`: "author-only UI branches (edit/withdraw/accept-modification) are unreachable without injecting a self-authored item first". This is precisely the gap Eston hit |
| P11 | No prior art for an organization actor | ✅ `git log --grep='organi'` on `ui` returns only unrelated commits. Greenfield — no failure-archaeology risk |

**Baseline health at `751c63a`:** `npx tsc -b` clean · grep gates ALL CLEAN · i18n parity OK
(fr 1137 / sw 1137; `en.ts` is a partial dictionary — English lives in inline `t()` fallbacks,
so copy changes touch `.tsx` + `fr.ts` + `sw.ts`, never `en.ts`).

---

## 2. W1 — Conviction on the mandate page + an editable commitment

### 2.1 The teleport (Eston ask 1)

🔶 **Decision:** replace the navigation with an **inline expandable panel** on the mandate page.
The panel mounts the existing `ConvictionStaking` with the *same* `instanceId` /
`parentContractId` / `stageKey` triple the community page uses (P3/P4), so this is **one shared
contract rendered in two places** — not duplicated content and not divergent state. Backing on
either surface shows on the other.

**Lazy mount is load-bearing (P5).** The panel renders `ConvictionStaking` only once expanded.
Merely viewing a published mandate must not deploy a contract. The expansion is an explicit user
action ("Back this mandate"), which is exactly the same authorization the community page has.

**Anatomy** — a new `MandateBacking` section between `MandateCard` and `RatificationPanel`:

- Always visible (the preview Eston asked for): the aggregate the card already states —
  backers + combined strength — so the *number* stays inline and visible even when collapsed.
  This follows the DESIGN_SYSTEM disclosure rule: prose folds, numbers do not
  (`DESIGN_SYSTEM.md:390-397`).
- A disclosure button (`aria-expanded` + `aria-controls` + chevron), matching the codebase's
  canonical inline-expansion pattern — the same grammar as
  `AdoptionFramework.tsx:137-158` (`.discloseToggle` + `hidden` panel).
- Expanded: the full `ConvictionStaking` (non-compact).

`MandateCard`'s primary CTA stops navigating and instead expands + focuses this panel, so the
button keeps its meaning while losing the teleport.

⚠️ **Implementation note:** `AdoptionFramework` hides its panel with the `hidden` attribute; a
`display:flex`/`display:grid` rule defeats `hidden` (recorded S27 learning). The new panel must
either not set a `display` on the hidden element or use `&[hidden] { display: none }`.

### 2.2 Editing a commitment (Eston ask 3)

🔶 **Decision: allow editing, and it does *not* break conviction voting.** In canonical
conviction voting (Commons Stack / 1Hive lineage) a supporter may always change or withdraw a
stake; what makes it "conviction" is that **weight accrues with time held**, not that the choice
is irreversible. Locking the choice is not a property of the mechanism — it was simply a missing
screen here (P6).

Two new wire methods on the conviction contract (a **contract-method addition**, so
`docs/FOR_OURI_seam.md` is updated in the same change — invariant 2 + the S13 cautionary
precedent):

| Method | Values | Semantics |
|---|---|---|
| `update_stake` | `{ duration, country }` | Replaces the caller's existing duration. **Amount is never touched** (stays `1`) — this is the fix for P7. Lengthening **preserves** the original `timestamp` (your backing record stands); shortening **resets** `timestamp` to now (you restart the clock). Errors if the caller has no stake. |
| `withdraw_stake` | `{}` | Removes the caller's stake entirely. Errors if there is none. |

The lengthen-preserves / shorten-resets rule is the honest analogue of time-accrual: you cannot
harvest a long record and then quietly downgrade. It is documented for Ouri so the real contract
enforces the same thing.

**UI:** the "Your commitment" block gains a "Change" control (and a quieter "Withdraw"); the
picker returns pre-set to the current duration with Save / Cancel. A commitment shows
**"Backing since {date}"** so the time dimension is visible rather than implied.

### 2.3 "How much conviction do I have?" (Eston ask 3, second half)

The confusion is real and the answer is *there is no bank* (P8) — but the UI never says so.
🔶 **Decision: fix by disclosure, not by mechanism.** An `InfoDisclosure` `(i)` next to the
heading, carrying three plain lines:

- Everyone gets **one** backing per mandate. There is no budget and nothing to spend.
- Your strength comes **only** from how long you commit — never from money or standing.
- You can change or withdraw it any time. Shortening restarts your backing clock.

This is `InfoDisclosure`'s documented job (prose behind the `(i)`, numbers inline) and it keeps
the 1p1v claim honest, which is a north-star-#1 concern, not cosmetics.

### 2.4 Out of scope for W1

⛔ A real time-accrual clock (conviction growing continuously while held) — that is a mechanism
change with contract and results implications, not a UI session. Logged to MASTER_TODO §7.

---

## 3. W2 — The author's perspective

### 3.1 What the map found (and it is worse than "missing")

A five-agent read-only mapping pass over HEAD established:

| # | Finding | Evidence |
|---|---|---|
| A1 | `SolutionsBoard` has **no author branch at all**. It fetches `roles` and uses it for exactly one thing — `isExpert` | `SolutionsBoard.tsx:159-166`; `roles.author` is never compared to `publicKey` in the file |
| A2 | An expert-review request renders **identically** for the author, the requester, and a stranger — a bare count + "Review requested by {n}" | `SolutionsBoard.tsx:530-534`, `:564-575` |
| A3 | **`mergeSuggestions` is write-only.** `suggest_proposal_merge` stores it; grepping the symbol finds it *declared* in `SolutionsBoard.tsx:34` and *written* in `approval.ts:203-207` and **read by nothing** | grep `mergeSuggestions` across `src/` |
| A4 | The one real author-decision UI (cross-initiative merge accept/reject) sits on a route **nothing in the app links to** — `/…/collaboration`, reachable only by typing the URL | `InitiativeView.tsx:42`; no `navigate()` targets it |
| A5 | `NotificationsBell` has exactly one event type (`'merge_absorbed'`) and is fed by a single dispatch on that unreachable route — so it is permanently empty | `notificationsSlice.ts:3`; `MergeProposalsList.tsx:78-86` |
| A6 | The demo user **authors nothing** in the seed — every initiative and solution is persona-authored on purpose | `seedDemoCommunity.ts:123,138,194`; already documented in `.claude/skills/gloki-verification-and-qa/SKILL.md:177-179` |

A3 is the sharpest: a member can suggest a merge, the contract records it, and **no human being
ever sees it**. Eston's question — "what does the author see?" — has the answer "nothing", and for
merges the answer is "nothing, for anyone".

### 3.2 What was built

🔶 **`SolutionAuthorPanel`**, rendered only when `p.author === publicKey`:

- **Expert-review requests** — named people (`UserIdentity`), plus the honest note that the author
  cannot grant this themselves; an expert has to pick it up. Status, not a fake action.
- **Merge suggestions** — who suggested it, the target solution quoted, and a real decision:
  **Accept the merge** / **Keep mine separate**. Settled suggestions render as a past-tense line.

🔶 **New wire method** `decide_merge_suggestion { source_id, target_id, decision }` — the missing
half of A3. **Gated on `caller === source_proposal.author`**, because the suggestion asks to fold
*the caller's own* solution into someone else's. Accepting sets `mergedInto` and deliberately does
**not** move approval counts: folding tallies is a governance change, not a display one.
Documented in `FOR_OURI_seam.md` with the auth the real contract must enforce.

🔶 **Seeded reachability (A6).** One `databroker` solution is authored by the **viewer**, carrying
two pending review requests and one merge suggestion. This is what makes the author view visible
at all — and it answers Eston's "show me both perspectives" better than a toggle would: the same
board now shows *your* solution with its author panel directly beside other people's solutions
with the plain member view. Fixtures changed ⇒ **`DEMO_VERSION` `global-v16` → `global-v17`**.

⚠️ Consequence caught in the preview walk, not the build: the viewer's byline rendered as the raw
key `aaaaaaaa…` (the demo user has no profile). Your own byline now reads **"You"**.

⛔ Out of scope: a real notifications inbox (A5), and making the `/collaboration` route reachable
(A4). Both logged to MASTER_TODO §7 — A4 in particular is a live dead-end worth its own decision.

---

## 4. W3 — The organization actor

### 4.1 The shape of the decision

Eston: organizations should **not** be users of the platform; they interact only with finished
mandates — endorse and subscribe — "almost like a parallel app". They may view other content but
not interact with it.

🔶 **Decision: a parallel actor, not a permission level.** This follows from the locked 1p1v
decision: the reason an institution cannot deliberate or vote here is not that it lacks a
privilege, it is that the mechanism counts people. So the organization is modelled beside the
member identity, not inside its trust ladder.

### 4.2 Constraints the map imposed

| # | Constraint | Consequence |
|---|---|---|
| B1 | The whole app is auth-gated above the Router (`App.tsx:99-105`) | An organization still signs in; auth is key-based for every actor, so org sign-in mints a key the same way. The local record is what makes it an organization |
| B2 | Identity is exactly `{ publicKey, serverUrl }` in localStorage + Redux | The org record persists separately (`gloki.organization`), like `DigitalAgent` — no contract, no wire method, nothing for Ouri to implement yet |
| B3 | **`useMandate` DEPLOYS** two stage contracts in shared mode | The org's mandate list must never call it — one call per row would write a contract per listed mandate. It uses `useAllInitiatives`, which is pure `contractRead` |
| B4 | Pilot communities force stage rules to `'anyone'` (`seedDemoCommunity.ts:516-520`) | `canParticipate` would happily let an institution vote. The org block must sit **before** the trust checks in `StageGate` |
| B5 | Only **one** published mandate exists, and there is no index | `/organization` builds its own list from initiatives at stage `mandate`. It will read thin until more communities finish — the empty/thin state is written for that |
| B6 | `MandateAdopter.verified` already exists as an attestation hook | Org-added endorsements stay `verified: false` ("claimed"), never "verified" — the honest state until organizations are real |

### 4.3 What was built

- `services/organizationActor.ts` + `hooks/useOrganization.ts` — the single gate the app branches on.
- `OrganizationSignIn` on `LoginPage` — a quiet secondary path (name, type, optional country).
  Deliberately shorter than the member flow: no onboarding, no vouching, no trust ladder, because
  none of it applies.
- **`/organization`** — the org's whole app: finished mandates and nothing else. *(New top-level
  route. The route map is frozen by convention, so this is flagged for Eston as an IA change —
  §6.)*
- `RootRoute` sends an org session there instead of `/welcome` (it has no member journey to onboard into).
- `StageGate` blocks organizations at every stage, before the trust checks (B4); reading stays open.
- `MandateBacking` shows an org the backer count without the staking control — backing is a
  person's act. `AdoptionFramework` binds endorse/subscribe to the signed-in org: the CTA names
  them, the modal pre-fills identity and country.
- `logout()` clears the org record — it outlives `user`, so the next person to sign in on the
  device would otherwise inherit the org session and find everything blocked.

---

## 5. W4 — "It looks vibe-coded / AI"

Handled as a research-then-audit pass rather than a guess: three independent web sweeps (visual
tells of AI-generated UIs; positive markers of hand-crafted design; how civic products earn
institutional credibility), then an audit of those findings against a factual visual inventory of
this codebase, then a skeptical verification pass over every proposed change — checking each one
is true at HEAD, doesn't violate a locked decision, and survives the mobile/fr/sw constraints.

Findings and what was applied are recorded in §7 of this spec (written at closeout).

⛔ Explicitly **not** built: short-form video as initiative content. Eston named it as the
long-term direction, not this session's scope.

---

## 6. Open decisions for Eston

1. **New top-level route `/organization`.** The route map is frozen by convention; adding a
   top-level area is an IA decision. The alternative was hanging it under an existing wildcard
   (`/identity/*`), which reads wrong for a different actor. Built as `/organization`; say if you'd
   rather it live elsewhere or be named differently.
2. **Conviction editing changes the mechanism's feel.** Lengthening preserves your backing date,
   shortening resets it. That's my reading of what keeps "conviction" honest without a real
   accrual clock — but it is a governance choice, not a UI one.
3. **No "view as author" toggle was built.** Seeding a viewer-authored solution makes the author
   view real rather than simulated, and puts both perspectives on one screen. A toggle is still
   possible if you want to flip perspective on *any* solution.
4. **Organizations can currently read every community surface.** Blocked from acting, but not from
   browsing. If organizations should see less, that's a further gate.
