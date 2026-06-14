# Session prompt — Batch 12: alert()→Modal, the CollaborationPage/CollabList i18n gap, and the long-tail leftovers

Paste this whole file into a fresh Claude Code session on the `ui` branch. **Batch 11 is done** — the
deep collab-flow literals are wired (Concerns/Discussion/Approval, plus the orphaned PipelineView),
fr/sw stay at full parity, the ConcernsFlow severity colours moved to tone tokens, and the app now
formats dates in the active locale. What's left is the genuinely-deferred item from B11 (alert→Modal)
plus a real i18n gap the live walk surfaced (the CollaborationPage shell + CollabList are *not wired at
all*) and a handful of one-liners. This is again a polish batch — one relaxed session.

> Check `git log` first. At B11 handback `ui` was **8 commits ahead of origin/ui** (6 from B10 +
> `0be1cee`, `7e8227a` from B11), **NOT pushed**. The push/PR decision is Eston's — do NOT push without
> his green light.

---

## What Batch 11 shipped (local commits `0be1cee`, `7e8227a`, NOT pushed at handback)

- **§1 deep-flow literal wiring — COMPLETE.** Every remaining body literal in `flows/concerns`,
  `flows/discussion`, `flows/voting/ApprovalFlow` and `collaboration/PipelineView` now goes through
  `t()`, with matching keys added to **both** `fr.ts` and `sw.ts`. Overlays verified at **793 keys each,
  zero `{var}` mismatches** (re-run the scanner in `/tmp/i18ncheck.mjs` — parse `'key': 'value'` pairs,
  diff key sets, compare `{var}` sets per key). QVFlow was already fully wired (no change). Plurals use
  the `.one`/`.many` convention; no `{s}` ternaries remain in the flows.
- **ConcernsFlow severity colours** — the inline `severityColor` rgba ladder became per-severity SCSS
  classes using the semantic `surface`/`on-surface` token pairs (red/amber/neutral by hue), fixing the
  white-on-pale-red AA failure; remaining brand-red/green literals in the module → `$error`/`$success`.
- **§2 date-locale** — `useI18n().locale` is now threaded into date formatting so dates follow the app
  locale, not the browser: MandateCard `ratifiedOn`, AdoptionFramework "since" (fixture `since` migrated
  `'Apr 2026'` → ISO `'2026-04'` + a `formatSince(value, locale)` helper), ChatTopic/ChatTopicList
  absolute dates, Communities created-date.
- **§2 stage colours** — CreateInitiativePage `STAGES[].color` inline hex → per-stage `.stepCircle_*`
  SCSS classes (discussion/vote/mandate map to `$warning`/`$primary`/`$success`; problem/proposals kept
  as literals — a deliberate rainbow). Stale `dashboard.stage.{id}.label` comment corrected.
- **Verified:** `tsc -b` + `npm run build` exit 0; DiscussionFlow live-walked at 360px in **fr and sw**
  (category chips, one/many comment count, empty states, no artifacts); MandateCard live in **fr**
  ("Ratifié le 18 avril 2026"). `fr.ts` header note corrected (the file uses a **regular space** before
  `? ! : %`, NOT U+00A0 as the old comment claimed).

## How we work (non-negotiable — unchanged)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr or sw where strings changed.
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push.**
- Slow external drive: small sequential I/O; `rg` via Bash. `.module.scss` / `fr.ts` / `sw.ts` must be
  opened with Read before Edit (the tool tracks per-file read state — grep alone doesn't count).

## Demo facts (re-verified in B11, save time)

- Seed: `localStorage.user={publicKey:'a'.repeat(64),serverUrl:'https://gdi.gloki.contact'}` +
  `gloki.digitalAgent` + `gloki.onboarding={step:6,completed:true}` + `gloki.locale`. Then
  `/create-community` → set name via the native input-value setter + `input` event → click
  "Create Community" → auto-seeds personas/initiatives and lands on `/community/<id>`.
- **The registry flows mount as tabs**, not on the roadmap. `flows/registry.ts`: `discussion`+`roles`
  are `context: 'collab'`; `approval`+`quadratic`+`concerns` are `context: 'initiative'`. To reach
  **DiscussionFlow** live: community → Collabs → **Start Collab** → "Open Discussion" template → open it.
  Reaching the **initiative-context** flows (Concerns/Approval/QV) live needs an initiative collab
  workspace / stage progression — B11 verified those via build + static parity instead.
- Mandate page (for MandateCard / AdoptionFramework): `/mandate/<communityId>/water`.
- Artifact check per page: `document.body.innerText.match(/\{\w+\}/g)` → must be `null`.
- Preview emulates dark by default — pin with `preview_resize({colorScheme:'light'})`.

---

## §1 — alert()/confirm() → shared Modal (the headline; deferred from B11)

`alert()`/`window.confirm()` are functional but jar against the app. Convert to the shared controlled
`Modal` (`components/shared/Modal.tsx`: `isOpen`/`onClose`/`title`/`children`/`footer`). Each site needs
local `useState` (message/open) + a `<Modal>` with an OK/confirm `<Button>`; reuse `common.*` for the
button labels (add `common.ok` if you want one). Sites (`rg -n "alert\(|confirm\(" src --glob '*.tsx'`):

- `components/identity/JoinCommunity.tsx:111` — `alert('Failed to join community: …')` — **also
  untranslated**; wire through `t()` while you're there.
- `components/community/Members.tsx:206` — `alert(t('members.joinFailed', …))` (the one Eston called
  out; already i18n-wrapped, just needs the Modal).
- `components/community/Currency.tsx:45` — `alert(t('currency.insufficient', …))`.
- `pages/CommunityView.tsx:187` — `alert('Demo link copied…')` (demo-dev affordance; a toast/Banner may
  fit better than a Modal — your call).
- `pages/CommunityView.tsx:197` — `window.confirm('Reset this demo…')` (destructive demo reset — needs a
  real confirm Modal with two buttons).
- `components/community/dialogs/IdentityCardDialog.tsx:67` — `alert('Error generating PDF: …')`.

A tiny shared `useAlert()`/`<AlertModal>` helper would pay for itself across these — consider it before
hand-rolling six copies. Add fr/sw keys for any new strings.

## §2 — CollaborationPage + CollabList i18n gap (discovered live in B11)

These render **entirely in English even when the locale is fr/sw** — the W2/W5 sweeps missed them:

- The collab shell: **"Collab"** heading, **"Back to Community"**, the **"Add"** tab button, and the
  Add-tab menu group names (`FLOW_GROUPS` in `flows/registry.ts`: Decision Making / Teamwork / Planning)
  and each flow's `label` (Approval Voting / Quadratic Voting / Concern Resolution / Discussion / Role
  Assignment).
- **CollabList**: "Collabs", "Template-based workspaces for teamwork", "No collabs yet. Start one from a
  template.", "Start Collab", and the template picker ("Open Discussion", "Community Project", "Custom
  Workspace" + their descriptions, "Nom", "Modèle" is already fr so the modal frame is partly wired).

Find the components (likely `pages/CollaborationPage.tsx` + a `CollabList`/template modal), wire literals
through `t()`, add `collab.*` keys to **both** overlays, artifact-check live (the Start-Collab flow is
easy to reach — see demo facts).

## §3 — Long-tail one-liners (opportunistic)

- **PipelineView is orphaned** — `rg -rn "PipelineView" src` finds no importer. Decide with Ouri: dead
  code to delete, or a view to re-wire? B11's wiring is correct if it's revived; don't delete blindly.
- **MandateDocument** (`components/mandate/MandateDocument.tsx:14`) hard-codes `toLocaleDateString('en-GB',…)`
  — the formal document keeps English dates in every locale. Intentional? If not, thread `locale`.
- **DiscussionFlow comment timestamps** (`flows/discussion/DiscussionFlow.tsx` `formatTime`, ~line 45)
  still pass `undefined` locale — left out of B11's date pass to avoid re-churning the file. Same trivial
  `formatTime(ts, locale)` fix (CommentItem already has `t`; switch it to `useI18n()` for `locale`).
- **CommunityView.module.scss** named in the B11 prompt §2 **does not exist** — that "2 hex" a11y
  leftover path is stale. If the debt is real, re-locate it (`rg -n "#[0-9a-fA-F]{3,6}" src/pages/CommunityView*`
  / `src/components/community/`).
- **Hand-rolled buttons → shared `Button`** (the standing optional W4 leftover): chat send/back,
  Stepper, merge-flow.

## §4 — fr/sw native review (flag, don't churn)

The overlays are model-translated. A native pass is still owed — especially sw civic vocabulary
(mpango/agizo/udhamini) and fr inclusive forms (·e). **Specific doubt found in B11:**
`dashboard.readiness.upvotes.one` = `'Encore 1 vote pour nécessaire ({up}/{threshold})'` and `.many` =
`'Encore {remaining} votes pour nécessaires (…)'` read ungrammatically in French (the "pour" is
spurious; should be "Encore 1 vote nécessaire …"). It's pre-existing B10 copy — flag for a human, don't
silently rewrite a wave of strings.

## §3/housekeeping

- **PR #20 / push** stay gated on Eston. If he green-lights, refresh the PR body + ahead-count and push.
- If §1/§2 add key families, note them in this prompt's successor and keep the en.ts header note true.

## Sizing + when done

One session. §1 (alert→Modal) + §2 (CollaborationPage/CollabList i18n) are the bulk; §3 are each ≤30min.
`tsc -b` + build green; en/fr/sw spot-walks of touched routes; small local commits; **no push**. Hand
back with shipped-vs-deferred + the next-session prompt.
