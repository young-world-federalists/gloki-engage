# S37 — Prompt 2 Wave 2: the simulated verification call — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship screen 5 (states A–D) of the verification system — the simulated call — at
`/identity/verification/call`, plus the third pathway card, backed by an in-memory simulation behind
the existing seam.

**Architecture:** Components import only `src/services/verification.ts`; the seam delegates the call
functions to a new `src/services/demo/verificationSim.ts` (in-memory, dies with the tab — no
localStorage, no contract, **no fixture change, therefore no `DEMO_VERSION` bump**). Every timer
lives in the sim; components subscribe via `joinCallStream`. The one durable effect of a call is
`addUserVouch(verifierKey, { method: 'call', at })` on the Digital Agent store — the same writer the
request page uses. Route nests in `IdentityView`'s wildcard (D9); `App.tsx` untouched.

**Tech Stack:** React 19 + TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`,
`verbatimModuleSyntax`), Vite 7, SCSS Modules over `src/styles/variables.scss`, react-router-dom 7,
lucide-react, the hand-rolled i18n (`useT`, fr/sw overlays).

**Spec:** `docs/superpowers/specs/2026-09-07-s37-verification-w2-design.md` (this wave, rulings
E4–E7) over `2026-09-02-s34-…-design.md` §3.1–§3.3, `2026-09-06-s36-verification-w1-design.md`
(§3 data model, §4 kit contracts, §8 amendments) and the decision record (D8, D9, F9, **F10**).
Read the S37 spec before any task.

## Global Constraints

- **No test framework.** Every task's verification is: `npx --no-install tsc -b --noEmit` silent ·
  `npm run build` clean · `sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh` →
  `ALL GATES CLEAN` · (tasks that touch strings) `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`
  → `RESULT: PARITY OK`. **Implementers verify by build only and never touch the preview browser** —
  the controller drives the one shared preview after each task.
- **Slow external USB drive.** Small sequential reads, targeted `sed -n`/`grep -n` with explicit
  paths; never scan `node_modules/` or `dist/`. Quote the repo path:
  `cd "/Volumes/2TB Drive/💪Work & Volunteer/🔵 gloki/Gloki Build/Communities2"`. Ignore `._*` files.
- **Seam rule.** No component imports `src/services/demo/verificationSim.ts`, `verificationDemo.ts`
  or a fixture. All call data flows through `src/services/verification.ts`.
- **No timers in components** beyond `useCountdown` (Task 3). Joins, the 20 s timeout and staggered
  verification all live in the sim; components subscribe and unsubscribe.
- **`try/finally` around every seam write** (S36 house pattern), with a `busy` guard where a
  double-tap is reachable.
- **Token law.** No raw hex, raw `rgba(`, ad-hoc px/rem in `*.module.scss` — tokens only (44/48px
  touch floors and 1–2px hairlines are the sanctioned raw values). Dark mode only via
  `@include dark { … }`; any dark block that re-themes a background re-declares its text colour.
  `$gray-400` never as text colour. "If it's not interactive, it's not blue."
- **`aria-hidden` on every decorative icon**, including icons passed to `EmptyState`.
- **≥44px on every tap on the journey**; `VerifyButton` is 48px. `MemberCard`'s action slot already
  extends a `size="sm"` button to 44px via `::after` — reuse it, don't reinvent it.
- **Honesty line** on every surface where a fixture person appears to judge the user (S36 §8 rule).
- **i18n ritual.** Every string is `t('flat.key', 'English default')` inline; the key goes into BOTH
  `src/i18n/fr.ts` AND `src/i18n/sw.ts` in the **same commit** (append before the closing `};`),
  `{var}` tokens preserved verbatim. Do NOT add keys to `en.ts`. French `{count}` strings stay
  agreement-free.
- **One `<h1>` per page** — the `AppHeader` title; in-content headings are `<h2>`/`<h3>`. 360px must
  hold.
- **Commits:** `feat(s37): …`, `docs(s37): …`, `chore(s37): …`. Commit locally per task.
  **Never `git push`** (Rule 1 — Eston's explicit gate). Never touch `main`.
- **`DEMO_VERSION` is NOT bumped in this wave.** No task touches `mockApi.ts`. If a task finds itself
  wanting a fixture change, stop and ask the controller.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/components/identity/verification/MemberList.tsx` | extracted list (loading / empty / rows) | 1 |
| `src/components/identity/verification/RequestPage.tsx` | consume `MemberList` | 1 |
| `src/components/identity/verification/InvitePage.tsx` | consume `MemberList` | 1 |
| `src/components/shared/VerifyButton.tsx` + `.module.scss` | 48px idle→loading→confirmed | 2 |
| `src/components/shared/VideoTile.tsx` + `.module.scss` | placeholder tile + initials | 2 |
| `src/hooks/useCountdown.ts` | seconds remaining + `onDone` | 3 |
| `src/components/shared/CountdownTimer.tsx` + `.module.scss` | tabular-figure display | 3 |
| `src/components/shared/index.ts` | barrel exports | 2, 3 |
| `src/services/verificationModel.ts` | `CallSession`, `CallParticipant`, `CallState` | 4 |
| `src/services/demo/verificationSim.ts` | the whole simulation + timers | 4 |
| `src/services/verification.ts` | 7 call functions on the seam | 4 |
| `docs/FOR_OURI_seam.md` | S37 addendum (simulation-only rows, I4) | 4 |
| `src/pages/IdentityView.tsx` | `call` route + `verificationTitles.call` | 5 |
| `src/components/identity/verification/CallFlow.tsx` | state machine + role | 5–8 |
| `src/components/identity/verification/VerifierPicker.tsx` | state A | 5 |
| `src/components/identity/verification/WaitingRoom.tsx` | state B | 6 |
| `src/components/identity/verification/InCallView.tsx` | state C (both roles) | 7 |
| `src/components/identity/verification/CallSummary.tsx` | state D | 8 |
| `src/components/identity/verification/CallFlow.module.scss` | shared call styles | 5–8 |
| `src/components/identity/verification/PathwayCards.tsx` | third card + F10 line | 8 |
| `src/i18n/fr.ts`, `src/i18n/sw.ts` | parity, every task that adds keys | 1, 5–8 |

---

### Task 1: Extract `MemberList` (the S36 §8 parked duplication)

**Why now:** `RequestPage` and `InvitePage` render the identical `loading → empty → <ul><MemberCard>`
block; `VerifierPicker` (Task 5) is the third copy. S36's review parked this for "the wave that makes
a third copy" — this is that wave, and it comes first so Task 5 consumes it rather than adding to the
debt.

**Files:**
- Create: `src/components/identity/verification/MemberList.tsx`
- Modify: `src/components/identity/verification/RequestPage.tsx`, `InvitePage.tsx`

**Interfaces produced:**

```ts
export interface MemberListProps {
  members: MemberSummary[];
  /** Trailing slot per row — a <Button size="sm">, a <Badge>, or a checkbox control. */
  action: (member: MemberSummary) => React.ReactNode;
  loading?: boolean;
  /** Rendered when !loading and members is empty. Callers own the icon + copy. */
  empty: React.ReactNode;
  /** Extra props per row, e.g. selection styling in the picker. */
  rowClassName?: (member: MemberSummary) => string | undefined;
}
```

- [ ] **Step 1: Create `MemberList.tsx`.** Owns the `loading` branch (`common.loading`), the empty
  branch (renders the caller's `empty` node), and the `<ul className={pages.list}>` of `MemberCard`
  rows. It owns the `online`/`offline` labels (`verification.member.online` / `.offline`) so the
  three callers stop repeating them. `trustState="verified"` stays the default — every member in
  these lists is verified by definition.
- [ ] **Step 2: `RequestPage`** — replace the `loading ? … : members.length === 0 ? … : <ul>…</ul>`
  block with `<MemberList members={members} loading={loading} action={actionFor} empty={<EmptyState … />} />`.
  `actionFor` is already a `(member) => ReactNode` — pass it unchanged. Keep the search field, the
  intro and the `verification.demoNote` line exactly as they are.
- [ ] **Step 3: `InvitePage`** — same substitution in the unverified branch; lift its inline action
  ternary into a local `actionFor`. The verified branch (the invite form) is untouched.
- [ ] **Step 4:** Confirm no new i18n keys were needed (all three strings already exist). Delete now-unused
  imports (`EmptyState` stays — the callers still build the empty node; `MemberCard` should disappear
  from both pages).

**Verification:** `tsc -b --noEmit` silent · `npm run build` clean · grep gates clean ·
`grep -c "MemberCard" src/components/identity/verification/RequestPage.tsx` → 0 ·
parity script → PARITY OK (no key change, run it anyway).
**Commit:** `refactor(s37): extract MemberList from the request and invite pages`
**Subagent-safe:** yes — three files, no cross-cutting behaviour.

---

### Task 2: Kit — `VerifyButton` + `VideoTile`

**Files:**
- Create: `src/components/shared/VerifyButton.tsx` + `.module.scss`, `src/components/shared/VideoTile.tsx` + `.module.scss`
- Modify: `src/components/shared/index.ts` (export both with their prop types, alphabetical block placement)

- [ ] **Step 1: `VerifyButton`.**

```ts
export type VerifyButtonState = 'idle' | 'loading' | 'confirmed';
export interface VerifyButtonProps {
  state: VerifyButtonState;
  onVerify: () => void;
  /** Translated labels, one per state — the accessible name IS the announcement. */
  idleLabel: string;
  loadingLabel: string;
  confirmedLabel: string;
  className?: string;
}
```

  Renders a `<button type="button">`, `min-height: 48px`, `background: $success` (hover/active
  `$success-dark`), white label. `disabled` when `state !== 'idle'`. Wrap the label in a
  `<span aria-live="polite">` so the state change is announced without re-announcing the whole
  button; the check glyph in `confirmed` is `aria-hidden`. Reduced-motion: no transition.
  **Not blue** — this is the one sanctioned green action (the DS rule is "if it's not interactive
  it's not blue", not "all interactive is blue"; verification success is a `$success` semantic).

- [ ] **Step 2: `VideoTile`.**

```ts
export interface VideoTileProps {
  name: string;
  countryCode?: string;
  size?: 'lg' | 'sm';        // candidate tile vs verifier grid cell
  muted?: boolean;
  cameraOff?: boolean;
  verified?: boolean;        // green check overlay once this verifier has verified
  /** Translated status labels for the icons — never icon-only. */
  mutedLabel?: string;
  cameraOffLabel?: string;
  verifiedLabel?: string;
  className?: string;
}
```

  A `$radius-lg` rect with `$gray-100` (dark: `$dark-border`) ground, `initialsOf(name)` centred
  (import from `src/utils/initials`), a bottom overlay with `CountryFlag` + name, and
  `MicOff`/`VideoOff` lucide icons when `muted`/`cameraOff` (icons `aria-hidden`, the state carried
  in a visually-hidden span using the passed labels). **No `<video>` element** — nothing streams;
  the tile is a placeholder by design. `aspect-ratio` keeps the grid honest at 360px.

**Verification:** build + gates. Kit components carry no strings of their own (labels are props), so
no i18n change.
**Commit:** `feat(s37): kit — VerifyButton and VideoTile`
**Subagent-safe:** yes.

---

### Task 3: Kit — `useCountdown` + `CountdownTimer`

**Files:**
- Create: `src/hooks/useCountdown.ts`, `src/components/shared/CountdownTimer.tsx` + `.module.scss`
- Modify: `src/components/shared/index.ts`

- [ ] **Step 1: `useCountdown(seconds, onDone?)`** → `{ remaining, done }`. One `setInterval` at 1 s,
  cleared on unmount and on reaching 0; `onDone` fires exactly once (guard with a ref — a re-render
  must not re-fire it). Restarting requires a key change, not a prop change — document that.
  **This is the only sanctioned timer in component-land** (spec §3.3).
- [ ] **Step 2: `CountdownTimer`** — renders `remaining` via the hook with `@include tabular-nums`
  (the S33 mixin at `variables.scss:229`) so the digits don't jitter. Props:
  `seconds`, `onDone?`, `label` (translated, e.g. "Returning to verification in {n}s" — the caller
  formats), `className`. Wrap in `role="timer"` with `aria-live="off"` — a per-second live region
  would flood a screen reader; the surrounding overlay announces once instead.
  `prefers-reduced-motion`: no pulse animation (the number still counts).

**Verification:** build + gates.
**Commit:** `feat(s37): kit — useCountdown and CountdownTimer`
**Subagent-safe:** yes.

---

### Task 4: The simulation + the seam + FOR_OURI (one commit)

**Files:**
- Modify: `src/services/verificationModel.ts` (types), `src/services/verification.ts` (7 functions),
  `docs/FOR_OURI_seam.md` (S37 addendum)
- Create: `src/services/demo/verificationSim.ts`

- [ ] **Step 1: Types** into `verificationModel.ts` (pure, no imports beyond `trustModel`):
  `CallState`, `CallParticipant`, `CallSession` exactly as spec §3.1 defines them. Re-export from
  the seam alongside the W1 types.

- [ ] **Step 2: `verificationSim.ts`.** Header comment states: in-memory, dies with the tab, no
  localStorage, no contract, replaced by nothing on Ouri's side (see the FOR_OURI S37 addendum).
  Module state: `const sessions = new Map<string, CallSession>()` plus a subscriber map and a timer
  handle set so `leaveCall` can clear everything it started.

  - `availableNow(excludeKeys)` — `allVerificationMembers().filter(m => m.online && !excludeKeys.includes(m.publicKey))`,
    shuffled, sliced to 8–10. Presentation randomness only.
  - `inviteToCall(candidateKey, verifierKeys)` — builds the session, `state: 'waiting'`,
    all `joined: false, verified: false`. The candidate participant resolves from
    `findVerificationMember(candidateKey)`, falling back to a generic "You" participant when the
    current user is not a fixture member (the normal case — the demo user isn't in the 30).
  - `joinStream(sessionId, onUpdate)` — schedules the joins: **every invited verifier joins except
    `memberDeclines(pk)`** (spec §3.2 — reuse the flag, don't add one), staggered ~1.5 s apart by
    index with small jitter. Also schedules the 20 s timeout → `timedOut: true` + an update. Returns
    an unsubscribe that clears every timer it created. Emits an update after each change.
  - `startCall(sessionId)` — `waiting → active`; then schedules the **candidate-side** staggered
    verifications (joined verifiers verify ~2 s apart) so the candidate watches the count climb.
    Does nothing extra when the caller is a verifier (Task 7 passes `autoVerify: false`).
  - `verifyInCall(sessionId, verifierKey)` — marks that verifier `verified: true`; **if the session's
    candidate is the current user, bank the vouch**: `addUserVouch(verifierKey, { method: 'call', at: Date.now() })`
    (E5; `addUserVouch` dedupes, so a repeat is a no-op). When every joined verifier has verified,
    set `state: 'complete'`.
  - `leaveCall(sessionId)` — clears timers, `state: 'complete'`, drops the session.
  - `pendingCandidate()` — a deterministic fixture member for the verifier role (E6). Pick by a
    fixed index from `allVerificationMembers()`, excluding anyone in the user's vouchers. **No
    fixture file edit.**
  - `joinAsVerifier(candidateKey, verifierKey)` — the C1 amendment. Builds a session whose candidate
    is `pendingCandidate()` and whose sole verifier is the current user, `state: 'active'`, that
    verifier already `joined`. **No auto-verify schedule** — this user taps for themselves (E6).

- [ ] **Step 3: The seam.** Add the 8 functions from spec §4 (including `joinAsVerifier`, the C1 amendment) to `src/services/verification.ts`, each
  a one-line delegation with a doc comment, in the same style as the W1 six. `joinCallStream` is the
  one non-Promise export (it returns an unsubscribe) — comment why.

- [ ] **Step 4: FOR_OURI S37 addendum.** Append a section to `docs/FOR_OURI_seam.md` after the S36
  addendum. Content: the call is a **UI simulation with no contract counterpart**; a wire-name row
  for each of the 8 seam functions saying "simulation only — no contract method"; and the one durable
  effect, `vouch(public_key, 'call')` by each verifier, already accepted by the S36-documented
  method, subject to the same "the vouch is always BY THE CALLER" rule. State explicitly that no
  `start_call` / `join_call` method should be invented — this row exists so a future session doesn't
  add one. (S36 §8 rule I4: every seam function gets a row.)

**Verification:** build + gates ·
`grep -rn "verificationSim" src/components/ | wc -l` → **0** (seam rule) ·
`grep -c "DEMO_VERSION" src/services/demo/mockApi.ts` unchanged and the file untouched in `git diff --stat`.
**Commit:** `feat(s37): call simulation behind the verification seam + FOR_OURI S37 addendum`
**Subagent-safe:** yes — no component touches this task.

---

### Task 5: Route + `CallFlow` skeleton + `VerifierPicker` (state A)

**Files:**
- Create: `src/components/identity/verification/CallFlow.tsx`, `VerifierPicker.tsx`, `CallFlow.module.scss`
- Modify: `src/pages/IdentityView.tsx`, `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: Route.** In `IdentityView.tsx` add `<Route path="verification/call" element={<CallFlow />} />`
  after the `invite` route, and `call: { title: t('verification.call.title', 'Verification call'), eyebrow: verificationEyebrow }`
  to `verificationTitles`. Nothing else changes — `showBack`/`onBack` already handle any leaf (D9;
  `App.tsx` untouched).

- [ ] **Step 2: `CallFlow.tsx` — the machine.** `useState<'select' | 'waiting' | 'inCall' | 'summary'>`.
  **Role from trust (E6):** `const { trust } = useVerification()`; `role = trust === 'verified' ? 'verifier' : 'candidate'`.
  Candidates start at `select`; verifiers start at `inCall` (Task 7 fills that in — until then a
  verifier sees a placeholder that Task 7 replaces). Holds the `CallSession` and the selected keys in
  state; passes them down. This task renders only the `select` branch.

- [ ] **Step 3: `VerifierPicker.tsx` (state A).** Above the list, in this order:
  1. F10's line **verbatim**, with the text-vouch path linked:
     `verification.call.bandwidth` = "Uses your camera and mobile data. No camera? Ask a member to vouch for you instead."
     — the trailing sentence is a `<Link to="/identity/verification/request">`. Split the key as
     `verification.call.bandwidth` + `verification.call.bandwidthLink` so the link text is
     translatable without embedding markup in a string.
  2. The demo honesty line (E7): `verification.call.demoNote` = "Demo: no real call is made and your
     camera stays off — these members join and verify automatically."

  Then "Available now": `availableVerifiers(ctx, excludeKeys)` where `excludeKeys` = the keys in
  `state.approvals` (E5 — never offer someone who already vouched). Render through **`MemberList`**
  (Task 1) with a select/deselect action per row: a `size="sm"` secondary/primary `Button` toggling
  selection (the `MemberCard` action slot's `::after` gives it 44px). A `Refresh` button re-samples.
  A footer action `Start call with {count}` (`verification.call.startWith`, agreement-free French),
  disabled at 0 selected, calls `inviteToCall` in a `try/finally` with a `busy` guard and advances
  the machine to `waiting`.
  Empty state (no one online after exclusions): `EmptyState` with an `aria-hidden` icon, copy
  "No one is available right now." + a link to the request page — never a dead end.

- [ ] **Step 4: i18n.** New keys under `verification.call.*` into fr AND sw in this commit. Keys:
  `title`, `bandwidth`, `bandwidthLink`, `demoNote`, `availableNow`, `refresh`, `startWith`,
  `selected`, `deselect`, `pickerEmpty`, `pickerEmptyCta`.

**Verification:** build + gates + parity · controller preview walk at 360px light + dark:
`/identity/verification/call` renders the picker, F10 line + link present, honesty line present,
selection toggles, Start disabled at 0.
**Commit:** `feat(s37): verification call route, flow machine and verifier picker (state A)`
**Subagent-safe:** yes.

---

### Task 6: `WaitingRoom` (state B)

**Files:**
- Create: `src/components/identity/verification/WaitingRoom.tsx`
- Modify: `CallFlow.tsx` (wire the `waiting` branch), `CallFlow.module.scss`, `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1:** Subscribe with `joinCallStream(session.id, setSession)` inside a `useEffect`,
  **returning the unsubscribe** — the sim owns the timers, the component owns nothing.
- [ ] **Step 2:** Render "{joined} of {total} joined" (`verification.call.joinedCount`,
  agreement-free French) and the invited list via `MemberList` with a per-row joined/waiting `Badge`
  as the action. `Start` (primary) enabled at ≥ 1 joined → `startCall` in `try/finally`, machine →
  `inCall`. `Cancel` (ghost) → `leaveCall`, machine → `select`.
- [ ] **Step 3: The timeout.** When `session.timedOut`, render a `Banner` (tone `info`, not `error`
  — nothing failed) saying nobody else is joining, keeping **both** Start (if ≥1 joined) and Cancel
  live. If nobody joined at all, the banner offers Cancel and a link to the request page. Never a
  dead end (north star 1).
- [ ] **Step 4: i18n** — `joinedCount`, `waitingTitle`, `joined`, `waiting`, `start`, `timeoutTitle`,
  `timeoutBody`, `timeoutEmpty` into fr + sw.

**Verification:** build + gates + parity · controller walk: joins climb, Start enables at the first
join, the 20 s timeout banner appears and is not a dead end, Cancel returns to the picker.
**Commit:** `feat(s37): waiting room with simulated joins and timeout (state B)`
**Subagent-safe:** yes.

---

### Task 7: `InCallView` (state C) — both roles

**Files:**
- Create: `src/components/identity/verification/InCallView.tsx`
- Modify: `CallFlow.tsx` (the `inCall` branch + the verifier entry), `CallFlow.module.scss`, `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: Layout.** Candidate tile `<VideoTile size="lg">` at the top; verifier grid of
  `size="sm"` tiles below (CSS grid, 2 columns at 360px). Live count
  "{verified} of {total} verified" (`verification.call.verifiedCount`). Controls bar: mute, video,
  leave — mute/video are local UI toggles that flip the tiles' icons and **say so** via the honesty
  line; `leave` → `leaveCall` in `try/finally` → machine `summary`.
- [ ] **Step 2: Role split (E6).**
  - **Candidate:** subscribes to `joinCallStream`; the sim's staggered verifications drive the count.
    No `VerifyButton` (you cannot verify yourself).
  - **Verifier:** `CallFlow` calls `joinAsVerifier(ctx)` (the C1 amendment — `inviteToCall` assumes
    the caller is the candidate, so it cannot express this role), optionally showing
    `pendingCandidate(ctx)` first. Renders `VerifyButton` under the candidate tile: tap →
    `state='loading'` → `verifyInCall` in `try/finally` → `state='confirmed'`. The vouch is **not**
    banked for the verifier's own agent (they are giving, not receiving) — the sim's
    `verifyInCall` already guards this by checking whose session it is.
- [ ] **Step 3: Completion.** When `session.state === 'complete'`, an overlay announces the outcome
  once (`role="status"`) and mounts `<CountdownTimer seconds={5} onDone={…}>` → navigate to
  `/identity/verification`. A `Dismiss` button skips to `summary` immediately so the countdown is
  never a trap.
- [ ] **Step 4: The honesty line** renders inside the call too (E7 — this is the surface where
  fixture people appear to judge the user), placed under the controls where it can't be missed.
- [ ] **Step 5: i18n** — `verifiedCount`, `mute`, `unmute`, `camera`, `cameraOff`, `leave`,
  `verifyIdle`, `verifyLoading`, `verifyConfirmed`, `completeTitle`, `completeBody`, `returningIn`,
  `dismiss` (reuse `common.dismiss` if it fits), plus the `VideoTile` status labels.

**Verification:** build + gates + parity · controller walk **both roles** (the `member-view` demo
scenario gives the verifier path): candidate watches the count climb to complete; verifier taps
VerifyButton through idle → loading → confirmed; overlay + countdown lands on the hub; the hub's
approval count has grown by the number of verifications (E5).
**Commit:** `feat(s37): in-call view for candidate and verifier roles (state C)`
**Subagent-safe:** yes, but it is the largest task — if it grows past ~250 lines of component, split
the verifier branch into a follow-up step rather than rushing it.

---

### Task 8: `CallSummary` (state D) + the third pathway card

**Files:**
- Create: `src/components/identity/verification/CallSummary.tsx`
- Modify: `CallFlow.tsx` (the `summary` branch), `PathwayCards.tsx`, `CallFlow.module.scss`,
  `PathwayCards.module.scss` (only if the third card needs it), `src/i18n/fr.ts`, `src/i18n/sw.ts`

- [ ] **Step 1: `CallSummary`.** What the call produced: the verifiers who verified (a `MemberList`
  with a "Vouched" `Badge` action), the new count "{X} of 4 approvals" reusing the hub's existing
  progress key family, and the next step — verified → "Go to Home"; short → "Ask a member to vouch"
  linking `/identity/verification/request`. Reached from `leave`, from a timeout with no verifiers,
  and from the completion overlay's Dismiss.
- [ ] **Step 2: The third pathway card.** Add the call pathway to `PathwayCards.tsx` **after** request
  and invitation (F10: non-video pathways first). Icon `Video` (lucide, `aria-hidden`), title/body/CTA
  under `verification.pathway.call.*`, `to: '/identity/verification/call'`. The card body carries
  **F10's line verbatim** — reuse `verification.call.bandwidth` + `bandwidthLink` from Task 5 rather
  than a second copy of the sentence. E3's "only built pathways render" is now satisfied for the call;
  the daily-session card stays out (Wave 3).
- [ ] **Step 3:** Check the 2×2 → 1-column grid still holds at 360px with three cards.
- [ ] **Step 4: i18n** — `summaryTitle`, `summaryVerifiers`, `summaryNone`, `summaryNext`,
  `pathway.call.title`, `pathway.call.body`, `pathway.call.cta` into fr + sw.

**Verification:** build + gates + parity · controller walk: summary after leave and after completion;
three pathway cards in F10 order at 360px light + dark; the call card's F10 line links to the request
page.
**Commit:** `feat(s37): call summary and the call pathway card (state D)`
**Subagent-safe:** yes.

---

### Task 9 (controller only): full walk, review, closeout

- [ ] **Step 1: Full preview walk** at 360px, light + dark, in **en / fr / sw** — the whole candidate
  journey (hub → pathway card → picker → waiting → call → complete → hub, count grown) and the
  verifier journey via the `member-view` scenario. Check French/Swahili don't overflow the count
  strings or the controls bar.
- [ ] **Step 2: Keyboard + reduced-motion pass.** Tab order through the picker and the controls bar;
  focus visible on every control; `VerifyButton` reachable and its state announced;
  `prefers-reduced-motion` kills the transitions but not the countdown.
- [ ] **Step 3: Opus whole-branch review** of the session diff. Rank findings blocker/major/minor
  against the two north stars. Apply a fix wave, then a scoped re-review of the fixes.
- [ ] **Step 4: Closeout** — MASTER_TODO §7 (mark W2 shipped; **add the E4 scheduling follow-up**
  tied to Wave 4) + §8 changelog entry with the commit range; `docs/i18n-native-review-candidates.md`
  "Session 37" section listing every new fr/sw string; project memory; and
  `docs/session-prompts/session-38-verification-w3.md` with its own
  "Re-verify these premises vs HEAD" section.
- [ ] **Step 5: Push gate.** Present the review verdict and a one-paragraph summary of what would
  ship, then **wait for Eston's explicit go**. Never push unprompted (Rule 1).

---

## Self-review (done while writing)

- **Does any task touch `mockApi.ts`?** No. The wave is UI + a demo module; no fixture or seed data
  changes, so `DEMO_VERSION` stays `global-v19` (the S14/S15 precedent for shipping without a bump).
- **Does any component import the sim?** No — Task 4's verification greps for exactly that.
- **Are there timers in components?** Only `useCountdown` (Task 3), which the spec sanctions.
- **Is F10 satisfied?** The line appears on both entry points (pathway card, picker) with the
  text-vouch path linked, and non-video pathways stay first in `PathwayCards`.
- **Is the S36 §8 honesty rule satisfied?** The demo line is on the picker and inside the call — the
  two surfaces where fixture people appear to judge the user.
- **Is I4 satisfied?** Task 4 Step 4 adds a wire-name row for all eight new seam functions, including
  the deliberate "no contract method — do not invent one" note.
- **Can a demo visitor be stranded?** No: decliners never join but every other invitee does; Start
  works at ≥1; the timeout keeps both actions live; a partial call still banks its vouches (E5).
- **Anything relitigated?** No. F10 and D8/D9 are applied as ruled; E7 adds a second line rather than
  editing F10's.
