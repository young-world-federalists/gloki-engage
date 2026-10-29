---
name: gloki-verification-and-qa
description: Use when about to claim a Gloki/Communities2 change is done, verified, or push-ready; when deciding what counts as evidence with no test framework; when driving the preview browser from an AI session (login seeding, React controlled inputs, preview_eval quirks, stalled subagents); when checking contrast, touch targets, or h1 count; when picking a review tier (Opus whole-branch, persona wave, local panel); or when confirming a deploy. Keywords - tsc -b, preview walk, grep gates, 360px.
---

# Gloki Verification & QA


## Overview

**Core principle: render the state, don't just review the code.**
This repo has **no test framework** (CLAUDE.md: "verify via `npm run dev` and browser
DevTools"). `npx tsc -b` clean + `npm run build` clean is the **floor** — it is what CI
runs, so it must pass — but it is **never the proof** that a change works. Two incidents
define the evidence bar (both recorded in project memory, Jun–Jul 2026):

- **Batch 16 countdown bug (2026-06):** a demo-stub↔card merge had FIVE data-shape
  mismatches. Four were caught reading code. The fifth — a countdown rendering
  "20598159 days left" because demo contracts emit `Date.now()` in **ms** and the card
  multiplied by 1000 — was found **only by actually rendering the card**.
- **S12 attribution (2026-07-01):** attributing a seeded expert reviewer needed 3
  coordinated seam edits; with fewer, the byline shows a **truncated raw public key**.
  Code review passed; only a browser pass showed the raw key.
- Also: the 2026-06-25 funding work needed two whole fix-cycles that code review missed
  (UI frozen after writes because the demo seam emits no `contract_write` events;
  contract method names that didn't match the real contract).

So: a change is "verified" when the **rendered UI state** on the touched routes has been
observed correct — not when the diff looks right and the build is green.

**Claims honesty (house rule):** report failures plainly. If you could not verify
something (preview stalled, route unreachable, subagent killed), say exactly that —
"built, builds clean, NOT preview-verified because X" — never imply a walk happened
when it didn't. Unverified work is handed back labelled unverified.

## When NOT to use this skill

| You actually need | Use instead |
|---|---|
| Setting up/running dev server, build commands, deploy pipeline mechanics, slow-drive I/O rules | **gloki-build-env-run** |
| Whether you may push at all, scope rules, locked product decisions | **gloki-change-control** |
| Session shape (spec → plan → build → review → push gate → memory) | **gloki-session-lifecycle** |
| A bug you're trying to diagnose (symptom → cause triage) | **gloki-debugging-playbook** |
| i18n parity checking mechanics, en/fr/sw key-set tooling | **gloki-i18n-playbook** |
| DEMO_VERSION semantics, demo-seam behavior, fixture seeding | **gloki-seam-and-demo-data** |
| Running the FULL decision-gated UI review campaign (a11y/usability/beauty) | **gloki-ui-review-campaign** |
| "Is this already settled history / a known false alarm?" (stale-cache reports, deleted features) | **gloki-failure-archaeology** |
| Tracing consumers before deleting code | **gloki-refactor-and-dead-code** |

## The verification recipe

Run this checklist before calling anything "done". It is the codified form of
MASTER_TODO.md §4 ("Verify before 'done'") plus the accessibility floor from
DESIGN_SYSTEM.md.

| # | Gate | Command / method | Pass condition |
|---|---|---|---|
| 1 | Typecheck | `npx tsc -b` (from repo root) | zero errors — strict + `noUnusedLocals`/`noUnusedParameters`, so even an unused import FAILS the GitHub Pages deploy |
| 2 | Build | `npm run build` | completes clean |
| 3 | Banned patterns | `sh .agents/skills/gloki-verification-and-qa/scripts/grep-gates.sh` | prints `ALL GATES CLEAN`, exit 0 |
| 4 | i18n parity | see **gloki-i18n-playbook** (position-agnostic set diff of fr.ts/sw.ts; never `sed \s` on macOS) | fr = sw key sets, `{var}` tokens intact |
| 5 | Preview walk | every touched route at **360px width**, **light AND dark**, in **en, fr, sw** — and **both states** of a page you touched: `/page` and `/page?demo=true` | layout holds, strings translated, state renders correctly; the demo variant shows `<DemoNotice />` and its links keep `?demo=true` |
| 6 | Keyboard | Tab through touched interactive elements | reachable, visible focus, Escape closes modals, no focus lost to remounts |
| 7 | Screen-reader basics | inspect the DOM (a11y snapshot) | sensible labels/roles; dynamic status changes announced (aria-live) |
| 8 | Single h1 | per touched route | exactly one `<h1>` (normally the `AppHeader` `title`; DESIGN_SYSTEM.md "one-header / one-`<h1>`" rule) |
| 9 | Touch targets | measure, don't eyeball | interactive elements ≥ 44×44px (DESIGN_SYSTEM.md Mobile Patterns) |

Notes on the walk (step 5):

- 360px is the flagship target ("a 360px-wide Android; every layout must hold there" —
  DESIGN_SYSTEM.md). Resize the preview viewport; don't test only at desktop width.
- Dark mode: emulate `prefers-color-scheme: dark` via the preview resize tool's
  `colorScheme` option.
- After any **write** action in the flow (vote, post, contribute), confirm the UI
  updates — in each layer. Demo writes emit **no `contract_write` events**, so a demo variant
  that doesn't re-fetch after its own write looks frozen; real writes confirm through their event,
  and a real page should also pick up another person's write (open a second identity in another
  browser). See gloki-seam-and-demo-data §4.

## Measure, don't eyeball

Screenshots are for layout gestalt only. Colors, font sizes, and dimensions come from
computed styles (`preview_inspect` or `getComputedStyle` via `preview_eval`).

**Contrast:** compute it; don't judge by eye and don't trust reviewer claims either —
in S9 a persona reported `.actionBtn` gray-500 as "~4.0:1, below AA"; measurement showed
4.83:1 and DESIGN_SYSTEM.md documents `$gray-500` as THE AA caption token. The correct
action was a no-op.

The measurement snippet is shipped as **`scripts/contrast-eval.js` in this skill** — the
ONE home of the contrast code (gloki-ui-review-campaign uses the same file; never fork an
inline copy). Paste its IIFE into `preview_eval`: `glokiContrast('.selector')` for one
element, `glokiContrast()` for a whole-page sweep of failing elements. Math self-test:
`node .agents/skills/gloki-verification-and-qa/scripts/contrast-eval.js` → prints 3.68 and
4.83 (the two settled ratios). The ancestor background walk inside it matters: most
elements have `transparent` backgrounds.

**Two contrast facts that are settled — do not "fix" them** (both in DESIGN_SYSTEM.md
Accessibility Notes; product decisions live in gloki-change-control):

- White on `$primary` `#3b82f6` is **3.68:1** — kept deliberately as the brand blue
  (Eston's call). Never darken `$primary` to fix it.
- `$gray-400` (2.54:1) is banned for **text**; `$gray-500` (≈4.8:1) is the caption
  token. The regression gate below enforces this.

### scripts/grep-gates.sh — the banned-pattern gate

`scripts/grep-gates.sh` in this skill runs three read-only greps; the trunk is clean, so any hit
after your change was introduced by it:

1. **`$gray-400` as text colour** — implements DESIGN_SYSTEM.md's documented gate
   (`grep -rn 'color: $gray-400' src --include='*.module.scss'` must match only
   decorative/`::placeholder` uses), refined to auto-skip `border-color:`/
   `background-color:` and comment-marked decorative lines.
2. **Raw hex in `*.module.scss` values** — DESIGN_SYSTEM.md's one rule: every colour
   comes from a token in `src/styles/variables.scss`. Hexes in `//` comments are
   ignored. (Literal `rgba(0,0,0,0.5)`-style values are pre-existing debt on 10 lines
   — overlays/shadows — so they are NOT a failing gate; just don't add new ones.)
3. **Network calls outside `src/services`** — the seam rule: components reach data only through
   `src/services/`. Flags `fetch(`/`axios`/`new EventSource`/`XMLHttpRequest` anywhere else in
   `src/`. Imports of `src/services/demo/` are not gated — demo variants (`*.demo.tsx`) use it
   legitimately, and older components still do for the transitional id-based routing.

Output on the trunk (2026-10-29):

```
$ sh .agents/skills/gloki-verification-and-qa/scripts/grep-gates.sh
GATE 1 OK — no $gray-400 text colour
GATE 2 OK — no raw hex in *.module.scss values
GATE 3 OK — no network calls outside src/services
ALL GATES CLEAN
exit=0
```

Each pattern was also negative-tested (synthetic violations: `color: $gray-400` text,
`color: #fff`, bare `fetch(`) and caught all three while passing `border-color:
$gray-400`, comment hexes, and `refetch()`.

### Deploy check one-liners

Until the trunk switch, a push to `server-side` or `ui` deploys both sites (root = `server-side`
full app, `/demo/` = `ui` beta; **gloki-build-env-run**). After a push you were given a go for:

```bash
gh run list --limit 3        # expect: completed  success  <commit msg>  Deploy to GitHub Pages
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/        # expect: 200
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/demo/   # expect: 200
```

A post-deploy "click anywhere → error page" report is a stale SPA chunk cache — hard refresh, not code.

## Preview-automation lore

Hard-won toolkit for driving the dev server from an AI session with the
`mcp__Claude_Preview__*` tools.

**Start:** `preview_start` with server name `gloki-dev` (defined in the gitignored
`.claude/launch.json`: `npm run dev`; the dev port is 7173). See gloki-build-env-run.

**1. Seed auth via localStorage BEFORE navigating** when no node is reachable (real login awaits a
real-server SSE stream). Seed the exact shape AuthContext reads (key `user`, fields
`publicKey`+`serverUrl`; the key must be 64 alphanumerics per `LoginPage.validatePublicKey`):

```js
localStorage.setItem('user', JSON.stringify({
  publicKey: 'a'.repeat(64),                 // the standing demo identity
  serverUrl: 'https://gdi.gloki.contact'
})); location.href = '/';
```

Two consequences:

- A seeded identity has **no profile contract** on the server, so `/` redirects it to `/welcome`
  (the first-run check reads the real profile). Demo variants (`?demo=true`) and demo communities
  still render; for real pages, log in for real against a local node (**gloki-build-env-run**).
- The demo user **authors nothing** in the seed — author-only UI branches are unreachable without
  creating or injecting a self-authored item first.

**2. React controlled inputs need the native-setter trick.** Setting `.value` directly
does nothing (React overrides the property). Use the prototype setter + a bubbling
`input` event (swap `HTMLTextAreaElement` for textareas):

```js
(() => {
  const el = document.querySelector('input[name="title"]');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    .set.call(el, 'My title');
  el.dispatchEvent(new Event('input', { bubbles: true }));
})()
```

`preview_fill` handles the common cases; reach for the trick when it doesn't take.

**3. Separate the `.click()` eval from the state-read eval.** `preview_click` misses
small icon buttons — fall back to `preview_eval` with `el.click()`. But do the click in
ONE eval and read the resulting state in a SECOND eval; a combined click-and-read races
React's re-render and reads stale DOM.

**4. `JSON.stringify` every non-trivial eval return.** `preview_eval` returns `{}` for
mixed-object literals. Wrap the return in `JSON.stringify(...)` (as in the contrast
snippet above).

**5. Evals can fire mid-navigation.** After `location.href = ...`, the next eval may run
against the unloading page and return garbage — just re-run it.

**6. Restart the dev server after editing a `useEffect` deps array.** HMR leaves a
transient console error that survives until restart; don't debug the ghost.

**7. Simulating offline:** `dispatchEvent(new Event('offline'))` does NOT flip
`navigator.onLine` — override the getter
(`Object.defineProperty(navigator, 'onLine', { get: () => false })`), and note it
resets on reload. (S14 offline work.)

**8. Preview automation is unreliable for focus and post/submit flows.** In S9 two
implementer subagents stalled on focus-management verification and had to be killed.
Budget for **controller takeover**: the top-level session drives the browser by hand
for focus traps, aria-live announcements, and multi-step submits.

**9. ONE preview browser, strictly sequential agents.** All persona/implementer
subagents share a single preview browser. Running them in parallel corrupts each
other's navigation state. Standing rule: **implementer subagents verify via build
only** (`npx tsc -b` / `npm run build`); the **controller** session does all preview
driving; persona reviewers run one at a time.

### Worked example — verifying a vote-card change

```text
1  npx tsc -b                          → clean
2  npm run build                       → clean
3  sh .agents/skills/gloki-verification-and-qa/scripts/grep-gates.sh → ALL GATES CLEAN
4  preview_start gloki-dev
5  preview_eval: seed localStorage 'user' (snippet above), location.href='/'
6  preview_resize: width 360, colorScheme dark
7  navigate to the touched initiative's Vote stage (LanguageSwitcher → fr, then sw)
8  preview_eval #1: document.querySelector('[data-testid=cast]')?.click() ?? 'MISS'
9  preview_eval #2 (separate call): JSON.stringify({ tally: ..., turnout: ... })
   → confirm the tally UPDATED (no contract_write events — the card must re-fetch)
10 contrast snippet on the new caption → ratio ≥ 4.5 (or documented exception)
11 a11y snapshot: one h1, button labels present; Tab to the card → focus visible
12 report: what was observed, what was NOT covered (e.g. "SR announcement not
   verified — needs controller/manual pass")
```

### Timer throttling in a hidden pane (S37, 2026-09-07)

**A hidden Browser pane throttles `setTimeout`.** Any eval that waits inside itself is affected, and an
eval that waits too long is killed at the harness's 45 s limit. This bites hardest when the thing you are
verifying is *itself* timer-driven (the S37 call simulation: 1.5 s join stagger, 2 s verify stagger, a 20 s
timeout).

- **Split the waiting across several short evals** (~14 s of sampling each) rather than one long one. State
  persists between evals, so a sampling loop can span calls.
- **The killer is a loop of small `await`s, not the total.** A `for` loop with a 400 ms wait per click
  overran 45 s; a loop of 6 × 2.2 s sampling the same page did not.
- `document.hidden` / `visibilityState` tells you whether throttling is in play — check it before blaming
  the code under test.
- Navigation kills the current eval (`Promise was collected` / `Inspected target navigated`). Do
  `location.href = …` in its OWN eval and read the result in the next one. `navigate` on a path may silently
  land on `/` when the app redirects — `location.href` from inside the page is the reliable route change.

### Verify the aria, not just the visible text (S37)

A walk that reads `innerText` will miss a state that is wrong only to a screen reader. In S37 a member row
rendered the badge "Waiting" while its presence dot carried `aria-label="Offline"` — contradictory, and
factually wrong. Read `[role="img"]` labels, `aria-live` contents and accessible names alongside the text.

### An off-screen element makes `elementFromPoint` lie

`elementFromPoint` returns `null` for coordinates outside the viewport, which looks exactly like "the hit
area is missing". In S37 that read as a broken 44px `::after` when the real problem was that the whole
controls bar sat below the fold. **Check the element's `getBoundingClientRect().top` against
`window.innerHeight` before concluding anything about a hit area.**

## Review tiers

Severity everywhere is judged against the **two north stars** (MASTER_TODO.md §1, in
order): (1) **usability first** — a young person on a cheap Android, intermittent data,
English as a third language, completes the journey unaided (KPI ≥70%); (2) **a felt
sense of transnational collaboration**. Rank findings blocker/major/minor against
those, **not** generic code quality. A misaligned icon is a minor; a gate that makes the
ballot unreachable for an unverified user is a blocker even if the code is pristine.

| Tier | What it is | When | Status |
|---|---|---|---|
| **Per-task review** | reviewer subagent checks each build task's diff against its spec | every subagent-driven task | standard |
| **Opus whole-branch review** | one high-capability model reviews the full session diff end-to-end | before EVERY push | **THE accepted quality gate** (Eston pre-accepted this across S5–S15) |
| **REVIEW-WAVE** | 9 persona subagents (defined MASTER_TODO.md §5) walk the LIVE preview as users; findings ranked against the north stars | major milestones / on request | documented at `docs/session-prompts/REVIEW-WAVE.md`. ⚠️ The doc says "parallel subagents" — practice overrides: run personas **sequentially** (shared preview browser; parallel runs corrupt state — S9 lesson). Campaign execution: see **gloki-ui-review-campaign** |
| **REVIEW-AND-REFACTOR** | ~21 read-only Explore agents, 5 phases (map → 8 audit dimensions → per-lane reviews → synthesize → next-wave prompts) | wave-scale audits | documented at `docs/session-prompts/REVIEW-AND-REFACTOR-WORKFLOW.md` |
| **REVIEW-STRUCTURE** | light read-only branch/PR/deploy hygiene audit (~300 words) | quick hygiene check | documented at `docs/session-prompts/REVIEW-STRUCTURE.md` |
| **Local multi-model panel** | Ollama/cloud reviewers via `local_review.py` | only when Eston explicitly asks | **leads to verify, never verdicts** — near-100% false-positive record (S6: read deleted diff lines as live bugs; S7: read TODO notes as defects; S8: zero diff coverage; S9: can't see locale/scss files); effectively unavailable S11–S15 (RAM/keys). **Never run it, `--free-ram`, or `--quit-chrome` unprompted** — it quits Chrome + Jellyfin and may send the diff to cloud reviewers |

Verify reviewer claims before acting on ANY tier's finding — measure the contrast,
grep the code, render the state. Faulty premises have come from personas (S9), the
panel (S6–S9), and even session prompts (S10–S15). A finding is a hypothesis.

## Provenance and maintenance

Updated 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Fact | Re-verify with |
|---|---|
| Gates clean on the trunk | `sh .agents/skills/gloki-verification-and-qa/scripts/grep-gates.sh` |
| Auth seed shape | `grep -n "localStorage.setItem('user'" src/contexts/AuthContext.tsx` |
| First-run check | `grep -n digitalAgentProfile src/App.tsx` |
| Dev port | `grep -n port vite.config.ts` |
| Pages with two states | `git ls-files '*.demo.tsx'` |
| Contrast helper | `ls .agents/skills/gloki-verification-and-qa/scripts/contrast-eval.js` |
