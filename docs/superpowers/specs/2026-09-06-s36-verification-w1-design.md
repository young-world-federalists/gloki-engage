# S36 — Prompt 2 Wave 1: Community verification hub, request, approve, invite (design addendum)

**Parent spec:** `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3
(Prompt 2 — Community verification system). This addendum does not restate §3; it records what
Wave 1 needed *settled* that §3 left open, plus the three product rulings Eston made at kickoff.
**Rulings of record:** `docs/superpowers/specs/2026-09-02-s34-decision-record.md` — D8 (platform-wide
on the Digital Agent), D9 (routes inside `IdentityView`'s wildcard), D10/F9 (Prompt 1 first — satisfied:
S35 pushed `03d6f5d`), F10 (low-bandwidth framing — applies from Wave 2, when the first video pathway
card ships).

**HEAD at kickoff:** `bb855a3` on `ui`, `ui == origin/ui`, `DEMO_VERSION 'global-v18'`, tsc + grep gates clean.

## 1. Premise re-ground (2026-09-06)

Every claim in `docs/session-prompts/session-36-verification-w1.md` held against HEAD except:

| Prompt said | HEAD | Consequence |
|---|---|---|
| "`ui` is 38 commits ahead — confirm the S35 push question first" | `git log origin/ui..ui` = 0 | No push question; S35 shipped. Prompt's open decision #1 closed. |
| `DiscussionStatusPill` in 5 files | 6 (`DiscussionStageView.tsx` too) | Cosmetic. |
| "Demo state" entry goes "next to Reset demo" in the global menu | "Reset demo" is in the **per-community** menu (`CommunityView`), the global menu has no demo items | The entry lands in the global menu (`HomepageMenu`) as its own dev-only, divider-separated item — the spec's stated location; only the "next to" is moot. |

Prior-art check (S14 lesson): `git log -i --grep='verif\|vouch\|toast' ui` and `find src -iname '*verif*'`
found no orphaned verification or toast kit. Greenfield within the laws below.

## 2. Rulings made today (Eston, 2026-09-06)

**E1 — The 30-member fixture vs community membership.** `useCommunityTrust` counted the current user's
vouches only from *this community's* members (`memberSet.has(v)`), which is per-community semantics
inside a ruling (D8) that made verification platform-wide. Invisible today because the 16 personas are
members of every demo community; visible the moment a non-member vouches. **Ruling:** the 30 = the 16
existing `PERSONAS` + **14 verification-only members** who are *not* community members (no member-count,
turnout or 50%-threshold inflation — the S12 expert-scoping lesson), and the current user's own count in
`useCommunityTrust` becomes `agent.vouchedBy.length` — every vouch the agent holds, from anyone — so D8
holds literally. Persona counts stay per-community (the community contract's `get_vouches`). This is the
one deliberate deviation from §3.1's "`useCommunityTrust` needs no change": a one-line change, commented
with this ruling.

**E2 — Simulated request outcome is deterministic per member, not random.** §3.1 said "resolves 2–5 s
later, random approve/decline". Randomness can strand a demo visitor short of four — north star 1.
**Ruling:** each fixture member carries a `declines` flag; the four flagged members never respond (the UI
says "No response"), every other member approves after the 2–5 s delay. The delay stays random; the
outcome does not. The 16 personas all approve, so the community-gate journey (2 → 4 → Vote unlocks) is
always completable.

**E3 — PathwayCards ships two cards in Wave 1.** Only the built pathways render (direct request first,
invitation second — F10's ordering already satisfied). The call and daily-session cards, with F10's
camera+data line, land with Waves 2 and 3. No "coming soon" stubs on a branch Ouri may merge at any time.

Not raised (internal, decided here, reversible): W4's notification fixtures are **not** seeded in Wave 1
— they would be dead exports for three sessions. §3.1's "6–8 notifications" moves to Wave 4.

## 3. Data model as built

### 3.1 Persisted vouches (Digital Agent store)

`agent.vouchedBy: string[]` is unchanged (every consumer keeps working). Wave 1 adds a parallel map:

```ts
// src/services/trustModel.ts (pure)
export type VouchMethod = 'direct' | 'call' | 'invitation' | 'daily';
export interface VouchMeta { method: VouchMethod; at: number }
// src/components/identity/agent/digitalAgentStore.ts
vouchMeta?: Record<string /* voucher publicKey */, VouchMeta>;
```

`addUserVouch(voucherPk, meta?)` writes both; callers that pass no meta (QR scan) default to
`{ method: 'direct', at: Date.now() }`. Vouchers with no meta entry (agents created before S36, the
onboarding's two seeded vouchers) resolve at read time to `method: invitation` for `agent.invitedBy`,
`direct` otherwise, `at: agent.createdAt`.

### 3.2 The seam (`src/services/verification.ts`) — the only import components use

Types live in `src/services/verificationModel.ts` (pure, so fixtures and the demo layer can import them
without a cycle) and are re-exported from the seam.

```ts
export interface VerificationCtx { serverUrl: string; publicKey: string }   // platform-wide: no communityId (D8)
export interface Approval { id: string; approver: string; method: VouchMethod; at: number }
export type VouchRequestStatus = 'pending' | 'approved' | 'declined';
export interface VouchRequest { id: string; requester: string; approver: string; at: number; status: VouchRequestStatus }
export interface VerificationState {
  approvals: Approval[];          // vouches the user HOLDS (from agent.vouchedBy + vouchMeta)
  pending: VouchRequest[];        // incoming requests waiting on the user — [] until the user is verified
  sent: VouchRequest[];           // requests the user has made, any status
  invitationRequests: string[];   // member keys the user asked for an invitation
}
export interface MemberSummary { publicKey: string; name: string; country: string; online: boolean }
export interface InvitationDraft { name: string; email: string; vouch: boolean }

getVerificationState(ctx): Promise<VerificationState>
listVerifiedMembers(ctx, query?: string): Promise<MemberSummary[]>       // 30 members; query filters by name
requestVouch(ctx, approverKey): Promise<VouchRequest>                    // writes pending at once; resolves 2–5 s later settled (E2)
respondToRequest(ctx, requestId, approve: boolean): Promise<void>
sendInvitation(ctx, draft: InvitationDraft): Promise<void>
requestInvitation(ctx, memberKey): Promise<void>
```

Behind the seam: `src/services/demo/verificationDemo.ts` (localStorage key **`gloki_demo_verification`**
— the `gloki_demo` prefix means a `DEMO_VERSION` bump wipes it with everything else) + fixtures in
`src/services/demo/fixtures/verification.ts`. Delays live in the demo file. **Pending incoming requests
are hidden until the user is verified** (requests only reach verified members), so a partly-vouched user
who becomes verified via the request page then finds the seeded requests waiting — the journey continues.

**Seam invariant:** the seam file delegates every call to the demo module; Ouri replaces the import with
`contractRead`/`contractWrite` against the Digital Agent contract. Components never import
`verificationDemo` or the fixture — one sanctioned exception, the dev-only demo-state dialog, which is a
`*.demo.tsx` sidecar (the `ProblemStage.demo.ts` precedent).

### 3.3 FOR OURI — Digital Agent contract methods (documented in the same commit as the seam)

| Seam call | Contract method | Notes |
|---|---|---|
| `getVerificationState` | `get_vouches()` | returns approvals held + incoming pending + sent |
| `requestVouch(approver)` | `request_vouch(public_key)` | creates a pending request addressed to `public_key` |
| `respondToRequest(id, true)` | `vouch(public_key, method)` | `method ∈ direct \| call \| invitation \| daily`; the caller vouches for `public_key` |
| `respondToRequest(id, false)` | `decline_vouch(public_key)` | |
| `sendInvitation` / `requestInvitation` | no contract | off-platform (email) — the demo records them locally only |

Auth the real contract must enforce: a vouch is always *by the caller*; nobody can vouch on another
key's behalf. Neither `digital_agent_contract.py` nor `gloki_engage_community_contract.py` has these
methods today.

### 3.4 Fixtures

- **30 members** = 16 `PERSONAS` (names, countries, `displayName` override honoured) + 14 new
  `VERIFICATION_MEMBERS` (`demo-verif-<cc>-<name>`) across Africa, Asia, Europe, the Americas and
  Oceania. Online flags are deterministic fixture data. Four of the fourteen carry `declines: true` (E2).
- **Seeded incoming requests:** four members (two personas, two new) asked the user to vouch, 5–20 h ago.
- **Demo scenarios** (`applyDemoScenario`, dev-only): `unverified-0` (no vouchers), `partial-2`
  (inviter + one persona — the onboarding shape), `verified-4` (four personas, nothing waiting),
  `member-view` (four personas + the four seeded requests waiting + one declined sent request + one
  vouch already given). Applying a scenario rewrites the agent's `vouchedBy`/`vouchMeta`, resets
  `gloki_demo_verification`, and reloads.
- **`DEMO_VERSION` → `'global-v19'`** in the same commit as the fixture (fixture/seed class change).

## 4. Kit additions (this wave)

| Component | Contract |
|---|---|
| `ProgressBar` `segments?: number` | Renders `segments` equal cells (`$spacing-xs` gap, `$radius-full`); the first `round(value/max × segments)` cells fill in the variant colour. Same `role="progressbar"` + `aria-value*` as the continuous bar. Continuous rendering is untouched when `segments` is absent. |
| `MemberCard` | 44px-min row: online dot (`role="img"`, translated online/offline label — never colour alone) · `UserIdentity` (flag + name + verified shield) · optional `meta` caption · trailing `action` slot. Renders as `li` or `div`. |
| `Toast` (`ToastProvider` + `useToast()`) | One `role="status" aria-live="polite"` region mounted once in `App.tsx` beside `OfflineBanner` (the app's only other live region — `OfflineBanner` renders a `Banner`, which carries its own `role="status"`; the two never nest). `show({ message, tone?: 'info' \| 'success' \| 'error', durationMs? })`; 4 s auto-dismiss; stack of 3 (oldest dropped); each toast has a ≥44px dismiss button (`common.dismiss`); Escape inside the region dismisses all. Fixed above the `StageFooter` (`bottom: $footer-clearance`), `page-column` width, `z-index: 200` (above the sticky header's 100, below the modal layer's 1000). Reduced-motion: no transition. |
| Confetti | CSS-only, 12 token-coloured pieces on the hub's verified card, plays once on mount, `display: none` under `prefers-reduced-motion`. Not a kit component — it lives in the hub's module. |

`VerifyButton`, `VideoTile`, `NotificationItem`, `CountdownTimer` are Wave 2–4 (§3.2: "added in the
wave that first needs them").

## 5. Screens and routes

All inside `IdentityView`'s wildcard (D9); `App.tsx` untouched. Titles render in the `AppHeader` title
block (D3): hub → eyebrow "Verification", title "Get verified", `showBack` (history); sub-pages →
`showBack` to the hub.

| Route | Component | Content |
|---|---|---|
| `/identity/verification` | `VerificationHub` | Status card: "{X} of 4 approvals received" + `TrustBadge` + segmented bar + one-line honest explainer ("no ID papers, no face scans"); **verified**: "You're verified", confetti, "Go to Home". Below: "Ways to get approvals" → `PathwayCards` (hidden when verified); a "Requests to vouch" row with a "{n} waiting" badge; `ApprovalHistory`. |
| `/identity/verification/request` | `RequestPage` | Name search + `MemberCard` list of the 30. Per row: `Request` → optimistic **"Requested ✓"** (disabled) → toast on outcome ("{name} vouched for you" / "{name} didn't respond this time"); already-vouched rows show a "Vouched" badge; declined rows read "No response". |
| `/identity/verification/approve` | `ApprovePage` | Pending cards (requester identity, "asked you to vouch", time ago) with `Approve` (primary) → slide-out + check, `Decline` (ghost). Empty state: verified → "No requests right now."; unverified → "Members can ask you to vouch once you're verified." + "Get verified" CTA. |
| `/identity/verification/invite` | `InvitePage` | **Verified:** form — name, email, "I know this person and vouch for them" checkbox, `Send invitation` → toast "Invitation recorded for {name} — this demo sends no email." (claims-honesty). **Unverified:** "Verified members can invite you" + `MemberCard` list with `Request invitation` → "Requested ✓" + toast. |

Wiring: `StageGate`'s "Get verified" → `/identity/verification` (was the per-community identity page);
`IdentityTrust`'s "Meet a member (demo)" button becomes a "Get verified" link to the hub (the hub's
request flow is now the demo mechanism for crossing 2 → 4; the `trust.meetMember` key retires).
Global menu: dev-only "Demo: verification state" → `Modal` with the four scenarios.

## 6. i18n

New family `verification.*` (+ `demo.verification.*`), inline English defaults, fr + sw at parity in the
same commit, every key logged in `docs/i18n-native-review-candidates.md` under "Session 36". Reused
existing keys: `gate.getVerified`, `trust.your.barLabel`, `trust.verified`/`vouched`/`unverified`,
`common.dismiss`, `common.loading`, `common.cancel`. Retired: `trust.meetMember`.

## 7. Out of scope (Waves 2–4, F9)

Verification call (`CallFlow`, `VerifierPicker`, `WaitingRoom`, `InCallView`, `CallSummary`), the daily
session, the notification centre and the bell's new types, the call/daily pathway cards, F10's
camera+data line. The bell stays effectively empty until Wave 4 (D10 dissent, on the record).

## 8. Post-review amendments (whole-branch review, 2026-09-06)

The Opus whole-branch review (`.superpowers/sdd/…/final-review-report.md` at the time; findings summarised in
MASTER_TODO §8) found two places where this spec was silent and the build followed the silence:

- **Honesty line on surfaces that simulate a person's judgement of the user (I1).** §5 asked for no demo
  marker on the request/approve pages, and the branch had retired the only "(demo)" label on the vouch path.
  Amended: both pages render `verification.demoNote` ("Demo: these members reply automatically. No real
  person is contacted.") under their intro. **Rule for Wave 2+:** any surface where a fixture person appears
  to judge the user carries an honesty line.
- **Every seam function gets a wire-name row (I4).** §3.3 omitted `listVerifiedMembers`. Amended in
  `docs/FOR_OURI_seam.md`: no contract method exists yet (proposed `list_verified_members(query)`;
  fixture-backed until Ouri has a directory read), and `respondToRequest(requestId)` resolves the requester
  via `get_vouches().pending` before `vouch` / `decline_vouch`.
- **44px on the journey's core taps (I2).** `MemberCard`'s action slot extends a `size="sm"` button to a 44px
  hit area (`::after`, the `Toast` dismiss pattern); the pathway CTAs and the approve page's empty-state CTA
  are `size="md"`.
- **E1 consequence in existing copy (I5).** `trust.your.verified` / `trust.your.progress` no longer assert a
  per-community count.
- **fr plural.** `verification.hub.progress` is agreement-free in French.
- Also folded in: `busy` guard + `try/finally` on the approve page, `try/finally` + refetch on the invite page,
  an `approved` done-state key, an `invite.empty` key, `aria-hidden` on the toast glyph, an accurate sidecar
  header comment. Parked for Wave 2: focus management after approve, the focus ring under the confetti's
  `overflow: hidden`, the member-list render duplication (extract when the verifier picker makes a third copy).
