# Wave 5 (the redesign tail) — Discussion "Suggest an edit" CTA (#5) + StageStrip polish + route the fr/sw native review

**Part of:** the hierarchy + accessibility redesign — see [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md).
**Branch:** `ui` (deploys to GitHub Pages). **Waves 0, 1, 2 (a/b/c), 3 (a/b/c) and 4 (a/b/c) all shipped & live.**

This is the **small tail** that closes the redesign: the one remaining coding move (**#5** Discussion "Suggest an edit" CTA, which Wave 4 deliberately *assessed and flagged* rather than changed), two minor **StageStrip** polish items, the still-open **Login stage-strip** decision, and **routing the human-gated fr/sw native review**. After this, every move in the pathways doc (#5/#8/#13/#15) is shipped or resolved.

---

## Read first (in order)
1. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — move **#5 (Discussion stage)** is the headline. Note the locked rule: **keep governance signals + inline participation VISIBLE**; and Home **#10**'s warning — **no second bottom bar over the global StageFooter** (this is exactly why #5 is not a naive "thumb-zone bar").
2. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — the UI↔service seam rule, tokens, 360px + WCAG AA.
3. **The deployed Wave-4 build** — confirm Eston is happy with the task-first create/login disclosure + the new `StageStrip` before touching anything else.

## Where Wave 4 left things (so you don't trip)
- **`StageStrip`** ([`src/components/shared/StageStrip.tsx`](../../src/components/shared/StageStrip.tsx)) is the new shared read-only 5-stage pipeline (`<ol aria-label>`, canonical `STAGE_META` icons/labels, token-pure rainbow). It's on **both create screens**, **not on Login** (see 5c). Reuse it — don't rebuild.
- **i18n architecture (unchanged):** `en.ts` is a partial override (~74 keys); **`fr.ts` + `sw.ts` carry the full set, lockstep.** Every new `t()` needs an inline English default; every new key goes in **both** fr.ts and sw.ts with identical `{var}` tokens. Run the parity check (extract `^  '…':` keys from fr/sw, sort, `diff` → must be empty). `Dictionary = Record<string,string>` — no `types.ts` edit needed.
- **The Discussion CTA string already exists** — `deliberation.coauthor.suggest` ("Suggest an edit"), localized in fr/sw. A variant/size bump needs **no new keys**.

## Locked decisions (do NOT relitigate)
- **Keep governance signals + inline participation VISIBLE** (tallies, thresholds, the fold-in target, the advance/participation meter, the per-edit Support toggle — none of these get hidden).
- **No second bottom bar over the StageFooter.** Any "more prominent" CTA must coexist with the global footer, not stack a rival bottom bar.
- **Tokens only**; prefer the kit (`Button`, `Modal`, `Banner`, `EmptyState`, `InfoDisclosure`, `StageStrip`, `CountryMultiSelect`).
- **Don't touch the seam** (`src/services/api.ts`) — presentational mockup.
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue Button fill (brand); `$gray-500` (not `$gray-400`) caption text.

---

## The Wave 5 moves

### 5a — Discussion "Suggest an edit" CTA prominence (#5) — the headline
**File:** [`src/components/collaboration/flows/discussion/SharedStatement.tsx`](../../src/components/collaboration/flows/discussion/SharedStatement.tsx).

Today the CTA is `<Button size="sm" variant="secondary" leftIcon={<PenLine/>}>` in the statement **header** (line ~254), next to the "Our shared statement" `<h2>`. It is the stage's **primary contribution action** (you co-author by suggesting edits; supporting existing edits is the inline, per-card secondary action) — and `secondary` under-weights it.

**Wave-4 assessment (already done, recorded in memory `project_hierarchy_a11y_review_jun2026`):** the literal pathways phrasing "one thumb-zone 'Suggest an edit'" is **not cleanly supported** — a bottom-anchored bar would stack a second bottom bar over the global `StageFooter`. So the recommended, clearly-supported change is an **in-place emphasis bump**, not a bottom bar.

**Recommended (confirm with Eston before building):**
- **Bump `variant="secondary"` → `variant="primary"`** (optionally `size="sm"` → `"md"` for a ≥44px touch target). Keep it in the header, tied to the statement it edits.
- **Optionally** also surface a primary "Suggest an edit" action **inside the empty-edits `EmptyState`** (SharedStatement ~line 300 — currently "No open edits / Suggest a change to sharpen this statement together" with the button only up in the header). This closes the discoverability gap. Check whether `EmptyState` exposes an action slot; if not, decide whether it's worth adding one (small kit change) or leave the empty state copy-only.
- **Do NOT** add a sticky bottom-anchored bar (StageFooter collision).

**Ask Eston:** (1) just the `secondary→primary` (+`sm→md`) bump, (2) bump **plus** an EmptyState action, or (3) something else. Recommend (1) or (2).

**Verification is the real work here** — reaching the Discussion stage in the preview needs an initiative *in the discussion stage*:
- Auth offline by setting `localStorage.user = {publicKey:'a'.repeat(64), serverUrl:'https://gdi.gloki.contact'}` (the `ui` branch is demo-stub-backed).
- Either find a seeded demo initiative already in `discussion`, or create a demo community → start an initiative → advance it to the discussion stage. Document the exact path you used.
- Verify the CTA at **360px light + dark, en/fr/sw**; confirm the participation/advance meter, the fold-in-target hint, and the per-edit Support toggles all stay visible and unmoved. No new i18n keys expected (re-uses `deliberation.coauthor.suggest`).

### 5b — StageStrip polish (assess; only change if Eston wants it)
- **Label tightness:** at exactly 360px, "Discussion"/"Solutions" sit close (legible, not clipped). If Eston wants more air: a hair-smaller label, 2-line wrap, or marginally smaller circles. Low priority — don't change unless asked.
- **Shared aria-label:** the `StageStrip` `<ol>` reuses `nav.stagesLabel` ("Pipeline stages"), the same accessible name as the `StageFooter` `<nav>`. Different roles → **not a WCAG failure**, but if a distinct name is wanted, add one new key (e.g. `stage.pipelineOverview` = "The 5 governance stages") and pass it as the `ariaLabel` prop — fr/sw lockstep. Assess; don't force.

### 5c — Login stage-strip decision (OPEN — Eston's call)
Wave 4 deliberately **did not** add a `StageStrip` to `LoginPage` (it's pre-auth/pre-community — no pipeline context yet — and the login card's heavy `$spacing-3xl` padding crams 5 stages to ~230px at 360px). The locked-decision text literally said "create/**login** screens," so this is a flagged deviation.
- **If Eston wants it on Login:** add `<StageStrip />` between the header and the form in [`src/pages/LoginPage.tsx`](../../src/pages/LoginPage.tsx); you will likely need to **reduce the login card's mobile padding** so 5 labelled stages fit cleanly at 360px. Verify light+dark, en/fr/sw.
- **Default:** leave Login strip-less (recommended).

### Human-gated follow-up (route it — not code)
**fr/sw native-speaker review.** [`docs/i18n-native-review-candidates.md`](../i18n-native-review-candidates.md) should now cover the **3 new Wave-4 `howItWorks` strings** — verify they're listed, and add them if not:
- `initiative.howItWorks` — fr "Comment fonctionnent les initiatives" / sw "Jinsi mipango inavyofanya kazi"
- `createCommunity.howItWorks` — fr "Comment fonctionnent les communautés" / sw "Jinsi jumuiya zinavyofanya kazi"
- `login.help.title` — fr "Comment fonctionne Gloki" / sw "Jinsi Gloki inavyofanya kazi"

The **Swahili noun-class agreement** (`mipango inavyofanya`, `jumuiya zinavyofanya`) is the priority alongside the existing region/communities items and the **Suluhisho** caveat. Assign a native fr + native sw reviewer.

---

## Constraints (same as every wave)
- Mobile-first **360px**, light **and** dark; verify both. i18n **en/fr/sw parity** for every new/changed string (run the parity check; keep `{var}` tokens identical).
- **Tokens only**; prefer the kit. **Don't touch the seam.**
- **Production build runs `tsc -b`** (`noUnusedLocals`/`noUnusedParameters`) — must pass before any push; clean up every orphaned import/var/SCSS class/i18n key you create (`tsc` does **not** catch orphaned SCSS classes or i18n keys — grep them by hand).
- **Slow external USB drive** — small sequential file batches; avoid heavy parallel I/O.

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite, no errors).
2. 5a: the Discussion CTA reads at its new weight at 360px light+dark, en/fr/sw; participation meter + tallies + Support toggles unmoved and visible; document how you reached the discussion stage in the preview.
3. 5b/5c: only if changed — distinct aria-label / login strip fit at 360px verified in the live DOM.
4. fr/sw key-set parity (`diff` empty) if any key was added; no new console errors.

## Delivery
Land 5a as its own **verify → clean · commit · push** (deploys Pages); Eston reviews on the deployed build. 5b/5c only if Eston opts in. Commit subject e.g. `feat(discussion): Wave 5a — promote "Suggest an edit" to the stage's primary action`. End every commit message with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## First move
Confirm with Eston: **(1)** is he happy with the deployed Wave-4 build? **(2)** for 5a — the `secondary→primary` (+`sm→md`) bump, the bump **plus** an EmptyState action, or something else? **(3)** does he want 5b's distinct strip aria-label and/or 5c's Login strip, or leave both? Then execute 5a (→ 5b/5c if opted in), verifying each at 360px light/dark en/fr/sw before its push, and route the native review.
