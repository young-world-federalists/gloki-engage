# S37 — Prompt 2 Wave 2: the simulated verification call (design addendum)

Addendum to `2026-09-02-s34-review-causes-impact-verification-design.md` §3.1–§3.3 (Wave 2) and
`2026-09-06-s36-verification-w1-design.md`. Scope: **Wave 2 only** — screen 5, states A–D. Wave 3
(daily session) and Wave 4 (notification centre + bell) stay separate per F9.

Date: 2026-09-07 · Branch `ui` · Premises re-grounded at `cacbc86`.

---

## 1. Premise re-ground (2026-09-07)

Every premise in the S37 prompt was checked against HEAD. All hold, with one drift:

| Premise | Result |
|---|---|
| `origin/ui..ui` = 0, tip `54ec183` | ✅ 0 unpushed — but the tip is **`cacbc86`** (`docs(s36): record the push`, also pushed). The prompt was written one commit before HEAD. |
| `origin/server-side` has no S35 contract patch | ✅ grep = 0; tip `a81218f` — Ouri has still not applied it |
| `DEMO_VERSION = 'global-v19'` | ✅ `mockApi.ts:18` |
| 11 files in `src/components/identity/verification/` | ✅ exact |
| 4 verification routes + `verificationTitles` in `IdentityView` | ✅ lines 62–65; map at line 35 |
| 6 seam functions + type re-exports in `verification.ts` | ✅ |
| `addUserVouch(voucherPk, meta?)` | ✅ `trust.ts:59` — **and it already dedupes per voucher** (`current.includes(voucherPk)` → return). E5 depends on this. |
| `verification.demoNote` exists in fr | ✅ `fr.ts:1389` |
| i18n parity `fr=1312 sw=1312` | ✅ PARITY OK |
| `NotificationsBell` still `merge_absorbed`-only | ✅ Wave 4's job |
| Toast + MemberCard = 4 files; no `VerifyButton` / `VideoTile` / `CountdownTimer` | ✅ |
| `trust.meetMember` retired | ✅ no hits in fr/sw |

**Member-list duplication confirmed.** `RequestPage` and `InvitePage` each render the same
`loading → empty → <ul><MemberCard …/></ul>` block with only the action slot differing. The verifier
picker is the third copy, so the S36 §8 parked extraction happens in this wave's first task.

---

## 2. Rulings made today (Eston, 2026-09-07)

Continuing the Prompt 2 E-series (E1–E3 were S36).

**E4 — "Schedule for later" does not ship in Wave 2.** §3.3 specified an `AvailabilityGrid` of
7 days × 12 hours (84 toggles) + a timezone `SearchableSelect` + "Find matching times" → suggestions.
**Ruling:** Wave 2 ships **"Available now" only**. Two reasons. First, honesty: nothing in a
simulation can honour a future slot — a "we'll notify you Thursday 14:00" that never fires is exactly
the claims problem the S36 review raised as I1, and an honest version needs Wave 4's notification
centre to exist first. Second, north star 1: 84 toggles is a large tap surface and a large i18n
surface on a cheap Android at 360px. Scheduling is logged to MASTER_TODO §7 as a Wave 4 follow-up,
not dropped. Consequence: `VerifierPicker` has no `SegmentedControl` between two modes — it is one
list.

**E5 — Each in-call verification is one vouch, up to four.** §3.3's live "2 of 4 verified" reads as
*verifiers who have verified, out of verifiers in the call* — not out of the threshold. **Ruling:**
every verifier who taps `VerifyButton` produces one `addUserVouch(verifierKey, { method: 'call', at })`,
so a full four-verifier call takes a user 0 → verified in one flow. That is the pathway's reason to
exist and the only thing that justifies its bandwidth cost against F10. No cap beyond the existing
one-vouch-per-pair rule, which `addUserVouch` already enforces by dedupe; the picker additionally
**excludes members who have already vouched for the user**, so a wasted invite is impossible rather
than merely harmless. A call that reaches only 2 verifications still banks 2 — no stranding (the E2
principle).

**E6 — Wave 2 ships both roles.** **Ruling:** the role derives from trust state at the call route.
A user below `VERIFIED_THRESHOLD` is the **candidate** and runs `select → waiting → inCall → summary`.
A **verified** user joins as **verifier**, entering at `inCall` against a waiting fixture candidate and
tapping `VerifyButton` themselves. This gives `VerifyButton` a real surface in the wave that adds it
(§3.2's rule), and finally gives the `member-view` demo scenario a destination. One `InCallView` with a
`role` prop, not two screens.

**E7 — Both lines on the call surfaces, F10's untouched.** F10 ruled the line "Uses your camera and
mobile data. No camera? Ask a member to vouch for you instead." onto every call entry point. But the
demo never opens a camera, so that line alone is literally false here, while S36 §8's rule requires an
honesty line on any surface where a fixture person appears to judge the user — which a call verifier
is exactly. **Ruling:** keep F10's line **verbatim** at the entry points (pathway card, call page) as
the warning about what the real feature costs, with the text-vouch path linked as F10 requires; and add
a distinct demo line on the call page and in-call view: *"Demo: no real call is made and your camera
stays off — these members join and verify automatically."* Two lines, both true, no contradiction, F10
not relitigated.

---

## 3. The simulation layer

### 3.1 `src/services/demo/verificationSim.ts` (new)

In-memory only — **no localStorage, no contract, no fixture edit**, therefore **no `DEMO_VERSION`
bump** (the change is UI + a demo module, not fixture/seed data; the S14/S15 precedent). A call
session dies with the tab, which is honest: nothing about a simulated call deserves to survive a
reload.

```ts
export type CallState = 'waiting' | 'active' | 'complete';
export interface CallParticipant {
  publicKey: string; name: string; country: string;
  joined: boolean; verified: boolean;
}
export interface CallSession {
  id: string;
  candidate: CallParticipant;      // the person being verified
  verifiers: CallParticipant[];    // invited; `joined` fills in over time
  state: CallState;
  startedAt: number;
  timedOut: boolean;               // the 5-min timeout, simulated at 20 s
}
```

Functions (all timers live here — see §3.3):

| Function | Behaviour |
|---|---|
| `availableNow(excludeKeys)` | 8–10 members sampled from the fixture's `online` members, minus `excludeKeys` (E5: those who already vouched). Sampling is random — this is presentation, not outcome. |
| `inviteToCall(candidateKey, verifierKeys)` | Creates a `CallSession` in `state: 'waiting'`, nobody joined. |
| `joinStream(sessionId, onUpdate)` | Subscribe. Drives simulated joins and the timeout; returns an unsubscribe. |
| `startCall(sessionId)` | `waiting → active`. Allowed at ≥ 1 joined. |
| `verifyInCall(sessionId, verifierKey)` | Marks that verifier `verified`; when the caller is the candidate's session this is what banks the vouch (§3.4). |
| `leaveCall(sessionId)` | Ends the session; `complete`. |
| `pendingCandidate()` | The fixture member a **verifier** (E6) is shown waiting. Derived deterministically from `allVerificationMembers()` — **no fixture file change**. |

`selectVerifiers()` from §3.1 belongs to the daily session and lands in Wave 3, not here.

### 3.2 Determinism (the E2 principle, extended to joins)

Randomness may decide *presentation* (which 8–10 online members the picker offers, jitter on join
delays); it may never decide *outcome*.

- **Who joins:** every invited verifier joins **except** members carrying `declines: true` in
  `fixtures/verification.ts` — the same flag that means "never responds" on the request page, reused
  rather than duplicated. Deterministic per member, so a demo walk is reproducible.
- **When:** staggered by index (roughly 1.5 s apart, small jitter), so "{N} of {total} joined" visibly
  climbs.
- **In-call verification (candidate view):** joined verifiers verify on a staggered sim schedule, so
  the candidate watches "0 of N → N of N verified" without touching anything. The verifier-role user
  taps for themselves (E6).
- **Never stranded:** with any non-declining verifier invited, the call always completes.

### 3.3 Timers

House rule from the prompt: **no timers in components beyond the countdown hook.** Every
`setTimeout`/`setInterval` for joins, the 20 s timeout and staggered verification lives inside
`verificationSim.ts`; components subscribe via `joinStream` in an effect and unsubscribe on unmount.
The single exception is `useCountdown`, the kit hook that renders the 5 s completion countdown.

### 3.4 Where the vouch is banked

A verification in the call calls the existing `addUserVouch(verifierKey, { method: 'call', at })` on
the Digital Agent store — the same writer the request page uses, with a different `method`. No new
persistence, no new store, and `useCommunityTrust` needs no change (D8/E1 already made the count
`agent.vouchedBy.length`). `addUserVouch`'s dedupe makes a repeat vouch a no-op.

---

## 4. Seam surface (`src/services/verification.ts`)

Components import **only** the seam; `verificationSim` is never imported by a component. The seam
grows by the call functions, each delegating to the sim exactly as the W1 functions delegate to
`verificationDemo`:

```ts
inviteToCall(ctx, verifierKeys: string[]): Promise<CallSession>
availableVerifiers(ctx, excludeKeys: string[]): Promise<CallParticipant[]>
joinCallStream(sessionId, onUpdate: (s: CallSession) => void): () => void
startCall(ctx, sessionId): Promise<CallSession>
verifyInCall(ctx, sessionId, verifierKey): Promise<CallSession>
leaveCall(ctx, sessionId): Promise<void>
pendingCandidate(ctx): Promise<CallParticipant | null>
joinAsVerifier(ctx): Promise<CallSession>   // E6 verifier role — see the C1 amendment below
```

**C1 amendment (controller, 2026-09-07, preflight).** `inviteToCall` implies the caller is the
candidate. E6's verifier role inverts that — the user is the sole *verifier* and the candidate is a
fixture member — which no signature above could express, so the eighth function `joinAsVerifier(ctx)`
creates that session (candidate from `pendingCandidate()`, `ctx.publicKey` as the only verifier).
`pendingCandidate` stays, for showing who is waiting before joining.

Types live in `src/services/verificationModel.ts` (pure) and are re-exported from the seam, matching
the W1 arrangement.

### 4.1 FOR_OURI rows (S36 §8 rule I4 — every seam function gets a wire-name row)

The call needs **no new contract method**: `vouch(public_key, method)` already accepts
`method: 'call'` (S36 addendum). But I4 says every seam function is documented, so
`docs/FOR_OURI_seam.md` gains an S37 addendum recording that the eight functions above are
**simulation-only, with no contract counterpart** — and that the one durable effect of a call is a
`vouch(public_key, 'call')` by each verifier, subject to the same "the vouch is always BY THE CALLER"
auth rule. Documenting the absence is the point: it stops a future session inventing a
`start_call` method.

---

## 5. Kit additions (this wave)

| Component | Contract |
|---|---|
| `VerifyButton` | 48px min height, success-token green. States `idle → loading → confirmed`; `confirmed` is terminal and disabled. Announces via `aria-live="polite"` (the label changes, so the button's own accessible name carries it). Reduced-motion: no transition on the state change. |
| `VideoTile` | Placeholder rect (no media element — nothing streams). `initialsOf()` (S22 util) centred, name + `CountryFlag` overlay, mic/cam status icons (`aria-hidden`, state carried in the tile's label). `size: 'lg' \| 'sm'` for the candidate tile vs the verifier grid. `verified` badge overlay when that verifier has verified. |
| `CountdownTimer` + `useCountdown` | `useCountdown(seconds, onDone)` returns remaining whole seconds; the component renders them with the S33 tabular-figures token. `prefers-reduced-motion`: no pulse, the number still counts. |
| `MemberList` (verification-local) | Not kit — `src/components/identity/verification/MemberList.tsx`. Props: `members`, `action: (m) => ReactNode`, `loading`, `empty: ReactNode`. Extracted from `RequestPage`/`InvitePage`, consumed by `VerifierPicker`. Kept local because all three consumers are verification pages; widening the shared kit for one family is not earned. |

`NotificationItem` remains Wave 4.

---

## 6. Screens

Route `/identity/verification/call`, nested in `IdentityView`'s wildcard (D9); `App.tsx` untouched.
`verificationTitles` gains `call`.

### 6.1 `CallFlow.tsx` — the state machine

`select → waiting → inCall → summary`, with the entry point chosen by role (E6):

| Role | Entry | Path |
|---|---|---|
| Candidate (`vouchCount < 4`) | `select` | picker → waiting room → call → summary |
| Verifier (`vouchCount >= 4`) | `inCall` | joins a waiting candidate → call → summary |

Both surfaces carry F10's line and the demo line (E7) before commitment.

### 6.2 `VerifierPicker.tsx` (state A)

"Available now": 8–10 online members via `availableVerifiers`, excluding anyone who already vouched
(E5). `MemberList` with a select/deselect action per row; a Refresh button re-samples; a sticky
footer action "Start call with {n}" enabled at ≥ 1 selected. F10's line + link to
`/identity/verification/request` sits above the list. No "Schedule for later" (E4).

### 6.3 `WaitingRoom.tsx` (state B)

"{N} of {total} joined" (live via `joinCallStream`), the invited list with per-row joined state,
`Start` enabled at ≥ 1 joined, `Cancel` → back to `select`. At the simulated 5-minute timeout (20 s
in demo) a Banner explains nobody else is coming and offers Start / Cancel — never a dead end.

### 6.4 `InCallView.tsx` (state C)

Candidate tile (`VideoTile size="lg"`) + verifier grid (`size="sm"`). Live "{v} of {n} verified".
Controls bar: mute, video, leave — all three are simulation toggles and say so via the demo line;
`leave` ends the call and goes to `summary`. Verifier role additionally renders `VerifyButton` under
the candidate tile. On reaching the last verification, a completion overlay with `CountdownTimer`
(5 s) → hub, and the vouches are already banked (§3.4).

### 6.5 `CallSummary.tsx` (state D)

What the call produced: the verifiers who verified, the new approval count ("{X} of 4 approvals"),
and the next step — verified → "Go to Home"; short → "Ask a member to vouch" linking the request
page. Reached by `leave`, by timeout-with-no-verifiers, and as the countdown's destination if the
user dismisses the overlay.

### 6.6 `PathwayCards.tsx` — the third card

Adds the call pathway. **Non-video pathways stay first** (F10): request, invitation, then call. The
card carries F10's line; E3's "only built pathways render" is satisfied because the call now exists.
The daily-session card remains Wave 3.

---

## 7. i18n

New family `verification.call.*` with inline English defaults, fr + sw at parity **in the same commit
as each task**, every key logged under "Session 37" in `docs/i18n-native-review-candidates.md`.
French `{count}` strings stay agreement-free (the S36 `hub.progress` lesson). Reused keys:
`common.cancel`, `common.loading`, `common.dismiss`, `verification.member.online` / `.offline`,
`gate.getVerified`.

---

## 8. Out of scope

"Schedule for later" / `AvailabilityGrid` (E4 → MASTER_TODO §7, Wave 4 follow-up); the daily session
and `selectVerifiers()` (Wave 3); the notification centre, the bell's new types and any call-related
notification producer (Wave 4); real WebRTC or any media capture, ever (the deferred list's
"biometric / hard identity verification" stays deferred — this is a simulation).

---

## 9. Verification floor (every task)

`npx --no-install tsc -b --noEmit` · `npm run build` · `grep -rn 'color: $gray-400' src --include='*.module.scss'`
(decorative only) · no ad-hoc style values · `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`
→ PARITY OK · controller preview walk at 360px, light + dark. Plus the house patterns: `try/finally`
around every seam write, `aria-hidden` on every decorative icon including `EmptyState` icons, ≥44px on
every tap on the journey, honesty line on every surface where a fixture person judges the user.

Closing gates: Opus whole-branch review, then Eston's explicit push gate (Rule 1).
