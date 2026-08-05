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

## 3. W2 — The author's perspective · 4. W3 — The organization actor · 5. W4 — Design audit

Specified in §§3–5 below once the subsystem maps land; W1 above is independently verified and
buildable now.
