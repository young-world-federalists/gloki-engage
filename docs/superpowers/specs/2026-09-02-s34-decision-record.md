# S34 decision record (judge ruling, 2026-09-02)

## D1 — Fonts
**Ruling:** Keep the zero-byte system pairing (`$font-display`/`$font-body` unchanged); no webfont in S34.
**Why:** All three advocates converged on (a). Usability's byte argument is decisive against north star 1, and engineering is right that the swap recipe at `variables.scss:107–110` makes this reversible at zero migration cost. Governance's "a mandate should look uniform when screenshotted into a briefing" is real but is a funder-facing concern, not a participant-facing one, and loses to the cheap-Android bar.
**Dissent noted:** A ministry reviewer on Android sees a visibly different mandate document than the macOS pitch deck.

## D2 — Sample content on Home / stage feeds
**Ruling:** Restore as a **conditional client-side fallback inside `useAllInitiatives`** — when the real-contract aggregation yields zero initiatives, fall back to demo-community initiatives and render a **persistent, non-dismissible "Example activity" banner** above them (not a toast); do not revert any of Ouri's commits.
**Why:** Usability's "an empty first screen is the worst outcome for an unaided newcomer" carried, backed by the recorded homepage feedback. Engineering's containment (one hook, self-terminating as real content accumulates) and governance's labelling condition were both adopted; governance's original "withhold" framing was rejected in its own rebuttal.
**Dissent noted:** Any mixing of example and real activity risks an evaluator mistaking staged content for a live commitment.

## D3 — "Causes" rename scope
**Ruling:** i18n labels only — `/discussion` URL suffix, `stageKey: 'discussion'` and `discussionContractId` unchanged; no `/causes` alias in S34; copy must never imply a Cause is validated (it is a ranked, votable claim).
**Why:** Unanimous. Engineering's load-bearing-identifier point and governance's copy constraint are additive, not conflicting.
**Dissent noted:** External citation of a "Causes" page will point at a `/discussion` URL.

## D4 — Up/down voting scope
**Ruling:** Root comments only, **enforced in the contract**: `vote_comment(comment_id, direction)` returns without writing when `self.comments[comment_id]['parentId']` is set; replies keep `like_comment`; `rankCauses` and `computeDiscussionStatus` both read root comments only (pin this in each util's doc comment).
**Why:** Engineering moved to roots-only in rebuttal and gave the winning reason: an unenforced restriction is the `mergeSuggestions` write-only-field bug class (S33). Governance's "a viral joke reply must not dominate the consensus metric" and usability's "a vote control that provably does nothing is a lie to the eyes" both point the same way. The all-comments primitive bought flexibility nobody asked for.
**Dissent noted:** Contracts are immutable, so enabling reply votes later needs a new method — and roots-only may read sparse in reply-heavy discussions.

## D5 — Cause alignment on new solutions
**Ruling:** Hard requirement **with pre-select**: when ≥1 ranked cause exists the `SearchableSelect` is required and pre-populated with the #1-ranked cause (changeable, never empty, submit enabled from the start); when zero ranked causes exist the field is omitted, `cause_id=''` is written, and the solution renders a neutral chip "Proposed before any cause was ranked".
**Why:** All three converged on hard-with-preselect; the only residual split was governance's objection that a skipped field is indistinguishable from one never asked — resolved by the explicit sentinel chip rather than by forcing a pick from an empty list. Usability's original soft-warning position was withdrawn once the pre-select removed the dead-end form.
**Dissent noted:** A pre-selected default invites thoughtless acceptance, so some solutions will carry a cause label they do not really address.

## D6 — Status pill words, tones, floor, thresholds
**Ruling:** Five bands — **New** (neutral, gray dot) · **Contested** (warning, amber) · **Divided** (info, teal) · **Converging** (primary, blue) · **Consensus** (success, green); `STATUS_VOTE_FLOOR = 10`; `agreement = Σ|up−down| / Σ(up+down)` over the ≤10 most-voted root comments; bands `<0.25` contested, `<0.5` divided, `<0.75` converging, `≥0.75` consensus; no red anywhere.
**Why:** "New" over "Just opened" carried on usability's 360px translated-width argument, which is also the evidence engineering asked for. Governance's tone ordering (contested = warning, divided = info) is ratified as written in the brief. Constants stay exported from `discussionStatus.ts` — no `get_discussion_status` chain method.
**Dissent noted:** "New" loses the warmth and specificity of "Just opened" on a state most first-time visitors will see.

## D7 — Top-10 writer score and assessor eligibility
**Ruling:** `total = causeScore + solutionScore` (equal weight) with **three filters**: `causeScore > 0`; not author/co-author of the solution assessed; not author/co-author of **any** solution sharing that `causeId`; plus the existing caps (max 3 assessments per solution, one per author).
**Why:** Governance carried on self-dealing: a solution-author clique becoming assessors with zero cause engagement makes the feature theater, which damages north star 2. Engineering confirmed both filters are pure client filters over `rankWriters` with zero wire change, which defeats usability's "backlog it" objection — the cost was the only argument for deferral.
**Dissent noted:** Two stacked exclusions plus a floor may leave small communities unable to fill 3 assessors (mitigated by the ladder below).

## D8 — Verification scope
**Ruling:** Platform-wide on the Digital Agent (`agent.vouchedBy` + `useCommunityTrust`, `VERIFIED_THRESHOLD = 4` unchanged); per-community `IdentityTrust` keeps its page and links to the hub.
**Why:** Unanimous, and engineering's migration-cost warning makes it the one decision that must be right before Prompt 2 Wave 1. Governance's Sybil concern actually supports platform-wide (a low-scrutiny community must not mint voters for a high-stakes one).
**Dissent noted:** A mutually-vouching ring becomes globally verified once, with no community-level circuit breaker.

## D9 — Routes
**Ruling:** `/identity/verification`, `/identity/verification/{invite,request,approve,call,daily}` and `/identity/notifications`, all inside `IdentityView`'s wildcard; no new top-level route.
**Why:** Unanimous; zero `App.tsx` route-map change, and Identity is where "how others trust me" already lives. Promotable later if usage warrants.
**Dissent noted:** None surviving.

## D10 — Order
**Ruling:** Prompt 1 in full (W0 → W4) first, then Prompt 2.
**Why:** Unanimous. Prompt 1 edits the initiative contract Ouri is actively building, so schema alignment cost compounds daily; it also touches surfaces on every card, while Prompt 2 is an opt-in sub-flow.
**Dissent noted:** The permanently-empty `NotificationsBell` defect stays live until Prompt 2 Wave 4.

## D11 — Branch flow
**Ruling:** Confirm in writing with Ouri that we keep building on `ui` and he merges `ui` → `server-side` (which deploys); update `CLAUDE.md` plus the `gloki-change-control`, `gloki-session-lifecycle` and `gloki-build-env-run` skills **in W0, before any Prompt 1/2 code**.
**Why:** Unanimous, and engineering is right that Rule 1's premise is now factually false — leaving it stale is the exact "doc of record went stale" failure this project has hit 19 times.
**Dissent noted:** None.

## D12 — No on-chain eligibility enforcement (engineering-proposed)
**Ruling:** Accept, explicitly and on the record: assessor top-10/floor/self-dealing eligibility and cause-alignment are **UI-gated only**; the contract enforces only data invariants (roots-only votes, max 3 assessments, one per author). Log it in `FOR_OURI_seam.md` next to the `add_expert_review` precedent and put "server-side eligibility checks" on Ouri's contract roadmap now.
**Why:** Engineering's framing carried — silently inheriting the expert-review precedent is how an abuse vector becomes invisible; governance seconded logging it. Fine for a trusted pilot, not fine unstated.
**Dissent noted:** A motivated user can call `add_impact_assessment` directly today and bypass every eligibility rule.

## F1 — Storage shape for comment votes and impact assessments
**Ruling:** Flat composite-keyed top-level collections, mirroring `self.approvals`: `self.comment_votes = Storage('comment_votes')` keyed `caller + ':' + comment_id` with `{voter, commentId, direction}`, read via `get_comment_votes()`; `self.impact_assessments = Storage('impact_assessments')` keyed `proposal_id + ':' + caller`, read via `get_impact_assessments()`. **Do not** use `self.votes` (taken by the problem vote, `Storage('problem_vote')`), and grep the contract for an existing `comment_votes` before adding — if it collides, use `cause_votes` / `get_cause_votes()` and mirror the name everywhere. Client groups by `commentId` / `proposalId`; no extra round-trips.
**Why:** Engineering's evidence is from the contract's own comments: nested per-key dicts read back empty even when the write succeeds, which is why `approve` became flat and composite-keyed. The brief's `votes: {pk: dir}` field and `impactAssessments` list-on-doc are exactly the shape that failed. Governance had no objection.
**Dissent noted:** Two more top-level collections means two more full-collection reads per initiative load.

## F2 — Stale `causeId` when a cause leaves the top 5
**Ruling:** `causeId` is immutable once written; never re-bucket or hide. Solution cards, the ballot fold and the mandate show the cause text plus a neutral chip: "Cause now ranked #n" when it is still ranked, "Cause no longer ranked" when it has left the top 15.
**Why:** Governance raised it and is right that leaving it implicit produces a misleading "addresses cause #3" claim. Immutability keeps the audit trail reproducible; a visible demotion chip is honest without punishing the author.
**Dissent noted:** A demotion chip may read as a quality judgement on the solution rather than on the cause.

## F3 — Sparse-data degradation of the status formula
**Ruling:** Sample = the ≤10 root comments with the most total votes. Return `'open'` unless **both** `Σ(up+down) ≥ 10` across root comments **and** at least 3 root comments have ≥1 vote (`MIN_VOTED_COMMENTS = 3`); otherwise compute over whatever voted root comments exist.
**Why:** Governance asked for the degradation to be stated rather than discovered. The second condition stops one lopsided comment with 10 votes from declaring "Consensus" for a whole discussion — the failure mode most damaging to the word's external meaning (F4).
**Dissent noted:** Two floors make a genuinely converging small discussion sit on "New" longer than it deserves.

## F4 — What "Consensus" may claim externally
**Ruling:** Every surface that leaves the app (mandate document, PDF/export, share text, screenshot-targeted views) renders the scoped string "Consensus among {n} Gloki participants in {community}"; the in-app pill stays one word with the scoped string as its `title`/`aria-label`.
**Why:** Governance's point carried unopposed and is a legitimacy question, not a copy nit: an unscoped "Consensus" in a ministry briefing is a claim we cannot support.
**Dissent noted:** The scoped string is long and will dominate a narrow mandate header.

## F5 — Pill translation width at 360px
**Ruling:** Budget ≤12 characters in `en`; run the i18n parity/width check on all five strings × fr/sw before Wave 2 commits. Where a translation overflows the chin pill at 360px, degrade to **dot + accessible name only** — never ellipsis-truncate a status word.
**Why:** Usability raised it, engineering asked for the same evidence. A truncated status word is worse than no word; the dot plus `aria-label` keeps the information without lying.
**Dissent noted:** A dot-only pill is invisible to a sighted user who does not hover.

## F6 — First-use hint for downvoting
**Ruling:** Ship it: a one-line, once-per-user dismissible hint above the first cause list — "Vote up if this is a real driver of the problem, down if it isn't." — dismissal persisted via the existing `preferencesSlice` localStorage pattern, as an i18n key.
**Why:** Usability is right that a downvote is a new, mildly adversarial civic action and the 70%-unaided bar assumes no tutorial. One line, one flag, no wire change.
**Dissent noted:** Another dismissible hint adds chrome to a screen we have spent three sessions decluttering.

## F7 — Writer-rank tie-breaking
**Ruling:** Pin in `writerRank.ts`'s doc comment and implement exactly: `total` desc → `causeScore` desc → earliest first contribution timestamp asc → `publicKey` lexicographic asc.
**Why:** Engineering's reproducibility point carried: if an assessment is challenged, "who was top-10 last week" must be recomputable from stored contract data alone. All four keys are stored data; no recency weighting is introduced.
**Dissent noted:** Lexicographic public-key ordering is an arbitrary final tie-break with no civic meaning.

## F8 — The D7 relaxation ladder
**Ruling:** If fewer than 3 eligible non-assessors exist for a solution, relax in this order and show the current rung in the panel copy: (1) drop the `causeScore > 0` floor; (2) widen top-10 → top-25 writers; (3) open to any verified member. The two self-dealing exclusions are **never** relaxed.
**Why:** This is the mechanism that lets governance's floor coexist with usability's "3 assessors must stay fillable". Engineering proposed the ladder; making the rung visible answers governance's demand for a documented fallback instead of a silent empty state.
**Dissent noted:** Rung 3 means "assessor" can mean two quite different things across communities.

## F9 — May Prompt 2 Wave 1 run in parallel with Prompt 1?
**Ruling:** No. Prompt 2 Wave 1 starts only after Prompt 1 W4 is reviewed and pushed. The single permitted early item is Prompt 2's shared-kit additions (`Toast`, `ProgressBar segments`), which may land as part of Prompt 1's W0 if convenient.
**Why:** Engineering's "it needs no contract methods, so it could run alongside" is technically true but ignores this repo's recorded failure modes: concurrent writers share the git index (S22), and both prompts bump a single `DEMO_VERSION`. Sequential also keeps D10's rationale intact — Ouri gets one coherent contract delta, not two interleaved ones.
**Dissent noted:** Serialising leaves the empty notifications bell and the verification hub unbuilt for longer than bandwidth requires.

## F10 — Low-bandwidth framing of the simulated call
**Ruling:** Every entry point to a verification call or daily session carries, before commitment, the line "Uses your camera and mobile data. No camera? Ask a member to vouch for you instead." with the text-vouch path linked; on `PathwayCards`, non-video pathways (direct request, invitation) are ordered first.
**Why:** Usability's point carried: a bandwidth-shaped flow presented as the default reads as a broken promise on patchy data and directly threatens the 70%-unaided KPI. Costs one i18n key and a card order.
**Dissent noted:** De-emphasising the call weakens the felt co-presence (north star 2) that the video pathway exists to create.

## Summary table

| Dn | Ruling |
|---|---|
| D1 | Keep zero-byte system font pairing |
| D2 | Conditional demo fallback + persistent "Example activity" banner |
| D3 | Labels only; URL, stageKey, contract slot unchanged |
| D4 | Roots-only voting, enforced in the contract |
| D5 | Hard requirement with #1-cause pre-select; omitted when none |
| D6 | New/Contested/Divided/Converging/Consensus; floor 10; .25/.5/.75 |
| D7 | Sum + causeScore floor + same-solution and same-cause exclusions |
| D8 | Platform-wide verification on the Digital Agent |
| D9 | Nested under `/identity/*`; no new top-level route |
| D10 | Prompt 1 fully first, then Prompt 2 |
| D11 | Confirm branch flow with Ouri; update docs in W0 first |
| D12 | Accept UI-only eligibility gating; log it for Ouri's roadmap |
