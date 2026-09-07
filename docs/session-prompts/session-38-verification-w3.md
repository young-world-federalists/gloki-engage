# Session 38 — Prompt 2 Wave 3: the daily verification session

## Context recap (as of 2026-09-07, `ui` @ `1c7a41a`, **NOT PUSHED**)

S37 built Prompt 2 Wave 2 — the simulated verification call. Four screens at
`/identity/verification/call` (`VerifierPicker` → `WaitingRoom` → `InCallView` → `CallSummary`) driven by
`CallFlow`'s state machine, over a new in-memory simulation `src/services/demo/verificationSim.ts` behind
the existing seam (8 new functions, no contract method), plus the third pathway card. Kit gained
`VerifyButton`, `VideoTile`, `CountdownTimer` + `useCountdown`; `MemberList` was extracted at its third
consumer, closing S36's parked duplication. 22 commits `64c3abe..666a8e5` plus closeout, 46 new i18n keys
(parity 1312 → 1358), **no `DEMO_VERSION` bump** (UI + a demo module only). Opus whole-branch review
0 Critical / 2 Important / 7 Minor → one fix wave, scoped re-review clean.

**Push state: NOT PUSHED.** S37 ended at the founder's gate. Per D11 a `ui` push does not deploy — Ouri
merges `ui` → `server-side`. **Confirm with Eston whether S37 was pushed before assuming anything below.**

This session builds **Wave 3 only** — the daily session (spec §3.3 W3, screen 6). Wave 4 (notification
centre + bell) stays separate (F9).

## Re-verify these premises vs HEAD (S10–S37 lesson — prompts go stale between sessions)

Every claim below is mine and WILL rot. Check each before planning around it.

* `git log --oneline origin/ui..ui | wc -l` → expect **22** if S37 was never pushed, **0** if Eston green-lit
  it after this prompt was written. Anything else means work landed after S37 closed — read it first.
* `git log --oneline -1` → expect `1c7a41a docs(s37): closeout …`.
* `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` → expect `'global-v19'`. W3 seeds a daily-session
  fixture only if you add one; bump ONLY if fixtures change (S37 correctly shipped without a bump).
* `ls src/components/identity/verification/` → expect 18 files incl. `CallFlow.tsx`, `VerifierPicker.tsx`,
  `WaitingRoom.tsx`, `InCallView.tsx`, `InCallVerifyAction.tsx`, `CallSummary.tsx`, `MemberList.tsx`.
* `grep -n "path=\"verification" src/pages/IdentityView.tsx` → expect **five** routes (`verification`,
  `/request`, `/approve`, `/invite`, `/call`); W3 adds `daily` to both the routes and `verificationTitles`.
* `grep -n "^export" src/services/verification.ts` → expect 14 functions (6 from W1 + 8 call functions).
  `selectVerifiers()` from spec §3.1 is **W3's**, not yet written.
* `grep -c "prefers-reduced-motion" src/components/shared/CountdownTimer.module.scss` → expect 1.
  `useCountdown` already exists and is the ONLY sanctioned timer in component-land — reuse it for 21:00 UTC.
* `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` → `fr=1358 sw=1358`, PARITY OK.
* `sed -n '1,20p' src/components/shared/NotificationsBell.tsx` → still `merge_absorbed`-only (W4's job).
* `grep -rn "verificationSim" src/components/ | wc -l` → **0**. The seam rule; keep it at 0.

## Read first

1. `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md` §3.3 **Wave 3** —
   `DailySession.tsx`: pre-session (`CountdownTimer` to 21:00 UTC, "Set reminder" toggle, Join enabled
   within 5 min — demo clock override in the state switcher), lobby (participant count, list, "Selecting
   verifiers in 2:30…"), selection result (selected → banner → `InCallView`; not selected → thanks +
   auto-dismiss + "Today {N} new members were verified").
2. `docs/superpowers/specs/2026-09-07-s37-verification-w2-design.md` — W2 as built. **§3.2 (determinism),
   §3.3 (all timers live in the sim), §6.7 (the verifier role has no door — see Open decisions) and the
   C1/R9–R13 as-built notes bind W3 too.** W3 reuses `InCallView`, so read it before changing anything there.
3. `docs/superpowers/specs/2026-09-02-s34-decision-record.md` — **F10 applies again**: the daily session is
   the other camera+data surface, so its entry points carry the same line with the text-vouch path linked,
   and non-video pathways stay first on `PathwayCards`. Also D8/D9/F9.
4. `docs/FOR_OURI_seam.md` S37 addendum — the call's 8 seam functions are documented as **simulation-only,
   with an explicit "do not invent `start_call`/`join_call`"**. W3's `selectVerifiers()` etc. get the same
   treatment: a wire-name row saying no contract method exists (the S36 §8 I4 rule).
5. Skills: `gloki-change-control`, `gloki-session-lifecycle`, `gloki-seam-and-demo-data`,
   `gloki-i18n-playbook`, `gloki-governance-domain` §8–§9, `gloki-verification-and-qa`.

## Open decisions to lock (recommend-then-confirm with Eston)

* **The verifier's door (I2, carried from S37's gate — decide this first, it may belong in W3).**
  `VerificationHub` hides `PathwayCards` from verified users, and that card is the only in-product link to
  `/identity/verification/call`. So the verifier role built in W2 is reachable only by URL or the dev
  scenario switcher. Options: (a) a verifier-framed hub entry — needs its own strings, the current card
  copy is candidate-framed and would be false; (b) the daily session becomes the verifier's door, which is
  arguably its natural home; (c) W4's notification centre delivers it ("you've been selected to verify").
  Recommendation: **(b) or (c)** — a standing "verify someone now" entry invites idle verification, whereas
  the daily session and a notification both arrive with a reason attached.
* **The demo clock.** 21:00 UTC is almost never "now" during a demo walk. Spec says a clock override in the
  state switcher. Confirm the override is dev-only and that the pre-session screen is honest about it.
* **How many verifiers a daily session selects, and whether selection is deterministic.** E2's principle
  (randomness may decide presentation, never outcome) has held for three waves; keep it.

## Workflow + constraints (same discipline as S1–S37)

* Docs-first: spec addendum + plan committed as `docs(s38)` **before** any `feat(s38)`.
* Build via `superpowers:subagent-driven-development`: subagents sequential; **the controller drives the one
  preview**. Every task ends with `npx --no-install tsc -b --noEmit`, `npm run build`, the grep gates, the
  parity script, and a controller walk at 360px light + dark.
* **Timers live in the sim, never in components** — the one exception is `useCountdown`.
* `try/finally` around every seam write; `aria-hidden` on every decorative icon; **44px on every tap**
  (`size="sm"` needs the `::after` extension — `.refreshButton` in `CallFlow.module.scss` is the precedent);
  honesty line on every surface where a fixture person judges the user, **in a role-accurate variant** (R11).
* Any live-updating count goes in a polite live region; a region must be **mounted before** it is populated
  or screen readers will not announce it (`Toast.tsx` is the house precedent).
* Route-map freeze: `daily` nests in `IdentityView` (D9).
* i18n ritual + packet section "Session 38"; **French `{count}` strings are an open question, not settled** —
  S37's packet flags that `ont rejoint` / `wamejiunga` read as plural and are wrong at 1. Do not copy that
  pattern into new strings until a native reviewer rules.
* Opus whole-branch review before proposing a push; **never push without Eston's explicit go.**

## Carried from S37 (parked, none blocking)

* Deferred minors: `.selectedRow` has no horizontal inset; the i18n key `selected` holds the imperative
  "Select"; `WaitingRoom`'s double `leaveCall` on Cancel (guarded by `sessions.has`); its missing `catch`
  (unreachable — `busy` serialises the buttons); a StrictMode dev-only orphan session on verifier mount
  (schedules no timers, cannot write); `VideoTile`'s flag/label props are independently optional so the
  consumer must pair them.
* `docs/i18n-native-review-candidates.md` Session 37: 46 keys, with the **Swahili `simu`** question (does it
  read as a video call or a phone call?) as the lead item.

## Kickoff

Re-verify the premises, confirm the push state of S37 with Eston, lock the open decisions (the verifier's
door first), then spec addendum → plan → build W3 in the order spec §3.3 lists. Report after each screen
with the commit, what the preview walk showed, and any premise above that turned out stale.
