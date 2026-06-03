# Batch 4 — Web-of-trust verification & per-stage community permissions

**Branch:** `ui` · **Date:** 2026-06-03 · **Status:** approved model, pending spec review

Make Gloki's **web of trust** real in the UI (mocked through the seam) and let communities
**govern participation per stage**, so "who may take part, and on what basis" is legible
everywhere. Voting stays **one person, one vote** — verification gates *eligibility*, never weight.

---

## 1. The confirmed model (product call, owned by Eston)

Confirmed via the question tool on 2026-06-03 (mirrors the Batch-3 vocabulary decision).

### Trust state (evaluated **per community**)

A member's trust in community *C* is derived from how many **members of *C*** vouch for them:

| State | Rule | Badge (icon + label, never colour alone) | Tone |
|-------|------|------------------------------------------|------|
| **Verified** | vouched by **≥ 4** members of *C* | `ShieldCheck` · "Verified" | success |
| **Vouched** (pending) | vouched by **1–3** members of *C* | `Shield` · "Vouched by N" | info |
| **Unverified** | **0** vouches in *C* | `ShieldOff` · "Unverified" | neutral |

`VERIFIED_THRESHOLD = 4`. Onboarding seeds **2** vouches (`ONBOARDING_SEED = 2`), so a
freshly-onboarded user is **Vouched (pending)** — two connections short of Verified. This is
deliberate: it makes the V3 gate demonstrable and gives the vouch/QR flow a real purpose
(cross 2 → 4 to unlock the binding stages).

### Per-stage permission levels

A community sets one rule per pipeline stage, from three levels:

| Level | Who may participate | Read-only viewing |
|-------|---------------------|-------------------|
| **Anyone** | any visitor, incl. non-members | always allowed |
| **Members** | community members | always allowed |
| **Verified members** | members who are Verified in this community | always allowed |

**Read-only viewing of tallies/results is always allowed** regardless of the rule — the gate
only blocks *acting* (voting, proposing, staking).

### Default per-stage rules

| Stage | Default rule | Why |
|-------|-------------|-----|
| Problem (1) | Members | entry point — keep the funnel open to members |
| Discussion (2) | Members | |
| Proposals (3) | Members | |
| Vote (4) | **Verified members** | binding QV vote — anti-sybil where it counts |
| Mandate (5) | **Verified members** | binding conviction stake — anti-sybil where it counts |

### Invariant: one person, one vote

Permission gates **eligibility to act**, never the *weight* of a vote. A Verified member's vote
counts exactly the same as any other eligible member's. This is documented in a code comment in
`services/trust.ts` next to `canParticipate`. Permission rules are **orthogonal** to the existing
participation/approval thresholds (25 % / 50 % / 33 %) — those govern *how many must act to
advance*; permissions govern *who may act at all*. The two are presented distinctly in the UI.

---

## 2. Architecture — data / seam layer

Everything reads/writes through `src/services/api.ts` (`contractRead`/`contractWrite`), backed by
`src/services/demo/`. Components never read the vouch graph directly — they go through the trust
service helper / hook.

### 2.1 `src/services/trust.ts` (new) — the model's single home

Pure, documented module. No React.

```text
VERIFIED_THRESHOLD = 4
ONBOARDING_SEED   = 2
type TrustState = 'verified' | 'vouched' | 'unverified'
type StageRule  = 'anyone' | 'members' | 'verified'
type PipelineStage = 'problem' | 'discussion' | 'proposals' | 'vote' | 'mandate'

DEFAULT_STAGE_PERMISSIONS: Record<PipelineStage, StageRule>
  = { problem:'members', discussion:'members', proposals:'members',
      vote:'verified', mandate:'verified' }

resolveTrustState(vouchCount: number): TrustState        // pure
canParticipate(rule, trust, isMember): boolean           // pure; 1p1v note here
STAGE_RULE_OPTIONS / labels (i18n keys)                  // for the picker + copy

// seam reads/writes (thin wrappers over contractRead/contractWrite):
getCommunityVouches(serverUrl, publicKey, communityId): Promise<Record<pk, string[]>>
getStagePermissions(serverUrl, publicKey, communityId): Promise<Record<stage, StageRule>>
setStagePermissions(serverUrl, publicKey, communityId, perms): Promise<void>

// current-user vouches live in the Digital Agent store (localStorage, reactive),
// extending the existing onboarding pattern — wrapped here so components don't poke it:
addUserVouch(voucherPk: string): void                    // dedup append to agent.vouchedBy
```

**Source of truth split (documented):**
- **Persona vouch graph** → the community contract (seam), seeded from fixtures. Satisfies
  "mock the web of trust in the seam layer."
- **Current user's own vouches** → the Digital Agent store (`agent.vouchedBy`, localStorage),
  exactly as onboarding already seeds them. The helper *overlays* this on the seam graph.

**Per-community resolution & a documented simplification:** trust in *C* counts only vouchers who
are members of *C*. Because every demo persona is a member of every seeded community, the current
user's vouch count is the same across communities (consistent, not contradictory). Noted in a
comment; real per-community divergence is a backend concern.

### 2.2 `src/hooks/useCommunityTrust.ts` (new)

Hook over the helper, mirroring `useAllInitiatives`'s seam-only pattern. Fetches the community's
vouch graph via `getCommunityVouches`, reads the community member list from the store, subscribes
to the Digital Agent store (via `useDigitalAgent`) for the current user's overlay, and returns:

```text
{ trustOf(pk) => TrustState, vouchCountOf(pk) => number, isReady }
```

Reactive: adding a vouch (QR scan or demo "meet a member") re-renders every consumer.

### 2.3 `src/services/demo/fixtures/identity.ts` (edit)

- Add `VOUCHES: Record<pk, string[]>` — who vouches for each persona — hand-seeded so the Members
  list shows all three states: **most personas Verified** (≥ 4 voucher pks), **2–3 pending** (1–3),
  **1 unverified** (0). Deterministic (uses existing `pick`/index math, no `Math.random`).
- Add `getVouchersFor(pk): string[]` accessor.
- Change `defaultVouchers(inviterKey)` to seed **2** (inviter + 1 other), down from 3, so a new
  user lands at pending. `VouchStep` already renders the count dynamically — copy adapts for free.

### 2.4 `src/services/demo/demoContracts/community.ts` (edit)

Add to `CommunityState`: `vouches: Record<pk, string[]>` and `stage_permissions: Record<stage,
StageRule>`. Seed `vouches` from the fixture `VOUCHES` for each member at `init`/seed time.

New read handlers (in `communityRead`):
- `get_vouches` → `state.vouches` (the per-community graph; member → voucher pks).
- `get_stage_permissions` → `{ ...DEFAULT_STAGE_PERMISSIONS, ...state.stage_permissions }`
  (default-merged so un-configured communities return sane defaults).

New write handlers (in `communityWrite`):
- `set_stage_permissions` (values: `{ permissions }`) → merges into `state.stage_permissions`.
- `add_vouch` (values: `{ voucher, member }`) → appends `voucher` to `state.vouches[member]`
  (dedup). Used if/when we record QR vouches on-chain; the current-user path uses the agent store,
  so `add_vouch` is wired but optional this batch.

No `demoRouter.ts` change (it dispatches by contract file; these are new methods on an existing
handler).

### 2.5 `src/services/demo/mockApi.ts` (edit)

Bump `DEMO_VERSION = 'global-v2'` → `'global-v3'` so a reload wipes stale demo state and re-seeds
with the vouch graph + default permissions.

---

## 3. V1 — web-of-trust verification, made visible

### 3.1 `src/components/shared/TrustBadge.tsx` (+ `.module.scss`) (new)

Thin wrapper over the shared `Badge`. Props: `{ state: TrustState, vouchCount?: number, size?: 'sm'
| 'md', className? }`. Renders a lucide icon **and** a translated label (`ShieldCheck`/`Shield`/
`ShieldOff`), maps state → `Badge` tone (success/info/neutral), sets an `aria-label`
("Verified member" / "Vouched by N members" / "Unverified"). Tokens only; AA contrast in light +
dark; the `Badge` already carries focus/hover semantics where interactive (the badge itself is
non-interactive). Exported from `src/components/shared/index.ts`.

### 3.2 Surfaces (consume `useCommunityTrust` / `TrustBadge`)

- **Members** (`Members.tsx`) — `TrustBadge` in the member name row (`nameRow`), per member.
- **Author chips** — `TrustBadge size="sm"` beside the author:
  - `StageFeedView.tsx` (resolve via `item.author` + `item.communityId`),
  - `HomeView` (same),
  - `CommunityHome.tsx` (single community context).
- **IdentityTrust** (`IdentityTrust.tsx`) — a "Your verification" panel showing the current user's
  own `TrustBadge` + progress ("Vouched by 2 · meet 2 more members to verify"), and the demo
  "meet a member" action (see V3 vouch loop).

Cross-community author chips: the feed already iterates per community, so trust resolves per card
by that card's `communityId`. A lightweight per-community memo (or a small
`useAllCommunityTrust` aggregate mirroring `useAllInitiatives`) avoids calling a hook in a loop —
final shape chosen during planning; behaviour is identical.

---

## 4. V2 — per-stage community permission settings (admin)

### 4.1 `src/components/community/CommunitySettings.tsx` (+ `.module.scss`) (new)

- Page header: "Community settings" + a one-line explainer ("Choose who can take part at each
  stage. Read-only viewing is always open.").
- Five stage rows (Problem → Mandate), each with a label + short helper and a **`SegmentedControl`**
  (`Anyone · Members · Verified`), `fullWidth`, 44 px targets. On a 360 px screen the three short
  segments fit; verified in the preview.
- A note reinforcing **one person, one vote** (permissions ≠ vote weight) and that these are
  separate from participation thresholds.
- Reads current rules via `getStagePermissions`; on change, persists via `setStagePermissions`
  (optimistic, with the established snapshot-rollback pattern). Inline "Saved" affordance.
- **Admin gating:** the settings page is admin-facing. In the UI-only demo the current user owns the
  seeded communities, so we treat the current user as admin (documented). A `Banner` notes it's an
  admin surface. Real role-gating is a backend concern.

### 4.2 `src/pages/CommunityView.tsx` (edit)

- Add a `{ key: 'settings', icon: Settings, label: t('community.menu.settings', 'Settings') }`
  item to `menuItems` (grouped near Identity & Trust).
- Add `<Route path="settings" element={<CommunitySettings communityId={communityId!} />} />`
  (lazy, matching the other community routes).

---

## 5. V3 — enforce the gate with friendly, non-dead-end states

### 5.1 `src/components/community/StageGate.tsx` (+ `.module.scss`) (new)

Reusable wrapper rendered around the inline stage flow at both call sites.

Props: `{ stage, communityId, children, onVerifyPath? }`. Internally resolves the community's rule
(`getStagePermissions` via a small hook or passed-in map), the current user's trust
(`useCommunityTrust`), and membership (store). Then:

- `canParticipate(rule, trust, isMember)` **true** → render `children` (the flow) unchanged.
- **false** → render a friendly blocked state instead of the flow:
  - a `Banner tone="warning"` (or `EmptyState` for larger zero-action contexts) stating the
    *actual* rule and *why* ("This community asks Verified members to cast binding votes."),
  - the user's current standing ("You're vouched by 2 — one or two more vouches and you're
    verified."),
  - a `Button` **action** into the fix path: **Verified-gated** → IdentityTrust ("Get verified");
    **Members-gated & not a member** → join / `/welcome`.
  - Read-only content above the flow (card title, description, and any tally/results the stage
    shows by default) stays visible — never a silent dead end, never a blank card.

### 5.2 Enforcement sites

- `StageFeedView.tsx` — wrap each card's inline flow (`ProblemStage`/`DiscussionStage`/
  `ProposalsStage`/`VoteStage`/`MandateStage`) in `StageGate` keyed by that card's
  `communityId` + the feed's `stage`.
- `InitiativeDashboard.tsx` — wrap the ACTIVE-stage participation UI (lines ~340–378) in
  `StageGate` keyed by the initiative's `communityId` (already a prop, line 47) + active `stage`.

Both sites render the *same* lane-owned stage components, so the gate logic lives only in
`StageGate`; the lane-owned components are untouched.

### 5.3 Fix the stale copy

The hardcoded `vote`-stage banner "…Requires membership in a web of trust community"
(`StageFeedView.tsx:167`) is reworded to describe the *actual* per-stage rule (and, being a
cross-community feed header, to point at the per-card gate as the source of truth). Other stage
threshold banners are left as participation-threshold info (distinct concern).

### 5.4 Close the loop — crossing 2 → 4 (Eston: "wire QR scan to add a vouch")

One `addVouch` helper, two entry points:
- **QR scan** (`QRScannerDialog.tsx`): on a successful scan of a real community member
  (`isValid && isMember`), call `trust.addUserVouch(scannedAgent)` and confirm ("Vouch added —
  you're now vouched by N").
- **Demo "meet a member"** (`IdentityTrust.tsx`): because the camera scanner isn't exercisable in
  the preview, a testable button adds a vouch from a not-yet-voucher member of this community via
  the same helper. This is what verification screenshots/tests drive.

Both update `agent.vouchedBy` → `useCommunityTrust` recomputes → when the count reaches 4, the
TrustBadge flips to **Verified** and the Vote/Mandate `StageGate`s unlock live. Documented as a
demo affordance.

---

## 6. Files touched

**New (≈ 8):**
- `src/services/trust.ts`
- `src/hooks/useCommunityTrust.ts`
- `src/components/shared/TrustBadge.tsx` + `.module.scss`
- `src/components/community/CommunitySettings.tsx` + `.module.scss`
- `src/components/community/StageGate.tsx` + `.module.scss`

**Edited (≈ 10):**
- `src/services/demo/fixtures/identity.ts` (vouch graph, seed 2)
- `src/services/demo/demoContracts/community.ts` (vouches + stage_permissions handlers)
- `src/services/demo/mockApi.ts` (`DEMO_VERSION` → `global-v3`)
- `src/components/shared/index.ts` (export `TrustBadge`)
- `src/components/community/Members.tsx` (author/member badge)
- `src/pages/StageFeedView.tsx` (author badge, `StageGate`, copy fix)
- `src/pages/HomeView.tsx` (author badge — thread `author` pk + `communityId` through the card map; sample cards have no real author → no badge, honouring "never mix real + sample")
- `src/components/community/CommunityHome.tsx` (author badge)
- `src/components/community/IdentityTrust.tsx` ("Your verification" + meet-a-member)
- `src/components/community/dialogs/QRScannerDialog.tsx` (scan → addUserVouch)
- `src/components/collaboration/InitiativeDashboard.tsx` (`StageGate`)
- `src/pages/CommunityView.tsx` (Settings item + route)
- i18n: new keys in `src/i18n/` (English defaults inline via `t('ns.key', 'Default')`)

---

## 7. Verification plan

- `npx tsc -b` clean **and** `npm run build` clean (production build runs `tsc -b`).
- Preview (`preview_start`, port 5173). Walk: Members list (mixed badges), an author chip, Community
  Settings (change a rule, reload, persists), a Verified-gated stage as a pending user (blocked
  state + path), the meet-a-member loop crossing to Verified (gate unlocks), read-only tally still
  visible when blocked.
- Each in **light + dark + 360 px**, no console/ErrorBoundary errors. Screenshots before/after for
  every changed surface.

## 8. Commits (local only — Eston controls the push)

1. **Step 0** — `docs(spec)` this design doc + the model comment in `services/trust.ts` scaffold.
2. **V1** — trust seam + helper + hook + `TrustBadge` + visible on Members/author chips/IdentityTrust.
3. **V2** — `CommunitySettings` + menu/route + community-contract permission handlers.
4. **V3** — `StageGate` + enforcement in feed + dashboard + copy fix + QR/meet-a-member vouch loop.

(Step 0's model constants may land with V1 if cleaner; the spec doc is its own commit either way.)
**Do not push.**

## 9. Scope, simplifications & risks

- **In scope:** Step 0 + V1–V3 exactly. V3 covers **StageFeedView + Initiative Dashboard**
  (Eston's call). QR-scan vouch loop **wired** (Eston's call).
- **Out of scope (later batches):** stage-UX redesigns (discussion-as-co-authoring, mandate card),
  welcome-guide content, diverse-persona a11y reviews.
- **Documented simplifications:** current-user vouches live in the agent store (global, counts the
  same across communities); admin = current user in the demo; `add_vouch` seam write is wired but
  the user path uses the agent store as the single source.
- **Risk:** the cross-community feed resolves trust per card across N communities — keep the
  resolution memoised to avoid per-card refetch (mirror `useAllInitiatives`). `DEMO_VERSION` bump
  forces a one-time reseed for existing localStorage — expected.
