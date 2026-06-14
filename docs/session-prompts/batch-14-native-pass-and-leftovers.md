# Session prompt — Batch 14: the owed fr/sw native pass + the standing leftovers (IdentityCardSVG credential, button consolidation, PipelineView)

Paste this whole file into a fresh Claude Code session on the `ui` branch. **Batch 13 is done** — the two
named i18n stragglers are fully wired (the whole **JoinCommunity** screen + the **IdentityCardDialog**
chrome), the confirmed **fr `dashboard.readiness` grammar bug** is fixed, and a third straggler found during
the live walk — the **IdentityTrust** "Identity & Trust" page itself (it was half-translated) — is now
finished. fr/sw sit at **859 keys each, zero `{var}` drift**, live-verified en+fr+sw at 360px. What's left is
the genuinely-deferred tail: the **fr/sw native-speaker pass** (owed since Batch 10 — model-translated
overlays that a human should review), one **explicit product decision** B13 scoped out with rationale (should
the *downloadable identity credential card* be localized?), and the standing optional refactors
(button-consolidation, PipelineView's fate, IdentityCardDialog → shared Modal). This is a polish/decision
batch — one relaxed session, and parts of it want Eston/Ouri input before code.

> Check `git log` first. At B13 handback `ui` was **14 commits ahead of origin/ui** (12 prior + `5703d10`,
> `f176025`, then this prompt doc → 15 once committed). **NOT pushed.** The push/PR decision is Eston's —
> do NOT push without his green light.

---

## What Batch 13 shipped (local commits `5703d10`, `f176025`, NOT pushed at handback)

- **§1 — JoinCommunity fully i18n'd.** Every screen literal through inline-default `t()`: the intro line,
  the scanner placeholder + "Scan QR Code", the Cancel button (→ `common.cancel`), all three join-button
  states (joining/resetting/cta), the Manual-Input heading + help line (the `<code>server</code>`/`agent`/
  `contract` field names stay literal; the "and" was dropped for a clean cross-language comma list), the
  credentials label, and the success + invalid-QR cards. **13 new `join.*` keys → fr+sw.**
- **§1 — IdentityCardDialog chrome i18n'd.** The `<h2>` title, the Download/Generating button, the Close
  button (→ `common.close`), and an `aria-label` on the icon-only ✕ close button. **3 new `identityCard.*`
  keys → fr+sw.** The dialog is still the hand-rolled overlay (not the shared `Modal`) — see §3.
- **§1+ — IdentityTrust stragglers finished (found during the live walk).** The page heading, intro
  paragraph, non-member notice, and the My ID Card / Scan Member / Share button labels were English in fr/sw
  even though the trust card was already localized. **5 new `identityTrust.*` keys → fr+sw**, reusing
  `common.share` + `common.loading`.
- **§2.1 — fr grammar bug fixed.** `dashboard.readiness.upvotes.one/.many` dropped the spurious "pour" and
  fixed the "nécessaire(s)" agreement (`Encore N vote(s) nécessaire(s) (…)`); sw was already correct. `{var}`
  tokens unchanged. Siblings sanity-checked (`dashboard.problem.tally` correctly keeps "votes pour/contre").
- **Verified:** `tsc -b` + `npm run build` exit 0 (×2); parity scan `RESULT: PARITY OK` (859/859, 0 key/var
  drift); live-walked JoinCommunity (en/fr/sw), IdentityCardDialog chrome (fr/sw), IdentityTrust (fr/sw) at
  360px light — zero `{token}` artifacts, no console errors.

## How we work (non-negotiable — unchanged)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only.
- Design system is law: tokens, AA, focus-visible, ≥44px, light+dark, 360px. `$primary` #3b82f6 stays.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr/sw where strings changed.
- Small local commits, `Co-Authored-By:` Claude trailer. **Do NOT push.**
- Slow external drive: small sequential I/O. **`.module.scss` / `fr.ts` / `sw.ts` must be opened with Read
  before Edit** (the tool tracks per-file read state).
- **Env quirks that bit B12/B13 — read these:**
  - In some sessions the **Bash tool's stdout redacts identifiers/strings** (PascalCase → `l`, `'gloki.x'`
    → `'no'`) while the **Read tool and `preview_eval`** return correct content. If `rg` output looks
    mangled, trust Bash only for *paths / line numbers / counts* and use **Read** for code/value content.
  - `rg fileA && rg fileB` **short-circuits** when fileA has no match — use `;` or one multi-file `rg`.
  - **`preview_eval` returning `{}`** for a raw object literal is a serializer quirk (mixed null/undefined/
    array values). Wrap the return in `JSON.stringify({...})` and it's reliable. Also: the **first eval
    right after a `location.href` reload** can fire mid-navigation and return `{}` — just re-run it.

## Demo facts (re-verified live in B13, save time)

- A prior session already left **seeded demo communities in localStorage** (`gloki_demo_*`). Seed auth +
  `gloki.digitalAgent`/`gloki.onboarding`/`gloki.locale`, then navigate straight to a route.
- Seed shapes: `localStorage.user = {publicKey:'a'×64, serverUrl:'https://gdi.gloki.contact'}`;
  `gloki.digitalAgent = {displayName,photo:'',country,languages:[],createdAt,vouchedBy:[]}`;
  `gloki.onboarding = {step:6,completed:true}`; `gloki.locale = 'en'|'fr'|'sw'`.
- Switch locale live: `localStorage.setItem('gloki.locale','fr')` then navigate (I18nProvider reads it on
  mount). Artifact check per page: `document.body.innerText.match(/\{\w+\}/g)` → must be `null`.
- Preview emulates **dark** by default — pin with `preview_resize({colorScheme:'light'})`.
- **Reach the screens:** JoinCommunity = `/identity/join`. IdentityTrust + IdentityCardDialog =
  `/community/<id>/identity` (working community `demo-comm-mqdm428q-q0vj0t69`), then click the first
  `button[class*="trustBtn"]` ("My ID Card") to open the lazy dialog (it needs a beat to load its chunk —
  click, then `preview_screenshot`).

## i18n parity scanner (already written — re-run it)

`/tmp/i18ncheck_b12.mjs` (re-create if the tmp is gone): parses `'key': 'value'` / `"value"` single-line
entries from `src/i18n/{en,fr,sw}.ts`, diffs fr↔sw key sets, and compares `{var}` sets per shared key. Run
`node /tmp/i18ncheck_b12.mjs "$(pwd)"` → must print `RESULT: PARITY OK`. Keep fr and sw **identical key sets
with identical `{var}` tokens**; en stays the smaller foundation set (feature copy uses inline English
defaults, resolved via the `active → en → inline default → key` fallback in `src/i18n/index.tsx`).

---

## §1 — DECISION: localize the downloadable IdentityCard credential (`IdentityCardSVG.tsx`)?

B13's prompt asked for "any card-body labels" on IdentityCardDialog. The dialog *chrome* is done; the
**credential card itself** (`components/community/dialogs/IdentityCardSVG.tsx`) was **deliberately left in
canonical English** — this needs an Eston call, not a blind string swap. Why:

- The card is a downloadable artifact (rendered to PDF via `IdentityCardPDFGenerator`). There's a real
  product question: should a *credential* localize to the viewer's UI locale, or stay canonical like a
  passport? (For a UI-only demo, "localize to match the UI" is defensible — but it's a choice.)
- It is **not** a clean swap. The labels are a **sentence fragmented around canvas-rendered data images** at
  **fixed x/y positions**: `"This certifies that"` + ⟨name PNG⟩ + `"is an authenticated member of"` +
  ⟨community PNG⟩, plus `"AUTHENTICATED IDENTITY CARD"`, a two-`<tspan>` `"Authenticated / member"`, and
  `"ID:"`. Word order differs per language, and the fixed widths already clip in **English** ("Unknown
  Memb…" runs under the QR box — visible in B13's screenshots). Longer fr/sw strings make it worse.
- **If we localize it:** it's a small layout redesign (reflow the certify sentence, let labels auto-size
  like the name/community PNGs already do), then `t()` the labels and add `identityCardSvg.*` keys to fr/sw.
  Also localize the `"Unknown Member"` / `"Unknown"` data fallbacks in `IdentityCardDialog.tsx` (kept
  English in B13 so they stay coherent with the English card).
- **If we keep it canonical:** add a one-line code comment saying so, and we're done — close this item.

**Ask Eston which way before coding.**

## §2 — the fr/sw native-speaker pass (owed since B10 — flag + surface, don't churn)

The overlays are model-translated; a human pass is owed. **Do NOT silently rewrite hundreds of strings.**
Surface candidates and let Eston decide appetite / route to a native reviewer. Concrete checklist for the
reviewer (or for a *scoped* fix wave if Eston green-lights specifics):

- **sw civic-vocabulary consistency** — confirm one term per concept across all `*.ts` usages:
  *mpango* (initiative/plan), *agizo* (mandate/order), *udhamini* (vouching/sponsorship), *ushirikiano*
  (collaboration), *kura* (vote), *pendekezo* (proposal). Grep each and eyeball for drift.
- **fr register + inclusive forms** — decide a house style on inclusive writing (e.g. `membre·s`,
  `vérifié·e`) and apply consistently, and check formality (tu/vous — currently vous).
- **B12/B13 additions specifically** (newest, least-reviewed): `collab.flow.*` / `collab.group.*` (civic-ish
  labels), `collab.template.*`, `community.reset*`, and B13's `join.*`, `identityCard.*`, `identityTrust.*`.
  Spot-translations to sanity-check: fr `join.scannerPlaceholder` ("Espace réservé…" — faithful but clunky;
  a native might prefer shorter), sw `join.manualTitle` "Kuweka kwa mikono", fr/sw `identityTrust.intro`
  (long civic paragraph).
- If Eston wants a deliverable for an external reviewer, generate a **scoped** candidate doc
  (`docs/i18n-native-review-candidates.md`) — families + current strings + the concern per family — rather
  than dumping all 859 keys.

## §3 — standing optional leftovers (opportunistic, skip if tight / needs decisions)

- **Hand-rolled `<button>` → shared `Button`** (long-standing W4 leftover): chat send/back, the onboarding
  `Stepper`, the merge-flow buttons, JoinCommunity's join button (note its spinner+text loading states),
  CollabList `createBtn` / collab-item buttons, IdentityCardDialog download/close, and now IdentityTrust's
  three `trustBtn`s. Pure refactor — match variant/size; **verify focus-visible + ≥44px survive** and
  loading/spinner layouts don't break. Quality-only; do it as one focused wave, not piecemeal (a partial
  pass leaves the surface inconsistent).
- **PipelineView** (`components/collaboration/PipelineView.tsx`) — **still orphaned** (no importer; confirmed
  through B13). **Decide with Ouri:** delete, or re-wire into a route? Its i18n is already correct if revived.
  Don't delete blindly.
- **IdentityCardDialog → shared `Modal`** (optional) — would add the focus trap / Esc / focus-restore the
  hand-rolled overlay lacks (the shared `Modal` already does all three). Separate from string wiring; do it
  with the button-consolidation wave if that runs.

## Housekeeping

- **PR #20 / push** stay gated on Eston. If he green-lights: refresh the PR body + ahead-count (15 once this
  doc is committed) and push `origin/ui` (auto-deploys to Pages).
- If you add key families, keep the en.ts header note true and fr/sw at full parity (re-run the scanner).

## Sizing + when done

One relaxed session, but front-loaded with **decisions**: get Eston's call on §1 (credential localization)
and the §3 PipelineView fate before coding those. §2 is a flag unless Eston scopes a specific wave. Whatever
you do touch: `tsc -b` + build green; en/fr/sw spot-walks of touched routes; parity scan `RESULT: PARITY OK`;
small local commits; **no push**. Hand back with shipped-vs-deferred + the next-session prompt.
