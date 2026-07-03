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
when it didn't. Unverified work is handed to Eston labeled unverified.

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
| "Is this already settled history / a known false alarm?" (PR #20 ✗, stale-cache reports) | **gloki-failure-archaeology** |
| Tracing consumers before deleting code | **gloki-refactor-and-dead-code** |

## The verification recipe

Run this checklist before calling anything "done". It is the codified form of
MASTER_TODO.md §4 ("Verify before 'done'") plus the accessibility floor from
DESIGN_SYSTEM.md.

| # | Gate | Command / method | Pass condition |
|---|---|---|---|
| 1 | Typecheck | `npx tsc -b` (from repo root) | zero errors — strict + `noUnusedLocals`/`noUnusedParameters`, so even an unused import FAILS the GitHub Pages deploy |
| 2 | Build | `npm run build` | completes clean |
| 3 | Banned patterns | `sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh` | prints `ALL GATES CLEAN`, exit 0 |
| 4 | i18n parity | see **gloki-i18n-playbook** (position-agnostic set diff of fr.ts/sw.ts; never `sed \s` on macOS) | fr = sw key sets, `{var}` tokens intact |
| 5 | Preview walk | every touched route at **360px width**, **light AND dark**, in **en, fr, sw** | layout holds, strings translated, state renders correctly |
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
  updates. The demo seam emits **no `contract_write` events**, so a component that
  doesn't re-fetch after its own write looks frozen — that is a real bug, not a quirk
  (see gloki-seam-and-demo-data).

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
`node .claude/skills/gloki-verification-and-qa/scripts/contrast-eval.js` → prints 3.68 and
4.83 (the two settled ratios). The ancestor background walk inside it matters: most
elements have `transparent` backgrounds.

**Two contrast facts that are settled — do not "fix" them** (both in DESIGN_SYSTEM.md
Accessibility Notes; product decisions live in gloki-change-control):

- White on `$primary` `#3b82f6` is **3.68:1** — kept deliberately as the brand blue
  (Eston's call). Never darken `$primary` to fix it.
- `$gray-400` (2.54:1) is banned for **text**; `$gray-500` (≈4.8:1) is the caption
  token. The regression gate below enforces this.

### scripts/grep-gates.sh — the banned-pattern gate

`scripts/grep-gates.sh` in this skill runs three read-only greps, calibrated so the
baseline at HEAD `c26cdc4` is clean (any hit after your change was introduced by it):

1. **`$gray-400` as text colour** — implements DESIGN_SYSTEM.md's documented gate
   (`grep -rn 'color: $gray-400' src --include='*.module.scss'` must match only
   decorative/`::placeholder` uses), refined to auto-skip `border-color:`/
   `background-color:` and comment-marked decorative lines.
2. **Raw hex in `*.module.scss` values** — DESIGN_SYSTEM.md's one rule: every colour
   comes from a token in `src/styles/variables.scss`. Hexes in `//` comments are
   ignored. (Literal `rgba(0,0,0,0.5)`-style values are pre-existing debt on 10 lines
   — overlays/shadows — so they are NOT a failing gate; just don't add new ones.)
3. **Network calls outside `src/services`** — the seam rule (CLAUDE.md: components
   read/write only through `src/services/api.ts`). Flags `fetch(`/`axios`/
   `new EventSource`/`XMLHttpRequest` anywhere else in `src/`; the only legitimate
   hits live in `src/services/ai.ts` and `src/services/eventStream.ts`.
   (Note: components DO legitimately import fixtures/personas from `src/services/demo/`
   — that is the sanctioned hardcoded-UI pattern, so imports are not gated; network
   primitives are.)

Actual output at c26cdc4 (2026-07-02):

```
$ sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh
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

Push to `ui` **is** a production deploy (Actions workflow "Deploy to GitHub Pages",
Node 22, `build:prod`). After Eston green-lights a push:

```bash
gh run list --limit 3        # expect: completed  success  <commit msg>  Deploy to GitHub Pages  ui
curl -s -o /dev/null -w '%{http_code}\n' https://young-world-federalists.github.io/gloki-engage/   # expect: 200
```

Both verified working 2026-07-02. Two non-alarms (full stories in
gloki-failure-archaeology): PR #20's red ✗ is an expected merge conflict with Ouri's
diverged `main`, NOT a build failure; and a post-deploy "click anywhere → error page"
report is a stale SPA chunk cache — hard refresh, not code.

## Preview-automation lore

Hard-won toolkit for driving the dev server from an AI session with the
`mcp__Claude_Preview__*` tools. Accumulated across S9–S15; recorded in project memory;
the mechanics below marked "verified" were re-checked against HEAD c26cdc4.

**Start:** `preview_start` with server name `gloki-dev` (defined in the gitignored
`.claude/launch.json`: `npm run dev`, port 5173, autoPort). See gloki-build-env-run
for launch details.

**1. Seed auth via localStorage BEFORE navigating.** Real login cannot complete in the
sandbox (`AuthContext.login` awaits a real-server SSE stream). Instead seed the exact
shape AuthContext reads (verified at HEAD: key `user`, fields `publicKey`+`serverUrl`,
key must be exactly 64 alphanumerics per `LoginPage.validatePublicKey`):

```js
localStorage.setItem('user', JSON.stringify({
  publicKey: 'a'.repeat(64),                 // the standing demo identity
  serverUrl: 'https://gdi.gloki.contact'
})); location.href = '/';
```

Corollary: the demo user (`'a' × 64`) **authors nothing** in the seed — author-only UI
branches (edit/withdraw/accept-modification) are unreachable without injecting a
self-authored item first.

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
3  sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh → ALL GATES CLEAN
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

Verified 2026-07-02 @ commit `c26cdc4` (branch `ui`) unless noted. Incidents marked
"recorded in project memory" carry their session/date inline.

| Fact | Re-verify with |
|---|---|
| Verify-before-done line (tsc, build, 360px, dark, keyboard/SR) | `grep -n 'Verify before' MASTER_TODO.md` (line 84) |
| Two north stars wording | `sed -n '9,22p' MASTER_TODO.md` |
| `$gray-400` gate + `$primary` 3.68:1 accepted deviation | `grep -n 'gray-400\|3.68' DESIGN_SYSTEM.md` (lines 115, 408–409) |
| 44px targets, 360px flagship, one-h1 rule | `grep -n '44\|360px\|one per page' DESIGN_SYSTEM.md` |
| grep-gates baseline clean | `sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh` |
| Auth localStorage shape (`user`, publicKey 64 alnum, serverUrl) | `grep -n localStorage src/contexts/AuthContext.tsx; sed -n '59,64p' src/pages/LoginPage.tsx` |
| Review-tier docs exist | `ls docs/session-prompts/REVIEW-*.md` |
| Deploy green + live site 200 | `gh run list --limit 3` and the curl one-liner above |
| DEMO_VERSION currently `global-v16` | `grep -n DEMO_VERSION src/services/demo/mockApi.ts` (line 17) |

Volatile/labeled items: the preview-lore points 3, 5, 6, 7, 8 are **recorded practice
from project memory (S9–S15)**, not re-executed at c26cdc4 — trust them as strong
priors and re-observe if behavior differs. The local panel's availability (RAM, API
keys) drifts; its false-positive record is historical (S6–S9) — recalibrate only if
Eston asks to run it. Literal-`rgba` debt count in module.scss may drift:
`grep -rnE 'rgba\( *[0-9]' src --include='*.module.scss' | wc -l` (10 at c26cdc4).
