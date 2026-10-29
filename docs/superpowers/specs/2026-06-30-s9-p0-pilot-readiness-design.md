# S9 — P0 Pilot-Readiness Quick Wins — Design Spec

**Date:** 2026-06-30 · **Branch:** `ui` · **Layer:** stub/demo only (no real server)
**Driven by:** the 2026-06-29 nine-persona review → `MASTER_TODO.md` §7 P0.
**Eston framing decisions (2026-06-30, locked):**
1. **1p1v ↔ QV:** keep BOTH; rewrite copy to explain the relationship — everyone gets an *equal voice-budget* (1p1v, Sybil-resistant, no plutocracy); QV is *how you spend* that equal budget across issues.
2. **Blockchain copy:** LEAVE for the backend track this session — do **not** soften/remove `about.closing` blockchain wording. (Out of scope for S9.)

This is implementation work (cheap, self-contained, highest-trust). No architectural change. Every change
stays behind `src/services/api.ts`; tokens only; new/changed strings ship at **fr + sw key parity** (flat
dotted keys; en inline via `t('key','English default')`). Verify build + preview at 360px, light + dark, AA.

---

## Item 1 — [BLOCKER] Claims honesty (copy)

### 1a. 1p1v ↔ QV reconciliation
Two surfaces assert "one person, one vote / you can't buy influence" while the ballot is quadratic. Per the
locked framing, keep both and explain the link.

- **Onboarding step 3** — `src/components/onboarding/steps/RulesStep.tsx:18`, key `onboarding.rules.equal`.
  - Current: `"One person, one voice — you can't buy influence."`
  - New (explain the link, ~1 line): e.g.
    `"One person, one voice — everyone gets the same say, and no one can buy more. On a vote you spread that equal say across what you care about."`
  - If RulesStep has room for a supporting line, prefer a short headline + one explainer sub-line over one long string. Match the component's existing copy shape.
- **QV ballot** — `src/components/collaboration/flows/voting/QVFlow.tsx:230–231`, key `mechanisms.qv.guide`.
  - Current: `"Tap ♥ to back what you care about — spreading your hearts across solutions costs less than piling them onto one."`
  - Add a brief equal-budget framing so the ballot reads consistently with onboarding (e.g. prefix/auxiliary line: *"Everyone here has the same number of hearts."*). Keep it short; QV keys are `mechanisms.qv.*` (fr/sw flat-dotted; en inline — **do not** add qv keys to en.ts).
- **About page** — `src/components/identity/AboutPage.tsx`. Scan for any 1p1v/voting claim that contradicts QV; if present, align with the same "equal budget, spend it across issues" language. **Do NOT touch the `about.closing` blockchain sentence (line 24).**

### 1b. "no ID / face scan" ↔ "confirming real-world identity"
- **Onboarding step 2** — `src/components/onboarding/steps/VouchStep.tsx:42–46`, key `onboarding.vouch.explain`.
  - Current: `"A vouch is how Gloki stays real people, not bots. It's lightweight trust — no ID papers, no face scan. Someone already here said: this person belongs."`
- **Identity & Trust** — `src/components/community/IdentityTrust.tsx:59–62`, key `identityTrust.intro`.
  - Current: `"…By scanning each other's QR codes and confirming real-world identity, you strengthen the trust network…"`
  - **Contradiction:** "no ID / no face scan" vs "confirming real-world identity."
  - **Fix:** reconcile to the actual mechanism — vouching is *social* confirmation by someone who already knows you, **not** document/biometric verification. Reword `identityTrust.intro` so "confirming real-world identity" becomes something like "confirming you're a real person they know" (peer/social trust), removing the implication of formal identity proof. Keep VouchStep's "no ID papers, no face scan" and make both pages tell the same story.

### 1c. "what's public · private · permanent" line
Add a plain one-line disclosure at the two action points so users know what their action exposes.
- **QV ballot** — `QVFlow.tsx` near the guide (after ~line 245, before the ballot map at ~247).
- **Comment composer** — `ThreadedDiscussion.tsx` composer (lines ~58–98), below the textarea / near submit.
- Content must be **honest to what the stub can support** — describe the *design intent* in present tense
  without over-claiming. Suggested copy (adapt; keep ≤1 short line each):
  - Ballot: *"Your hearts are public to the community · your tally is shown · once the vote closes it's part of the record."* — but **confirm with what the UI actually shows** (votes are attributable in this demo — do not claim secrecy). Keep it factual; if unsure whether votes are secret vs attributable, state only what is visibly true and avoid asserting privacy guarantees.
  - Composer: *"Comments are public to the community and kept as part of the discussion record."*
- New keys (fr + sw parity; en inline): `mechanisms.qv.disclosure` and `deliberation.thread.disclosure` (or
  similarly namespaced — match neighbours). Render as muted/hint text using existing tokens.

> **Honesty guard:** these lines must not assert privacy/secrecy/permanence the stub can't show. Prefer
> under-claiming. The richer pre-gate "how this vote works" explainer + vote-visibility disclosure is **P2**,
> not this session — keep these to a single plain line each.

**Acceptance 1:** onboarding step 3, the ballot, and About tell one consistent 1p1v+QV story; VouchStep and
Identity & Trust tell one consistent social-vouch (not document/biometric) story; a factual disclosure line
shows at the ballot and the comment composer; all new/changed strings at fr+sw parity; `about.closing`
unchanged.

---

## Item 2 — [BLOCKER] Make the back half reachable (demo data)

### Mechanism (confirmed)
- Gate lives in `src/components/community/StageGate.tsx`; predicate is `useCommunityTrust().canCurrentUserParticipate(stage)` → `canParticipate(rule, trust, isMember)` (`src/services/trustModel.ts`).
- Rules are **per community** via the community contract's `stage_permissions` (demo: `demoContracts/community.ts`, methods `get_stage_permissions` / `set_stage_permissions`), defaulting to `DEFAULT_STAGE_PERMISSIONS` (`vote`/`mandate` = `'verified'`, others = `'members'`).
- The fresh demo user is seeded **vouched-by-2** (`identity.ts`, pending), i.e. NOT verified → the QV ballot
  (`vote`) is hard-gated. `'anyone'` makes `canParticipate` return `true` unconditionally (membership-independent).
- Initiatives already exist at every stage (`fixtures/problems.ts`): `privacy` (digital, **vote**, has a seeded
  3-solution QV ballot per S5), `amr`/`jobs` (**proposals**), `misinfo` (discussion), etc.

### Design — open ONE community honestly
Make the **digital** community an "open" community so a fresh user reaches the live QV ballot AND the
interactive SolutionsBoard there, **without faking the user's trust level** (leaves the web-of-trust gate
intact + demonstrable on health/climate/economy).

1. **Seed `stage_permissions` for the digital community** so `proposals` and `vote` are `'anyone'`. Implement
   in `seedDemoCommunity.ts` via a `set_stage_permissions` write for the digital community id (mirror the
   existing `become_member`/write pattern; acting agent = `publicKey`). Drive it from a small per-community
   config (e.g. an `openStages?: StageRule` marker on the community fixture in `fixtures/community.ts`, or a
   keyed set in the seed) rather than hardcoding the id inline — keep it legible.
2. **Ensure digital has a `proposals`-stage initiative** so SolutionsBoard is reachable *in the open community*.
   `digital` currently has `misinfo` (discussion) + `privacy` (vote) but no proposals initiative. Add one
   `proposals`-stage initiative to `digital` in `problems.ts` **with** its `PROPOSALS_BY_KEY` solutions +
   `PROPOSAL_COMMITMENTS_BY_KEY` (3 commitments each) + at least one `PROPOSAL_EXPERT_REVIEWS_BY_KEY` entry in
   `fixtures/deliberation.ts`, so the board shows real solutions with the commitments/metrics spine (S4 shape).
   Keep content global-feeling and multi-topic (not VftC-specific).
3. **Verify `privacy`'s QV ballot renders interactive** once un-gated (reviewed solutions present, hearts
   castable, hard-lock-after-cast still works). No QV logic change expected — just confirm in preview.
4. (Optional, only if needed) an honest one-line eyebrow/Banner on the open community noting it's open to
   everyone — but do not over-build; the gate banner already explains the gated communities.

### Seed discussion threads consistently
Some initiatives' Discussion renders empty but for the user's own comment. The seed populates discussion only
for keys present in `DISCUSSION_SEED_BY_KEY` (`fixtures/deliberation.ts`). **Implementer task:** enumerate
which of the live initiatives (water/amr/misinfo/privacy/ocean/adaptation/jobs/housing) lack a
`DISCUSSION_SEED_BY_KEY` entry, and add 2–4 seeded comments (diverse personas/countries, a reply or two) for
any whose Discussion stage a user can reach and would otherwise see empty. Prioritise `misinfo` (digital,
discussion stage) and any initiative in the now-open digital community.

### Bump DEMO_VERSION
`src/services/demo/mockApi.ts:17` — `'global-v12'` → **`'global-v13'`** (demo fixtures changed → forces reseed).

**Acceptance 2:** a brand-new user (cleared storage, fresh onboarding, 2 vouches) can navigate to the digital
community and (a) reach the interactive SolutionsBoard with seeded solutions, and (b) reach the live QV ballot
(`privacy`) and cast hearts — no "Verified members only" gate. Other communities still show the gate. No
reachable Discussion thread is empty. Build clean; reseed confirmed (version bump).

---

## Item 3 — [BLOCKER] A11y: announce comment posts (WCAG 4.1.3)

`src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` — `handleTopLevel` (~257–261) refreshes
after posting but neither announces nor moves focus.

- Add an `aria-live="polite"` status region that announces e.g. `t('deliberation.thread.posted','Comment posted')` after a successful post.
- Move focus to the newly-posted comment (or its container) after `refresh()` resolves. The demo seam emits
  **no `contract_write` events**, so the handler already re-fetches — hook the focus move to the post-refresh
  state (e.g. track the new comment id, focus its node via a ref/`tabIndex={-1}` + `.focus()` in an effect).
- Keep replies consistent if cheap, but top-level post is the required fix.
- New key at fr+sw parity: `deliberation.thread.posted`.

**Acceptance 3:** posting a comment announces via a live region and moves focus to the new comment; verified
with the preview accessibility snapshot.

---

## Item 4 — [MAJOR] Inviter-country default bug

`src/components/onboarding/steps/AgentStep.tsx:31`:
`const [country, setCountry] = useState(agent?.country || voucher.country);`

The profile country pre-fills from the **inviter** (`voucher.country`) and rides to profile/mandate.

- **Fix:** default to **empty** (drop the `voucher.country` fallback). Initialise from `agent?.country` only;
  otherwise unset.
- The field must be **required** and **visibly unset** (e.g. placeholder/empty `SearchableSelect`/`CountryMultiSelect`
  state), so the user must choose. Confirm the step's continue/submit validates a chosen country (don't allow
  proceeding with empty if country is required downstream — match existing required-field handling).
- Locale-guess is acceptable as a *prefill suggestion* only if it's clearly the user's own locale, not the
  inviter's; simplest correct fix is empty + required.

**Acceptance 4:** a newly-invited user sees the country field unset (not the inviter's country), must pick one,
and that choice is what propagates to profile/mandate.

---

## Item 5 — [MAJOR] A11y micro-fixes

All small, independent:

1. **Like aria-label includes count** — `ThreadedDiscussion.tsx:157`. Change
   `aria-label={t('deliberation.thread.like','Like')}` to include the count and like state, e.g.
   `t('deliberation.thread.likeCount','Like ({count})', { count: likeCount })` (and reflect liked/unliked if a
   distinct label exists). New key at fr+sw parity.
2. **Base `.actionBtn` contrast → AA** — `ThreadedDiscussion.module.scss` `.actionBtn` (~156–172) uses
   `$gray-500` (~4.0:1, borderline/below AA for normal text). Bump to the documented AA-safe gray (match how
   the S8 `.liked` fix used `$error-dark`/`$error-on-dark`; use the existing AA-safe text-muted tokens for
   light + dark). Verify ≥4.5:1 on both surfaces with `preview_inspect`.
3. **Localize `<title>`** — `index.html` has a static English `<title>`. Set the document title at runtime
   through i18n (e.g. an effect in the app root that sets `document.title = t('app.title', 'Gloki — …')`).
   New key at fr+sw parity. Keep `index.html` as the pre-hydration fallback.
4. **"across N countries" pluralization** — `src/components/mandate/AdoptionFramework.tsx:~100`, key
   `mandate.adoptionBreakdown`: `'… · across {countries} countries'`. Handle singular ("across 1 country").
   Use the project's existing pluralization approach if one exists; otherwise split into singular/plural keys
   selected by count (`mandate.adoptionBreakdown.one` / `.other` or an inline ternary on `summary.countries`).
   Fix at fr+sw parity.
5. **Discussion `<h1>` includes the stage** — `DiscussionStageView.tsx:63–68` renders `title={communityName}`
   (the `<h1>`) with stage only in `eyebrow`. The accessible name of the page h1 should convey the stage. Make
   the h1 communicate "Discussion — {community}" (e.g. include the stage in the title, or ensure the h1's
   accessible name includes the stage via the eyebrow being part of the heading). Keep AppHeader's single-h1
   contract (don't add a second h1).
6. **De-dupe community heading** — verify `CommunityHome.tsx` / `CommunityCard.tsx` don't emit a duplicate
   top-level heading for the same community. If a duplicate `<h1>`/heading exists, demote one. (Confirm during
   implementation; may be a no-op if only an `<h2>` is present.)
7. **`aria-haspopup` on the menu button** — `AppHeader.tsx:88–96` has `aria-label`+`aria-expanded` but no
   `aria-haspopup`. Add `aria-haspopup="menu"` (or `"true"`) matching the popup's role.

**Acceptance 5:** each fix verified — like button name includes count; `.actionBtn` ≥4.5:1 light+dark; document
title localized and changes with locale; "across 1 country" reads correctly; discussion h1 conveys the stage;
no duplicate community heading; menu button exposes `aria-haspopup`.

---

## Item 6 — [MINOR] Momentum + affordance

1. **SolutionsBoard threshold bar reacts to an upvote** — `SolutionsBoard.tsx` `handleToggleApproval`
   (~127–142) awaits the write then `fetchData()`; the backing/threshold bar (~213–219) doesn't move until the
   refetch lands. Add an **optimistic** update to the backing count / `myApprovals` so the threshold bar
   animates immediately on tap, reconciling on refetch (revert on error). Respect reduced-motion (token-pure,
   per the existing S4 reduced-motion treatment).
2. **Whole problem/feed card tappable** — `InitiativeFeed.tsx:118` already renders the whole card as a
   `<button>`. **Verify** other feed/problem card surfaces (Home `HomeView`, `StageFeedView`, any
   problem-card) are whole-card tappable, not only an inner button. Fix any that aren't. (May be largely a
   no-op — confirm in preview.)

**Acceptance 6:** tapping upvote moves the threshold bar instantly (reduced-motion respected); all feed/problem
cards are tappable across their whole surface.

---

## Cross-cutting / verification
- **i18n:** every new/changed user-facing string goes through `t()`; new keys added to BOTH `src/i18n/fr.ts`
  and `src/i18n/sw.ts` (flat dotted, en inline). After i18n changes: run the sorted-key parity diff (fr vs sw
  must be empty) AND a code-ref↔i18n cross-check (no key referenced-but-missing / added-but-unused).
- **Build:** `npx tsc -b` + `npm run build` clean before each commit (prod build runs `tsc -b`).
- **Preview:** verify at 360px, light + dark; AA per DESIGN_SYSTEM.md; keyboard + SR basics on the discussion
  and ballot surfaces.
- **DEMO_VERSION** bumped to `global-v13` (Item 2).
- **No push** to `origin/ui` without Eston's confirmation.

## Out of scope (explicitly NOT this session)
- Blockchain copy (`about.closing`) — backend track.
- Pre-gate read-only "how this vote works" explainer + vote-visibility/pseudonym disclosure — **P2**.
- Empty mandate KPI `target`/`title` — **P4** (the data behind the S8 `<dd>` change); expect empty strings,
  don't fill them here.
- Nav/IA (stage strip follows initiative, Discussion as footer stage, focus-on-card-open) — **P1**.
