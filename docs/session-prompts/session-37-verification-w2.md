# Session 37 — Prompt 2 Wave 2: the verification call

**Context recap (as of 2026-09-06, `ui` @ `54ec183`, PUSHED to `origin/ui`).** S36 built Prompt 2
Wave 1 — the platform-wide verification hub, request, approve and invite pages under
`/identity/verification/*` (D8/D9), the seam `src/services/verification.ts` over a localStorage demo
module, the kit additions `Toast` / `ProgressBar segments` / `MemberCard`, `vouchMeta` on the Digital
Agent, the 30-member fixture (16 personas + 14 verification-only non-members, E1), deterministic request
outcomes (E2), two pathway cards (E3), `DEMO_VERSION` v19, and the FOR_OURI S36 addendum. 14 commits
`628b574..54ec183`: nine plan tasks (one fix round), an Opus whole-branch review (0 Critical / 5 Important /
16 Minor) and one fix wave, a scoped re-review, and a controller preview walk at 360px light+dark in
en/fr/sw. **Push state: PUSHED 2026-09-06.** Per D11 a `ui` push does not deploy — Ouri merges `ui` → `server-side`.

This session builds **Prompt 2 Wave 2 only** — the simulated verification call (spec §3.3 W2, screen 5
states A–D). Wave 3 (daily session) and Wave 4 (notification centre + bell) stay separate (F9).

## Read first

1. `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3.1 (the call
   simulation seam: `inviteToCall(keys) → CallSession`, `joinStream(session)`, `verifyInCall(session,
   verifierKey)`, `selectVerifiers()` — all in `src/services/demo/verificationSim.ts`, in-memory, no
   contract), §3.2 (kit: `VerifyButton` 48px green idle→loading→confirmed with `aria-live`; `VideoTile`
   placeholder with `initialsOf()`; `CountdownTimer` + `useCountdown` tabular figures, reduced-motion) and
   §3.3 **Wave 2**: `CallFlow.tsx` state machine `select → waiting → inCall → summary`, `VerifierPicker.tsx`
   ("Available now" 8–10 random online members + Refresh; "Schedule for later" = `AvailabilityGrid` 7×12 +
   timezone `SearchableSelect` + "Find matching times"), `WaitingRoom.tsx` ("{N} of {total} joined", Start
   at ≥1, Cancel, 5-min timeout simulated at 20 s), `InCallView.tsx` (candidate tile + verifier grid,
   `VerifyButton`, live "2 of 4 verified", mute/video/leave, completion overlay + 5 s countdown → hub),
   `CallSummary.tsx`. Route: `/identity/verification/call` inside `IdentityView` (D9).
2. `docs/superpowers/specs/2026-09-06-s36-verification-w1-design.md` — the W1 addendum, especially §3
   (data model as built: `vouchMeta`, `VerificationState`, the demo module's shape), §4 (kit contracts you
   compose), and **§8 post-review amendments** — two rules now bind Wave 2: *every seam function gets a
   wire-name row in FOR_OURI*, and *any surface where a fixture person judges the user carries an honesty
   line* (`verification.demoNote` is the precedent). A call verifier "verifying" the user is exactly such a
   surface.
3. `docs/superpowers/specs/2026-09-02-s34-decision-record.md` — **F10** now applies for the first time: the
   call's every entry point (the third pathway card, the call page) carries "Uses your camera and mobile data.
   No camera? Ask a member to vouch for you instead." with the text-vouch path linked, and on `PathwayCards`
   the non-video pathways stay first. Also D8/D9/F9.
4. `docs/FOR_OURI_seam.md` S36 addendum — `vouch(public_key, method)` already accepts `method: 'call'`; the
   call needs no new contract method (§3.1). Add nothing there unless the seam surface grows.
5. Skills: `gloki-change-control`, `gloki-session-lifecycle`, `gloki-seam-and-demo-data`,
   `gloki-i18n-playbook`, `gloki-governance-domain` §8–§9 (claims honesty), `gloki-verification-and-qa`
   (preview lore — see the S36 additions below).

## Re-verify these premises vs HEAD (S10–S36 lesson — prompts go stale between sessions)

- `git log --oneline origin/ui..ui | wc -l` → expect **0** (S36 pushed 2026-09-06). Anything above 0 is work
  committed after this prompt was written — read it before trusting the premises below.
- `git log --oneline origin/server-side | head -3` and
  `git show origin/server-side:src/assets/contracts/gloki_engage_initiative_contract.py | grep -c "comment_votes\|impact_assessments"`
  → was **0** at S36 close (the S35 patch not yet applied by Ouri).
- `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` → expect `'global-v19'`. Wave 2 seeds nothing
  new unless you add call fixtures (online verifier pool can come from `fixtures/verification.ts`'s `online`
  flags) — bump only if fixtures change.
- `ls src/components/identity/verification/` → `VerificationHub.tsx PathwayCards.tsx ApprovalHistory.tsx
  RequestPage.tsx ApprovePage.tsx InvitePage.tsx VerificationDemoState.demo.tsx VerificationPages.module.scss
  VerificationHub.module.scss PathwayCards.module.scss ApprovePage.module.scss`.
- `grep -n "case\|path=\"verification" src/pages/IdentityView.tsx` → four routes (`verification`,
  `verification/request`, `verification/approve`, `verification/invite`) and a `verificationTitles` map —
  add `call` to both.
- `grep -n "export" src/services/verification.ts` → six functions + type re-exports; `listVerifiedMembers`
  is fixture-backed (FOR_OURI notes the missing read).
- `grep -n "addUserVouch" src/services/trust.ts` → `addUserVouch(voucherPk, meta?: VouchMeta)`; the call's
  successful verify calls it with `{ method: 'call', at }`.
- `grep -n "'verification.demoNote'" src/i18n/fr.ts` → exists (honesty line precedent).
- `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` → `fr=1312 sw=1312`, PARITY OK.
- `sed -n '1,20p' src/components/shared/NotificationsBell.tsx` → still `merge_absorbed`-only (Wave 4).
- `ls src/components/shared/ | grep -c "Toast\|MemberCard"` → 4 files (Toast.tsx/.module.scss,
  MemberCard.tsx/.module.scss). `VerifyButton`, `VideoTile`, `CountdownTimer` do NOT exist yet.
- `grep -n "'trust.meetMember'" src/i18n/fr.ts src/i18n/sw.ts` → no hits (retired in S36).

## Workflow + constraints (same discipline as S1–S36)

- Docs-first: spec addendum for W2 (the W1 addendum is the template) + plan committed as `docs(s37)` before
  any `feat(s37)`. Recommend-then-confirm with Eston on anything §3.3 W2 leaves open — candidates: the
  "Schedule for later" grid's scope (full 7×12 availability + timezone select is a lot of UI for a
  simulation; ship "Available now" first?), how many verifiers a call needs to count (spec: live "2 of 4
  verified"; a completed call adds up to 4 vouches with `method: 'call'`?), and whether a call can be
  started by an already-verified user (to act as verifier — the "member-view" scenario).
- Build via `superpowers:subagent-driven-development`: subagents sequential; the controller drives the one
  preview. Every task ends with `npx --no-install tsc -b --noEmit`, `npm run build`, the grep gates, the
  parity script, and a controller walk at 360px light + dark.
- Seam rule: `verificationSim.ts` lives in `src/services/demo/`; components import only
  `src/services/verification.ts` (extend its surface with the sim functions). No timers in components
  beyond the countdown hook.
- Route-map freeze: `call` nests in `IdentityView` (D9).
- `try/finally` around every seam write (S36 house pattern); `aria-hidden` on every decorative icon
  including `EmptyState` icons; honesty line on the call surfaces; 44px on every tap on the journey
  (`MemberCard`'s action slot already extends `size="sm"` buttons — reuse it for the verifier picker).
- i18n ritual + packet section "Session 37"; French `{count}` strings agreement-free.
- Opus whole-branch review before proposing a push; **never push without Eston's explicit go.**

## Carried from S36 (parked, none blocking)

- **Member-list render duplication** (`RequestPage` / `InvitePage`) — the verifier picker makes a third
  copy: extract a `MemberList` (props: members, action-for-member, empty state) in W2's first task.
- **Focus after approve** (`ApprovePage`): focus falls to `<body>` when a card leaves — move it to the list
  heading or the next card. **Focus ring under `overflow: hidden`** on the hub's status card (confetti).
- `listVerifiedMembers` ignores its ctx and can list the current user (a persona signing in sees
  themselves); `given` in the demo state is written, never read (W4's home); demo state is per-browser, not
  per-key (`ensureSeeded` seeds once); a request settling after unmount still toasts (harmless).
- Confetti keyframe raw values (`1.8s`, `160px`) — no token exists; repo practice.
- The demo sidecar ships inert in production (static import; DEV-gated menu entry) — `React.lazy` behind
  `import.meta.env.DEV` is the hardening.
- Nine fr/sw native flags in the packet's Session 36 section (register, `·e` legibility, `udhamini` vs
  `idhini`, the "✓" glyph, sw person shift).

## Preview lore added in S36 (gloki-verification-and-qa)

- When the Browser pane is hidden, pointer actions time out — drive with `javascript_tool`, `await` inside
  one eval (click → await → read); separate reads from writes only when a re-render must settle.
- `elementFromPoint` above/below a button verifies a `::after` hit area.
- A read ~800 ms after a write can race the refetch — re-read before filing a finding.
- `launch.json` resolves against the session's original scratch root after `change_directory`; a config
  there with `npm run dev --prefix "<repo>" -- --port 5173 --strictPort` starts the repo's server.

## Kickoff

Re-verify the premises, then spec addendum → plan → build W2 in the order spec
§3.3 lists (`VerifierPicker` → `WaitingRoom` → `InCallView` → `CallSummary` → `CallFlow` + route + the
third pathway card with F10's line). Report after each screen with the commit, what the preview walk
showed, and any premise above that turned out stale.
