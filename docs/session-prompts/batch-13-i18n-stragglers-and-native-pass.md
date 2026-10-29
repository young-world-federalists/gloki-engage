# Session prompt — Batch 13: the i18n stragglers (JoinCommunity / IdentityCardDialog) + the owed fr/sw native pass

Paste this whole file into a fresh Claude Code session on the `ui` branch. **Batch 12 is done** — every
`alert()`/`window.confirm()` now goes through a shared, a11y-correct `useAlert()`/`Modal`; the
CollaborationPage shell + CollabList + template picker (a real W2/W5 miss) are fully wired; and the §3
long-tail (active-locale dates in MandateDocument/DiscussionFlow, demo-pill token de-hardcoding) is in.
fr/sw sit at **838 keys each, zero `{var}` drift**, live-verified en+fr+sw at 360px. What's left is the
genuinely-deferred tail: two components that are still **broadly** un-i18n'd (only their alerts got wired),
the **fr/sw native-speaker pass** that's been owed since Batch 10 (with one confirmed grammar bug to fix),
and the standing optional button-consolidation. This is a polish batch — one relaxed session.

> Check `git log` first. At B12 handback `ui` was **11 commits ahead of origin/ui** (9 prior + `d6ddea1`,
> `db2f895`, then this prompt doc). **NOT pushed.** The push/PR decision is Eston's — do NOT push without
> his green light.

---

## What Batch 12 shipped (local commits `d6ddea1`, `db2f895`, NOT pushed at handback)

- **§1 — alert()/confirm() → shared Modal, COMPLETE.** New **`useAlert()`** hook
  (`src/components/shared/useAlert.tsx`): Promise-based `showAlert(msg,{title})` / `showConfirm(msg,{title,
  confirmLabel,destructive})` + an `alertElement` to drop in JSX, built on the shared `Modal`+`Button`
  (focus trap / Esc / focus restore). Wired into Currency, JoinCommunity (alert was raw English — now
  i18n'd), IdentityCardDialog, and CommunityView (demo reset = destructive 2-button `showConfirm`;
  demo-link-copied = `showAlert`). **Members** routed its alert through its **existing in-component
  `MessageDialog`** instead (keeps the two sibling error paths consistent — no third dialog pattern in that
  file). New keys: `common.ok`/`common.errorTitle`, `currency.insufficientBody`, `join.failed`,
  `identityCard.pdfError`, `community.demoLinkCopied{Title,Body}`, `community.reset{Title,Body,Confirm}`.
- **§2 — CollaborationPage + CollabList i18n gap CLOSED.** Every shell literal through `t()` (back / Add /
  remove-tab aria / empty + unknown-flow states + the `CollabPage` wrapper in CommunityView); registry flow
  labels + Add-menu group names via **`collab.flow.*` / `collab.group.*`** (id-derived — `GROUP_KEYS` map +
  a `labelOf` helper; the registry stays the English source); CollabList heading/subtitle/empty/start;
  CreateCollabDialog **template label + description** via `collab.template.<id>.{label,description}`. **35
  new `collab.*` keys → fr+sw.**
- **§3 — long-tail.** MandateDocument `formatRatifiedDate` threads `useI18n().locale` (was `'en-GB'`,
  matching sibling MandateCard); DiscussionFlow `formatTime(ts, locale)` (CommentItem → `useI18n`);
  `CommunityView.module.scss` `.demoPill` `#f59e0b`→`$warning` (exact) + `#1f1f1f`→`$gray-900` (AA ~9:1).
  **PipelineView confirmed still orphaned** — left intact for Ouri (flag, don't delete).
- **Verified:** `tsc -b` + `npm run build` exit 0; parity scan clean (838/838); live-walked en+fr+sw at
  360px — Start-Collab template cards, Add-tab groups, the demo-reset confirm Modal, DiscussionFlow
  timestamps ("14 juin 2026, 12:04") — zero `{token}` artifacts, zero console errors.

## How we work (non-negotiable — unchanged)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr/sw where strings changed.
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push.**
- Slow external drive: small sequential I/O. **`.module.scss` / `fr.ts` / `sw.ts` must be opened with Read
  before Edit** (the tool tracks per-file read state).
- **Env quirk that bit B12 — read this:** in some sessions the **Bash tool's stdout redacts identifiers/
  strings** (PascalCase names → `l`, `'gloki.x'` → `'no'`, etc.) while the **Read tool and `preview_eval`
  return correct content.** If `rg` output looks mangled, trust Bash only for file *paths / line numbers /
  counts* and use **Read** for code/value content. Also: `rg fileA && rg fileB && rg fileC`
  **short-circuits** when fileA has no match (rg exits 1) — use `;` or a single multi-file `rg` or you'll
  get false "key doesn't exist" reads.

## Demo facts (re-verified live in B12, save time)

- A prior session already left **seeded demo communities in localStorage** (`gloki_demo_*`,
  `gloki_demo_contracts`) — you usually don't need `/create-community`. Seed auth +
  `gloki.digitalAgent`/`gloki.onboarding`/`gloki.locale`, then read a community id out of
  `gloki_demo_contracts` and navigate straight to `/community/<id>/collab`. Working demo community used in
  B12: **`demo-comm-mqdm428q-q0vj0t69`** ("Demo Community", `isDemo` → has the demo menu).
- Seed shapes (from `digitalAgentStore.ts`): `localStorage.user = {publicKey:'a'×64,
  serverUrl:'https://gdi.gloki.contact'}`; `gloki.digitalAgent = {displayName,photo:'',country,
  languages:[],createdAt,vouchedBy:[]}`; `gloki.onboarding = {step:6,completed:true}`; `gloki.locale =
  'en'|'fr'|'sw'`.
- Switch locale live: `localStorage.setItem('gloki.locale','fr')` then navigate (I18nProvider reads it on
  mount). Artifact check per page: `document.body.innerText.match(/\{\w+\}/g)` → must be `null`.
- Preview emulates **dark** by default — pin with `preview_resize({colorScheme:'light'})`. The **community
  menu** (`role=dialog`) and the **confirm Modal** (`role=dialog[aria-modal]`) coexist — when scripting a
  click, pick the dialog that actually contains your target button, not the first match.
- **Reach the un-i18n'd screens:** JoinCommunity = `/identity/join` (Identity → Join). IdentityCardDialog =
  Community menu → "Identity & Trust" / a "Show identity card" affordance (it portals a dialog).

## i18n parity scanner (already written — re-run it)

`/tmp/i18ncheck_b12.mjs` (re-create if the tmp is gone): parses `'key': 'value'` and `'key': "value"`
single-line entries from `src/i18n/{en,fr,sw}.ts`, diffs the **fr↔sw** key sets, and compares `{var}` sets
per shared key. Run `node /tmp/i18ncheck_b12.mjs "$(pwd)"` → must print `RESULT: PARITY OK`. Keep fr and sw
**identical key sets with identical `{var}` tokens**; en stays the smaller foundation set (feature copy uses
inline English defaults).

---

## §1 — finish i18n on JoinCommunity + IdentityCardDialog (the real remaining gap)

B12 wired only the *alerts* in these two; both render **mostly English in every locale**. Wire the rest:

- **`components/identity/JoinCommunity.tsx`** (already imports `useT` after B12) — the intro line ("To join
  a community, ask a member to share their invite QR code or credential JSON…"), the QR/scan affordance
  labels, the success block ("You can now access the community from your Communities page."), the
  "Invalid QR Code Data" / "The scanned data doesn't contain valid community credentials." error card, and
  any button/placeholder literals. New `join.*` keys → fr+sw.
- **`components/community/dialogs/IdentityCardDialog.tsx`** (imports `useT` after B12) — the **"Identity
  Card"** `<h2>`, the **"Download Card" / "Generating…"** button, the **"Close"** button, and any card-body
  labels. It's a hand-rolled overlay (its own `styles.overlay`/`styles.dialog`, not the shared `Modal`) —
  **i18n only this batch**; a separate optional pass could migrate it onto the shared `Modal` (it would gain
  the focus trap), but don't conflate that with the string wiring. New `identityCard.*` keys → fr+sw.

Grep each for English string literals in JSX (`rg -n ">[A-Z][a-z].*<" src/components/identity/JoinCommunity.tsx`
is a rough start; eyeball the file). Artifact-check both screens live in fr/sw.

## §2 — the fr/sw native pass (owed since B10) + the confirmed grammar bug

The overlays are model-translated and a native review is owed. **Two tracks:**

1. **Fix the confirmed bug** (don't wait for the full review): `dashboard.readiness.upvotes.one` in fr reads
   `'Encore 1 vote pour nécessaire ({up}/{threshold})'` and `.many` `'Encore {remaining} votes pour
   nécessaires (…)'` — the **"pour" is spurious** and "nécessaires" mis-agrees. Should be `'Encore 1 vote
   nécessaire …'` / `'Encore {remaining} votes nécessaires …'`. Fix both fr keys (keep the `{var}` tokens
   identical to sw). While there, sanity-check the sibling `dashboard.readiness.*` strings.
2. **Broader native review (flag, don't churn a wave silently):** sw civic vocabulary
   (mpango/agizo/udhamini/ushirikiano consistency), fr inclusive forms (·e) and register. If Eston wants a
   real human pass, surface the candidate strings rather than rewriting hundreds unilaterally. The B12
   additions specifically to eyeball: `collab.flow.*`/`collab.group.*` (civic-ish), `collab.template.*`,
   `community.reset*`.

## §3 — standing optional leftovers (opportunistic, skip if tight)

- **Hand-rolled `<button>` → shared `Button`** (the long-standing W4 leftover): chat send/back, the
  onboarding `Stepper`, the merge-flow buttons, and now the **JoinCommunity** join button + **CollabList**
  `createBtn` / collab-item buttons + **IdentityCardDialog** download/close. Pure refactor — match variant/
  size; verify focus-visible + ≥44px survive. Quality-only; no behavior change.
- **PipelineView** (`components/collaboration/PipelineView.tsx`) — still orphaned (no importer). **Decide
  with Ouri:** delete, or re-wire into a route? B12's i18n on it is correct if revived. Don't delete blindly.
- **IdentityCardDialog → shared `Modal`** (optional, see §1) — would add the focus trap/Esc/restore the
  hand-rolled overlay lacks. Separate from the string wiring.

## Housekeeping

- **PR #20 / push** stay gated on Eston. If he green-lights: refresh the PR body + ahead-count (was 11 at
  B12 handback) and push `origin/ui` (auto-deploys to Pages).
- If you add key families, keep the en.ts header note true and fr/sw at full parity (re-run the scanner).

## Sizing + when done

One session. §1 (the two stragglers) + §2.1 (the grammar fix) are the substance; §2.2 is a flag; §3 is
optional. `tsc -b` + build green; en/fr/sw spot-walks of touched routes (JoinCommunity, IdentityCardDialog);
parity scan `RESULT: PARITY OK`; small local commits; **no push**. Hand back with shipped-vs-deferred + the
next-session prompt.
