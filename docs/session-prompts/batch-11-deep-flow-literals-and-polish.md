# Session prompt — Batch 11: deep-flow literal wiring + visual-debt polish (post-W5 long tail)

Paste this whole file into a fresh Claude Code session on the `ui` branch. **W5 is done** — Batch 10
delivered full fr/sw parity (726-key overlays), the plural restructuring, the two-family stage labels,
and the pre-auth language switcher. What's left is the *true* long tail: deep collab-flow literals the
W2/W5 sweeps deliberately skipped, a handful of TSX color literals, and small UX-debt items. This is a
polish batch, not a headline batch — it can be one relaxed session.

> Check `git log` first: Batch 10 may or may not be pushed yet. If `origin/ui` is behind local, the
> deploy decision is Eston's — do NOT push without his green light.

---

## What Batch 10 shipped (local commits `7252320..08b7d4d`, NOT pushed at handback time)

- **W5 fr/sw parity — COMPLETE.** `src/i18n/fr.ts` + `sw.ts` are full overlays (~740 keys each):
  the harvested union of en.ts, every inline `t()` default, and all descriptor tables (stage badges,
  journey phases, conviction durations, recap steps, `time.*`, home sections, agent activity,
  createCommunity features). Coverage + `{var}` token integrity were verified **programmatically**
  (scanner + var-check scripts — re-create them from this pattern if needed: parse `'key': 'value'`
  pairs, diff key sets against a fresh `t()`-call harvest, compare `{var}` sets per key).
  fr uses U+00A0 before `? ! : %` and « » quotes; sw puts numbers after nouns (wanachama {n}).
- **Plural call sites restructured** (7 sites): `dashboard.readiness.upvotes`, discussion/proposals/
  vote summaries (InitiativeDashboard), `roles.count`, `members.count` → full-string `.one`/`.many`
  alternatives. **No `{s}`-suffix morphology remains.**
- **Stage labels collapsed to two families:** `nav.*` = short (footer), `stage.*` = full (canonical,
  in en.ts; used by CommunityHome badges + InitiativeDashboard + CreateInitiativePage).
  `dashboard.stage.{id}.label` is GONE; `.desc` remains dashboard copy.
- **Pre-auth LanguageSwitcher** on the LoginPage card (top-right, `langRow`); the shared switcher
  select went 36px → 44px. Verified live: switching persists (`gloki.locale`), updates `<html lang>`.
- **Crash fix found by the live walk:** `agent?.vouchedBy.length` (OnboardingFlow ×2, DigitalAgentCard
  ×2, useDigitalAgent.hasAgent) threw for agent records missing `vouchedBy`/`languages` (older shape /
  profile-editor writes) — all array reads are now `?.` with safe defaults. /welcome was crashing for
  that state before the i18n work ever rendered.
- **Walk-found stragglers wired:** CommunityView header count (`community.members.one/many`),
  RoleChip/RoleDisplay (`roles.author/coAuthor/expert/expertTitle` — was hardcoded "Author" on every
  initiative header), PipelineView's discussion-context block (`pipeline.discussion.*`).
- **PR #20 body refreshed** to post-9b reality (153 ahead, B9 bullet, both gates, §8 still the
  must-read). Ouri reviews/merges; the 2 upstream `main` commits still need reconciling.
- **Verified:** `tsc -b` + `npm run build` green; live fr+sw walks at 360px light+dark across login,
  onboarding (/welcome), 5-stage feed, community home, dashboard, mandate page; zero `{var}` artifacts
  in rendered body text; IdentityCardDialog chunk still 9.6KB-class (jsPDF stays dynamic).

## How we work (non-negotiable — unchanged)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays
  (Gate A decision — recorded in DESIGN_SYSTEM → Accessibility).
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr or sw where strings changed.
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push.**
- Slow external drive: small sequential I/O; `rg` via Bash.

## Demo facts (10-verified, save time)

- Seed: `localStorage.user={publicKey:'a'.repeat(64),serverUrl:'https://gdi.gloki.contact'}` +
  `gloki.digitalAgent` (any shape now survives) + `gloki.onboarding={step:6,completed:true}` +
  `gloki.locale` ('en'|'fr'|'sw'). Then `/create-community` → fill name via native setter + `input`
  event → click "Create" → auto-seeds personas/initiatives and navigates in.
- Initiative ids: `localStorage` keys `gloki_demo_state_demo-init-…`. Dashboard route:
  `/initiative/<encoded serverUrl>/<publicKey>/<communityId>/<initiativeId>/roadmap`.
- Artifact check one-liner (run per page): `document.body.innerText.match(/\{\w+\}/g)` → must be null.
- The preview emulates dark by default on this machine — pin with `preview_resize({colorScheme})`.

---

## §1 — Deep-flow literal wiring (the headline, such as it is)

The collab deep flows got placeholder-only i18n in 9b/10. Their remaining body literals need `t()` +
fr/sw entries (follow the Batch-10 pattern: wire → add keys to BOTH overlays → artifact-check live):

- **ConcernsFlow** (`flows/concerns/`): severity chips, filter chips, error strings; also its
  `severityColor` literal rgba ladder (~line 100) → tone tokens or per-severity SCSS classes (this is
  the a11y §1b-family leftover).
- **DiscussionFlow** (`flows/discussion/DiscussionFlow.tsx`): remaining literals beyond
  `discussionFlow.composePlaceholder` (vote/error strings, list chrome).
- **ApprovalFlow / QVFlow bodies** (`flows/voting/`): remaining literals (the `mechanisms.*` family
  already covers the shared mechanism components — these are the flow-shell leftovers).
- **PipelineView**: only the discussion-context block is wired. Remaining: the STAGES config
  `hint`/`description` fields (~line 30-60), ErrorBoundary `fallbackMessage` props (pass
  `t('deliberation.error', …)` etc. — the keys already exist), and any other inline copy.
- Grep for the remainder once: `rg -n "(>|')[A-Z][a-z]+ [a-z].*'?" src/components/collaboration/flows`
  is too noisy — better: re-run the Batch-10 scanner trick in reverse (find JSX text nodes / quoted
  strings NOT passing through `t(`) or just read the four files; they're small.

## §2 — Small visual/UX debt (opportunistic)

- **CreateInitiativePage `STAGES[].color` hexes** (step circles) → stage-color tokens or per-stage
  SCSS classes.
- **a11y §4 leftovers:** `CommunityView.module.scss` (2 hex), CollabList if still present.
- **alert()/confirm() → shared Modal:** `Members.joinFailed` still `alert()`s; grep
  `rg -n "alert\(|confirm\(" src --glob '*.tsx'` for the rest.
- **(Optional W4 leftover):** hand-rolled buttons (chat send/back, Stepper, merge-flow) → shared
  `Button`.
- **Date-locale nicety:** the mandate page renders "Ratifié le **April 18, 2026**" — `{date}` arrives
  pre-formatted in en-US (fixture/`toLocaleDateString` with no locale). Thread
  `useI18n().locale` into those format calls (`toLocaleDateString(locale)`) where dates surface
  (MandateCard ratifiedOn, adoption "since", ChatTopic absolute dates).
- **fr/sw native review:** the overlays are model-translated. Eston may want a native-speaker pass —
  especially sw civic vocabulary (mpango/agizo/udhamini choices) and the fr inclusive forms (·e).
  Don't churn them without humans; flag specific doubts instead.

## §3 — Housekeeping

- **PR #20:** body is current as of Batch 10 handback; refresh the "Batch 10 in progress" line to
  "shipped" once Eston green-lights the push (and update the ahead-count).
- **Docs:** if anything in §1 changes key families, note it in this prompt's successor. The i18n
  architecture note (en.ts = seed + inline defaults canonical; overlays fall back per-key) lives in
  the en.ts header comment — keep it true.

## Sizing + when done

One session. §1 is the bulk (4 files + 2 overlay updates + live checks); §2 items are each ≤30min.
`tsc -b` + build green; en/fr/sw spot-walks of touched flows; small local commits; **no push**.
Hand back with shipped-vs-deferred + the next-session prompt.
