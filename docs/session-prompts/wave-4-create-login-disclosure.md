# Wave 4 — Task-first create/login disclosure (the held #13/#15) + remaining kit/CTA + community-subroute h1

**Part of:** the hierarchy + accessibility redesign — see [`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md).
**Branch:** `ui` (deploys to GitHub Pages). **Waves 0, 1, 2 (a/b/c) and 3 (a/b/c) all shipped & live.**
**Prerequisite:** Eston has reviewed the deployed **Wave 3** build **and** is happy with the deployed `(i)→Modal` disclosure pattern (Currency / ApprovalFlow). The whole of 4a is gated on that — do **not** start it until he confirms.

---

## Read first (in order)
1. **[`docs/2026-06-20-hierarchy-a11y-pathways.md`](../2026-06-20-hierarchy-a11y-pathways.md)** — the plan + locked decisions. The Wave 4 surfaces are moves **#13** (CreateInitiative/CreateCommunity explainer prose), **#15** (Login explainer), **#8** (use-the-kit), **#5** (Discussion "Suggest an edit" CTA).
2. **`CLAUDE.md`** + **`DESIGN_SYSTEM.md`** — stack, the UI↔service seam rule, tokens, 360px + WCAG AA.
3. **Primitives to reuse (built in earlier waves — do NOT rebuild):** `src/components/shared/InfoDisclosure.tsx` (the `(i)`→Modal standard, tap-only, aria-expanded), `Button` (`size="lg"` = the thumb-zone primary), `Banner`, `CountryMultiSelect` (Wave 3a), `AppHeader`.

## Where Wave 3 left things (so you don't trip)
- **i18n architecture (important):** `en.ts` is a **partial override** (~74 keys); **`fr.ts` + `sw.ts` carry the full set (924 keys each, lockstep).** English resolves from the **inline default** in `t('key', 'English default', {vars})` — so every new `t()` call needs an inline English default, and every new key must be added to **both** `fr.ts` and `sw.ts` (identical key sets + identical `{var}` tokens) or fr/sw fall back to English. `Dictionary = Record<string,string>` — **not** a typed union, so adding keys needs **no** `types.ts` edit. Run the parity check (extract `^  '…':` keys from fr/sw, sort, `diff` → must be empty).
- **Country selection is done** — `CountryMultiSelect` (search over all 198 + removable chips + regional quick-picks) replaced the hardcoded chips. **Country names are canonical-English** (`countries.ts` has no locale form — `getCountryName(code)`); only chrome localizes. Don't re-touch.
- **IdentityView now has one `<h1>` per route** (communities/profile-srOnly/join/hidden + About/Contact). Don't add a second.
- **A separate task is already flagged** (chip `task_7d1861ab`, "Fix double-h1 on community sub-pages"): community-scoped sub-routes under `CommunityView` render the community name as the AppHeader `<h1>` **and** their own in-content `<h1>` (confirmed on `/community/:id/create-initiative` → 2 h1s). If that chip hasn't been done by the time you start, fold **4b** below in; if it has, skip 4b.
- **Proposals → Solutions is value-only done.** Key names (`nav.proposals`, `stage.proposals`, `mechanisms.*`), the stage-id/routes (`'proposals'`), and the Merge feature are deliberately unchanged. Do **not** re-run the rename.

## Locked decisions (do NOT relitigate)
- **Keep governance signals + inline participation VISIBLE** — the disclosure hides *prose only*, never sources, tallies, thresholds, the advance/participation meter, or inline vote/stake.
- **A compact read-only stage strip stays visible** on the create/login screens even after the explainer prose collapses behind the `(i)`.
- **Tokens only** — no ad-hoc hex/px/rgba. Prefer the kit (`Button`, `Modal`, `Banner`, `EmptyState`, `InfoDisclosure`, `CountryMultiSelect`).
- **Don't touch the seam** (`src/services/api.ts`) — presentational mockup, no server calls.
- **Accepted deviations — do NOT "fix":** `$primary` white-on-blue button fill (brand); `$gray-500` (not `$gray-400`) caption text.

---

## The Wave 4 moves (land as sub-batches; verify each at 360px light+dark, en/fr/sw, before its push)

### 4a — Task-first create / login disclosure (pathways #13 + #15) — the headline, gated on Eston
The restructure: **the form / identity is screen one.** The "what is a community / what is an initiative / the 5 stages" explainer **prose** collapses behind the existing `InfoDisclosure` `(i)`, and a **compact read-only stage strip stays visible**.

- **`src/pages/CreateInitiativePage.tsx`** — today it leads with three full explainer cards ("What is an initiative?", "The 5 Stages" stepper, "What Makes a Good Initiative?") *above* the form. Move the prose behind a `(i)` next to the page `<h1>`; keep a **compact, read-only stage strip** (the 5 stage circles/labels — NOT the long per-stage descriptions) visible so users keep the pipeline context. Form fields (incl. the new `CountryMultiSelect`) become the primary content.
- **`src/pages/CreateCommunityPage.tsx`** — same treatment for its onboarding/explainer prose: identity/form first, "what is a community" prose behind the `(i)`.
- **`LoginPage`** — its explainer/warm-up prose behind the `(i)`; the identity/login action is screen one.
- Reuse `InfoDisclosure` exactly (tap-only, translated aria-label, focus-trapped Modal). New strings → inline English default + fr/sw lockstep.
- **Confirm with Eston before building:** (1) he's happy with the deployed `(i)` pattern; (2) the exact compact stage-strip shape (icons+labels only? a one-line `Stepper`?); (3) all three surfaces in one wave, or split.

### 4b — Community sub-route single-`<h1>` (only if chip `task_7d1861ab` isn't already done)
Audit every community-scoped route under `CommunityView` for a double-`<h1>` (community name from AppHeader + in-content title). Per the locked Wave-1 rule (community name = the page's single `<h1>`), demote the offending in-content `<h1>` to `<h2>` (keep the SCSS class — title classes set their own size). Confirm exactly one `<h1>` per sub-route. Don't touch top-level routes (Home/Stage/Identity) or the published-mandate artifact page.

### 4c — Remaining "use the kit" (pathways #8)
- **Hand-rolled submit buttons → `Button`.** CreateInitiativePage's `.submitButton` and CreateCommunityPage's submit are hand-rolled `<button>`s with bespoke SCSS — swap to `<Button size="lg">` (thumb-zone primary). Pairs naturally with 4a (you're already in those files). Remove the orphaned SCSS.
- Only swap genuinely hand-rolled chrome that diverges from the kit — not a wholesale rewrite.

### 4d — Assess (don't force): Discussion "Suggest an edit" CTA prominence (pathways #5)
Currently `size="sm" variant="secondary"` by the statement heading. Look at the **whole DiscussionFlow layout** and decide whether to promote it to the thumb-zone primary, or leave it. Flag the recommendation; only change if the action hierarchy clearly supports it.

### Human-gated follow-up (not code — route it)
**fr/sw native-speaker review.** [`docs/i18n-native-review-candidates.md`](../i18n-native-review-candidates.md) now includes the Wave-3 additions — the **Swahili noun-class agreement** items (`communities.*`, `region.*`) and the **Suluhisho** caveat are the priority. Assign a native fr + native sw reviewer.

---

## Constraints (same as every wave)
- Mobile-first **360px**, light **and** dark; verify both. i18n **en/fr/sw parity** for every new/changed string (run the parity check; keep `{var}` tokens identical).
- **Tokens only**; prefer the kit. **Don't touch the seam.**
- **Production build runs `tsc -b`** (`noUnusedLocals`/`noUnusedParameters`) — must pass before any push; clean up every orphaned import/var/SCSS class/i18n key you create. (`tsc` does **not** catch orphaned i18n keys or SCSS classes — grep for those by hand, like Wave 3's cleanup did.)
- **Slow external USB drive** — small sequential file batches; avoid heavy parallel I/O. For bulk locale edits, a validated Python script that aborts on any non-unique match is safer + faster than dozens of Edits.

## Verification checklist (evidence before claiming done)
1. `npm run build` passes (`tsc -b` + vite, no errors).
2. 4a: on each create/login surface the form/identity is screen one; the explainer prose is behind the `(i)`→Modal; the compact stage strip is still visible; the `(i)` opens a focus-trapped Modal (aria-expanded flips). 360px light+dark, en/fr/sw.
3. 4b: exactly one `<h1>` per community sub-route (verify in the live DOM).
4. 4c: submit CTAs are `Button size="lg"`; no orphaned SCSS left.
5. fr/sw key-set parity (`diff` empty); no new console errors.

## Delivery
Land each sub-batch (4a → 4b → 4c, then the 4d assessment) as its own **verify → clean · commit · push** (deploys Pages); Eston reviews each on the deployed build. Commit subjects e.g. `feat(onboarding): Wave 4a — task-first create/login disclosure`. End every commit message with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## First move
Confirm the open decisions with Eston — **(1)** is he happy with the deployed Wave 3 build + the `(i)` disclosure pattern enough to roll it out to create/login (4a)? **(2)** the compact stage-strip shape; **(3)** all three create/login surfaces in one wave or split; **(4)** whether 4b (if not already done via the chip) and 4c fold into this wave — then execute 4a → 4b → 4c, verifying each at 360px light/dark en/fr/sw before its push.
