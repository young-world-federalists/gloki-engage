# S11 — Trust, Privacy & Consent depth (P2)

**Branch:** `ui` · **Date:** 2026-07-01 · **HEAD at spec:** `2b333a2`

Make the mechanism *auditable before you participate*, disclose honestly what's
visible/collected, and stop leaking identity. Stub-layer only (copy, disclosure
UI, one gated-teaser, a consent step). Builds on S9 (P0) honesty copy and S10
(P1) navigation. Everything reads/writes through `src/services/api.ts`; the demo
seam emits **no `contract_write` events** → re-fetch after writes.

## Locked product decisions (Eston, 2026-07-01)
1. **Vote visibility = attributable**, disclosed honestly ("visible to your
   community"), reconciled with "open to the whole community". No crypto-secrecy
   over-claim. True secret-ballot noted as a backend question for Ouri.
2. **Opt-in display name / pseudonym** — honest-minimal (see premise finding
   below): the current user already has a single free-text `agent.displayName`;
   add optional `IProfile.displayName`, a central `displayNameFor()` helper
   threaded through bylines, disclosure copy on the profile name field, and one
   seeded persona pseudonym so it's visible in the demo.
3. **Real, non-skippable consent** — replace RulesStep's "Skip for now" with a
   required consent screen that links placeholder privacy/data terms and lists
   what's collected (public key, profile, participation/votes, server); honest
   it's a pilot stub.
4. **Share by community+initiative ids** — MandateCard emits a clean
   `#/mandate/{communityId}/{mandateId}` URL (that route already exists and
   resolves without a pubkey) instead of `window.location.href`; the QR
   invitation blob is left untouched (it needs the key to function).

## Premise verification vs HEAD (S10 lesson)
- **Item 1 (teaser) — HOLDS.** `VoteEngage` wraps the *entire* `VoteStage` inside
  `StageGate`; when blocked, `StageGate` returns only a `Banner` and drops
  children → a newcomer sees nothing of the ballot/mechanism.
- **Item 2 (pseudonym) — PARTLY STALE.** Real users already have a single
  free-text name (`agent.displayName`); only demo personas use first/last name.
  Scope reduced to disclosure + optional `IProfile.displayName` + helper + one
  seeded pseudonym (details above).
- **Item 3 consent — HOLDS.** `RulesStep` (onboarding step 4, the consent step)
  has an `onSkip` → "Skip for now"; `ReadyStep` already knows `consented` and
  nudges. Only need to remove the skip and enrich the screen.
- **Item 3 pubkey-in-URL — NUANCED.** No `?publicKey=` anywhere. Exposure is the
  initiative route path (`/initiative/:host/:agent/...`) surfacing via
  `MandateCard` sharing `window.location.href`. Clean `/mandate/:communityId/:mandateId`
  route already exists. "Onboarding-guide share link" is **moot** — no such link
  exists (only `MandateCard` uses `navigator.share`).

---

## Item 1 — [BLOCKER] Pre-gate ballot teaser + "how this vote works" explainer

**Goal:** a genuinely read-only ballot preview + a QV/conviction explainer,
visible *before* the verification gate, so the mechanism is auditable without
participating. No write path may leak past the gate.

**Design.** `VoteEngage` gains the trust hook and branches; the explainer is
always visible, the interactive ballot stays gated, the read-only preview shows
only when blocked (so participants never see a duplicate):

```
const { canCurrentUserParticipate, isReady } = useCommunityTrust(communityId);
const canVote = !isReady || canCurrentUserParticipate('vote'); // mirror StageGate's loading grace
return (
  <div className={styles.engage}>
    <VoteExplainer />                                   {/* always visible: InfoDisclosure */}
    <StageGate communityId={communityId} stage="vote">
      <VoteStage initiativeId={initiativeId} communityMemberCount={communityMemberCount} />
    </StageGate>
    {!canVote && <VotePreview initiativeId={initiativeId} communityMemberCount={communityMemberCount} />}
  </div>
);
```

- **`VoteExplainer`** (new, `src/components/initiative/stages/VoteExplainer.tsx`):
  an `InfoDisclosure` trigger labelled "How this vote works". Modal prose explains
  the **QV cost curve** (everyone gets the same hearts; spreading them costs less
  than piling onto one — 1 heart = 1 credit, 2 = 4, 3 = 9) and the **conviction /
  time** dimension, plus one line reconciling 1p1v ↔ QV (extend S9 framing — keep
  both, explain the link; do NOT re-open it). Numbers inline in the prose.
- **`VotePreview`** (new, `src/components/initiative/stages/VotePreview.tsx`):
  read-only. Joins the same qv + approval contracts as `QVFlow` (shared-mode
  `useFlowContract`, join-by-id — reads only), builds the same reviewed-only
  ballot, and renders each solution's text / `UserIdentity` byline / commitments /
  metrics + the current results bar — **no steppers, no Cast button, never calls
  `api.allocate`**. Header line: "Preview — sign in and verify to take part."
  Reuse `QVFlow.module.scss` where practical or a small local module. Include the
  visibility disclosure line (shared key, below).
  - *Read-only guard:* the component imports only `getProposals`/`getConfig`/
    `getResults`/`getAllocations` read fns + `approvalApi.getProposals`; it must
    not import `allocate`. This is the "no write path leaks past the gate".

**A11y:** `VoteEngage` route already has its `<h1>` elsewhere in the card — the
preview/explainer must add **no second `<h1>`** (use `<h2>`/`<p>`); the
InfoDisclosure Modal is already focus-trapped + SR-announced.

**i18n keys (new, `mechanisms.qv.*` — fr+sw parity, en inline):**
`explainer.label`, `explainer.title`, `explainer.cost`, `explainer.conviction`,
`explainer.equalSay`, `preview.header`, `preview.note`.

---

## Item 2 — [MAJOR] Vote visibility disclosure + opt-in display name

**2a. Visibility line.** The shipped P0 line
(`mechanisms.qv.disclosure` = "Your hearts are visible to the community and
counted in the public tally.") already discloses attributable voting. Add ONE
reconciling clause so it sits honestly next to "open to the whole community":
extend the copy to name it a public, attributable vote (e.g. "…— your vote is
attributable, not secret."). Surface the same line in `VotePreview`. Do not add a
false secrecy claim. (Copy-only; no new key beyond reusing/lightly editing
`mechanisms.qv.disclosure` — keep the key, change fr/sw text to match.)

**2b. Display name / pseudonym.**
- `IProfile` (`src/services/interfaces.ts`): add `displayName?: string`.
- New helper `displayNameFor(profile, fallbackKey?)` in `src/utils/displayName.ts`:
  `profile?.displayName?.trim() || \`${firstName} ${lastName}\`.trim() ||
  (fallbackKey ? \`${fallbackKey.slice(0,8)}…\` : '')`.
- Thread the byline name-composition sites through it (replace inline
  `firstName + lastName`): `QVFlow.authorName`, `ThreadedDiscussion.displayName`,
  `Members`, `SolutionsBoard`, chat (`ChatTopic`/`ChatTopicList`), the activity
  cards that compose names, `deliberation.ts` comment-author name. `UserIdentity`
  itself stays a dumb `name` renderer (trust/verified unchanged).
- **Profile edit** (`src/components/identity/Profile.tsx`): keep the single name
  field but relabel it **"Display name"** with helper copy: this name is public
  and shown on your posts and votes; you may use a pseudonym. (New keys
  `profile.displayName.label`, `profile.displayName.hint`.)
- **Seed one pseudonym:** give one persona in `fixtures/identity.ts` a
  `displayName` (e.g. a privacy-minded persona → "Anon Fox" or similar), map it
  through `demoContracts/profile.ts` (`get_profile` returns `displayName`) and
  wherever profiles are registered into `state.communities.profiles` so the
  byline renders it. → **DEMO_VERSION `global-v13` → `global-v14`.**

**i18n:** `profile.displayName.label`, `profile.displayName.hint`; edited
`mechanisms.qv.disclosure` (2a) in fr+sw.

---

## Item 3 — [MAJOR] Real consent step + clean shareable URLs

**3a. Non-skippable consent.** `RulesStep` (`src/components/onboarding/steps/RulesStep.tsx`):
- Remove the `onSkip` prop + "Skip for now" button. Update `OnboardingFlow`
  step-4 to drop `onSkip={() => go(5)}`.
- Enrich the screen: keep the four promises, then add a **"What we collect"**
  list (public key, profile/display name, participation & votes, server address)
  and a line that this is a **pilot stub** — nothing leaves your browser — plus
  links to placeholder **Privacy** and **Data terms** (route to
  `/identity/about` or a placeholder anchor; honest that they're placeholders).
- The single primary action stays **"I agree"** → `onAgree` (writes
  `consentedAt`). `Back` stays. No skip. `ReadyStep`'s existing `consented`
  nudge path is unchanged (now consent is always set by the time you pass step 4).
- Confirm no other step's skip is affected — AgentStep (profile, step 3) keeps
  its skip; profile is legitimately optional.

**i18n (new `onboarding.rules.*` / `onboarding.consent.*`):** `collectTitle`,
`collect.key`, `collect.profile`, `collect.votes`, `collect.server`,
`pilotNote`, `privacyLink`, `dataLink`.

**3b. Clean share URL.** `MandateCard.share` (`src/components/mandate/MandateCard.tsx`):
- Build the canonical URL from ids instead of `window.location.href`:
  `${window.location.origin}${basename}#/mandate/{communityId}/{mandateId}`.
  `MandateCard` currently lacks these ids in props → add `communityId` +
  `mandateId` to `MandateCardProps` and pass them from `MandatePage` (which is
  already on `/mandate/:communityId/:mandateId` and has both from route params).
- Use the app's basename helper (same one `App.tsx` uses via `getBasename()`) so
  the hash link is correct on GitHub Pages. Verify `MandatePage` resolves purely
  from `communityId`+`mandateId` (it does — reads `:mandateId`).
- No pubkey in the shared string. QR invite untouched.

---

## Cross-cutting constraints
- Tokens only; reuse InfoDisclosure / StageGate / Banner / UserIdentity /
  Modal. 360px flagship; verify **light + dark**; AA; reduced-motion token-pure.
- **Single `<h1>` per route** preserved on every touched route
  (consent screen, mandate, vote card). Re-check a11y snapshot.
- New/changed strings at **fr + sw key parity** (flat dotted keys; en inline via
  `t('key','English')`; foundation keys in `en.ts`). Run sorted-key diff +
  code-ref↔i18n cross-check. Append new fr/sw strings to
  `docs/i18n-native-review-candidates.md`.
- **DEMO_VERSION → `global-v14`** (item 2b changes fixtures). Items 1, 2a, 3a,
  3b alone wouldn't need a bump, but 2b does.
- `npm run build` (`tsc -b`) clean before each commit. Verify via `preview_*`
  (`gloki-dev`, 5173) at 360px — automation finicky for gate/consent focus;
  lean on code-correctness + targeted snapshots.
- Contract method names unchanged (`addProposal`/`proposal_id`); "Solutions"
  vocab unchanged. Don't re-open 1p1v↔QV.

## Out of scope
Backend secret-ballot; liquid delegation (P6); content translation of fixtures
(P5); expert-review loop (P3); mandate rigor (P4).
